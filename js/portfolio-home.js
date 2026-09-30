(function () {
  var logic = globalThis.DemoLogic;

  var kpiData = [
    { label: 'Demos in this repo', value: '4' },
    { label: 'Production models', value: '0' },
    { label: 'Sentiment stack', value: 'In-browser' },
    { label: 'Data', value: 'Synthetic' }
  ];

  var projects = [
    {
      title: 'AI-Driven Review Sentiment (Retail)',
      blurb: 'DistilBERT sentiment, zero-shot topics, and a short summary. Runs in the browser.',
      tags: ['Transformers', 'Plotly'],
      repo: 'https://github.com/ParBproject/Generative-AI-Data',
      live: 'retail_sentiment_demo.html'
    },
    {
      title: 'Synthetic Data for Fraud Detection',
      blurb: 'A slider that redraws a synthetic fraud cloud. Not a trained detector.',
      tags: ['Synthetic', 'Plotly'],
      repo: 'https://github.com/ParBproject/Generative-AI-Data',
      live: 'fraud_demo.html'
    },
    {
      title: 'Automated Data Storytelling',
      blurb: 'Mean, min, and max written beside a histogram. A template for a checked narrative, not an LLM.',
      tags: ['CSV', 'Plotly'],
      repo: 'https://github.com/ParBproject/Generative-AI-Data',
      live: 'automated_data_storytelling_demo.html'
    },
    {
      title: 'Churn Prediction Dashboard',
      blurb: 'Two sliders and a hand-set logistic. Useful for explaining a coefficient, not a churn model.',
      tags: ['What-if', 'Plotly'],
      repo: 'https://github.com/ParBproject/Generative-AI-Data',
      live: 'churn_demo.html'
    }
  ];

  function addText(parent, className, text) {
    var el = document.createElement('div');
    if (className) el.className = className;
    el.textContent = text;
    parent.appendChild(el);
    return el;
  }

  var kpisEl = document.getElementById('kpis');
  if (kpisEl) {
    kpiData.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'kpi';
      addText(card, 'label', item.label);
      addText(card, 'value', item.value);
      kpisEl.appendChild(card);
    });
  }

  var grid = document.getElementById('projectsGrid');
  if (grid) {
    projects.forEach(function (project) {
      var card = document.createElement('article');
      card.className = 'card';
      var thumb = document.createElement('div');
      thumb.className = 'thumb';
      thumb.setAttribute('role', 'img');
      thumb.setAttribute('aria-label', project.title);
      card.appendChild(thumb);

      var content = document.createElement('div');
      content.className = 'card-content';
      var heading = document.createElement('h3');
      heading.style.margin = '0 0 6px';
      heading.style.fontSize = '18px';
      heading.textContent = project.title;
      content.appendChild(heading);
      var blurb = document.createElement('p');
      blurb.className = 'muted';
      blurb.style.margin = '0 0 10px';
      blurb.textContent = project.blurb;
      content.appendChild(blurb);

      var tags = document.createElement('div');
      tags.className = 'tags';
      project.tags.forEach(function (tag) {
        var span = document.createElement('span');
        span.className = 'tag';
        span.textContent = tag;
        tags.appendChild(span);
      });
      content.appendChild(tags);

      var actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '10px';
      actions.style.flexWrap = 'wrap';
      function link(href, text, external) {
        var anchor = document.createElement('a');
        anchor.className = 'btn';
        anchor.href = href;
        anchor.textContent = text;
        if (external) {
          anchor.target = '_blank';
          anchor.rel = 'noopener';
        }
        return anchor;
      }
      actions.appendChild(link(project.repo, 'GitHub Repo ↗', true));
      actions.appendChild(link(project.live, 'Live Demo', false));
      content.appendChild(actions);
      card.appendChild(content);
      grid.appendChild(card);
    });
  }

  function chartLayout(partial) {
    var layout = {
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: '#e6e9f5' },
      margin: { t: 10, r: 10, b: 40, l: 48 },
      legend: { orientation: 'h' }
    };
    Object.keys(partial).forEach(function (key) { layout[key] = partial[key]; });
    return layout;
  }

  function renderTimeSeries() {
    var now = new Date();
    var months = Array.from({ length: 24 }, function (_, i) {
      return logic.formatMonth(logic.shiftMonth(now, i - 23));
    });
    var val = 100;
    var real = months.map(function () {
      val += logic.normalSample(2.2, 4);
      return Math.max(40, val);
    });
    var last = real[real.length - 1];
    var fcMonths = Array.from({ length: 6 }, function (_, i) {
      return logic.formatMonth(logic.shiftMonth(now, i + 1));
    });
    var forecast = fcMonths.map(function () {
      last += logic.normalSample(3.0, 3);
      return last;
    });
    var band = logic.illustrativeBand(forecast);
    var traceReal = { x: months, y: real, mode: 'lines+markers', name: 'Drawn series', line: { width: 3 } };
    var tracePath = {
      x: fcMonths,
      y: forecast,
      mode: 'lines+markers',
      name: 'Illustrative path',
      line: { dash: 'dot', width: 3 }
    };
    var traceBand = {
      x: fcMonths.concat(fcMonths.slice().reverse()),
      y: band.high.concat(band.low.slice().reverse()),
      fill: 'toself',
      fillcolor: 'rgba(124,92,255,.18)',
      line: { width: 0 },
      name: logic.ILLUSTRATIVE_BAND_NAME
    };
    Plotly.newPlot('chartTimeseries', [traceReal, traceBand, tracePath], chartLayout({
      xaxis: { title: 'Month', gridcolor: 'rgba(255,255,255,.08)' },
      yaxis: { title: 'Value (drawing)', gridcolor: 'rgba(255,255,255,.08)' }
    }), { displayModeBar: false, responsive: true });
  }

  function renderHistogram() {
    var real = Array.from({ length: 400 }, function () {
      return Math.min(1, Math.max(0, logic.normalSample(0.6, 0.15)));
    });
    var synth = Array.from({ length: 400 }, function () {
      return Math.min(1, Math.max(0, logic.normalSample(0.55, 0.18)));
    });
    Plotly.newPlot('chartHistogram', [
      { x: real, type: 'histogram', opacity: 0.7, nbinsx: 30, name: 'Draw A' },
      { x: synth, type: 'histogram', opacity: 0.6, nbinsx: 30, name: 'Draw B' }
    ], chartLayout({
      barmode: 'overlay',
      xaxis: { title: 'Class probability (drawn)', gridcolor: 'rgba(255,255,255,.08)' },
      yaxis: { title: 'Count', gridcolor: 'rgba(255,255,255,.08)' }
    }), { displayModeBar: false, responsive: true });
  }

  function renderHeatmap() {
    var labels = ['Negative', 'Neutral', 'Positive'];
    var mat = [
      [85, 10, 5],
      [9, 78, 13],
      [6, 12, 82]
    ];
    Plotly.newPlot('chartHeatmap', [{
      z: mat,
      x: labels,
      y: labels,
      type: 'heatmap',
      showscale: true,
      hovertemplate: 'Predicted %{x}<br>Actual %{y}<br>%{z}<extra></extra>'
    }], chartLayout({
      margin: { t: 10, r: 10, b: 40, l: 80 },
      xaxis: { title: 'Predicted', gridcolor: 'rgba(255,255,255,.08)' },
      yaxis: { title: 'Actual', gridcolor: 'rgba(255,255,255,.08)' }
    }), { displayModeBar: false, responsive: true });
  }

  function renderScatter() {
    var xs0 = [];
    var ys0 = [];
    var xs1 = [];
    var ys1 = [];
    for (var i = 0; i < 300; i += 1) {
      var klass = Math.random() < 0.5 ? 0 : 1;
      var x = klass ? logic.normalSample(60, 10) : logic.normalSample(40, 10);
      var y = klass ? x * 0.6 + logic.normalSample(10, 8) : x * 0.3 + logic.normalSample(18, 8);
      if (klass) { xs1.push(x); ys1.push(y); }
      else { xs0.push(x); ys0.push(y); }
    }
    Plotly.newPlot('chartScatter', [
      { x: xs0, y: ys0, mode: 'markers', name: 'Class 0', type: 'scatter' },
      { x: xs1, y: ys1, mode: 'markers', name: 'Class 1', type: 'scatter' }
    ], chartLayout({
      xaxis: { title: 'Feature A (drawn)', gridcolor: 'rgba(255,255,255,.08)' },
      yaxis: { title: 'Feature B (drawn)', gridcolor: 'rgba(255,255,255,.08)' }
    }), { displayModeBar: false, responsive: true });
  }

  var chartIds = ['chartTimeseries', 'chartHistogram', 'chartHeatmap', 'chartScatter'];

  function showChartError(message) {
    chartIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = message;
    });
    var status = document.getElementById('vizStatus');
    if (status) status.textContent = message;
  }

  function startCharts() {
    var status = document.getElementById('vizStatus');
    if (status) status.textContent = 'Loading charts…';
    if (typeof globalThis.loadPlotly !== 'function') {
      showChartError('Charts could not be loaded.');
      return;
    }
    globalThis.loadPlotly().then(function () {
      renderTimeSeries();
      renderHistogram();
      renderHeatmap();
      renderScatter();
      if (status) status.textContent = '';
    }).catch(function (error) {
      console.error(error);
      showChartError('Charts could not be loaded.');
    });
  }

  var viz = document.getElementById('visualizations');
  if (!viz || typeof IntersectionObserver !== 'function') startCharts();
  else {
    var observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        observer.disconnect();
        startCharts();
      }
    }, { rootMargin: '300px' });
    observer.observe(viz);
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
