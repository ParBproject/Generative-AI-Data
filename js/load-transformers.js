(function () {
  var promise = null;

  function loadTransformers() {
    var cdn = globalThis.PortfolioCDN;
    if (!cdn) return Promise.reject(new Error('CDN config missing'));
    if (!promise) {
      promise = fetch(cdn.TRANSFORMERS_SRC, { integrity: cdn.TRANSFORMERS_INTEGRITY })
        .then(function (response) {
          if (!response.ok) throw new Error('Transformers library HTTP ' + response.status);
          return response.text();
        })
        .then(function (source) {
          var script = source.replace(/\/\/# sourceMappingURL=.*$/m, '');
          var blobUrl = URL.createObjectURL(new Blob([script], { type: 'text/javascript' }));
          return import(blobUrl);
        })
        .catch(function (error) {
          promise = null;
          throw error;
        });
    }
    return promise;
  }

  globalThis.loadTransformers = loadTransformers;
})();
