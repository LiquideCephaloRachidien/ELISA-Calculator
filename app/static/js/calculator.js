// Standards under the plate: number, concentration, and two optical densities.
// The average cell is the mean of those two readings.
// Add a row by cloning the template. Never use innerHTML.
(function () {
  "use strict";

  var form = document.getElementById("assay-form");
  var body = document.getElementById("standards-body");
  var template = document.getElementById("standard-row-template");
  if (!form || !body || !template) {
    return;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
  });

  function rows() {
    return body.querySelectorAll('tr[data-kind="standard"]');
  }

  function field(row, name) {
    return row.querySelector('[data-field="' + name + '"]');
  }

  function nextNumber() {
    var max = 0;
    Array.prototype.forEach.call(rows(), function (row) {
      var value = Number(String(field(row, "number").value).replace(",", "."));
      if (isFinite(value) && value > max) {
        max = value;
      }
    });
    return String(max + 1);
  }

  function parseDecimal(text) {
    var trimmed = String(text).trim().replace(",", ".");
    if (trimmed === "") {
      return null;
    }
    var value = Number(trimmed);
    if (!isFinite(value)) {
      return null;
    }
    return value;
  }

  function formatAverage(value) {
    return value.toFixed(4).replace(/\.?0+$/, "");
  }

  function formatStat(value) {
    if (value === null || !isFinite(value)) {
      return "—";
    }
    return String(Math.round(value * 10000) / 10000);
  }

  function standardPoints() {
    var list = [];
    Array.prototype.forEach.call(rows(), function (row) {
      var concentration = parseDecimal(field(row, "concentration").value);
      var first = parseDecimal(field(row, "od-1").value);
      var second = parseDecimal(field(row, "od-2").value);
      if (concentration === null || first === null || second === null) {
        return;
      }
      list.push({ x: concentration, y: (first + second) / 2 });
    });
    return list;
  }

  function plotCurve() {
    var canvas = document.getElementById("curve-canvas");
    var status = document.getElementById("fit-status");
    var summary = document.getElementById("fit-summary");
    if (!canvas || !status || !summary || !window.ElisaCurve || !window.ElisaPlot) {
      return;
    }
    var data = standardPoints();
    var line = window.ElisaCurve.fitLine(data);
    window.ElisaPlot.drawCurve(canvas, data, line);
    if (!line) {
      summary.hidden = true;
      status.textContent = data.length < 2
        ? "Enter at least two standards to plot the curve."
        : "These standards share one concentration, so a line cannot be fit.";
      return;
    }
    summary.hidden = false;
    summary.querySelector('[data-field="slope"]').textContent = formatStat(line.slope);
    summary.querySelector('[data-field="intercept"]').textContent = formatStat(line.intercept);
    summary.querySelector('[data-field="r2"]').textContent = formatStat(line.r2);
    status.textContent = "Line fitted to " + data.length + " standards.";
  }

  function updateAverage(row) {
    var first = parseDecimal(field(row, "od-1").value);
    var second = parseDecimal(field(row, "od-2").value);
    var cell = field(row, "average");
    if (first === null || second === null) {
      cell.textContent = "—";
      return;
    }
    cell.textContent = formatAverage((first + second) / 2);
  }

  function labelRows() {
    Array.prototype.forEach.call(rows(), function (row, index) {
      var n = index + 1;
      field(row, "number").setAttribute("aria-label", "Standard " + n + " number");
      field(row, "concentration").setAttribute("aria-label", "Standard " + n + " concentration");
      field(row, "od-1").setAttribute("aria-label", "Standard " + n + " optical density 1");
      field(row, "od-2").setAttribute("aria-label", "Standard " + n + " optical density 2");
      updateAverage(row);
    });
  }

  function addRow() {
    var row = template.content.firstElementChild.cloneNode(true);
    field(row, "number").value = nextNumber();
    body.appendChild(row);
    labelRows();
    field(row, "concentration").focus();
    plotCurve();
  }

  function removeRow(row) {
    if (rows().length === 1) {
      Array.prototype.forEach.call(row.querySelectorAll("input"), function (input) {
        input.value = "";
      });
      updateAverage(row);
      plotCurve();
      return;
    }
    row.remove();
    labelRows();
    plotCurve();
  }

  body.addEventListener("input", function (event) {
    var row = event.target.closest("tr");
    if (!row || !body.contains(row)) {
      return;
    }
    updateAverage(row);
    plotCurve();
  });

  body.addEventListener("click", function (event) {
    var button = event.target.closest('[data-action="remove-row"]');
    if (!button || !body.contains(button)) {
      return;
    }
    removeRow(button.closest("tr"));
  });

  form.addEventListener("click", function (event) {
    var button = event.target.closest('[data-action="add-standard"]');
    if (!button || !form.contains(button)) {
      return;
    }
    addRow();
  });

  var unit = document.getElementById("unit");
  if (unit) {
    unit.addEventListener("input", plotCurve);
  }
  window.addEventListener("resize", plotCurve);
  labelRows();
  plotCurve();
})();
