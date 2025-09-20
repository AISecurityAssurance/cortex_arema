# Cortex Arena

An AI model comparison platform that allows you to evaluate and compare responses from different Large Language Models (LLMs) side-by-side. Currently supports AWS Bedrock Claude 4 models with multimodal capabilities.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- AWS account with Bedrock access
- AWS CLI configured with credentials

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cortex_arena
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Set up the backend**
   ```bash
   cd ../agr
   python3 -m venv env
   source env/bin/activate  # On Windows: env\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Configure AWS credentials**
   ```bash
   aws configure
   ```
   Enter your AWS Access Key ID, Secret Access Key, and preferred region (us-east-1 for Bedrock).

5. **Start the backend server**
   ```bash
   # From the agr directory
   python agr.py serve
   ```
   The backend API will run on http://localhost:8000

6. **Start the frontend development server**
   ```bash
   # From the cortex_arena directory
   npm run dev
   ```
   Open http://localhost:3001 in your browser

## 🎯 Features

- **Model Comparison**: Compare responses from Claude 4 Opus and Sonnet side-by-side
- **Multimodal Support**: Upload images along with text prompts
- **Blind Mode**: Hide model names during evaluation to reduce bias
- **Prompt Templates**: Access pre-configured prompts for security analysis
- **Markdown Rendering**: View formatted responses with proper syntax highlighting
- **Real-time Generation**: Watch responses stream in as they're generated
- **Export Options**: Save comparisons for later reference

## 🛠️ Development

### Available Scripts

```bash
# Frontend (from cortex_arena directory)
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint

# Backend (from agr directory)
python agr.py serve   # Start FastAPI server with auto-reload
```

### Project Structure

```
cortex_arena/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── page.tsx      # Main arena page
│   │   └── PromptTemplates/  # Template management
│   ├── components/       # React components
│   │   ├── templates/    # Core arena components
│   │   └── ui/          # Reusable UI components
│   └── stores/          # Zustand state management
├── public/              # Static assets
└── package.json         # Project dependencies

../agr/                  # Backend directory
├── agr.py              # FastAPI server CLI
├── core/               # Core model runtime
└── requirements.txt    # Python dependencies
```

## 🔧 Configuration

### Supported Models

Currently configured models in `src/app/page.tsx`:
- AWS Bedrock Claude 4 Opus (`us.anthropic.claude-opus-4-20250514-v1:0`)
- AWS Bedrock Claude 4 Sonnet (`us.anthropic.claude-sonnet-4-20250514-v1:0`)

To add more models, update the `MODEL_IDS` object in the main page component.

### Backend Configuration

The FastAPI backend (`../agr/agr.py`) is configured to:
- Accept CORS requests from `http://localhost:3001`
- Use AWS Bedrock runtime client in `us-east-1` region
- Handle multimodal inputs (text + images)
- Return streaming responses

## 📊 API Reference

### POST /generate

Generate a response from a specified model.

**Request Body:**
```json
{
  "model_id": "string",
  "prompt": "string",
  "images": ["base64_encoded_image"],
  "system_instructions": "string"
}
```

**Response:**
```json
{
  "response": "string (JSON-encoded Bedrock response)"
}
```

## 🧪 Testing

Currently, no automated tests are implemented. Future plans include:
- Unit tests for React components
- Integration tests for API endpoints
- E2E tests for the full comparison flow

## 🤝 Contributing

See [CLAUDE.md](./CLAUDE.md) for AI assistant context and development guidelines.
