(function() {
  "use strict";

  const page = document.querySelector(".about-page");
  if (page === null) {
    return;
  }

  const finePointer = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const face = page.querySelector(".about-folder__face");
  if (face !== null) {
    const pupils = Array.from(face.querySelectorAll(".about-folder__pupil"));
    let eyeFrame = null;
    let eyePointer = null;
    function resetEyes() {
      window.cancelAnimationFrame(eyeFrame);
      eyeFrame = null;
      eyePointer = null;
      pupils.forEach(function(pupil) { pupil.removeAttribute("transform"); });
    }
    function updateEyes() {
      eyeFrame = null;
      if (eyePointer === null) {
        return;
      }
      try {
        const matrix = face.getScreenCTM();
        if (matrix === null) {
          return;
        }
        // SVG coordinates include the sticker's rotation and the folder's breathing.
        const point = face.createSVGPoint();
        point.x = eyePointer.x;
        point.y = eyePointer.y;
        const local = point.matrixTransform(matrix.inverse());
        pupils.forEach(function(pupil) {
          const dx = local.x - Number(pupil.getAttribute("cx"));
          const dy = local.y - Number(pupil.getAttribute("cy"));
          const distance = Math.hypot(dx, dy);
          const travel = Math.min(distance / 70, 1) * 4.2;
          const x = distance > 0 ? dx / distance * travel : 0;
          const y = distance > 0 ? dy / distance * travel : 0;
          pupil.setAttribute("transform", "translate(" + x + " " + y + ")");
        });
      } catch (error) {
        resetEyes();
      }
    }
    document.addEventListener("pointermove", function(event) {
      if (event.pointerType === "touch" || !finePointer.matches || reducedMotion.matches) {
        return;
      }
      eyePointer = { x: event.clientX, y: event.clientY };
      if (eyeFrame === null) {
        eyeFrame = window.requestAnimationFrame(updateEyes);
      }
    }, { passive: true });
    document.addEventListener("pointerleave", resetEyes);
    window.addEventListener("blur", resetEyes);
    finePointer.addEventListener("change", resetEyes);
    reducedMotion.addEventListener("change", resetEyes);
  }

  const folder = page.querySelector(".about-folder");
  const cards = page.querySelector(".about-grid");
  if (folder !== null && cards !== null) {
    const fanCards = Array.from(cards.querySelectorAll(".about-card"));
    let closeTimer = null;
    let activeCard = null;
    function cancelClose() {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
    function setFolderOpen(open) {
      cancelClose();
      if (page.classList.contains("is-folder-open") === open && cards.inert === !open) {
        return;
      }
      if (open) {
        // Choose once per opening, so moving between cards never reshuffles the fan.
        fanCards.forEach(function(card) {
          const direction = Math.random() < 0.5 ? -1 : 1;
          const angle = direction * (2 + Math.random() * 4);
          card.style.setProperty("--fan-angle", angle.toFixed(2) + "deg");
        });
      }
      page.classList.toggle("is-folder-open", open);
      cards.inert = !open;
      cards.setAttribute("aria-hidden", String(!open));
      folder.setAttribute("aria-expanded", String(open));
      folder.setAttribute("aria-label", open ? "收起 About 卡片" : "展开 About 卡片");
      if (!open && activeCard !== null) {
        activeCard.classList.remove("is-fan-active");
        activeCard = null;
      }
    }
    function scheduleClose() {
      cancelClose();
      closeTimer = window.setTimeout(function() {
        if (!cards.contains(document.activeElement)) {
          setFolderOpen(false);
        }
      }, 420);
    }
    folder.hidden = false;
    page.classList.add("is-folder-ready");
    setFolderOpen(false);
    folder.addEventListener("pointerenter", function(event) {
      if (event.pointerType !== "touch" && finePointer.matches) {
        setFolderOpen(true);
      }
    });
    folder.addEventListener("click", function(event) {
      const toggle = event.detail === 0 || event.pointerType === "touch" || !finePointer.matches;
      setFolderOpen(toggle ? !page.classList.contains("is-folder-open") : true);
    });
    folder.addEventListener("keydown", function(event) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFolderOpen(true);
        const firstAction = cards.querySelector("a, button");
        if (firstAction !== null) {
          firstAction.focus();
        }
      }
    });
    page.addEventListener("pointerenter", cancelClose);
    page.addEventListener("pointerleave", scheduleClose);
    function isOverStack(event) {
      return fanCards.some(function(card) {
        const bounds = card.getBoundingClientRect();
        return event.clientX >= bounds.left && event.clientX <= bounds.right &&
          event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      });
    }
    page.addEventListener("click", function(event) {
      if (!page.classList.contains("is-folder-open") && event.target !== folder &&
          !folder.contains(event.target) && isOverStack(event)) {
        setFolderOpen(true);
      }
    });
    page.addEventListener("pointermove", function(event) {
      if (event.pointerType === "touch") {
        return;
      }
      if (!page.classList.contains("is-folder-open")) {
        // Inert previews cannot receive events; detect the visible stack from its bounds.
        if (finePointer.matches && isOverStack(event)) {
          setFolderOpen(true);
        }
        return;
      }
      const card = event.target.closest(".about-card");
      if (card !== null && cards.contains(card) && card !== activeCard) {
        if (activeCard !== null) {
          activeCard.classList.remove("is-fan-active");
        }
        activeCard = card;
        activeCard.classList.add("is-fan-active");
      }
    });
    page.addEventListener("focusin", function(event) {
      cancelClose();
      if (cards.contains(event.target)) {
        setFolderOpen(true);
      }
    });
    page.addEventListener("focusout", function() {
      window.setTimeout(function() {
        if (!page.contains(document.activeElement) && !page.matches(":hover")) {
          setFolderOpen(false);
        }
      }, 0);
    });
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape" && page.classList.contains("is-folder-open")) {
        const restoreFocus = page.contains(document.activeElement);
        setFolderOpen(false);
        if (restoreFocus) {
          folder.focus();
        }
      }
    });
  }

  const resumeButton = page.querySelector("[data-resume-unavailable]");
  if (resumeButton !== null) {
    resumeButton.addEventListener("click", function() {
      const label = resumeButton.querySelector("span");
      if (label !== null) {
        label.textContent = "Not available now";
      }
    });
  }

  const photo = page.querySelector("[data-photos]");
  if (photo !== null) {
    try {
      const photos = JSON.parse(photo.dataset.photos);
      if (Array.isArray(photos) && photos.length > 0) {
        // Choose once per visit, and keep the fallback visible if the image fails.
        const selected = photos[Math.floor(Math.random() * photos.length)];
        const preview = new Image();
        preview.onload = function() { photo.src = selected; };
        preview.src = selected;
      }
    } catch (error) {
      // The server-rendered cover remains available without a valid photo list.
    }
  }

  page.querySelectorAll(".about-card").forEach(function(card) {
    const glow = card.querySelector(".about-card__glow");
    if (glow === null) {
      return;
    }

    let frame = null;
    let pointerX = 0;
    let pointerY = 0;

    function resetGlow() {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
      card.classList.remove("is-pointer-active");
      glow.style.left = "";
      glow.style.top = "";
    }

    function moveGlow(event) {
      if (!finePointer.matches || reducedMotion.matches || event.pointerType === "touch") {
        return;
      }
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame !== null) {
        return;
      }
      frame = window.requestAnimationFrame(function() {
        const rect = card.getBoundingClientRect();
        let x = (pointerX - rect.left) * card.offsetWidth / rect.width - card.clientLeft;
        let y = (pointerY - rect.top) * card.offsetHeight / rect.height - card.clientTop;
        // Undo the fan's rotation as well as scale, so the glow remains under the pointer.
        if (typeof window.DOMMatrixReadOnly === "function") {
          const matrix = new window.DOMMatrixReadOnly(window.getComputedStyle(card).transform);
          const width = card.offsetWidth;
          const height = card.offsetHeight;
          const minX = Math.min(0, matrix.a * width, matrix.c * height, matrix.a * width + matrix.c * height);
          const minY = Math.min(0, matrix.b * width, matrix.d * height, matrix.b * width + matrix.d * height);
          const px = pointerX - rect.left + minX;
          const py = pointerY - rect.top + minY;
          const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
          if (Math.abs(determinant) > 0.0001) {
            x = (matrix.d * px - matrix.c * py) / determinant - card.clientLeft;
            y = (matrix.a * py - matrix.b * px) / determinant - card.clientTop;
          }
        }
        glow.style.left = Math.max(0, Math.min(card.clientWidth, x)) + "px";
        glow.style.top = Math.max(0, Math.min(card.clientHeight, y)) + "px";
        card.classList.add("is-pointer-active");
        frame = null;
      });
    }

    card.addEventListener("pointerenter", moveGlow);
    card.addEventListener("pointermove", moveGlow);
    card.addEventListener("pointerleave", resetGlow);
    card.addEventListener("pointercancel", resetGlow);
    reducedMotion.addEventListener("change", resetGlow);
    finePointer.addEventListener("change", resetGlow);
  });

  const days = page.querySelectorAll("[data-activity-tip]");
  if (days.length === 0) {
    return;
  }

  // A body-level tooltip stays outside the card's clipping and transformed coordinates.
  const tooltip = document.createElement("div");
  tooltip.className = "about-activity-tooltip";
  tooltip.id = "about-activity-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  document.body.appendChild(tooltip);
  let activeDay = null;
  let tooltipFrame = null;
  let followUntil = 0;

  function hideTooltip() {
    if (tooltipFrame !== null) {
      window.cancelAnimationFrame(tooltipFrame);
      tooltipFrame = null;
    }
    if (activeDay !== null) {
      activeDay.removeAttribute("aria-describedby");
    }
    activeDay = null;
    tooltip.hidden = true;
  }

  function positionTooltip() {
    if (activeDay === null) {
      return;
    }
    const rect = activeDay.getBoundingClientRect();
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const left = Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, viewportWidth - width - 12));
    const top = rect.top - height - 10;
    tooltip.style.left = left + "px";
    tooltip.style.top = Math.max(12, Math.min(top >= 12 ? top : rect.bottom + 10, viewportHeight - height - 12)) + "px";
    tooltipFrame = null;
    // Follow the brief hover transform, then stop measuring once the card settles.
    if (performance.now() < followUntil) {
      tooltipFrame = window.requestAnimationFrame(positionTooltip);
    }
  }

  function showTooltip(day) {
    hideTooltip();
    activeDay = day;
    tooltip.textContent = day.dataset.activityTip;
    tooltip.hidden = false;
    day.setAttribute("aria-describedby", tooltip.id);
    followUntil = performance.now() + (reducedMotion.matches ? 0 : 600);
    positionTooltip();
  }

  days.forEach(function(day) {
    // Keep native titles as the no-JavaScript fallback, without double tooltips.
    day.removeAttribute("title");
    day.addEventListener("pointerenter", function(event) {
      if (event.pointerType !== "touch") {
        showTooltip(day);
      }
    });
    day.addEventListener("pointerleave", hideTooltip);
    day.addEventListener("focus", function() { showTooltip(day); });
    day.addEventListener("blur", hideTooltip);
  });

  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
      hideTooltip();
    }
  });
  document.addEventListener("scroll", hideTooltip, true);
  document.addEventListener("visibilitychange", hideTooltip);
  window.addEventListener("resize", hideTooltip);
  window.addEventListener("blur", hideTooltip);
  window.addEventListener("pagehide", hideTooltip);
  window.addEventListener("theme-change", hideTooltip);
})();
