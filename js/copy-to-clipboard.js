(function() {
  "use strict";

  const ICONS = {
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4"/>',
    success: '<path d="m5 12 4 4L19 6"/>',
    error: '<path d="m6 6 12 12M6 18 18 6"/>'
  };

  function fallbackCopy(text) {
    const activeElement = document.activeElement;
    const selection = window.getSelection();
    const ranges = [];
    if (selection) {
      for (let i = 0; i < selection.rangeCount; i++) {
        ranges.push(selection.getRangeAt(i).cloneRange());
      }
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
    document.body.appendChild(textarea);
    try {
      textarea.select();
      if (!document.execCommand("copy")) throw new Error("Copy failed");
    } finally {
      textarea.remove();
      if (activeElement) activeElement.focus({ preventScroll: true });
      if (selection) {
        selection.removeAllRanges();
        ranges.forEach(function(range) { selection.addRange(range); });
      }
    }
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        // Clipboard permission can be denied; retain support for HTTP previews too.
      }
    }
    fallbackCopy(text);
  }

  function addCopyButton(container) {
    if (container.closest(".article-minimap") || container.querySelector(".highlight-copy-btn")) return;
    // Table-style line numbers have their own code element; use the source column.
    const codeElements = container.querySelectorAll("pre code");
    const code = codeElements[codeElements.length - 1];
    if (!code) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "highlight-copy-btn";
    const status = document.createElement("span");
    status.className = "code-block__status";
    status.setAttribute("role", "status");
    let resetTimer;

    function setState(state, label) {
      button.dataset.state = state;
      button.setAttribute("aria-label", label);
      button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[state] + '</svg>';
    }

    setState("copy", "复制代码");
    button.addEventListener("click", async function() {
      clearTimeout(resetTimer);
      button.disabled = true;
      status.textContent = "";
      try {
        const source = code.cloneNode(true);
        source.querySelectorAll(".ln, .lnt, .lnlinks").forEach(function(number) { number.remove(); });
        await copyText(source.textContent);
        setState("success", "已复制");
        status.textContent = "代码已复制";
      } catch (error) {
        setState("error", "复制失败，请重试或手动选择代码");
        status.textContent = "复制失败，请重试或手动选择代码";
      } finally {
        button.disabled = false;
        resetTimer = setTimeout(function() {
          setState("copy", "复制代码");
          status.textContent = "";
        }, 1600);
      }
    });
    const fileBlock = container.closest(".code-block--file");
    const controls = fileBlock ? fileBlock.querySelector(".code-block__header") : container;
    controls.appendChild(button);
    controls.appendChild(status);
  }

  document.querySelectorAll(".highlight").forEach(addCopyButton);

  document.querySelectorAll(".code-tabs").forEach(function(group, groupIndex) {
    if (group.closest(".article-minimap")) return;
    const panels = Array.from(group.children).filter(function(child) {
      return child.matches(".code-block--file, .highlight");
    });
    if (panels.length < 2) return;

    const toolbar = document.createElement("div");
    toolbar.className = "code-block__header code-tabs__toolbar";
    const tablist = document.createElement("div");
    tablist.className = "code-tabs__list";
    tablist.setAttribute("role", "tablist");
    tablist.setAttribute("aria-label", "代码文件");
    toolbar.appendChild(tablist);
    const tabs = [];
    const controls = [];

    function activate(index, focus) {
      panels.forEach(function(panel, i) {
        const selected = i === index;
        panel.hidden = !selected;
        tabs[i].setAttribute("aria-selected", String(selected));
        tabs[i].tabIndex = selected ? 0 : -1;
        controls[i].hidden = !selected;
      });
      if (focus) tabs[index].focus({ preventScroll: true });
      tabs[index].scrollIntoView({ block: "nearest", inline: "nearest" });
    }

    panels.forEach(function(panel, index) {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "code-tabs__tab";
      tab.setAttribute("role", "tab");
      const prefix = "code-tabs-" + groupIndex + "-" + index;
      tab.id = prefix + "-tab";
      // Preserve author-supplied code anchors.
      if (!panel.id) panel.id = prefix + "-panel";
      tab.setAttribute("aria-controls", panel.id);
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      panel.tabIndex = 0;
      const header = panel.querySelector(".code-block__header");
      const path = header && header.querySelector(".code-block__path");
      if (path) {
        const icon = header.querySelector(".code-block__file-icon");
        if (icon) tab.appendChild(icon.cloneNode(true));
        tab.appendChild(path.cloneNode(true));
      } else {
        const code = panel.querySelector("code");
        tab.textContent = (code && code.dataset.lang) || "代码 " + (index + 1);
      }
      const control = document.createElement("div");
      control.className = "code-tabs__controls";
      panel.querySelectorAll(".highlight-copy-btn, .code-block__status").forEach(function(element) {
        control.appendChild(element);
      });
      if (header) header.hidden = true;
      // Safari does not focus buttons on pointer clicks; keyboard navigation needs it.
      tab.addEventListener("click", function() { activate(index, true); });
      tab.addEventListener("keydown", function(event) {
        let next = index;
        if (event.key === "ArrowRight") next = (index + 1) % panels.length;
        else if (event.key === "ArrowLeft") next = (index + panels.length - 1) % panels.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = panels.length - 1;
        else return;
        event.preventDefault();
        activate(next, true);
      });
      tabs.push(tab);
      controls.push(control);
      tablist.appendChild(tab);
      toolbar.appendChild(control);
    });
    group.prepend(toolbar);
    group.classList.add("code-tabs--ready");
    // Initial setup should never scroll the reader away from the page top.
    panels.forEach(function(panel, index) {
      panel.hidden = index !== 0;
      tabs[index].setAttribute("aria-selected", String(index === 0));
      tabs[index].tabIndex = index === 0 ? 0 : -1;
      controls[index].hidden = index !== 0;
    });
  });
})();
