(function () {
  var projects = [
    {
      title: 'Retail review sentiment',
      blurb: 'DistilBERT sentiment, zero-shot topic scores, and a DistilBART summary. The models load in the browser when you analyze a review.',
      tags: ['DistilBERT', 'Plotly'],
      repo: 'https://github.com/ParBproject/Generative-AI-Data',
      live: 'retail_sentiment_demo.html'
    },
    {
      title: 'Fraud scatter',
      blurb: '1,000 random points. The slider sets how many are drawn in the upper-right corner and labeled fraud.',
      tags: ['Plotly'],
      repo: 'https://github.com/ParBproject/Generative-AI-Data',
      live: 'fraud_demo.html'
    },
    {
      title: 'Column summary',
      blurb: 'Mean, minimum, and maximum of a numeric column, drawn as a histogram. The sample file is five made-up rows.',
      tags: ['CSV', 'Plotly'],
      repo: 'https://github.com/ParBproject/Generative-AI-Data',
      live: 'automated_data_storytelling_demo.html'
    },
    {
      title: 'Churn what-if',
      blurb: 'A logistic with fixed coefficients. The sliders change tenure and monthly charges and show the new probability.',
      tags: ['Plotly'],
      repo: 'https://github.com/ParBproject/Generative-AI-Data',
      live: 'churn_demo.html'
    }
  ];

  var grid = document.getElementById('projectsGrid');
  if (grid) {
    projects.forEach(function (project) {
      var card = document.createElement('article');
      card.className = 'card';

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
