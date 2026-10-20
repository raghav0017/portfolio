
(function () {
  var $ = function (id) { return document.getElementById(id); };

  var stage = $("ldStage"), scaler = $("ldScaler"), frame = $("ldFrame");
  var range = $("ldRange"), readout = $("ldReadout"), urlEl = $("ldUrl");
  var screens = $("ldScreens"), styles = $("ldStyles"), themes = $("ldThemes");
  var swatches = $("ldSwatches"), colorInput = $("ldColor"), customSw = $("ldCustom");
  var tourBtn = $("ldTour"), tourText = $("ldTourText");
  var ldx = frame && frame.querySelector(".ldx");
  var burger = $("ldBurger"), tabs = $("ldTabs");
  var glow = $("ldGlow");
  var bpName = $("ldBpName"), bpRange = $("ldBpRange"), points = $("ldPoints");
  var codeEl = $("ldCode"), copyBtn = $("ldCopy");

  if (!stage || !scaler || !frame || !range || !ldx) return;

  var FRAME_H = 600, MIN_W = 320, MAX_W = 1040;
  var width = MAX_W, accent = "#1fde72", currentBp = "";
  var tween = null, tourTimer = null, touring = false;

  // ---------- per-breakpoint copy + code ----------
  var INFO = {
    phone: {
      name: "Mobile", range: "under 600px",
      points: [
        "Menu collapses into a hamburger sheet",
        "Single column with thumb-sized buttons",
        "Bottom tab bar for one-handed use"
      ],
      code:
        '<span class="ld-c-at">@media</span> (max-width: <span class="ld-c-val">599px</span>) {\n' +
        '  <span class="ld-c-sel">.nav-links</span> { <span class="ld-c-key">display</span>: none; }\n' +
        '  <span class="ld-c-sel">.cards</span>     { <span class="ld-c-key">grid-template-columns</span>: 1fr; }\n' +
        '  <span class="ld-c-sel">.tabbar</span>    { <span class="ld-c-key">display</span>: flex; }\n' +
        '}'
    },
    tablet: {
      name: "Tablet", range: "600 – 899px",
      points: [
        "Compact nav: logo, menu button, one CTA",
        "Hero stacks and the artwork becomes a banner",
        "Services sit in a tidy three-column grid"
      ],
      code:
        '<span class="ld-c-at">@media</span> (min-width: <span class="ld-c-val">600px</span>)\n' +
        '  <span class="ld-c-at">and</span> (max-width: <span class="ld-c-val">899px</span>) {\n' +
        '  <span class="ld-c-sel">.hero</span>  { <span class="ld-c-key">grid-template-columns</span>: 1fr; }\n' +
        '  <span class="ld-c-sel">.cards</span> { <span class="ld-c-key">grid-template-columns</span>: repeat(3, 1fr); }\n' +
        '}'
    },
    desktop: {
      name: "Desktop", range: "900px and up",
      points: [
        "Full navigation with every link visible",
        "Split hero: copy beside live artwork",
        "Stats row plus a roomy three-column grid"
      ],
      code:
        '<span class="ld-c-at">@media</span> (min-width: <span class="ld-c-val">900px</span>) {\n' +
        '  <span class="ld-c-sel">.nav-links</span> { <span class="ld-c-key">display</span>: flex; }\n' +
        '  <span class="ld-c-sel">.hero</span>      { <span class="ld-c-key">grid-template-columns</span>: 1.08fr .92fr; }\n' +
        '  <span class="ld-c-sel">.cards</span>     { <span class="ld-c-key">grid-template-columns</span>: repeat(3, 1fr); }\n' +
        '}'
    }
  };
  var PLAIN_CODE = {};
  Object.keys(INFO).forEach(function (k) {
    var d = document.createElement("div");
    d.innerHTML = INFO[k].code;
    PLAIN_CODE[k] = d.textContent;
  });

  function bpOf(w) { return w < 600 ? "phone" : (w < 900 ? "tablet" : "desktop"); }

  // ---------- colour helpers ----------
  function hexToRgb(hex) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
    var n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function contrastInk(hex) {
    var c = hexToRgb(hex);
    return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) > 150 ? "#14151a" : "#ffffff";
  }
  function applyAccent(hex) {
    accent = hex;
    var c = hexToRgb(hex), ink = contrastInk(hex);
    var els = document.querySelectorAll("#live-demo [data-acc]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i], mode = el.getAttribute("data-acc");
      if (mode === "bg") {
        el.style.background = hex;
        if (el.tagName === "BUTTON") el.style.color = ink;
      } else if (mode === "soft") {
        el.style.background = "rgba(" + c.r + "," + c.g + "," + c.b + ",0.2)";
      }
    }
    if (glow) {
      glow.style.background =
        "radial-gradient(60% 55% at 50% 52%, rgba(" + c.r + "," + c.g + "," + c.b + ",0.22), transparent 70%)";
    }
  }

  // ---------- fit the device into the fixed stage ----------
  function fit() {
    var small = window.innerWidth <= 700;
    var sw = stage.clientWidth - (small ? 28 : 48), sh = stage.clientHeight - (small ? 36 : 100);
    var s = Math.min(1, sw / width, sh / FRAME_H);
    scaler.style.width = width + "px";
    scaler.style.height = FRAME_H + "px";
    scaler.style.transform = "translate(-50%, -50%) scale(" + s + ")";
  }

  function setActive(group, test) {
    var items = group.querySelectorAll(".ld-btn, .ld-swatch");
    for (var i = 0; i < items.length; i++) {
      var on = test(items[i]);
      items[i].classList.toggle("is-active", on);
      if (items[i].tagName === "BUTTON") items[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function renderInfo(bp) {
    var d = INFO[bp];
    bpName.textContent = d.name;
    bpRange.textContent = d.range;
    points.innerHTML = "";
    d.points.forEach(function (t) {
      var li = document.createElement("li");
      li.textContent = t;
      points.appendChild(li);
    });
    codeEl.innerHTML = d.code;
  }

  // ---------- the one function that changes width ----------
  function setWidth(w) {
    w = Math.max(MIN_W, Math.min(MAX_W, Math.round(w)));
    width = w;
    range.value = w;
    readout.textContent = w + "px";
    urlEl.textContent = "raghav.portfolio — " + w + "px";

    var bp = bpOf(w);
    if (bp !== currentBp) {
      currentBp = bp;
      frame.setAttribute("data-bp", bp);
      ldx.classList.remove("menu-open");
      setActive(screens, function (b) { return b.getAttribute("data-screen") === bp; });
      renderInfo(bp);
    }
    fit();
  }

  function animateTo(target, ms) {
    cancelAnimationFrame(tween);
    var from = width, start = null;
    ms = ms || 520;
    (function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / ms);
      var e = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setWidth(from + (target - from) * e);
      if (p < 1) tween = requestAnimationFrame(step);
    })(performance.now());
  }

  // ---------- tour (auto-plays by default) ----------
  // Each step changes screen width, layout style, theme and accent together,
  // so the tour shows everything the controls can do.
  var TOUR = [
    { w: 1040, style: "clean",   theme: "light", color: "#1fde72" },
    { w: 768,  style: "bold",    theme: "light", color: "#6c4cff" },
    { w: 375,  style: "bold",    theme: "dark",  color: "#ff5a7a" },
    { w: 768,  style: "minimal", theme: "dark",  color: "#f2e940" },
    { w: 1040, style: "minimal", theme: "light", color: "#1fde72" }
  ];
  var tourStep = -1, userStopped = false;

  function pickSwatch(hex) {
    var found = null, all = swatches.querySelectorAll("button.ld-swatch");
    for (var i = 0; i < all.length; i++) {
      if (all[i].getAttribute("data-color") === hex) found = all[i];
    }
    setActive(swatches, function (x) { return x === found; });
  }
  function tourTo(step) {
    animateTo(step.w, 800);
    frame.setAttribute("data-style", step.style);
    setActive(styles, function (b) { return b.getAttribute("data-style") === step.style; });
    frame.setAttribute("data-theme", step.theme);
    setActive(themes, function (b) { return b.getAttribute("data-theme") === step.theme; });
    applyAccent(step.color);
    pickSwatch(step.color);
  }
  function stopTour(byUser) {
    if (byUser) userStopped = true;
    if (!touring) return;
    touring = false;
    clearInterval(tourTimer);
    tourBtn.classList.remove("is-playing");
    tourText.textContent = "Play tour";
  }
  function startTour() {
    if (touring) return;
    touring = true;
    userStopped = false;
    tourBtn.classList.add("is-playing");
    tourText.textContent = "Stop";
    function next() {
      tourStep = (tourStep + 1) % TOUR.length;
      tourTo(TOUR[tourStep]);
    }
    next();
    tourTimer = setInterval(next, 3200);
  }
  tourBtn.addEventListener("click", function () { touring ? stopTour(true) : startTour(); });

  // ---------- events ----------
  screens.addEventListener("click", function (e) {
    var b = e.target.closest(".ld-btn");
    if (!b) return;
    stopTour(true);
    animateTo(parseInt(b.getAttribute("data-w"), 10));
  });

  range.addEventListener("input", function () {
    stopTour(true);
    cancelAnimationFrame(tween);
    setWidth(parseInt(range.value, 10));
  });

  styles.addEventListener("click", function (e) {
    var b = e.target.closest(".ld-btn");
    if (!b) return;
    stopTour(true);
    frame.setAttribute("data-style", b.getAttribute("data-style"));
    setActive(styles, function (x) { return x === b; });
  });

  themes.addEventListener("click", function (e) {
    var b = e.target.closest(".ld-btn");
    if (!b) return;
    stopTour(true);
    frame.setAttribute("data-theme", b.getAttribute("data-theme"));
    setActive(themes, function (x) { return x === b; });
  });

  swatches.addEventListener("click", function (e) {
    var b = e.target.closest("button.ld-swatch");
    if (!b) return;
    stopTour(true);
    applyAccent(b.getAttribute("data-color"));
    setActive(swatches, function (x) { return x === b; });
  });
  colorInput.addEventListener("input", function () {
    stopTour(true);
    applyAccent(colorInput.value);
    customSw.style.background = colorInput.value;
    setActive(swatches, function (x) { return x === customSw; });
  });

  // sample-site interactions (all inside the fixed frame — no layout shift)
  burger.addEventListener("click", function () { ldx.classList.toggle("menu-open"); });
  tabs.addEventListener("click", function (e) {
    var t = e.target.closest(".ldx-tab");
    if (!t) return;
    var all = tabs.querySelectorAll(".ldx-tab");
    for (var i = 0; i < all.length; i++) {
      all[i].classList.remove("is-active");
      all[i].removeAttribute("data-acc");
      all[i].style.background = "";
    }
    t.classList.add("is-active");
    t.setAttribute("data-acc", "soft");
    applyAccent(accent);
  });

  copyBtn.addEventListener("click", function () {
    var text = PLAIN_CODE[currentBp] || "";
    function done() {
      copyBtn.textContent = "Copied";
      setTimeout(function () { copyBtn.textContent = "Copy"; }, 1400);
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else { done(); }
    } catch (err) { done(); }
  });

  // auto-play when the section scrolls into view, pause when it leaves
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        if (!userStopped) startTour();
      } else {
        stopTour(false);
      }
    }, { threshold: 0.35 }).observe(stage);
  } else {
    startTour();
  }

  window.addEventListener("resize", fit);
  if ("ResizeObserver" in window) new ResizeObserver(fit).observe(stage);

  // ---------- init ----------
  applyAccent(accent);
  // on a phone-sized screen start with the phone preview so it's readable straight away
  setWidth(window.innerWidth <= 700 ? 375 : MAX_W);
})();
