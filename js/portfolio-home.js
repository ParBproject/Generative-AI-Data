(function () {
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
      blurb: 'Minimum, mean, and maximum beside a histogram. Example claims are checked against those stats. Not a language model.',
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

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
