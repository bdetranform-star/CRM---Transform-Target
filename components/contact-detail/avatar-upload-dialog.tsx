"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ContactAvatar } from "@/components/contact-avatar";
import { uploadContactAvatar, removeContactAvatar } from "@/app/actions/contact-avatar";
import { cn } from "@/lib/utils";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function AvatarUploadDialog({
  contactId,
  firstName,
  lastName,
  currentAvatarUrl,
  open,
  onOpenChange,
  onChanged,
}: {
  contactId: string;
  firstName: string;
  lastName: string | null;
  currentAvatarUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setPreviewUrl(null);
    setDragActive(false);
  }

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function validateAndSet(candidate: File) {
    if (!ALLOWED_TYPES.includes(candidate.type)) {
      toast.error("Only JPG, PNG, or WEBP images are supported.");
      return;
    }
    if (candidate.size > MAX_SIZE_BYTES) {
      toast.error("Image must be 5MB or smaller.");
      return;
    }
    setFile(candidate);
    setPreviewUrl(URL.createObjectURL(candidate));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSet(dropped);
  }

  async function handleUpload() {
    if (!file) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("contactId", contactId);
      formData.set("file", file);
      const result = await uploadContactAvatar(formData);
      if (result.success) {
        toast.success("Photo updated");
        onChanged();
        handleClose(false);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove() {
    setSubmitting(true);
    try {
      await removeContactAvatar(contactId);
      toast.success("Photo removed");
      onChanged();
      handleClose(false);
    } catch {
      toast.error("Failed to remove photo");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact photo</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {previewUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview, not a remote asset next/image can optimize */}
              <img src={previewUrl} alt="Preview" className="size-32 rounded-full object-cover" />
              <button
                type="button"
                onClick={reset}
                className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full border border-border bg-white shadow"
                aria-label="Clear selection"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <ContactAvatar firstName={firstName} lastName={lastName} avatarUrl={currentAvatarUrl} size={96} />
          )}

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground transition-colors",
              dragActive ? "border-[var(--accent-teal)] bg-secondary/50" : "border-border"
            )}
          >
            <UploadCloud className="size-5" />
            <span>Drag and drop an image, or click to choose a file</span>
            <span className="text-xs">JPG, PNG, or WEBP · up to 5MB</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const chosen = e.target.files?.[0];
                if (chosen) validateAndSet(chosen);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <DialogFooter className="flex-row justify-between">
          {currentAvatarUrl ? (
            <Button type="button" variant="ghost" onClick={handleRemove} disabled={submitting}>
              Remove photo
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleUpload} disabled={!file || submitting}>
              {submitting ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
