import type { RouteObject } from "react-router";

import { AppLayout } from "@/components/AppLayout";
import { pages } from "@/navigation";
import PinsPage from "@/pages/PinsPage";
import PlansPage from "@/pages/PlansPage";
import SettingsPage from "@/pages/SettingsPage";
import TopPage from "@/pages/TopPage";

export const routes: RouteObject[] = [
  {
    path: pages.map.path,
    element: <AppLayout />,
    children: [
      { index: true, element: <TopPage /> },
      { path: pages.pins.path, element: <PinsPage /> },
      { path: pages.plans.path, element: <PlansPage /> },
      { path: pages.settings.path, element: <SettingsPage /> },
    ],
  },
];
