(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.PortfolioCDN = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    PLOTLY_SRC: 'https://cdn.plot.ly/plotly-2.27.0.min.js',
    PLOTLY_INTEGRITY: 'sha384-Hl48Kq2HifOWdXEjMsKo6qxqvRLTYqIGbvlENBmkHAxZKIGCXv43H6W1jA671RzC',
    TRANSFORMERS_SRC: 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.11.0',
    TRANSFORMERS_INTEGRITY: 'sha384-pR11vLRnfBzzpENMudGY5a6VjEUEUaHdO7GY+4WgubemLmSfZ9IWUVXcBEkrZRhq'
  };
});
