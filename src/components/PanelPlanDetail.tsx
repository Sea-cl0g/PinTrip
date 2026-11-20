import { useEffect, useId, useState } from "react";
import { ArrowDown, Clock } from "lucide-react";

import { getPlans } from "@/api/mock-api";
import { StarButton } from "@/components/StarButton";
import type { Pin, Plan, PlanPinItem } from "@/types";

type PanelPlanDetailProps = {
  planId: number;
  selectedPinId?: number;
  onSelectPin?: (pin: Pin) => void;
};

type DetailState =
  | { status: "loading" | "error" }
  | { status: "ready"; plan: Plan | undefined };

const publicationDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function PanelPlanDetail(props: PanelPlanDetailProps) {
  return <PlanDetailContent key={props.planId} {...props} />;
}

function PlanDetailContent({ planId, selectedPinId, onSelectPin }: PanelPlanDetailProps) {
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
        <ol role="list" aria-label="旅行計画の行程" className="space-y-1">
          {items.map((item) => {
            if (item.type === "moment") {
              return (
                <li key={item.id} className="flex items-center justify-center gap-2 px-3 text-xs text-muted-foreground">
                  <ArrowDown aria-hidden="true" className="size-4 shrink-0" />
                  <span className="min-w-0 rounded-full bg-muted px-3 py-1 wrap-break-word">
                    {item.title}{item.durationMinutes !== null && ` ${item.durationMinutes}分`}
                  </span>
                </li>
              );
            }

            return (
              <PlanStop
                key={item.id}
                item={item}
                number={++pinNumber}
                selectedPinId={selectedPinId}
                onSelectPin={onSelectPin}
              />
            );
          })}
        </ol>
      )}
    </section>
  );
}

function PlanStop({ item, number, selectedPinId, onSelectPin }: {
  item: PlanPinItem;
  number: number;
  selectedPinId?: number;
  onSelectPin?: (pin: Pin) => void;
}) {
  const { pin, durationMinutes } = item;
  const cardClass = "flex min-h-11 w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm";
  const actionClass = `${cardClass} cursor-pointer hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring`;
  const content = (
    <>
      <span className="w-5 shrink-0 font-semibold tabular-nums">{number}</span>
      <span aria-hidden="true" className="w-6 shrink-0 text-center text-lg leading-none">{pin?.emoji}</span>
      <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="min-w-0 flex-[1_1_6rem] font-semibold wrap-break-word">
          {pin?.title ?? "ピンが見つかりません"}
        </span>
        {durationMinutes !== null && (
          <span className="inline-flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground">
            <Clock aria-hidden="true" className="size-3.5" />
            滞在 {durationMinutes}分
          </span>
        )}
      </span>
    </>
  );

  if (!pin) {
    return <li className={`${cardClass} text-muted-foreground`}>{content}</li>;
  }

  if (onSelectPin) {
    const isSelected = pin.id === selectedPinId;
    return (
      <li>
        <button
          type="button"
          aria-pressed={isSelected}
          className={`${actionClass} aria-pressed:border-primary aria-pressed:bg-primary/10`}
          onClick={() => onSelectPin(pin)}
        >
          {content}
        </button>
      </li>
    );
  }

  const query = encodeURIComponent(`${pin.latitude},${pin.longitude}`);
  return (
    <li>
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${query}`}
        target="_blank"
        rel="noopener noreferrer"
        className={actionClass}
        aria-label={`${pin.title}をGoogle マップで開く（新しいタブ）`}
      >
        {content}
      </a>
    </li>
  );
}
