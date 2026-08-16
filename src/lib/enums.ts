export const PROJECT_STATUS = ["draft", "published", "archived"] as const;
export type ProjectStatusValue = (typeof PROJECT_STATUS)[number];

export const LINK_TYPES = ["github", "demo", "docs", "video", "other"] as const;
export type LinkTypeValue = (typeof LINK_TYPES)[number];

export const SETTING_TYPES = ["string", "text", "boolean", "json"] as const;
export type SettingTypeValue = (typeof SETTING_TYPES)[number];

export const CERT_TYPES = ["education", "certification"] as const;
export type CertTypeValue = (typeof CERT_TYPES)[number];

export const USER_ROLES = ["admin", "editor"] as const;
export type UserRoleValue = (typeof USER_ROLES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatusValue, string> = {
  draft: "Draft",
  published: "Live",
  archived: "Archived",
};

export const CERT_TYPE_LABELS: Record<CertTypeValue, string> = {
  education: "Education",
  certification: "Certification",
};

export const SETTING_TYPE_LABELS: Record<SettingTypeValue, string> = {
  string: "String",
  text: "Text",
  boolean: "Boolean",
  json: "JSON",
};

export const PROJECT_MORPH = "App\\Models\\Project";

export const DEFAULT_PROJECT_STATUS: ProjectStatusValue = "published";