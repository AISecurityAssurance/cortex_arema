"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const MODELS = ["AWS Bedrock Claude 4 Opus", "AWS Bedrock Claude 4 Sonnet"];

const MODEL_ID_MAP: Record<string, string> = {
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

  const [blindMode, setBlindMode] = useState(false);
  const [explanationMode, setExplanationMode] = useState(false);
  const [selected, setSelected] = useState<"A" | "B" | "tie" | null>(null);
  const [loading, setLoading] = useState(false);

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

  const getLabel = (model: string) => (blindMode ? "Model ?" : model);
  const vote = (choice: "A" | "B" | "tie") => setSelected(choice);

  async function getBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1]; // strip data:image/... prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const handleGenerate = async () => {
    if (!prompt.trim() && !image) {
      setError("Text prompt and image are required.");
      return;
    }
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

    try {
      const imageBase64 = await getBase64(image);

      const commonPayload = {
        prompt,
        images: [imageBase64],
        system_instructions: "You are a helpful assistant.",
      };

      const [resA, resB] = await Promise.all([
        fetch("http://localhost:8000/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...commonPayload,
            model_id: MODEL_ID_MAP[modelA],
          }),
        }),
        fetch("http://localhost:8000/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...commonPayload,
            model_id: MODEL_ID_MAP[modelB],
          }),
        }),
      ]);

      const dataA = await resA.json();
      const dataB = await resB.json();

      const parsedA = JSON.parse(dataA.response);
      const parsedB = JSON.parse(dataB.response);

      setResponseA(parsedA?.content?.[0]?.text ?? "No response.");
      setResponseB(parsedB?.content?.[0]?.text ?? "No response.");
    } catch (err) {
      setError("Failed to generate response. See console for details.");
      console.error("Error generating response:", err);
    } finally {
      setLoading(false);
    }
  };

  const responses = [
    {
      id: "A",
      model: modelA,
      content: loading
        ? "Generating..."
        : responseA || "Click 'Generate' to produce a response.",
      explanation: `${modelA} provides thoughtful context.`,
    },
    {
      id: "B",
      model: modelB,
      content: loading
        ? "Generating..."
        : responseB || "Click 'Generate' to produce a response.",
      explanation: `${modelB} emphasizes clarity and accuracy.`,
    },
  ];

  const shuffledResponses = blindMode
    ? [...responses].sort(() => 0.5 - Math.random())
    : responses;

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">LLM Arena Clone</h1>

      <div className="flex justify-center gap-6 flex-wrap">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={blindMode} onCheckedChange={setBlindMode} />
          Blind Mode
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={explanationMode}
            onCheckedChange={setExplanationMode}
          />
          Show Explanations
        </label>
      </div>

      {imagePreview && (
        <div className="flex justify-center">
          <div className="relative w-full max-w-lg">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-auto rounded-lg border"
            />
            <button
              onClick={() => setImage(null)}
              className="absolute top-2 right-2 text-sm bg-black bg-opacity-60 text-white px-2 py-1 rounded"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shuffledResponses.map((resp) => {
          const isSelected = selected === resp.id;
          const isModelA = resp.id === "A";
          return (
            <Card
              key={resp.id}
              className={cn(
                "border transition-shadow hover:shadow-lg",
                isSelected && "border-blue-600 shadow-xl"
              )}
            >
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Select Model {blindMode ? "?" : resp.id}
                  </label>
                  <select
                    className="w-full border rounded-md p-2 text-sm"
                    disabled={blindMode || loading}
                    value={isModelA ? modelA : modelB}
                    onChange={(e) =>
                      isModelA
                        ? setModelA(e.target.value)
                        : setModelB(e.target.value)
                    }
                  >
                    {MODELS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="text-sm text-muted-foreground font-semibold">
                  {getLabel(resp.model)}
                </div>
                <div
                  className={cn(
                    "rounded-md min-h-[6rem] p-4 text-sm whitespace-pre-wrap leading-relaxed",
                    loading
                      ? "bg-gray-100 dark:bg-zinc-800 animate-pulse"
                      : "bg-muted/20 dark:bg-zinc-900"
                  )}
                >
                  {resp.content}
                </div>

                {explanationMode && (
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    {resp.explanation}
                  </div>
                )}

                <Button
                  className="w-full"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => vote(resp.id as "A" | "B" | "tie")}
                  disabled={loading}
                >
                  {isSelected ? "Selected ✓" : "Vote for this response"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <Button
          variant={selected === "tie" ? "default" : "outline"}
          onClick={() => vote("tie")}
          disabled={loading}
        >
          {selected === "tie" ? "Selected Tie ✓" : "Vote Tie"}
        </Button>
      </div>

      {error && (
        <div className="text-red-600 text-center font-medium mt-2">{error}</div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Text Prompt <span className="text-red-500">*</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
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
            className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </div>

        <Button
          className="w-full md:w-48"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate"}
        </Button>
      </div>
    </main>
  );
}
