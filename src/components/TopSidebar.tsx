import { CalendarDays, List, Map, Plus, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

export const topViews = [
  { id: "map", label: "マップ", icon: Map },
  { id: "pins", label: "投稿一覧", icon: List },
  { id: "plans", label: "旅行計画", icon: CalendarDays },
] as const;

export type HomeView = (typeof topViews)[number]["id"];

type TopSidebarProps = {
  view: HomeView;
  onViewChange: (view: HomeView) => void;
  onCreatePost?: () => void;
};

export function TopSidebar({ view, onViewChange, onCreatePost }: TopSidebarProps) {
  const { isMobile, open, openMobile, setOpenMobile } = useSidebar();
  const expanded = isMobile ? openMobile : open;

  return (
    <Sidebar collapsible="icon" className="z-30 shadow-sm">
      <SidebarHeader className="h-16 flex-row items-center gap-2">
        <SidebarTrigger aria-label={expanded ? "メニューを閉じる" : "メニューを開く"} aria-expanded={expanded} />
        <span className="text-xl font-bold tracking-tight group-data-[collapsible=icon]:hidden">PinTrip</span>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="メインメニュー" className="px-2">
          <SidebarMenu>
            {topViews.map(({ id, label, icon: Icon }) => (
              <SidebarMenuItem key={id}>
                <SidebarMenuButton
                  isActive={view === id}
                  aria-current={view === id ? "page" : undefined}
                  aria-label={label}
                  tooltip={label}
                  className="h-10 font-medium data-active:bg-teal-100 data-active:text-teal-900 dark:data-active:bg-teal-950 dark:data-active:text-teal-100"
                  onClick={() => {
                    onViewChange(id);
                    setOpenMobile(false);
                  }}
                >
                  <Icon aria-hidden="true" />
                  <span className="group-data-[collapsible=icon]:hidden">{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem className="mt-4">
              <SidebarMenuButton
                aria-label="投稿を作成"
                tooltip="投稿を作成"
                aria-disabled={!onCreatePost}
                onClick={onCreatePost}
                className="h-10 bg-teal-700 font-semibold text-white hover:bg-teal-800 hover:text-white aria-disabled:opacity-80"
              >
                <Plus aria-hidden="true" />
                <span className="group-data-[collapsible=icon]:hidden">投稿を作成</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </nav>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton aria-label="設定" tooltip="設定" aria-disabled>
              <Settings aria-hidden="true" />
              <span className="group-data-[collapsible=icon]:hidden">設定</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
