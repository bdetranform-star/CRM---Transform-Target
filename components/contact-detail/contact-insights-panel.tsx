"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, Send } from "lucide-react";
import type { Contact, ContactChatMessage } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { generateContactInsights } from "@/app/actions/contact-insights";

type ChatBubble = { role: "user" | "assistant"; content: string };

const STREAM_ERROR_PATTERN = /\[\[STREAM_ERROR:([\s\S]*?)\]\]/;

function ContactChat({ contactId, initialMessages }: { contactId: string; initialMessages: ContactChatMessage[] }) {
  const [messages, setMessages] = useState<ChatBubble[]>(
    initialMessages.map((m) => ({ role: m.role === "USER" ? "user" : "assistant", content: m.content }))
  );
  const [question, setQuestion] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const ask = useCallback(
    async (text: string) => {
      setError(null);
      setLastQuestion(text);
      setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
      setStreaming(true);

      try {
        const res = await fetch(`/api/contacts/${contactId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text }),
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to get a response.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        let streamError: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const match = chunk.match(STREAM_ERROR_PATTERN);
          if (match) {
            full += chunk.slice(0, match.index);
            streamError = match[1];
          } else {
            full += chunk;
          }
          const textSoFar = full;
          setMessages((m) => {
            const next = [...m];
            next[next.length - 1] = { role: "assistant", content: textSoFar };
            return next;
          });
        }

        if (streamError) setError(streamError);
        else setLastQuestion(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to get a response.");
        setMessages((m) => m.slice(0, -1));
      } finally {
        setStreaming(false);
      }
    },
    [contactId]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = question.trim();
    if (!text || streaming) return;
    setQuestion("");
    ask(text);
  }

  return (
    <div className="border-t border-border p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question"
          disabled={streaming}
        />
        <Button type="submit" size="icon" disabled={streaming || !question.trim()}>
          <Send className="size-4" />
        </Button>
      </form>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
          <span>{error}</span>
          {lastQuestion && (
            <button
              type="button"
              className="font-medium underline"
              onClick={() => ask(lastQuestion)}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {messages.length > 0 && (
        <div ref={scrollRef} className="mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                m.role === "user"
                  ? "ml-auto bg-secondary text-secondary-foreground"
                  : "bg-[var(--brand)]/15 text-foreground"
              )}
            >
              {m.content || (streaming && i === messages.length - 1 ? (
                <span className="text-muted-foreground">Thinking...</span>
              ) : (
                ""
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ContactInsightsPanel({
  contact,
  initialChatMessages,
}: {
  contact: Contact;
  initialChatMessages: ContactChatMessage[];
}) {
  const [summary, setSummary] = useState(contact.aiInsightsSummary);
  const [generatedAt, setGeneratedAt] = useState(contact.aiInsightsGeneratedAt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoGenerated = useRef(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await generateContactInsights({ contactId: contact.id });
    if (result.success) {
      setSummary(result.summary);
      setGeneratedAt(result.generatedAt);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [contact.id]);

  useEffect(() => {
    if (!summary && !autoGenerated.current) {
      autoGenerated.current = true;
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm">Contact insights</CardTitle>
        <Button variant="ghost" size="sm" onClick={generate} disabled={loading}>
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Regenerate
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !summary && <p className="text-sm text-muted-foreground">Generating insights...</p>}

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <p>{error}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={generate} disabled={loading}>
              Retry
            </Button>
          </div>
        )}

        {!error && summary && (
          <>
            <p className="whitespace-pre-wrap text-sm">{summary}</p>
            {generatedAt && (
              <p className="mt-2 text-xs text-muted-foreground">
                Insights generated {formatDistanceToNow(new Date(generatedAt), { addSuffix: true })}
              </p>
            )}
          </>
        )}

        {!error && !loading && !summary && (
          <p className="text-sm text-muted-foreground">No insights yet.</p>
        )}
      </CardContent>

      <ContactChat contactId={contact.id} initialMessages={initialChatMessages} />
    </Card>
  );
}
