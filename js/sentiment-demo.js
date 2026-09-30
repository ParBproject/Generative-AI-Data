(function () {
  var logic = globalThis.DemoLogic;
  var statusEl = document.getElementById('status');
  var analyzeBtn = document.getElementById('analyze');
  var reviewEl = document.getElementById('review');
  var summaryEl = document.getElementById('summary');
  var chartEl = document.getElementById('chart');
  var topicEl = document.getElementById('topicChart');
  var modelsPromise = null;

  var topicLabels = ['price', 'quality', 'shipping', 'customer service', 'design', 'usability'];

  function setStatus(message) {
    statusEl.textContent = message;
  }

  function loadModels() {
    if (!modelsPromise) {
      modelsPromise = globalThis.loadTransformers().then(function (transformers) {
        transformers.env.allowLocalModels = false;
        setStatus('Loading the sentiment model…');
        return transformers.pipeline(
          'text-classification',
          'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
        ).then(function (sentiment) {
          setStatus('Loading the topic model…');
          return transformers.pipeline(
            'zero-shot-classification',
            'Xenova/nli-deberta-v3-xsmall'
          ).then(function (topic) {
            setStatus('Loading the summary model…');
            return transformers.pipeline(
              'summarization',
              'Xenova/distilbart-cnn-12-6'
            ).then(function (summary) {
              return { sentiment: sentiment, topic: topic, summary: summary };
            });
          });
        });
      }).catch(function (error) {
        modelsPromise = null;
        throw error;
      });
    }
    return modelsPromise;
  }

  function clearChart(el) {
    if (globalThis.Plotly && typeof Plotly.purge === 'function' && el && el.data) Plotly.purge(el);
    if (el) el.textContent = '';
  }

  function plotSentiment(scores) {
    return globalThis.loadPlotly().then(function () {
      Plotly.newPlot(chartEl, [{
        x: ['Positive', 'Negative'],
        y: [scores.positive, scores.negative],
        type: 'bar',
        marker: { color: ['#166534', '#991b1b'] }
      }], {
        yaxis: { range: [0, 1], title: 'Confidence' },
        margin: { t: 40 },
        title: 'Sentiment scores'
      }, { responsive: true, displayModeBar: false });
    });
  }

  function plotTopics(topicOut) {
    var chartData = logic.topicChartData(topicOut);
    if (!chartData) {
      clearChart(topicEl);
      topicEl.textContent = 'The topic model returned labels this page does not recognize.';
      return;
    }
    return globalThis.loadPlotly().then(function () {
      Plotly.newPlot(topicEl, [{
        x: chartData.labels,
        y: chartData.scores,
        type: 'bar',
        marker: { color: '#1d4ed8' }
      }], {
        yaxis: { range: [0, 1], title: 'Relevance' },
        margin: { t: 40 },
        title: 'Zero-shot topic scores'
      }, { responsive: true, displayModeBar: false });
    }).catch(function (error) {
      console.error(error);
      clearChart(topicEl);
      topicEl.textContent = 'Chart library failed to load.';
    });
  }

  analyzeBtn.addEventListener('click', function () {
    var text = reviewEl.value.trim();
    if (!text) {
      setStatus('Enter a review first.');
      return;
    }
    var clipped = logic.clipReview(text);
    function withClip(message) {
      if (!clipped.truncated) return message;
      return message + ' Only the first ' + logic.MAX_REVIEW_CHARS + ' characters were analyzed.';
    }
    analyzeBtn.disabled = true;
    analyzeBtn.setAttribute('aria-busy', 'true');
    clearChart(chartEl);
    clearChart(topicEl);
    summaryEl.textContent = '';
    setStatus(withClip('Analyzing…'));
    loadModels().then(function (models) {
      var topicArgs = logic.zeroShotArguments(topicLabels);
      return logic.runStages([
        {
          task: function () {
            // transformers.js 2.11.0 reads `topk`. A later major version renamed it.
            return models.sentiment(clipped.text, { topk: 2 }).then(function (sentimentOut) {
              var scores = logic.mapSentimentScores(sentimentOut);
              var verdict = logic.sentimentVerdict(scores);
              if (!verdict) {
                setStatus(withClip('The sentiment model returned labels this page does not recognize.'));
                clearChart(chartEl);
                return;
              }
              var confidence = Math.max(scores.positive, scores.negative) * 100;
              if (verdict === 'tie') {
                setStatus(withClip('Tie (positive and negative confidence both ' + confidence.toFixed(1) + '%).'));
              } else {
                var word = verdict === 'positive' ? 'Positive' : 'Negative';
                setStatus(withClip(word + ' (confidence ' + confidence.toFixed(1) + '%).'));
              }
              return plotSentiment(scores).catch(function (error) {
                console.error(error);
                clearChart(chartEl);
                chartEl.textContent = 'Chart library failed to load.';
              });
            });
          },
          onError: function (error) {
            console.error(error);
            clearChart(chartEl);
            setStatus(withClip('Sentiment failed. Topics and the summary may still be available.'));
          }
        },
        {
          task: function () {
            return models.topic(clipped.text, topicArgs[0], topicArgs[1]).then(plotTopics);
          },
          onError: function (error) {
            console.error(error);
            clearChart(topicEl);
            topicEl.textContent = 'Topic model failed. The sentiment result above is still usable.';
          }
        },
        {
          task: function () {
            return models.summary(clipped.text, { max_new_tokens: 60 }).then(function (summaryOut) {
              var written = summaryOut && summaryOut[0] && summaryOut[0].summary_text
                ? String(summaryOut[0].summary_text).trim()
                : '';
              summaryEl.textContent = written || 'The summary model returned no text.';
            });
          },
          onError: function (error) {
            console.error(error);
            summaryEl.textContent = 'Summary failed. Short reviews often cannot be summarized by this model. The sentiment result above is still usable.';
          }
        }
      ]);
    }).catch(function (error) {
      console.error(error);
      setStatus('The models could not be loaded. Check the network connection and try again.');
    }).then(function () {
      analyzeBtn.disabled = false;
      analyzeBtn.removeAttribute('aria-busy');
    });
  });

  document.getElementById('random').addEventListener('click', function () {
    var samples = [
      'This phone case broke after one week of use.',
      'Absolutely love these sneakers, so comfy!',
      'The blender is fine but a bit loud.',
      'Terrible customer service at the store.',
      'Great value for the price, will buy again.'
    ];
    reviewEl.value = samples[Math.floor(Math.random() * samples.length)];
  });
})();
