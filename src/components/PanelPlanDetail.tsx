import { useEffect, useId, useState } from "react";

import { getPlans } from "@/api/mock-api";
import { StarButton } from "@/components/StarButton";
import type { Plan } from "@/types";

type PanelPlanDetailProps = {
  planId: number;
};

type DetailState =
  | { status: "loading" | "error" }
  | { status: "ready"; plan: Plan | undefined };

export function PanelPlanDetail({ planId }: PanelPlanDetailProps) {
  return <PlanDetailContent key={planId} planId={planId} />;
}

function PlanDetailContent({ planId }: PanelPlanDetailProps) {
  const titleId = useId();
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    let active = true;
    getPlans().then(
      (plans) => {
        if (active) {
          setState({ status: "ready", plan: plans.find((plan) => plan.id === planId) });
        }
      },
      () => {
        if (active) setState({ status: "error" });
      },
    );
    return () => {
      active = false;
    };
  }, [planId]);

  if (state.status !== "ready") {
    return state.status === "loading"
      ? <p role="status" className="p-4">読み込み中…</p>
      : <p role="alert" className="p-4 text-destructive">旅行計画を読み込めませんでした。</p>;
  }

  const { plan } = state;
  if (!plan) {
    return <p className="p-4">旅行計画が見つかりません。</p>;
  }

  const items = [...plan.items].sort((first, second) => first.position - second.position);
  return (
    <section aria-labelledby={titleId} className="space-y-4 p-4">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0 wrap-break-word">
          <h2 id={titleId} className="text-lg font-semibold">
            <span aria-hidden="true">{plan.emoji} </span>{plan.title}
          </h2>
          <p className="text-sm text-muted-foreground">{plan.author.displayName}</p>
        </div>
        <StarButton
          count={Number(isLiked)}
          isLiked={isLiked}
          onClick={() => setIsLiked((previous) => !previous)}
        />
      </header>
      {plan.body && <p className="font-diary whitespace-pre-wrap wrap-break-word">{plan.body}</p>}

      <div className="space-y-2">
        <h3 className="font-medium">立ち寄り先・ひとコマ</h3>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">登録された項目はありません。</p>
        ) : (
          <ol className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="space-y-1 rounded-lg border p-3 wrap-break-word">
                <p className="text-xs text-muted-foreground">
                  {item.type === "moment" ? "ひとコマ" : "立ち寄り先"}
                </p>
                <p>
                  {item.type === "moment"
                    ? item.title
                    : item.pin?.title ?? "ピンが見つかりません"}
                </p>
                {item.durationMinutes !== null && (
                  <p className="text-sm text-muted-foreground">{item.durationMinutes}分</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
