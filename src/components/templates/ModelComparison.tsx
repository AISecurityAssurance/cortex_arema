import React from 'react';
import ReactMarkdown from 'react-markdown';
import { AnalysisContainer } from './AnalysisContainer';
import './ModelComparison.css';

interface ModelComparisonProps {
  id: string;
  models: {
    modelA: {
      name: string;
      response: string;
      loading?: boolean;
    };
    modelB: {
      name: string;
      response: string;
      loading?: boolean;
    };
  };
  blindMode?: boolean;
  selected?: 'A' | 'B' | 'tie' | null;
  onVote?: (choice: 'A' | 'B' | 'tie') => void;
  onModelChange?: (side: 'A' | 'B', model: string) => void;
  availableModels?: string[];
}

export const ModelComparison: React.FC<ModelComparisonProps> = ({
  id,
  models,
  blindMode = false,
  selected,
  onVote,
  onModelChange,
  availableModels = []
}) => {
  const renderModelCard = (side: 'A' | 'B') => {
    const model = side === 'A' ? models.modelA : models.modelB;
    const isSelected = selected === side;
    
    return (
      <div className={`model-card ${isSelected ? 'selected' : ''} ${model.loading ? 'loading' : ''}`}>
        <div className="model-header">
          <div className="model-info">
            <label className="model-label">Model {side}</label>
            {!blindMode && onModelChange && availableModels.length > 0 && (
              <select
                className="model-select"
                value={model.name}
                onChange={(e) => onModelChange(side, e.target.value)}
                disabled={model.loading}
              >
                {availableModels.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
          </div>
          <div className="model-name">
            {blindMode ? 'Model ?' : model.name}
          </div>
        </div>
        
        <div className="model-response">
          {model.loading ? (
            <div className="model-loading">
              <div className="loading-spinner"></div>
              <span>Generating response...</span>
            </div>
          ) : (
            <div className="response-content">
              {model.response ? (
                <ReactMarkdown>{model.response}</ReactMarkdown>
              ) : (
                'No response yet'
              )}
            </div>
          )}
        </div>
        
        {onVote && !model.loading && model.response && (
          <button
            className={`vote-btn ${isSelected ? 'vote-btn-selected' : ''}`}
            onClick={() => onVote(side)}
          >
            {isSelected ? 'Selected ✓' : `Vote for Model ${side}`}
          </button>
        )}
      </div>
    );
  };
  
  return (
    <AnalysisContainer
      id={id}
      title="Model Comparison"
      showToolbar={false}
      className="model-comparison-container"
    >
      <div className="model-comparison">
        <div className="comparison-grid">
          {renderModelCard('A')}
          {renderModelCard('B')}
        </div>
        
        {onVote && models.modelA.response && models.modelB.response && !models.modelA.loading && !models.modelB.loading && (
          <div className="tie-option">
            <button
              className={`vote-btn vote-btn-tie ${selected === 'tie' ? 'vote-btn-selected' : ''}`}
              onClick={() => onVote('tie')}
            >
              {selected === 'tie' ? 'Tie Selected ✓' : 'It\'s a Tie'}
            </button>
          </div>
        )}
      </div>
    </AnalysisContainer>
  );
};