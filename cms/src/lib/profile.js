function extractProfileDisplay(profile) {
  if (!profile || typeof profile !== "object") {
    return { name: "", company: "" };
  }
  const p = profile.data || profile.user || profile;
  return {
    name: String(p.name || p.fullName || "").trim(),
    company: String(p.company || p.companyName || "").trim()
  };
}

module.exports = { extractProfileDisplay };
