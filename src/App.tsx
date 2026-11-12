export default function App() {
  return function TitleInput() {
    return (
      <div className="space-y-2">
        <h1>テスト</h1>
        <label htmlFor="title" className="text-sm font-medium">
          投稿タイトル
        </label>

        <input
          id="title"
          type="text"
          placeholder="例：京都旅行の思い出"
          required
          className="
          w-full rounded-lg border border-gray-300
          bg-white px-3 py-2 text-sm
          placeholder:text-gray-400
          focus-visible:outline-2
          focus-visible:outline-blue-500
          disabled:opacity-50
        "
        />
      </div>
    );
  };
}