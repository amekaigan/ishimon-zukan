// 石モン図鑑 Service Worker v1.0
const CACHE_NAME = 'ishimon-v1';

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
  // Firebase・API・外部リソースはキャッシュしない
  const url = event.request.url;
  if (
    url.includes('firebase') ||
    url.includes('pollinations') ||
    url.includes('googleapis') ||
    url.includes('gstatic') ||
    url.includes('unpkg') ||
    url.includes('tailwindcss') ||
    url.includes('huggingface') ||
    url.includes('openai')
  ) {
    return; // ブラウザデフォルトに任せる
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 成功したらキャッシュを更新
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // オフライン時はキャッシュから返す
        return caches.match(event.request);
      })
  );
});
