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

/***/ "./client/ts/countertest.ts":
/*!**********************************!*\
  !*** ./client/ts/countertest.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nconst Counter_1 = __webpack_require__(/*! ./game/ui/Counter */ \"./client/ts/game/ui/Counter.ts\");\nconst EnemyInfo_1 = __webpack_require__(/*! ./game/ui/EnemyInfo */ \"./client/ts/game/ui/EnemyInfo.ts\");\nwindow.addEventListener(\"load\", main);\nlet c;\nlet g;\nlet p;\nfunction main() {\n    c = [];\n    g = [];\n    for (let i = 0; i < 16; i++) {\n        c.push(new Counter_1.Counter(8));\n        // c[i].toggleAnimation(false);\n        let co = c[i];\n        document.getElementById(\"hello\").appendChild(co.getElement());\n        co.getElement().classList.add(\"counter-full\");\n    }\n    c.push(new Counter_1.Counter(8));\n    c[16].getElement().id = \"score-counter\";\n    document.getElementById(\"score-display\").prepend(c[16].getElement());\n    p = performance.now() / 50;\n    requestAnimationFrame(test);\n    let jank = new EnemyInfo_1.EnemyInfo(\"../res/img/portrait_knight_final.png\");\n    document.getElementById(\"enemy-info\").appendChild(jank.getElement());\n    g.push(jank);\n}\nfunction test() {\n    // create a wide counter\n    let f = 5 * Math.sin(performance.now() / 1000.0) + 5;\n    for (let i = 0; i < c.length; i++) {\n        c[i].setValue(performance.now() / 50 - p);\n    }\n    for (let i = 0; i < g.length; i++) {\n        g[i].setValue((performance.now() / 50 - p) / 10);\n    }\n    requestAnimationFrame(test);\n}\n\n\n//# sourceURL=webpack://hingler-online/./client/ts/countertest.ts?");

/***/ }),

/***/ "./client/ts/game/ui/Counter.ts":
/*!**************************************!*\
  !*** ./client/ts/game/ui/Counter.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.Counter = void 0;\nconst CounterDigit_1 = __webpack_require__(/*! ./CounterDigit */ \"./client/ts/game/ui/CounterDigit.ts\");\nclass Counter {\n    constructor(width) {\n        this.animate = true;\n        this.digits = new Array(width);\n        this.digitContainer = document.createElement(\"div\");\n        this.init = false;\n        for (let i = width - 1; i >= 0; i--) {\n            this.digits[i] = new CounterDigit_1.CounterDigit();\n            this.digits[i].appendTo(this.digitContainer);\n        }\n        this.setValue(0);\n    }\n    toggleAnimation(animate) {\n        for (let digit of this.digits) {\n            digit.toggleAnimation(animate);\n        }\n        this.animate = animate;\n    }\n    setValue(val) {\n        if (!this.animate) {\n            val = Math.floor(val);\n        }\n        if (val !== this.value || !this.init) {\n            this.init = true;\n            this.value = val;\n            let valueMod = val;\n            // store offset of last digit\n            // if it's about to slide over (> 9), add to ours\n            // offset should be floored\n            // ensures that the first digit rolls over correctly\n            let offsetLast = (this.animate ? 9 + (val % 1) : 0);\n            let offsetCur;\n            for (let i = 0; i < this.digits.length; i++) {\n                offsetCur = Math.floor(valueMod % 10);\n                if (offsetLast > 9) {\n                    offsetCur += (offsetLast - 9);\n                }\n                this.digits[i].setValue(offsetCur);\n                offsetLast = offsetCur;\n                valueMod = valueMod / 10;\n            }\n        }\n    }\n    getElement() {\n        this.init = false;\n        return this.digitContainer;\n    }\n}\nexports.Counter = Counter;\n\n\n//# sourceURL=webpack://hingler-online/./client/ts/game/ui/Counter.ts?");

/***/ }),

