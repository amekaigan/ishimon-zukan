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

## v1.1 Fix 1: アウトライン強化(2026-MM-DD)

**変更箇所**: `ISHIMON_STYLE_DNA` 内のアートスタイル行

**Before:**
```
thick bold black outlines
```

**After:**
```
thick bold BLACK INK outlines, anime cel-shaded illustration style
```

**変更点**:
- `black` → `BLACK INK`(大文字 + インク追加 = 線がはっきり)
- `anime cel-shaded illustration style` を追加(画風を positive で明示)
- **NOT〜系の否定形は一切入れていない**(過剰制約による単調化リスクを回避)

**理由**:
2026-05-29 のテイスト分析で、BAD 11件中 6件(55%)の主因が「境界線が弱い・リアルなグラデーションになってる」と判明。アウトラインの positive 強化から始める。

**テスト結果**: [日付] にXX体生成
- GOOD: __ 件
- BAD: __ 件
- 前回比: __

**判定**: ☐ 採用 / ☐ 第二段階へ escalate / ☐ ロールバック

**気づき**:
- (テスト後にメモ)

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
