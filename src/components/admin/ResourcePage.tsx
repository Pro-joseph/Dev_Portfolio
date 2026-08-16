"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { http, ApiError } from "@/lib/api";
import { getResourceConfig, FieldDef } from "@/lib/admin-config";
import { Paginated } from "@/lib/types";
import {
  Button,
  Modal,
  Toast,
  ConfirmDialog,
  Spinner,
  EmptyState,
} from "@/components/admin/ui";
import { Field } from "@/components/admin/FormFields";
import { PAGE_SIZE_OPTIONS, PAGE_SIZE_ADMIN } from "@/lib/config";
import { DEFAULT_PROJECT_STATUS } from "@/lib/enums";
import { PiMagnifyingGlass, PiPlus, PiPencilSimple, PiTrash } from "react-icons/pi";

type Row = Record<string, unknown>;

const OPTION_ENDPOINTS: Record<string, string> = {
  skills: `/admin/skills?per_page=${PAGE_SIZE_OPTIONS}`,
  categories: `/admin/skill-categories?per_page=${PAGE_SIZE_OPTIONS}`,
  media: `/admin/media?per_page=${PAGE_SIZE_OPTIONS}`,
  pages: `/admin/pages?per_page=${PAGE_SIZE_OPTIONS}`,
  menus: `/admin/menu-items?per_page=${PAGE_SIZE_OPTIONS}`,
};

const OPTION_LABELS: Record<string, string> = {
  skills: "name",
  categories: "name",
  media: "filename",
  pages: "title",
  menus: "label",
};

function initialValue(field: FieldDef, row?: Row): unknown {
  if (!row) {
    if (field.type === "links") return [];
    if (field.type === "multi") return [];
    if (field.type === "boolean") {
      return ["is_visible", "is_published"].includes(field.name) ? true : false;
    }
    if (field.name === "status") return DEFAULT_PROJECT_STATUS;
    return "";
  }

  const raw = row[field.name];

  if (field.name === "skill_ids") {
    return (row.skills as { id: number }[] | undefined)?.map((s) => String(s.id)) ?? [];
  }
  if (field.name === "media_ids") {
    return (row.media as { id: number }[] | undefined)?.map((m) => String(m.id)) ?? [];
  }
  if (field.name === "links") {
    return (row.links as { label: string; url: string; type: string }[] | undefined) ?? [];
  }
  if (field.name === "value" && typeof raw === "object" && raw !== null) {
    return JSON.stringify(raw);
  }
  if (field.name === "content" && typeof raw === "object" && raw !== null) {
    return raw;
  }

  return raw ?? "";
}

