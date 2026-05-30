# v6 era プロンプト アーカイブ (2026-05-18 〜 2026-05-30)

このファイルは**学びを捨てない**ための記録。
v_C(2026-05-30、v2.17.2)で全廃止になった v6 era プロンプトの実態と、観察した効果を残す。

**今後、似たような「制約を足して制御したい」誘惑に駆られたら、まずここを読み返すこと。**

---

## 1. なぜこのファイルがあるか

2026-05-18(v2.7.1)に v6 改訂として複数の制約を ISHIMON_STYLE_DNA に追加。
2026-05-29 のテイスト分析で「丸くて個性のない石モン」が量産されてることが判明。
2026-05-30、シズモンXX 時代のプロンプトに完全ロールバック(v_C / v2.17.2)。

**12日間の実験で得た教訓を、ここに固定する。**

---

## 2. v6 era プロンプト全文(廃止時点)

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

// buildMonPrompt 関数内に Fix 3 (typeEssence + rarityDecor) も適用済みだった
const typeEssence = {
  '火': 'fire element, dark body with red-orange flame glow, defined arms and legs',
  '水': 'water element, soft aqua blue body, defined arms and legs',
  '土': 'earth element, brown rocky body, defined arms and legs',
  '電気': 'electric element, bright yellow body, defined arms and legs',
  '空': 'sky element, sky blue body, defined arms and legs',
  'ドラゴン': 'dragon element, purple-violet body, curved horns, defined arms and legs',
  '精霊': 'spirit element, soft pink-lavender body, defined arms and legs',
};

const rarityDecor = {
  '火': { 1: '', 2: 'small ember spark accents', 3: 'ember crystals, fiery eyes', 4: 'ember crystals, fiery eyes, flame aura', 5: 'large ember crystals, blazing fiery eyes, full flame aura, fire crown of flames' },
  '水': { 1: '', 2: 'tiny water droplet accents', 3: 'water droplet crystals', 4: 'water droplet crystals, shimmering scales', 5: 'large water droplet crystals, iridescent scales, flowing water aura, blue gem crown' },
  '土': { 1: '', 2: 'small moss accents', 3: 'moss pebbles, small stone spikes', 4: 'moss pebbles, stone spikes, small crystals on body', 5: 'mossy stone spikes, large crystals embedded in body, earthen crown of stones' },
  '電気': { 1: '', 2: 'small spark accents', 3: 'lightning bolt markings', 4: 'lightning bolt markings, sparkling static aura', 5: 'bold lightning bolt markings, intense static aura, electric crown of energy' },
  '空': { 1: '', 2: 'small cloud accents', 3: 'cloud fluffy wings', 4: 'cloud fluffy wings, sky aura', 5: 'cloud fluffy wings, expansive sky aura, rainbow halo, cloud crown' },
  'ドラゴン': { 1: '', 2: 'small scale accents', 3: 'iridescent scales, small bat wings', 4: 'iridescent scales, bat wings, crystal claws', 5: 'ornate iridescent scales, large bat wings, crystal claws, dragon crown of horns and gems' },
  '精霊': { 1: '', 2: 'small sparkle accents', 3: 'small golden tiara, light sparkle aura', 4: 'golden crown, magical sparkle aura', 5: 'ornate golden crown, ethereal wings, multi-layered magical sparkle aura, glowing gemstone accents' },
};

