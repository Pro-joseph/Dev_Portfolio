"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { http } from "@/lib/api";
import { Paginated } from "@/lib/types";
import { Spinner, Toast, EmptyState } from "@/components/admin/ui";
import { PiUploadSimple, PiCopy, PiTrash, PiCheck, PiFile } from "react-icons/pi";

interface MediaItem {
  id: number;
  filename: string;
  url: string;
  mime_type: string;
  size_kb: number;
  created_at: string;
}

const fmtSize = (kb: number) => {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

export default function MediaPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data, isLoading, mutate } = useSWR<Paginated<MediaItem>>(
    "/admin/media?per_page=100",
    (key: string) => http.get<Paginated<MediaItem>>(key, { auth: true })
  );

  const pushToast = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  const onFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await http.upload<{ data: MediaItem }>("/admin/media", formData, { auth: true });
      pushToast("File uploaded", "success");
      await mutate();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Upload failed", "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const copyUrl = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const remove = async (item: MediaItem) => {
    try {
      await http.del(`/admin/media/${item.id}`, { auth: true });
      pushToast("File deleted", "success");
      await mutate();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Delete failed", "error");
    }
  };

  const isImage = (t: string) => t?.startsWith("image/");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">Media Library</h1>
          <p className="text-[13px] text-ink-400 mt-0.5">Upload and manage images &amp; files</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-dashed border-ink-300 p-8 text-center">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            {uploading ? <Spinner size={22} /> : <PiUploadSimple className="text-[22px]" />}
          </div>
          <div>
            <p className="text-[14px] font-medium">
              {uploading ? (
                "Uploading…"
              ) : (
                <>
                  Drop files here or{" "}
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="text-sky-600 hover:text-sky-700 font-semibold"
                  >
                    browse
                  </button>
                </>
              )}
            </p>
            <p className="text-[12px] text-ink-400 mt-0.5">Images, PDFs, documents · up to 2 GB</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16 text-ink-400">
          <Spinner size={24} />
        </div>
      ) : data?.data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-ink-200">
          <EmptyState message="No media uploaded yet." />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.data.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-ink-200 overflow-hidden group"
            >
              <div className="aspect-video bg-ink-100 flex items-center justify-center relative overflow-hidden">
                {isImage(item.mime_type) ? (
                  <Image src={item.url} alt={item.filename} width={640} height={360} sizes="(max-width: 768px) 50vw, 25vw" className="w-full h-full object-cover" />
                ) : (
                  <PiFile className="text-[34px] text-ink-300" />
                )}
              </div>
              <div className="p-3.5">
                <p className="text-[13px] font-medium truncate" title={item.filename}>
                  {item.filename}
                </p>
                <p className="text-[11.5px] text-ink-400 mt-0.5">{fmtSize(item.size_kb)}</p>
                <div className="flex gap-1.5 mt-3">
                  <button
                    onClick={() => copyUrl(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-ink-100 text-ink-600 hover:bg-ink-200 text-[12px] font-medium transition-colors"
                  >
                    {copiedId === item.id ? (
                      <>
                        <PiCheck size={14} className="text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <PiCopy size={14} /> Copy URL
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => remove(item)}
                    className="px-2.5 py-1.5 rounded-lg bg-coral/10 text-coral hover:bg-coral/20 text-[12px] transition-colors"
                    title="Delete"
                  >
                    <PiTrash size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Toast
        toasts={toasts}
        dismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
      />
    </div>
  );
}
