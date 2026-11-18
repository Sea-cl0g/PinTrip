import type { ReactNode } from "react";

import mapImage from "@/images/map-placeholder.png";

type MapWorkspaceProps = {
  map?: ReactNode;
  children: ReactNode;
};

export function MapWorkspace({
  map = <img src={mapImage} alt="地図のプレビュー" className="size-full object-cover" />,
  children,
}: MapWorkspaceProps) {
  return (
    <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,15rem)] gap-2 px-2 pb-2 md:grid-cols-[minmax(0,1fr)_17rem] md:grid-rows-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-label="地図" className="relative min-h-0 min-w-0 overflow-hidden rounded-2xl border bg-muted">
        {map}
      </section>
      {children}
    </div>
  );
}