const stageMap = {
  1: '2-head-tall chibi baby form, simple cute',
  2: '3-head-tall champion form, balanced proportions',
  3: '3.5-head-tall ultimate form, majestic crown',
};
```

---

## 3. キーワード別:何を狙って、何が起きたか

### 🔴 個性消失の主犯(これらは AI に「丸くて画一的に作って」と命令していた)

| キーワード | 当初の意図 | 観察された効果 | 評価 |
|---|---|---|---|
| `tiny 2-head-tall chibi baby form` | ベイビー段階を明示 | 全部「小さい」になり、stage 3 の「majestic」感が出ない | ❌ 矛盾 |
| `big round head clearly separated from small body` | 頭身比率の明示 | 全部「丸い頭」になり、シルエットが画一化 | ❌ **元凶** |
| `exactly two large symmetrical shiny eyes (same size and color)` | 目を3つ問題への対策 | 全部の目が「同じ大きさ・同じ色・対称」になり表情差が消える | ❌ 強すぎ |
| `flat matte cel-shading` | 写実的なつや塗りの抑止 | 立体感がなくなり「平坦な絵」に | ❌ |
| `simple cute` (stage 1) | ベイビーらしさ | AI が「simple」を真に受けて装飾を省略 | ❌ 直接的な悪 |
| `defined arms and legs` | 精霊の卵形問題対策 | 全部が「ハッキリした手足」になり、ふんわり系が消える | ❌ 副作用大 |

### 🟡 効果が薄かったもの(あってもなくても変わらない)

| キーワード | 評価 |
|---|---|
| `Bikkuriman sticker style, Digimon anime style`(カンマ区切り強アンカー) | 強アンカーすぎて旧の「mixed with」形のほうが自由度高い |
| `thick bold black outlines`(BOLD 強調) | 旧の `thick black outlines` でも十分効く |
| `white highlight` | 目の表現の一部、効きが弱い |

### 🟢 typeMap の縮小化(これも犯人)

v6 で typeMap が**雰囲気を描く語**から**形容詞+body 構造**に変わった:

| タイプ | v6 era(廃止) | シズモンXX 時代(復活) |
|---|---|---|
| 火 | `fire element, dark body with red-orange flame glow, ember crystals, fiery eyes` | `fire element with flame body, glowing red-orange aura, ember sparks` |
| ドラゴン | `dragon element, purple-violet body, curved horns, bat wings, iridescent crystal claws` | `dragon element with horns and wings, purple scales, sharp claws, **fierce expression**` |
| 精霊 | `spirit element, soft pink-lavender body, golden crown, magical sparkle aura` | `spirit element with glowing halo, **pink ethereal mist**, floating sparkles` |

**鍵となる差**:
- v6 era は「形容詞 + body」で**形を縛る**
- シズモンXX 時代は「雰囲気 + 効果」で**世界観を描く**
- `fierce expression` `ethereal mist` `wind swirls` のような雰囲気語が消えたのが致命的

### 🟢 stage 3 の縮小化

v6 stage 3: `3.5-head-tall ultimate form, majestic crown`
旧 stage 3: `3.5-head-tall ultimate form, majestic crown, **royal regalia, divine presence**`

→ `royal regalia, divine presence` が消えたのが、シズモンXX 級の「王様感」が出なくなった理由。

### 🟢 ★5 装飾の貧弱化

v6 ★5: `gemstones magical sparkles`(1要素)
旧 ★5: `crown rainbow aura, divine sparkles, royal ornaments`(4要素)

→ ★5 が「☆☆☆☆☆ でんせつ」のオーラを出せなくなった。

---

## 4. テイスト分析の結果(2026-05-29〜30)

### GOOD サンプル傾向
- 火 / ドラゴン:typeMap に強い視覚アンカー(炎・鱗・ツノ・爪)が残ってたので救われた
- ★5 アルティメット:stage 3 の装飾が強かったので個性が出た(ベイビー時の画像は救われない)

### BAD サンプル傾向
- 空 / 土 / 電気 / 精霊(★3-4ベイビー):typeMap に弱い視覚アンカーしかない → `body` + `big round head` の縛りに負ける → 「丸いだけ」になる
- 精霊の卵形問題:`translucent body` が blob-like 表現を促した

### a さんの言葉
> 「丸い印象しかない」
> 「何の装飾もない丸い印象しかない」
> 「典型的な丸いだけの石モン」
> 「シズモンXX時代に比べて丸くつまらなくなった」

---

## 5. 教訓(将来の自分への遺言)

### 教訓1: 「制約を足す」は罠
AI 画像生成で「これも明示しよう」「これも縛ろう」と思った瞬間、それは罠の入口。
1つの constraint は微妙な影響しか持たないが、**累積すると AI の創造的余白が消える**。
特に「形」を縛る言葉(round, tall, separated, symmetrical 等)は危険。

### 教訓2: 「縛らない設計」のほうが効く
シズモンXX 時代の typeMap は「halo / mist / wind / fierce expression」など**雰囲気で描く**。
形を縛らないので、AI が seed ごとに違う body を作れる → 個性が出る。
**「雰囲気は強く、形は緩く」が黄金律**。

### 教訓3: NOT 系の否定は最後の手段
「これダメ」「あれダメ」を盛ると、AI は安全な平均値に逃げる。
positive な「これがいい」表現で行きたい風景を描く方が、結果が良い。

### 教訓4: 検証は「同じ条件 + サンプル数」で
今回 GOOD 13件 / BAD 11件 で十分な傾向が見えた。
一発生成で判断せず、**最低 10件は集めてから**改善判断する習慣を持つ。

### 教訓5: バックアップは命綱
prompts/v_baseline.md を作って正解だった。ロールバックという選択肢があるからこそ、
「実験」が安全に行える。**改訂前に必ずバックアップ、改訂後に必ず観察**。

---

## 6. 関連ファイル

- `prompts/v_baseline.md` — ロールバック可能な「直近の安全状態」
- `prompts/prompt-revisions.md` — プロンプト改訂の時系列ログ
- `docs/ARCHITECTURE.md` — 全体仕様書

このアーカイブを上書きしないこと。あくまで**ヒストリカルレコード**。
