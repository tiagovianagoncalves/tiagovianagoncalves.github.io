// Password-protected case study (built by scripts/protect.mjs): decrypts the
// page content in the browser. A correct password is remembered for the rest
// of the browser session, so revisiting the page doesn't ask again.
(function () {
  var main = document.querySelector("main[data-locked]");
  var dataEl = document.getElementById("locked-data");
  if (!main || !dataEl || !window.crypto || !crypto.subtle) return;

  var payload = JSON.parse(dataEl.textContent);
  var form = main.querySelector("[data-unlock]");
  var input = main.querySelector("#locked-password");
  var error = main.querySelector(".locked__error");
  var KEY = "unlock:" + location.pathname;

  function bytes(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function decrypt(password) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"])
      .then(function (base) {
        return crypto.subtle.deriveKey(
          { name: "PBKDF2", salt: bytes(payload.salt), iterations: payload.iterations, hash: "SHA-256" },
          base,
          { name: "AES-GCM", length: 256 },
          false,
          ["decrypt"]
        );
      })
      .then(function (key) {
        return crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(payload.iv) }, key, bytes(payload.data));
      })
      .then(function (plain) {
        return new TextDecoder().decode(plain);
      });
  }

  function reveal(html, password) {
    main.innerHTML = html;
    main.removeAttribute("data-locked");
    try { sessionStorage.setItem(KEY, password); } catch (e) {}
    if (window.ptStagger) window.ptStagger();
    // Carousels, before/after sliders and the image viewer for the case-study figures, now that they exist
    ["/assets/js/carousel.js", "/assets/js/compare.js", "/assets/js/lightbox.js"].forEach(function (src) {
      var s = document.createElement("script");
      s.src = src;
      s.async = false;
      document.body.appendChild(s);
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var password = input.value;
    form.querySelector("button").disabled = true;
    decrypt(password)
      .then(function (html) {
        reveal(html, password);
        window.scrollTo(0, 0);
      })
      .catch(function () {
        error.hidden = false;
        input.select();
      })
      .then(function () {
        var btn = form.querySelector("button");
        if (btn) btn.disabled = false;
      });
  });

  var saved = null;
  try { saved = sessionStorage.getItem(KEY); } catch (e) {}
  if (saved) decrypt(saved).then(function (html) { reveal(html, saved); }, function () {});
})();
