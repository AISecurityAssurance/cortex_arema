"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import ModelResponseCard from "@/components/ModelResponseCard";

const MODELS = ["AWS Bedrock Claude 4 Opus", "AWS Bedrock Claude 4 Sonnet"];
const MODEL_MAP: Record<string, string> = {
  "AWS Bedrock Claude 4 Opus": "us.anthropic.claude-opus-4-20250514-v1:0",
  "AWS Bedrock Claude 4 Sonnet": "us.anthropic.claude-sonnet-4-20250514-v1:0",
};

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [modelA, setModelA] = useState(MODELS[0]);
  const [modelB, setModelB] = useState(MODELS[1]);

  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<"A" | "B" | "tie" | null>(null);
  const [responseA, setResponseA] = useState("");
  const [responseB, setResponseB] = useState("");

  useEffect(() => {
    if (image) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(image);
    } else {
      setImagePreview(null);
    }
  }, [image]);

  const handleModelAChange = (newModel: string) => {
    setModelA(newModel);
    if (newModel === modelB) {
      const fallback = MODELS.find((m) => m !== newModel);
      if (fallback) setModelB(fallback);
    }
  };

  const handleModelBChange = (newModel: string) => {
    setModelB(newModel);
    if (newModel === modelA) {
      const fallback = MODELS.find((m) => m !== newModel);
      if (fallback) setModelA(fallback);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Text prompt is required.");
      return;
    }
    if (!image) {
      setError("Image is required.");
      return;
    }

    setError(null);
    setLoading(true);
    setSelected(null);
    setResponseA("");
    setResponseB("");

    const base64Image = await toBase64(image);

    const body = {
      prompt,
      images: [base64Image],
      system_instructions: "You are a helpful assistant.",
    };

    const fetchModel = async (modelKey: string) => {
      const res = await fetch("http://localhost:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          model_id: MODEL_MAP[modelKey],
        }),
      });
      const data = await res.json();
      const parsed = JSON.parse(data.response);
      return parsed?.content?.[0]?.text || "No response received.";
    };

    try {
      const [a, b] = await Promise.all([
        fetchModel(modelA),
        fetchModel(modelB),
      ]);
      setResponseA(a);
      setResponseB(b);
    } catch (err) {
      setError("Error fetching model responses.");
    } finally {
      setLoading(false);
    }
  };

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleClear = () => {
    setPrompt("");
    setImage(null);
    setImagePreview(null);
    setError(null);
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">LLM Arena</h1>

      {/* Prompt */}
      <div>
        <label className="text-sm font-medium">Enter your prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here"
          className="w-full h-28 border rounded-md p-3 text-sm dark:bg-zinc-900 dark:text-white"
        />
      </div>

      {/* Image upload */}
      <div>
        <label className="text-sm font-medium">Upload image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className="block w-full mt-2 text-sm"
        />
        {imagePreview && (
          <div className="relative mt-4">
            <img src={imagePreview} alt="Preview" className="rounded-md" />
            <button
              onClick={() => setImage(null)}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Submit"}
        </Button>
        <Button variant="outline" onClick={handleClear}>
          Clear
        </Button>
      </div>

      {/* Error message */}
      {error && <div className="text-red-600 font-medium text-sm">{error}</div>}

      {/* Model responses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <ModelResponseCard
          label="Model A"
          model={modelA}
          modelOptions={MODELS.filter((m) => m !== modelB)}
          onModelChange={handleModelAChange}
          response={responseA}
          loading={loading}
          disabled={loading}
        />
        <ModelResponseCard
          label="Model B"
          model={modelB}
          modelOptions={MODELS.filter((m) => m !== modelA)}
          onModelChange={handleModelBChange}
          response={responseB}
          loading={loading}
          disabled={loading}
        />
      </div>

      {/* Vote buttons */}
      <div className="text-center space-x-2 mt-6">
        {["A", "B", "tie"].map((choice) => (
          <Button
            key={choice}
            variant={selected === choice ? "default" : "outline"}
            onClick={() => setSelected(choice as any)}
            disabled={loading}
          >
            {selected === choice
              ? `Selected ${choice.toUpperCase()} ✓`
              : `Model ${choice.toUpperCase()}`}
          </Button>
        ))}
      </div>
    </main>
  );
}
