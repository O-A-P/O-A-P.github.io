(function() {
  "use strict";

  const minimap = document.querySelector(".article-minimap");
  const article = document.querySelector(".article-body");
  const articlePage = document.querySelector(".single-container > .archive");
  if (!minimap || !article || !articlePage) return;

  const track = minimap.querySelector(".article-minimap__track");
  const preview = minimap.querySelector(".article-minimap__preview");
  const embedLayer = minimap.querySelector(".article-minimap__embeds");
  const embedPreviews = new Map();
  const viewport = minimap.querySelector(".article-minimap__viewport");
  const desktop = window.matchMedia("(min-width: 1000px) and (min-height: 451px) and (hover: hover) and (pointer: fine)");
  let scale = 1;
  let pan = 0;
  let scrollRange = 0;
  let travel = 0;
  let frame = null;
  let drag = null;
  let dirty = true;
  let layoutDirty = true;
  let geometry = null;
  let updateTimer = null;
  let sourceClones = new WeakMap();
  const diagramSizes = new WeakMap();
  const pendingRoots = new Set();
  const pendingAttributes = new Map();
  const UPDATE_DELAY = 100;
  const IMAGE_STYLES = ["width", "height", "box-sizing", "display", "vertical-align", "object-fit", "object-position", "margin-top", "margin-right", "margin-bottom", "margin-left"];
  const IMAGE_ROW_STYLES = ["column-count", "column-gap", "column-width", "column-fill", "margin-top", "margin-bottom"];

  function captureStyles(original, properties) {
    const style = window.getComputedStyle(original);
    return properties.map(function(property) { return [property, style.getPropertyValue(property)]; });
  }

  function applyStyles(copy, styles) {
    styles.forEach(function(entry) { copy.style.setProperty(entry[0], entry[1]); });
  }

  function getEmbedPreviewUrl(element) {
    if (!element.matches("iframe")) return null;
    try {
      const url = new URL(element.getAttribute("src"), window.location.href);
      if (url.protocol !== "https:") return null;
      if (url.hostname === "open.spotify.com" && url.pathname.startsWith("/embed/")) return url.href;
      if (url.hostname === "player.bilibili.com" ||
          /^(www\.)?youtube(-nocookie)?\.com$/.test(url.hostname) && url.pathname.startsWith("/embed/")) {
        url.searchParams.set("autoplay", "0");
        return url.href;
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function measureEmbeds(articleRect) {
    return Array.from(articlePage.querySelectorAll("iframe")).map(function(original) {
      const url = getEmbedPreviewUrl(original);
      if (!url) return null;
      const rect = original.getBoundingClientRect();
      return { original: original, url: url, left: rect.left - articleRect.left, top: rect.top - articleRect.top, width: rect.width, height: rect.height, borderRadius: window.getComputedStyle(original).borderRadius };
    }).filter(Boolean);
  }

  function syncEmbedPreviews(measurements) {
    const active = new Set();
    measurements.forEach(function(measurement) {
      const original = measurement.original;
      const url = measurement.url;
      active.add(original);
      let embed = embedPreviews.get(original);
      if (!embed) {
        embed = document.createElement("iframe");
        embed.title = "嵌入内容缩略预览";
        embed.tabIndex = -1;
        embed.loading = "lazy";
        embed.setAttribute("allow", "autoplay 'none'; fullscreen 'none'");
        if (original.hasAttribute("sandbox")) embed.setAttribute("sandbox", original.getAttribute("sandbox"));
        if (original.hasAttribute("referrerpolicy")) embed.setAttribute("referrerpolicy", original.getAttribute("referrerpolicy"));
        embedPreviews.set(original, embed);
        embedLayer.appendChild(embed);
      }
      // Keep these frames mounted when text/image changes rebuild the masked DOM.
      // Otherwise every image load or shortcode update would reload each player.
      if (embed.getAttribute("src") !== url) embed.src = url;
      embed.style.left = measurement.left + "px";
      embed.style.top = measurement.top + "px";
      embed.style.width = measurement.width + "px";
      embed.style.height = measurement.height + "px";
      embed.style.borderRadius = measurement.borderRadius;
    });
    embedPreviews.forEach(function(embed, original) {
      if (!active.has(original)) {
        embed.remove();
        embedPreviews.delete(original);
      }
    });
  }

  function preserveMediaBox(original, copy) {
    const style = window.getComputedStyle(original);
    ["display", "position", "top", "right", "bottom", "left", "width", "height", "min-width", "max-width", "min-height", "max-height", "box-sizing", "aspect-ratio", "padding-top", "padding-right", "padding-bottom", "padding-left", "margin-top", "margin-right", "margin-bottom", "margin-left", "border-top-width", "border-right-width", "border-bottom-width", "border-left-width", "border-style", "border-color", "border-radius", "overflow", "vertical-align", "float", "flex", "align-self", "order"].forEach(function(property) {
      copy.style.setProperty(property, style.getPropertyValue(property));
    });
  }

  function createDiagramPreview(original) {
    const container = document.createElement("div");
    container.className = "article-minimap__diagram";
    preserveMediaBox(original, container);
    container.style.textAlign = window.getComputedStyle(original).textAlign;
    const svg = original.querySelector("svg");
    if (!svg) return container;

    // An isolated SVG image retains Mermaid's ID-scoped styles and marker IDs
    // without colliding with the original SVG or the article's global styles.
    const snapshot = svg.cloneNode(true);
    const sources = [svg].concat(Array.from(svg.querySelectorAll("*")));
    const targets = [snapshot].concat(Array.from(snapshot.querySelectorAll("*")));
    targets.forEach(function(target, index) {
      if (target.matches("script")) {
        target.remove();
        return;
      }
      Array.from(target.attributes).forEach(function(attribute) {
        if (/^on/i.test(attribute.name)) target.removeAttribute(attribute.name);
      });
      if (target.matches("style")) return;
      // Resolve inherited fonts/colors, including HTML labels in foreignObject,
      // because the image has no access to the article's CSS or custom properties.
      const style = window.getComputedStyle(sources[index]);
      ["color", "fill", "fill-opacity", "stroke", "stroke-width", "stroke-opacity", "font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "text-align", "white-space", "background-color"].forEach(function(property) {
        target.style.setProperty(property, style.getPropertyValue(property));
      });
    });
    const rect = svg.getBoundingClientRect();
    diagramSizes.set(original, [rect.width, rect.height]);
    if (!rect.width || !rect.height) return container;
    snapshot.setAttribute("width", rect.width);
    snapshot.setAttribute("height", rect.height);
    const image = document.createElement("img");
    image.alt = "";
    image.style.width = rect.width + "px";
    image.style.height = rect.height + "px";
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(snapshot));
    container.appendChild(image);
    return container;
  }

  let svgSequence = 0;

  function clonePreview(originalRoot) {
    const clone = originalRoot.cloneNode(true);
    sourceClones.set(originalRoot, clone);
    const originals = [originalRoot].concat(Array.from(originalRoot.querySelectorAll("*")));
    const copies = [clone].concat(Array.from(clone.querySelectorAll("*")));
    const svgIds = new Map();
    copies.forEach(function(copy, index) {
      if (copy.id && copy.closest("svg")) svgIds.set(copy.id, "minimap-svg-" + (++svgSequence));
    });
    copies.forEach(function(copy, index) {
      if (sourceClones.get(originalRoot) !== clone) return;
      if (copy !== clone && !clone.contains(copy)) return;
      if (copy.matches(".toc-container, script, style")) {
        copy.remove();
        return;
      }
      const original = originals[index];
      sourceClones.set(original, copy);
      if (copy.matches(".mermaid")) {
        // Replace the renderer hook as well, so startOnLoad never renders the copy.
        const diagram = createDiagramPreview(original);
        sourceClones.set(original, diagram);
        copy.replaceWith(diagram);
        return;
      }
      if (copy.querySelector(":scope > iframe, :scope > object, :scope > embed")) {
        // Some shortcodes style their aspect-ratio wrapper by ID. Those rules
        // disappear when preview IDs are removed, so preserve the computed box.
        preserveMediaBox(original, copy);
      }
      if (copy.matches("live-photo")) {
        // LivePhotosKit creates overlapping video/canvas/control layers. Only
        // retain the still photo, at the size occupied by the original player.
        const rect = original.getBoundingClientRect();
        const still = document.createElement("div");
        still.className = "article-minimap__live-photo";
        still.style.width = rect.width + "px";
        still.style.height = rect.height + "px";
        const photoSrc = original.getAttribute("photo-src");
        if (photoSrc) {
          const photo = document.createElement("img");
          photo.src = photoSrc;
          photo.alt = "";
          photo.loading = "eager";
          still.appendChild(photo);
        }
        copy.replaceWith(still);
        sourceClones.set(original, still);
        return;
      }
      if (copy.matches("p") && copy.querySelector(":scope > img")) {
        // Mask spans change :nth-child() positions used by the image layout CSS.
        // Freeze the original layout, including single-image/emoji paragraphs.
        applyStyles(copy, captureStyles(original, IMAGE_ROW_STYLES));
      }
      // Preserve layout space for interactive media, without starting a second player.
      if (copy.matches("iframe, video, audio, object, embed, canvas, form")) {
        const placeholder = document.createElement("span");
        placeholder.className = "article-minimap__media";
        // Keep absolute positioning inside ratio wrappers. An inline placeholder
        // would add a second height on top of their padding-based aspect ratio.
        preserveMediaBox(original, placeholder);
        // Unlike an iframe, a plain inline span does not honor width/height.
        if (placeholder.style.display === "inline") placeholder.style.display = "inline-block";
        if (placeholder.style.position === "static") placeholder.style.position = "relative";
        const source = original.getAttribute("src") || original.getAttribute("data") || "";
        if (getEmbedPreviewUrl(original)) {
          // The real frame is kept in a stable overlay; this only reserves layout.
          placeholder.style.background = "transparent";
        } else if (/\.pdf(?:[?#]|$)/i.test(source)) {
          placeholder.dataset.minimapType = "pdf";
        } else if (/slides|powerpoint|\.pptx?(?:[?#]|$)/i.test(source)) {
          placeholder.dataset.minimapType = "ppt";
        } else {
          placeholder.dataset.minimapType = "embed";
        }
        copy.replaceWith(placeholder);
        sourceClones.set(original, placeholder);
        return;
      }
      if (copy.matches("img")) {
        // Use the displayed image and its measured size to avoid different lazy
        // loading or responsive image choices shifting the miniature's layout.
        if (original.currentSrc) {
          copy.src = original.currentSrc;
          copy.removeAttribute("srcset");
          copy.removeAttribute("sizes");
        }
        copy.loading = "lazy";
        // Bounding rectangles can span column fragments or include transforms;
        // computed box dimensions preserve image sizing and inline alignment.
        applyStyles(copy, captureStyles(original, IMAGE_STYLES));
      }
      Array.from(copy.attributes).forEach(function(attribute) {
        if (attribute.name === "id" && copy.closest("svg")) {
          copy.id = svgIds.get(attribute.value);
        } else if (/^(id|name|autofocus|on.*)$/i.test(attribute.name)) {
          copy.removeAttribute(attribute.name);
        } else if (copy.closest("svg")) {
          // Preserve SVG diagrams and icons without reusing the live page's IDs.
          const value = attribute.value.replace(/url\(["']?#([^\s)"']+)["']?\)/g, function(match, id) {
            return svgIds.has(id) ? "url(#" + svgIds.get(id) + ")" : match;
          });
          copy.setAttribute(attribute.name, value.charAt(0) === "#" && svgIds.has(value.slice(1)) ? "#" + svgIds.get(value.slice(1)) : value);
        }
      });
    });

    // Match the reference's word masks, retaining whitespace, wrapping and the
    // syntax-highlighter spans. No line aggregation or estimated line lengths.
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(node) {
      if (!node.textContent.trim()) return;
      // Preserve the article header and section headings as readable miniatures.
      if (!(originalRoot === articlePage ? node.parentElement.closest(".article-body") : originalRoot.closest(".article-body")) || originalRoot.closest("h1, h2, h3, h4, h5, h6, svg") || node.parentElement.closest("h1, h2, h3, h4, h5, h6, svg")) return;
      const fragment = document.createDocumentFragment();
      // Keep punctuation visible as a natural boundary, especially in Chinese
      // paragraphs that have few spaces. Do not insert gaps that change wrapping.
      node.textContent.split(/([\s\p{P}]+)/u).forEach(function(word) {
        if (!word) return;
        if (/^[\s\p{P}]+$/u.test(word)) {
          fragment.appendChild(document.createTextNode(word));
        } else {
          const mask = document.createElement("span");
          mask.className = "article-minimap__mask";
          mask.textContent = word;
          fragment.appendChild(mask);
        }
      });
      node.replaceWith(fragment);
    });
    return sourceClones.get(originalRoot) || clone;
  }

  function buildPreview() {
    return clonePreview(articlePage);
  }

  function readGeometry() {
    const rect = articlePage.getBoundingClientRect();
    return { top: rect.top + window.scrollY, width: rect.width, end: article.getBoundingClientRect().bottom + window.scrollY, trackWidth: track.clientWidth, trackHeight: track.clientHeight, viewportHeight: window.innerHeight, embeds: measureEmbeds(rect) };
  }

  function flushUpdates() {
    updateTimer = null;
    if (!desktop.matches) return;
    // Read the source layout before attaching any new preview nodes. All DOM
    // writes below use these snapshots, avoiding read/write-induced reflows.
    geometry = readGeometry();
    if (!dirty) articlePage.querySelectorAll(".mermaid").forEach(function(diagram) {
      const svg = diagram.querySelector("svg");
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const previous = diagramSizes.get(diagram);
      if (!previous || previous[0] !== rect.width || previous[1] !== rect.height) pendingRoots.add(diagram);
    });
    const replacements = [];
    if (dirty) {
      sourceClones = new WeakMap();
      replacements.push({ old: null, copy: buildPreview() });
    } else {
      pendingRoots.forEach(function(root) {
        if (!articlePage.contains(root) && root !== articlePage) return;
        if (Array.from(pendingRoots).some(function(other) { return other !== root && other.contains(root); })) return;
        const old = sourceClones.get(root);
        if (old) replacements.push({ old: old, copy: clonePreview(root) });
      });
    }
    const mediaUpdates = [];
    articlePage.querySelectorAll("img, p, live-photo, iframe, video, audio, object, embed, canvas, form").forEach(function(original) {
      const copy = sourceClones.get(original);
      if (!copy) return;
      if (original.matches("img")) {
        mediaUpdates.push({ copy: copy, styles: captureStyles(original, IMAGE_STYLES), src: original.currentSrc || original.getAttribute("src") });
      } else if (original.matches("p") && original.querySelector(":scope > img")) {
        mediaUpdates.push({ copy: copy, styles: captureStyles(original, IMAGE_ROW_STYLES) });
      } else if (original.matches("live-photo")) {
        const rect = original.getBoundingClientRect();
        mediaUpdates.push({ copy: copy, styles: [["width", rect.width + "px"], ["height", rect.height + "px"]] });
      } else if (!original.matches("p")) {
        const box = document.createElement("span");
        preserveMediaBox(original, box);
        if (box.style.display === "inline") box.style.display = "inline-block";
        if (box.style.position === "static") box.style.position = "relative";
        mediaUpdates.push({ copy: copy, styles: Array.from(box.style).map(function(name) { return [name, box.style.getPropertyValue(name)]; }) });
        const parent = original.parentElement;
        const parentCopy = sourceClones.get(parent);
        if (parentCopy && original.matches("iframe, object, embed")) {
          const wrapper = document.createElement("div");
          preserveMediaBox(parent, wrapper);
          mediaUpdates.push({ copy: parentCopy, styles: Array.from(wrapper.style).map(function(name) { return [name, wrapper.style.getPropertyValue(name)]; }) });
        }
      }
    });
    pendingAttributes.forEach(function(attributes, original) {
      const copy = sourceClones.get(original);
      if (!copy) return;
      attributes.forEach(function(name) {
        if (original.hasAttribute(name)) copy.setAttribute(name, original.getAttribute(name));
        else copy.removeAttribute(name);
      });
    });
    replacements.forEach(function(replacement) {
      if (replacement.old) replacement.old.replaceWith(replacement.copy);
      else preview.replaceChildren(replacement.copy);
    });
    mediaUpdates.forEach(function(update) {
      applyStyles(update.copy, update.styles);
      if (update.src && update.copy.getAttribute("src") !== update.src) {
        update.copy.src = update.src;
        update.copy.removeAttribute("srcset");
        update.copy.removeAttribute("sizes");
      }
    });
    syncEmbedPreviews(geometry.embeds);
    pendingRoots.clear();
    pendingAttributes.clear();
    dirty = false;
    layoutDirty = false;
    schedule();
  }

  function render() {
    frame = null;
    minimap.hidden = !desktop.matches;
    if (!desktop.matches) {
      embedLayer.replaceChildren();
      embedPreviews.clear();
      return;
    }
    if (!geometry) { invalidate(); return; }
    if (layoutDirty) {
      geometry = readGeometry();
      layoutDirty = false;
    }
    if (!geometry.width || !geometry.trackHeight) return;
    // Navigation ends at the article body, not at comments, adjacent posts or footer.
    const articleEnd = geometry.end;
    const height = Math.max(geometry.viewportHeight, articleEnd);
    scrollRange = Math.max(0, height - geometry.viewportHeight);
    const scroll = Math.min(scrollRange, Math.max(0, window.scrollY));
    const progress = scrollRange ? scroll / scrollRange : 0;
    // Uniform scaling preserves line density. The oversized overview pans with
    // the document, as on the reference site, instead of crushing it into one screen.
    scale = geometry.trackWidth / geometry.width;
    const frameHeight = Math.min(geometry.trackHeight, geometry.viewportHeight * scale);
    pan = Math.max(0, height * scale - geometry.trackHeight) * progress;
    travel = Math.max(0, Math.min(geometry.trackHeight, height * scale) - frameHeight);
    preview.style.width = geometry.width + "px";
    preview.style.height = Math.max(0, articleEnd - geometry.top) + "px";
    preview.style.transform = "translateY(" + (geometry.top * scale - pan) + "px) scale(" + scale + ")";
    embedLayer.style.width = preview.style.width;
    embedLayer.style.height = preview.style.height;
    embedLayer.style.transform = preview.style.transform;
    viewport.style.height = frameHeight + "px";
    viewport.style.transform = "translateY(" + (progress * travel) + "px)";
    track.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
    track.setAttribute("aria-valuetext", "已阅读 " + Math.round(progress * 100) + "%");
  }

  function invalidate() {
    if (!desktop.matches) return;
    layoutDirty = true;
    // A fixed window batches image/font/shortcode bursts without starving updates.
    if (updateTimer === null) updateTimer = window.setTimeout(flushUpdates, UPDATE_DELAY);
  }

  function schedule() {
    if (desktop.matches && frame === null) frame = window.requestAnimationFrame(render);
  }

  function scrollToPosition(top) {
    window.scrollTo({ top: Math.max(0, Math.min(scrollRange, top)), behavior: "instant" });
    schedule();
  }

  track.addEventListener("pointerdown", function(event) {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    minimap.classList.add("is-pointer-focused");
    track.focus({ preventScroll: true });
    const rect = viewport.getBoundingClientRect();
    if (event.clientY < rect.top || event.clientY > rect.bottom) {
      scrollToPosition((event.clientY - track.getBoundingClientRect().top + pan) / scale - window.innerHeight / 2);
    }
    drag = { id: event.pointerId, y: event.clientY, scroll: window.scrollY };
    track.setPointerCapture(event.pointerId);
    minimap.classList.add("is-dragging");
  });

  track.addEventListener("pointermove", function(event) {
    if (!drag || drag.id !== event.pointerId || !travel) return;
    scrollToPosition(drag.scroll + (event.clientY - drag.y) / travel * scrollRange);
  });

  function stopDragging() {
    drag = null;
    minimap.classList.remove("is-dragging");
  }
  track.addEventListener("pointerup", stopDragging);
  track.addEventListener("pointercancel", stopDragging);
  track.addEventListener("lostpointercapture", stopDragging);
  track.addEventListener("keydown", function(event) {
    minimap.classList.remove("is-pointer-focused");
    const steps = { ArrowDown: 80, ArrowUp: -80, PageDown: window.innerHeight * 0.9, PageUp: -window.innerHeight * 0.9 };
    if (Object.prototype.hasOwnProperty.call(steps, event.key)) {
      event.preventDefault();
      scrollToPosition(window.scrollY + steps[event.key]);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      scrollToPosition(event.key === "Home" ? 0 : scrollRange);
    }
  });
  track.addEventListener("blur", function() {
    minimap.classList.remove("is-pointer-focused");
  });

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", invalidate);
  window.addEventListener("load", invalidate);
  // Images, fonts and expandable content can change the scroll geometry after load.
  const observer = window.ResizeObserver ? new ResizeObserver(invalidate) : null;
  const mutations = new MutationObserver(function(records) {
    let changed = false;
    records.forEach(function(record) {
      const element = record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement;
      if (!element || element.closest(".toc-container")) return;
      // Playback redraws don't change the static miniature.
      const player = element.closest("live-photo");
      if (player && record.attributeName !== "photo-src") return;
      const special = player || element.closest(".mermaid, svg, iframe, video, audio, object, embed, canvas, form");
      if (special || record.type !== "attributes") {
        let root = special || element;
        while (root && !sourceClones.has(root) && root !== articlePage) root = root.parentElement;
        if (root) pendingRoots.add(root);
      } else if (record.attributeName !== "src" && record.attributeName !== "srcset") {
        if (!pendingAttributes.has(element)) pendingAttributes.set(element, new Set());
        pendingAttributes.get(element).add(record.attributeName);
      }
      changed = true;
    });
    if (changed) invalidate();
  });
  function updateDesktop() {
    minimap.hidden = !desktop.matches;
    mutations.disconnect();
    if (observer) observer.disconnect();
    if (!desktop.matches) {
      window.clearTimeout(updateTimer);
      updateTimer = null;
      preview.replaceChildren();
      embedLayer.replaceChildren();
      embedPreviews.clear();
      sourceClones = new WeakMap();
      pendingRoots.clear();
      pendingAttributes.clear();
      geometry = null;
      dirty = true;
      stopDragging();
      return;
    }
    mutations.observe(articlePage, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["open", "class", "hidden", "style", "src", "srcset", "photo-src", "width", "height", "viewBox"] });
    if (observer) observer.observe(articlePage);
    invalidate();
  }
  desktop.addEventListener("change", updateDesktop);
  articlePage.addEventListener("load", function(event) {
    if (!event.target.closest("live-photo")) invalidate();
  }, true);
  if (document.fonts) document.fonts.ready.then(invalidate);
  updateDesktop();
})();
