"use client";

import { FieldDef } from "@/lib/admin-config";
import Image from "next/image";
import { PiPlus, PiTrash, PiArrowUp, PiArrowDown, PiX } from "react-icons/pi";
import { ProjectLinkType } from "@/lib/types";
import { LINK_TYPES } from "@/lib/enums";

export type Option = { value: string; label: string; url?: string };

interface FieldProps {
  field: FieldDef;
  value: unknown;
  options?: Option[];
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

function MediaPicker({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const selected = Array.isArray(value) ? value.map(String) : [];

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((v) => v !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= selected.length) return;
    const next = [...selected];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const selectedOptions = selected
    .map((id) => options.find((o) => o.value === id))
    .filter((o): o is Option => Boolean(o));

  const thumb = (o: Option) =>
    o.url ? (
      <Image src={o.url} alt={o.label} fill sizes="160px" className="object-cover" />
    ) : (
      <span className="w-full h-full bg-ink-50 flex items-center justify-center text-[10px] text-ink-400 px-1 text-center">
        {o.label}
      </span>
    );

  return (
    <div className="flex flex-col gap-3">
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((o, i) => (
            <div key={o.value} className="w-24">
              <div className="relative aspect-video rounded-lg overflow-hidden ring-1 ring-ink-200">
                {thumb(o)}
                <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  {i === 0 ? "COVER" : i + 1}
                </span>
              </div>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label="Move earlier"
                  className="p-1 rounded text-ink-500 hover:bg-ink-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <PiArrowUp />
                </button>
                <button
                  type="button"
                  disabled={i === selected.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Move later"
                  className="p-1 rounded text-ink-500 hover:bg-ink-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <PiArrowDown />
                </button>
                <button
                  type="button"
                  onClick={() => toggle(o.value)}
                  aria-label="Remove"
                  className="p-1 rounded text-coral hover:bg-coral/10"
                >
                  <PiX />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {options.length === 0 ? (
        <p className="text-[11px] text-ink-400">No media yet — upload images in the Media section first.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {options.map((o) => {
            const isSel = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                title={o.label}
                className={`relative aspect-video rounded-lg overflow-hidden ring-2 transition-all ${
                  isSel ? "ring-sky-500" : "ring-ink-200 hover:ring-ink-400"
                }`}
              >
                {thumb(o)}
                {isSel && (
                  <>
                    <span className="absolute inset-0 bg-sky-500/20" />
                    <span className="absolute top-1 left-1 bg-sky-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {selected.indexOf(o.value) + 1}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}
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
        return field.picker === "media" ? (
          <MediaPicker options={options} value={value} onChange={onChange} />
        ) : (
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
