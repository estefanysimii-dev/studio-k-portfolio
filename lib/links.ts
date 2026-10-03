export function isExternalHref(href?: string) {
  return /^https?:\/\//i.test(String(href || "").trim());
}

export function externalLinkProps(href?: string) {
  return isExternalHref(href)
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
}
