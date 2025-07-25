import { Button } from "@/components/ui/button";

type Props = {
  prompt: string;
  onPromptChange: (val: string) => void;
  onImageChange: (file: File | null) => void;
  onSubmit: () => void;
  loading: boolean;
  error?: string;
  imagePreview: string | null;
  onClearImage: () => void;
};

export function PromptForm({
  prompt,
  onPromptChange,
  onImageChange,
  onSubmit,
  loading,
  error,
  imagePreview,
  onClearImage,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">
          Text Prompt <span className="text-red-500">*</span>
        </label>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe the contents of the image or ask a question."
          className="w-full h-28 border rounded-md p-3 text-sm dark:bg-zinc-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Image Upload <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onImageChange(e.target.files?.[0] || null)}
          className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
      </div>

      {imagePreview && (
        <div className="flex justify-start">
          <div className="relative w-full max-w-xs">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-auto rounded-lg border"
            />
            <button
              onClick={onClearImage}
              className="absolute top-2 right-2 text-sm bg-black bg-opacity-60 text-white px-2 py-1 rounded"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-600 text-center font-medium mt-2">{error}</div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="w-full sm:w-40"
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-40"
          onClick={() => {
            onPromptChange("");
            onImageChange(null);
            onClearImage();
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
