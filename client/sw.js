/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./client/ts/service-worker/sw.ts":
/*!****************************************!*\
  !*** ./client/ts/service-worker/sw.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports) {

eval("\r\n/// <reference lib=\"WebWorker\" />\r\nvar __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\r\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\r\n    return new (P || (P = Promise))(function (resolve, reject) {\r\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\r\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\r\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\r\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\r\n    });\r\n};\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\n// come up with some better way to handle this then :3\r\nconst CACHE_NAME = \"hingler-cache-v0.0.1\";\r\n// use a bash script to update the contents of this arr programmatically?\r\n// write a quick export and put it in a consistent place\r\nconst filesToCache = [\r\n    \"/favicon.ico\",\r\n    \"/html/maptest.html\",\r\n    \"/css/maptest.css\",\r\n    \"/js/maptest.js\",\r\n    // glsl files\r\n    \"/glsl/debug/shadowdebug.frag\",\r\n    \"/glsl/debug/shadowdebug.vert\",\r\n    \"/glsl/debug/texturetest.frag\",\r\n    \"/glsl/debug/texturetest.vert\",\r\n    \"/glsl/explosion/explosion.frag\",\r\n    \"/glsl/explosion/explosion.vert\",\r\n    \"/glsl/includes/spotlight/attenuation.inc.glsl\",\r\n    \"/glsl/includes/spotlight/spotlight.inc.glsl\",\r\n    \"/glsl/includes/ambient.inc.glsl\",\r\n    \"/glsl/includes/constants.inc.glsl\",\r\n    \"/glsl/includes/opensimplex.inc.glsl\",\r\n    \"/glsl/includes/pbr.inc.glsl\",\r\n    \"/glsl/matteshader/matteshader.frag\",\r\n    \"/glsl/matteshader/matteshader.vert\",\r\n    \"/glsl/pbr/pbr.frag\",\r\n    \"/glsl/pbr/pbr.vert\",\r\n    \"/glsl/shadownotexture/shadownotexture_instanced.vert\",\r\n    \"/glsl/shadownotexture/shadownotexture.frag\",\r\n    \"/glsl/shadownotexture/shadownotexture.vert\",\r\n    \"/glsl/texturexfer/texturexfer.frag\",\r\n    \"/glsl/texturexfer/texturexfer.vert\",\r\n    // resource files\r\n    \"/res/beachworld.glb\",\r\n    \"/res/bomb.glb\",\r\n    \"/res/chewingcharacter.glb\",\r\n    \"/res/cornplanet.glb\",\r\n    \"/res/crate.glb\",\r\n    \"/res/crate3d.glb\",\r\n    \"/res/cubetest.glb\",\r\n    \"/res/enemy1.glb\",\r\n    \"/res/explosiontex.png\",\r\n    \"/res/fieldgrass.glb\",\r\n    \"/res/grass.glb\",\r\n    \"/res/grassworld.glb\",\r\n    \"/res/hemisphere_explosion.glb\",\r\n    \"/res/lavaworld.glb\",\r\n    \"/res/loading.png\",\r\n    \"/res/mappack.glb\",\r\n    \"/res/test.glb\",\r\n    \"/res/untitled.glb\",\r\n    // touch input\r\n    \"/res/touch/bomb.png\",\r\n    \"/res/touch/detonate.png\",\r\n    \"/res/touch/dir.png\"\r\n];\r\nself.addEventListener(\"install\", function (event) {\r\n    event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {\r\n        return cache.addAll(filesToCache);\r\n    }));\r\n});\r\nself.addEventListener(\"fetch\", function (event) {\r\n    event.respondWith(caches.match(event.request)\r\n        .then(function (response) {\r\n        return __awaiter(this, void 0, void 0, function* () {\r\n            if (response) {\r\n                console.log(\"cache hit: \" + event.request.url);\r\n                return response;\r\n            }\r\n            console.warn(\"request not found in cache: \" + event.request.url);\r\n            return fetch(event.request);\r\n        });\r\n    }));\r\n});\r\nself.addEventListener(\"activate\", function (event) {\r\n    // nothing yet >:)\r\n    event.waitUntil(caches.keys().then(function (cacheNames) {\r\n        return Promise.all(cacheNames.map(function (cacheName) {\r\n            if (CACHE_NAME !== cacheName) {\r\n                return caches.delete(cacheName);\r\n            }\r\n        }));\r\n    }));\r\n});\r\n\n\n//# sourceURL=webpack://hingler-online/./client/ts/service-worker/sw.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./client/ts/service-worker/sw.ts"](0, __webpack_exports__);
/******/ 	
/******/ })()
;