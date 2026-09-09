(function() {
  "use strict";

  var SEARCH_SHORTCUT_KEY = "/";
  var SEARCH_TOGGLE_SELECTOR = "#search-btn";
  var SEARCH_CONTAINER_SELECTOR = "#fastSearch";
  var SEARCH_INPUT_SELECTOR = "#searchInput";
  var SEARCH_RESULTS_SELECTOR = "#searchResults";
  var SEARCH_INDEX_URL = "/index.json";
  var SEARCH_RESULT_LIMIT = 5;
  var SEARCH_ANIMATION_DURATION = 0.24;
  var SEARCH_RESULT_STAGGER = 0.035;

  var fuse = null;
  var fuseIndex = null;
  var searchVisible = false;
  var searchReady = false;
  var loadingSearch = false;
  var resultsAvailable = false;
  var firstResultLink = null;
  var lastResultLink = null;
  var hasGsap = typeof window.gsap !== "undefined";
  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var searchContainer = document.querySelector(SEARCH_CONTAINER_SELECTOR);
  var searchInput = document.querySelector(SEARCH_INPUT_SELECTOR);
  var searchResults = document.querySelector(SEARCH_RESULTS_SELECTOR);
  var searchToggle = document.querySelector(SEARCH_TOGGLE_SELECTOR);

  if (!searchContainer || !searchInput || !searchResults || !searchToggle) {
    return;
  }

  if (hasGsap) {
    window.gsap.set(searchContainer, {
      autoAlpha: 0,
      x: 12,
      scale: 0.985,
      transformOrigin: "right center"
    });
  }

  function updateResultBoundaries() {
    var links = searchResults.querySelectorAll("a");
    firstResultLink = links.length > 0 ? links[0] : null;
    lastResultLink = links.length > 0 ? links[links.length - 1] : null;
  }

  function renderStatus(message) {
    searchResults.innerHTML = '<li><span class="title">' + message + "</span></li>";
    resultsAvailable = false;
    updateResultBoundaries();
  }

  function clearResults() {
    searchResults.innerHTML = "";
    resultsAvailable = false;
    updateResultBoundaries();
  }

  function animateResults() {
    if (!hasGsap || prefersReducedMotion || !resultsAvailable) {
      return;
    }

    var items = searchResults.querySelectorAll("li");
    if (items.length === 0) {
      return;
    }

    window.gsap.killTweensOf(items);
    window.gsap.fromTo(
      items,
      { autoAlpha: 0, y: 8 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.22,
        ease: "power2.out",
        stagger: SEARCH_RESULT_STAGGER
      }
    );
  }

  function hideSearch() {
    if (!searchVisible) {
      return;
    }

    searchVisible = false;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (!hasGsap || prefersReducedMotion) {
      searchContainer.style.visibility = "hidden";
      clearResults();
      return;
    }

    window.gsap.killTweensOf(searchContainer);
    window.gsap.to(searchContainer, {
      autoAlpha: 0,
      x: 12,
      scale: 0.985,
      duration: SEARCH_ANIMATION_DURATION,
      ease: "power2.inOut",
      onComplete: clearResults
    });
  }

  function showSearch() {
    searchVisible = true;

    if (!hasGsap || prefersReducedMotion) {
      searchContainer.style.visibility = "visible";
      searchInput.focus();
      return;
    }

    window.gsap.killTweensOf(searchContainer);
    window.gsap.fromTo(
      searchContainer,
      { autoAlpha: 0, x: 12, scale: 0.985 },
      {
        autoAlpha: 1,
        x: 0,
        scale: 1,
        duration: SEARCH_ANIMATION_DURATION,
        ease: "power2.out",
        onStart: function() {
          searchContainer.style.visibility = "visible";
        },
        onComplete: function() {
          searchInput.focus();
        }
      }
    );
  }

  function fetchJSONFile(path, callback, onError) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
      if (httpRequest.readyState !== 4) {
        return;
      }

      if (httpRequest.status === 200) {
        try {
          var data = JSON.parse(httpRequest.responseText);
          callback(data);
        } catch (error) {
          onError(error);
        }
        return;
      }

      onError(new Error("Request failed with status " + httpRequest.status));
    };
    httpRequest.open("GET", path);
    httpRequest.send();
  }

  function loadSearch() {
    if (searchReady || loadingSearch) {
      return;
    }

    loadingSearch = true;

    fetchJSONFile(
      SEARCH_INDEX_URL,
      function(data) {
        var options = {
          shouldSort: true,
          location: 0,
          distance: 100,
          threshold: 0.4,
          minMatchCharLength: 2,
          keys: ["permalink", "title", "summary", "tags", "contents"]
        };

        fuseIndex = Fuse.createIndex(options.keys, data);
        fuse = new Fuse(data, options, fuseIndex);
        searchReady = true;
        loadingSearch = false;

        if (searchInput.value.trim()) {
          executeSearch(searchInput.value);
        } else if (searchVisible) {
          clearResults();
        }
      },
      function(error) {
        loadingSearch = false;
        console.error("Search index load failed:", error);
        renderStatus("Search unavailable");
      }
    );
  }

  function executeSearch(term) {
    var normalizedTerm = term.trim();

    if (!normalizedTerm) {
      clearResults();
      return;
    }

    if (!searchReady || !fuse) {
      if (!loadingSearch) {
        renderStatus("Search unavailable");
      }
      return;
    }

    var results = fuse.search(normalizedTerm);
    var searchItems = "";
    var permalinks = [];
    var item;

    if (results.length === 0) {
      renderStatus("No results");
      return;
    }

    for (item = 0; item < results.length && permalinks.length < SEARCH_RESULT_LIMIT; item += 1) {
      var result = results[item].item;

      if (permalinks.indexOf(result.permalink) !== -1) {
        continue;
      }

      searchItems += '<li><a href="' + result.permalink + '" tabindex="0"><span class="title">' + result.title + "</span></a></li>";
      permalinks.push(result.permalink);
    }

    searchResults.innerHTML = searchItems;
    resultsAvailable = permalinks.length > 0;
    updateResultBoundaries();
    animateResults();
  }

  function toggleSearch(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!searchReady && !loadingSearch) {
      loadSearch();
    }

    if (searchVisible) {
      hideSearch();
      return;
    }

    showSearch();
  }

  function isSearchInteractiveArea(target) {
    if (!target) {
      return false;
    }

    if (target.closest(SEARCH_TOGGLE_SELECTOR)) {
      return true;
    }

    if (target === searchInput || target.closest(SEARCH_RESULTS_SELECTOR)) {
      return true;
    }

    return false;
  }

  searchInput.addEventListener("keyup", function() {
    executeSearch(searchInput.value);
  });

  searchToggle.addEventListener("click", toggleSearch);

  document.addEventListener("click", function(event) {
    if (!searchVisible) {
      return;
    }

    if (isSearchInteractiveArea(event.target)) {
      return;
    }

    hideSearch();
  });

  document.addEventListener("focusin", function(event) {
    if (!searchVisible) {
      return;
    }

    if (isSearchInteractiveArea(event.target)) {
      return;
    }

    hideSearch();
  });

  document.addEventListener("keydown", function(event) {
    if (event.altKey && event.key === SEARCH_SHORTCUT_KEY) {
      toggleSearch(event);
      return;
    }

    if (event.key === "Escape" && searchVisible) {
      hideSearch();
      return;
    }

    if (!searchVisible || !resultsAvailable) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (document.activeElement === searchInput && firstResultLink) {
        firstResultLink.focus();
        return;
      }

      if (document.activeElement === lastResultLink) {
        lastResultLink.focus();
        return;
      }

      var nextItem = document.activeElement.parentElement && document.activeElement.parentElement.nextElementSibling;
      if (nextItem && nextItem.firstElementChild) {
        nextItem.firstElementChild.focus();
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (document.activeElement === searchInput) {
        return;
      }

      if (document.activeElement === firstResultLink) {
        searchInput.focus();
        return;
      }

      var previousItem = document.activeElement.parentElement && document.activeElement.parentElement.previousElementSibling;
      if (previousItem && previousItem.firstElementChild) {
        previousItem.firstElementChild.focus();
      }
    }
  });
})();
