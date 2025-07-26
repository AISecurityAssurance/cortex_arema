"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/Switch";
import { ModelComparison, ArenaPromptInput } from "@/components/templates";
import { usePromptStore } from "@/stores/promptStore";
import "./page.css";

const MODEL_IDS = {
  "AWS Bedrock Claude 4 Opus": "us.anthropic.claude-opus-4-20250514-v1:0",
  "AWS Bedrock Claude 4 Sonnet": "us.anthropic.claude-sonnet-4-20250514-v1:0",
};

const MODELS = Object.keys(MODEL_IDS);

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [modelA, setModelA] = useState(MODELS[0]);
  const [modelB, setModelB] = useState(MODELS[1]);

  const [blindMode, setBlindMode] = useState(false);
  const [explanationMode, setExplanationMode] = useState(false);
  const [selected, setSelected] = useState<"A" | "B" | "tie" | null>(null);
  const [loading, setLoading] = useState(false);

  const [responseA, setResponseA] = useState("");
  const [responseB, setResponseB] = useState("");

  const templates = usePromptStore((s) => s.templates).filter((t) => t.template);

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

  const handleModelChange = (side: 'A' | 'B', model: string) => {
    if (side === 'A') {
      setModelA(model);
    } else {
      setModelB(model);
    }
  };

  const availableModelsFor = (current: string) =>
    MODELS.filter((m) => m !== current);

  return (
    <div className="arena-page">
      <div className="arena-header">
        <h1 className="arena-title">AI Model Arena</h1>
        <p className="arena-subtitle">Compare responses from different AI models</p>
      </div>

      <div className="arena-controls">
        <div className="control-item">
          <Switch checked={blindMode} onCheckedChange={setBlindMode} />
          <label className="control-label">Blind Mode</label>
        </div>
        <div className="control-item">
          <Switch
            checked={explanationMode}
            onCheckedChange={setExplanationMode}
          />
          <label className="control-label">Show Explanations</label>
        </div>
      </div>

      <div className="arena-content">
        <ArenaPromptInput
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleGenerate}
          onImageChange={setImage}
          loading={loading}
          error={error}
          templates={templates}
        />

        <ModelComparison
          id="main-comparison"
          models={{
            modelA: { 
              name: modelA, 
              response: responseA, 
              loading: loading && !responseA 
            },
            modelB: { 
              name: modelB, 
              response: responseB, 
              loading: loading && !responseB 
            }
          }}
          blindMode={blindMode}
          selected={selected}
          onVote={setSelected}
          onModelChange={handleModelChange}
          availableModels={MODELS}
        />

        {selected && (
          <div className="vote-summary">
            <p className="vote-summary-text">You selected:</p>
            <p className="selected-model">
              {selected === 'tie' ? 'It\'s a tie!' : `Model ${selected}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
