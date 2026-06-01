/* ===========================================================================
 * 石モン図鑑 — シェアカード描画 (Canvas API版)
 * ---------------------------------------------------------------------------
 * 役割: html-to-image(DOM撮影)に頼らず、Canvas 2D でカードを直接描く。
 *       iOSでの白飛び/画像欠けを根絶するための「描画」方式。
 *
 * 使い方 (index.html 側):
 *   const blob = await window.drawShareCard(cardData);  // PNG Blob を返す
 *   // あとは File 化して Web Share / ダウンロード
 *
 * cardData の形 (index.html がアプリのスコープから組み立てて渡す):
 * {
 *   name:         '石モンの名前',
 *   type:         { emoji:'🔥', name:'火', light:'#..', bg:'#..', dark:'#..' },
 *   rarity:       { value:5, color:'#FFD700', glow:'#FFAA00', label:'伝説' },
 *   stage:        { emoji:'🥚', label:'ベビー' },
 *   stats:        [ {label:'HP', val:120, color:'#52B788'}, ... 4個 ],
 *   imageDataUrl: 'data:image/...'  | null,
 *   originalPhoto:'data:image/...'  | null,
 *   description:  '説明文(任意)',
 *   cardId:       'ST02-FI5-XXXXXXXX',
 *   logoUrl:      'logo-white.png',
 * }
 * ======================================================================== */
