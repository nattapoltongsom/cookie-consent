import type {
  ConsentCategory,
  ConsentChangeCallback,
  ConsentState,
  ConsentUpdate
} from "./types";

const defaultConsent: ConsentState = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false
};

const cookieMaxAgeSeconds = 60 * 60 * 24 * 180;

export class ConsentManager {
  private readonly callbacks = new Set<ConsentChangeCallback>();
  private readonly storageKey: string;
  private consent: ConsentState;

  constructor(storageKey = "simple-consent-sdk") {
    this.storageKey = storageKey;
    this.consent = this.load();
  }

  getConsent(): ConsentState {
    return { ...this.consent, necessary: true };
  }

  hasConsent(category: ConsentCategory): boolean {
    return this.getConsent()[category] === true;
  }

  hasSavedConsent(): boolean {
    return readCookie(this.storageKey) !== null || safeLocalStorage()?.getItem(this.storageKey) !== null;
  }

  acceptAll(): void {
    this.setConsent({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    });
  }

  rejectAll(): void {
    this.setConsent(defaultConsent);
  }

  updateConsent(update: ConsentUpdate): void {
    this.setConsent({
      ...this.consent,
      ...update,
      necessary: true
    });
  }

  resetConsent(): void {
    this.consent = { ...defaultConsent };
    deleteCookie(this.storageKey);
    safeLocalStorage()?.removeItem(this.storageKey);
    this.emit();
  }

  onConsentChanged(callback: ConsentChangeCallback): () => void {
    this.callbacks.add(callback);
    callback(this.getConsent());

    return () => {
      this.callbacks.delete(callback);
    };
  }

  private setConsent(consent: ConsentState): void {
    this.consent = { ...consent, necessary: true };
    const value = JSON.stringify(this.consent);
    writeCookie(this.storageKey, value);
    safeLocalStorage()?.setItem(this.storageKey, value);
    this.emit();
  }

  private load(): ConsentState {
    const saved = readCookie(this.storageKey) ?? safeLocalStorage()?.getItem(this.storageKey);
    if (!saved) {
      return { ...defaultConsent };
    }

    try {
      return { ...defaultConsent, ...JSON.parse(saved), necessary: true };
    } catch {
      return { ...defaultConsent };
    }
  }

  private emit(): void {
    const consent = this.getConsent();
    this.callbacks.forEach((callback) => callback(consent));
    window.dispatchEvent(new CustomEvent("consent:changed", { detail: consent }));
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(prefix.length));
}

function writeCookie(name: string, value: string): void {
  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${cookieMaxAgeSeconds}`,
    "SameSite=Lax"
  ].join("; ");
}

function deleteCookie(name: string): void {
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}
