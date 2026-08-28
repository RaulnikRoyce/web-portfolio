(function () {
  var BASE = "assets/img/kit/";
  var IDLE = 6;
  var DRAG = 0.28;
  var DECAY = 0.92;
  var WHEEL = 0.12;
  var KITS = {
    stack: [
      "vue",
      "html",
      "css",
      "javascript",
      "nodejs",
      "express",
      "zod",
      "jwt",
      "flutter",
      "mysql",
      "wordpress",
      "cursor"
    ]
  };

  var cache = {};

  function load(name) {
    if (cache[name]) return cache[name];
    cache[name] = new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        resolve(img);
      };
      img.onerror = reject;
      img.src = BASE + name + ".png";
    });
    return cache[name];
  }

  function fitCanvas(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    if (!w || !h) return { w: 0, h: 0, dpr: 1 };
    var bw = Math.round(w * dpr);
    var bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    return { w: w, h: h, dpr: dpr };
  }

  function paint(ctx, images, angle, w, h, dpr) {
    var n = images.length;
    var step = n > 0 ? 360 / n : 0;
    var cx = w / 2;
    var cy = h / 2;
    var maxSize = 0.38 * h;
    var ampX = 0.37 * w;
    var staggerY = 0.048 * h;
    var items = [];
    var i;
    var a;
    var o;
    var s;
    var size;
    var alpha;
    var x;
    var y;
    var side;
    var blur;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    for (i = 0; i < n; i += 1) {
      a = ((i * step + angle) % 360) * (Math.PI / 180);
      items.push({ img: images[i], i: i, depth: Math.cos(a), angle: a });
    }
    items.sort(function (left, right) {
      return left.depth - right.depth;
    });

    for (i = 0; i < items.length; i += 1) {
      o = items[i];
      s = (o.depth + 1) / 2;
      size = maxSize * (0.42 + 0.58 * s);
      alpha = 0.22 + 0.78 * s;
      x = cx + Math.sin(o.angle) * ampX - size / 2;
      y = cy + (o.i - (n - 1) / 2) * staggerY - size / 2;
      side = Math.abs(Math.sin(o.angle));
      blur = side > 0.82 ? Math.pow((side - 0.82) / 0.18, 1.2) * 1.8 : 0;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.filter = blur > 0.7 ? "blur(" + blur.toFixed(1) + "px)" : "none";
      ctx.drawImage(o.img, x, y, size, size);
      ctx.restore();
    }
  }

  function startKit(root) {
    var id = root.getAttribute("data-kit");
    var names = KITS[id];
    var canvas = root.querySelector("canvas");
    if (!names || !canvas) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ctx = canvas.getContext("2d", { alpha: true });
    var images = [];
    var angle = 0;
    var vel = 0;
    var dragging = false;
    var lastX = 0;
    var lastT = 0;
    var lastFrame = null;
    var metrics = { w: 0, h: 0, dpr: 1 };
    var visible = true;
    var raf = 0;

    function draw() {
      metrics = fitCanvas(canvas);
      if (!metrics.w || !images.length) return;
      paint(ctx, images, angle, metrics.w, metrics.h, metrics.dpr);
    }

    function loop(now) {
      raf = 0;
      if (!visible || !images.length) return;
      metrics = fitCanvas(canvas);
      if (metrics.w) {
        if (lastFrame == null) lastFrame = now;
        var dt = Math.min((now - lastFrame) / 1000, 0.1);
        lastFrame = now;
        if (!dragging) {
          if (Math.abs(vel) > 3) {
            angle += vel * dt;
            vel *= Math.pow(DECAY, 60 * dt);
          } else {
            vel = 0;
            if (!reduceMotion) angle -= IDLE * dt;
          }
        }
        paint(ctx, images, angle, metrics.w, metrics.h, metrics.dpr);
      }
      raf = requestAnimationFrame(loop);
    }

    function startLoop() {
      if (raf || !images.length) return;
      lastFrame = null;
      raf = requestAnimationFrame(loop);
    }

    Promise.all(names.map(load)).then(function (imgs) {
      images = imgs;
      draw();
      if (visible) startLoop();
    });

    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(function () {
        draw();
      }).observe(canvas);
    }

    if (typeof IntersectionObserver !== "undefined") {
      new IntersectionObserver(
        function (entries) {
          visible = entries[0] && entries[0].isIntersecting;
          if (visible) startLoop();
        },
        { threshold: 0 }
      ).observe(root);
    }

    canvas.addEventListener("pointerdown", function (event) {
      if (!images.length) return;
      dragging = true;
      vel = 0;
      lastX = event.clientX;
      lastT = performance.now();
      canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      var now = performance.now();
      var dx = event.clientX - lastX;
      var elapsed = Math.max(now - lastT, 1);
      angle += DRAG * dx;
      vel = ((DRAG * dx) / elapsed) * 1000;
      lastX = event.clientX;
      lastT = now;
    });

    function release(event) {
      dragging = false;
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch (err) {
        /* capture already gone */
      }
    }

    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", release);

    canvas.addEventListener(
      "wheel",
      function (event) {
        if (!images.length) return;
        angle += WHEEL * (event.deltaX || event.deltaY);
      },
      { passive: true }
    );
  }

  document.querySelectorAll("[data-kit]").forEach(startKit);
})();
