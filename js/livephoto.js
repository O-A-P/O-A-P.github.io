(function() {
  "use strict";

  let activePlayer = null;
  const players = [];
  const observer = window.IntersectionObserver ? new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting && activePlayer && activePlayer.element === entry.target) {
        activePlayer.stop();
      }
    });
  }) : null;

  document.querySelectorAll("live-photo.live-photo").forEach(function(element) {
    const video = element.querySelector("video");
    const button = element.querySelector("button");
    const status = element.querySelector(".live-photo__status");
    const photo = element.querySelector("img");
    if (!video || !button || !status || !photo) return;

    let requested = false;
    let attempt = 0;
    let timeout = null;
    let failed = false;
    let touchPointerId = null;
    let heldKey = null;
    const player = { element: element, stop: stop };
    players.push(player);

    function stop() {
      requested = false;
      touchPointerId = null;
      heldKey = null;
      attempt += 1;
      window.clearTimeout(timeout);
      video.pause();
      element.classList.remove("is-playing");
      button.setAttribute("aria-pressed", "false");
      status.textContent = "";
      if (activePlayer === player) activePlayer = null;
    }

    function fail() {
      stop();
      failed = true;
      status.textContent = "暂时无法播放，已保留照片";
    }

    function start() {
      if (requested) return;
      if (activePlayer) activePlayer.stop();
      activePlayer = player;
      requested = true;
      const currentAttempt = ++attempt;
      button.setAttribute("aria-pressed", "true");
      status.textContent = "正在加载…";
      timeout = window.setTimeout(function() {
        if (requested && currentAttempt === attempt) fail();
      }, 15000);
      // Assigning src only after interaction avoids downloading every clip on entry.
      if (!video.getAttribute("src") || failed) {
        failed = false;
        video.src = video.dataset.src;
        video.load();
      }
      try {
        video.currentTime = 0;
        const playback = video.play();
        if (playback && playback.catch) {
          playback.catch(function() {
            if (requested && currentAttempt === attempt) fail();
          });
        }
      } catch (error) {
        fail();
      }
    }

    button.addEventListener("pointerenter", function(event) {
      // Touch also emits pointerenter, but should only play while pressed.
      if (event.pointerType === "mouse") start();
    });
    button.addEventListener("pointerleave", function(event) {
      if (event.pointerType === "mouse") stop();
    });
    button.addEventListener("pointerdown", function(event) {
      if (event.pointerType === "mouse" || !event.isPrimary || event.button !== 0) return;
      touchPointerId = event.pointerId;
      start();
    });
    function releasePointer(event) {
      if (event.pointerId === touchPointerId) stop();
    }
    // Listen outside the button too, so releasing beyond the photo still stops.
    window.addEventListener("pointerup", releasePointer);
    window.addEventListener("pointercancel", releasePointer);
    button.addEventListener("lostpointercapture", releasePointer);
    // Cover every layer without cancelling touchstart, which would block scrolling.
    element.addEventListener("contextmenu", function(event) {
      event.preventDefault();
    }, true);
    element.addEventListener("dragstart", function(event) {
      event.preventDefault();
    }, true);
    button.addEventListener("click", function(event) {
      // Ignore synthesized clicks after a touch or keyboard release.
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener("keydown", function(event) {
      if (event.key === "Escape") stop();
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (event.repeat || heldKey !== null) return;
      heldKey = event.key;
      start();
    });
    button.addEventListener("keyup", function(event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (event.key === heldKey) stop();
    });
    button.addEventListener("blur", stop);
    video.addEventListener("playing", function() {
      if (!requested) {
        video.pause();
        return;
      }
      window.clearTimeout(timeout);
      status.textContent = "";
      element.classList.add("is-playing");
    });
    video.addEventListener("ended", stop);
    video.addEventListener("error", function() {
      if (requested) fail();
    });
    button.hidden = false;
    if (observer) observer.observe(element);
  });

  document.addEventListener("visibilitychange", function() {
    if (document.hidden && activePlayer) activePlayer.stop();
  });
  window.addEventListener("blur", function() {
    if (activePlayer) activePlayer.stop();
  });
  window.addEventListener("pagehide", function() {
    players.forEach(function(player) { player.stop(); });
  });
})();
