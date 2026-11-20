import type { ReactNode } from "react";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import mapImage from "@/images/map-placeholder.png";

type MapWorkspaceProps = {
  map?: ReactNode;
  children: ReactNode;
};

export function MapWorkspace({
  map = <img src={mapImage} alt="地図のプレビュー" className="size-full object-cover" />,
  children,
}: MapWorkspaceProps) {
  const isMobile = useIsMobile();

  return (
    <ResizablePanelGroup
      orientation={isMobile ? "vertical" : "horizontal"}
      className="min-h-0 flex-1 px-2 pb-2"
    >
      <ResizablePanel id="map">
        <section aria-label="地図" className="relative size-full overflow-hidden rounded-2xl border bg-muted">
          {map}
        </section>
      </ResizablePanel>
      <ResizableHandle
        aria-label="詳細パネルの幅を調整"
        withHandle
        disabled={isMobile}
        className="invisible shrink-0 rounded-sm aria-[orientation=horizontal]:h-2 md:visible md:w-2 md:bg-transparent md:hover:bg-accent md:[&>div]:bg-muted-foreground"
      />
      <ResizablePanel
        id="detail"
        defaultSize={isMobile ? "15rem" : "14rem"}
        minSize={isMobile ? "0%" : "14rem"}
        maxSize={isMobile ? "65%" : "60%"}
        groupResizeBehavior="preserve-pixel-size"
      >
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
