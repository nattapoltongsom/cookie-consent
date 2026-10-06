import type { ConsentCategoryConfig } from "./types";
import { injectConsentUiStyle } from "./ui/shared";

export class CookiePolicy {
  private readonly consentList: ConsentCategoryConfig[];

  constructor(consentList: ConsentCategoryConfig[]) {
    this.consentList = consentList;
  }

  install(): void {
    this.render("#ot-sdk-cookie-policy");
  }

  render(target: string | HTMLElement = "#ot-sdk-cookie-policy"): void {
    const element = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
    if (!element) {
      return;
    }

    injectConsentUiStyle();
    element.innerHTML = `
      <div class="consent-sdk-cookie-policy">
        ${this.consentList
          .map(
            (category) => `
              <section class="consent-sdk-cookie-category">
                <h3>${category.label}</h3>
                <p>${category.description}</p>
                ${renderCookieTable(category)}
              </section>
            `
          )
          .join("")}
      </div>
    `;
  }
}

function renderCookieTable(category: ConsentCategoryConfig): string {
  const cookies = category.cookies ?? [];
  if (cookies.length === 0) {
    return `<p class="consent-sdk-cookie-empty">No cookies listed for this category.</p>`;
  }

  return `
    <table class="consent-sdk-cookie-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Host</th>
          <th>Duration</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${cookies
          .map(
            (cookie) => `
              <tr>
                <td>${cookie.name}</td>
                <td>${cookie.host}</td>
                <td>${cookie.duration}</td>
                <td>${cookie.description}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}
