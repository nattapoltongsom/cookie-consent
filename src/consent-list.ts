import type { ConsentCategoryConfig } from "./types";

export const defaultConsentList: ConsentCategoryConfig[] = [
  {
    id: "necessary",
    label: "Strictly necessary",
    description: "Required for core site features and cannot be disabled.",
    required: true,
    cookies: [
      {
        name: "simple-consent-sdk",
        host: "First party",
        duration: "180 days",
        description: "Stores the visitor's cookie consent choices."
      }
    ]
  },
  {
    id: "functional",
    label: "Functional",
    description: "Remembers choices and enables support or enhanced site features.",
    cookies: [
      {
        name: "demo_functional",
        host: "First party",
        duration: "Session",
        description: "Example functional cookie used by the demo."
      }
    ]
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Helps us understand visits and improve the site experience.",
    cookies: [
      {
        name: "_ga",
        host: "Google Analytics",
        duration: "2 years",
        description: "Distinguishes visitors for analytics reporting."
      },
      {
        name: "_gid",
        host: "Google Analytics",
        duration: "24 hours",
        description: "Stores analytics session information."
      }
    ]
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Allows advertising, retargeting, and campaign measurement.",
    cookies: [
      {
        name: "_fbp",
        host: "Meta Pixel",
        duration: "3 months",
        description: "Supports advertising attribution and retargeting."
      }
    ]
  }
];
