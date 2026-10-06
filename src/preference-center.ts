import type { ConsentManager } from "./consent-manager";
import type { BannerOptions, ConsentCategoryConfig } from "./types";
import { injectConsentUiStyle, readCategoryInputs, renderConsentOptions } from "./ui/shared";

export class PreferenceCenter {
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
    root.className = "consent-sdk-preference-center";
    root.setAttribute("hidden", "");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", "Cookie settings");
    root.innerHTML = `
      <div class="consent-sdk-backdrop" data-action="close"></div>
      <div class="consent-sdk-panel">
        <div>
          <strong>${this.options.brandName ?? "Cookie Consent"}</strong>
          <h2>Cookie settings</h2>
          <p>${this.options.description ?? "Choose which optional scripts can run on this browser."}</p>
        </div>
        <div class="consent-sdk-options">
          ${renderConsentOptions(this.consentList, consent, true)}
        </div>
        <div class="consent-sdk-actions">
          <button type="button" data-action="reject">Reject all</button>
          <button type="button" data-action="save">Save choices</button>
          <button type="button" data-action="accept">Accept all</button>
          <button type="button" data-action="close">Close</button>
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

    root.querySelectorAll<HTMLElement>("[data-action='close']").forEach((element) => {
      element.addEventListener("click", () => this.hide());
    });

    document.body.appendChild(root);
    this.root = root;
  }
}
