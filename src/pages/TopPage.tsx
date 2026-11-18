import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { Bell, CircleHelp, Search, SlidersHorizontal } from "lucide-react";

import { MapDetailPanel } from "@/components/MapDetailPanel";
import { TopSidebar, topViews, type HomeView } from "@/components/TopSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import mapImage from "@/images/map-placeholder.png";

type TopPageProps = {
  map?: ReactNode;
  pins?: ReactNode;
  plans?: ReactNode;
  detail?: ReactNode;
  onSearch?: (query: string) => void;
  onViewChange?: (view: HomeView) => void;
  onCreatePost?: () => void;
  onCreatePlan?: () => void;
};

const sidebarSizes = {
  "--sidebar-width": "13rem",
} as CSSProperties;

function MobileMenuTrigger() {
  const { openMobile } = useSidebar();
  return <SidebarTrigger className="md:hidden" aria-label="メニューを開く" aria-expanded={openMobile} />;
}

export default function TopPage({
  map = <img src={mapImage} alt="地図のプレビュー" className="size-full object-cover" />,
  pins,
  plans,
  detail,
  onSearch,
  onViewChange,
  onCreatePost,
  onCreatePlan,
}: TopPageProps) {
  const [view, setView] = useState<HomeView>("map");
  const [query, setQuery] = useState("");
  const title = topViews.find((item) => item.id === view)!.label;

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch?.(query.trim());
  }

  function selectView(nextView: HomeView) {
    setView(nextView);
    onViewChange?.(nextView);
  }

  return (
    <TooltipProvider>
      <SidebarProvider
        style={sidebarSizes}
        className="h-dvh min-h-0 overflow-hidden bg-background [&_[data-slot=sidebar-gap]]:hidden"
      >
        <TopSidebar view={view} onViewChange={selectView} onCreatePost={onCreatePost} />
        <main aria-label={title} className="flex min-w-0 flex-1 flex-col md:ml-(--sidebar-width-icon)">
          <header className="flex h-16 shrink-0 items-center gap-2 px-3 md:gap-3 md:pr-5 md:pl-[calc(var(--sidebar-width)-var(--sidebar-width-icon)+1rem)]">
            <MobileMenuTrigger />
            {view === "map" ? (
              <>
                <form role="search" onSubmit={search} className="relative w-full min-w-0 max-w-lg">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    type="search"
                    aria-label="投稿本文・ハッシュタグを検索"
                    placeholder="本文・ハッシュタグで検索"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="h-10 border-border bg-card pl-9 shadow-sm"
                  />
                </form>
                <Button variant="outline" aria-label="絞り込み" disabled className="hidden h-10 bg-card shadow-sm disabled:opacity-75 lg:inline-flex">
                  <SlidersHorizontal aria-hidden="true" />
                  絞り込み
                </Button>
                <div className="ml-auto flex shrink-0 items-center">
                  <Button variant="ghost" size="icon" aria-label="通知" disabled className="disabled:opacity-75">
                    <Bell aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="ヘルプ" disabled className="disabled:opacity-75">
                    <CircleHelp aria-hidden="true" />
                  </Button>
                </div>
              </>
            ) : (
              <h1 className="text-base font-semibold">{title}</h1>
            )}
          </header>
          {view === "map" ? (
            <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,15rem)] gap-2 px-2 pb-2 md:grid-cols-[minmax(0,1fr)_17rem] md:grid-rows-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_20rem]">
              <section aria-label="地図" className="relative min-h-0 min-w-0 overflow-hidden rounded-2xl border bg-muted">
                {map}
              </section>
              <MapDetailPanel onCreatePost={onCreatePost} onCreatePlan={onCreatePlan}>
                {detail}
              </MapDetailPanel>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto md:pl-[calc(var(--sidebar-width)-var(--sidebar-width-icon))]">
              {view === "pins" ? pins : plans}
            </div>
          )}
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}
