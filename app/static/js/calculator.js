// DOM wiring for the public calculator.
//
// Collect rows from [data-kind="standard"] and [data-kind="sample"].
// Read inputs with data-field. Write means, percents, and concentrations
// with textContent. Add a row by cloning <template>, never with innerHTML.
// Toggle flag-warn (15%) and flag-bad (25%) on the replicate inputs.
// The percent text is the non-color signal; the class is only a highlight.
// Ignore completely empty rows. Call preventDefault on submit: this page
// calculates locally and does not post the plate.
(function () {
  "use strict";

  var form = document.getElementById("assay-form");
  if (!form) {
    return;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
  });
})();
