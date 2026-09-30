(function () {
  var logic = globalThis.DemoLogic;
  var tenureInput = document.getElementById('tenure');
  var chargesInput = document.getElementById('charges');
  var baseline = { tenure: 12, charges: 70 };
  var gaugeReady = false;
  var barsReady = false;

  document.getElementById('formula').textContent = logic.churnFormulaText();

  function plot(id, data, layout, ready) {
    var el = document.getElementById(id);
    if (!globalThis.Plotly) {
      el.textContent = 'Chart library failed to load.';
      return false;
    }
    var config = { responsive: true, displayModeBar: false };
    if (ready) Plotly.react(el, data, layout, config);
    else Plotly.newPlot(el, data, layout, config);
    return true;
  }

  function update() {
    var tenure = logic.readSliderInt(tenureInput.value, baseline.tenure);
    var charges = logic.readSliderInt(chargesInput.value, baseline.charges);
    document.getElementById('lblTenure').textContent = String(tenure);
    document.getElementById('lblCharges').textContent = String(charges);

    var probability = logic.churnProbability(tenure, charges);
    var baselineProbability = logic.churnProbability(baseline.tenure, baseline.charges);
    document.getElementById('lblDiff').textContent = logic.formatPoints(
      logic.percentagePointDelta(probability, baselineProbability)
    );

    var tenureContribution = logic.contribution(logic.COEFFICIENTS.tenure, tenure, baseline.tenure);
    var chargesContribution = logic.contribution(logic.COEFFICIENTS.charges, charges, baseline.charges);
    document.getElementById('insights').textContent = logic.churnInsight(
      tenureContribution,
      chargesContribution
    );

    gaugeReady = plot('gauge', [{
      type: 'indicator',
      mode: 'gauge+number',
      value: logic.churnPercent(probability),
      number: { valueformat: '.1f', suffix: '%' },
      title: { text: 'Illustrative churn probability' },
      gauge: { axis: { range: [0, 100] } }
    }], { margin: { t: 40, b: 20 } }, gaugeReady);

    barsReady = plot('bars', [{
      type: 'bar',
      x: ['Tenure', 'Monthly charges'],
      y: [tenureContribution, chargesContribution],
      text: [tenureContribution.toFixed(2), chargesContribution.toFixed(2)],
      textposition: 'auto'
    }], {
      title: 'Coefficient × (value − baseline), in log-odds',
      yaxis: { title: 'Log-odds contribution' },
      margin: { t: 40 }
    }, barsReady);
  }

  tenureInput.addEventListener('input', update);
  chargesInput.addEventListener('input', update);
  document.getElementById('baselineBtn').addEventListener('click', function () {
    baseline.tenure = logic.readSliderInt(tenureInput.value, baseline.tenure);
    baseline.charges = logic.readSliderInt(chargesInput.value, baseline.charges);
    update();
  });
  update();
})();
