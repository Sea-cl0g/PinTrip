import type { ReactNode } from "react";
import { useOutletContext } from "react-router";

import type { AppLayoutOutletContext } from "@/components/AppLayout";
import { MapDetailEmpty } from "@/components/PanelEmpty";
import { MapDetailPanel } from "@/components/MapDetailPanel";
import { MapWorkspace } from "@/components/MapWorkspace";

type TopPageProps = {
  map?: ReactNode;
  detail?: ReactNode;
};

export default function TopPage({ map, detail }: TopPageProps) {
  const { onCreatePost, onCreatePlan } = useOutletContext<AppLayoutOutletContext>();

  return (
    <MapWorkspace map={map}>
      <MapDetailPanel>
        {detail ?? <MapDetailEmpty onCreatePost={onCreatePost} onCreatePlan={onCreatePlan} />}
      </MapDetailPanel>
    </MapWorkspace>
  );
}
