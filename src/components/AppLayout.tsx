import { useState, type CSSProperties, type FormEvent } from "react";
import { Bell, CircleHelp, Search, SlidersHorizontal } from "lucide-react";
import { matchPath, Outlet, useLocation } from "react-router";

import { TopSidebar } from "@/components/TopSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { pages } from "@/navigation";

type AppLayoutProps = {
  onSearch?: (query: string) => void;
  onCreatePost?: () => void;
  onCreatePlan?: () => void;
};

export type AppLayoutOutletContext = Pick<AppLayoutProps, "onCreatePost" | "onCreatePlan">;

const sidebarSizes = {
  "--sidebar-width": "13rem",
} as CSSProperties;

function MobileMenuTrigger() {
  const { openMobile } = useSidebar();
  return <SidebarTrigger className="md:hidden" aria-label="メニューを開く" aria-expanded={openMobile} />;
}

export function AppLayout({ onSearch, onCreatePost, onCreatePlan }: AppLayoutProps) {
  const { pathname } = useLocation();
  const [query, setQuery] = useState("");
  const currentPage = Object.values(pages).find(({ path }) => matchPath({ path, end: true }, pathname));

  if (!currentPage) {
    throw new Error(`No page configured for ${pathname}`);
  }

  const hasMap = currentPage.path === pages.map.path || currentPage.path === pages.plans.path;
  const content = <Outlet context={{ onCreatePost, onCreatePlan } satisfies AppLayoutOutletContext} />;

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch?.(query.trim());
  }

  return (
    <TooltipProvider>
      <SidebarProvider
        style={sidebarSizes}
        className="h-dvh min-h-0 overflow-hidden bg-background [&_[data-slot=sidebar-gap]]:hidden"
      >
        <TopSidebar onCreatePost={onCreatePost} />
        <main aria-label={currentPage.label} className="flex min-w-0 flex-1 flex-col md:ml-(--sidebar-width-icon)">
          <header className="flex h-16 shrink-0 items-center gap-2 px-3 md:gap-3 md:pr-5 md:pl-[calc(var(--sidebar-width)-var(--sidebar-width-icon)+1rem)]">
            <MobileMenuTrigger />
            {hasMap ? (
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
              <h1 className="text-base font-semibold">{currentPage.label}</h1>
            )}
          </header>
          {hasMap ? content : (
            <div className="min-h-0 flex-1 overflow-auto md:pl-[calc(var(--sidebar-width)-var(--sidebar-width-icon))]">
              {content}
            </div>
          )}
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}
