// game/index.html の中のゲーム本体（JSX）を、ふつうのJSに変換して game/app.js に書き出す。
// iPhoneの中で変換すると重く、メモリ不足でページが落ちることがあるため（v2.109.0〜）。
// 先頭に「どの版のソースから作ったか」の印（ISHIMON-KEY）を入れ、
// ページ側は印が一致したときだけ使う（一致しなければ従来どおり端末内で変換）。
const fs = require('fs');
const path = require('path');
const Babel = require('@babel/standalone'); // ページ側と同じ 7.25.6 を使う（ワークフローで指定）

const file = path.join(__dirname, '..', '..', 'game', 'index.html');
const html = fs.readFileSync(file, 'utf8');
const OPEN = '<script type="text/x-ishimon-jsx" id="ishimon-app-src">';
const i = html.indexOf(OPEN);
if (i < 0) throw new Error('ゲーム本体のscriptタグが見つかりません');
const start = i + OPEN.length;
const end = html.indexOf('</script', start);
// ブラウザは改行コードを \n にそろえて読むので、それに合わせる
const src = html.slice(start, end).replace(/\r\n?/g, '\n');

// ページ側の hash() と同じ計算（変えるときは両方そろえること）
function hash(s) { let x = 2166136261; for (let k = 0; k < s.length; k++) { x ^= s.charCodeAt(k); x = Math.imul(x, 16777619); } return (x >>> 0).toString(36) + '-' + s.length; }

const key = hash(src);
const out = Babel.transform(src, { presets: ['react'] }).code;
fs.writeFileSync(path.join(__dirname, '..', '..', 'game', 'app.js'), '/*ISHIMON-KEY:' + key + '*/\n' + out);
console.log('game/app.js を書き出しました', key, Math.round(out.length / 1024) + 'KB');
