"use client";

import { FieldDef } from "@/lib/admin-config";
import { PiPlus, PiTrash } from "react-icons/pi";
import { ProjectLinkType } from "@/lib/types";
import { LINK_TYPES } from "@/lib/enums";

interface FieldProps {
  field: FieldDef;
  value: unknown;
  options?: { value: string; label: string }[];
  onChange: (value: unknown) => void;
  error?: string;
}

const inputClass =
  "w-full px-3 py-2 bg-ink-50 border border-transparent focus:border-sky-200 focus:bg-white rounded-lg text-[13px] outline-none transition-all placeholder-ink-400";

function Label({ field }: { field: FieldDef }) {
  return (
    <label className="block text-[12px] font-medium text-ink-600 mb-1.5">
      {field.label}
      {field.required && <span className="text-coral ml-0.5">*</span>}
    </label>
  );
}

function LinksEditor({
  value,
  onChange,
}: {
  value: { label: string; url: string; type: ProjectLinkType }[];
  onChange: (v: unknown) => void;
}) {
  const links = Array.isArray(value) ? value : [];

  const update = (index: number, patch: Partial<(typeof links)[number]>) => {
    const next = links.map((link, i) => (i === index ? { ...link, ...patch } : link));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {links.map((link, index) => (
        <div key={index} className="grid grid-cols-[1fr_1.4fr_auto_auto] gap-2 items-center">
          <input
            className={inputClass}
            placeholder="Label (Live Demo)"
            value={link.label}
            onChange={(e) => update(index, { label: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="https://..."
            value={link.url}
            onChange={(e) => update(index, { url: e.target.value })}
          />
          <select
            className={`${inputClass} w-auto`}
            value={link.type}
            onChange={(e) => update(index, { type: e.target.value as ProjectLinkType })}
          >
            {LINK_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChange(links.filter((_, i) => i !== index))}
            className="text-ink-400 hover:text-coral transition-colors"
          >
            <PiTrash size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...links, { label: "", url: "", type: "other" }])}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-sky-600 hover:text-sky-500"
      >
        <PiPlus size={14} /> Add link
      </button>
    </div>
  );
}

export function Field({ field, value, options = [], onChange, error }: FieldProps) {
  const optWithNone = [{ value: "", label: "— None —" }, ...options];

  const render = () => {
    switch (field.type) {
      case "textarea":
        return (
          <textarea
            className={`${inputClass} min-h-28 font-mono text-[12px]`}
            placeholder={field.placeholder}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case "number":
        return (
          <input
            type="number"
            className={inputClass}
            value={typeof value === "number" || typeof value === "string" ? (value as number | string) : ""}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          />
        );
      case "date":
        return (
          <input
            type="date"
            className={inputClass}
            value={typeof value === "string" ? value.slice(0, 10) : ""}
            onChange={(e) => onChange(e.target.value || null)}
          />
        );
      case "boolean":
        return (
          <div className="flex items-center gap-2 py-1">
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(value)}
              onClick={() => onChange(!value)}
              className={`w-9 h-5 rounded-full transition-colors relative ${value ? "bg-sky-500" : "bg-ink-200"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? "left-[18px]" : "left-0.5"}`} />
            </button>
            <span className="text-[13px] text-ink-500">{value ? "Yes" : "No"}</span>
          </div>
        );
      case "select":
        return (
          <select
            className={`${inputClass} ${field.optionsKey && !field.required ? "" : ""}`}
            value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
            onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
          >
            {field.optionsKey && <option value="">{field.required ? "— Select —" : "— None —"}</option>}
            {field.optionsKey && optWithNone.length > 1 && field.required
              ? optWithNone.slice(1).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))
              : field.optionsKey
                ? optWithNone.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))
                : field.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
          </select>
        );
      case "multi":
        return (
          <div className="flex flex-wrap gap-2">
            {options.map((o) => {
              const selected = Array.isArray(value) && value.map(String).includes(String(o.value));
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    const current = Array.isArray(value) ? value.map(String) : [];
                    onChange(selected ? current.filter((v) => v !== String(o.value)) : [...current, String(o.value)]);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                    selected
                      ? "bg-sky-500 text-white border-sky-500"
                      : "bg-ink-50 text-ink-600 border-ink-200 hover:bg-ink-100"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        );
      case "links":
        return <LinksEditor value={(value as { label: string; url: string; type: ProjectLinkType }[]) ?? []} onChange={onChange} />;
      case "json": {
        let display = "";
        if (value !== null && value !== undefined) {
          display = typeof value === "string" ? value : JSON.stringify(value, null, 2);
        }
        return (
          <textarea
            className={`${inputClass} min-h-40 font-mono text-[12px]`}
            placeholder='[{ "type": "heading", "text": "..." }]'
            value={display}
            onChange={(e) => {
              const raw = e.target.value;
              try {
                onChange(JSON.parse(raw));
              } catch {
                onChange(raw);
              }
            }}
          />
        );
      }
      case "text":
      default:
        return (
          <input
            type="text"
            className={inputClass}
            placeholder={field.placeholder}
            value={typeof value === "string" || typeof value === "number" ? (value as string | number) : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  };

  return (
    <div className={field.cols ?? ""}>
      <Label field={field} />
      {render()}
      {field.help && <p className="text-[11px] text-ink-400 mt-1">{field.help}</p>}
      {error && <p className="text-[11px] text-coral mt-1">{error}</p>}
    </div>
  );
}
