// Lightbox for case-study and Feed images: click or press Enter on an image to view it larger.
// Closes with the close button, Escape, or a click on the backdrop.
// Images from a carousel can be switched inside the lightbox with the arrow
// buttons, the arrow keys or a swipe. The image's caption, if it has one,
// shows in a white pill under it.
(function () {
  var images = document.querySelectorAll(".case .figure:not(.case__cover):not(.figure--crop) > img, .carousel__slide > img, .feed__item > img");
  if (!images.length) return;

  var box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Image viewer");
  box.hidden = true;
  box.innerHTML =
    '<button class="lightbox__close" type="button" aria-label="Close">' +
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>' +
    "</button>" +
    '<button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Previous image">' +
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    "</button>" +
    '<button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Next image">' +
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    "</button>" +
    '<img class="lightbox__img" alt="">' +
    '<p class="lightbox__caption" hidden></p>';
  document.body.appendChild(box);

  var big = box.querySelector(".lightbox__img");
  var caption = box.querySelector(".lightbox__caption");
  var closeBtn = box.querySelector(".lightbox__close");
  var prevBtn = box.querySelector(".lightbox__nav--prev");
  var nextBtn = box.querySelector(".lightbox__nav--next");
  var opener = null;
  var group = [];
  var index = 0;

  // Carousel slides carry their own caption; other images use their figure's
  function captionFor(img) {
    var slide = img.closest(".carousel__slide");
    if (slide) return slide.getAttribute("data-caption") || "";
    var figure = img.closest("figure");
    var figcaption = figure && figure.querySelector("figcaption");
    return figcaption ? figcaption.textContent.trim() : "";
  }

  function show(i) {
    index = (i + group.length) % group.length;
    var img = group[index];
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    // Floating modals bring their own shadow, so skip the white backing card.
    // A full-bleed screenshot among them (.carousel__slide--corner) keeps it.
    big.classList.toggle("lightbox__img--bare", !!img.closest(".figure--float") && !img.closest(".carousel__slide--corner"));
    var text = captionFor(img);
    caption.textContent = text;
    caption.hidden = !text;
    box.classList.toggle("lightbox--captioned", !!text);
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var stepToken = 0;

  // Switching images: once the next image is ready it replaces the current one
  // and settles into place with a short slide. No fade, so nothing flashes.
  function step(delta) {
    if (group.length < 2) return;
    // Move the index now, so quick repeated clicks each count
    index = (index + delta + group.length) % group.length;
    var target = index;
    var token = ++stepToken;
    var next = group[target];
    var preload = new Image();
    preload.src = next.currentSrc || next.src;
    // Wait for the new image to be ready, but never more than 300ms
    var ready = preload.decode ? preload.decode().catch(function () {}) : Promise.resolve();
    var timeout = new Promise(function (resolve) { setTimeout(resolve, 300); });
    Promise.race([ready, timeout]).then(function () {
      if (token !== stepToken) return;
      show(target);
      if (reduceMotion.matches || !big.animate) return;
      var shift = delta > 0 ? 12 : -12;
      big.animate(
        [{ transform: "translateX(" + shift + "px)" }, { transform: "none" }],
        { duration: 220, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" }
      );
    });
  }

  function open(img) {
    opener = img;
    // Cancel any switch still pending from the last time it was open
    stepToken++;
    var carousel = img.closest(".carousel");
    group = carousel ? Array.prototype.slice.call(carousel.querySelectorAll(".carousel__slide > img")) : [img];
    prevBtn.hidden = nextBtn.hidden = group.length < 2;
    box.classList.toggle("lightbox--gallery", group.length > 1);
    show(group.indexOf(img));
    box.hidden = false;
    // Next frame so the fade-in transition runs
    requestAnimationFrame(function () { box.classList.add("is-open"); });
    document.documentElement.classList.add("lightbox-open");
    closeBtn.focus();
  }

  function close() {
    stepToken++;
    box.classList.remove("is-open");
    document.documentElement.classList.remove("lightbox-open");
    setTimeout(function () { box.hidden = true; big.removeAttribute("src"); }, 200);
    // Leave the carousel on the image last viewed, and return focus to it
    var current = group[index] || opener;
    var track = current && current.closest(".carousel__track");
    if (track) track.scrollTo({ left: index * track.clientWidth });
    if (current) current.focus({ preventScroll: true });
  }

  images.forEach(function (img) {
    img.classList.add("is-zoomable");
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", "View larger: " + (img.alt || "image"));
    img.addEventListener("click", function () { open(img); });
    img.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(img);
      }
    });
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", function () { step(-1); });
  nextBtn.addEventListener("click", function () { step(1); });

  var touchX = null;
  box.addEventListener("touchstart", function (e) {
    touchX = e.touches.length === 1 ? e.touches[0].clientX : null;
  }, { passive: true });
  box.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  });
  box.addEventListener("click", function (e) {
    if (e.target === box) close();
  });
  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
    // Keep focus cycling through the lightbox's own buttons
    if (e.key === "Tab") {
      e.preventDefault();
      var buttons = [closeBtn, prevBtn, nextBtn].filter(function (b) { return !b.hidden; });
      var i = buttons.indexOf(document.activeElement);
      buttons[(i + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
    }
  });
})();
