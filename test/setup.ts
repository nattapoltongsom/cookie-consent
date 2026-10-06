import { afterEach } from "vitest";

afterEach(() => {
  document.body.innerHTML = "";
  document.head.querySelectorAll("#consent-sdk-style").forEach((element) => element.remove());
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (name) {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
  });
  globalThis.localStorage?.clear();
});
