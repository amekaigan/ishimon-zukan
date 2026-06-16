// 石モン図鑑 Service Worker v3.0
// 変更点(v3): 壊れた index.html がキャッシュに居座る問題の対策。
//   - CACHE_NAME を上げて古い（壊れている可能性のある）キャッシュを破棄。
//   - HTML（ナビゲーション）は実行時にキャッシュへ保存しない＝壊れた応答が居座らない。
//     常にネットから取得し、失敗時のみ install 時の正規キャッシュにフォールバック。
//   - 静的アセット（share-card.js 等）は従来どおりネット優先＋200ならキャッシュ。
const CACHE_NAME = 'ishimon-v3';

// インストール時にキャッシュする「正規コピー」
const CACHE_URLS = [
  '/game/',
  '/game/index.html',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] キャッシュ作成 v3');
      return cache.addAll(CACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = req.url;

  // Firebase・API・外部リソース・画像生成WorkerはSWを通さない
  if (
    url.includes('firebase') ||
    url.includes('pollinations') ||
    url.includes('googleapis') ||
    url.includes('gstatic') ||
    url.includes('unpkg') ||
    url.includes('tailwindcss') ||
    url.includes('googletagmanager') ||
    url.includes('google-analytics') ||
    url.includes('huggingface') ||
    url.includes('openai') ||
    url.includes('workers.dev') ||
    url.includes('deepinfra') ||
    url.includes('replicate')
  ) {
    return; // ブラウザに直接やらせる
  }

  // HTML（ページ遷移＝index.html）: 常にネット優先・実行時キャッシュ保存はしない。
  //   壊れた/途中で切れた応答がキャッシュに居座るのを防ぐ。失敗時のみ正規キャッシュへ。
  const isNavigation =
    req.mode === 'navigate' ||
    (req.destination === 'document') ||
    url.endsWith('/game/') ||
    url.endsWith('/game/index.html');

  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then(response => response)
        .catch(() => caches.match('/game/index.html').then(r => r || caches.match('/game/')))
    );
    return;
  }

  // 静的アセット: ネット優先＋200ならキャッシュ、失敗時はキャッシュから。
  event.respondWith(
    fetch(req)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return response;
      })
      .catch(() => caches.match(req))
  );
});
