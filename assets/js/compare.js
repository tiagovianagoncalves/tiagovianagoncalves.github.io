// Before/after slider: drag across the frame (mouse, pen or touch) to move
// the divider. The frame is a focusable slider, so arrow keys, Home and End
// work too. Vertical swipes still scroll the page (touch-action: pan-y).
(function () {
  document.querySelectorAll(".compare__frame").forEach(function (frame) {
    var pos = 50;
    var dragging = false;

    function set(p) {
      pos = Math.max(0, Math.min(100, p));
      frame.style.setProperty("--pos", pos + "%");
      frame.setAttribute("aria-valuenow", Math.round(pos));
    }

    function fromEvent(e) {
      var r = frame.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    }

    frame.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      dragging = true;
      frame.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    frame.addEventListener("pointermove", function (e) {
      if (dragging) fromEvent(e);
    });
    ["pointerup", "pointercancel"].forEach(function (type) {
      frame.addEventListener(type, function () { dragging = false; });
    });

    frame.addEventListener("keydown", function (e) {
      var step = e.shiftKey ? 10 : 2;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") set(pos - step);
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") set(pos + step);
      else if (e.key === "Home") set(0);
      else if (e.key === "End") set(100);
      else return;
      e.preventDefault();
    });

    set(pos);
  });
})();
