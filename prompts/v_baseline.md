# Prompt Builder — v_baseline (2026-05-29)

Fix 1 適用前の状態。何かあったらここに戻す。

## 該当ファイル
`game/index.html` 内のプロンプト構築部分

## 該当バージョン
v2.17.0(2026-05-29 時点)

## ISHIMON_STYLE_DNA(全生成に自動付加されるブランドスタイル)

直近の改訂履歴(コード内コメントより):
> v6: 👍/👎評価の分析に基づき改訂(2026-05-18・v2.7.1)
> - 弱い画風アンカー(anime chibi style)を強いアンカー(Bikkuriman/Digimon)に
> - 輪郭を thick bold black outlines に強化(薄い輪郭の👎対策)
> - 塗りに matte を追加(写実的なつや塗りの👎対策)
> - 目を「2つ・左右対称」と明示(3大原因①対策)

```javascript
const ISHIMON_STYLE_DNA = [
  // 【体型】
  'cute monster character, original mascot, tiny 2-head-tall chibi baby form, big round head clearly separated from small body',
  // 【アートスタイル】強い画風アンカー＋太い黒輪郭＋マットなセル画塗り
  'Bikkuriman sticker style, Digimon anime style, cel-shaded, thick bold black outlines, flat matte cel-shading',
  // 【瞳】数を2つに明示・左右対称
  'exactly two large symmetrical shiny eyes (same size and color), white highlight',
  // 【背景・構図】
  'centered front pose, gradient background',
  // 【品質】
  'vibrant colors, no text, no watermark, kid-friendly',
].join(', ');
```

## buildMonPrompt 関数(プロンプト全体を組み立てる)

```javascript
const buildMonPrompt = (mon, options = {}) => {
  const typeMap = {
    '火': 'fire element, dark body with red-orange flame glow, ember crystals, fiery eyes',
    '水': 'water element, soft aqua blue fur, water droplet crystals, shimmering scales',
    '土': 'earth element, sandy brown textured body, multicolor gem studs, stone spikes',
    '電気': 'electric element, bright yellow body, lightning bolt markings, sparkling static aura',
    '空': 'sky element, fluffy light blue body, cloud wisps, rainbow crown, bunny-like ears',
    'ドラゴン': 'dragon element, purple-violet scales, curved horns, bat wings, iridescent crystal claws',
    '精霊': 'spirit element, soft pink-lavender translucent body, golden crown, magical sparkle aura',
  };
  const stageMap = {
    1: '2-head-tall chibi baby form, simple cute',
    2: '3-head-tall champion form, balanced proportions',
    3: '3.5-head-tall ultimate form, majestic crown',
  };
  // v6: 装飾語を1段おとなしく(2026-05-18・v2.7.1)
  //   セキガル(★2 'small crystals')が写実的なつや塗り＋宝石過剰で👎に。
  //   低〜中レアの装飾が強すぎたため、テーブル全体を1段階下げる。
  const rarityMap = {
    1: 'simple plain, no extra decoration',
    2: 'a few tiny crystal accents',
    3: 'small crystals',
    4: 'large crystals glow',
    5: 'gemstones magical sparkles',
  };

  // 時刻を入れて毎回違う絵柄に
  const now = new Date();
  const hour = now.getHours();
  const timeOfDay = hour < 6 ? 'dawn' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

  const parts = [
    ISHIMON_STYLE_DNA, // ★ 石モン図鑑スタイルDNA(ブランド統一)
    typeMap[mon.type] || typeMap['土'],
    stageMap[mon.stage] || stageMap[1],
    rarityMap[mon.rarity] || rarityMap[1],
    `${timeOfDay} atmosphere`,
  ];

  return parts.filter(Boolean).join(', ');
};
```

## 既知の課題(2026-05-29 のテイスト分析より)

GOOD 13件 / BAD 11件 を比較した結果、以下の問題を確認:

| # | 課題 | 影響範囲 | 対応 Fix |
|---|---|---|---|
| 1 | アウトラインが弱い(リアル絵調になる) | BAD 6/11件の主因 | Fix 1 |
| 2 | 顔比率の暴走(目3つ・目大きすぎ・顔大きすぎ) | BAD 3/11件 | Fix 2 |
| 3 | レア度→装飾量のロジック破綻(★5に small crystals) | BAD 2件以上 | Fix 3 |
| 4 | 精霊タイプの「卵形」問題 | BAD 4/11件(精霊系) | Fix 4 |
| 5 | 土タイプの個性化失敗(似た descriptor 固定) | 系統的問題 | Fix 5 |
| - | STYLE_DNA に baby form ハードコード(stage 2/3 と矛盾) | stage 2/3 新規生成時 | 別 Fix |

詳細は `prompts/prompt-revisions.md` を参照。

## ロールバック手順

何か問題が起きたら:
1. `game/index.html` を開く
2. Ctrl+F で `ISHIMON_STYLE_DNA` を探す
3. このファイルの「ISHIMON_STYLE_DNA」セクションのコードで上書き
4. buildMonPrompt も同様に必要なら戻す
