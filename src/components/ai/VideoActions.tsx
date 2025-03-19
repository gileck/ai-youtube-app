'use client';

import React, { useState } from 'react';
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
  Divider
} from '@mui/material';
import SummarizeIcon from '@mui/icons-material/Summarize';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { useSettings } from '../../contexts/SettingsContext';
import { useApiClient } from '../../contexts/ApiContext';
import { AIActionParams, AIResponse } from '../../types/shared/ai';
import { addHistoryItem } from '../../services/client/historyService';

interface VideoActionsProps {
  videoId: string;
  videoTitle: string;
}

// Define the available AI actions with their renderers
type ActionRendererProps = {
  result: AIResponse;
  params?: AIActionParams;
};

// Define the available AI actions
const AI_ACTIONS: Record<string, {
  label: string;
  icon: React.ReactNode;
  description: string;
  renderResult: (props: ActionRendererProps) => React.ReactNode;
}> = {
  summary: {
    label: 'Summarize',
    icon: <SummarizeIcon />,
    description: 'Generate a concise summary of the video content',
    renderResult: ({ result }: ActionRendererProps) => {
      if (typeof result === 'string') {
        return <Typography>{result}</Typography>;
      }
      
      return (
        <Box>
          <Typography variant="h6" gutterBottom>Summary</Typography>
          <Typography paragraph>{result.finalSummary}</Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Chapter Summaries</Typography>
          {result.chapterSummaries.map((chapter, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">{chapter.title}</Typography>
              <Typography>{chapter.summary}</Typography>
            </Paper>
          ))}
        </Box>
      );
    }
  },
  question: {
    label: 'Ask a Question',
    icon: <QuestionAnswerIcon />,
    description: 'Ask a specific question about the video content',
    renderResult: ({ result, params }: ActionRendererProps) => {
      if (params?.type !== 'question') return null;
      
      return (
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Q: {params.question}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body1">
            A: {result as string}
          </Typography>
        </Box>
      );
    }
  },
  keypoints: {
    label: 'Key Points',
    icon: <FormatListBulletedIcon />,
    description: 'Extract the main points from the video',
    renderResult: ({ result }: ActionRendererProps) => {
      return <Typography>{result as string}</Typography>;
    }
  }
};

export default function VideoActions({ videoId, videoTitle }: VideoActionsProps) {
  const { settings } = useSettings();
  const { apiClient } = useApiClient();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [question, setQuestion] = useState('');
  const [questionDialog, setQuestionDialog] = useState(false);
  const [actionParams, setActionParams] = useState<AIActionParams | null>(null);
  
  // Handle action button click
  const handleActionClick = async (action: string) => {
    // For question action, open the question dialog first
    if (action === 'question') {
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
      case 'summary':
        return { type: 'summary', ...(extraParams as { maxLength?: number }) };
      case 'question':
        if (extraParams?.question) {
          return { type: 'question', question: extraParams.question as string };
        }
        throw new Error('Question parameter is required for question action');
      case 'keypoints':
        return { type: 'keypoints', ...(extraParams as { count?: number }) };
      case 'sentiment':
        return { type: 'sentiment' };
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
        params: actionParams
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'An error occurred');
      }
      
      if (response.needApproval) {
        setEstimatedCost(response.estimatedCost || 0);
        setApprovalDialog(true);
        setLoading(false);
        return;
      }
      
      setResult(response.data?.result || null);
      
      // Add to history
      if (response.data?.result) {
        addHistoryItem(
          videoId,
          videoTitle,
          action,
          response.data.cost,
          response.data.result,
          actionParams
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle approval confirmation
  const handleApprove = async () => {
    setApprovalDialog(false);
    setLoading(true);
    
    try {
      if (!activeAction || !actionParams) {
        throw new Error('Missing action parameters');
      }
      
      if (!apiClient) {
        throw new Error('API client is not initialized');
      }
      
      const response = await apiClient.processVideo({
        videoId,
        action: activeAction,
        model: settings.aiModel,
        costApprovalThreshold: settings.costApprovalThreshold,
        approved: true,
        params: actionParams
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'An error occurred');
      }
      
      setResult(response.data?.result || null);
      
      // Add to history
      if (response.data?.result) {
        addHistoryItem(
          videoId,
          videoTitle,
          activeAction,
          response.data.cost,
          response.data.result,
          actionParams
        );
      }
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
    processAction('question', { question: question.trim() });
  };
  
  // Render the result of the AI action
  const renderActionResult = () => {
    if (!activeAction || !result) return null;
    
    const action = AI_ACTIONS[activeAction];
    if (!action) return null;
    
    return action.renderResult({ result, params: actionParams || undefined });
  };
  
  return (
    <Box>
      {/* AI Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {Object.entries(AI_ACTIONS).map(([key, action]) => (
          <Button
            key={key}
            variant="contained"
            color="primary"
            startIcon={action.icon}
            onClick={() => handleActionClick(key)}
            disabled={loading}
          >
            {action.label}
          </Button>
        ))}
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
          <Button onClick={handleApprove} variant="contained" color="primary">
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
