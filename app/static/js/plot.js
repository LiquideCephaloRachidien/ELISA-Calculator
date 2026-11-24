// Canvas scatter plot. No chart library.
// drawCurve(canvas, points, line)
//   points: {x, y}[] from ElisaCurve
//   line: null or {slope, intercept, r2}
// Scale the backing store by devicePixelRatio before drawing, and set the
// canvas accessible name from the slope and R² when a line exists.
(function () {
  "use strict";

  function cssNumber(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function niceStep(span) {
    var rough = span / 4;
    var power = Math.pow(10, Math.floor(Math.log10(rough)));
    var error = rough / power;
    var factor = 1;
    if (error >= 7.5) {
      factor = 10;
    } else if (error >= 3.5) {
      factor = 5;
    } else if (error >= 1.5) {
      factor = 2;
    }
    return factor * power;
  }

  function ticks(min, max) {
    var span = max - min;
    if (!(span > 0)) {
      return [min];
    }
    var step = niceStep(span);
    var start = Math.ceil((min - step * 1e-9) / step) * step;
    var values = [];
    var index;
    for (index = 0; index < 8; index += 1) {
      var value = start + index * step;
      if (value > max + step * 1e-6) {
        break;
      }
      if (value >= min - step * 1e-6) {
        values.push(value);
      }
    }
    return values;
  }

  function tickLabel(value) {
    var absolute = Math.abs(value);
    if (absolute !== 0 && (absolute < 0.001 || absolute >= 10000)) {
      return value.toExponential(1);
    }
    return String(Math.round(value * 10000) / 10000);
  }

  function formatStat(value) {
    if (value === null || !isFinite(value)) {
      return "not defined";
    }
    return String(Math.round(value * 10000) / 10000);
  }

  function paddedRange(values, includeZero) {
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    if (includeZero) {
      min = Math.min(min, 0);
      max = Math.max(max, 0);
    }
    if (min === max) {
      var pad = Math.abs(min) * 0.1 || 1;
      return { min: min - pad, max: max + pad };
    }
    var span = max - min;
    return { min: min - span * 0.08, max: max + span * 0.08 };
  }

  window.ElisaPlot = {
    drawCurve: function (canvas, points, line) {
      var cssWidth = canvas.clientWidth || canvas.width;
      var cssHeight = Math.max(220, Math.round(cssWidth * 360 / 640));
      var ratio = window.devicePixelRatio || 1;
      canvas.style.height = cssHeight + "px";
      canvas.width = Math.round(cssWidth * ratio);
      canvas.height = Math.round(cssHeight * ratio);

      var context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      var ink = cssNumber("--ink", "#1c1b19");
      var muted = cssNumber("--muted", "#5c5852");
      var grid = cssNumber("--line", "#d9d4cc");
      var accent = cssNumber("--accent", "#1f6b4a");
      var panel = cssNumber("--panel", "#ffffff");

      context.clearRect(0, 0, cssWidth, cssHeight);
      context.fillStyle = panel;
      context.fillRect(0, 0, cssWidth, cssHeight);

      var plot = { left: 64, right: cssWidth - 20, top: 16, bottom: cssHeight - 48 };
      var xValues = points.length ? points.map(function (point) { return point.x; }) : [0, 1];
      var yValues = points.length ? points.map(function (point) { return point.y; }) : [0, 1];
      var xRange = paddedRange(xValues, true);
      var yRange = paddedRange(yValues, true);

      function xPixel(value) {
        return plot.left + (value - xRange.min) / (xRange.max - xRange.min) * (plot.right - plot.left);
      }
      function yPixel(value) {
        return plot.bottom - (value - yRange.min) / (yRange.max - yRange.min) * (plot.bottom - plot.top);
      }

      context.strokeStyle = grid;
      context.fillStyle = muted;
      context.lineWidth = 1;
      context.font = "12px system-ui, sans-serif";
      context.textAlign = "right";
      context.textBaseline = "middle";
      ticks(yRange.min, yRange.max).forEach(function (value) {
        var y = yPixel(value);
        context.beginPath();
        context.moveTo(plot.left, y);
        context.lineTo(plot.right, y);
        context.stroke();
        context.fillText(tickLabel(value), plot.left - 8, y);
      });

      context.textAlign = "center";
      context.textBaseline = "top";
      ticks(xRange.min, xRange.max).forEach(function (value) {
        var x = xPixel(value);
        context.beginPath();
        context.moveTo(x, plot.top);
        context.lineTo(x, plot.bottom);
        context.stroke();
        context.fillText(tickLabel(value), x, plot.bottom + 6);
      });

      context.strokeStyle = ink;
      context.strokeRect(plot.left, plot.top, plot.right - plot.left, plot.bottom - plot.top);

      var unit = document.getElementById("unit");
      var unitText = unit && unit.value.trim() ? " (" + unit.value.trim() + ")" : "";
      context.fillStyle = ink;
      context.font = "13px system-ui, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "bottom";
      context.fillText("Concentration" + unitText, (plot.left + plot.right) / 2, cssHeight - 4);

      context.save();
      context.translate(16, (plot.top + plot.bottom) / 2);
      context.rotate(-Math.PI / 2);
      context.textBaseline = "middle";
      context.fillText("Average optical density", 0, 0);
      context.restore();

      if (line) {
        context.save();
        context.beginPath();
        context.rect(plot.left, plot.top, plot.right - plot.left, plot.bottom - plot.top);
        context.clip();
        context.strokeStyle = accent;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(xPixel(xRange.min), yPixel(line.slope * xRange.min + line.intercept));
        context.lineTo(xPixel(xRange.max), yPixel(line.slope * xRange.max + line.intercept));
        context.stroke();
        context.restore();
      }

      points.forEach(function (point) {
        context.beginPath();
        context.fillStyle = accent;
        context.arc(xPixel(point.x), yPixel(point.y), 4.5, 0, Math.PI * 2);
        context.fill();
      });

      if (line) {
        var r2 = line.r2 === null ? "not defined" : formatStat(line.r2);
        canvas.setAttribute("aria-label", "Standard curve, slope " + formatStat(line.slope) + ", R squared " + r2);
      } else {
        canvas.setAttribute("aria-label", "Standard curve plot");
      }
    },
  };
})();
