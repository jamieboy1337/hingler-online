export let perf : any;
// run a test to see if require is defined
// if perf is undefined and require is undefined,
// we are in a non-node environment which does not support performance api.

// otherwise, if perf is undefined, require perf hooks
// otherwise, use perf
if (typeof performance === undefined) {
  perf = require("perf_hooks").performance;
} else {
  perf = performance;
}