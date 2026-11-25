(() => {
  if (window.__feedlyFloatingNavigationLoaded) return;
  window.__feedlyFloatingNavigationLoaded = true;

  const DEFAULTS = { previousKey: "k", readKey: "m", nextKey: "n", position: null };
  const STORAGE_KEYS = ["previousKey", "readKey", "nextKey", "position"];

  const normalizeKey = (value, fallback) => {
    const v = String(value || "").trim();
    return v.length === 1 ? v.toLowerCase() : fallback;
  };

  const loadSettings = async () => {
    try {
      const stored = await chrome.storage.local.get(STORAGE_KEYS);
      return {
        previousKey: normalizeKey(stored.previousKey, DEFAULTS.previousKey),
        readKey: normalizeKey(stored.readKey, DEFAULTS.readKey),
        nextKey: normalizeKey(stored.nextKey, DEFAULTS.nextKey),
        position: stored.position && Number.isFinite(stored.position.left) &&
                  Number.isFinite(stored.position.top) ? stored.position : null
      };
    } catch (_) {
      return { ...DEFAULTS };
    }
  };

  const fireShortcut = (key) => {
    // Feedly's own keyboard shortcut handler receives the same keydown/keyup
    // sequence as a normal single-character shortcut.
    const target = document.activeElement || document.body || document;
    const code = "Key" + key.toUpperCase();
    const options = {
      key,
      code,
      bubbles: true,
      cancelable: true,
      composed: true
    };
    target.dispatchEvent(new KeyboardEvent("keydown", options));
    target.dispatchEvent(new KeyboardEvent("keyup", options));
  };

  const root = document.createElement("div");
  root.id = "ffn-root";
  root.innerHTML = `
    <button class="ffn-button" type="button" data-direction="previous"
      aria-label="" title=""></button>
    <button class="ffn-button ffn-letter-button" type="button" data-direction="read"
      aria-label="" title="">M</button>
    <button class="ffn-button" type="button" data-direction="next"
      aria-label="" title=""></button>
  `;
  document.documentElement.appendChild(root);

  const previousButton = root.querySelector('[data-direction="previous"]');
  const readButton = root.querySelector('[data-direction="read"]');
  const nextButton = root.querySelector('[data-direction="next"]');
  previousButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>';
  nextButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 10 6 6 6-6"/></svg>';

  let settings = { ...DEFAULTS };
  let drag = null;
  let moved = false;
  let suppressClickUntil = 0;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));

  function applyPosition(position) {
    if (position) {
      const rect = root.getBoundingClientRect();
      const left = clamp(position.left, 4, window.innerWidth - rect.width - 4);
      const top = clamp(position.top, 4, window.innerHeight - rect.height - 4);
      root.style.left = `${left}px`;
      root.style.top = `${top}px`;
      root.style.right = "auto";
      root.style.transform = "none";
      settings.position = { left, top };
    } else {
      root.style.left = "auto";
      root.style.right = "22px";
      root.style.top = "50%";
      root.style.transform = "translateY(-50%)";
    }
  }

  function updateTitles() {
    const previousKey = settings.previousKey.toUpperCase();
    const readKey = settings.readKey.toUpperCase();
    const nextKey = settings.nextKey.toUpperCase();
    previousButton.title = chrome.i18n.getMessage("previousButtonTitle", previousKey);
    previousButton.setAttribute("aria-label", previousButton.title);
    readButton.textContent = readKey;
    readButton.title = chrome.i18n.getMessage("readButtonTitle", readKey);
    readButton.setAttribute("aria-label", readButton.title);
    nextButton.title = chrome.i18n.getMessage("nextButtonTitle", nextKey);
    nextButton.setAttribute("aria-label", nextButton.title);
  }

  function savePosition() {
    const rect = root.getBoundingClientRect();
    settings.position = { left: Math.round(rect.left), top: Math.round(rect.top) };
    chrome.storage.local.set({ position: settings.position });
  }

  function onPointerDown(event) {
    if (event.button !== 0) return;
    const rect = root.getBoundingClientRect();
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top
    };
    moved = false;
    root.classList.add("ffn-pressed");
    event.preventDefault();
  }

  root.addEventListener("pointerdown", onPointerDown);

  window.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!moved && Math.hypot(dx, dy) < 5) return;
    moved = true;
    const rect = root.getBoundingClientRect();
    const left = clamp(drag.left + dx, 4, window.innerWidth - rect.width - 4);
    const top = clamp(drag.top + dy, 4, window.innerHeight - rect.height - 4);
    root.style.left = `${left}px`;
    root.style.top = `${top}px`;
    root.style.right = "auto";
    root.style.transform = "none";
  }, true);

  function endDrag(event) {
    if (!drag || (event && event.pointerId !== undefined && event.pointerId !== drag.pointerId)) return;
    if (moved) {
      savePosition();
      suppressClickUntil = Date.now() + 250;
    }
    drag = null;
    root.classList.remove("ffn-pressed");
  }
  window.addEventListener("pointerup", endDrag, true);
  window.addEventListener("pointercancel", endDrag, true);

  previousButton.addEventListener("click", (event) => {
    if (Date.now() < suppressClickUntil) return;
    event.stopPropagation();
    fireShortcut(settings.previousKey);
  });
  readButton.addEventListener("click", (event) => {
    if (Date.now() < suppressClickUntil) return;
    event.stopPropagation();
    fireShortcut(settings.readKey);
  });
  nextButton.addEventListener("click", (event) => {
    if (Date.now() < suppressClickUntil) return;
    event.stopPropagation();
    fireShortcut(settings.nextKey);
  });

  window.addEventListener("resize", () => {
    if (settings.position) applyPosition(settings.position);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.previousKey) settings.previousKey = normalizeKey(changes.previousKey.newValue, DEFAULTS.previousKey);
    if (changes.readKey) settings.readKey = normalizeKey(changes.readKey.newValue, DEFAULTS.readKey);
    if (changes.nextKey) settings.nextKey = normalizeKey(changes.nextKey.newValue, DEFAULTS.nextKey);
    if (changes.position) {
      settings.position = changes.position.newValue || null;
      applyPosition(settings.position);
    }
    updateTitles();
  });

  loadSettings().then((loaded) => {
    settings = loaded;
    applyPosition(settings.position);
    updateTitles();
  });
})();
