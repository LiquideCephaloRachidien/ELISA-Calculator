// 96-well plate. Click a well, then type its optical density in the editor.
// wells is the record. The button only shows that record.
(function () {
  "use strict";

  var ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
  var plate = document.getElementById("plate");
  var editor = document.getElementById("well-editor");
  if (!plate || !editor) {
    return;
  }

  var wellLabel = document.getElementById("well-label");
  var wellOd = document.getElementById("well-od");
  var wellRole = document.getElementById("well-role");
  var wellConcentration = document.getElementById("well-concentration");
  var wellName = document.getElementById("well-name");
  var concentrationField = document.getElementById("well-concentration-field");
  var nameField = document.getElementById("well-name-field");

  var wells = {};
  var selected = "";

  function paint(id) {
    var well = wells[id];
    var button = plate.querySelector('[data-well="' + id + '"]');
    button.textContent = well.od;
    button.dataset.role = well.role;
    button.classList.toggle("is-selected", id === selected);
    button.setAttribute("aria-pressed", id === selected ? "true" : "false");
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

  function showRoleFields() {
    concentrationField.hidden = wellRole.value !== "standard";
    nameField.hidden = wellRole.value !== "sample";
  }

  function writeSelected() {
    if (!selected) {
      return;
    }
    var well = wells[selected];
    well.od = wellOd.value.trim();
    well.role = wellRole.value;
    well.concentration = wellConcentration.value.trim();
    well.name = wellName.value.trim();
    showRoleFields();
    paint(selected);
  }

  function openWell(id) {
    selected = id;
    var well = wells[id];
    wellLabel.textContent = "Well " + id;
    wellOd.value = well.od;
    wellRole.value = well.role;
    wellConcentration.value = well.concentration;
    wellName.value = well.name;
    editor.hidden = false;
    showRoleFields();
    ROWS.forEach(function (row) {
      for (var col = 1; col <= 12; col += 1) {
        paint(row + col);
      }
    });
    wellOd.focus();
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

  plate.addEventListener("click", function (event) {
    var button = event.target.closest("[data-well]");
    if (!button || !plate.contains(button)) {
      return;
    }
    openWell(button.dataset.well);
  });

  editor.addEventListener("input", writeSelected);
  editor.addEventListener("change", writeSelected);

  window.ElisaPlate = {
    wells: wells,
  };
})();
