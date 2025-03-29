'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Paper,
  SelectChangeEvent
} from '@mui/material';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { useSettings } from '../../contexts/SettingsContext';
import { useApiClient } from '../../contexts/ApiContext';
import { AIActionParams, AIActionResponse } from '../../services/client/ai/types';
import { addHistoryItem } from '../../services/client/historyService';
import { ACTION_TYPES } from '../../services/server/ai/aiActions/constants';
import AIActionWrapper from './AIActionWrapper';
import { CompactKeyTakeawayRenderer } from '../../services/server/ai/aiActions/keytakeaway/client/CompactKeyTakeawayRenderer';
import { KeyTakeawayResponseData } from '../../types/shared/ai';

interface CompactVideoActionsProps {
  videoId: string;
  videoTitle: string;
  existingResult?: Record<string, unknown>;
  onResultUpdate?: (result: Record<string, unknown>) => void;
}

// Define available actions for the compact view
const COMPACT_AI_ACTIONS = {
  [ACTION_TYPES.KEYTAKEAWAY]: {
    label: 'Key Takeaways',
    icon: <LightbulbOutlinedIcon fontSize="small" />,
    description: 'Extract actionable recommendations'
  }
};

export const CompactVideoActions: React.FC<CompactVideoActionsProps> = ({ 
  videoId, 
  videoTitle, 
  existingResult, 
  onResultUpdate 
}) => {
  const { settings } = useSettings();
  const { apiClient } = useApiClient();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(existingResult || null);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AIActionResponse<unknown> | null>(null);

  // Initialize with existing result if available
  useEffect(() => {
    if (existingResult) {
      setResult(existingResult);
      // Find the action type from the existing result
      if (existingResult.categories) {
        setActiveAction(ACTION_TYPES.KEYTAKEAWAY);
      }
    }
  }, [existingResult]);

  // Handle action selection
  const handleActionChange = async (event: SelectChangeEvent) => {
    const action = event.target.value;
    if (!action) return;
    
    await processAction(action);
  };

  // Create appropriate action parameters based on action type
  const createActionParams = (action: string): AIActionParams => {
    switch (action) {
      case ACTION_TYPES.KEYTAKEAWAY:
        return { type: ACTION_TYPES.KEYTAKEAWAY };
      default:
        throw new Error(`Unsupported action type: ${action}`);
    }
  };

  // Process the selected action
  const processAction = async (action: string) => {
    setActiveAction(action);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!apiClient) {
        throw new Error('API client is not initialized');
      }

      // Create typed action parameters
      const actionParams = createActionParams(action);

      const response = await apiClient.processVideo({
        videoId,
        action,
        model: settings.aiModel,
        costApprovalThreshold: settings.costApprovalThreshold,
        params: actionParams,
        skipCache: !settings.cachingEnabled
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'An error occurred');
      }

      // Log the response to help debug cost information
      console.log('API response:', response);
      
      // Store the cost separately instead of modifying the result
      let responseCost = 0;
      let isCached = false;
      
      if (response.data) {
        responseCost = response.data.cost || 0;
        isCached = response.data.isCached || false;
        console.log('Response data cost:', responseCost);
        console.log('Response from cache:', isCached);
        
        // Set the result with proper type casting
        const newResult = response.data.result ? (response.data.result as Record<string, unknown>) : null;
        
        // Call the onResultUpdate callback if provided
        if (newResult && onResultUpdate) {
          onResultUpdate(newResult);
        }
        
        // Set the result last, after all processing is complete
        setResult(newResult);
      }

      // Add to history
      if (response.data?.result) {
        addHistoryItem({
          id: Date.now().toString(),
          videoId,
          videoTitle,
          action,
          timestamp: Date.now(),
          cost: responseCost,
          result: response.data.result,
          params: actionParams
        });
      }
      setResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      // Delay turning off the loading state to ensure UI updates properly
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  };

  // Render the result of an AI action
  const renderActionResult = () => {
    if (!activeAction || !result) return null;
    
    // Get cache status from the response data
    const isCached = response?.data?.isCached || false;
    
    // For now, we only support key takeaways
    if (activeAction === ACTION_TYPES.KEYTAKEAWAY) {
      // Cast the result to KeyTakeawayResponse
      const keyTakeawayResult = result as unknown as KeyTakeawayResponseData;
      
      return (
        <AIActionWrapper 
          cost={response?.data?.cost} 
          model={settings.aiModel}
          actionType={COMPACT_AI_ACTIONS[ACTION_TYPES.KEYTAKEAWAY].label}
          isCached={isCached}
        >
          <CompactKeyTakeawayRenderer 
            result={{ categories: keyTakeawayResult.categories || [] }} 
            videoId={videoId} 
          />
        </AIActionWrapper>
      );
    }
    
    return null;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* AI Action Select Box */}
      <FormControl 
        fullWidth 
        size="small" 
        sx={{ 
          mb: 2,
          '& .MuiInputBase-root': {
            fontSize: '0.75rem'
          }
        }}
      >
        <InputLabel id="compact-ai-action-select-label">Select an AI action</InputLabel>
        <Select
          labelId="compact-ai-action-select-label"
          id="compact-ai-action-select"
          value=""
          label="Select an AI action"
          onChange={handleActionChange}
          disabled={loading}
          sx={{ 
            '& .MuiSelect-select': { 
              display: 'flex', 
              alignItems: 'center',
              py: 1
            }
          }}
        >
          <MenuItem value="" disabled>
            <em>Select an AI action...</em>
          </MenuItem>
          {Object.entries(COMPACT_AI_ACTIONS).map(([key, action]) => (
            <MenuItem key={key} value={key} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                {action.icon}
              </Box>
              <Typography variant="body2">{action.label}</Typography>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Paper sx={{ p: 1, mb: 2, bgcolor: '#ffebee' }}>
          <Typography variant="body2" color="error">{error}</Typography>
        </Paper>
      )}

      {/* Result Display */}
      {result && (
        <Box sx={{ mt: 1 }}>
          {renderActionResult()}
        </Box>
      )}
    </Box>
  );
};

export default CompactVideoActions;
