"use client";

import type { ChannelTag } from "@prisma/client";

import { cn } from "@/lib/utils";
import { CHANNEL_TAG_CONFIG, CHANNEL_TAG_ORDER } from "@/lib/channel-tags";

/**
 * Pill/chip toggle group for the Channel Tag multi-select — each button is
 * independently toggleable (not a single-select), filled with its channel's
 * color when active, plain outline/gray otherwise.
 */
export function ChannelTagToggleGroup({
  value,
  onChange,
  className,
}: {
  value: ChannelTag[];
  onChange: (next: ChannelTag[]) => void;
  className?: string;
}) {
  function toggle(tag: ChannelTag) {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]);
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {CHANNEL_TAG_ORDER.map((tag) => {
        const config = CHANNEL_TAG_CONFIG[tag];
        const Icon = config.icon;
        const active = value.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(tag)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active ? "border-transparent" : "border-input bg-transparent text-muted-foreground hover:bg-secondary"
            )}
            style={active ? { backgroundColor: config.bg, color: config.fg } : undefined}
          >
            <Icon className="size-3.5" />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}

/** Read-only mini badges for a contact's Channel Tags — table cells, board cards, detail page. */
export function ChannelTagBadges({
  tags,
  className,
}: {
  tags: ChannelTag[];
  className?: string;
}) {
  if (tags.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {tags.map((tag) => {
        const config = CHANNEL_TAG_CONFIG[tag];
        return (
          <span
            key={tag}
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap"
            style={{ backgroundColor: config.bg, color: config.fg }}
          >
            {config.label}
          </span>
        );
      })}
    </div>
  );
}
