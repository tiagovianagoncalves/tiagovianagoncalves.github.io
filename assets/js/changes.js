// "What changed" filters: each type chip shows or hides the rows of that type.
// A group with nothing left to show hides too, and the last visible row in
// each list drops its divider.
(function () {
  document.querySelectorAll(".changes__filters").forEach(function (filters) {
    var section = filters.closest(".case__section");
    var buttons = filters.querySelectorAll("[data-filter]");
    var groups = section.querySelectorAll(".changes__group");

    function update() {
      var shown = {};
      buttons.forEach(function (b) {
        shown[b.getAttribute("data-filter")] = b.getAttribute("aria-pressed") === "true";
      });
      groups.forEach(function (group) {
        var visible = [];
        group.querySelectorAll("li[data-change]").forEach(function (row) {
          var on = shown[row.getAttribute("data-change")];
          row.hidden = !on;
          row.classList.remove("is-last");
          if (on) visible.push(row);
        });
        if (visible.length) visible[visible.length - 1].classList.add("is-last");
        group.hidden = !visible.length;
      });
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true");
        update();
      });
    });
    update();
  });
})();