/***/ "./client/ts/game/ui/CounterDigit.ts":
/*!*******************************************!*\
  !*** ./client/ts/game/ui/CounterDigit.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.CounterDigit = void 0;\nclass CounterDigit {\n    /**\n     *\n     * @param parent - selector identifying initial parent.\n     */\n    constructor() {\n        this.digitStyle = document.createElement(\"div\");\n        this.digitStyle.textContent = \"0\";\n        this.digitContainer = document.createElement(\"div\");\n        this.digitTop = document.createElement(\"div\");\n        this.digitMiddle = document.createElement(\"div\");\n        this.digitBottom = document.createElement(\"div\");\n        this.digitContainer.appendChild(this.digitTop);\n        this.digitContainer.appendChild(this.digitMiddle);\n        this.digitContainer.appendChild(this.digitBottom);\n        this.digitContainer.classList.add(\"counter-container\");\n        this.digitStyle.classList.add(\"counter\");\n        this.digitStyle.appendChild(this.digitContainer);\n        this.animate = true;\n        this.value = 0;\n        this.anchor = 0;\n        window.addEventListener(\"resize\", () => {\n            // assume that we'll only have to resize counters when the window fucks up\n            this.heightCache = 0;\n        });\n        this.updateDigitState();\n    }\n    toggleAnimation(animate) {\n        this.animate = animate;\n        if (!animate) {\n            this.digitContainer.style.top = (this.heightCache * -1) + \"px\";\n        }\n    }\n    updateDigitState() {\n        let low = (this.anchor + 9) % 10;\n        let mid = this.anchor % 10;\n        let hi = (this.anchor + 1) % 10;\n        // might be really slow :(\n        this.digitTop.textContent = low.toString();\n        this.digitMiddle.textContent = mid.toString();\n        this.digitBottom.textContent = hi.toString();\n        let offset = this.value - this.anchor;\n        if (this.animate) {\n            if (this.heightCache <= 0) {\n                this.heightCache = (this.digitMiddle.clientHeight);\n            }\n            let offsetHTML = this.heightCache * (-1 - offset);\n            this.digitContainer.style.top = offsetHTML + \"px\";\n        }\n        else if (this.heightCache <= 0) {\n            this.heightCache = this.digitMiddle.clientHeight;\n            this.digitContainer.style.top = (this.heightCache * -1) + \"px\";\n        }\n    }\n    appendTo(elem) {\n        if (this.digitStyle.parentNode) {\n            this.digitStyle.parentNode.removeChild(this.digitStyle);\n        }\n        elem.appendChild(this.digitStyle);\n        this.heightCache = this.digitMiddle.clientHeight;\n        this.updateDigitState();\n    }\n    updateDigitSize() {\n        this.digitContainer.style.height = this.digitMiddle.clientHeight + \"px\";\n        console.log(this.digitMiddle.clientHeight);\n    }\n    setValue(val) {\n        val = (val < 0 ? -val : val);\n        let res = val % 10;\n        this.value = res;\n        this.anchor = Math.round(this.value);\n        this.updateDigitState();\n    }\n}\nexports.CounterDigit = CounterDigit;\n\n\n//# sourceURL=webpack://hingler-online/./client/ts/game/ui/CounterDigit.ts?");

/***/ }),

/***/ "./client/ts/game/ui/EnemyInfo.ts":
/*!****************************************!*\
  !*** ./client/ts/game/ui/EnemyInfo.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.EnemyInfo = void 0;\nconst Counter_1 = __webpack_require__(/*! ./Counter */ \"./client/ts/game/ui/Counter.ts\");\nclass EnemyInfo {\n    constructor(imageURL) {\n        this.img = new Image();\n        this.img.src = imageURL;\n        this.counter = new Counter_1.Counter(4);\n        this.counter.setValue(0);\n        this.wrapper = document.createElement(\"div\");\n        this.wrapper.appendChild(this.img);\n        this.wrapper.appendChild(this.counter.getElement());\n        this.wrapper.classList.add(\"enemy\");\n        this.counter.getElement().classList.add(\"enemy-counter\");\n    }\n    getElement() {\n        return this.wrapper;\n    }\n    toggleAnimation(animate) {\n        this.counter.toggleAnimation(animate);\n    }\n    setValue(val) {\n        this.counter.setValue(val);\n    }\n}\nexports.EnemyInfo = EnemyInfo;\n\n\n//# sourceURL=webpack://hingler-online/./client/ts/game/ui/EnemyInfo.ts?");

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
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./client/ts/countertest.ts");
/******/ 	
/******/ })()
;