// Page transitions: on navigation (cross-document View Transitions) and on a
// page's first load, the blocks in view rise in one after another, top to
// bottom. Loaded without defer so it is ready before the page's first paint.
(function () {
  // Containers listed here are opened up so their children animate separately
  var CONTAINERS = ".hero, .case__intro, .projects, .project-list, .case__body, .case__section, .feed__grid, .feed__col";

  function blocks(el, out) {
    Array.prototype.forEach.call(el.children, function (child) {
      if (child.matches(CONTAINERS)) blocks(child, out);
      else out.push(child);
    });
    return out;
  }

  function stagger() {
    var main = document.querySelector("main");
    if (!main) return;
    var vh = window.innerHeight;
    var items = blocks(main, [])
      .map(function (el) { return { el: el, r: el.getBoundingClientRect() }; })
      .filter(function (it) { return it.r.height > 1 && it.r.bottom > 0 && it.r.top < vh; })
      .sort(function (a, b) { return a.r.top - b.r.top || a.r.left - b.r.left; });
    items.forEach(function (it, i) {
      it.el.style.setProperty("--pt-i", Math.min(i, 8));
      it.el.classList.add("pt-rise");
      it.el.addEventListener("animationend", function done(e) {
        if (e.target !== it.el) return;
        it.el.classList.remove("pt-rise");
        it.el.removeEventListener("animationend", done);
      });
    });
  }

  // Lets content added later (an unlocked case study) rise in the same way
  window.ptStagger = stagger;

  // Without pagereveal (older browsers) it runs as soon as the DOM is ready
  var firstReveal = true;
  if ("onpagereveal" in window) {
    window.addEventListener("pagereveal", function (e) {
      if (e.viewTransition || firstReveal) stagger();
      firstReveal = false;
    });
  } else {
    document.addEventListener("DOMContentLoaded", stagger);
  }
})();