export default function ResourcePage({ resourceKey }: { resourceKey: string }) {
  const config = getResourceConfig(resourceKey);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);

  const query = `${config?.path}?per_page=${PAGE_SIZE_ADMIN}&page=${page}${
    debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""
  }`;

  const { data, isLoading, mutate } = useSWR<Paginated<Row>>(
    config ? query : null,
    (key: string) => http.get<Paginated<Row>>(key, { auth: true })
  );

  const neededKeys = useMemo(
    () => [...new Set((config?.fields ?? []).map((f) => f.optionsKey).filter(Boolean) as string[])],
    [config]
  );

  const optionQueries = useMemo(
    () =>
      Object.fromEntries(
        neededKeys.map((k) => [k, OPTION_ENDPOINTS[k]])
      ) as Record<string, string>,
    [neededKeys]
  );

  const optionsData = useSWR(neededKeys.length ? ["options", optionQueries] : null, async () => {
    const result: Record<string, { value: string; label: string }[]> = {};
    for (const key of neededKeys) {
      const res = await http.get<Paginated<Row>>(OPTION_ENDPOINTS[key], { auth: true });
      const labelKey = OPTION_LABELS[key];
      result[key] = res.data.map((r) => ({
        value: String(r.id),
        label: String(r[labelKey] ?? r.id),
      }));
    }
    return result;
  });

  const fieldOptions = (field: FieldDef) =>
    field.optionsKey ? optionsData.data?.[field.optionsKey] ?? [] : field.options ?? [];

  const pushToast = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
  };

  const dismissToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const openCreate = () => {
    const init: Record<string, unknown> = {};
    (config?.fields ?? []).forEach((f) => (init[f.name] = initialValue(f)));
    setValues(init);
    setErrors({});
    setCreating(true);
  };

  const openEdit = (row: Row) => {
    const init: Record<string, unknown> = {};
    (config?.fields ?? []).forEach((f) => (init[f.name] = initialValue(f, row)));
    setValues(init);
    setErrors({});
    setEditing(row);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    (config?.fields ?? []).forEach((f) => {
      if (f.required) {
        const v = values[f.name];
        const empty =
          v == null ||
          v === "" ||
          (Array.isArray(v) && v.length === 0);
        if (empty) errs[f.name] = "This field is required";
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!config || !validate()) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      (config?.fields ?? []).forEach((f) => {
        let v = values[f.name];
        if (f.type === "json" && typeof v === "string") {
          try { v = JSON.parse(v); } catch { /* keep as-is */ }
        }
        if (v === "") v = null;
        const emptyOptional =
          v == null && !f.required && f.type !== "boolean";
        if (!emptyOptional) payload[f.name] = v;
      });

      if (editing) {
        await http.put(`${config.path}/${editing.id}`, payload, { auth: true });
        pushToast(`${config.singular} updated`, "success");
      } else {
        await http.post(config.path, payload, { auth: true });
        pushToast(`${config.singular} created`, "success");
      }
      setCreating(false);
      setEditing(null);
      await mutate();
    } catch (e) {
      if (e instanceof ApiError && e.data && typeof e.data === "object") {
        const fieldErrs = (e.data as { errors?: Record<string, string[]> }).errors;
        if (fieldErrs) {
          const mapped: Record<string, string> = {};
          Object.entries(fieldErrs).forEach(([k, v]) => (mapped[k] = v[0]));
          setErrors(mapped);
        }
      }
      pushToast(e instanceof Error ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!config || !deleting) return;
    try {
      await http.del(`${config.path}/${deleting.id}`, { auth: true });
      pushToast(`${config.singular} deleted`, "success");
      setDeleting(null);
      await mutate();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Delete failed", "error");
    }
  };

  if (!config) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">{config.title}</h1>
          <p className="text-[13px] text-ink-400 mt-0.5">
            {config.canCreate === false ? "Manage records" : "Create, edit, and manage records"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-[220px]">
            <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-[15px]" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                window.setTimeout(() => {
                  setDebouncedSearch(e.target.value);
                  setPage(1);
                }, 300);
              }}
              placeholder={`Search ${config.title.toLowerCase()}…`}
              className="w-full pl-9 pr-3 py-2 bg-ink-50 border border-transparent focus:border-sky-200 focus:bg-white rounded-lg text-[13px] outline-none transition-all placeholder-ink-400"
            />
          </div>
          {config.canCreate !== false && (
            <Button onClick={openCreate}>
              <PiPlus size={15} /> New {config.singular}
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-ink-200 shadow-[0_1px_2px_rgba(15,23,42,.04)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-ink-400 border-b border-ink-100">
              {config.columns.map((col) => (
                <th key={col.key} className="font-medium px-6 py-3">{col.label}</th>
              ))}
              <th className="font-medium px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[13px] divide-y divide-ink-100">
            {isLoading && (
              <tr>
                <td colSpan={config.columns.length + 1}>
                  <div className="flex justify-center py-16 text-ink-400">
                    <Spinner size={22} />
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr>
                <td colSpan={config.columns.length + 1}>
                  <EmptyState message={`No ${config.title.toLowerCase()} found.`} />
                </td>
              </tr>
            )}
            {!isLoading &&
              data?.data.map((row) => (
                <tr key={String(row.id)} className="hover:bg-ink-50/60 transition-colors">
                  {config.columns.map((col) => (
                    <td key={col.key} className="px-6 py-3.5">
                      {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                  <td className="px-6 py-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(row)}
                      className="text-ink-400 hover:text-ink-700 transition-colors mr-2"
                      title="Edit"
                    >
                      <PiPencilSimple size={16} />
                    </button>
                    <button
                      onClick={() => setDeleting(row)}
                      className="text-ink-400 hover:text-coral transition-colors"
                      title="Delete"
                    >
                      <PiTrash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {data && data.last_page > 1 && (
          <div className="px-6 py-4 border-t border-ink-100 flex items-center justify-between text-[13px]">
            <span className="text-ink-400">
              Page {data.current_page} of {data.last_page} · {data.total} total
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={!data.prev_page_url}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={!data.next_page_url}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? `Edit ${config.singular}` : `New ${config.singular}`}
        wide
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Spinner /> : null} {editing ? "Save changes" : "Create"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.fields.map((field) => (
            <Field
              key={field.name}
              field={field}
              value={values[field.name]}
              options={fieldOptions(field)}
              error={errors[field.name]}
              onChange={(v) => {
                setValues((prev) => ({ ...prev, [field.name]: v }));
                setErrors((prev) => {
                  if (!prev[field.name]) return prev;
                  const next = { ...prev };
                  delete next[field.name];
                  return next;
                });
              }}
            />
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        message={`Delete this ${config.singular.toLowerCase()}? This action cannot be undone.`}
        busy={saving}
      />

      <Toast toasts={toasts} dismiss={dismissToast} />
    </div>
  );
}
