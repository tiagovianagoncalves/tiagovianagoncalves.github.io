// Image carousel: a scroll-snap track (swipe works natively) with arrow
// buttons and dots. Arrows loop around at the ends.
(function () {
  document.querySelectorAll(".carousel").forEach(function (carousel) {
    var track = carousel.querySelector(".carousel__track");
    var slides = carousel.querySelectorAll(".carousel__slide");
    var dots = carousel.querySelectorAll(".carousel__dots button");
    // Slides with a data-caption swap the figure's caption as they come into view
    var caption = carousel.querySelector("figcaption");
    if (!track || !slides.length) return;

    function current() {
      return Math.round(track.scrollLeft / track.clientWidth);
    }

    function go(i) {
      var n = slides.length;
      i = (i + n) % n;
      track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
    }

    carousel.querySelector(".carousel__btn--prev").addEventListener("click", function () { go(current() - 1); });
    carousel.querySelector(".carousel__btn--next").addEventListener("click", function () { go(current() + 1); });
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { go(i); });
    });

    // Keep the dots in sync however the slide changed (buttons, swipe, keys)
    var ticking = false;
    track.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var i = current();
        dots.forEach(function (dot, j) {
          if (j === i) dot.setAttribute("aria-current", "true");
          else dot.removeAttribute("aria-current");
        });
        var text = slides[i] && slides[i].getAttribute("data-caption");
        if (caption && text) caption.textContent = text;
      });
    }, { passive: true });

    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(current() - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(current() + 1); }
    });
  });
})();
