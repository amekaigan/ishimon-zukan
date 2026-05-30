## v_C: シズモンXX 時代へのフルロールバック (2026-05-30)

**変更箇所**: `ISHIMON_STYLE_DNA` 定数を削除 + `buildMonPrompt` 関数全体を旧構造に戻す

**経緯**:
- Fix 1(`anime cel-shaded illustration style` 追加)→ ロールバック後も「丸くて個性がない」問題が継続
- 観察フェーズの結果:Fix 1 だけでなく v6 全体の制約累積が個性消失の真犯人と判定
- シズモンXX 時代のプロンプトを精査 → 構造的に「縛らない設計」だったと発覚

**何が変わったか(主要な差分)**:

| 要素 | v6 era | シズモンXX 時代(復活) |
|---|---|---|
| 体型 | `tiny 2-head-tall chibi baby form, big round head clearly separated from small body` | 体型縛りなし(stage で表現) |
| 目 | `exactly two large symmetrical shiny eyes (same size and color)` | `big shiny anime eyes with two highlight dots` |
| 塗り | `flat matte cel-shading` | `cel-shaded illustration with thick black outlines` |
| 画風 | `Bikkuriman sticker style, Digimon anime style` | `Bikkuriman sticker style mixed with Digimon anime style` |
| ドラゴン | `purple-violet body, curved horns, defined arms and legs` | `horns and wings, purple scales, sharp claws, **fierce expression**` |
| 精霊 | `soft pink-lavender body, defined arms and legs` | `glowing halo, pink ethereal mist, floating sparkles` |
| stage 3 | `majestic crown` | `majestic crown, **royal regalia, divine presence**` |
| ★5 装飾 | `gemstones magical sparkles`(1要素) | `crown rainbow aura, divine sparkles, royal ornaments`(4要素) |
| 構図 | `centered front pose` | `centered front-facing pose, **full body visible**, magical particles` |
| 否定 | `no text, no watermark` | `no text, no logos, no watermark, **no humans**` |

**判定基準**:
- ✅ 個性ある石モンが復活 → 採用、新 v_baseline 化
- ❌ 別の問題が出る → さらにピンポイント Fix で対応

**テスト結果**: [日付] にXX体生成
- 「シズモンXX 級」の出現率: __ 
- 「丸いだけ」の出現率: __
- タイプ別個性の出方: __ 

**気づき**: (テスト後にメモ)

---

## v1.2 Fix 3: レア度ロジック再設計(2026-MM-DD)

**変更箇所**: `buildMonPrompt` 関数の `typeMap` と `rarityMap` を、`typeEssence` と `rarityDecor`(タイプ×レア度の2階層)に再構成

**設計思想**:
- typeMap に装飾(王冠など)が全レア度共通で入ってた → レア度差が出ない問題
- typeEssence: タイプの「核」のみ、全レア度共通
- rarityDecor[type][rarity]: タイプ×レア度ごとの装飾、★5 ほど豪華

**副次的修正**:
- 精霊の `translucent body` → `body` に変更(卵形問題対策)
- 全タイプに `defined arms and legs` を追加(輪郭明確化)
- 土と空はGOOD実績のシンプル版に統一(BAD多発の複雑版を捨てる)

**理由**:
2026-05-29 のテイスト分析で:
- レア度の差が見えない問題が判明
- 精霊タイプの「卵形」問題(BAD 4件)が判明
- 土タイプの個性化失敗(BAD 5件)が判明

**テスト結果**: [日付] にXX体生成
- GOOD: __ 件
- BAD: __ 件
- ★5の特別感: ☐ 出てる / ☐ 微妙

**判定**: ☐ 採用 / ☐ 部分採用(タイプ別調整) / ☐ ロールバック

**気づき**: (テスト後にメモ)

---
# 石モン プロンプト改訂履歴

このファイルは「なぜこの単語が入ってるか」を後で辿るための備忘録。
新しい改訂は **上に追加**(最新が一番上)。

ベースとなるプロンプト全文は `prompts/v_baseline.md` を参照。

---

## v1.1 Fix 1: アウトライン強化 (2026-MM-DD)

**変更**: `thick bold black outlines` → `thick bold BLACK INK outlines, anime cel-shaded illustration style`

**理由**:
2026-05-29 のテイスト分析で、BAD 11件中 6件(55%)の主因が「境界線が弱い・リアルなグラデーション」と判明。

**テスト結果**: 2026-05-30、5体生成
- GOOD: 3 件
- BAD: 2 件(うちアウトライン問題1件、別問題1件)
- **副次的影響**: ⚠️ 全体の個性低下を観察。「anime cel-shaded illustration style」が style anchor として強く効きすぎ、生成物が「anime風キャラ」に収束してる疑い。

**判定**: ❌ **ロールバック**(個性低下が許容できない)

**気づき**:
- アウトライン制御は弱く効くが、個性が犠牲になるトレードオフ
- 「過剰制約による単調化」リスクが現実化(a さんの当初予言が的中)
- 累積制約(v1〜v6)の重みも疑わしい → 将来 Fix C(根本見直し)候補

---

## v_baseline(2026-05-29 時点・v2.17.0)

詳細は `prompts/v_baseline.md` を参照。

ISHIMON_STYLE_DNA(直近の改訂は 2026-05-18・v2.7.1):
```
cute monster character, original mascot, tiny 2-head-tall chibi baby form, big round head clearly separated from small body, Bikkuriman sticker style, Digimon anime style, cel-shaded, thick bold black outlines, flat matte cel-shading, exactly two large symmetrical shiny eyes (same size and color), white highlight, centered front pose, gradient background, vibrant colors, no text, no watermark, kid-friendly
```

**既知の課題(Fix 待ち)**:
- アウトラインが弱い(BAD 55%の主因)→ **Fix 1 で対応**
- 顔比率の暴走(目3つ・目大きすぎ・顔大きすぎ)→ Fix 2 で対応
- レア度→装飾量のロジック破綻(★5に small crystals)→ Fix 3 で対応
- 精霊タイプの「卵形」問題 → Fix 4 で対応
- 土タイプの個性化失敗 → Fix 5 で対応
- 🐛 STYLE_DNA に baby form ハードコード(stage 2/3 と矛盾)→ 別 Fix で対応

---

## 進め方ルール

1. **1パッチごとに 5〜10生成テスト → 判定**
2. 改善した → 採用
3. 同じ or 微妙 → 第二段階に escalate(より強い表現)
4. 悪化した or 単調になった → **即ロールバック**(v_baseline.md から戻す)
5. 結果は必ずこのファイルに追記
