const enabledToggle = document.getElementById("enabledToggle");
const statusText = document.getElementById("statusText");
const blockedCountEl = document.getElementById("blockedCount");
const addForm = document.getElementById("addForm");
const domainInput = document.getElementById("domainInput");
const addError = document.getElementById("addError");
const openOptions = document.getElementById("openOptions");

function render({ enabled, blockedCount }) {
  enabledToggle.checked = enabled;
  statusText.textContent = enabled
    ? "Gambling sites are being blocked."
    : "Blocking is paused.";
  blockedCountEl.textContent = blockedCount ?? 0;
}

chrome.storage.local.get(["enabled", "blockedCount"]).then(render);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  chrome.storage.local.get(["enabled", "blockedCount"]).then(render);
});

enabledToggle.addEventListener("change", () => {
  chrome.storage.local.set({ enabled: enabledToggle.checked });
});

addForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  addError.textContent = "";

  const domain = normalizeDomain(domainInput.value);
  if (!domain) {
    addError.textContent = "Enter a valid site, e.g. example.com";
    return;
  }

  const { customDomains = [] } = await chrome.storage.local.get(["customDomains"]);
  if (customDomains.includes(domain)) {
    addError.textContent = `${domain} is already blocked.`;
    return;
  }

  await chrome.storage.local.set({ customDomains: [...customDomains, domain] });
  domainInput.value = "";
});

openOptions.addEventListener("click", () => chrome.runtime.openOptionsPage());
