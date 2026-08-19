"use client";

import { useEffect, useRef, useState } from "react";
import EasyMDE from "easymde";
import ImageInsertModal from "./ImageInsertModal";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<EasyMDE | null>(null);
  const onChangeRef = useRef(onChange);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

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
        "preview",
        "side-by-side",
        "fullscreen",
      ],
    });
    editorRef.current = editor;

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