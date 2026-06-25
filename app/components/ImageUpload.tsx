"use client";

import { useRef, useState } from "react";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = "Cover Image" }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"url" | "file">(value?.startsWith("data:") ? "file" : "url");
  const [fileName, setFileName] = useState("");

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => { setMode("url"); setFileName(""); }}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${mode === "url" ? "bg-primary text-white border-primary" : "bg-background text-secondary border-border hover:border-primary"}`}
        >
          URL
        </button>
        <button
          type="button"
          onClick={() => { setMode("file"); onChange(""); setFileName(""); }}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${mode === "file" ? "bg-primary text-white border-primary" : "bg-background text-secondary border-border hover:border-primary"}`}
        >
          Upload File
        </button>
      </div>

      {mode === "url" ? (
        <input
          type="url"
          value={value || ""}
          onChange={(e) => onChange(e.target.value || "")}
          className="input"
          placeholder="https://example.com/cover.jpg"
        />
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-outline w-full"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {fileName || "Choose an image file"}
          </button>
          {fileName && (
            <p className="text-xs text-secondary mt-1">{fileName}</p>
          )}
        </div>
      )}

      {value && (
        <div className="mt-3 rounded-lg overflow-hidden border border-border max-h-48">
          <img src={value} alt="Preview" className="w-full h-48 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}
    </div>
  );
}
