// 石モン図鑑：ゲーム画面（game/index.html）で使っている見た目だけを game/tw.css に書き出す設定。
// 以前は cdn.tailwindcss.com を読み込み、端末の中で毎回CSSを組み立てていた（重い）。v2.106.0 から書き出し済みCSSを使う。
// game/index.html が更新されると、GitHub Actions（.github/workflows/tailwind.yml）が自動で作り直す。
module.exports = {
  content: ['./game/index.html'],
  theme: { extend: {} },
  plugins: [],
};
