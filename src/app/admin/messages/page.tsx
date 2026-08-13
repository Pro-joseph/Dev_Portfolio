"use client";

import { useState } from "react";
import useSWR from "swr";
import { http } from "@/lib/api";
import { Paginated } from "@/lib/types";
import { Badge, Button, Modal, Spinner, Toast, EmptyState } from "@/components/admin/ui";
import { PiEnvelope, PiEnvelopeOpen, PiTrash, PiWarning } from "react-icons/pi";

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [selected, setSelected] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState<Message | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);

  const { data, isLoading, mutate } = useSWR<Paginated<Message>>(
    "/admin/contact-messages?per_page=50",
    (key: string) => http.get<Paginated<Message>>(key, { auth: true })
  );

  const pushToast = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  const messages = data?.data ?? [];
  const visible =
    filter === "unread" ? messages.filter((m) => !m.is_read) : messages;

  const open = async (m: Message) => {
    setSelected(m);
    if (!m.is_read) {
      try {
        await http.patch(`/admin/contact-messages/${m.id}/read`, undefined, { auth: true });
        await mutate();
      } catch {
        /* ignore */
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await http.del(`/admin/contact-messages/${deleting.id}`, { auth: true });
      pushToast("Message deleted", "success");
      setDeleting(null);
      if (selected?.id === deleting.id) setSelected(null);
      await mutate();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Delete failed", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">Contact Messages</h1>
          <p className="text-[13px] text-ink-400 mt-0.5">
            {messages.filter((m) => !m.is_read).length} unread
          </p>
        </div>
        <div className="flex gap-1 bg-ink-100 rounded-lg p-1">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-[12.5px] font-medium capitalize transition-colors ${
                filter === f ? "bg-white shadow-sm text-ink-900" : "text-ink-500 hover:text-ink-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-ink-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16 text-ink-400">
            <Spinner size={24} />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState message="No messages here." />
        ) : (
          <div className="divide-y divide-ink-100">
            {visible.map((m) => (
              <button
                key={m.id}
                onClick={() => open(m)}
                className={`w-full text-left px-6 py-4 flex items-start gap-4 transition-colors hover:bg-ink-50/70 ${
                  !m.is_read ? "bg-sky-50/50" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                    m.is_read ? "bg-ink-100 text-ink-500" : "bg-sky-500 text-white"
                  }`}
                >
                  {m.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-medium truncate">{m.name}</p>
                    {!m.is_read && <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />}
                    <span className="ml-auto text-[12px] text-ink-400 shrink-0">
                      {new Date(m.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-[13px] text-ink-600 font-medium truncate mt-0.5">{m.subject}</p>
                  <p className="text-[13px] text-ink-400 truncate mt-0.5">{m.message}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal open={selected !== null} onClose={() => setSelected(null)} title={selected?.subject ?? "Message"}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-ink-100 flex items-center justify-center text-sm font-semibold text-ink-500">
                {selected.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <p className="text-[14px] font-medium">{selected.name}</p>
                <a href={`mailto:${selected.email}`} className="text-[12.5px] text-sky-600 hover:underline">
                  {selected.email}
                </a>
              </div>
              <Badge tone={selected.is_read ? "slate" : "sky"}>
                {selected.is_read ? <PiEnvelopeOpen size={13} /> : <PiEnvelope size={13} />}
                {selected.is_read ? "Read" : "Unread"}
              </Badge>
            </div>
            <div className="bg-ink-50 rounded-xl px-4 py-3.5 text-[14px] leading-relaxed text-ink-700 whitespace-pre-wrap">
              {selected.message}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-ink-400">
                Received{" "}
                {new Date(selected.created_at).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
              <Button variant="danger" onClick={() => { setDeleting(selected); setSelected(null); }}>
                <PiTrash size={14} /> Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete message"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>
              <PiWarning size={14} /> Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          Delete this message from {deleting?.name}? This action cannot be undone.
        </p>
      </Modal>

      <Toast toasts={toasts} dismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
