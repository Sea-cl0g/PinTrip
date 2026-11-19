import { useEffect, useId, useState } from "react";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { zodResolver } from "@hookform/resolvers/zod";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/dashboard";
import { format, isValid, parseISO } from "date-fns";
import emojiRegex from "emoji-regex";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import { ArrowLeft, GripVertical, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getPins } from "@/api/mock-api";
import { StarButton } from "@/components/StarButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Pin, Plan, PlanItem } from "@/types";
import "@uppy/core/css/style.css";
import "@uppy/dashboard/css/style.css";

const planSchema = z.object({
  title: z.string().trim().min(1, "旅行計画名を入力してください。"),
  body: z.string(),
  emoji: z.string().refine(
    (value) => value === "" || emojiRegex().exec(value)?.[0] === value,
    "絵文字を1つ選んでください。",
  ),
});

type PlanFields = z.infer<typeof planSchema>;

export type PlanEditorSubmission = PlanFields & {
  planId: number | undefined;
  items: PlanItem[];
  newImages: Blob[];
  status: Plan["status"];
};

type PanelPlanEditorProps = {
  plan?: Plan;
  onBack: () => void;
  onSave?: (submission: PlanEditorSubmission) => void;
};

export function PanelPlanEditor(props: PanelPlanEditorProps) {
  return <PlanEditorForm key={props.plan?.id ?? "new"} {...props} />;
}

