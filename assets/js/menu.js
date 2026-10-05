// Mobile menu: toggles a full-screen sheet. Escape closes it, and focus
// returns to the button that opened it (header or sticky bar).
(function () {
  var root = document.documentElement;
  var openBtn = document.querySelector("[data-menu-open]");
  var closeBtn = document.querySelector("[data-menu-close]");
  var menu = document.getElementById("mobile-menu");
  if (!openBtn || !closeBtn || !menu) return;
  var opener = openBtn;

  function setOpen(open) {
    root.classList.toggle("menu-open", open);
    opener.setAttribute("aria-expanded", String(open));
    menu.toggleAttribute("inert", !open);
    // preventScroll: focusing the header button must not jump the page to the top
    if (open) {
      closeBtn.focus({ preventScroll: true });
    } else {
      opener.focus({ preventScroll: true });
    }
  }

  menu.setAttribute("inert", "");
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-menu-open]");
    if (!btn) return;
    opener = btn;
    setOpen(true);
  });
  closeBtn.addEventListener("click", function () { setOpen(false); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && root.classList.contains("menu-open")) setOpen(false);
  });

  // Leaving mobile width with the menu open should not leave the page locked.
  window.matchMedia("(min-width: 641px)").addEventListener("change", function (e) {
    if (e.matches && root.classList.contains("menu-open")) {
      root.classList.remove("menu-open");
      opener.setAttribute("aria-expanded", "false");
      menu.setAttribute("inert", "");
    }
  });
})();

// Sticky bar: after scrolling past the header, scrolling up a little slides in
// a full-width copy of the header; scrolling down hides it again.
(function () {
  var header = document.querySelector(".site-header");
  if (!header || !window.requestAnimationFrame) return;

  var bar = header.cloneNode(true);
  bar.classList.add("site-header--sticky");
  bar.setAttribute("inert", "");
  var nav = bar.querySelector(".nav");
  if (nav) nav.setAttribute("aria-label", "Main (sticky)");

  document.body.appendChild(bar);

  var UP_DISTANCE = 40; // how far up before the bar shows
  var lastY = window.scrollY;
  var upTravel = 0;
  var shown = false;
  var ticking = false;

  function setShown(next) {
    if (next === shown) return;
    shown = next;
    bar.classList.toggle("is-shown", next);
    bar.toggleAttribute("inert", !next);
  }

  function update() {
    ticking = false;
    var y = Math.max(window.scrollY, 0);
    var delta = y - lastY;
    lastY = y;

    // Near the top the real header is in view, so the bar is not needed
    if (y <= header.offsetHeight) {
      upTravel = 0;
      setShown(false);
      return;
    }
    if (delta > 0) {
      upTravel = 0;
      setShown(false);
    } else if (delta < 0) {
      upTravel -= delta;
      if (upTravel >= UP_DISTANCE) setShown(true);
    }
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
})();
