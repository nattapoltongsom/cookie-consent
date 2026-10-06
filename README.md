# Cookie Consent AutoBlock SDK

Small OneTrust-like cookie consent SDK with automatic script, iframe, and image blocking.

## Usage

Place the SDK before third-party scripts:

```html
<script
  src="/dist/consent-sdk.umd.js"
  data-consent-auto
  data-auto-block="true"
  data-banner="true"
  data-debug="true"
></script>
```

Declare categories manually:

```html
<script src="/scripts/chat.js" data-consent-category="functional"></script>
<script src="/scripts/analytics.js" data-consent-category="analytics"></script>
<script src="/scripts/ads.js" data-consent-category="marketing"></script>
```

The SDK also includes default URL rules for common vendors such as Google Analytics, GTM, Meta Pixel, Hotjar, Clarity, Intercom, and Zendesk.

## Demo

```bash
npm run build
npm run dev
```

Open:

```text
http://127.0.0.1:5173/demo/
```

## API

```js
ConsentSDK.init(options);
ConsentSDK.getConsent();
ConsentSDK.getConsentList();
ConsentSDK.hasConsent("analytics");
ConsentSDK.acceptAll();
ConsentSDK.rejectAll();
ConsentSDK.updateConsent({ analytics: true });
ConsentSDK.resetConsent();
ConsentSDK.showBanner();
ConsentSDK.showSettings();
ConsentSDK.renderCookiePolicy();
ConsentSDK.onConsentChanged((consent) => console.log(consent));
```

## Development

```bash
npm install
npm test
npm run build
```
