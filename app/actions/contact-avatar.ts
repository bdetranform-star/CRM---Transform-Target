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

/**
 * @vercel/blob's `put()` throws a plain Error mentioning "token" when
 * BLOB_READ_WRITE_TOKEN isn't set (see its "No read-write token found..."
 * message) — that's the only signal available to distinguish "storage isn't
 * configured yet" from any other upload failure, so detection is necessarily
 * a substring check rather than a typed error class. The user-facing message
 * deliberately doesn't mention the env var name; that belongs in the admin's
 * lap, not the end user's.
 */
function describeBlobError(err: unknown): { message: string; notConfigured: boolean } {
  const raw = err instanceof Error ? err.message : "";
  if (raw.toLowerCase().includes("token")) {
    return { message: "Photo upload isn't set up yet — contact your admin.", notConfigured: true };
  }
  return { message: "Couldn't upload the photo. Please try again.", notConfigured: false };
}

export async function uploadContactAvatar(
  formData: FormData
): Promise<
  { success: true; url: string } | { success: false; error: string; notConfigured?: boolean }
> {
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
    const { message, notConfigured } = describeBlobError(err);
    return { success: false, error: message, notConfigured };
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
