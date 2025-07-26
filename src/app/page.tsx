"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { ModelCard } from "@/components/ModelCard";
import { VoteControls } from "@/components/VoteControls";
import { PromptForm } from "@/components/PromptForm";

const MODEL_IDS = {
  "AWS Bedrock Claude 4 Opus": "us.anthropic.claude-opus-4-20250514-v1:0",
  "AWS Bedrock Claude 4 Sonnet": "us.anthropic.claude-sonnet-4-20250514-v1:0",
};

const MODELS = Object.keys(MODEL_IDS);

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

  const handleGenerate = async () => {
    if (!prompt.trim() || !image) {
      setError("Text prompt and image are required.");
      return;
    }

    setError(null);
    setLoading(true);
    setSelected(null);
    setResponseA("");
    setResponseB("");

    const base64Image = await toBase64(image);

    try {
      const [resA, resB] = await Promise.all([
        fetch("http://localhost:8000/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model_id: MODEL_IDS[modelA as keyof typeof MODEL_IDS],
            prompt,
            images: [base64Image],
            system_instructions: "You are a helpful assistant.",
          }),
        }),
        fetch("http://localhost:8000/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model_id: MODEL_IDS[modelB as keyof typeof MODEL_IDS],
            prompt,
            images: [base64Image],
            system_instructions: "You are a helpful assistant.",
          }),
        }),
      ]);

      const [jsonA, jsonB] = await Promise.all([resA.json(), resB.json()]);
      const parsedA = JSON.parse(jsonA.response);
      const parsedB = JSON.parse(jsonB.response);

      setResponseA(parsedA.content?.[0]?.text ?? "No response.");
      setResponseB(parsedB.content?.[0]?.text ?? "No response.");
    } catch (e) {
      setError("Failed to get response from server.");
    } finally {
      setLoading(false);
    }
  };

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = (reader.result as string).split(",")[1];
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });

  const availableModelsFor = (current: string) =>
    MODELS.filter((m) => m !== current);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-center gap-6">
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

      <PromptForm
        prompt={prompt}
        onPromptChange={setPrompt}
        onImageChange={setImage}
        onSubmit={handleGenerate}
        loading={loading}
        error={error ?? undefined}
        imagePreview={imagePreview}
        onClearImage={() => setImage(null)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ModelCard
          id="A"
          label="A"
          model={modelA}
          models={availableModelsFor(modelB)}
          response={responseA}
          blindMode={blindMode}
          selected={selected}
          loading={loading}
          explanation={
            explanationMode ? `${modelA} explains with nuance.` : undefined
          }
          onModelChange={setModelA}
          onVote={() => setSelected("A")}
        />
        <ModelCard
          id="B"
          label="B"
          model={modelB}
          models={availableModelsFor(modelA)}
          response={responseB}
          blindMode={blindMode}
          selected={selected}
          loading={loading}
          explanation={explanationMode ? `${modelB} gives clarity.` : undefined}
          onModelChange={setModelB}
          onVote={() => setSelected("B")}
        />
      </div>

      <VoteControls
        selected={selected}
        onVote={setSelected}
        disabled={loading}
      />
    </div>
  );
}
