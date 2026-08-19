import { ReactNode } from "react";
import { Badge, StatusBadge } from "@/components/admin/ui";
import {
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS,
  CERT_TYPES,
  CERT_TYPE_LABELS,
  SETTING_TYPES,
  SETTING_TYPE_LABELS,
} from "./enums";
import { LOCALES, LOCALE_NAMES } from "./i18n";

const LOCALE_OPTIONS = LOCALES.map((l) => ({ value: l, label: LOCALE_NAMES[l] }));

const localeCell = (r: Record<string, unknown>) => (
  <Badge tone={r.locale === "fr" ? "sky" : "slate"}>
    {String(LOCALE_NAMES[(r.locale as "en" | "fr") ?? "en"] ?? "en")}
  </Badge>
);

const localeField = { name: "locale", label: "Language", type: "select" as const, required: true, options: LOCALE_OPTIONS, cols: "md:col-span-2" };

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "multi"
  | "links"
  | "json";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  optionsKey?: string;
  /** render a visual thumbnail gallery picker instead of text chips */
  picker?: "media";
  placeholder?: string;
  help?: string;
  cols?: string;
}

export interface ColumnDef {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => ReactNode;
}

export interface ResourceConfig {
  key: string;
  title: string;
  singular: string;
  path: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  canCreate?: boolean;
  /** records carry a `locale` column; show the language filter + translate action */
  locales?: boolean;
}

const urlCell = (value: unknown) => {
  if (!value) return <span className="text-ink-400">—</span>;
  return (
    <span className="inline-block max-w-[220px] truncate align-middle text-sky-600">{String(value)}</span>
  );
};

