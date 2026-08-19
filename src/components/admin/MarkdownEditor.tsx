"use client";

import { useEffect, useRef, useState } from "react";
import EasyMDE from "easymde";
import ImageInsertModal from "./ImageInsertModal";

const DEFAULT_FONT_SIZE = 15;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 22;
const FONT_SIZE_KEY = "emde-font-size";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<EasyMDE | null>(null);
  const onChangeRef = useRef(onChange);
  const sizeRef = useRef(DEFAULT_FONT_SIZE);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const applySize = (editor: EasyMDE, size: number) => {
    editor.codemirror.getWrapperElement().style.fontSize = `${size}px`;
  };

  const changeSize = (editor: EasyMDE, delta: number) => {
    const next = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, sizeRef.current + delta));
    if (next === sizeRef.current) return;
    sizeRef.current = next;
    applySize(editor, next);
    try {
      localStorage.setItem(FONT_SIZE_KEY, String(next));
    } catch {
      /* storage unavailable */
    }
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const editor = new EasyMDE({
      element: el,
      initialValue: value,
      placeholder,
      spellChecker: false,
      nativeSpellcheck: false,
      minHeight: "260px",
      maxHeight: "520px",
      promptURLs: false,
      status: false,
      autoDownloadFontAwesome: false,
      previewClass: ["editor-preview", "md-preview"],
      toolbar: [
        "bold",
        "italic",
        "heading",
        "|",
        "unordered-list",
        "ordered-list",
        "check-list",
        "|",
        "link",
        {
          name: "image",
          action: () => setShowImageModal(true),
          className: "fa fa-picture-o",
          title: "Insert image",
          noMobile: true,
        },
        "|",
        {
          name: "font-decrease",
          title: "Decrease text size",
          className: "size-btn",
          icon: "<i aria-hidden='true'>A−</i>",
          action: (ed) => changeSize(ed, -1),
        },
        {
          name: "font-increase",
          title: "Increase text size",
          className: "size-btn",
          icon: "<i aria-hidden='true'>A+</i>",
          action: (ed) => changeSize(ed, 1),
        },
        "|",
        "preview",
        "side-by-side",
        "fullscreen",
      ],
    });
    editorRef.current = editor;

    try {
      const stored = Number(localStorage.getItem(FONT_SIZE_KEY));
      if (Number.isFinite(stored) && stored >= MIN_FONT_SIZE && stored <= MAX_FONT_SIZE) {
        sizeRef.current = stored;
      }
    } catch {
      /* storage unavailable */
    }
    applySize(editor, sizeRef.current);

    const cm = editor.codemirror;
    cm.on("change", () => onChangeRef.current(editor.value()));

    return () => {
      editor.toTextArea();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && value !== editor.value()) {
      editor.value(value);
    }
  }, [value]);

  const insert = (url: string, name?: string) => {
    const editor = editorRef.current;
    const cleanName = name?.replace(/\.[^.]+$/, "") ?? "image";
    const markdown = `![${cleanName}](${url})`;
    if (editor) {
      editor.codemirror.replaceSelection(markdown);
      editor.codemirror.focus();
    } else {
      onChange(markdown);
    }
    setShowImageModal(false);
  };

  return (
    <>
      <textarea ref={textareaRef} className="hidden" aria-label="Markdown editor" />
      {showImageModal && <ImageInsertModal onInsert={insert} onClose={() => setShowImageModal(false)} />}
    </>
  );
}