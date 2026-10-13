#!/usr/bin/env python3
"""石の図鑑ページを stones.py から作る。

使い方（リポジトリのルートで）:
    python3 tools/zukan/build.py

- /zukan/<id>.html を STONES ぶん作る（上書き）
- /zukan/index.html の一覧を、種類別に作り直す
- sitemap.xml と sitemap.html の図鑑の部分を作り直す
手書きページ（chert・quartz）は上書きしない。
"""
import html
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.dirname(__file__))
from stones import CATEGORIES, HANDMADE, RIVER_CAUTION, STONES  # noqa: E402

DATE = "2026-10-14"
DATE_JA = "2026年10月14日"
SITE = "https://ishimonzukan.com"
CAT = {k: (label, desc) for k, label, desc in CATEGORIES}

ALL = {k: dict(v, id=k) for k, v in HANDMADE.items()}
for s in STONES:
    ALL[s["id"]] = s


def esc(t):
    return html.escape(t, quote=True)


def link_or_text(sid, label=None):
    label = label or ALL[sid]["name"]
    return f'<a href="/zukan/{sid}.html">{label}</a>'


def caution_box(c):
    if not c:
        return ""
    title, items = c
    lis = "\n".join(f"        <li>{i}</li>" for i in items)
    return f"""    <div class="caution-box">
      <div class="caution-title">{title}</div>
      <ul>
{lis}
      </ul>
    </div>
"""


def paras(ps):
    return "\n".join(f"      <p>{p}</p>" for p in ps)


def page(s):
    sid, name, yomi = s["id"], s["name"], s["yomi"]
    cat_label = CAT[s["cat"]][0]
    url = f"{SITE}/zukan/{sid}.html"
    og_title = f"{s['title'].split('｜')[0]} | 石の図鑑 - 石モン図鑑"
    full_title = f"{s['title']} | 石の図鑑 - 石モン図鑑"
    h1_name = name if name == yomi else f"{name}（{yomi}）"

    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Article",
                "headline": s["title"].split("｜")[0],
                "description": s["desc"],
                "image": f"{SITE}/ogp_ishimon.png",
                "datePublished": DATE,
                "dateModified": DATE,
                "inLanguage": "ja",
                "author": {"@type": "Organization", "name": "石モン図鑑", "url": SITE + "/"},
                "publisher": {"@type": "Organization", "name": "石モン図鑑", "url": SITE + "/",
                              "logo": {"@type": "ImageObject", "url": f"{SITE}/icon-512.png"}},
                "mainEntityOfPage": url,
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "ホーム", "item": SITE + "/"},
                    {"@type": "ListItem", "position": 2, "name": "石の図鑑", "item": f"{SITE}/zukan/"},
                    {"@type": "ListItem", "position": 3, "name": name, "item": url},
                ],
            },
        ],
    }

    data_rows = "\n".join(f"      <tr><th>{k}</th><td>{v}</td></tr>" for k, v in s["data"])
    checks = "\n".join(
        f"      <li><b>{b}</b>{t}</li>" for b, t in s["checks"])
    check_after = f'    <div class="prose">\n      <p>{s["check_after"]}</p>\n    </div>\n' if s.get("check_after") else ""

    comp_rows = []
    for cname, look, point, cid in s["compare"]:
        label = link_or_text(cid, cname) if cid and cid in ALL and cid != sid else cname
        comp_rows.append(f"        <tr><th>{label}</th><td>{look}</td><td>{point}</td></tr>")
    comp_rows = "\n".join(comp_rows)

    t_head, t_paras, t_caution = s["trivia"]
    where_c = s["where_caution"] if "where_caution" in s else RIVER_CAUTION
    research = "\n".join(f"      <li><b>{b}</b>：{t}</li>" for b, t in s["research"])

    rel = []
    for rid in s["related"]:
        if rid in ALL:
            rel.append(f"      {link_or_text(rid)}")
        else:
            rel.append(f"      <span>{rid}（準備中）</span>")
    rel = "\n".join(rel)
    nav_next = s["related"][0]

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- SEO -->
<title>{esc(full_title)}</title>
<meta name="description" content="{esc(s['desc'])}">
<link rel="canonical" href="{url}">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- OGP -->
<meta property="og:title" content="{esc(og_title)}">
<meta property="og:description" content="{esc(s['lead'])}">
<meta property="og:type" content="article">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/ogp_ishimon.png">
<meta property="og:site_name" content="石モン図鑑">
<meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(og_title)}">
<meta name="twitter:description" content="{esc(s['lead'])}">
<meta name="twitter:image" content="{SITE}/ogp_ishimon.png">

