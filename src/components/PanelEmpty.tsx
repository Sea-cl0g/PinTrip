import { CalendarDays, MapPin, SquarePen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";

type MapDetailEmptyProps = {
  onCreatePost?: () => void;
  onCreatePlan?: () => void;
};

export function MapDetailEmpty({ onCreatePost, onCreatePlan }: MapDetailEmptyProps) {
  return (
    <Empty className="min-h-full p-6">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-primary/10 text-primary">
          <MapPin aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>地図のピンを選択</EmptyTitle>
        <EmptyDescription>地図のピンを選択すると、ここに投稿の詳細が表示されます。</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
          <Separator className="min-w-0 flex-1" />
          <span className="shrink-0">または</span>
          <Separator className="min-w-0 flex-1" />
        </div>
        <Button variant="default" className="w-full" disabled={!onCreatePost} onClick={onCreatePost}>
          <SquarePen aria-hidden="true" />
          新しい投稿を作成
        </Button>
        <Button variant="outline" className="w-full" disabled={!onCreatePlan} onClick={onCreatePlan}>
          <CalendarDays aria-hidden="true" />
          旅行計画を作成
        </Button>
      </EmptyContent>
    </Empty>
  );
}
