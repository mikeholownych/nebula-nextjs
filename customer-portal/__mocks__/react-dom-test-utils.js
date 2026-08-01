// Shim react-dom/test-utils for React 19 compatibility.
// React 19 removed act() from all CJS bundles (ESM-only in React 19).
// Provide a minimal shim that satisfies @testing-library/react cleanup.
function shimAct(callback) {
  const result = callback()
  if (result && typeof result.then === 'function') return result
  return Promise.resolve()
}
module.exports = { act: shimAct }
