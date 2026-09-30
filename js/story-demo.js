(function () {
  var logic = globalThis.DemoLogic;
  var dataset = [];
  var summary = document.getElementById('summary');
  var chart = document.getElementById('chart');
  var select = document.getElementById('columnSelect');

  function showColumn(column) {
    var values = dataset.map(function (row) { return row[column]; });
    var stats = logic.summarizeNumeric(values);
    if (!stats) {
      summary.textContent = 'That column has no numeric values.';
      return;
    }
    summary.textContent = logic.summaryText(column, stats);
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
      summary.textContent = rows.length ? 'No numeric column found.' : 'No data rows found.';
      if (globalThis.Plotly && chart.data) Plotly.purge(chart);
      chart.textContent = '';
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
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    if (file.size > logic.MAX_CSV_BYTES) {
      summary.textContent = 'This demo only reads CSV files up to 1 MB.';
      return;
    }
    var reader = new FileReader();
    reader.onerror = function () {
      summary.textContent = 'Could not read that file.';
    };
    reader.onload = function () {
      try {
        render(logic.parseCSV(String(reader.result)));
      } catch (error) {
        console.error(error);
        summary.textContent = 'Could not parse that CSV.';
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('loadSample').addEventListener('click', function () {
    try {
      render(logic.parseCSV(logic.SAMPLE_CSV));
    } catch (error) {
      console.error(error);
      summary.textContent = 'Could not load the sample.';
    }
  });
})();