function PlanEditorForm({ plan, onBack, onSave }: PanelPlanEditorProps) {
  const formId = useId();
  const [items, setItems] = useState<PlanItem[]>(() =>
    [...(plan?.items ?? [])].sort((first, second) => first.position - second.position),
  );
  const [nextItemId, setNextItemId] = useState(() =>
    Math.min(0, ...items.map((item) => item.id)) - 1,
  );
  const [pinOptions, setPinOptions] = useState<Pin[]>();
  const [pinLoadFailed, setPinLoadFailed] = useState(false);
  const [selectedPin, setSelectedPin] = useState("");
  const [momentTitle, setMomentTitle] = useState("");
  const [showMoment, setShowMoment] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isStarred, setIsStarred] = useState(false);
  const [uppy] = useState(() => new Uppy({
    restrictions: {
      allowedFileTypes: ["image/*"],
      maxFileSize: 5 * 1024 * 1024,
      maxNumberOfFiles: Math.max(0, 3 - (plan?.images.length ?? 0)),
    },
  }));

  const {
    register, handleSubmit, watch, setValue, formState: { errors },
  } = useForm<PlanFields>({
    resolver: zodResolver(planSchema),
    defaultValues: { title: plan?.title ?? "", body: plan?.body ?? "", emoji: plan?.emoji ?? "" },
  });
  const emoji = watch("emoji");
  const hasDraftPin = items.some((item) => item.type === "pin" && item.pin?.status === "draft");
  const publishedDate = plan?.publishedAt ? parseISO(plan.publishedAt) : null;
  const availablePins = pinOptions?.filter((pin) => plan?.status !== "published" || pin.status !== "draft");

  useEffect(() => {
    let active = true;
    getPins().then(
      (pins) => { if (active) setPinOptions(pins); },
      () => { if (active) setPinLoadFailed(true); },
    );
    return () => { active = false; };
  }, []);

  function addItem(item: PlanItem) {
    setItems((previous) => [...previous, item]);
    setNextItemId((previous) => previous - 1);
  }

  function addPin() {
    const pin = availablePins?.find((candidate) => String(candidate.id) === selectedPin);
    if (!pin) return;
    addItem({ id: nextItemId, type: "pin", position: items.length, pin, durationMinutes: null });
    setSelectedPin("");
  }

  function addMoment() {
    const title = momentTitle.trim();
    if (!title) return;
    addItem({ id: nextItemId, type: "moment", position: items.length, title, durationMinutes: null });
    setMomentTitle("");
    setShowMoment(false);
  }

  function save(status: Plan["status"]) {
    return handleSubmit((fields) => {
      if (status === "published" && hasDraftPin) return;
      const submission = {
        ...fields,
        planId: plan?.id,
        items: items.map((item, position) => ({ ...item, position })),
        newImages: uppy.getFiles().map((file) => file.data).filter((data) => data instanceof Blob),
        status,
      };
      onSave?.(submission);
      setFeedback(status === "draft" ? "下書き保存を確認しました（モック）。" : "公開を確認しました（モック）。");
    });
  }

  return (
    <section className="space-y-4 p-4" aria-labelledby={`${formId}-heading`}>
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft />戻る</Button>
          {plan && (
            <StarButton
              count={Number(isStarred)}
              isLiked={isStarred}
              onClick={() => setIsStarred((previous) => !previous)}
            />
          )}
        </div>
        <h2 id={`${formId}-heading`} className="text-lg font-semibold">
          {plan ? "旅行計画を編集" : "旅行計画を作成"}
        </h2>
        {publishedDate && isValid(publishedDate) && (
          <p className="text-sm text-muted-foreground">公開日 {format(publishedDate, "yyyy/MM/dd")}</p>
        )}
      </header>

      <form className="space-y-4" onSubmit={save("published")}>
        <div className="space-y-1">
          <label htmlFor={`${formId}-title`}>旅行計画名</label>
          <Input id={`${formId}-title`} aria-invalid={!!errors.title} {...register("title")} />
          {errors.title && <p role="alert" className="text-sm text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1">
          <label htmlFor={`${formId}-body`}>説明</label>
          <textarea id={`${formId}-body`} rows={3} className="w-full rounded-lg border bg-background p-2" {...register("body")} />
        </div>
        <div className="space-y-2">
          <Button type="button" variant="outline" aria-expanded={showEmojiPicker} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            {emoji ? `絵文字を変更 ${emoji}` : "絵文字を選択"}
          </Button>
          {showEmojiPicker && (
            <EmojiPicker
              emojiStyle={EmojiStyle.NATIVE}
              width="100%"
              height={320}
              onEmojiClick={({ emoji: selected }) => {
                setValue("emoji", selected, { shouldValidate: true });
                setShowEmojiPicker(false);
              }}
            />
          )}
          {errors.emoji && <p role="alert" className="text-sm text-destructive">{errors.emoji.message}</p>}
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">画像</h3>
          <p className="text-sm text-muted-foreground">最大3枚、1枚につき5MBまで</p>
          {(plan?.images.length ?? 0) < 3 && (
            <Dashboard uppy={uppy} width="100%" height={230} hideUploadButton />
          )}
          {!!plan?.images.length && <p className="text-sm">登録済みの画像 {plan.images.length}枚</p>}
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">立ち寄り先・ひとコマ</h3>
          <DragDropProvider onDragEnd={(event) => {
            if (!event.canceled) setItems((previous) => move(previous, event));
          }}>
            <ol className="space-y-2">
              {items.map((item, index) => (
                <SortablePlanItem
                  key={item.id}
                  item={item}
                  index={index}
                  onRemove={() => setItems((previous) => previous.filter(({ id }) => id !== item.id))}
                  onDurationChange={(durationMinutes) => setItems((previous) =>
                    previous.map((entry) => entry.id === item.id ? { ...entry, durationMinutes } : entry),
                  )}
                />
              ))}
            </ol>
          </DragDropProvider>

          <label htmlFor={`${formId}-pin`} className="block text-sm">追加するピン</label>
          <select id={`${formId}-pin`} value={selectedPin} onChange={(event) => setSelectedPin(event.target.value)} className="w-full rounded-lg border bg-background p-2">
            <option value="">選択してください</option>
            {availablePins?.map((pin) => <option key={pin.id} value={pin.id}>{pin.title}</option>)}
          </select>
          {pinLoadFailed && <p role="alert" className="text-sm text-destructive">ピンを読み込めませんでした。</p>}
          {!pinOptions && !pinLoadFailed && <p role="status" className="text-sm">ピンを読み込み中…</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={!selectedPin} onClick={addPin}>ピンを追加</Button>
            <Button type="button" variant="outline" aria-expanded={showMoment} onClick={() => setShowMoment(!showMoment)}>ひとコマ</Button>
          </div>
          {showMoment && (
            <div className="space-y-2">
              <label htmlFor={`${formId}-moment`}>ひとコマの名前</label>
              <Input id={`${formId}-moment`} value={momentTitle} onChange={(event) => setMomentTitle(event.target.value)} />
              <Button type="button" variant="outline" disabled={!momentTitle.trim()} onClick={addMoment}>ひとコマを追加</Button>
            </div>
          )}
        </div>

        {hasDraftPin && <p className="text-sm text-muted-foreground">下書きのピンを含む旅行計画は公開できません。</p>}
        <div className="flex flex-wrap gap-2">
          {plan?.status !== "published" && (
            <Button type="button" variant="outline" onClick={save("draft")}>下書き保存</Button>
          )}
          <Button type="submit" disabled={hasDraftPin}>{plan?.status === "published" ? "変更を保存" : "公開"}</Button>
        </div>
        {feedback && <p role="status" className="text-sm">{feedback}</p>}
      </form>
    </section>
  );
}

function SortablePlanItem({ item, index, onRemove, onDurationChange }: {
  item: PlanItem;
  index: number;
  onRemove: () => void;
  onDurationChange: (durationMinutes: number | null) => void;
}) {
  const { ref, handleRef } = useSortable({ id: item.id, index });
  const title = item.type === "moment" ? item.title : item.pin?.title ?? "ピンが見つかりません";
  return (
    <li ref={ref} className="flex items-start gap-2 rounded-lg border p-2">
      <Button ref={handleRef} type="button" variant="ghost" size="icon" className="cursor-grab touch-none" aria-label={`${title}を並べ替える`}>
        <GripVertical />
      </Button>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs text-muted-foreground">{item.type === "moment" ? "ひとコマ" : "立ち寄り先"}</p>
        <p className="wrap-break-word">{title}</p>
        {(item.type === "moment" || item.pin) && (
          <label className="block text-sm">
            {item.type === "moment" ? "時間（分）" : "滞在時間（分）"}
            <Input
              type="number"
              min={0}
              step="any"
              value={item.durationMinutes ?? ""}
              onChange={(event) => {
                const value = event.target.valueAsNumber;
                onDurationChange(Number.isFinite(value) && value >= 0 ? value : null);
              }}
            />
          </label>
        )}
      </div>
      <Button type="button" variant="ghost" size="icon" aria-label={`${title}を削除`} onClick={onRemove}>
        <Trash2 />
      </Button>
    </li>
  );
}
