import { categoryFromUrl, isConsentCategory } from "./rules";
import type { ConsentManager } from "./consent-manager";
import type { CategoryRule, ConsentCategory } from "./types";

type BlockableElement = HTMLScriptElement | HTMLIFrameElement | HTMLImageElement;

const blockedSelector = "[data-consent-blocked='true']";

export class AutoBlocker {
  private readonly manager: ConsentManager;
  private readonly rules: CategoryRule[];
  private readonly debug: boolean;
  private observer: MutationObserver | null = null;

  constructor(manager: ConsentManager, rules: CategoryRule[], debug = false) {
    this.manager = manager;
    this.rules = rules;
    this.debug = debug;
  }

  install(): void {
    this.patchSrcProperty(HTMLScriptElement.prototype);
    this.patchSrcProperty(HTMLIFrameElement.prototype);
    this.patchSrcProperty(HTMLImageElement.prototype);
    this.patchSetAttribute();
    this.scan(document);

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => this.scan(node));
      });
    });
    this.observer.observe(document.documentElement, { childList: true, subtree: true });

    this.manager.onConsentChanged(() => this.releaseAllowed());
  }

  releaseAllowed(): void {
    Array.from(document.querySelectorAll<BlockableElement>(blockedSelector)).forEach((element) => {
      const category = this.getElementCategory(element);
      if (!category || !this.manager.hasConsent(category)) {
        return;
      }

      this.release(element);
    });
  }

  private scan(root: Node): void {
    this.log("scan root", describeNode(root));

    if (this.isBlockable(root)) {
      this.blockIfNeeded(root);
    }

    if (root instanceof Element || root instanceof Document) {
      root.querySelectorAll("script, iframe, img").forEach((element) => {
        if (this.isBlockable(element)) {
          this.log("scan found blockable element", describeNode(element));
          this.blockIfNeeded(element);
        }
      });
    }
  }

  private blockIfNeeded(element: BlockableElement): void {
    if (element.getAttribute("data-consent-ignore") !== null) {
      this.log("skip because data-consent-ignore is present", element.tagName.toLowerCase());
      return;
    }

    const src = element.getAttribute("src") ?? element.getAttribute("data-src");
    const category = this.getElementCategory(element, src);

    this.log("resolved block decision", {
      src,
      category,
      hasConsent: category ? this.manager.hasConsent(category) : null
    });

    if (!src || !category || this.manager.hasConsent(category)) {
      return;
    }

    if (element instanceof HTMLScriptElement && element.type) {
      element.setAttribute("data-original-type", element.type);
    }

    element.setAttribute("data-consent-blocked", "true");
    element.setAttribute("data-consent-category", category);
    element.setAttribute("data-consent-src", src);
    element.removeAttribute("src");

    if (element instanceof HTMLScriptElement) {
      element.type = "text/plain";
    }

    this.log(`blocked ${category}: ${src}`);
  }

  private release(element: BlockableElement): void {
    const src = element.getAttribute("data-consent-src");
    if (!src) {
      return;
    }

    if (element instanceof HTMLScriptElement) {
      const script = document.createElement("script");
      copyAttributes(element, script);
      script.type = element.getAttribute("data-original-type") || "text/javascript";
      script.src = src;
      script.setAttribute("data-consent-released", "true");
      element.replaceWith(script);
      this.log(`released script: ${src}`);
      return;
    }

    element.setAttribute("src", src);
    element.removeAttribute("data-consent-blocked");
    element.removeAttribute("data-consent-src");
    this.log(`released resource: ${src}`);
  }

  private getElementCategory(element: Element, src?: string | null): ConsentCategory | null {
    const declared = element.getAttribute("data-consent-category");
    if (isConsentCategory(declared)) {
      return declared;
    }

    if (!src) {
      return null;
    }

    return categoryFromUrl(src, this.rules);
  }

  private patchSrcProperty(prototype: object): void {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "src");
    this.log("patch src property descriptor", {
      prototype: describePrototype(prototype),
      hasDescriptor: descriptor !== undefined,
      hasGetter: typeof descriptor?.get === "function",
      hasSetter: typeof descriptor?.set === "function",
      configurable: descriptor?.configurable
    });

    if (!descriptor?.set || !descriptor.get) {
      return;
    }

    const blocker = this;
    Object.defineProperty(prototype, "src", {
      configurable: true,
      get: descriptor.get,
      set(value: string) {
        descriptor.set?.call(this, value);
        if (blocker.isBlockable(this)) {
          blocker.blockIfNeeded(this);
        }
      }
    });
  }

  private patchSetAttribute(): void {
    const original = Element.prototype.setAttribute;
    const blocker = this;

    Element.prototype.setAttribute = function patchedSetAttribute(name: string, value: string) {
      original.call(this, name, value);
      if (name.toLowerCase() === "src" && blocker.isBlockable(this)) {
        blocker.blockIfNeeded(this);
      }
    };
  }

  private isBlockable(node: unknown): node is BlockableElement {
    return (
      node instanceof HTMLScriptElement ||
      node instanceof HTMLIFrameElement ||
      node instanceof HTMLImageElement
    );
  }

  private log(message: string, data?: unknown): void {
    if (!this.debug) {
      return;
    }

    if (data === undefined) {
      console.info(`[ConsentSDK] ${message}`);
      return;
    }

    console.info(`[ConsentSDK] ${message}`, data);
  }
}

function copyAttributes(from: HTMLScriptElement, to: HTMLScriptElement): void {
  Array.from(from.attributes).forEach((attribute) => {
    if (
      [
        "src",
        "type",
        "data-consent-blocked",
        "data-consent-src",
        "data-original-type"
      ].includes(attribute.name)
    ) {
      return;
    }

    to.setAttribute(attribute.name, attribute.value);
  });
}

function describeNode(node: Node): string {
  if (node instanceof Document) {
    return "document";
  }

  if (node instanceof Element) {
    return node.tagName.toLowerCase();
  }

  return node.nodeName;
}

function describePrototype(prototype: object): string {
  if (prototype === HTMLScriptElement.prototype) {
    return "HTMLScriptElement";
  }

  if (prototype === HTMLIFrameElement.prototype) {
    return "HTMLIFrameElement";
  }

  if (prototype === HTMLImageElement.prototype) {
    return "HTMLImageElement";
  }

  return "unknown";
}
