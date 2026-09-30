(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.DemoLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var COEFFICIENTS = Object.freeze({
    intercept: -4,
    tenure: -0.05,
    charges: 0.04
  });

  var ILLUSTRATIVE_BAND_HALF_WIDTH = 8;
  var ILLUSTRATIVE_BAND_NAME = 'Illustrative band (±8)';
  var FRAUD_TOTAL = 1000;
  var MAX_CSV_BYTES = 1000000;

  var SAMPLE_CSV = [
    'segment,monthly_bill,tickets',
    'A,40,1',
    'B,55,3',
    'C,80,2',
    'D,120,5',
    'E,35,1'
  ].join('\n');

  function churnProbability(tenure, charges, coefficients) {
    var coef = coefficients || COEFFICIENTS;
    var z = coef.intercept + coef.tenure * tenure + coef.charges * charges;
    return 1 / (1 + Math.exp(-z));
  }

  function churnPercent(probability) {
    return probability * 100;
  }

  function percentagePointDelta(probability, baselineProbability) {
    return (probability - baselineProbability) * 100;
  }

  function formatPoints(delta) {
    return delta.toFixed(1) + ' percentage points';
  }

function contribution(coefficient, value, baseline) {
  var result = coefficient * (value - baseline);
  return result === 0 ? 0 : result;
}

  function riskChangePhrase(feature, value) {
    if (value < 0) return feature + ' decreases churn risk relative to the baseline';
    if (value > 0) return feature + ' increases churn risk relative to the baseline';
    return feature + ' matches the baseline, so it does not change churn risk';
  }

  function churnInsight(tenureContribution, chargesContribution) {
    return riskChangePhrase('Tenure', tenureContribution) + '; ' +
      riskChangePhrase('monthly charges', chargesContribution) + '.';
  }

  function churnFormulaText(coefficients) {
    var coef = coefficients || COEFFICIENTS;
    return 'Illustrative logistic, not fit on customer data: probability = sigmoid(' +
      coef.intercept + ' + (' + coef.tenure + ' × tenure) + (' + coef.charges +
      ' × monthly charges)). Bars are coefficient × (value − baseline), not SHAP.';
  }

  function fraudCounts(total, fraudPercent) {
    if (!Number.isInteger(total) || total < 0) {
      throw new Error('total must be a non-negative integer');
    }
    var pct = Number(fraudPercent);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      throw new Error('fraud percent must be between 0 and 100');
    }
    var fraudCount = Math.round((total * pct) / 100);
    return { fraudCount: fraudCount, legitCount: total - fraudCount };
  }

  function mapSentimentScores(output) {
    var rows = Array.isArray(output) ? output.flat() : [];
    var positive = null;
    var negative = null;
    rows.forEach(function (row) {
      if (!row || typeof row.label !== 'string' || typeof row.score !== 'number') return;
      var label = row.label.toUpperCase();
      if (label === 'POSITIVE' || label === 'LABEL_1') positive = row.score;
      else if (label === 'NEGATIVE' || label === 'LABEL_0') negative = row.score;
    });
    return { positive: positive, negative: negative };
  }

  function sentimentVerdict(scores) {
    if (!scores || typeof scores.positive !== 'number' || typeof scores.negative !== 'number') {
      return null;
    }
    if (scores.positive === scores.negative) return 'tie';
    return scores.positive > scores.negative ? 'positive' : 'negative';
  }

  function parseCSV(text) {
    var input = String(text).replace(/^\uFEFF/, '');
    var rows = [];
    var row = [];
    var cell = '';
    var inQuotes = false;

    for (var i = 0; i < input.length; i += 1) {
      var char = input[i];
      if (inQuotes) {
        if (char === '"') {
          if (input[i + 1] === '"') {
            cell += '"';
            i += 1;
          } else {
            inQuotes = false;
          }
        } else {
          cell += char;
        }
        continue;
      }
      if (char === '"') {
        inQuotes = true;
        continue;
      }
      if (char === ',') {
        row.push(cell);
        cell = '';
        continue;
      }
      if (char === '\n' || char === '\r') {
        if (char === '\r' && input[i + 1] === '\n') i += 1;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
        continue;
      }
      cell += char;
    }
    if (cell.length > 0 || row.length > 0) {
      row.push(cell);
      rows.push(row);
    }

    var nonEmpty = rows.filter(function (cells) {
      return cells.some(function (value) { return String(value).trim() !== ''; });
    });
    if (!nonEmpty.length) return [];

    var header = nonEmpty[0].map(function (name) { return name.trim(); });
    return nonEmpty.slice(1).map(function (cells) {
      var record = {};
      header.forEach(function (name, index) {
        if (!name || Object.prototype.hasOwnProperty.call(record, name)) return;
        record[name] = cells[index] == null ? '' : cells[index];
      });
      return record;
    });
  }

  function numericColumns(rows) {
    if (!rows || !rows.length) return [];
    return Object.keys(rows[0]).filter(function (key) {
      var saw = false;
      for (var i = 0; i < rows.length; i += 1) {
        var raw = rows[i][key];
        if (raw == null || String(raw).trim() === '') continue;
        if (!Number.isFinite(Number(String(raw).trim()))) return false;
        saw = true;
      }
      return saw;
    });
  }

