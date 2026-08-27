(function () {
  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-menu]");

  function setOpen(open) {
    if (!toggle || !menu) return;
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      setOpen(!menu.classList.contains("is-open"));
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });
  }

  var portrait = document.querySelector("[data-portrait]");
  if (portrait) {
    function showFallback() {
      var figure = portrait.closest(".c-portrait");
      if (figure) figure.classList.add("is-fallback");
    }

    portrait.addEventListener("error", showFallback);

    if (portrait.complete && portrait.naturalWidth === 0) {
      showFallback();
    }
  }

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var coarsePointer = window.matchMedia("(pointer: coarse)");

  function setSpot(xPct, yPct) {
    root.style.setProperty("--spot-x", xPct + "%");
    root.style.setProperty("--spot-y", yPct + "%");
    root.style.setProperty("--grid-shift-x", ((xPct / 100 - 0.5) * 16).toFixed(2) + "px");
    root.style.setProperty("--grid-shift-y", ((yPct / 100 - 0.5) * 16).toFixed(2) + "px");
  }

  function canFollow() {
    return !reduceMotion.matches && !coarsePointer.matches;
  }

  setSpot(50, 28);

  if (canFollow()) {
    var pending = false;
    var nextX = 50;
    var nextY = 28;

    window.addEventListener(
      "pointermove",
      function (event) {
        nextX = (event.clientX / window.innerWidth) * 100;
        nextY = (event.clientY / window.innerHeight) * 100;
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () {
          pending = false;
          setSpot(nextX, nextY);
        });
      },
      { passive: true }
    );
  }
})();
