import { useEffect, useId, useRef, useState } from "react";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { zodResolver } from "@hookform/resolvers/zod";
import Uppy from "@uppy/core";
import { format, isValid, parseISO } from "date-fns";
import emojiRegex from "emoji-regex";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import { ArrowDown, ArrowLeft, Ellipsis, GripVertical, Image, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getPins } from "@/api/mock-api";
import { StarButton } from "@/components/StarButton";
import { Button } from "@/components/ui/button";
import {
  Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Pin, Plan, PlanItem } from "@/types";

const momentSuggestions = ["移動", "待ち合わせ", "休憩", "食事"];
const suggestedEmojis = [
  { emoji: "🚃", label: "電車" }, { emoji: "🚗", label: "車" },
  { emoji: "🗺️", label: "地図" }, { emoji: "🏞️", label: "風景" },
  { emoji: "☕", label: "カフェ" },
];
const maxImageSize = 5 * 1024 * 1024;
const inputClass = "border-border bg-card";

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
  const imageInput = useRef<HTMLInputElement>(null);
  const [imageName, setImageName] = useState("");
  const [imageError, setImageError] = useState("");
  const [uppy] = useState(() => new Uppy({
    restrictions: {
      allowedFileTypes: ["image/*"],
      maxFileSize: maxImageSize,
      maxNumberOfFiles: 1,
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

  function chooseImage(file: File) {
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || /\.svgz?$/i.test(file.name)) {
      setImageError("SVG以外の画像を選択してください。");
      return;
    }
    if (file.size > maxImageSize) {
      setImageError("5MB以下の画像を選択してください。");
      return;
    }

    const [previousImage] = uppy.getFiles();
    if (previousImage) uppy.removeFile(previousImage.id);
    uppy.addFile({ name: file.name, type: file.type, data: file });
    setImageName(file.name);
    setImageError("");
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
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" aria-label="戻る" onClick={onBack}>
            <ArrowLeft aria-hidden="true" />
          </Button>
          <h2 id={`${formId}-heading`} className="flex-1 text-lg font-semibold">
            {plan ? "旅行計画を編集" : "旅行計画を作成"}
          </h2>
          {plan && (
            <StarButton
              count={Number(isStarred)}
              isLiked={isStarred}
              onClick={() => setIsStarred((previous) => !previous)}
            />
          )}
        </div>
        {publishedDate && isValid(publishedDate) && (
          <p className="text-sm text-muted-foreground">公開日 {format(publishedDate, "yyyy/MM/dd")}</p>
        )}
      </header>

      <form className="space-y-4" noValidate onSubmit={save("published")}>
        <div className="space-y-1">
          <input
            ref={imageInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) chooseImage(file);
              event.currentTarget.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-20 w-full justify-center rounded-lg border-dashed bg-card px-3 py-2 whitespace-normal"
            aria-describedby={`${formId}-image-hint`}
            onClick={() => imageInput.current?.click()}
          >
            <Image aria-hidden="true" className="shrink-0" />
            <span className="min-w-0 wrap-break-word">
              {imageName || (plan?.images.length ? "登録済みの画像を変更" : "画像を選択")}
            </span>
          </Button>
          <p id={`${formId}-image-hint`} className="text-xs text-muted-foreground">任意・1枚まで・5MB以下</p>
          {imageName && (
            <Button type="button" variant="ghost" size="sm" onClick={() => {
              const [file] = uppy.getFiles();
              if (file) uppy.removeFile(file.id);
              setImageName("");
              setImageError("");
            }}>
              選択を取り消す
            </Button>
          )}
          {imageError && <p role="alert" className="text-sm text-destructive">{imageError}</p>}
        </div>
        <div className="space-y-1">
          <label htmlFor={`${formId}-title`}>旅行計画名 <span className="text-xs text-destructive">必須</span></label>
          <Input id={`${formId}-title`} required className={inputClass} aria-invalid={!!errors.title} {...register("title")} />
          {errors.title && <p role="alert" className="text-sm text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="絵文字">
            {suggestedEmojis.map(({ emoji: option, label }) => (
              <Button
                key={option}
                type="button"
                variant="outline"
                size="icon"
                aria-label={label}
                aria-pressed={emoji === option}
                className="bg-card text-base aria-pressed:border-primary aria-pressed:bg-primary/10"
                onClick={() => setValue("emoji", option, { shouldValidate: true })}
              >
                {option}
              </Button>
            ))}
            {emoji && !suggestedEmojis.some(({ emoji: option }) => option === emoji) && (
              <span className="px-1 text-lg" aria-label="選択中の絵文字">{emoji}</span>
            )}
            <Button type="button" variant="outline" size="icon" className="bg-card" aria-label="その他の絵文字" aria-expanded={showEmojiPicker} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              <Ellipsis aria-hidden="true" />
            </Button>
          </div>
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
        <div className="space-y-1">
          <label htmlFor={`${formId}-body`}>説明</label>
          <Textarea id={`${formId}-body`} rows={3} className={inputClass} {...register("body")} />
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
          <div className="flex items-center gap-2">
            <select id={`${formId}-pin`} value={selectedPin} onChange={(event) => setSelectedPin(event.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border bg-card px-2 text-sm">
              <option value="">選択してください</option>
              {availablePins?.map((pin) => <option key={pin.id} value={pin.id}>{pin.title}</option>)}
            </select>
            <Button type="button" variant="outline" disabled={!selectedPin} onClick={addPin}>ピンを追加</Button>
          </div>
          {pinLoadFailed && <p role="alert" className="text-sm text-destructive">ピンを読み込めませんでした。</p>}
          {!pinOptions && !pinLoadFailed && <p role="status" className="text-sm">ピンを読み込み中…</p>}
          <Button type="button" variant="outline" aria-expanded={showMoment} onClick={() => setShowMoment(!showMoment)}>
            <ArrowDown aria-hidden="true" />
            ひとコマを追加
          </Button>
          {showMoment && (
            <div className="space-y-2">
              <label htmlFor={`${formId}-moment`}>ひとコマの名前</label>
              <Combobox
                items={momentSuggestions}
                inputValue={momentTitle}
                onInputValueChange={(value, details) => {
                  if (details.reason === "input-change") setMomentTitle(value);
                }}
                onValueChange={(value) => {
                  if (typeof value === "string") setMomentTitle(value);
                }}
              >
                <ComboboxInput id={`${formId}-moment`} className={`w-full ${inputClass}`} placeholder="候補を選択、または入力" />
                <ComboboxContent>
                  <ComboboxEmpty>入力した名前で追加できます。</ComboboxEmpty>
                  <ComboboxList>
                    {(option: string) => <ComboboxItem key={option} value={option}>{option}</ComboboxItem>}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              <Button type="button" variant="outline" disabled={!momentTitle.trim()} onClick={addMoment}>行程に追加</Button>
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
    <li ref={ref} className={`flex items-center gap-1 rounded-lg border p-2 ${item.type === "moment" ? "bg-muted" : "bg-card"}`}>
      <Button ref={handleRef} type="button" variant="ghost" size="icon-sm" className="shrink-0 cursor-grab touch-none" aria-label={`${title}を並べ替える`}>
        <GripVertical aria-hidden="true" />
      </Button>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="flex min-w-0 flex-[1_1_6rem] items-start gap-1.5 text-sm">
          {item.type === "moment" ? <ArrowDown aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : (
            <span aria-hidden="true" className="shrink-0">{item.pin?.emoji}</span>
          )}
          <span className="min-w-0 wrap-break-word">{title}</span>
        </span>
        {(item.type === "moment" || item.pin) && (
          <label className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            {item.type === "moment" ? "時間" : "滞在"}
            <Input
              type="number"
              className={`h-7 w-14 px-2 text-xs ${inputClass}`}
              min={0}
              step="any"
              value={item.durationMinutes ?? ""}
              onChange={(event) => {
                const value = event.target.valueAsNumber;
                onDurationChange(Number.isFinite(value) && value >= 0 ? value : null);
              }}
            />
            分
          </label>
        )}
      </div>
      <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" aria-label={`${title}を削除`} onClick={onRemove}>
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  );
}