function summarizeNumeric(values) {
  var nums = (values || []).filter(function (value) {
    return value != null && String(value).trim() !== '';
  }).map(function (value) {
    return Number(String(value).trim());
  }).filter(function (value) { return Number.isFinite(value); });
    if (!nums.length) return null;
    var sum = nums.reduce(function (total, value) { return total + value; }, 0);
    return {
      count: nums.length,
      mean: sum / nums.length,
      min: Math.min.apply(null, nums),
      max: Math.max.apply(null, nums)
    };
  }

  function summaryText(column, stats) {
    return 'The average of ' + column + ' is ' + stats.mean.toFixed(2) +
      ' with a range from ' + stats.min.toFixed(2) + ' to ' + stats.max.toFixed(2) +
      ' based on ' + stats.count + ' records.';
  }

  function illustrativeBand(values, halfWidth) {
    var width = halfWidth == null ? ILLUSTRATIVE_BAND_HALF_WIDTH : halfWidth;
    return {
      low: values.map(function (value) { return value - width; }),
      high: values.map(function (value) { return value + width; })
    };
  }

  function formatMonth(date) {
    var month = String(date.getMonth() + 1);
    if (month.length < 2) month = '0' + month;
    return date.getFullYear() + '-' + month;
  }

  function shiftMonth(date, monthDelta) {
    return new Date(date.getFullYear(), date.getMonth() + monthDelta, 1);
  }

  function normalSample(mean, std, random) {
    var next = random || Math.random;
    var u = 0;
    var v = 0;
    while (u <= 0) u = next();
    while (v <= 0) v = next();
    return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function readSliderInt(value, fallback) {
    var parsed = Number.parseInt(String(value), 10);
    return Number.isInteger(parsed) ? parsed : fallback;
  }

  return {
    COEFFICIENTS: COEFFICIENTS,
    ILLUSTRATIVE_BAND_HALF_WIDTH: ILLUSTRATIVE_BAND_HALF_WIDTH,
    ILLUSTRATIVE_BAND_NAME: ILLUSTRATIVE_BAND_NAME,
    FRAUD_TOTAL: FRAUD_TOTAL,
    MAX_CSV_BYTES: MAX_CSV_BYTES,
    SAMPLE_CSV: SAMPLE_CSV,
    churnProbability: churnProbability,
    churnPercent: churnPercent,
    percentagePointDelta: percentagePointDelta,
    formatPoints: formatPoints,
    contribution: contribution,
    churnInsight: churnInsight,
    churnFormulaText: churnFormulaText,
    fraudCounts: fraudCounts,
    mapSentimentScores: mapSentimentScores,
    sentimentVerdict: sentimentVerdict,
    parseCSV: parseCSV,
    numericColumns: numericColumns,
    summarizeNumeric: summarizeNumeric,
    summaryText: summaryText,
    illustrativeBand: illustrativeBand,
    formatMonth: formatMonth,
    shiftMonth: shiftMonth,
    normalSample: normalSample,
    readSliderInt: readSliderInt
  };
});
