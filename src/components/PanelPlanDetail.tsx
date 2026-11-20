import { useEffect, useId, useState } from "react";
import { ArrowDown, Clock } from "lucide-react";

import { getPlans } from "@/api/mock-api";
import { StarButton } from "@/components/StarButton";
import type { Plan } from "@/types";

type PanelPlanDetailProps = {
  planId: number;
};

type DetailState =
  | { status: "loading" | "error" }
  | { status: "ready"; plan: Plan | undefined };

const publicationDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

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
  const imageUrls = plan.images.filter(
    (image): image is string => typeof image === "string" && image.trim() !== "",
  );
  let pinNumber = 0;

  return (
    <section aria-labelledby={titleId} className="space-y-4 p-4">
      <header className="flex items-start gap-2">
        {plan.emoji && (
          <span aria-hidden="true" className="shrink-0 text-3xl leading-10">{plan.emoji}</span>
        )}
        <div className="min-w-0 wrap-break-word">
          <h2 id={titleId} className="text-lg font-semibold">{plan.title}</h2>
          {plan.publishedAt && (
            <time dateTime={plan.publishedAt} className="block text-xs text-muted-foreground">
              {publicationDateFormatter.format(new Date(plan.publishedAt))}
            </time>
          )}
          <p className="mt-1 text-xs text-muted-foreground">by {plan.author.displayName}</p>
        </div>
      </header>
      {imageUrls.length > 0 && (
        <div className="space-y-2">
          {imageUrls.map((url, index) => (
            <img
              key={`${index}-${url}`}
              src={url}
              alt={`${plan.title}の画像 ${index + 1}`}
              className="w-full rounded-lg"
            />
          ))}
        </div>
      )}
      {plan.body && <p className="font-diary whitespace-pre-wrap wrap-break-word">{plan.body}</p>}
      <StarButton
        count={Number(isLiked)}
        isLiked={isLiked}
        onClick={() => setIsLiked((previous) => !previous)}
      />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">登録された項目はありません。</p>
      ) : (
        <ol aria-label="旅行計画の行程" className="space-y-2">
          {items.map((item) => {
            if (item.type === "moment") {
              return (
                <li key={item.id} className="flex items-start gap-2 px-3 text-sm text-muted-foreground">
                  <ArrowDown aria-hidden="true" className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 wrap-break-word">{item.title}</span>
                  {item.durationMinutes !== null && <span className="shrink-0">{item.durationMinutes}分</span>}
                </li>
              );
            }

            const number = ++pinNumber;
            return (
              <li key={item.id} className="flex items-start gap-2 rounded-lg border p-3">
                <span className="shrink-0 tabular-nums">{number}.</span>
                {item.pin?.emoji && <span aria-hidden="true" className="shrink-0">{item.pin.emoji}</span>}
                <span className="min-w-0 flex-1 wrap-break-word">
                  {item.pin?.title ?? "ピンが見つかりません"}
                </span>
                {item.durationMinutes !== null && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Clock aria-hidden="true" className="size-4" />
                    滞在 {item.durationMinutes}分
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
