// 96-well plate. Pick a type and click wells to mark them, or switch to
// optical density and type a value for the well you click.
// wells is the record. The button only shows that record.
(function () {
  "use strict";

  var ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
  var plate = document.getElementById("plate");
  var controls = document.getElementById("plate-controls");
  if (!plate || !controls) {
    return;
  }

  var typePicker = document.getElementById("type-picker");
  var odEditor = document.getElementById("od-editor");
  var wellLabel = document.getElementById("well-label");
  var wellOd = document.getElementById("well-od");
  var wellConcentration = document.getElementById("well-concentration");
  var wellName = document.getElementById("well-name");
  var concentrationField = document.getElementById("well-concentration-field");
  var nameField = document.getElementById("well-name-field");

  var wells = {};
  var selected = "";
  var strokeActive = false;
  var strokeOrigin = "";
  var strokeLast = "";
  var strokeMoved = false;
  var originMatched = false;

  function mode() {
    var checked = controls.querySelector('input[name="plate-mode"]:checked');
    return checked ? checked.value : "type";
  }

  function chosenType() {
    var checked = controls.querySelector('input[name="plate-type"]:checked');
    return checked ? checked.value : "blank";
  }

  function paint(id) {
    var well = wells[id];
    var button = plate.querySelector('[data-well="' + id + '"]');
    var active = mode() === "od" && id === selected;
    button.textContent = well.od;
    button.dataset.role = well.role;
    button.classList.toggle("is-selected", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    var parts = ["Well " + id];
    if (well.role !== "empty") {
      parts.push(well.role);
    }
    if (well.od) {
      parts.push("optical density " + well.od);
    }
    if (well.role === "standard" && well.concentration) {
      parts.push("concentration " + well.concentration);
    }
    if (well.role === "sample" && well.name) {
      parts.push(well.name);
    }
    button.setAttribute("aria-label", parts.join(", "));
  }

  function paintAll() {
    ROWS.forEach(function (row) {
      for (var col = 1; col <= 12; col += 1) {
        paint(row + col);
      }
    });
  }

  function showRoleFields() {
    if (!selected) {
      concentrationField.hidden = true;
      nameField.hidden = true;
      return;
    }
    var role = wells[selected].role;
    concentrationField.hidden = role !== "standard";
    nameField.hidden = role !== "sample";
  }

  function loadOd(id) {
    var well = wells[id];
    wellLabel.textContent = "Well " + id;
    wellOd.disabled = false;
    wellOd.value = well.od;
    wellConcentration.value = well.concentration;
    wellName.value = well.name;
    showRoleFields();
    wellOd.focus();
  }

  function writeOd() {
    if (mode() !== "od" || !selected) {
      return;
    }
    var well = wells[selected];
    well.od = wellOd.value.trim();
    well.concentration = wellConcentration.value.trim();
    well.name = wellName.value.trim();
    paint(selected);
  }

  function applyMode() {
    var typing = mode() === "type";
    typePicker.hidden = !typing;
    odEditor.hidden = typing;
    if (!typing && selected) {
      loadOd(selected);
    }
    if (!typing && !selected) {
      wellLabel.textContent = "Click a well";
      wellOd.disabled = true;
      wellOd.value = "";
      showRoleFields();
    }
    paintAll();
  }

  function onWell(id) {
    selected = id;
    paintAll();
    loadOd(id);
  }

  function wellFromPoint(x, y) {
    var element = document.elementFromPoint(x, y);
    if (!element || !element.closest) {
      return "";
    }
    var button = element.closest("[data-well]");
    if (!button || !plate.contains(button)) {
      return "";
    }
    return button.dataset.well;
  }

  function cell(id) {
    return {
      row: ROWS.indexOf(id.charAt(0)),
      col: Number(id.slice(1)) - 1,
    };
  }

  function applyType(id) {
    var type = chosenType();
    if (wells[id].role === type) {
      return;
    }
    wells[id].role = type;
    selected = "";
    paint(id);
  }

  function strokeBetween(fromId, toId) {
    var from = cell(fromId);
    var to = cell(toId);
    var steps = Math.max(Math.abs(to.row - from.row), Math.abs(to.col - from.col));
    var i;
    for (i = 0; i <= steps; i += 1) {
      var row = Math.round(from.row + ((to.row - from.row) * i) / steps);
      var col = Math.round(from.col + ((to.col - from.col) * i) / steps);
      applyType(ROWS[row] + (col + 1));
    }
  }

  function clearPlate() {
    strokeActive = false;
    selected = "";
    ROWS.forEach(function (row) {
      var col;
      for (col = 1; col <= 12; col += 1) {
        var well = wells[row + col];
        well.od = "";
        well.role = "empty";
        well.concentration = "";
        well.name = "";
      }
    });
    wellLabel.textContent = "Click a well";
    wellOd.value = "";
    wellOd.disabled = true;
    wellConcentration.value = "";
    wellName.value = "";
    showRoleFields();
    paintAll();
  }

  function endStroke() {
    if (!strokeActive) {
      return;
    }
    if (!strokeMoved && originMatched) {
      wells[strokeOrigin].role = "empty";
      paint(strokeOrigin);
    }
    strokeActive = false;
  }

  function addLabel(text) {
    var label = document.createElement("span");
    label.className = "plate-label";
    label.textContent = text;
    plate.appendChild(label);
  }

  addLabel("");
  for (var column = 1; column <= 12; column += 1) {
    addLabel(String(column));
  }

  ROWS.forEach(function (row) {
    addLabel(row);
    for (var col = 1; col <= 12; col += 1) {
      var id = row + col;
      var button = document.createElement("button");
      button.type = "button";
      button.dataset.well = id;
      button.dataset.role = "empty";
      button.setAttribute("aria-pressed", "false");
      plate.appendChild(button);
      wells[id] = { id: id, od: "", role: "empty", concentration: "", name: "" };
      paint(id);
    }
  });

  plate.addEventListener("pointerdown", function (event) {
    if (mode() !== "type") {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    var id = wellFromPoint(event.clientX, event.clientY);
    if (!id) {
      return;
    }
    event.preventDefault();
    strokeActive = true;
    strokeOrigin = id;
    strokeLast = id;
    strokeMoved = false;
    originMatched = wells[id].role === chosenType();
    try {
      plate.setPointerCapture(event.pointerId);
    } catch (error) {
      // A press that the browser will not capture still paints wells under the pointer.
    }
    if (!originMatched) {
      applyType(id);
    }
  });

  plate.addEventListener("pointermove", function (event) {
    if (!strokeActive) {
      return;
    }
    var id = wellFromPoint(event.clientX, event.clientY);
    if (!id || id === strokeLast) {
      return;
    }
    strokeMoved = true;
    strokeBetween(strokeLast, id);
    strokeLast = id;
  });

  plate.addEventListener("pointerup", endStroke);
  plate.addEventListener("pointercancel", endStroke);

  plate.addEventListener("click", function (event) {
    if (mode() === "type") {
      return;
    }
    var button = event.target.closest("[data-well]");
    if (!button || !plate.contains(button)) {
      return;
    }
    onWell(button.dataset.well);
  });

  controls.addEventListener("change", function (event) {
    if (event.target.name === "plate-mode") {
      applyMode();
    }
  });
  odEditor.addEventListener("input", writeOd);
  document.getElementById("clear-plate").addEventListener("click", clearPlate);

  window.ElisaPlate = {
    wells: wells,
  };
})();
