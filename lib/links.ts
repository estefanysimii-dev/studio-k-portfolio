export const DEFAULT_DISCORD_INVITE = "https://discord.gg/YPShX4FQCE";

export function discordInviteHref(configured?: string) {
  const value = String(configured || "").trim();
  return value || DEFAULT_DISCORD_INVITE;
}

export function isExternalHref(href?: string) {
  return /^https?:\/\//i.test(String(href || "").trim());
}

export function externalLinkProps(href?: string) {
  return isExternalHref(href)
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
}
