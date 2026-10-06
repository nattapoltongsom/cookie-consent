export type ConsentCategory = "necessary" | "functional" | "analytics" | "marketing";

export type ConsentState = Record<ConsentCategory, boolean>;

export type ConsentUpdate = Partial<Omit<ConsentState, "necessary">>;

export type ConsentChangeCallback = (consent: ConsentState) => void;

export type CookieListItem = {
  name: string;
  host: string;
  duration: string;
  description: string;
};

export type ConsentCategoryConfig = {
  id: ConsentCategory;
  label: string;
  description: string;
  required?: boolean;
  cookies?: CookieListItem[];
};

export type CategoryRule = {
  category: Exclude<ConsentCategory, "necessary">;
  match: string | RegExp;
};

export type BannerOptions = {
  enabled?: boolean;
  brandName?: string;
  title?: string;
  description?: string;
};

export type ConsentSdkOptions = {
  autoBlock?: boolean;
  banner?: boolean | BannerOptions;
  storageKey?: string;
  debug?: boolean;
  rules?: CategoryRule[];
  consentList?: ConsentCategoryConfig[];
};

export type ConsentSdkApi = {
  init(options?: ConsentSdkOptions): void;
  getConsentList(): ConsentCategoryConfig[];
  getConsent(): ConsentState;
  hasConsent(category: ConsentCategory): boolean;
  acceptAll(): void;
  rejectAll(): void;
  updateConsent(update: ConsentUpdate): void;
  resetConsent(): void;
  showBanner(): void;
  showSettings(): void;
  renderCookiePolicy(target?: string | HTMLElement): void;
  onConsentChanged(callback: ConsentChangeCallback): () => void;
};

declare global {
  interface Window {
    ConsentSDK: ConsentSdkApi;
    OneTrustLike: ConsentSdkApi;
    OptanonWrapper?: () => void;
    OnetrustActiveGroups?: string;
  }
}
