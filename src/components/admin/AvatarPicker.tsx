"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { http } from "@/lib/api";
import { Paginated } from "@/lib/types";
import { PiSpinnerGap, PiTrash, PiUploadSimple, PiX, PiCamera } from "react-icons/pi";

type Row = Record<string, unknown>;

export default function AvatarPicker({
  avatarUrl,
  initials,
  size = 36,
  direction = "up",
  onChanged,
}: {
  avatarUrl: string | null;
  initials: string;
  size?: number;
  direction?: "up" | "down";
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  const findRow = async (): Promise<Row | undefined> => {
    const list = await http.get<Paginated<Row>>(
      "/admin/site-settings?per_page=50&search=author_avatar",
      { auth: true }
    );
    return list.data.find((r) => r.key === "author_avatar");
  };

  const upsert = async (value: string) => {
    const existing = await findRow();
    const body = { key: "author_avatar", value, type: "string" };
    if (existing) await http.put(`/admin/site-settings/${existing.id}`, body, { auth: true });
    else await http.post("/admin/site-settings", body, { auth: true });
  };

  const upload = async (file: File) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await http.upload<{ data: { url: string } }>("/admin/media", form, {
        auth: true,
      });
      await upsert(res.data.url);
      setOpen(false);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    setBusy(true);
    setError("");
    try {
      const existing = await findRow();
      if (existing) await http.del(`/admin/site-settings/${existing.id}`, { auth: true });
      setOpen(false);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(true)}
        className="relative rounded-full overflow-hidden shrink-0 group"
        style={{ width: size, height: size }}
        title="Change profile photo"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Profile"
            width={size}
            height={size}
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className="w-full h-full bg-ink-900 text-white flex items-center justify-center font-semibold"
            style={{ fontSize: Math.round(size * 0.38) }}
          >
            {initials}
          </span>
        )}
        <span className="absolute inset-0 bg-ink-900/0 group-hover:bg-ink-900/40 transition-colors flex items-center justify-center">
          <PiCamera className="text-white text-[14px] opacity-0 group-hover:opacity-100 transition-opacity" />
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => !busy && setOpen(false)} />
          <div
            className={`absolute z-40 w-64 bg-white rounded-xl border border-ink-200 shadow-xl p-4 ${
              direction === "up" ? "bottom-full left-0 mb-3" : "top-full left-0 mt-3"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold">Profile photo</p>
              <button
                onClick={() => setOpen(false)}
                disabled={busy}
                className="text-ink-400 hover:text-ink-700 transition-colors"
              >
                <PiX size={16} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="w-12 h-12 rounded-full bg-ink-900 text-white flex items-center justify-center font-semibold text-sm">
                  {initials}
                </span>
              )}
              <div>
                <p className="text-[12.5px] font-medium text-ink-700">
                  {avatarUrl ? "Current photo" : "No photo set"}
                </p>
                <p className="text-[11px] text-ink-400">Shown in the admin sidebar</p>
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-[13px] font-medium transition-colors disabled:opacity-50"
            >
              {busy ? <PiSpinnerGap className="animate-spin" size={15} /> : <PiUploadSimple size={15} />}
              {busy ? "Uploading…" : "Upload photo"}
            </button>
            {avatarUrl && (
              <button
                onClick={remove}
                disabled={busy}
                className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-coral/10 hover:bg-coral/20 text-coral text-[13px] font-medium transition-colors disabled:opacity-50"
              >
                <PiTrash size={15} /> Remove photo
              </button>
            )}
            {error && <p className="mt-2 text-[12px] text-coral">{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}