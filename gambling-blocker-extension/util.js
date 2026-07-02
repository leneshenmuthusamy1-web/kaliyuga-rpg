// Turns user input like "https://www.Example.com/path" into "example.com".
function normalizeDomain(input) {
  let value = input.trim().toLowerCase();
  if (!value) return "";
  if (!/^[a-z]+:\/\//.test(value)) value = "https://" + value;
  try {
    const host = new URL(value).hostname;
    return host.replace(/^www\./, "");
  } catch {
    return "";
  }
}
