"use client";

import { ReactNode, useEffect } from "react";
import { PiX, PiCheck, PiWarning, PiSpinnerGap } from "react-icons/pi";

export function Spinner({ className = "", size }: { className?: string; size?: number }) {
  return (
    <PiSpinnerGap
      className={`animate-spin ${className}`}
      style={size ? { width: size, height: size } : undefined}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const styles: Record<string, string> = {
    primary: "bg-sky-500 hover:bg-sky-400 text-white",
    secondary: "bg-ink-100 hover:bg-ink-200 border border-ink-200 text-ink-700",
    danger: "bg-coral/10 hover:bg-coral/20 text-coral border border-coral/20",
    ghost: "text-ink-500 hover:bg-ink-50 hover:text-ink-900",
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg text-[13px] font-medium transition-colors px-3.5 py-2 ${styles[variant]} disabled:opacity-50 disabled:pointer-events-none ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "green" | "amber" | "sky" | "coral";
}) {
  const tones: Record<string, string> = {
    slate: "text-ink-500 bg-ink-100",
    green: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    sky: "text-sky-600 bg-sky-50",
    coral: "text-coral bg-coral/10",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, "green" | "amber" | "slate"> = {
    published: "green",
    active: "green",
    draft: "amber",
    archived: "slate",
  };
  return <Badge tone={tone[status] ?? "slate"}>{status}</Badge>;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/40 backdrop-blur-sm p-6">
      <div
        className={`relative bg-white rounded-2xl shadow-xl w-full ${wide ? "max-w-3xl" : "max-w-xl"} my-8`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <h3 className="text-[15px] font-semibold">{title}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 transition-colors">
            <PiX size={20} />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-ink-100">{footer}</div>
        )}
      </div>
    </div>
  );
}

export function Toast({
  toasts,
  dismiss,
}: {
  toasts: { id: number; message: string; type: "success" | "error" }[];
  dismiss: (id: number) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[60] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
            t.type === "success" ? "bg-emerald-600" : "bg-coral"
          }`}
        >
          {t.type === "success" ? <PiCheck size={16} /> : <PiWarning size={16} />}
          <span>{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="ml-2 opacity-70 hover:opacity-100">
            <PiX size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-sm text-ink-400">{message}</p>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  message,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  busy?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirm action"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? <Spinner /> : null} Delete
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-600">{message}</p>
    </Modal>
  );
}