export const RESOURCES: ResourceConfig[] = [
  {
    key: "projects",
    title: "Projects",
    singular: "Project",
    path: "/admin/projects",
    locales: true,
    columns: [
      { key: "title", label: "Project", render: (r) => <span className="font-medium">{String(r.title)}</span> },
      { key: "locale", label: "Lang", render: (r) => localeCell(r) },
      { key: "status", label: "Status", render: (r) => <StatusBadge status={String(r.status)} /> },
      { key: "is_featured", label: "Featured", render: (r) => (r.is_featured ? <Badge tone="sky">Featured</Badge> : <span className="text-ink-400">—</span>) },
      { key: "views_count", label: "Views", render: (r) => <span className="tabular-nums">{Number(r.views_count).toLocaleString()}</span> },
    ],
    fields: [
      localeField,
      { name: "title", label: "Title", type: "text", required: true, cols: "md:col-span-2" },
      { name: "slug", label: "Slug", type: "text", help: "Leave blank to auto-generate from title", cols: "md:col-span-2" },
      { name: "summary", label: "Summary", type: "textarea", cols: "md:col-span-2" },
      { name: "description", label: "Description (markdown)", type: "textarea", cols: "md:col-span-2" },
      { name: "status", label: "Status", type: "select", required: true, options: PROJECT_STATUS.map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] })) },
      { name: "is_featured", label: "Featured", type: "boolean" },
      { name: "client", label: "Client", type: "text" },
      { name: "role_on_project", label: "Role on project", type: "text" },
      { name: "started_on", label: "Started", type: "date" },
      { name: "completed_on", label: "Completed", type: "date" },
      { name: "order_index", label: "Order", type: "number" },
      { name: "views_count", label: "Views", type: "number" },
      { name: "skill_ids", label: "Skills", type: "multi", optionsKey: "skills", cols: "md:col-span-2" },
      { name: "media_ids", label: "Gallery media (first = cover)", type: "multi", optionsKey: "media", picker: "media", cols: "md:col-span-2" },
      { name: "links", label: "Links", type: "links", cols: "md:col-span-2" },
    ],
  },
  {
    key: "skills",
    title: "Skills",
    singular: "Skill",
    path: "/admin/skills",
    columns: [
      { key: "name", label: "Name", render: (r) => <span className="font-medium">{String(r.name)}</span> },
      { key: "skill_category_id", label: "Category ID" },
      { key: "is_visible", label: "Visible", render: (r) => (r.is_visible ? <Badge tone="green">Yes</Badge> : <Badge tone="slate">No</Badge>) },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "skill_category_id", label: "Category", type: "select", optionsKey: "categories" },
      { name: "order_index", label: "Order", type: "number" },
      { name: "is_visible", label: "Visible", type: "boolean" },
    ],
  },
  {
    key: "skill-categories",
    title: "Skill Categories",
    singular: "Skill Category",
    path: "/admin/skill-categories",
    locales: true,
    columns: [
      { key: "name", label: "Name", render: (r) => <span className="font-medium">{String(r.name)}</span> },
      { key: "locale", label: "Lang", render: (r) => localeCell(r) },
      { key: "slug", label: "Slug" },
      { key: "order_index", label: "Order" },
    ],
    fields: [
      localeField,
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", help: "Leave blank to auto-generate" },
      { name: "order_index", label: "Order", type: "number" },
    ],
  },
  {
    key: "resumes",
    title: "Resumes",
    singular: "Resume",
    path: "/admin/resumes",
    columns: [
      { key: "label", label: "Label", render: (r) => <span className="font-medium">{String(r.label)}</span> },
      { key: "language", label: "Language" },
      { key: "is_active", label: "Active", render: (r) => (r.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Inactive</Badge>) },
    ],
    fields: [
      { name: "label", label: "Label", type: "text", required: true },
      { name: "language", label: "Language", type: "text", required: true },
      { name: "media_id", label: "CV file", type: "select", optionsKey: "media", required: true },
      { name: "is_active", label: "Active", type: "boolean", help: "Only one resume can be active" },
    ],
  },
  {
    key: "social-links",
    title: "Social Links",
    singular: "Social Link",
    path: "/admin/social-links",
    columns: [
      { key: "platform", label: "Platform", render: (r) => <span className="font-medium capitalize">{String(r.platform)}</span> },
      { key: "url", label: "URL", render: (r) => urlCell(r.url) },
      { key: "is_visible", label: "Visible", render: (r) => (r.is_visible ? <Badge tone="green">Yes</Badge> : <Badge tone="slate">No</Badge>) },
    ],
    fields: [
      { name: "platform", label: "Platform", type: "text", required: true },
      { name: "url", label: "URL", type: "text", required: true },
      { name: "order_index", label: "Order", type: "number" },
      { name: "is_visible", label: "Visible", type: "boolean" },
    ],
  },
  {
    key: "menu-items",
    title: "Menu Items",
    singular: "Menu Item",
    path: "/admin/menu-items",
    locales: true,
    columns: [
      { key: "label", label: "Label", render: (r) => <span className="font-medium">{String(r.label)}</span> },
      { key: "locale", label: "Lang", render: (r) => localeCell(r) },
      { key: "target", label: "Target", render: (r) => urlCell((r as { external_url?: string; page?: { slug?: string } }).external_url ?? ((r as { page?: { slug?: string } }).page?.slug ? `/${(r as { page: { slug: string } }).page.slug}` : null)) },
      { key: "is_visible", label: "Visible", render: (r) => (r.is_visible ? <Badge tone="green">Yes</Badge> : <Badge tone="slate">No</Badge>) },
    ],
    fields: [
      localeField,
      { name: "label", label: "Label", type: "text", required: true },
      { name: "parent_id", label: "Parent item", type: "select", optionsKey: "menus" },
      { name: "page_id", label: "Internal page", type: "select", optionsKey: "pages" },
      { name: "external_url", label: "External URL", type: "text", cols: "md:col-span-2" },
      { name: "open_in_new_tab", label: "Open in new tab", type: "boolean" },
      { name: "order_index", label: "Order", type: "number" },
      { name: "is_visible", label: "Visible", type: "boolean" },
    ],
  },
  {
    key: "pages",
    title: "Pages",
    singular: "Page",
    path: "/admin/pages",
    locales: true,
    columns: [
      { key: "title", label: "Title", render: (r) => <span className="font-medium">{String(r.title)}</span> },
      { key: "locale", label: "Lang", render: (r) => localeCell(r) },
      { key: "slug", label: "Slug", render: (r) => <span className="font-mono text-sky-600">/{String(r.slug)}</span> },
      { key: "is_published", label: "Published", render: (r) => (r.is_published ? <Badge tone="green">Yes</Badge> : <Badge tone="slate">No</Badge>) },
    ],
    fields: [
      localeField,
      { name: "title", label: "Title", type: "text", required: true, cols: "md:col-span-2" },
      { name: "slug", label: "Slug", type: "text", help: "Leave blank to auto-generate" },
      { name: "content", label: "Content", type: "textarea", help: "Markdown supported", cols: "md:col-span-2" },
      { name: "meta_title", label: "Meta title", type: "text", cols: "md:col-span-2" },
      { name: "meta_description", label: "Meta description", type: "textarea", cols: "md:col-span-2" },
      { name: "is_published", label: "Published", type: "boolean" },
      { name: "order_index", label: "Order", type: "number" },
    ],
  },
  {
    key: "certifications",
    title: "Certifications",
    singular: "Certification",
    path: "/admin/certifications",
    locales: true,
    columns: [
      { key: "type", label: "Type", render: (r) => <Badge tone={r.type === "education" ? "sky" : "green"}>{String(r.type)}</Badge> },
      { key: "title", label: "Title", render: (r) => <span className="font-medium">{String(r.title)}</span> },
      { key: "locale", label: "Lang", render: (r) => localeCell(r) },
      { key: "issuer", label: "Issuer" },
      {
        key: "issued_on",
        label: "Issued",
        render: (r) => (r.issued_on ? String(r.issued_on).slice(0, 10) : <span className="text-slate-400">—</span>),
      },
      { key: "period", label: "Period" },
      {
        key: "description",
        label: "Description",
        render: (r) => (r.description ? <span className="block max-w-[220px] truncate">{String(r.description)}</span> : <span className="text-slate-400">—</span>),
      },
    ],
    fields: [
      { name: "type", label: "Type", type: "select", required: true, options: CERT_TYPES.map((t) => ({ value: t, label: CERT_TYPE_LABELS[t] })) },
      localeField,
      { name: "title", label: "Title", type: "text", required: true, cols: "md:col-span-2" },
      { name: "issuer", label: "Issuer", type: "text" },
      { name: "period", label: "Period (e.g. 2018 - 2021)", type: "text" },
      { name: "issued_on", label: "Issued date", type: "date" },
      { name: "credential_id", label: "Credential ID", type: "text" },
      { name: "verify_url", label: "Verify URL", type: "text", cols: "md:col-span-2" },
      { name: "description", label: "Description", type: "textarea", cols: "md:col-span-2" },
      { name: "order_index", label: "Order", type: "number" },
      { name: "is_visible", label: "Visible", type: "boolean" },
    ],
  },
  {
    key: "testimonials",
    title: "Testimonials",
    singular: "Testimonial",
    path: "/admin/testimonials",
    locales: true,
    columns: [
      { key: "author", label: "Author", render: (r) => <span className="font-medium">{String(r.author)}</span> },
      { key: "locale", label: "Lang", render: (r) => localeCell(r) },
      { key: "role", label: "Role" },
      { key: "is_visible", label: "Visible", render: (r) => (r.is_visible ? <Badge tone="green">Yes</Badge> : <Badge tone="slate">No</Badge>) },
    ],
    fields: [
      localeField,
      { name: "quote", label: "Quote", type: "textarea", required: true, cols: "md:col-span-2" },
      { name: "author", label: "Author", type: "text", required: true },
      { name: "role", label: "Role", type: "text" },
      { name: "avatar_media_id", label: "Avatar", type: "select", optionsKey: "media" },
      { name: "order_index", label: "Order", type: "number" },
      { name: "is_visible", label: "Visible", type: "boolean" },
    ],
  },
  {
    key: "site-settings",
    title: "Site Settings",
    singular: "Setting",
    path: "/admin/site-settings",
    columns: [
      { key: "key", label: "Key", render: (r) => <span className="font-mono font-medium">{String(r.key)}</span> },
      { key: "type", label: "Type", render: (r) => <Badge>{String(r.type)}</Badge> },
      { key: "value", label: "Value", render: (r) => (r.value == null ? <span className="text-ink-400">null</span> : String(r.value).slice(0, 60)) },
    ],
    fields: [
      { name: "key", label: "Key", type: "text", required: true },
      { name: "value", label: "Value", type: "text" },
      { name: "type", label: "Type", type: "select", required: true, options: SETTING_TYPES.map((t) => ({ value: t, label: SETTING_TYPE_LABELS[t] })) },
    ],
  },
];

export function getResourceConfig(key: string): ResourceConfig | undefined {
  return RESOURCES.find((r) => r.key === key);
}