(function () {
  'use strict';

  var FONT = "'M PLUS Rounded 1c', sans-serif";

  // --- 論理サイズ(CSSと同じ感覚のpx)。実出力は SCALE 倍で高精細に ---
  var W = 340;          // カード全体の幅(論理px)
  var SCALE = 3;        // 出力解像度倍率 → 1020px幅のPNG
  var CX = 16;          // 内容の左端
  var CW = W - CX * 2;  // 内容の幅 (= 画像の一辺)

  // レア度ラベルの略字(★の値で引く)。好みでここを書き換えればOK
  var RARITY_ABBR = { 5: 'SL', 4: 'SR', 3: 'R', 2: 'U', 1: 'N' };

  // ---------- 小道具 ----------
  function roundRect(ctx, x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // '#RRGGBB' + 透明度 → 'rgba(...)'。色名等はそのまま返す
  function withAlpha(color, a) {
    if (typeof color === 'string' && color.charAt(0) === '#') {
      var h = color.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      if (h.length >= 6) {
        var r = parseInt(h.slice(0, 2), 16);
        var g = parseInt(h.slice(2, 4), 16);
        var b = parseInt(h.slice(4, 6), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
      }
    }
    return color;
  }

  function loadImage(src) {
    return new Promise(function (resolve) {
      if (!src) return resolve(null);
      var im = new Image();
      if (src.indexOf('data:') !== 0) im.crossOrigin = 'anonymous';
      im.onload = function () { resolve(im); };
      im.onerror = function () { resolve(null); }; // 失敗してもnullで続行
      im.src = src;
    });
  }

  // object-fit: cover で矩形に描く(クリップは呼び出し側で)
  function drawCover(ctx, img, x, y, w, h) {
    var ir = img.width / img.height, tr = w / h, sw, sh, sx, sy;
    if (ir > tr) { sh = img.height; sw = sh * tr; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = sw / tr; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  // 文字を maxWidth に収まる行へ折り返す(日本語は1文字ずつ)。maxLines超過は … で省略
  function wrapText(ctx, text, maxWidth, maxLines) {
    var chars = Array.from(String(text || ''));
    var lines = [], cur = '', truncated = false, i;
    for (i = 0; i < chars.length; i++) {
      var ch = chars[i];
      if (ch === '\n') {
        lines.push(cur); cur = '';
        if (lines.length >= maxLines) { truncated = i < chars.length - 1; break; }
        continue;
      }
      if (ctx.measureText(cur + ch).width > maxWidth && cur) {
        lines.push(cur); cur = ch;
        if (lines.length >= maxLines) { cur = ''; truncated = true; break; }
      } else { cur += ch; }
    }
    if (cur && lines.length < maxLines) lines.push(cur);
    // 行が残っていた(=切り捨て発生)なら最後の行を … 付きに調整
    if (truncated && lines.length) {
      var last = lines[lines.length - 1];
      while (last && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
      lines[lines.length - 1] = last + '…';
    }
    return lines;
  }

  // ---------- バッジ(丸ピル) ----------
  function drawPill(ctx, text, x, y, opt) {
    ctx.font = (opt.weight || 900) + ' ' + opt.size + 'px ' + FONT;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    var padX = opt.padX != null ? opt.padX : 9;
    var w = ctx.measureText(text).width + padX * 2;
    var h = opt.h || (opt.size + 8);
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = opt.bg; ctx.fill();
    if (opt.border) { ctx.lineWidth = opt.borderW || 1.5; ctx.strokeStyle = opt.border; ctx.stroke(); }
    ctx.fillStyle = opt.color;
    ctx.fillText(text, x + padX, y + h / 2 + 0.5);
    return { w: w, h: h };
  }

  // ---------- 縁取り文字(背景の丸枠なし・視認性確保) ----------
  // shadow(任意のグロー) → 太い縁取り → 本体塗り の順で重ね、どんな画像の上でも読めるように
  function outlinedText(ctx, text, x, y, o) {
    ctx.font = (o.weight || 900) + ' ' + o.size + 'px ' + FONT;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.baseline || 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    // 影/グロー(本体と同じ位置に1回置いてから上を塗り直す)
    ctx.save();
    ctx.shadowColor = o.glow || 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = o.shadowBlur != null ? o.shadowBlur : 4;
    ctx.fillStyle = o.fill;
    ctx.fillText(text, x, y);
    ctx.restore();
    // 縁取り
    ctx.lineWidth = o.strokeW != null ? o.strokeW : 3;
    ctx.strokeStyle = o.stroke || 'rgba(0,0,0,0.9)';
    ctx.strokeText(text, x, y);
    // 本体
    ctx.fillStyle = o.fill;
    ctx.fillText(text, x, y);
  }

  // ===========================================================================
  // メイン
  // ===========================================================================
  window.drawShareCard = async function (data) {
    // フォントをcanvasで使えるよう確実に読み込む(未対応ブラウザは握りつぶし)
    try {
      if (document.fonts && document.fonts.load) {
        await Promise.all([
          document.fonts.load("900 26px " + FONT),
          document.fonts.load("700 11px " + FONT),
          document.fonts.load("400 10px " + FONT),
        ]);
        if (document.fonts.ready) await document.fonts.ready;
      }
    } catch (_) {}

    var t = data.type || {}, r = data.rarity || {}, stage = data.stage || {};
    var stats = data.stats || [];
    var hasPhoto = !!data.originalPhoto;
    var hasDesc = !!(data.description && data.description.trim());

    // 画像を先読み(失敗してもnull)
    var imgs = await Promise.all([
      loadImage(data.imageDataUrl),
      loadImage(data.originalPhoto),
      loadImage(data.logoUrl),
    ]);
    var monImg = imgs[0], photoImg = imgs[1], logoImg = imgs[2];

    // --- レイアウト計測 ---
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    var imageY = 22, imageSize = CW;
    var afterImage = imageY + imageSize;
    var statsY = afterImage + 8;
    var statsH = hasPhoto ? 92 : 80;
    var statsEnd = statsY + statsH;

    var descLines = [];
    var descY = statsEnd + 8, descH = 0;
    if (hasDesc) {
      ctx.font = '700 10px ' + FONT; // 計測用
      descLines = wrapText(ctx, data.description.trim(), CW - 20, 3);
      descH = 14 + descLines.length * 15; // padding(7*2) + 行
    }

    var footerY = (hasDesc ? descY + descH : statsEnd) + 10;
    var footerH = 34;
    var H = footerY + footerH + 16; // 下マージン

    // --- 本番サイズ確定(ここでcontextはクリアされる) ---
    canvas.width = Math.round(W * SCALE);
    canvas.height = Math.round(H * SCALE);
    ctx.scale(SCALE, SCALE);
    ctx.textBaseline = 'alphabetic';

    // ===== 背景グラデ(タイプ色) =====
    var grad = ctx.createLinearGradient(W, 0, 0, H);
    grad.addColorStop(0, t.light || '#888');
    grad.addColorStop(0.5, t.bg || '#555');
    grad.addColorStop(1, t.dark || '#222');
    roundRect(ctx, 2.5, 2.5, W - 5, H - 5, 18);
    ctx.fillStyle = grad; ctx.fill();

    // ===== 内側の金枠(薄) =====
    roundRect(ctx, 8, 8, W - 16, H - 16, 12);
    ctx.lineWidth = 2; ctx.strokeStyle = withAlpha(r.color || '#FFD700', 0.7); ctx.stroke();

    // ===== 石モン画像エリア(角丸+金枠) =====
    ctx.save();
    roundRect(ctx, CX, imageY, imageSize, imageSize, 10);
    ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(CX, imageY, imageSize, imageSize);
    if (monImg) {
      drawCover(ctx, monImg, CX, imageY, imageSize, imageSize);
    } else {
      ctx.font = '80px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(t.emoji || '🪨', CX + imageSize / 2, imageY + imageSize / 2);
      ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();
    // 画像の金枠
    roundRect(ctx, CX, imageY, imageSize, imageSize, 10);
    ctx.lineWidth = 3; ctx.strokeStyle = '#FFD700'; ctx.stroke();

    // --- タイプ/段階バッジ(画像左上・縁取り文字・丸枠なし) ---
    var bx = CX + 14, byType = imageY + 26, byStage = byType + 19;
    outlinedText(ctx, (t.emoji || '') + ' ' + (t.name || ''), bx, byType,
      { size: 14, fill: '#ffffff', stroke: t.dark || 'rgba(0,0,0,0.9)', strokeW: 3.5, glow: 'rgba(0,0,0,0.85)', shadowBlur: 5 });
    outlinedText(ctx, (stage.emoji || '') + ' ' + (stage.label || ''), bx, byStage,
      { size: 12, fill: '#FFE08A', stroke: 'rgba(0,0,0,0.92)', strokeW: 3.5, glow: 'rgba(0,0,0,0.85)', shadowBlur: 5 });

    // --- 名前オーバーレイ(画像下・縁取り+影) ---
    var name = String(data.name || '');
    var nameSize = 26;
    ctx.font = '900 ' + nameSize + 'px ' + FONT;
    while (ctx.measureText(name).width > imageSize - 24 && nameSize > 14) {
      nameSize -= 1; ctx.font = '900 ' + nameSize + 'px ' + FONT;
    }
    var ncx = CX + imageSize / 2, ny = imageY + imageSize - 14;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#fff'; ctx.fillText(name, ncx, ny);
    ctx.restore();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5; ctx.strokeStyle = t.dark || '#000';
    ctx.strokeText(name, ncx, ny);
    ctx.fillStyle = '#fff'; ctx.fillText(name, ncx, ny);

    // ===== ステータスパネル + 元画像 =====
    var photoW = 82;
    var panelW = hasPhoto ? (CW - 8 - photoW) : CW;
    // パネル背景
    roundRect(ctx, CX, statsY, panelW, statsH, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = r.color || '#FFD700'; ctx.stroke();
    // 4行
    var padX = 10, padY = 9;
    var rowsTop = statsY + padY, rowsH = statsH - padY * 2, slot = rowsH / 4;
    var labelW = 26, valW = 26, gap = 6;
    var barX = CX + padX + labelW + gap;
    var barRight = CX + panelW - padX - valW - gap;
    var barW = barRight - barX;
    var maxVal = 180;
    stats.forEach(function (s) { if (s.val > maxVal) maxVal = s.val; });
    stats.slice(0, 4).forEach(function (s, i) {
      var cy = rowsTop + slot * i + slot / 2;
      // ラベル
      ctx.font = '900 10px ' + FONT; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFD700';
      ctx.fillText(s.label, CX + padX, cy);
      // バー(下地)
      var barH = 5, barY = cy - barH / 2;
      roundRect(ctx, barX, barY, barW, barH, barH / 2);
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fill();
      // バー(色)
      var fw = Math.max(0, Math.min(1, s.val / maxVal)) * barW;
      if (fw > 0) {
        roundRect(ctx, barX, barY, Math.max(fw, barH), barH, barH / 2);
        ctx.fillStyle = s.color; ctx.fill();
      }
      // 数値
      ctx.font = '900 11px ' + FONT; ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.fillText(String(s.val), CX + panelW - padX, cy);
    });
    ctx.textBaseline = 'alphabetic';

    // 元画像サムネ
    if (hasPhoto) {
      var px = CX + panelW + 8;
      roundRect(ctx, px, statsY, photoW, statsH, 8);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = r.color || '#FFD700'; ctx.stroke();
      var ip = 4, isz = photoW - ip * 2;
      ctx.save();
      roundRect(ctx, px + ip, statsY + ip, isz, isz, 4);
      ctx.clip();
      if (photoImg) drawCover(ctx, photoImg, px + ip, statsY + ip, isz, isz);
      else { ctx.fillStyle = '#eee'; ctx.fillRect(px + ip, statsY + ip, isz, isz); }
      ctx.restore();
      ctx.font = '900 8px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#5A1A00';
      ctx.fillText('元画像', px + photoW / 2, statsY + ip + isz + (statsH - ip - isz) / 2);
      ctx.textBaseline = 'alphabetic';
    }

    // ===== 説明文 =====
    if (hasDesc) {
      roundRect(ctx, CX, descY, CW, descH, 10);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
      ctx.setLineDash([4, 3]); ctx.lineWidth = 1;
      ctx.strokeStyle = withAlpha('#FFD700', 0.5); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '700 10px ' + FONT; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#fff';
      descLines.forEach(function (ln, i) {
        ctx.fillText(ln, CX + 10, descY + 7 + 11 + i * 15);
      });
    }

    // ===== フッター(ロゴ / ID+注記) =====
    var fcy = footerY + footerH / 2;
    if (logoImg) {
      var lh = 32, lw = logoImg.width * (lh / logoImg.height);
      if (lw > 150) { lw = 150; lh = logoImg.height * (lw / logoImg.width); }
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 2; ctx.shadowOffsetY = 1;
      ctx.drawImage(logoImg, CX, fcy - lh / 2, lw, lh);
      ctx.restore();
    } else {
      ctx.font = '900 15px ' + FONT; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff'; ctx.fillText('石モン図鑑', CX, fcy);
      ctx.textBaseline = 'alphabetic';
    }
    // 右: ID + 注記
    ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.font = "900 11px monospace";
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 2; ctx.shadowOffsetY = 1;
    ctx.fillStyle = '#FFD700';
    ctx.fillText(String(data.cardId || ''), W - CX, fcy - 2);
    ctx.restore();
    ctx.font = '700 7px ' + FONT;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('※画像はAI生成 / 元画像から作成', W - CX, fcy + 11);

    // ===== 四隅の金角飾り =====
    var co = 10, cs = 18;
    ctx.strokeStyle = r.color || '#FFD700'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    function corner(cxp, cyp, dx, dy) {
      ctx.beginPath();
      ctx.moveTo(cxp + dx * cs, cyp);
      ctx.lineTo(cxp, cyp);
      ctx.lineTo(cxp, cyp + dy * cs);
      ctx.stroke();
    }
    corner(co, co, 1, 1);
    corner(W - co, co, -1, 1);
    corner(co, H - co, 1, -1);
    corner(W - co, H - co, -1, -1);
    ctx.lineCap = 'butt';

    // ===== 外枠(レア色・太) =====
    roundRect(ctx, 2.5, 2.5, W - 5, H - 5, 18);
    ctx.lineWidth = 5; ctx.strokeStyle = r.color || '#FFD700'; ctx.stroke();

    // ===== ★レア度(上部中央・内側の枠線の上・縁取り文字・丸枠なし) — 最後に重ねる =====
    var stars = '★'.repeat(Math.max(0, Math.min(5, r.value || 0)));
    var abbr = RARITY_ABBR[r.value] || String(r.label || '');
    var starSize = (r.value >= 4) ? 16 : 15, abbrSize = 14, rGap = 8;
    ctx.font = '900 ' + starSize + 'px ' + FONT;
    var starW = ctx.measureText(stars).width;
    ctx.font = '900 ' + abbrSize + 'px ' + FONT;
    var abbrW = abbr ? ctx.measureText(abbr).width : 0;
    var totalW = starW + (abbr ? rGap + abbrW : 0);
    var gx = (W - totalW) / 2, gy = 12; // 内側の枠線(y=8)の上あたり
    // 星(レア色・グロー付き)
    outlinedText(ctx, stars, gx, gy, {
      size: starSize, fill: r.color || '#FFD700', stroke: 'rgba(0,0,0,0.95)', strokeW: 4,
      glow: withAlpha(r.glow || r.color || '#FFD700', 0.95), shadowBlur: 8,
      align: 'left', baseline: 'middle',
    });
    // 略字(白)
    if (abbr) {
      outlinedText(ctx, abbr, gx + starW + rGap, gy, {
        size: abbrSize, fill: '#ffffff', stroke: 'rgba(0,0,0,0.95)', strokeW: 4,
        glow: 'rgba(0,0,0,0.9)', shadowBlur: 6, align: 'left', baseline: 'middle',
      });
    }
    ctx.textBaseline = 'alphabetic';

    // ===== 出力(PNG Blob) =====
    return await new Promise(function (resolve, reject) {
      if (canvas.toBlob) {
        canvas.toBlob(function (blob) {
          if (blob) resolve(blob);
          else reject(new Error('toBlob returned null'));
        }, 'image/png');
      } else {
        // 古いSafari等のフォールバック: dataURL → Blob
        try {
          var durl = canvas.toDataURL('image/png');
          var bin = atob(durl.split(',')[1]);
          var len = bin.length, arr = new Uint8Array(len);
          for (var i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
          resolve(new Blob([arr], { type: 'image/png' }));
        } catch (e) { reject(e); }
      }
    });
  };
})();
