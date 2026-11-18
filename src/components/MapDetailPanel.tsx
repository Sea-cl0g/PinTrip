import type { ReactNode } from "react";

type MapDetailPanelProps = {
  children: ReactNode;
};

export function MapDetailPanel({ children }: MapDetailPanelProps) {
  return (
    <aside aria-label="投稿詳細" className="min-h-0 overflow-auto rounded-2xl border bg-card shadow-sm">
      {children}
    </aside>
  );
}
