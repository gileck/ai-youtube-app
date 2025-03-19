'use client';

import React, { useState, useEffect } from 'react';
import { getAvailableModels, calculateEstimatedCost, formatCost } from '../../services/client/modelUtils';
import { useSettings } from '../../contexts/SettingsContext';

/**
 * Demo component to show how the shared model definitions work
 * Demonstrates the integration between client and server while maintaining separation of concerns
 */
export const ModelIntegrationDemo: React.FC = () => {
  const { settings } = useSettings();
  const [inputTokens, setInputTokens] = useState(1000);
  const [outputTokens, setOutputTokens] = useState(500);
  const [costEstimate, setCostEstimate] = useState<{
    inputCost: number;
    outputCost: number;
    totalCost: number;
  } | undefined>();
  
  // Get all available models from the shared definitions
  const allModels = getAvailableModels();
  const selectedModel = allModels.find(model => model.id === settings.aiModel);
  
  // Update cost estimate when inputs change
  useEffect(() => {
    if (settings.aiModel) {
      const estimate = calculateEstimatedCost(
        settings.aiModel,
        inputTokens,
        outputTokens
      );
      setCostEstimate(estimate);
    }
  }, [settings.aiModel, inputTokens, outputTokens]);
  
  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Model Integration Demo</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-700 mb-2">
          This demo shows how the shared model definitions are used by both client and server code.
        </p>
        <p className="text-sm text-gray-700">
          The same model IDs, names, and pricing are used consistently throughout the application.
        </p>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Selected Model</h3>
        {selectedModel ? (
          <div className="bg-gray-50 p-3 rounded">
            <p className="font-medium">{selectedModel.name}</p>
            <p className="text-sm text-gray-600">ID: {selectedModel.id}</p>
            <p className="text-sm text-gray-600">Provider: {selectedModel.provider}</p>
            <p className="text-sm text-gray-600">
              Input cost: {formatCost(selectedModel.inputCostPer1KTokens)} per 1K tokens
            </p>
            <p className="text-sm text-gray-600">
              Output cost: {formatCost(selectedModel.outputCostPer1KTokens)} per 1K tokens
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">No model selected</p>
        )}
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Cost Estimator</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Input Tokens
            </label>
            <input
              type="number"
              value={inputTokens}
              onChange={(e) => setInputTokens(Number(e.target.value))}
              className="w-full p-2 border rounded"
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Output Tokens
            </label>
            <input
              type="number"
              value={outputTokens}
              onChange={(e) => setOutputTokens(Number(e.target.value))}
              className="w-full p-2 border rounded"
              min={1}
            />
          </div>
        </div>
        
        {costEstimate && (
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm">
              <span className="font-medium">Input Cost:</span> {formatCost(costEstimate.inputCost)}
            </p>
            <p className="text-sm">
              <span className="font-medium">Output Cost:</span> {formatCost(costEstimate.outputCost)}
            </p>
            <p className="text-sm font-medium">
              <span className="font-medium">Total Cost:</span> {formatCost(costEstimate.totalCost)}
            </p>
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500 mt-4">
        <p>Note: This same cost estimation logic is used on both client and server.</p>
        <p>The server uses it to determine if approval is needed before processing.</p>
        <p>The client uses it to display cost information to the user.</p>
      </div>
    </div>
  );
};

export default ModelIntegrationDemo;
