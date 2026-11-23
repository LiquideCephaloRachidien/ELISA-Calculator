// Canvas scatter plot. No chart library.
// drawCurve(canvas, points, line)
//   points: {x, y}[] from ElisaCurve
//   line: null or {slope, intercept}
// Scale the backing store by devicePixelRatio before drawing, and set the
// canvas accessible name from the slope and R² when a line exists.
(function () {
  "use strict";

  window.ElisaPlot = {
    drawCurve: function (_canvas, _points, _line) {
      throw new Error("ElisaPlot.drawCurve is not implemented");
    },
  };
})();
