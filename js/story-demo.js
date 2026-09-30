(function () {
  var logic = globalThis.DemoLogic;
  var dataset = [];
  var summary = document.getElementById('summary');
  var chart = document.getElementById('chart');
  var select = document.getElementById('columnSelect');
  var factcheckList = document.getElementById('factcheckList');
  var factcheckPlaceholder = 'Load a numeric column. Each example is then checked against that column\'s minimum, mean, maximum, and row count.';

  function warningSuffix() {
    var warnings = dataset && dataset.warnings;
    if (!warnings || !warnings.length) return '';
    return ' ' + warnings.join(' ');
  }

  function resetFactCheck() {
    if (factcheckList) factcheckList.textContent = factcheckPlaceholder;
  }

  function renderFactCheck(column, stats) {
    if (!factcheckList) return;
    factcheckList.replaceChildren();
    logic.exampleClaims(column, stats).forEach(function (claim) {
      var article = document.createElement('article');
      article.className = 'claim';
      var type = document.createElement('div');
      type.className = 'etype';
      type.textContent = 'Error type: ' + claim.type;
      var sentence = document.createElement('p');
      sentence.textContent = claim.sentence;
      var falsifier = document.createElement('div');
      falsifier.textContent = 'Column stat that falsifies it: ' + claim.falsifier;
      article.append(type, sentence, falsifier);
      factcheckList.appendChild(article);
    });
  }

  function clearView(message) {
    dataset = [];
    select.replaceChildren();
    summary.textContent = message;
    resetFactCheck();
    if (globalThis.Plotly && chart.data) Plotly.purge(chart);
    chart.textContent = '';
  }

  function showColumn(column) {
    var values = dataset.map(function (row) { return row[column]; });
    var stats = logic.summarizeNumeric(values);
    if (!stats) {
      summary.textContent = 'That column has no numeric values.' + warningSuffix();
      resetFactCheck();
      return;
    }
    summary.textContent = logic.summaryText(column, stats) + warningSuffix();
    renderFactCheck(column, stats);
    if (!globalThis.Plotly) {
      chart.textContent = 'Chart library failed to load.';
      return;
    }
    var nums = values.filter(function (value) {
      return value != null && String(value).trim() !== '' && Number.isFinite(Number(String(value).trim()));
    }).map(function (value) { return Number(String(value).trim()); });
    Plotly.newPlot(chart, [{
      x: nums,
      type: 'histogram',
      marker: { color: '#5b35ff' }
    }], {
      margin: { t: 30 },
      xaxis: { title: column }
    }, { responsive: true, displayModeBar: false });
  }

  function render(rows) {
    dataset = rows;
    select.replaceChildren();
    var columns = logic.numericColumns(rows);
    if (!columns.length) {
      var emptyMessage = rows.length ? 'No numeric column found.' : 'No data rows found.';
      var warnings = rows.warnings;
      clearView(warnings && warnings.length ? emptyMessage + ' ' + warnings.join(' ') : emptyMessage);
      return;
    }
    columns.forEach(function (column) {
      var option = document.createElement('option');
      option.value = column;
      option.textContent = column;
      select.appendChild(option);
    });
    showColumn(columns[0]);
  }

  select.addEventListener('change', function () {
    if (select.value) showColumn(select.value);
  });

  document.getElementById('fileInput').addEventListener('change', function (event) {
    var input = event.target;
    var file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    if (file.size > logic.MAX_CSV_BYTES) {
      clearView('This demo only reads CSV files up to 1 MB.');
      return;
    }
    var reader = new FileReader();
    reader.onerror = function () {
      clearView('Could not read that file.');
    };
    reader.onload = function () {
      try {
        render(logic.parseCSV(String(reader.result)));
      } catch (error) {
        console.error(error);
        clearView('Could not parse that CSV.');
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('loadSample').addEventListener('click', function () {
    try {
      render(logic.parseCSV(logic.SAMPLE_CSV));
    } catch (error) {
      console.error(error);
      clearView('Could not load the sample.');
    }
  });
})();
