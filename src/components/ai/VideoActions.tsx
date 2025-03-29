'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { useSettings } from '../../contexts/SettingsContext';
import { useApiClient } from '../../contexts/ApiContext';
import { AIActionParams, AIActionResponse } from '../../services/client/ai/types';
import { addHistoryItem } from '../../services/client/historyService';
import { AI_ACTIONS } from '../../services/client/ai';
import { ACTION_TYPES } from '../../services/server/ai/aiActions/constants';
import AIActionWrapper from './AIActionWrapper';

interface VideoActionsProps {
  videoId: string;
  videoTitle: string;
  existingResult?: Record<string, unknown>;
  onResultUpdate?: (result: Record<string, unknown>) => void;
}

export default function VideoActions({ 
  videoId, 
  videoTitle, 
  existingResult, 
  onResultUpdate 
}: VideoActionsProps) {
  const { settings } = useSettings();
  const { apiClient } = useApiClient();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(existingResult || null);
  const [error, setError] = useState<string | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [question, setQuestion] = useState('');
  const [questionDialog, setQuestionDialog] = useState(false);
  const [actionParams, setActionParams] = useState<AIActionParams | null>(null);
  const [response, setResponse] = useState<AIActionResponse<unknown> | null>(null);

  // Initialize with existing result if available
  useEffect(() => {
    if (existingResult) {
      setResult(existingResult);
    }
  }, [existingResult]);

  // Handle action button click
  const handleActionClick = async (action: string) => {
    // For question action, open the question dialog first
    if (action === ACTION_TYPES.QUESTION) {
      setActiveAction(action);
      setQuestionDialog(true);
      return;
    }

    // For other actions, process directly
    await processAction(action);
  };

  // Create appropriate action parameters based on action type
  const createActionParams = (action: string, extraParams?: Record<string, unknown>): AIActionParams => {
    switch (action) {
      case ACTION_TYPES.SUMMARY:
        return { type: ACTION_TYPES.SUMMARY, ...(extraParams as { maxLength?: number }) };
      case ACTION_TYPES.QUESTION:
        if (extraParams?.question) {
          return { type: ACTION_TYPES.QUESTION, question: extraParams.question as string };
        }
        throw new Error('Question parameter is required for question action');
      case ACTION_TYPES.KEYPOINTS:
        return { type: ACTION_TYPES.KEYPOINTS, ...(extraParams as { count?: number }) };
      case ACTION_TYPES.TOPICS:
        return { type: ACTION_TYPES.TOPICS };
      case ACTION_TYPES.KEYTAKEAWAY:
        return { type: ACTION_TYPES.KEYTAKEAWAY, ...(extraParams as { count?: number }) };
      default:
        throw new Error(`Unsupported action type: ${action}`);
    }
  };

  // Process the selected action
  const processAction = async (action: string, params?: Record<string, unknown>) => {
    setActiveAction(action);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!apiClient) {
        throw new Error('API client is not initialized');
      }

      // Create typed action parameters
      const actionParams = createActionParams(action, params);
      setActionParams(actionParams);

      const response = await apiClient.processVideo({
        videoId,
        action,
        model: settings.aiModel,
        costApprovalThreshold: settings.costApprovalThreshold,
        params: actionParams,
        skipCache: !settings.cachingEnabled // Pass the caching setting
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'An error occurred');
      }

      if (response.needApproval) {
        setEstimatedCost(response.estimatedCost || 0);
        setApprovalDialog(true);
        return;
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
        setResult(newResult);
        
        // Call the onResultUpdate callback if provided
        if (newResult && onResultUpdate) {
          onResultUpdate(newResult);
        }
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
          params: actionParams || createActionParams(action) // Provide default params if null
        });
      }
      setResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle approval confirmation
  const handleApprovalConfirm = async () => {
    setApprovalDialog(false);
    setLoading(true);
    
    try {
      if (!apiClient || !activeAction) {
        throw new Error('API client or active action is not initialized');
      }
      
      const response = await apiClient.processVideo({
        videoId,
        action: activeAction,
        model: settings.aiModel,
        costApprovalThreshold: settings.costApprovalThreshold,
        approved: true,
        params: actionParams || undefined,
        skipCache: !settings.cachingEnabled // Pass the caching setting
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'An error occurred');
      }
      
      // Log the response to help debug cost information
      console.log('API response after approval:', response);
      
      // Store the cost separately instead of modifying the result
      let responseCost = 0;
      let isCached = false;
      
      if (response.data) {
        responseCost = response.data.cost || 0;
        isCached = response.data.isCached || false;
        console.log('Response data cost after approval:', responseCost);
        console.log('Response from cache after approval:', isCached);
        
        // Set the result with proper type casting
        const newResult = response.data.result ? (response.data.result as Record<string, unknown>) : null;
        setResult(newResult);
        
        // Call the onResultUpdate callback if provided
        if (newResult && onResultUpdate) {
          onResultUpdate(newResult);
        }
      }
      
      // Add to history
      if (response.data?.result) {
        addHistoryItem({
          id: Date.now().toString(),
          videoId,
          videoTitle,
          action: activeAction,
          timestamp: Date.now(),
          cost: responseCost,
          result: response.data.result,
          params: actionParams || createActionParams(activeAction) // Provide default params if null
        });
      }
      setResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle question submission
  const handleQuestionSubmit = () => {
    if (!question.trim()) return;

    setQuestionDialog(false);
    processAction(ACTION_TYPES.QUESTION, { question: question.trim() });
  };

  // Render the result of an AI action
  const renderActionResult = () => {
    if (!activeAction || !result) return null;
    
    const actionRenderer = AI_ACTIONS[activeAction];
    if (!actionRenderer) return null;
    
    // Get cache status from the response data
    const isCached = response?.data?.isCached || false;
    
    // Log for debugging
    console.log('Result in renderActionResult:', result);
    console.log('Cache status:', isCached);
    
    return (
      <AIActionWrapper 
        cost={response?.data?.cost} 
        model={settings.aiModel}
        actionType={actionRenderer.label}
        isCached={isCached}
      >
        {actionRenderer.renderResult({ 
          result, 
          params: actionParams || undefined,
          videoId
        })}
      </AIActionWrapper>
    );
  };

  return (
    <Box>
      {/* AI Action Select Box */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          AI Actions
        </Typography>
        <FormControl fullWidth sx={{ maxWidth: 500 }}>
          <InputLabel id="ai-action-select-label">Select an AI action</InputLabel>
          <Select
            labelId="ai-action-select-label"
            id="ai-action-select"
            value=""
            label="Select an AI action"
            onChange={(e: SelectChangeEvent) => {
              const selectedAction = e.target.value;
              if (selectedAction) {
                handleActionClick(selectedAction);
                // Reset the select after selection
                e.target.value = "";
              }
            }}
            disabled={loading}
            sx={{ 
              '& .MuiSelect-select': { 
                display: 'flex', 
                alignItems: 'center' 
              }
            }}
          >
            <MenuItem value="" disabled>
              <em>Select an AI action...</em>
            </MenuItem>
            {Object.entries(AI_ACTIONS).map(([key, action]) => (
              <MenuItem key={key} value={key} sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                  {action.icon}
                </Box>
                {action.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {/* Result Display */}
      {result && (
        <Paper sx={{ p: 3, mt: 2 }}>
          {renderActionResult()}
        </Paper>
      )}

      {/* Cost Approval Dialog */}
      <Dialog
        open={approvalDialog}
        onClose={() => setApprovalDialog(false)}
      >
        <DialogTitle>Cost Approval Required</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This operation will cost approximately ${estimatedCost.toFixed(4)}, which exceeds your threshold of ${settings.costApprovalThreshold.toFixed(2)}.
            Do you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>Cancel</Button>
          <Button onClick={handleApprovalConfirm} variant="contained" color="primary">
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Question Dialog */}
      <Dialog
        open={questionDialog}
        onClose={() => setQuestionDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Ask a Question</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter your question about the video content:
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            label="Your question"
            variant="outlined"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuestionDialog(false)}>Cancel</Button>
          <Button
            onClick={handleQuestionSubmit}
            variant="contained"
            color="primary"
            disabled={!question.trim()}
          >
            Ask
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
