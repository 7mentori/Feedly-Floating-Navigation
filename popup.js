const previousInput = document.getElementById("previousKey");
const readInput = document.getElementById("readKey");
const nextInput = document.getElementById("nextKey");
const status = document.getElementById("status");

function message(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

function applyLocalization() {
  document.documentElement.lang = chrome.i18n.getUILanguage();
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = message(element.dataset.i18n);
  });
  document.title = message("popupTitle");
}

function clean(value) {
  return String(value || "").trim().toLowerCase();
}

function showStatus(messageText, isError = false) {
  status.textContent = messageText;
  status.style.color = isError ? "#d93025" : "#188038";
}

async function load() {
  const values = await chrome.storage.local.get(["previousKey", "readKey", "nextKey"]);
  previousInput.value = values.previousKey || "k";
  readInput.value = values.readKey || "m";
  nextInput.value = values.nextKey || "n";
}

applyLocalization();
load();

document.getElementById("save").addEventListener("click", async () => {
  const previousKey = clean(previousInput.value);
  const readKey = clean(readInput.value);
  const nextKey = clean(nextInput.value);
  if (![previousKey, readKey, nextKey].every((key) => /^[a-z0-9]$/.test(key))) {
    showStatus(message("invalidKey"), true);
    return;
  }
  if (new Set([previousKey, readKey, nextKey]).size !== 3) {
    showStatus(message("duplicateKey"), true);
    return;
  }
  await chrome.storage.local.set({ previousKey, readKey, nextKey });
  showStatus(message("savedStatus"));
});

document.getElementById("reset").addEventListener("click", async () => {
  previousInput.value = "k";
  readInput.value = "m";
  nextInput.value = "n";
  await chrome.storage.local.set({ previousKey: "k", readKey: "m", nextKey: "n" });
  showStatus(message("resetStatus"));
});

for (const input of [previousInput, readInput, nextInput]) {
  input.addEventListener("input", () => {
    input.value = input.value.slice(-1).toLowerCase();
  });
}
