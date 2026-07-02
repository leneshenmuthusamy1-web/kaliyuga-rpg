chrome.runtime.sendMessage({ type: "BLOCKED_PAGE_LOADED" });

document.getElementById("goBack").addEventListener("click", () => {
  if (history.length > 1) history.back();
  else location.href = "https://www.google.com";
});

document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
