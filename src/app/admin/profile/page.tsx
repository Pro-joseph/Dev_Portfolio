"use client";

import { useState } from "react";
import useSWR from "swr";
import { http, ApiError } from "@/lib/api";
import { User } from "@/lib/types";
import { getSiteSettings } from "@/lib/site-settings";
import AvatarPicker from "@/components/admin/AvatarPicker";
import { Button, Spinner } from "@/components/admin/ui";
import { PiPassword, PiCheckCircle } from "react-icons/pi";

const MIN_PASSWORD = 8;

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-ink-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 text-[14px] outline-none transition-all";

export default function ProfilePage() {
  const { data: site, mutate: mutateSite } = useSWR<{ settings: Record<string, unknown> }>(
    "/site",
    (key: string) => http.get<{ settings: Record<string, unknown> }>(key)
  );
  const { data: me } = useSWR<User>("/auth/me", (key: string) =>
    http.get<{ data: User }>(key, { auth: true }).then((r) => r.data)
  );

  const siteSettings = getSiteSettings({ settings: site?.settings ?? {} });
  const initials = siteSettings.author_name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    setSuccess(false);
    const errs: Record<string, string> = {};
    if (!current) errs.current_password = "This field is required";
    if (!next) errs.new_password = "This field is required";
    else if (next.length < MIN_PASSWORD) errs.new_password = `At least ${MIN_PASSWORD} characters`;
    if (!confirm) errs.new_password_confirmation = "This field is required";
    else if (next && confirm !== next) errs.new_password_confirmation = "Passwords do not match";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await http.post("/auth/change-password", { current_password: current, new_password: next, new_password_confirmation: confirm }, { auth: true });
      setCurrent("");
      setNext("");
      setConfirm("");
      setSuccess(true);
    } catch (e) {
      if (e instanceof ApiError && e.data && typeof e.data === "object") {
        const fieldErrs = (e.data as { errors?: Record<string, string[]> }).errors;
        if (fieldErrs) {
          const mapped: Record<string, string> = {};
          Object.entries(fieldErrs).forEach(([k, v]) => (mapped[k] = v[0]));
          setErrors(mapped);
        }
      } else {
        setErrors({ _: e instanceof Error ? e.message : "Password change failed" });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight">Profile</h1>
        <p className="text-[13px] text-ink-400 mt-0.5">Manage your photo and account password</p>
      </div>

      <div className="bg-white rounded-2xl border border-ink-200 p-6">
        <h3 className="font-semibold tracking-tight">Profile photo</h3>
        <p className="text-[12px] text-ink-400 mt-0.5 mb-5">Shown in the admin sidebar and top bar</p>
        <div className="flex items-center gap-4">
          <AvatarPicker
            avatarUrl={siteSettings.author_avatar}
            initials={initials}
            size={64}
            direction="down"
            onChanged={() => mutateSite()}
          />
          <div>
            <p className="text-[14px] font-medium text-ink-800">{me?.name ?? siteSettings.author_name}</p>
            <p className="text-[13px] text-ink-400">{me?.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-ink-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <PiPassword className="text-[18px] text-ink-400" />
          <h3 className="font-semibold tracking-tight">Change password</h3>
        </div>
        <p className="text-[12px] text-ink-400 mt-0.5 mb-5">
          Use at least {MIN_PASSWORD} characters. Existing sessions stay signed in.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-[12.5px] font-medium text-ink-600 block mb-1.5">Current password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className={inputClass}
            />
            {errors.current_password && (
              <p className="mt-1 text-[12px] text-coral">{errors.current_password}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[12.5px] font-medium text-ink-600 block mb-1.5">New password</label>
              <input
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                className={inputClass}
              />
              {errors.new_password && (
                <p className="mt-1 text-[12px] text-coral">{errors.new_password}</p>
              )}
            </div>
            <div>
              <label className="text-[12.5px] font-medium text-ink-600 block mb-1.5">Confirm new password</label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
              />
              {errors.new_password_confirmation && (
                <p className="mt-1 text-[12px] text-coral">{errors.new_password_confirmation}</p>
              )}
            </div>
          </div>
          {errors._ && <p className="text-[12px] text-coral">{errors._}</p>}
          {success && (
            <p className="flex items-center gap-2 text-[12.5px] font-medium text-emerald-600">
              <PiCheckCircle size={16} /> Password updated successfully.
            </p>
          )}
          <div className="flex justify-end">
            <Button onClick={submit} disabled={busy}>
              {busy ? <Spinner /> : null} Update password
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}