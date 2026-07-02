const STATIC_RULESET_ID = "gambling_domains";
const CUSTOM_REDIRECT_RULE_ID = 10001;
const CUSTOM_BLOCK_RULE_ID = 10002;

const SUB_RESOURCE_TYPES = [
  "sub_frame", "stylesheet", "script", "image", "font",
  "object", "xmlhttprequest", "ping", "media", "websocket", "other"
];

async function getState() {
  const { enabled = true, customDomains = [], blockedCount = 0 } =
    await chrome.storage.local.get(["enabled", "customDomains", "blockedCount"]);
  return { enabled, customDomains, blockedCount };
}

function buildCustomRules(customDomains) {
  if (!customDomains.length) return [];
  return [
    {
      id: CUSTOM_REDIRECT_RULE_ID,
      priority: 2,
      action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } },
      condition: { requestDomains: customDomains, resourceTypes: ["main_frame"] }
    },
    {
      id: CUSTOM_BLOCK_RULE_ID,
      priority: 1,
      action: { type: "block" },
      condition: { requestDomains: customDomains, resourceTypes: SUB_RESOURCE_TYPES }
    }
  ];
}

async function syncRules() {
  const { enabled, customDomains } = await getState();

  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: enabled ? [STATIC_RULESET_ID] : [],
    disableRulesetIds: enabled ? [] : [STATIC_RULESET_ID]
  });

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((rule) => rule.id),
    addRules: enabled ? buildCustomRules(customDomains) : []
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(["enabled", "customDomains", "blockedCount"]);
  await chrome.storage.local.set({
    enabled: stored.enabled ?? true,
    customDomains: stored.customDomains ?? [],
    blockedCount: stored.blockedCount ?? 0
  });
  await syncRules();
});

chrome.runtime.onStartup.addListener(syncRules);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.enabled || changes.customDomains) syncRules();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "BLOCKED_PAGE_LOADED") {
    getState().then(({ blockedCount }) => {
      chrome.storage.local.set({ blockedCount: blockedCount + 1 });
    });
  }
});
