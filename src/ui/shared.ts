import type { ConsentCategoryConfig, ConsentState, ConsentUpdate } from "../types";

const styleId = "consent-sdk-style";

export function injectConsentUiStyle(): void {
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .consent-sdk-notice,
    .consent-sdk-preference-center {
      color: #111827;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      line-height: 1.45;
      z-index: 2147483647;
    }
    .consent-sdk-notice[hidden],
    .consent-sdk-preference-center[hidden] {
      display: none;
    }
    .consent-sdk-notice {
      bottom: 16px;
      left: 16px;
      position: fixed;
      right: 16px;
    }
    .consent-sdk-panel {
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      box-shadow: 0 18px 60px rgba(15, 23, 42, 0.2);
      margin: 0 auto;
      max-width: 760px;
      padding: 20px;
    }
    .consent-sdk-panel h2 {
      font-size: 20px;
      margin: 4px 0 8px;
    }
    .consent-sdk-panel p {
      margin: 0 0 12px;
    }
    .consent-sdk-options {
      display: grid;
      gap: 10px;
      margin: 16px 0;
    }
    .consent-sdk-option {
      align-items: flex-start;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      display: flex;
      gap: 12px;
      padding: 12px;
    }
    .consent-sdk-option input {
      margin-top: 3px;
    }
    .consent-sdk-option strong {
      display: block;
      margin-bottom: 3px;
    }
    .consent-sdk-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
    }
    .consent-sdk-actions button,
    .ot-sdk-show-settings {
      background: #111827;
      border: 1px solid #111827;
      border-radius: 6px;
      color: #ffffff;
      cursor: pointer;
      font: inherit;
      padding: 8px 12px;
    }
    .consent-sdk-actions button:first-child {
      background: #ffffff;
      color: #111827;
    }
    .consent-sdk-preference-center {
      inset: 0;
      position: fixed;
    }
    .consent-sdk-backdrop {
      background: rgba(15, 23, 42, 0.45);
      inset: 0;
      position: absolute;
    }
    .consent-sdk-preference-center .consent-sdk-panel {
      max-height: calc(100vh - 48px);
      overflow: auto;
      position: relative;
      top: 24px;
    }
    .consent-sdk-cookie-policy {
      display: grid;
      gap: 18px;
    }
    .consent-sdk-cookie-category {
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 16px;
    }
    .consent-sdk-cookie-table {
      border-collapse: collapse;
      width: 100%;
    }
    .consent-sdk-cookie-table th,
    .consent-sdk-cookie-table td {
      border: 1px solid #e5e7eb;
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }
    .consent-sdk-cookie-table th {
      background: #f9fafb;
    }
  `;
  document.head.appendChild(style);
}

export function renderConsentOptions(
  consentList: ConsentCategoryConfig[],
  consent: ConsentState,
  showDescriptions: boolean
): string {
  return consentList
    .map(
      (category) => `
        <label class="consent-sdk-option">
          <input
            type="checkbox"
            data-category="${category.id}"
            ${consent[category.id] ? "checked" : ""}
            ${category.required ? "disabled" : ""}
          />
          <span>
            <strong>${category.label}</strong>
            ${showDescriptions ? `<span>${category.description}</span>` : ""}
          </span>
        </label>
      `
    )
    .join("");
}

export function readCategoryInputs(root: ParentNode): ConsentUpdate {
  const update: ConsentUpdate = {};
  root.querySelectorAll<HTMLInputElement>("input[data-category]").forEach((input) => {
    if (input.disabled) {
      return;
    }

    const category = input.dataset.category as keyof ConsentUpdate;
    update[category] = input.checked;
  });

  return update;
}
