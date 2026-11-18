import type { ReactNode } from "react";
import { CalendarDays, MapPin, SquarePen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";

type MapDetailPanelProps = {
  children?: ReactNode;
  onCreatePost?: () => void;
  onCreatePlan?: () => void;
};

export function MapDetailPanel({ children, onCreatePost, onCreatePlan }: MapDetailPanelProps) {
  return (
    <aside aria-label="投稿詳細" className="min-h-0 overflow-auto rounded-2xl border bg-card shadow-sm">
      {children ?? (
        <Empty className="min-h-full justify-center gap-5 px-4 py-5 md:px-4 md:py-6">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-12 rounded-2xl bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200">
              <MapPin className="size-6" aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle className="text-base">地図のピンを選択</EmptyTitle>
            <EmptyDescription className="text-sm">地図のピンを選択すると、ここに投稿の詳細が表示されます。</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="gap-2">
            <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
              <Separator className="min-w-0 flex-1" />
              <span className="shrink-0">または</span>
              <Separator className="min-w-0 flex-1" />
            </div>
            <Button variant="outline" className="w-full rounded-xl border-teal-700/30 text-teal-800 disabled:opacity-75 dark:text-teal-200" disabled={!onCreatePost} onClick={onCreatePost}>
              <SquarePen aria-hidden="true" />
              新しい投稿を作成
            </Button>
            <Button variant="outline" className="w-full rounded-xl border-teal-700/30 text-teal-800 disabled:opacity-75 dark:text-teal-200" disabled={!onCreatePlan} onClick={onCreatePlan}>
              <CalendarDays aria-hidden="true" />
              旅行計画を作成
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </aside>
  );
}
