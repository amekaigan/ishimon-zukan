// 石モン図鑑 Service Worker v2.0
const CACHE_NAME = 'ishimon-v2';

// キャッシュするファイル（ゲーム本体）
const CACHE_URLS = [
  '/game/',
  '/game/index.html',
];

// インストール時にキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] キャッシュ作成');
      return cache.addAll(CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ネットワーク優先・失敗時はキャッシュから返す
self.addEventListener('fetch', event => {
  // Firebase・API・外部リソース・画像生成WorkerはSWを通さない
  const url = event.request.url;
  if (
    url.includes('firebase') ||
    url.includes('pollinations') ||
    url.includes('googleapis') ||
    url.includes('gstatic') ||
    url.includes('unpkg') ||
    url.includes('tailwindcss') ||
    url.includes('huggingface') ||
    url.includes('openai') ||
    url.includes('workers.dev') ||   // ★追加: 画像Worker(ishimon-img)・Vision Worker(ishimon-api)
    url.includes('deepinfra') ||     // ★追加: 画像エンジン
    url.includes('replicate')        // ★追加: LoRA推論
  ) {
    return; // ブラウザに直接やらせる（SWを挟まない）
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
