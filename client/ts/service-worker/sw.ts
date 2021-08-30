/// <reference lib="WebWorker" />

export {};
declare const self: ServiceWorkerGlobalScope;

// come up with some better way to handle this then :3
const CACHE_NAME = "hingler-cache-v0.0.2";

// use a bash script to update the contents of this arr programmatically?
// write a quick export and put it in a consistent place
const filesToCache = [
  "/favicon.ico",

  "/html/maptest.html",
  "/css/maptest.css",
  "/js/maptest.js",

  // glsl files
  "/glsl/debug/shadowdebug.frag",
  "/glsl/debug/shadowdebug.vert",
  "/glsl/debug/texturetest.frag",
  "/glsl/debug/texturetest.vert",
  "/glsl/explosion/explosion.frag",
  "/glsl/explosion/explosion.vert",
  "/glsl/includes/spotlight/attenuation.inc.glsl",
  "/glsl/includes/spotlight/spotlight.inc.glsl",
  "/glsl/includes/ambient.inc.glsl",
  "/glsl/includes/constants.inc.glsl",
  "/glsl/includes/opensimplex.inc.glsl",
  "/glsl/includes/pbr.inc.glsl",
  "/glsl/matteshader/matteshader.frag",
  "/glsl/matteshader/matteshader.vert",
  "/glsl/pbr/pbr.frag",
  "/glsl/pbr/pbr.vert",
  "/glsl/shadownotexture/shadownotexture_instanced.vert",
  "/glsl/shadownotexture/shadownotexture.frag",
  "/glsl/shadownotexture/shadownotexture.vert",
  "/glsl/texturexfer/texturexfer.frag",
  "/glsl/texturexfer/texturexfer.vert",

  // resource files
  "/res/beachworld.glb",
  "/res/bomb.glb",
  "/res/chewingcharacter.glb",
  "/res/cornplanet.glb",
  "/res/crate.glb",
  "/res/crate3d.glb",
  "/res/cubetest.glb",
  "/res/enemy1.glb",
  "/res/explosiontex.png",
  "/res/fieldgrass.glb",
  "/res/grass.glb",
  "/res/grassworld.glb",
  "/res/hemisphere_explosion.glb",
  "/res/lavaworld.glb",
  "/res/loading.png",
  "/res/mappack.glb",
  "/res/test.glb",
  "/res/untitled.glb",

  // touch input
  "/res/touch/bomb.png",
  "/res/touch/detonate.png",
  "/res/touch/dir.png"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(filesToCache);
  }));
});

self.addEventListener("fetch", function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(async function(response) {
        if (response) {
          console.log("cache hit: " + event.request.url);
          return response;
        }

        console.warn("request not found in cache: " + event.request.url);
        return fetch(event.request);
      })
  );
});

self.addEventListener("activate", function(event) {
  // nothing yet >:)
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (CACHE_NAME !== cacheName) {
            return caches.delete(cacheName);
          }
        })
      )
    })
  )
});