<!-- 構造化データ -->
<script type="application/ld+json">
{json.dumps(ld, ensure_ascii=False, indent=2)}
</script>

<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-J4CZ7ZZST3"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-J4CZ7ZZST3');
</script>

<link rel="stylesheet" href="/common.css">
<link rel="stylesheet" href="/zukan/zukan.css">
</head>
<body>
<div class="container">

  <nav class="breadcrumb">
    <a href="/">ホーム</a> &rsaquo;
    <a href="/zukan/">石の図鑑</a> &rsaquo;
    {name}
  </nav>

  <header class="article-header">
    <div class="section-label-tag">🪨 石の図鑑 — {cat_label}</div>
    <h1 class="article-title">{h1_name}<br><span style="font-size:0.62em">{s['subtitle']}</span></h1>
    <div class="article-meta">石モン図鑑 / {DATE_JA}</div>
  </header>

  <!-- 写真（標本が届いたら戻す）：/images/zukan/{sid}.webp 4:3
  <figure class="stone-hero">
    <img src="/images/zukan/{sid}.webp" alt="{name}の標本" width="1200" height="900">
    <figcaption>{name}の標本（石モン図鑑 撮影）</figcaption>
  </figure>
  -->

  <p class="stone-lead">
    {s['lead']}
  </p>

  <table class="stone-data">
    <tbody>
{data_rows}
    </tbody>
  </table>

  <section class="zukan-section">
    <h2>{name}の見分け方</h2>
    <ul class="check-list">
{checks}
    </ul>
{check_after}
    <h3>似ている石との違い</h3>
    <table class="compare-table">
      <thead>
        <tr><th>石</th><th>見た目</th><th>見分けるポイント</th></tr>
      </thead>
      <tbody>
{comp_rows}
      </tbody>
    </table>
  </section>

  <section class="zukan-section">
    <h2>どうやってできたの？</h2>
    <div class="prose">
{paras(s['origin'])}
    </div>
  </section>

  <section class="zukan-section">
    <h2>{t_head}</h2>
    <div class="prose">
{paras(t_paras)}
    </div>
{caution_box(t_caution)}  </section>

  <section class="zukan-section">
    <h2>どこで見つかる？</h2>
    <div class="prose">
{paras(s['where'])}
    </div>
{caution_box(where_c)}  </section>

  <section class="zukan-section">
    <h2>自由研究にするなら</h2>
    <ul class="check-list">
{research}
    </ul>
  </section>

  <!-- この石を石モンにすると -->
  <section class="ishimon-card">
    <div class="ic-label">ISHIMON ZUKAN</div>
    <div class="ic-title">{name}を、石モンにしてみよう</div>
    <!-- 生成例（標本が届いたら戻す）：{sid}.webp → {sid}-mon.webp の2枚並び -->
    <p>石モン図鑑は、拾った石をスマホで撮ると、その石から世界にひとつのモンスター「石モン」が生まれるゲームです。石の色や形でタイプが決まり、{s['type_text']}</p>
    <p>同じ石でも、撮る時間帯で生まれる石モンが変わることも。見つけた石を、ぜんぶ石モンにして並べてみませんか。</p>
    <div class="cta-wrap">
      <a href="/game/" class="cta-btn">▶ 石モンにしてみる</a>
      <div class="cta-sub">無料・ブラウザだけで遊べます</div>
    </div>
  </section>

  <section class="zukan-section">
    <h2>ほかの石も見てみる</h2>
    <div class="related-links">
{rel}
    </div>
  </section>

  <div class="story-nav">
    <a href="/zukan/">
      <div class="nav-label">← 一覧へ</div>
      石の図鑑
    </a>
    <a href="/zukan/{nav_next}.html">
      <div class="nav-label">つぎに読む</div>
      {ALL[nav_next]['name']}
    </a>
  </div>

  <nav class="footer-nav">
    <a href="/">ホーム</a>
    <span class="sep">·</span>
    <a href="/zukan/">石の図鑑</a>
    <span class="sep">·</span>
    <a href="/about.html">石モン図鑑とは</a>
    <span class="sep">·</span>
    <a href="/privacy.html">プライバシーポリシー</a>
    <span class="sep">·</span>
    <a href="/terms.html">利用規約</a>
  </nav>

  <div class="meta-footer">石モン図鑑 / ishimonzukan.com</div>
