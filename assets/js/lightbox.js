// Lightbox for case-study and Feed images: click or press Enter on an image to view it larger.
// Closes with the close button, Escape, or a click on the backdrop.
(function () {
  var images = document.querySelectorAll(".case .figure:not(.case__cover) > img, .carousel__slide > img, .feed__item > img");
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
    '<img class="lightbox__img" alt="">';
  document.body.appendChild(box);

  var big = box.querySelector(".lightbox__img");
  var closeBtn = box.querySelector(".lightbox__close");
  var opener = null;

  function open(img) {
    opener = img;
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    box.hidden = false;
    // Next frame so the fade-in transition runs
    requestAnimationFrame(function () { box.classList.add("is-open"); });
    document.documentElement.classList.add("lightbox-open");
    closeBtn.focus();
  }

  function close() {
    box.classList.remove("is-open");
    document.documentElement.classList.remove("lightbox-open");
    setTimeout(function () { box.hidden = true; big.removeAttribute("src"); }, 200);
    if (opener) opener.focus();
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
  box.addEventListener("click", function (e) {
    if (e.target === box) close();
  });
  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    // Only the close button is focusable inside, so keep focus there
    if (e.key === "Tab") {
      e.preventDefault();
      closeBtn.focus();
    }
  });
})();
