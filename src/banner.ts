import type { ConsentManager } from "./consent-manager";
import type { BannerOptions, ConsentCategoryConfig } from "./types";
import { injectConsentUiStyle, readCategoryInputs, renderConsentOptions } from "./ui/shared";

export class ConsentBanner {
  private readonly manager: ConsentManager;
  private readonly options: BannerOptions;
  private readonly consentList: ConsentCategoryConfig[];
  private root: HTMLDivElement | null = null;

  constructor(
    manager: ConsentManager,
    options: BannerOptions = {},
    consentList: ConsentCategoryConfig[]
  ) {
    this.manager = manager;
    this.options = options;
    this.consentList = consentList;
  }

  install(): void {
    injectConsentUiStyle();
    this.render();
    this.hide();

    if (!this.manager.hasSavedConsent()) {
      this.show();
    }
  }

  show(): void {
    this.render();
    this.root?.removeAttribute("hidden");
  }

  hide(): void {
    this.root?.setAttribute("hidden", "");
  }

  private render(): void {
    this.root?.remove();

    const consent = this.manager.getConsent();
    const root = document.createElement("div");
    root.className = "consent-sdk-notice";
    root.setAttribute("hidden", "");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", "Cookie consent notice");
    root.innerHTML = `
      <div class="consent-sdk-panel">
        <div>
          <strong>${this.options.brandName ?? "Cookie Consent"}</strong>
          <h2>${this.options.title ?? "Manage cookie preferences"}</h2>
          <p>${this.options.description ?? "We use optional scripts for functional tools, analytics, and marketing. Choose what can run on this browser."}</p>
        </div>
        <div class="consent-sdk-options">
          ${renderConsentOptions(this.consentList, consent, false)}
        </div>
        <div class="consent-sdk-actions">
          <button type="button" data-action="reject">Reject all</button>
          <button type="button" data-action="save">Save choices</button>
          <button type="button" data-action="accept">Accept all</button>
        </div>
      </div>
    `;

    root.querySelector<HTMLButtonElement>("[data-action='reject']")?.addEventListener("click", () => {
      this.manager.rejectAll();
      this.hide();
    });

    root.querySelector<HTMLButtonElement>("[data-action='accept']")?.addEventListener("click", () => {
      this.manager.acceptAll();
      this.hide();
    });

    root.querySelector<HTMLButtonElement>("[data-action='save']")?.addEventListener("click", () => {
      this.manager.updateConsent(readCategoryInputs(root));
      this.hide();
    });

    document.body.appendChild(root);
    this.root = root;
  }
}
