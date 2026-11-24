// Linear ELISA curve. Keep in sync with app/curve.py (that file is the spec).
// Points are {x: concentration, y: meanCorrectedOd}.
// Thresholds are duplicated from app/config.py.
(function () {
  "use strict";

  window.ElisaCurve = {
    THRESHOLDS: Object.freeze({
      warnPercent: 15,
      badPercent: 25,
      odMin: 0,
      odMax: 4,
      saturationOd: 2.5,
    }),

    percentDifference: function (_a, _b) {
      throw new Error("ElisaCurve.percentDifference is not implemented");
    },

    fitLine: function (points) {
      var n = points.length;
      if (n < 2) {
        return null;
      }
      var sumX = 0;
      var sumY = 0;
      var sumXY = 0;
      var sumXX = 0;
      var i;
      for (i = 0; i < n; i += 1) {
        sumX += points[i].x;
        sumY += points[i].y;
        sumXY += points[i].x * points[i].y;
        sumXX += points[i].x * points[i].x;
      }
      var denominator = n * sumXX - sumX * sumX;
      if (denominator === 0) {
        return null;
      }
      var slope = (n * sumXY - sumX * sumY) / denominator;
      var intercept = (sumY - slope * sumX) / n;
      var meanY = sumY / n;
      var ssResidual = 0;
      var ssTotal = 0;
      for (i = 0; i < n; i += 1) {
        var predicted = slope * points[i].x + intercept;
        ssResidual += (points[i].y - predicted) * (points[i].y - predicted);
        ssTotal += (points[i].y - meanY) * (points[i].y - meanY);
      }
      return {
        slope: slope,
        intercept: intercept,
        r2: ssTotal === 0 ? null : 1 - ssResidual / ssTotal,
      };
    },

    predictConcentration: function (_slope, _intercept, _meanCorrectedOd, _dilution) {
      throw new Error("ElisaCurve.predictConcentration is not implemented");
    },
  };
})();
