"use server";

import { put, del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function revalidateContactViews(contactId: string) {
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/contacts");
  revalidatePath("/");
}

function describeBlobError(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (message.toLowerCase().includes("token")) {
    return "Photo storage isn't configured (missing BLOB_READ_WRITE_TOKEN).";
  }
  return "Couldn't upload the photo. Please try again.";
}

export async function uploadContactAvatar(
  formData: FormData
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  await requireAuth();

  const contactId = z.string().uuid().safeParse(formData.get("contactId"));
  if (!contactId.success) {
    return { success: false, error: "Invalid contact." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No file provided." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Only JPG, PNG, or WEBP images are supported." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { success: false, error: "Image must be 5MB or smaller." };
  }

  const id = contactId.data;
  const ext = file.name.includes(".") ? file.name.split(".").pop() : file.type.split("/")[1];
  const path = `avatars/${id}-${Date.now()}.${ext || "jpg"}`;

  try {
    const existing = await prisma.contact.findUnique({ where: { id }, select: { avatarUrl: true } });
    const blob = await put(path, file, { access: "public" });

    await prisma.contact.update({ where: { id }, data: { avatarUrl: blob.url } });

    if (existing?.avatarUrl) {
      // Best-effort cleanup of the replaced photo — a failure here shouldn't
      // block the update the user is actually waiting on.
      await del(existing.avatarUrl).catch(() => {});
    }

    revalidateContactViews(id);
    return { success: true, url: blob.url };
  } catch (err) {
    return { success: false, error: describeBlobError(err) };
  }
}

export async function removeContactAvatar(contactId: unknown) {
  await requireAuth();
  const id = z.string().uuid().parse(contactId);

  const existing = await prisma.contact.findUnique({ where: { id }, select: { avatarUrl: true } });
  await prisma.contact.update({ where: { id }, data: { avatarUrl: null } });

  if (existing?.avatarUrl) {
    await del(existing.avatarUrl).catch(() => {});
  }

  revalidateContactViews(id);
}
