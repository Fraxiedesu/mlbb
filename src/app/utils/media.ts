import type { HeroData, ItemData } from "@/app/types/data";

function getSourceSlug(url: string | undefined) {
  if (!url) {
    return "";
  }

  const withoutQuery = url.split("?")[0];
  const slug = withoutQuery.split("/").filter(Boolean).pop() || "";
  return decodeURIComponent(slug);
}

function encodeFileName(fileName: string) {
  return encodeURIComponent(fileName).replace(/%20/g, "_");
}

function buildRedirectFileUrl(fileName: string) {
  return `https://liquipedia.net/commons/Special:Redirect/file/${encodeFileName(fileName)}`;
}

export function getHeroIconUrl(hero: HeroData) {
  const slug = getSourceSlug(hero.sourceRefs[0]?.url) || hero.name.replace(/\s+/g, "_");
  return buildRedirectFileUrl(`ML_icon_${slug}.png`);
}

export function getItemIconUrl(item: ItemData) {
  const slug = getSourceSlug(item.sourceRefs[0]?.url) || item.name.replace(/\s+/g, "_");
  return buildRedirectFileUrl(`Item_${slug}_ML.png`);
}

export function getInitials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}
