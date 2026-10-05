// Feed masonry: deals items into two columns, each going to the shorter one,
// so images keep their natural heights and newest-first order reads across the
// top. Heights come from each image's width/height attributes, so this runs
// before images load. Without JS the grid falls back to a plain CSS grid.
(function () {
  var grid = document.querySelector(".feed__grid");
  if (!grid) return;
  var items = Array.prototype.slice.call(grid.querySelectorAll(".feed__item"));
  if (!items.length) return;
  var twoCols = window.matchMedia("(min-width: 641px)");

  function ratio(item) {
    var img = item.querySelector("img");
    var w = +img.getAttribute("width") || 1;
    var h = +img.getAttribute("height") || 1;
    return h / w;
  }

  function layout() {
    grid.innerHTML = "";
    if (!twoCols.matches) {
      grid.classList.remove("is-masonry");
      items.forEach(function (item) { grid.appendChild(item); });
      return;
    }
    grid.classList.add("is-masonry");
    var cols = [document.createElement("div"), document.createElement("div")];
    var heights = [0, 0];
    cols.forEach(function (col) {
      col.className = "feed__col";
      grid.appendChild(col);
    });
    items.forEach(function (item) {
      var i = heights[0] <= heights[1] ? 0 : 1;
      cols[i].appendChild(item);
      heights[i] += ratio(item);
    });
  }

  layout();
  twoCols.addEventListener("change", layout);
})();
