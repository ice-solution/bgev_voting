function extractProfileDisplay(profile) {
  if (!profile || typeof profile !== "object") {
    return { name: "", email: "", company: "" };
  }
  const p = profile.data || profile.user || profile;
  return {
    name: String(p.name || p.fullName || "").trim(),
    email: String(p.email || "").trim(),
    company: String(p.company || p.companyName || "").trim()
  };
}

module.exports = { extractProfileDisplay };
