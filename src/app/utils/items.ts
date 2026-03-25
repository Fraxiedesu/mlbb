import type { HeroData, ItemCategory, ItemData } from "@/app/types/data";

function hasAny<T extends string>(values: readonly T[], targets: readonly T[]) {
  return values.some((value) => targets.includes(value));
}

export function isOffenseItemCategory(category: ItemCategory) {
  return category === "Attack" || category === "Magic";
}

export function isDefenseItemCategory(category: ItemCategory) {
  return category === "Defense";
}

export function isMovementItemCategory(category: ItemCategory) {
  return category === "Movement";
}

export function isJunglingItemCategory(category: ItemCategory) {
  return category === "Jungling";
}

export function isRoamingItemCategory(category: ItemCategory) {
  return category === "Roaming";
}

export function getItemCategoryFitNotes(hero: HeroData, item: ItemData) {
  const notes: string[] = [];
  const isFrontliner =
    hero.role.some((role) => ["Tank", "Fighter", "Support"].includes(role)) || hero.normalizedTags.includes("Frontline");

  if (item.category === "Attack") {
    if (hero.damageProfile.primary === "Physical") {
      notes.push("Matches a physical damage core");
    } else if (hero.normalizedTags.includes("Sustained DPS") || hero.normalizedTags.includes("Backline Carry")) {
      notes.push("Fits a damage-focused carry build");
    }
  }

  if (item.category === "Magic") {
    if (hero.damageProfile.primary === "Magic" || hero.damageProfile.primary === "Mixed") {
      notes.push("Matches a magic damage core");
    }
  }

  if (item.category === "Defense" && isFrontliner) {
    notes.push("Fits a frontline or peel-oriented hero");
  }

  if (
    item.category === "Movement" &&
    (hero.normalizedTags.includes("Mobility") || hero.normalizedTags.includes("Engage") || hero.normalizedTags.includes("Pickoff"))
  ) {
    notes.push("Supports tempo and positioning");
  }

  if (item.category === "Jungling" && hero.lanes.includes("Jungle")) {
    notes.push("Matches a jungle path");
  }

  if (item.category === "Roaming" && (hero.lanes.includes("Roam") || isFrontliner || hasAny(hero.role, ["Tank", "Support"]))) {
    notes.push("Matches a roam-supportive role");
  }

  if (isOffenseItemCategory(item.category) && hero.damageProfile.primary !== "None") {
    notes.push("Keeps the build aligned with the hero's damage plan");
  }

  return notes;
}
