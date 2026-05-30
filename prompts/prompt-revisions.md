# 石モン プロンプト改訂履歴

このファイルは「なぜこの単語が入ってるか」を後で辿るための備忘録。
新しい改訂は **上に追加**(最新が一番上)。

ベースとなるプロンプト全文は `prompts/v_baseline.md` を参照。
廃止した v6 era の詳細学習記録は `prompts/v6era_archive.md` を参照。

---

## v_C: シズモンXX 時代へのフルロールバック (2026-05-30 / v2.17.2)

**変更箇所**: `ISHIMON_STYLE_DNA` 定数を削除 + `buildMonPrompt` 関数全体をシズモンXX 時代の旧構造に戻す

**経緯**:
- 2026-05-29 にテイスト分析(GOOD 13件 / BAD 11件)
- Fix 1 試行 → 個性低下を観察 → ロールバック
- 観察フェーズで「丸くて個性のない石モン量産」状態を a さんが指摘
- シズモンXX 時代の旧プロンプトを精査 → 構造的に「縛らない設計」だったと発覚
- v6 全体の制約累積が真犯人と判定 → 完全ロールバック決行

**主要な差分**:

| 要素 | v6 era(廃止) | シズモンXX 時代(復活) |
|---|---|---|
| 体型 | `tiny 2-head-tall chibi baby form, big round head clearly separated from small body` | 体型縛りなし(stage で表現) |
| 目 | `exactly two large symmetrical shiny eyes (same size and color)` | `big shiny anime eyes with two highlight dots` |
| 塗り | `flat matte cel-shading` | `cel-shaded illustration with thick black outlines` |
| 画風 | `Bikkuriman sticker style, Digimon anime style`(強アンカー) | `Bikkuriman sticker style mixed with Digimon anime style`(緩い組合せ) |
| ドラゴン | `purple-violet body, curved horns, defined arms and legs` | `horns and wings, purple scales, sharp claws, **fierce expression**` |
| 精霊 | `soft pink-lavender body, defined arms and legs` | `**glowing halo, pink ethereal mist, floating sparkles**` |
| stage 3 | `majestic crown` | `majestic crown, **royal regalia, divine presence**` |
| ★5 装飾 | `gemstones magical sparkles`(1要素) | `crown rainbow aura, divine sparkles, royal ornaments`(4要素) |
| 構図 | `centered front pose` | `centered front-facing pose, **full body visible**, magical particles` |
| 否定 | `no text, no watermark` | `no text, no logos, no watermark, **no humans**` |

**理由**:
v6 で追加した制約(big round head, exactly two symmetrical eyes, flat matte cel-shading 等)が AI の創造的余白を奪い、「丸くて個性のない石モン」を量産する原因と判明。

シズモンXX 時代のプロンプトは「**雰囲気は強く、形は緩く**」の設計思想で、AI に余白を残してた。

**テスト結果**: [日付] にXX体生成
- 「シズモンXX 級」の出現率: __ 
- 「丸いだけ」の出現率: __ 
- タイプ別個性の出方: __ 

**判定**: ☐ 採用(新 v_baseline に昇格) / ☐ 部分問題あり(ピンポイント Fix を1つだけ追加) / ☐ ロールバック

**気づき**: (テスト後にメモ)

---

## v1.1 Fix 1: アウトライン強化(2026-05-30、ロールバック済)

**変更箇所**: `ISHIMON_STYLE_DNA` 内のアートスタイル行

**Before:**
```
thick bold black outlines
```

**After (適用試行):**
```
thick bold BLACK INK outlines, anime cel-shaded illustration style
```

**理由**:
2026-05-29 のテイスト分析で、BAD 11件中 6件(55%)の主因が「境界線が弱い・リアルなグラデーション」と判明。

**テスト結果**: 2026-05-30、5体生成
- GOOD: 3 件
- BAD: 2 件(うちアウトライン問題1件、別問題1件)
- 副次的影響: ⚠️ 全体の個性低下を観察。`anime cel-shaded illustration style` が style anchor として強く効きすぎ、生成物が「anime風キャラ」に収束してる疑い。

**判定**: ❌ **ロールバック**(個性低下が許容できない)

**気づき**:
- アウトライン制御は弱く効くが、個性が犠牲になるトレードオフ
- 「過剰制約による単調化」リスクが現実化(a さんの当初予言が的中)
- 累積制約(v1〜v6)の重みも疑わしい → 後に v_C(累積制約の根本見直し)に発展

---

## v_baseline (2026-05-29 時点・v2.17.0)

詳細は `prompts/v_baseline.md` を参照。

ISHIMON_STYLE_DNA(直近の改訂は 2026-05-18・v2.7.1):
```
cute monster character, original mascot, tiny 2-head-tall chibi baby form, big round head clearly separated from small body, Bikkuriman sticker style, Digimon anime style, cel-shaded, thick bold black outlines, flat matte cel-shading, exactly two large symmetrical shiny eyes (same size and color), white highlight, centered front pose, gradient background, vibrant colors, no text, no watermark, kid-friendly
```

**既知の課題(Fix 待ちだった)→ v_C で構造ごと廃止**:
- アウトラインが弱い(BAD 55%の主因)→ Fix 1 試行→ロールバック
- 顔比率の暴走(目3つ・目大きすぎ・顔大きすぎ)→ v_C で構造変更により対応
- レア度→装飾量のロジック破綻(★5に small crystals)→ v_C で旧 rarityMap 復活により対応
- 精霊タイプの「卵形」問題 → v_C で旧 typeMap(`glowing halo, mist, sparkles`)により対応
- 土タイプの個性化失敗 → v_C で対応(旧 `rocky textured body, brown gray stone, mossy patches`)
- 🐛 STYLE_DNA に baby form ハードコード(stage 2/3 と矛盾)→ v_C で ISHIMON_STYLE_DNA 撤去により解消

---

## 進め方ルール

1. **1パッチごとに 5〜10生成テスト → 判定**
2. 改善した → 採用
3. 同じ or 微妙 → 第二段階に escalate(より強い表現)
4. 悪化した or 単調になった → **即ロールバック**(v_baseline.md から戻す)
5. 結果は必ずこのファイルに追記

## v_C で得た追加ルール

6. **「制約を足す」前に「制約を引く」を試す** — v6 で制約を足し続けた結果が個性消失。逆方向も検討する。
7. **「雰囲気は強く、形は緩く」** — 形を縛る言葉(round, tall, separated, symmetrical 等)は副作用が大きい。
8. **アーカイブを残す** — 廃止したプロンプトは `prompts/v6era_archive.md` のような形で履歴を残す。
