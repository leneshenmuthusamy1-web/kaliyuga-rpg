const curatedCountEl = document.getElementById("curatedCount");
const curatedListEl = document.getElementById("curatedList");
const customListEl = document.getElementById("customList");
const addForm = document.getElementById("addForm");
const domainInput = document.getElementById("domainInput");
const addError = document.getElementById("addError");
const blockedCountEl = document.getElementById("blockedCount");
const resetCount = document.getElementById("resetCount");

curatedCountEl.textContent = CURATED_GAMBLING_DOMAINS.length;
curatedListEl.innerHTML = CURATED_GAMBLING_DOMAINS
  .slice()
  .sort()
  .map((domain) => `<li>${domain}</li>`)
  .join("");

function renderCustomList(customDomains) {
  customListEl.innerHTML = "";
  customDomains
    .slice()
    .sort()
    .forEach((domain) => {
      const li = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = domain;
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => removeDomain(domain));
      li.append(label, removeBtn);
      customListEl.append(li);
    });
}

async function removeDomain(domain) {
  const { customDomains = [] } = await chrome.storage.local.get(["customDomains"]);
  await chrome.storage.local.set({
    customDomains: customDomains.filter((d) => d !== domain)
  });
}

async function refresh() {
  const { customDomains = [], blockedCount = 0 } =
    await chrome.storage.local.get(["customDomains", "blockedCount"]);
  renderCustomList(customDomains);
  blockedCountEl.textContent = blockedCount;
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") refresh();
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

resetCount.addEventListener("click", () => {
  chrome.storage.local.set({ blockedCount: 0 });
});

refresh();