</div>
</body>
</html>
"""


def ordered_ids():
    """一覧に出す順番：種類別、各種類の中はデータの順（手書きを先頭に）。"""
    out = {k: [] for k, _, _ in CATEGORIES}
    for k, v in HANDMADE.items():
        out[v["cat"]].append(k)
    for s in STONES:
        out[s["cat"]].append(s["id"])
    return out


def build_index():
    p = os.path.join(ROOT, "zukan", "index.html")
    src = open(p, encoding="utf-8").read()
    groups = ordered_ids()
    blocks = []
    for k, label, desc in CATEGORIES:
        cards = []
        for sid in groups[k]:
            st = ALL[sid]
            cards.append(f"""      <a class="stone-card" href="/zukan/{sid}.html">
        <div class="sc-thumb">🪨</div>
        <div class="sc-body">
          <div class="sc-name">{st['name']}</div>
          <div class="sc-desc">{st['card']}</div>
        </div>
      </a>""")
        blocks.append(f"""  <section id="{k}">
    <h2>{label}<span class="cat-desc">{desc}</span></h2>
    <div class="stone-grid">
{chr(10).join(cards)}
    </div>
  </section>""")
    body = "<!-- ZUKAN-LIST:BEGIN（tools/zukan/build.py が作る） -->\n" + "\n\n".join(blocks) + "\n  <!-- ZUKAN-LIST:END -->"
    if "<!-- ZUKAN-LIST:BEGIN" in src:
        src = re.sub(r"<!-- ZUKAN-LIST:BEGIN.*?<!-- ZUKAN-LIST:END -->", lambda m: body, src, flags=re.S)
    else:
        a = src.index("  <section>\n    <h2>河原で見つかる石</h2>")
        b = src.index("  </section>", a) + len("  </section>")
        src = src[:a] + "  " + body + src[b:]
    total = sum(len(v) for v in groups.values())
    src = re.sub(r'<p class="zukan-count">.*?</p>', f'<p class="zukan-count">いま {total} 種類</p>', src)
    open(p, "w", encoding="utf-8").write(src)


def build_sitemaps():
    groups = ordered_ids()
    ids = [i for k, _, _ in CATEGORIES for i in groups[k]]
    # sitemap.xml
    p = os.path.join(ROOT, "sitemap.xml")
    src = open(p, encoding="utf-8").read()
    src = re.sub(r"\s*<url>\s*<loc>https://ishimonzukan.com/zukan/[^<]+\.html</loc>.*?</url>", "", src, flags=re.S)
    urls = "".join(f"""
  <url>
    <loc>{SITE}/zukan/{i}.html</loc>
    <lastmod>{DATE}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>""" for i in ids)
    anchor = f"<loc>{SITE}/zukan/</loc>"
    a = src.index(anchor)
    b = src.index("</url>", a) + len("</url>")
    src = src[:b] + urls + src[b:]
    src = re.sub(r"(<loc>https://ishimonzukan.com/zukan/</loc>\s*<lastmod>)[^<]+", r"\g<1>" + DATE, src)
    open(p, "w", encoding="utf-8").write(src)
    # sitemap.html
    p = os.path.join(ROOT, "sitemap.html")
    src = open(p, encoding="utf-8").read()
    items = ["""      <li>
        <div class="link-row"><a class="page-link" href="/zukan/">石の図鑑 一覧</a></div>
        <p class="link-description">河原や海岸で拾える石を、1種類ずつ紹介。</p>
      </li>"""]
    for i in ids:
        items.append(f"""      <li>
        <div class="link-row"><a class="page-link" href="/zukan/{i}.html">{ALL[i]['name']}</a></div>
        <p class="link-description">{ALL[i]['card']}</p>
      </li>""")
    sec = """  <!-- 石の図鑑 -->
  <section class="section">
    <h2><span class="section-icon">🪨</span>石の図鑑</h2>
    <ul>
""" + "\n".join(items) + """
    </ul>
  </section>"""
    src = re.sub(r"  <!-- 石の図鑑 -->\n  <section class=\"section\">.*?</section>", lambda m: sec, src, flags=re.S)
    open(p, "w", encoding="utf-8").write(src)


def main():
    for s in STONES:
        open(os.path.join(ROOT, "zukan", f"{s['id']}.html"), "w", encoding="utf-8").write(page(s))
    build_index()
    build_sitemaps()
    print(f"built {len(STONES)} pages + index + sitemaps")


if __name__ == "__main__":
    main()
