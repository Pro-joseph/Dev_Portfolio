export type ValidationResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; errors: Record<string, string[]> };

export type Validator = (body: Record<string, unknown>, id?: number) => ValidationResult;

export const ENUMS = {
  projectStatus: ["draft", "published", "archived"],
  linkType: ["github", "demo", "docs", "video", "other"],
  settingType: ["string", "text", "boolean", "json"],
  certType: ["education", "certification"],
};

function missing(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function emailValid(value: unknown): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
}

function urlValid(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const u = new URL(value);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}

export function fieldError(
  field: string,
  rule: "required" | "email" | "url" | "in" | "numeric"
): string {
  switch (rule) {
    case "required":
      return `The ${field.replace(/_/g, " ")} field is required.`;
    case "email":
      return `The ${field.replace(/_/g, " ")} field must be a valid email address.`;
    case "url":
      return `The ${field.replace(/_/g, " ")} field must be a valid URL.`;
    case "in":
      return `The selected ${field.replace(/_/g, " ")} is invalid.`;
    case "numeric":
      return `The ${field.replace(/_/g, " ")} field must be a number.`;
  }
}

export interface FieldRule {
  required?: boolean;
  email?: boolean;
  url?: boolean;
  in?: string[];
  numeric?: boolean;
  max?: number;
}

export function makeValidator(rules: (id?: number) => Record<string, FieldRule>): Validator {
  return (body, id) => {
    const fieldRules = rules(id);
    const errors: Record<string, string[]> = {};

    for (const [field, rule] of Object.entries(fieldRules)) {
      const value = body[field];
      const isMissing = missing(value);

      if (rule.required && isMissing) {
        errors[field] = [fieldError(field, "required")];
        continue;
      }
      if (isMissing) continue;

      if (rule.email && !emailValid(value)) {
        errors[field] = [fieldError(field, "email")];
        continue;
      }
      if (rule.url && !urlValid(value)) {
        errors[field] = [fieldError(field, "url")];
        continue;
      }
      if (rule.in && !rule.in.includes(String(value))) {
        errors[field] = [fieldError(field, "in")];
        continue;
      }
      if (rule.numeric && Number.isNaN(Number(value))) {
        errors[field] = [fieldError(field, "numeric")];
        continue;
      }
      if (rule.max && typeof value === "string" && value.length > rule.max) {
        errors[field] = [
          `The ${field.replace(/_/g, " ")} field must not be greater than ${rule.max} characters.`,
        ];
        continue;
      }
    }

    return Object.keys(errors).length
      ? { ok: false, errors }
      : { ok: true, data: body };
  };
}