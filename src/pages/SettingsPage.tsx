
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LogOut, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// 表示名の入力ルール
const displayNameSchema = z.object({
  displayName: z.string().trim().min(1, "表示名を入力してください"),
});

type DisplayNameFormValues = z.infer<typeof displayNameSchema>;

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("PinTripユーザー");
  const [message, setMessage] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const form = useForm<DisplayNameFormValues>({
    resolver: zodResolver(displayNameSchema),
    defaultValues: {
      displayName: "PinTripユーザー",
    },
  });

  // 表示名の保存（モック）
  const onSave = (values: DisplayNameFormValues) => {
    setDisplayName(values.displayName.trim());
    setMessage("表示名を保存しました。（モック）");
  };

  // ログアウト（モック）
  const onLogout = () => {
    setMessage("ログアウトボタンが押されました。実際のログアウト処理はまだありません。");
  };

  // アカウント削除（モック）
  const onDeleteAccount = () => {
    setIsDeleteDialogOpen(false);
    setMessage("削除操作を確認しました。実際のデータは削除されていません。");
  };

  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">設定</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          アカウントに関する設定を変更できます。
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-foreground">
          {message}
        </div>
      )}

      {/* 表示名の変更 */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <h2 className="text-lg font-semibold">表示名の変更</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            現在の表示名：{displayName}
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSave)} className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium">
              新しい表示名
            </label>
            <Input
              id="displayName"
              type="text"
              placeholder="表示名を入力"
              {...form.register("displayName")}
            />
            {form.formState.errors.displayName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.displayName.message}
              </p>
            )}
          </div>

          <Button type="submit">
            <Save />
            保存する
          </Button>
        </form>
      </section>

      {/* ログアウト */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <h2 className="text-lg font-semibold">ログアウト</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            現在のアカウントからログアウトします。
          </p>
        </div>

        <Button variant="outline" onClick={onLogout}>
          <LogOut />
          ログアウト
        </Button>
      </section>

      {/* アカウント削除 */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <h2 className="text-lg font-semibold">アカウント削除</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            アカウントと関連するデータを削除します。
          </p>
        </div>

        <Button
          variant="destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <Trash2 />
          アカウントを削除
        </Button>
      </section>

      {/* 削除確認ダイアログ */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              アカウントを削除しますか？
            </AlertDialogTitle>
            <AlertDialogDescription>
              アカウントを削除すると、自分の投稿、旅行プラン、
              画像がすべて削除されます。
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={onDeleteAccount}
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
