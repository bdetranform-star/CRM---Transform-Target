import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendContactChatMessageSchema } from "@/lib/validations";
import { buildContactContext } from "@/lib/contact-ai-context";
import { describeAnthropicError, type AnthropicChatMessage } from "@/lib/anthropic";
import Anthropic from "@anthropic-ai/sdk";

const CHAT_SYSTEM_PROMPT_PREFIX = `You are a sales assistant embedded in a B2B cold-outreach CRM for the
Facility Maintenance / IFM industry, answering questions about ONE specific
contact. Only use the contact information provided below — you have no
access to any other contact's data. Answer conversationally and concisely.
Do not use markdown formatting — plain prose only.

`;

// A distinguishable marker appended if the stream fails partway through,
// so the client can tell "the model said this" from "the request broke".
const STREAM_ERROR_MARKER = "[[STREAM_ERROR:";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = sendContactChatMessageSchema.safeParse({ contactId: id, question: body?.question });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { contactId, question } = parsed.data;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "The Anthropic API key is missing or invalid. Check ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }

  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  const [touches, priorMessages] = await Promise.all([
    prisma.touch.findMany({ where: { contactId }, orderBy: { createdAt: "asc" } }),
    prisma.contactChatMessage.findMany({ where: { contactId }, orderBy: { createdAt: "asc" } }),
  ]);

  await prisma.contactChatMessage.create({
    data: { contactId, role: "USER", content: question },
  });

  const context = buildContactContext(contact, touches);
  const conversation: AnthropicChatMessage[] = [
    ...priorMessages.map((m) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    { role: "user", content: question },
  ];

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const encoder = new TextEncoder();
  let accumulated = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: CHAT_SYSTEM_PROMPT_PREFIX + context,
          messages: conversation,
        });

        anthropicStream.on("text", (delta) => {
          accumulated += delta;
          controller.enqueue(encoder.encode(delta));
        });

        await anthropicStream.finalMessage();
        controller.close();
      } catch (err) {
        const message = describeAnthropicError(err);
        controller.enqueue(encoder.encode(`\n\n${STREAM_ERROR_MARKER}${message}]]`));
        controller.close();
      } finally {
        // Persist whatever text we got, even on a mid-stream failure, so the
        // conversation isn't silently missing the assistant's turn.
        if (accumulated.trim()) {
          await prisma.contactChatMessage.create({
            data: { contactId, role: "ASSISTANT", content: accumulated },
          });
        }
      }
    },
  });

  return new NextResponse(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
