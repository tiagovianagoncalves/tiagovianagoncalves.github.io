// Password modal for protected case studies (built by scripts/protect.mjs).
// Links to a protected page open this modal instead of navigating. The
// password is checked against the page's encrypted data; when it works it is
// remembered for the browser session (the same key unlock.js reads) and the
// page opens already unlocked. Closing the modal leaves you where you are.
// The protected page sends visitors without a password to /?unlock=<slug>,
// which opens the modal here on load.
(function () {
  if (!window.crypto || !crypto.subtle || !window.HTMLDialogElement) return;

  var LOCKED = ["intaker"];
  var current = null; // path of the case study the modal is open for
  var payloads = {};

  function pathFor(slug) {
    return "/projects/" + slug + "/";
  }

  function saved(path) {
    try { return sessionStorage.getItem("unlock:" + path); } catch (e) { return null; }
  }

  var dialog = document.createElement("dialog");
  dialog.className = "locked-modal";
  dialog.setAttribute("aria-labelledby", "locked-modal-title");
  dialog.innerHTML =
    '<button class="locked-modal__close" type="button" aria-label="Close">' +
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
    "</button>" +
    '<svg class="locked-modal__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" stroke="currentColor" stroke-width="1.5"/><path d="M12 14.5v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
    '<h2 class="locked__title" id="locked-modal-title">This case study is password protected</h2>' +
    '<p class="locked__text">Enter the password you were given to read it.</p>' +
    '<form class="locked__form">' +
      '<label class="locked__label" for="locked-password">Password</label>' +
      '<input class="locked__input" id="locked-password" type="password" autocomplete="current-password" required>' +
      '<p class="locked__error" role="alert" hidden>That password didn\'t work. Try again.</p>' +
      '<button class="locked__submit" type="submit">View case study<span aria-hidden="true">→</span></button>' +
    "</form>";
  document.body.appendChild(dialog);

  var form = dialog.querySelector("form");
  var input = dialog.querySelector("input");
  var submit = dialog.querySelector(".locked__submit");
  var error = dialog.querySelector(".locked__error");

  // The encrypted data lives in the protected page itself
  function payload(path) {
    if (!payloads[path]) {
      payloads[path] = fetch(path)
        .then(function (r) { return r.text(); })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, "text/html");
          return JSON.parse(doc.getElementById("locked-data").textContent);
        });
      payloads[path].catch(function () { delete payloads[path]; });
    }
    return payloads[path];
  }

  function bytes(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function check(data, password) {
    return crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"])
      .then(function (base) {
        return crypto.subtle.deriveKey(
          { name: "PBKDF2", salt: bytes(data.salt), iterations: data.iterations, hash: "SHA-256" },
          base,
          { name: "AES-GCM", length: 256 },
          false,
          ["decrypt"]
        );
      })
      .then(function (key) {
        return crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(data.iv) }, key, bytes(data.data));
      });
  }

  function open(path) {
    current = path;
    payload(path);
    form.reset();
    error.hidden = true;
    submit.disabled = false;
    dialog.showModal();
    input.focus();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var path = current;
    var password = input.value;
    submit.disabled = true;
    payload(path)
      .then(function (data) { return check(data, password); })
      .then(function () {
        try { sessionStorage.setItem("unlock:" + path, password); } catch (err) {}
        location.href = path;
      })
      .catch(function () {
        error.hidden = false;
        submit.disabled = false;
        input.select();
      });
  });

  dialog.querySelector(".locked-modal__close").addEventListener("click", function () {
    dialog.close();
  });

  // A click on the backdrop lands on the dialog itself, outside its box
  dialog.addEventListener("click", function (e) {
    if (e.target !== dialog) return;
    var r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  });

  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest("a[href]");
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var path = new URL(link.href, location.href).pathname;
    var locked = LOCKED.some(function (slug) { return pathFor(slug) === path; });
    if (!locked || saved(path)) return;
    e.preventDefault();
    open(path);
  });

  // Sent here from a protected page opened without a password
  var params = new URLSearchParams(location.search);
  var slug = params.get("unlock");
  if (slug && LOCKED.indexOf(slug) >= 0) {
    params.delete("unlock");
    var query = params.toString();
    history.replaceState(null, "", location.pathname + (query ? "?" + query : "") + location.hash);
    open(pathFor(slug));
  }
})();
