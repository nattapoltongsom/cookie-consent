import type { CategoryRule, ConsentCategory } from "./types";

export const defaultRules: CategoryRule[] = [
  { category: "analytics", match: "googletagmanager.com" },
  { category: "analytics", match: "google-analytics.com" },
  { category: "analytics", match: "analytics.google.com" },
  { category: "analytics", match: "gtag/js" },
  { category: "analytics", match: "hotjar.com" },
  { category: "analytics", match: "clarity.ms" },
  { category: "marketing", match: "doubleclick.net" },
  { category: "marketing", match: "facebook.net" },
  { category: "marketing", match: "connect.facebook.net" },
  { category: "marketing", match: "tiktok.com" },
  { category: "marketing", match: "ads.linkedin.com" },
  { category: "functional", match: "intercom.io" },
  { category: "functional", match: "zendesk.com" }
];

const categories: ConsentCategory[] = ["necessary", "functional", "analytics", "marketing"];

export function isConsentCategory(value: string | null): value is ConsentCategory {
  return categories.includes(value as ConsentCategory);
}

export function categoryFromUrl(url: string, rules: CategoryRule[]): ConsentCategory | null {
  const normalized = url.toLowerCase();
  const rule = rules.find((item) => {
    if (typeof item.match === "string") {
      return normalized.includes(item.match.toLowerCase());
    }

    return item.match.test(url);
  });

  return rule?.category ?? null;
}
