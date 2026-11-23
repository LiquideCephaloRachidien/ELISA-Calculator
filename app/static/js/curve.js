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

    fitLine: function (_points) {
      throw new Error("ElisaCurve.fitLine is not implemented");
    },

    predictConcentration: function (_slope, _intercept, _meanCorrectedOd, _dilution) {
      throw new Error("ElisaCurve.predictConcentration is not implemented");
    },
  };
})();
