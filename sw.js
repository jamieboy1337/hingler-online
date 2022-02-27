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
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

eval("\n/// <reference lib=\"WebWorker\" />\nvar __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\n    return new (P || (P = Promise))(function (resolve, reject) {\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n};\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nconst versionNumber_1 = __webpack_require__(/*! ../../../versionNumber */ \"./versionNumber.ts\");\n// come up with some better way to handle this then :3\nconst cacheName = `${versionNumber_1.CACHE_NAME}-v${versionNumber_1.VER_MAJOR}.${versionNumber_1.VER_MINOR}.${versionNumber_1.VER_BUILD}`;\n// use a bash script to update the contents of this arr programmatically?\n// write a quick export and put it in a consistent place\nconst filesToCache = [\n    \"/favicon.ico\",\n    \"/chewingchar.png\",\n    \"/html/maptest.html\",\n    \"/html/manifest.json\",\n    \"/css/maptest.css\",\n    \"/js/maptest.js\",\n    // glsl files\n    \"/glsl/debug/shadowdebug.frag\",\n    \"/glsl/debug/shadowdebug.vert\",\n    \"/glsl/debug/texturetest.frag\",\n    \"/glsl/debug/texturetest.vert\",\n    \"/glsl/game/explosion/explosion.frag\",\n    \"/glsl/game/explosion/explosion.vert\",\n    \"/glsl/game/explosionglow/explosionglow.vert\",\n    \"/glsl/game/explosionglow/explosionglow.frag\",\n    \"/glsl/game/termshock/termshock.vert\",\n    \"/glsl/game/termshock/termshock.frag\",\n    \"/glsl/includes/radialblur.inc.glsl\",\n    \"/glsl/includes/gradient.inc.glsl\",\n    \"/glsl/includes/spotlight/attenuation.inc.glsl\",\n    \"/glsl/includes/spotlight/spotlight.inc.glsl\",\n    \"/glsl/includes/ambient.inc.glsl\",\n    \"/glsl/includes/constants.inc.glsl\",\n    \"/glsl/includes/opensimplex.inc.glsl\",\n    \"/glsl/includes/pbr.inc.glsl\",\n    \"/glsl/matteshader/matteshader.frag\",\n    \"/glsl/matteshader/matteshader.vert\",\n    \"/glsl/pbr/pbr.frag\",\n    \"/glsl/pbr/pbr.vert\",\n    \"/glsl/shadownotexture/shadownotexture_instanced.vert\",\n    \"/glsl/shadownotexture/shadownotexture.frag\",\n    \"/glsl/shadownotexture/shadownotexture.vert\",\n    \"/glsl/texturexfer/texturexfer.frag\",\n    \"/glsl/texturexfer/texturexfer.vert\",\n    // resource files\n    \"/res/beachworld.glb\",\n    \"/res/bomb.glb\",\n    \"/res/chewingcharacter.glb\",\n    \"/res/crate.glb\",\n    \"/res/crate3d.glb\",\n    \"/res/crate3d_lava.glb\",\n    \"/res/cubetest.glb\",\n    \"/res/enemy1.glb\",\n    \"/res/explosiontex.png\",\n    \"/res/fieldgrass.glb\",\n    \"/res/grass.glb\",\n    \"/res/grassworld.glb\",\n    \"/res/grassworld_new.glb\",\n    \"/res/hemisphere_explosion.glb\",\n    \"/res/lavaworld.glb\",\n    \"/res/loading.png\",\n    \"/res/mappack.glb\",\n    \"/res/mountainworld.glb\",\n    \"/res/terminationshock.glb\",\n    \"/res/test.glb\",\n    \"/res/untitled.glb\",\n    \"/res/powerups.glb\",\n    \"/res/woodworld.png\",\n    // fonts\n    \"/res/font/JetBrainsMono-Italic-VariableFont_wght.ttf\",\n    \"/res/font/WorkSans-VariableFont_wght.ttf\",\n    // image folder\n    \"/res/img/portrait_knight_final.png\",\n    \"/res/img/fieldminis/beach_bg.png\",\n    \"/res/img/fieldminis/beach_fg.png\",\n    \"/res/img/fieldminis/field_bg.png\",\n    \"/res/img/fieldminis/field_fg.png\",\n    \"/res/img/powerup/bombs.png\",\n    \"/res/img/powerup/radius.png\",\n    \"/res/img/powerup/speed.png\",\n    \"/res/img/charactermini_still.png\",\n    \"/res/img/chewingcharacter_animated.gif\",\n    // touch input\n    \"/res/touch/bomb.png\",\n    \"/res/touch/detonate.png\",\n    \"/res/touch/dir.png\"\n];\nself.addEventListener(\"install\", function (event) {\n    console.info(\"Creating cache \" + versionNumber_1.CACHE_NAME);\n    event.waitUntil(caches.open(versionNumber_1.CACHE_NAME).then(function (cache) {\n        return cache.addAll(filesToCache);\n    }));\n});\nself.addEventListener(\"fetch\", function (event) {\n    event.respondWith(caches.match(event.request)\n        .then(function (response) {\n        return __awaiter(this, void 0, void 0, function* () {\n            if (response) {\n                console.log(\"cache hit: \" + event.request.url);\n                return response;\n            }\n            console.warn(\"request not found in cache: \" + event.request.url);\n            return fetch(event.request);\n        });\n    }));\n});\nself.addEventListener(\"activate\", function (event) {\n    // nothing yet >:)\n    event.waitUntil(caches.keys().then(function (cacheNames) {\n        return Promise.all(cacheNames.map(function (cacheName) {\n            if (versionNumber_1.CACHE_NAME !== cacheName) {\n                return caches.delete(cacheName);\n            }\n        }));\n    }));\n});\n\n\n//# sourceURL=webpack://hingler-online/./client/ts/service-worker/sw.ts?");

/***/ }),

/***/ "./versionNumber.ts":
/*!**************************!*\
  !*** ./versionNumber.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.CACHE_NAME = exports.VER_BUILD = exports.VER_MINOR = exports.VER_MAJOR = void 0;\nexports.VER_MAJOR = 0;\nexports.VER_MINOR = 3;\nexports.VER_BUILD = 1576;\nexports.CACHE_NAME = 'hingler-cache';\n\n\n//# sourceURL=webpack://hingler-online/./versionNumber.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./client/ts/service-worker/sw.ts");
/******/ 	
/******/ })()
;