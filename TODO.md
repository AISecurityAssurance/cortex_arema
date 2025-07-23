## 🚀 Planned Features

### 🔌 Backend Integration
- [ ] Connect to FastAPI (`/generate`) to fetch AWS Bedrock results
- [ ] Encode image to base64 and send with prompt
- [ ] Dynamically populate responses from backend

### 🧠 Prompt Templates & Modal UI
- [ ] Add “Prompt Templates” button with modal for structured prompt construction
  - [ ] STRIDE (Security threats)
  - [ ] MAESTRO (Mission-centric)
  - [ ] STPA-SEC (Systems-theoretic)
- [ ] Generate templated prompt into prompt input field

### 🧪 Evaluation & Testing Features
- [ ] Built-in prompt injection test cases (for model safety testing)
- [ ] Response time measurement (latency benchmark)
- [ ] Detailed feedback options (fluency, hallucination, relevance, safety)
- [ ] Token-level risk flags (e.g., for insecure suggestions or info leaks)

### 👥 Collaboration & Sharing
- [ ] Share prompt + responses via unique URL
- [ ] Multi-user voting + consensus display

---

## 📊 Leaderboards & Analytics

- [ ] Add leaderboard UI for model win tracking
  - [ ] Show win/loss/tie counts per model
  - [ ] Track average response time
- [ ] Export results (PDF/Markdown)
- [ ] Session-level stats: which model wins most often, per prompt type

---

## 🧩 Model Management

- [ ] Add support for more models via dropdown
  - AWS Bedrock Titan, Mistral, Llama 3, Gemini
- [ ] Refactor model config into `[{ label, model_id }]`
- [ ] Prevent duplicate model selection (A ≠ B)

---

## 📝 Usability Enhancements

- [ ] Prompt history panel with reuse support
- [ ] Inline commenting on responses
- [ ] Chat-like multi-turn mode (experimental)

---

## 🛠 Developer Ideas (Stretch)

- [ ] Webhooks to store prompt logs in Supabase
- [ ] Toggle Claude vs Gemini vs OpenAI formatting modes
- [ ] Token-level diff visualization (A vs B)
