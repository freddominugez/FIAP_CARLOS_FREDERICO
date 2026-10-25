(function () {
  var cfg = window.PORTAL_CONFIG || {};
  var root = document.documentElement;

  // tema: lembra a escolha do visitante, sem depender disso para renderizar
  try {
    var saved = localStorage.getItem("theme");
    if (saved) root.setAttribute("data-theme", saved);
  } catch (e) {}
  var btn = document.querySelector(".theme-btn");
  if (btn) {
    btn.addEventListener("click", function () {
      var dark = root.getAttribute("data-theme") === "dark" ||
        (!root.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
      var next = dark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // vídeo: só incorpora quando existe ID real
  var video = document.getElementById("video");
  if (video && /^[A-Za-z0-9_-]{6,20}$/.test(cfg.youtubeId || "")) {
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + cfg.youtubeId;
    f.title = "Vídeo da entrega, Tech Challenge Fase 1";
    f.loading = "lazy";
    f.allow = "accelerometer; encrypted-media; gyroscope; picture-in-picture";
    f.allowFullscreen = true;
    video.innerHTML = "";
    video.appendChild(f);
  }

  // links da entrega: preenche ou marca como pendente
  document.querySelectorAll("[data-cfg]").forEach(function (el) {
    var key = el.getAttribute("data-cfg");
    var val = cfg[key];
    var box = el.closest("tr, li");
    var status = box && box.querySelector(".tag");
    if (key === "youtubeId" && val) val = "https://www.youtube.com/watch?v=" + val;
    if (val) {
      if (el.tagName === "A") { el.href = val; el.textContent = el.getAttribute("data-label") || val; }
      else el.textContent = val;
      if (status) { status.textContent = "publicado"; status.className = "tag ok"; }
    } else {
      if (el.tagName === "A") el.removeAttribute("href");
      el.textContent = (box && box.tagName === "TR") ? "pendente" : (el.getAttribute("data-label") || "pendente");
      if (status) { status.textContent = "pendente"; status.className = "tag warn"; }
    }
  });
})();
