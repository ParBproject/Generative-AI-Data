(function () {
  var logic = globalThis.DemoLogic;
  var slider = document.getElementById('rate');
  var label = document.getElementById('lblRate');
  var counts = document.getElementById('counts');
  var chart = document.getElementById('chart');

  function draw() {
    var pct = logic.readSliderInt(slider.value, 5);
    label.textContent = String(pct);
    var split = logic.fraudCounts(logic.FRAUD_TOTAL, pct);
    counts.textContent = split.fraudCount + ' fraud points and ' + split.legitCount +
      ' other points, out of ' + logic.FRAUD_TOTAL +
      '. Fraud points are drawn inside the 70–100 box on both axes by the generator.';
    if (!globalThis.Plotly) {
      chart.textContent = 'Chart library failed to load.';
      return;
    }
    var legitX = [];
    var legitY = [];
    var fraudX = [];
    var fraudY = [];
    var i;
    for (i = 0; i < split.legitCount; i += 1) {
      legitX.push(Math.random() * 100);
      legitY.push(Math.random() * 100);
    }
    for (i = 0; i < split.fraudCount; i += 1) {
      fraudX.push(70 + Math.random() * 30);
      fraudY.push(70 + Math.random() * 30);
    }
    Plotly.newPlot(chart, [
      { x: legitX, y: legitY, mode: 'markers', name: 'Other', marker: { color: 'rgba(0,123,255,0.7)' } },
      { x: fraudX, y: fraudY, mode: 'markers', name: 'Fraud (placed by generator)', marker: { color: 'rgba(220,53,69,0.8)' } }
    ], {
      xaxis: { title: 'Synthetic amount index (0–100)', range: [0, 100] },
      yaxis: { title: 'Synthetic time index (0–100)', range: [0, 100] },
      margin: { t: 30 },
      legend: { orientation: 'h' }
    }, { responsive: true, displayModeBar: false });
  }

  slider.addEventListener('input', draw);
  draw();
})();
