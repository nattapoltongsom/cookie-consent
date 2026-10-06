import { AutoBlocker } from "./auto-blocker";
import { ConsentBanner } from "./banner";
import { defaultConsentList } from "./consent-list";
import { ConsentManager } from "./consent-manager";
import { CookiePolicy } from "./cookie-policy";
import { PreferenceCenter } from "./preference-center";
import { defaultRules } from "./rules";
import type {
  BannerOptions,
  ConsentCategoryConfig,
  ConsentCategory,
  ConsentChangeCallback,
  ConsentSdkApi,
  ConsentSdkOptions,
  ConsentState,
  ConsentUpdate
} from "./types";

export type {
  BannerOptions,
  CategoryRule,
  ConsentCategoryConfig,
  ConsentCategory,
  ConsentChangeCallback,
  ConsentSdkApi,
  ConsentSdkOptions,
  ConsentState,
  ConsentUpdate
} from "./types";

let manager: ConsentManager | null = null;
let blocker: AutoBlocker | null = null;
let banner: ConsentBanner | null = null;
let preferenceCenter: PreferenceCenter | null = null;
let cookiePolicy: CookiePolicy | null = null;
let uiOptions: BannerOptions = {};
let consentList: ConsentCategoryConfig[] = defaultConsentList;
let settingsButtonHandlerInstalled = false;
let debugEnabled = false;

function getManager(): ConsentManager {
  if (!manager) {
    init();
  }

  return manager as ConsentManager;
}

export function init(options: ConsentSdkOptions = {}): void {
  if (manager) {
    return;
  }

  debugEnabled = options.debug === true;
  manager = new ConsentManager(options.storageKey);
  consentList = options.consentList ?? defaultConsentList;
  cookiePolicy = new CookiePolicy(consentList);

  if (options.autoBlock !== false) {
    debugLog("installing auto blocker");
    blocker = new AutoBlocker(
      manager,
      [...defaultRules, ...(options.rules ?? [])],
      options.debug === true
    );
    blocker.install();
  } else {
    debugLog("auto blocker disabled");
  }

  if (options.banner !== false) {
    uiOptions = typeof options.banner === "object" ? options.banner : {};
    debugLog("creating banner and preference center", uiOptions);
    banner = new ConsentBanner(manager, uiOptions, consentList);
    preferenceCenter = new PreferenceCenter(manager, uiOptions, consentList);
    installWhenReady(banner);
    installWhenReady(preferenceCenter);
  } else {
    debugLog("banner and preference center disabled");
  }

  ready(() => {
    debugLog("installing cookie policy renderer");
    cookiePolicy?.install();
  });
  installSettingsButtonHandler();

  window.dispatchEvent(new CustomEvent("consent:ready", { detail: manager.getConsent() }));
  debugLog("consent:ready dispatched", manager.getConsent());
}

export function getConsent(): ConsentState {
  return getManager().getConsent();
}

export function getConsentList(): ConsentCategoryConfig[] {
  return consentList.map((item) => ({ ...item }));
}

export function hasConsent(category: ConsentCategory): boolean {
  return getManager().hasConsent(category);
}

export function acceptAll(): void {
  getManager().acceptAll();
}

export function rejectAll(): void {
  getManager().rejectAll();
}

export function updateConsent(update: ConsentUpdate): void {
  getManager().updateConsent(update);
}

export function resetConsent(): void {
  getManager().resetConsent();
}

export function showBanner(): void {
  debugLog("showBanner called");
  const notice = ensureBanner();
  showWhenReady(notice);
}

export function showSettings(): void {
  debugLog("showSettings called");
  const settings = ensurePreferenceCenter();
  showWhenReady(settings);
}

export function renderCookiePolicy(target?: string | HTMLElement): void {
  debugLog("renderCookiePolicy called", target);
  ensureCookiePolicy();
  ready(() => cookiePolicy?.render(target));
}

function ensureBanner(): ConsentBanner {
  const activeManager = getManager();

  if (!banner) {
    debugLog("lazy creating banner");
    banner = new ConsentBanner(activeManager, uiOptions, consentList);
    installWhenReady(banner);
  }

  return banner;
}

function ensurePreferenceCenter(): PreferenceCenter {
  const activeManager = getManager();

  if (!preferenceCenter) {
    debugLog("lazy creating preference center");
    preferenceCenter = new PreferenceCenter(activeManager, uiOptions, consentList);
    installWhenReady(preferenceCenter);
  }

  return preferenceCenter;
}

function ensureCookiePolicy(): CookiePolicy {
  getManager();

  if (!cookiePolicy) {
    debugLog("lazy creating cookie policy renderer");
    cookiePolicy = new CookiePolicy(consentList);
  }

  return cookiePolicy;
}

export function onConsentChanged(callback: ConsentChangeCallback): () => void {
  return getManager().onConsentChanged(callback);
}

export const ConsentSDK: ConsentSdkApi = {
  init,
  getConsentList,
  getConsent,
  hasConsent,
  acceptAll,
  rejectAll,
  updateConsent,
  resetConsent,
  showBanner,
  showSettings,
  renderCookiePolicy,
  onConsentChanged
};

if (typeof window !== "undefined") {
  bootstrapBrowserSdk();
}

function bootstrapBrowserSdk(): void {
  window.ConsentSDK = ConsentSDK;
  window.OneTrustLike = ConsentSDK;
  window.OptanonWrapper = window.OptanonWrapper ?? function noop() {};

  const options = readAutoOptions();
  if (options) {
    debugEnabled = options.debug === true;
    debugLog("script loaded");
    debugLog("data-consent-auto script found", options);
    init(options);
    return;
  }

  debugLog("waiting for manual init");
}

function readAutoOptions(): ConsentSdkOptions | null {
  const script = document.currentScript;
  if (!(script instanceof HTMLScriptElement) || !script.hasAttribute("data-consent-auto")) {
    return null;
  }

  const banner = readBoolean(script, "data-banner");
  const bannerOptions: BannerOptions = {
    brandName: script.dataset.brandName,
    title: script.dataset.bannerTitle,
    description: script.dataset.bannerDescription
  };

  return {
    autoBlock: readBoolean(script, "data-auto-block"),
    debug: readBoolean(script, "data-debug"),
    storageKey: script.dataset.storageKey,
    banner: banner === false ? false : bannerOptions
  };
}

function readBoolean(script: HTMLScriptElement, name: string): boolean | undefined {
  if (!script.hasAttribute(name)) {
    return undefined;
  }

  const value = script.getAttribute(name);
  return value === "" || value === "true";
}

function ready(callback: () => void): void {
  if (document.body) {
    callback();
    return;
  }

  document.addEventListener("DOMContentLoaded", callback, { once: true });
}

function installWhenReady(component: { install(): void }): void {
  ready(() => {
    debugLog(`install ${component.constructor.name}`);
    component.install();
  });
}

function showWhenReady(component: { show(): void }): void {
  ready(() => component.show());
}

function installSettingsButtonHandler(): void {
  if (settingsButtonHandlerInstalled) {
    return;
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    const element = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
    if (!element) {
      return;
    }

    const button = element.closest(".ot-sdk-show-settings, [data-consent-show-settings]");
    if (!button) {
      return;
    }

    event.preventDefault();
    showSettings();
  });

  settingsButtonHandlerInstalled = true;
}

function debugLog(message: string, data?: unknown): void {
  if (!debugEnabled) {
    return;
  }

  if (data === undefined) {
    console.info(`[ConsentSDK] ${message}`);
    return;
  }

  console.info(`[ConsentSDK] ${message}`, data);
}

export default ConsentSDK;
