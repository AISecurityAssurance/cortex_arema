"use client";
import React from "react";

interface ImageUploadProps {
  image: File | null;
  onChange: (file: File | null) => void;
  preview: string | null;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  image,
  onChange,
  preview,
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium">
      Image Upload <span className="text-red-500">*</span>
    </label>
    <input
      type="file"
      accept="image/*"
      onChange={(e) => onChange(e.target.files?.[0] || null)}
      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-gray-100 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
    />
    {preview && (
      <div className="relative max-w-lg w-full">
        <img
          src={preview}
          alt="preview"
          className="rounded-lg border w-full h-auto"
        />
        <button
          onClick={() => onChange(null)}
          className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 rounded bg-opacity-60"
        >
          Remove
        </button>
      </div>
    )}
  </div>
);
