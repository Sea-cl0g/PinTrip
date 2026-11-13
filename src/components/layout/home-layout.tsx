import { useState, type FormEvent, type ReactNode } from "react";
import { List, Map, Route, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Sidebar, SidebarProvider } from "../ui/sidebar";
import { cn } from "../../lib/utils";

const items = [
  { id: "map", label: "マップ", icon: Map },
  { id: "pins", label: "投稿一覧", icon: List },
  { id: "plans", label: "旅行計画", icon: Route },
] as const;
export type HomeView = (typeof items)[number]["id"];

type HomeLayoutProps = {
  map?: ReactNode;
  pins?: ReactNode;
  plans?: ReactNode;
  onSearch?: (query: string) => void;
  onViewChange?: (view: HomeView) => void;
};

// 地図・投稿一覧・旅行計画は、各担当のコンポーネントを渡す。
export function HomeLayout({ map, pins, plans, onSearch, onViewChange }: HomeLayoutProps) {
  const [view, setView] = useState<HomeView>("map");
  const [query, setQuery] = useState("");
  const title = items.find((item) => item.id === view)!.label;

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch?.(query.trim());
  }

  return (
    <SidebarProvider className="h-dvh min-h-0 overflow-hidden bg-background">
      <Sidebar collapsible="none" aria-label="メインメニュー" className="w-56 shrink-0 border-r bg-card text-foreground">
        <nav className="flex flex-col gap-2 p-3">
          {items.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant="ghost"
              aria-current={view === id ? "page" : undefined}
              className={cn("justify-start gap-3", view === id && "bg-accent text-primary")}
              onClick={() => { setView(id); onViewChange?.(id); }}
            >
              <Icon aria-hidden="true" />
              {label}
            </Button>
          ))}
        </nav>
      </Sidebar>
      <main aria-label={title} className="relative min-w-0 flex-1">
        <div className="h-full overflow-auto">
          {view === "map" ? map : view === "pins" ? pins : plans}
        </div>
        {view === "map" && (
          <form role="search" onSubmit={search} className="absolute right-4 top-4 w-80 max-w-[calc(100%-2rem)]">
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              aria-label="投稿本文・ハッシュタグを検索"
              placeholder="本文・ハッシュタグで検索"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 bg-card pl-9"
            />
          </form>
        )}
      </main>
    </SidebarProvider>
  );
}
