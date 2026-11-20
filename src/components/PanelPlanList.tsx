import { useEffect, useId, useState } from "react";

import { getPlans } from "@/api/mock-api";
import { StarButton } from "@/components/StarButton";
import type { Plan } from "@/types";

type PanelPlanListProps = {
  currentUserId: number;
  onSelectPlan: (plan: Plan) => void;
};

type PlanListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; plans: Plan[] };

const publicationDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function PanelPlanList({ currentUserId, onSelectPlan }: PanelPlanListProps) {
  const titleId = useId();
  const [state, setState] = useState<PlanListState>({ status: "loading" });
  const [starredPlanIds, setStarredPlanIds] = useState<number[]>([]);

  useEffect(() => {
    let active = true;

    getPlans().then(
      (plans) => {
        if (active) setState({ status: "ready", plans });
      },
      () => {
        if (active) setState({ status: "error" });
      },
    );

    return () => {
      active = false;
    };
  }, []);

  const ownPlans = state.status === "ready"
    ? state.plans.filter((plan) => plan.author.id === currentUserId)
    : [];

  function toggleStar(planId: number) {
    setStarredPlanIds((previous) =>
      previous.includes(planId)
        ? previous.filter((id) => id !== planId)
        : [...previous, planId],
    );
  }

  return (
    <section aria-labelledby={titleId} className="space-y-4 p-4">
      <h2 id={titleId} className="text-lg font-semibold">旅行計画</h2>

      {state.status === "loading" && (
        <p role="status" className="text-sm text-muted-foreground">読み込み中…</p>
      )}
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">旅行計画を読み込めませんでした。</p>
      )}
      {state.status === "ready" && ownPlans.length === 0 && (
        <p className="text-sm text-muted-foreground">旅行計画はまだありません。</p>
      )}

      {ownPlans.length > 0 && (
        <ul className="space-y-3">
          {ownPlans.map((plan) => {
            const isStarred = starredPlanIds.includes(plan.id);

            return (
              <li key={plan.id} className="space-y-1 rounded-lg border p-2">
                <button
                  type="button"
                  className="block w-full cursor-pointer rounded-md p-2 text-left wrap-break-word hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => onSelectPlan(plan)}
                >
                  <span className="flex items-start gap-2">
                    {plan.emoji && (
                      <span aria-hidden="true" className="shrink-0 text-3xl leading-10">{plan.emoji}</span>
                    )}
                    <span className="min-w-0">
                      <span className="block font-medium">{plan.title}</span>
                      {plan.publishedAt && (
                        <time dateTime={plan.publishedAt} className="block text-xs text-muted-foreground">
                          {publicationDateFormatter.format(new Date(plan.publishedAt))}
                        </time>
                      )}
                    </span>
                  </span>
                  {plan.body && (
                    <span className="mt-1 block font-diary text-sm text-muted-foreground">{plan.body}</span>
                  )}
                </button>

                <StarButton
                  count={Number(isStarred)}
                  isLiked={isStarred}
                  onClick={() => toggleStar(plan.id)}
                />
                <p className="px-2 pb-1 text-xs text-muted-foreground wrap-break-word">
                  by {plan.author.displayName}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
