"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SAVED_VIEWS, type SavedView } from "@/lib/saved-views";
import {
  getCustomViews,
  saveCustomView,
  removeCustomView,
  type CustomView,
} from "@/lib/saved-views-storage";

const PRESET_TABS: { view: SavedView; label: string }[] = [
  { view: SAVED_VIEWS.ALL, label: "All contacts" },
  { view: SAVED_VIEWS.OPEN_OPPORTUNITIES, label: "Open opportunities" },
  { view: SAVED_VIEWS.NEED_FOLLOW_UP, label: "Need follow up" },
  { view: SAVED_VIEWS.INITIAL_CONVERSATION, label: "Initial conversation in progress" },
];

export function SavedViewTabs({
  viewCounts,
}: {
  viewCounts: Record<SavedView, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [customViews, setCustomViews] = useState<CustomView[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState("");

  useEffect(() => {
    setCustomViews(getCustomViews());
  }, []);

  const activeView = searchParams.get("view") ?? SAVED_VIEWS.ALL;
  const activeCustomId = searchParams.get("customView");

  function goToPresetView(view: SavedView) {
    const next = new URLSearchParams();
    if (view !== SAVED_VIEWS.ALL) next.set("view", view);
    router.push(`${pathname}?${next.toString()}`);
  }

  function goToCustomView(view: CustomView) {
    const next = new URLSearchParams(view.queryString);
    next.set("customView", view.id);
    router.push(`${pathname}?${next.toString()}`);
  }

  function handleSaveView() {
    if (!newViewName.trim()) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("page");
    next.delete("customView");
    const updated = saveCustomView(newViewName.trim(), next.toString());
    setCustomViews(updated);
    setSaveDialogOpen(false);
    setNewViewName("");
    toast.success("View saved");
  }

  function handleRemoveCustomView(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Remove this saved view?")) return;
    setCustomViews(removeCustomView(id));
    if (activeCustomId === id) goToPresetView(SAVED_VIEWS.ALL);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-1 border-b border-border">
        {PRESET_TABS.map((tab) => {
          const isActive = !activeCustomId && activeView === tab.view;
          return (
            <button
              key={tab.view}
              onClick={() => goToPresetView(tab.view)}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-[var(--accent-teal)] text-[var(--accent-teal)]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-xs">
                {viewCounts[tab.view] ?? 0}
              </span>
            </button>
          );
        })}
        {customViews.map((view) => (
          <button
            key={view.id}
            onClick={() => goToCustomView(view)}
            className={cn(
              "group flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              activeCustomId === view.id
                ? "border-[var(--accent-teal)] text-[var(--accent-teal)]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {view.name}
            <X
              className="size-3.5 opacity-0 group-hover:opacity-100"
              onClick={(e) => handleRemoveCustomView(view.id, e)}
            />
          </button>
        ))}
        <button
          onClick={() => setSaveDialogOpen(true)}
          className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          title="Save current filters as a view"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save current view</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label>View name</Label>
            <Input
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="e.g. My hot leads"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveView}>Save view</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
