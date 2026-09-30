(function () {
  var promise = null;

  function loadPlotly() {
    if (globalThis.Plotly) return Promise.resolve(globalThis.Plotly);
    var cdn = globalThis.PortfolioCDN;
    if (!cdn) return Promise.reject(new Error('CDN config missing'));
    if (!promise) {
      promise = new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = cdn.PLOTLY_SRC;
        script.integrity = cdn.PLOTLY_INTEGRITY;
        script.crossOrigin = 'anonymous';
        script.onload = function () {
          if (globalThis.Plotly) resolve(globalThis.Plotly);
          else reject(new Error('Plotly missing after load'));
        };
        script.onerror = function () {
          promise = null;
          reject(new Error('Plotly failed to load'));
        };
        document.head.appendChild(script);
      });
    }
    return promise;
  }

  globalThis.loadPlotly = loadPlotly;
})();
