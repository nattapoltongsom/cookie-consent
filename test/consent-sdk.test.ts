import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ConsentBanner } from "../src/banner";
import { defaultConsentList } from "../src/consent-list";
import { ConsentManager } from "../src/consent-manager";
import ConsentSDK from "../src";

describe("Consent SDK", () => {
  beforeAll(() => {
    ConsentSDK.init({ autoBlock: true, banner: false });
  });

  beforeEach(() => {
    ConsentSDK.resetConsent();
  });

  it("blocks a declared analytics script without needing text/plain in HTML", () => {
    const script = document.createElement("script");
    script.setAttribute("data-consent-category", "analytics");
    script.src = "https://cdn.example.com/analytics.js";

    expect(script.type).toBe("text/plain");
    expect(script.getAttribute("src")).toBeNull();
    expect(script.getAttribute("data-consent-src")).toBe("https://cdn.example.com/analytics.js");
    expect(script.getAttribute("data-consent-blocked")).toBe("true");
  });

  it("blocks known tracker urls by rule", () => {
    const script = document.createElement("script");
    script.src = "https://www.googletagmanager.com/gtag/js?id=G-DEMO";

    expect(script.type).toBe("text/plain");
    expect(script.getAttribute("data-consent-category")).toBe("analytics");
  });

  it("releases a blocked script when its category is allowed", () => {
    const script = document.createElement("script");
    script.setAttribute("data-consent-category", "marketing");
    script.src = "https://cdn.example.com/marketing.js";
    document.head.appendChild(script);

    ConsentSDK.updateConsent({ marketing: true });

    const released = document.querySelector<HTMLScriptElement>(
      "script[src='https://cdn.example.com/marketing.js']"
    );
    expect(released).not.toBeNull();
    expect(released?.getAttribute("data-consent-released")).toBe("true");
  });

  it("always allows necessary scripts", () => {
    const script = document.createElement("script");
    script.setAttribute("data-consent-category", "necessary");
    script.src = "https://cdn.example.com/necessary.js";

    expect(script.getAttribute("src")).toBe("https://cdn.example.com/necessary.js");
    expect(script.getAttribute("data-consent-blocked")).toBeNull();
  });

  it("notifies callbacks when consent changes", () => {
    const callback = vi.fn();
    const off = ConsentSDK.onConsentChanged(callback);

    ConsentSDK.updateConsent({ analytics: true });

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ analytics: true }));
    off();
  });

  it("stores consent in a first-party cookie", () => {
    ConsentSDK.acceptAll();

    expect(document.cookie).toContain("simple-consent-sdk=");
    expect(decodeURIComponent(document.cookie)).toContain('"analytics":true');

    ConsentSDK.resetConsent();

    expect(document.cookie).not.toContain("simple-consent-sdk=");
  });

  it("keeps the banner hidden when consent was already saved", () => {
    const manager = new ConsentManager("banner-test-consent");
    manager.acceptAll();

    const banner = new ConsentBanner(manager, {}, defaultConsentList);
    banner.install();

    expect(document.querySelector(".consent-sdk-notice")?.hasAttribute("hidden")).toBe(true);
  });

  it("opens settings from a OneTrust-style settings button", () => {
    const button = document.createElement("button");
    button.className = "ot-sdk-show-settings";
    button.appendChild(document.createTextNode("Cookie settings"));
    document.body.appendChild(button);

    button.firstChild?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(document.querySelector(".consent-sdk-preference-center")?.hasAttribute("hidden")).toBe(false);
  });

  it("keeps banner notice and settings modal as separate surfaces", () => {
    ConsentSDK.showBanner();
    expect(document.querySelector(".consent-sdk-notice")?.hasAttribute("hidden")).toBe(false);
    expect(document.querySelector(".consent-sdk-preference-center")).toBeNull();

    ConsentSDK.showSettings();
    expect(document.querySelector(".consent-sdk-preference-center")?.hasAttribute("hidden")).toBe(false);
  });

  it("exposes and renders the consent list", () => {
    expect(ConsentSDK.getConsentList().map((item) => item.id)).toEqual([
      "necessary",
      "functional",
      "analytics",
      "marketing"
    ]);

    ConsentSDK.showSettings();

    const necessary = document.querySelector<HTMLInputElement>(
      ".consent-sdk-preference-center [data-category='necessary']"
    );
    expect(necessary?.disabled).toBe(true);
    expect(necessary?.checked).toBe(true);
  });

  it("renders a OneTrust-style cookie policy list", () => {
    const policy = document.createElement("div");
    policy.id = "ot-sdk-cookie-policy";
    document.body.appendChild(policy);

    ConsentSDK.renderCookiePolicy();

    expect(policy.querySelector(".consent-sdk-cookie-policy")).not.toBeNull();
    expect(policy.textContent).toContain("Strictly necessary");
    expect(policy.textContent).toContain("simple-consent-sdk");
  });
});
