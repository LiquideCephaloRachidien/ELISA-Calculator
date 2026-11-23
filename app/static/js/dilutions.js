// Reagent dilution. C1V1 = C2V2, with mass/volume, percent, or fold units.
// Mass units convert inside the family (1 mg/mL = 1000 µg/mL = 1e6 ng/mL).
// Percent does not convert into mg/mL, and X does not convert into either.
(function () {
  "use strict";

  var MASS_TO_PG_PER_ML = {
    "pg/mL": 1,
    "ng/mL": 1000,
    "µg/mL": 1000000,
    "mg/mL": 1000000000,
  };

  var VOLUME_TO_UL = {
    "µL": 1,
    "mL": 1000,
    "L": 1000000,
  };

  function family(unit) {
    if (Object.prototype.hasOwnProperty.call(MASS_TO_PG_PER_ML, unit)) {
      return "mass";
    }
    if (unit === "%") {
      return "percent";
    }
    if (unit === "X") {
      return "fold";
    }
    return "";
  }

  function parseDecimal(raw) {
    var text = String(raw == null ? "" : raw).trim().replace(/\s/g, "");
    if (text === "") {
      return null;
    }
    if (text.indexOf(",") !== -1 && text.indexOf(".") !== -1) {
      return NaN;
    }
    if (text.indexOf(",") !== -1) {
      text = text.replace(",", ".");
    }
    if (!/^\d+(\.\d+)?$/.test(text)) {
      return NaN;
    }
    var value = Number(text);
    return isFinite(value) ? value : NaN;
  }

  function formatSig(value) {
    if (value === 0) {
      return "0";
    }
    return String(Number(value.toPrecision(4)));
  }

  function friendlyVolume(microliters) {
    var abs = Math.abs(microliters);
    if (abs >= 1000000) {
      return formatSig(microliters / 1000000) + " L";
    }
    if (abs >= 1000) {
      return formatSig(microliters / 1000) + " mL";
    }
    return formatSig(microliters) + " µL";
  }

  function dilute(input) {
    var stock = parseDecimal(input.stock);
    var target = parseDecimal(input.target);
    var volume = parseDecimal(input.volume);
    var name = String(input.name || "").trim();
    if (stock === null && target === null && volume === null && name === "") {
      return { state: "empty" };
    }
    if (stock === null || target === null || volume === null) {
      return {
        state: "error",
        message: "Enter the stock concentration, the target concentration, and the final volume.",
      };
    }
    if (isNaN(stock) || isNaN(target) || isNaN(volume)) {
      return {
        state: "error",
        message: "Use a plain number. A comma or a dot can mark the decimal.",
      };
    }
    if (stock <= 0 || target <= 0 || volume <= 0) {
      return {
        state: "error",
        message: "Concentrations and the final volume have to be greater than zero.",
      };
    }
    var stockFamily = family(input.stockUnit);
    var targetFamily = family(input.targetUnit);
    if (stockFamily === "" || targetFamily === "") {
      return { state: "error", message: "Choose a unit." };
    }
    if (stockFamily !== targetFamily) {
      return {
        state: "error",
        message: "Stock and target have to use the same kind of unit: mass per mL, %, or X.",
      };
    }
    if (!Object.prototype.hasOwnProperty.call(VOLUME_TO_UL, input.volumeUnit)) {
      return { state: "error", message: "Choose a volume unit." };
    }

    var c1 = stockFamily === "mass" ? stock * MASS_TO_PG_PER_ML[input.stockUnit] : stock;
    var c2 = targetFamily === "mass" ? target * MASS_TO_PG_PER_ML[input.targetUnit] : target;
    if (c2 > c1) {
      return {
        state: "error",
        message: "The target is stronger than the stock. This only dilutes.",
      };
    }

    var finalUl = volume * VOLUME_TO_UL[input.volumeUnit];
    var same = Math.abs(c1 - c2) / c1 < 1e-12;
    var stockUl = same ? finalUl : (c2 / c1) * finalUl;
    var diluentUl = same ? 0 : finalUl - stockUl;
    if (diluentUl < 0) {
      diluentUl = 0;
    }
    return {
      state: "ok",
      name: name,
      stockUl: stockUl,
      diluentUl: diluentUl,
      fold: c1 / c2,
      tiny: stockUl > 0 && stockUl < 1,
    };
  }

  function describe(result) {
    if (result.state === "empty") {
      return "";
    }
    if (result.state === "error") {
      return result.message;
    }
    var prefix = result.name ? result.name + ": " : "";
    if (result.fold === 1) {
      return prefix + "Use " + friendlyVolume(result.stockUl) + " of stock undiluted.";
    }
    var text =
      prefix +
      "Take " +
      friendlyVolume(result.stockUl) +
      " of stock and add " +
      friendlyVolume(result.diluentUl) +
      " of diluent (" +
      formatSig(result.fold) +
      "-fold).";
    if (result.tiny) {
      text += " Under 1 µL is hard to pipette; dilute the stock in steps.";
    }
    return text;
  }

  window.ElisaDilution = {
    dilute: dilute,
    describe: describe,
  };

  var form = document.getElementById("dilution-form");
  if (!form) {
    return;
  }

  var rows = document.getElementById("dilution-rows");
  var template = document.getElementById("reagent-template");

  function readRow(row) {
    function value(field) {
      var element = row.querySelector("[data-field='" + field + "']");
      return element ? element.value : "";
    }
    return {
      name: value("name"),
      stock: value("stock"),
      stockUnit: value("stock-unit"),
      target: value("target"),
      targetUnit: value("target-unit"),
      volume: value("volume"),
      volumeUnit: value("volume-unit"),
    };
  }

  function updateRow(row) {
    var result = dilute(readRow(row));
    var output = row.querySelector("[data-field='result']");
    output.textContent = describe(result);
    output.classList.toggle("is-error", result.state === "error");
  }

  function reindex() {
    var cards = rows.querySelectorAll("[data-kind='reagent']");
    Array.prototype.forEach.call(cards, function (card, index) {
      var number = index + 1;
      card.querySelectorAll("label[data-for]").forEach(function (label) {
        var field = label.getAttribute("data-for");
        var input = card.querySelector("input[data-field='" + field + "']");
        if (!input) {
          return;
        }
        input.id = "reagent-" + number + "-" + field;
        label.htmlFor = input.id;
      });
      card.querySelectorAll("select[data-field]").forEach(function (select) {
        var field = select.getAttribute("data-field");
        select.id = "reagent-" + number + "-" + field;
        if (field === "stock-unit") {
          select.setAttribute("aria-label", "Reagent " + number + " stock unit");
        } else if (field === "target-unit") {
          select.setAttribute("aria-label", "Reagent " + number + " target unit");
        } else if (field === "volume-unit") {
          select.setAttribute("aria-label", "Reagent " + number + " final volume unit");
        }
      });
    });
  }

  function addRow() {
    var card = template.content.firstElementChild.cloneNode(true);
    rows.appendChild(card);
    reindex();
    var name = card.querySelector("[data-field='name']");
    if (name) {
      name.focus();
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
  });

  form.addEventListener("input", function (event) {
    var card = event.target.closest("[data-kind='reagent']");
    if (card) {
      updateRow(card);
    }
  });

  form.addEventListener("change", function (event) {
    var card = event.target.closest("[data-kind='reagent']");
    if (card) {
      updateRow(card);
    }
  });

  form.addEventListener("click", function (event) {
    var add = event.target.closest("[data-action='add-reagent']");
    if (add) {
      addRow();
      return;
    }
    var remove = event.target.closest("[data-action='remove-reagent']");
    if (!remove) {
      return;
    }
    var card = remove.closest("[data-kind='reagent']");
    var cards = rows.querySelectorAll("[data-kind='reagent']");
    if (cards.length === 1) {
      card.querySelectorAll("input").forEach(function (input) {
        input.value = "";
      });
      updateRow(card);
      return;
    }
    card.remove();
    reindex();
  });

  reindex();
})();
