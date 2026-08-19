"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { http } from "@/lib/api";
import { ALLOWED_MEDIA } from "@/lib/config";
import { Paginated } from "@/lib/types";
import { Spinner, EmptyState } from "@/components/admin/ui";
import { PiUploadSimple, PiX } from "react-icons/pi";

interface MediaItem {
  id: number;
  filename: string;
  url: string;
  mime_type: string;
  size_kb: number;
}

interface Props {
  onInsert: (url: string, name?: string) => void;
  onClose: () => void;
}

export default function ImageInsertModal({ onInsert, onClose }: Props) {
  const [tab, setTab] = useState<"upload" | "library">("upload");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useSWR<Paginated<MediaItem>>(
    "/admin/media?per_page=100",
    (key: string) => http.get<Paginated<MediaItem>>(key, { auth: true })
  );

  const insert = (url: string, name?: string) => {
    onInsert(url, name);
  };

  const upload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await http.upload<{ data: MediaItem }>("/admin/media", formData, { auth: true });
      insert(res.data.url, res.data.filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setUploading(false);
    }
  };

  const isImage = (t: string) => t?.startsWith("image/");

  const tabClass = (active: boolean) =>
    `flex-1 py-2 text-[13px] font-semibold rounded-lg transition-colors ${
      active ? "bg-sky-50 text-sky-700" : "text-ink-500 hover:text-ink-700"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
          <h3 className="text-[15px] font-semibold">Insert image</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Close"
          >
            <PiX size={18} />
          </button>
        </div>

        <div className="px-5 py-3 flex gap-1 bg-ink-50 border-b border-ink-200">
          <button type="button" className={tabClass(tab === "upload")} onClick={() => setTab("upload")}>
            Upload new
          </button>
          <button type="button" className={tabClass(tab === "library")} onClick={() => setTab("library")}>
            From library
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {tab === "upload" ? (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) upload(file);
              }}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                dragging ? "border-sky-400 bg-sky-50/50" : "border-ink-300"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={ALLOWED_MEDIA.join(",")}
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                  {uploading ? <Spinner size={20} /> : <PiUploadSimple className="text-[20px]" />}
                </div>
                <p className="text-[13px] font-medium">
                  {uploading ? "Uploading…" : "Drop a file here or click to browse"}
                </p>
              </div>
              {error && <p className="text-coral text-[12px] mt-2">{error}</p>}
            </div>
          ) : (
            <div>
              {isLoading ? (
                <div className="flex justify-center py-12 text-ink-400">
                  <Spinner size={24} />
                </div>
              ) : data?.data.length === 0 ? (
                <div className="rounded-xl border border-ink-200">
                  <EmptyState message="No media uploaded yet." />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {data?.data.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => insert(item.url, item.filename)}
                      className="group rounded-xl border border-ink-200 overflow-hidden text-left hover:border-sky-300 hover:shadow-md transition-all"
                      title={`Insert ${item.filename}`}
                    >
                      <div className="aspect-video bg-ink-100 relative overflow-hidden">
                        {isImage(item.mime_type) ? (
                          <Image
                            src={item.url}
                            alt={item.filename}
                            width={640}
                            height={360}
                            sizes="(max-width: 768px) 50vw, 33vw"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-[11px] text-ink-400">
                            {item.mime_type}
                          </span>
                        )}
                      </div>
                      <p className="px-2.5 py-1.5 text-[11.5px] text-ink-500 font-medium truncate">
                        {item.filename}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}