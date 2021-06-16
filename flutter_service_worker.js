'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "d6744b182a72f8037ab6daddecad5f32",
"assets/assets/fonts/a.ttf": "27e3649bab7c62fa21b8837c4842e40e",
"assets/assets/fonts/b.ttf": "ade91f473255991f410f61857696434b",
"assets/assets/images/1.jpg": "66fe39f92260d9cb01737addac4faff9",
"assets/assets/images/2.jpg": "cd5682dfed48c048664a57c1f647fb32",
"assets/assets/images/3.jpg": "d118d87b25c91d0e4349f9ffc60728b5",
"assets/assets/images/5.jpg": "d73dffc20ad0cf42369b73fa1e393c61",
"assets/assets/images/gmail.png": "8d73098d48176f0bc0dce3dd7b773f20",
"assets/assets/images/instagram.png": "c643a2775d2dd68532795b1b918c6557",
"assets/assets/images/logo.jpg": "c7e182a0d895a9c4a351caed16ebe8ff",
"assets/assets/images/music.jpg": "381ea1250fddab0e747d9214a8fc92f4",
"assets/FontManifest.json": "17054646b90d62bfe5002123d02409de",
"assets/fonts/a.ttf": "27e3649bab7c62fa21b8837c4842e40e",
"assets/fonts/b.ttf": "ade91f473255991f410f61857696434b",
"assets/fonts/MaterialIcons-Regular.otf": "4e6447691c9509f7acdbf8a931a85ca1",
"assets/images/1.jpg": "66fe39f92260d9cb01737addac4faff9",
"assets/images/2.jpg": "cd5682dfed48c048664a57c1f647fb32",
"assets/images/3.jpg": "d118d87b25c91d0e4349f9ffc60728b5",
"assets/images/5.jpg": "d73dffc20ad0cf42369b73fa1e393c61",
"assets/images/gmail.png": "8d73098d48176f0bc0dce3dd7b773f20",
"assets/images/instagram.png": "c643a2775d2dd68532795b1b918c6557",
"assets/images/logo.jpg": "c7e182a0d895a9c4a351caed16ebe8ff",
"assets/images/music.jpg": "381ea1250fddab0e747d9214a8fc92f4",
"assets/NOTICES": "c983b4d57764ecdf56f5a51af4523933",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"icons/logo.jpg": "cdcf47a1373db7681168e2422fcfb33d",
"index.html": "60befcc09f30b7fedbd1454692616ede",
"/": "60befcc09f30b7fedbd1454692616ede",
"main.dart.js": "e54909b10eb2b17edc0cefeb2bda429f",
"manifest.json": "a059f353cd0bb29ba0b9322a555f24d9",
"version.json": "e858c535003b6270473c923322d2a685"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
