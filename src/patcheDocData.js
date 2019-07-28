var rfc6902 = require('rfc6902');

export default function(obj, patches, patchesApplied) {
  patchesApplied = patchesApplied || {};
  return patches
    .sort((a, b) => a.t-b.t)
    .map((patch) => {
      if (!patchesApplied[patch.t]) {
        rfc6902.applyPatch(obj, patch.p)
        patchesApplied[patch.t] = patch
      }
    })
  ;
}