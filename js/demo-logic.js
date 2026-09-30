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
  var MAX_REVIEW_CHARS = 2000;
  var TOPIC_HYPOTHESIS = 'This review is about {}.';

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

  // transformers.js 2.11.0 zero-shot _call(text, labels, options).
  // The second argument is the label array. An options object is read as one label.
  function zeroShotArguments(labels) {
    if (!Array.isArray(labels) || labels.length === 0) {
      throw new Error('topic labels must be a non-empty array of strings');
    }
    labels.forEach(function (label) {
      if (typeof label !== 'string' || label.trim() === '') {
        throw new Error('topic labels must be a non-empty array of strings');
      }
    });
    return [
      labels.slice(),
      { hypothesis_template: TOPIC_HYPOTHESIS, multi_label: true }
    ];
  }

  function topicChartData(output) {
    if (!output || !Array.isArray(output.labels) || !Array.isArray(output.scores)) return null;
    if (!output.labels.length || output.labels.length !== output.scores.length) return null;
    for (var i = 0; i < output.labels.length; i += 1) {
      if (typeof output.labels[i] !== 'string' || output.labels[i] === '[object Object]') return null;
      if (typeof output.scores[i] !== 'number' || !Number.isFinite(output.scores[i])) return null;
    }
    return { labels: output.labels.slice(), scores: output.scores.slice() };
  }

  function clipReview(text) {
    var value = String(text);
    if (value.length <= MAX_REVIEW_CHARS) return { text: value, truncated: false };
    return { text: value.slice(0, MAX_REVIEW_CHARS), truncated: true };
  }

  function runStages(stages) {
    return stages.reduce(function (promise, stage) {
      return promise.then(function () {
        return Promise.resolve().then(stage.task).catch(function (error) {
          stage.onError(error);
        });
      });
    }, Promise.resolve());
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
    if (inQuotes) throw new Error('CSV has an unclosed quote');
    if (cell.length > 0 || row.length > 0) {
      row.push(cell);
      rows.push(row);
    }

    var nonEmpty = rows.filter(function (cells) {
      return cells.some(function (value) { return String(value).trim() !== ''; });
    });
    if (!nonEmpty.length) return [];

    var warnings = [];
    var usedNames = Object.create(null);
    var skippedEmpty = false;
    var header = nonEmpty[0].map(function (raw) {
      var name = String(raw).trim();
      if (!name) {
        skippedEmpty = true;
        return '';
      }
      var key = name;
      var n = 2;
      while (Object.prototype.hasOwnProperty.call(usedNames, key)) {
        key = name + ' (' + n + ')';
        n += 1;
      }
      if (key !== name) warnings.push('Duplicate column "' + name + '" was kept as "' + key + '".');
      usedNames[key] = true;
      return key;
    });
    if (skippedEmpty) warnings.push('A column with an empty name was skipped.');

    var records = nonEmpty.slice(1).map(function (cells) {
      var record = {};
      header.forEach(function (name, index) {
        if (!name) return;
        // defineProperty stores "__proto__" as data. Assignment would throw in strict mode.
        Object.defineProperty(record, name, {
          value: cells[index] == null ? '' : cells[index],
          enumerable: true,
          writable: true,
          configurable: true
        });
      });
      return record;
    });
    if (warnings.length) records.warnings = warnings;
    return records;
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

  function exampleClaims(column, stats) {
    var name = String(column);
    var mean = stats.mean.toFixed(2);
    var min = stats.min.toFixed(2);
    var max = stats.max.toFixed(2);
    var count = stats.count;
    return [
      {
        type: 'unsupported number',
        sentence: 'The average of ' + name + ' is ' + (stats.mean + 17.4).toFixed(2) + '.',
        falsifier: 'Mean is ' + mean + '.'
      },
      {
        type: 'wrong comparison',
        sentence: 'The minimum ' + name + ' is higher than the maximum.',
        falsifier: 'Minimum is ' + min + '. Maximum is ' + max + '.'
      },
      {
        type: 'invented cause',
        sentence: name + ' reaches ' + max + ' because a weekend promotion doubled demand.',
        falsifier: 'Maximum is ' + max + '. The column stats are minimum, mean, maximum, and row count. They do not record a cause.'
      },
      {
        type: 'unsupported number',
        sentence: 'This summary is based on ' + (count + 1800) + ' records.',
        falsifier: 'Row count is ' + count + '.'
      },
      {
        type: 'wrong comparison',
        sentence: 'The average of ' + name + ' sits above the maximum.',
        falsifier: 'Mean is ' + mean + '. Maximum is ' + max + '.'
      },
      {
        type: 'invented cause',
        sentence: 'The range of ' + name + ' widened after a pricing change.',
        falsifier: 'Minimum is ' + min + ' and maximum is ' + max + ' (mean ' + mean + ', ' + count + ' rows). Those figures are one snapshot. They do not show a change over time or a price cause.'
      }
    ];
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
    MAX_REVIEW_CHARS: MAX_REVIEW_CHARS,
    TOPIC_HYPOTHESIS: TOPIC_HYPOTHESIS,
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
    zeroShotArguments: zeroShotArguments,
    topicChartData: topicChartData,
    clipReview: clipReview,
    runStages: runStages,
    parseCSV: parseCSV,
    numericColumns: numericColumns,
    summarizeNumeric: summarizeNumeric,
    summaryText: summaryText,
    exampleClaims: exampleClaims,
    illustrativeBand: illustrativeBand,
    formatMonth: formatMonth,
    shiftMonth: shiftMonth,
    normalSample: normalSample,
    readSliderInt: readSliderInt
  };
});
