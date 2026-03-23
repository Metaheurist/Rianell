/* Large JSON.parse / stringify offload (main thread stays responsive).
 * Keep postMessage payloads modest — WebView bridges are slower than desktop; avoid megabyte-scale strings. */
self.onmessage = function (e) {
  var d = e.data;
  if (!d || !d.type) return;
  if (d.type === 'parseJson') {
    try {
      var result = JSON.parse(d.text);
      self.postMessage({ id: d.id, ok: true, result: result });
    } catch (err) {
      self.postMessage({ id: d.id, ok: false, error: String(err && err.message ? err.message : err) });
    }
    return;
  }
  if (d.type === 'stringifyJson') {
    try {
      var s = JSON.stringify(d.value, null, 2);
      self.postMessage({ id: d.id, ok: true, result: s });
    } catch (err2) {
      self.postMessage({ id: d.id, ok: false, error: String(err2 && err2.message ? err2.message : err2) });
    }
  }
};
