'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider 
} from '@mui/material';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ChatIcon from '@mui/icons-material/Chat';
import { AIActionParams, AIResponse } from '../../../../../../types/shared/ai';

// Define the props for the renderer component
export interface QuestionRendererProps {
  result: AIResponse;
  params?: AIActionParams;
}

// Define the type for question params
interface QuestionParams {
  type: 'question';
  question: string;
}

/**
 * Renders the result of a question action
 */
export const QuestionRenderer: React.FC<QuestionRendererProps> = ({ result, params }) => {
  // If params are not of the expected type, return null
  if (params?.type !== 'question') return null;
  
  // Cast params to the expected type
  const questionParams = params as QuestionParams;
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Question & Answer</Typography>
      
      {/* Question section */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <HelpOutlineIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Question:
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ ml: 4 }}>
          {questionParams.question}
        </Typography>
      </Paper>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Answer section */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <ChatIcon color="secondary" sx={{ mr: 1, mt: 0.5 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Answer:
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ ml: 4 }}>
          {result as string}
        </Typography>
      </Paper>
    </Box>
  );
};

/**
 * Action metadata for the Question action
 */
export const QuestionActionMeta = {
  key: 'question',
  label: 'Ask a Question',
  icon: <QuestionAnswerIcon />,
  description: 'Ask a specific question about the video content'
};

export default QuestionRenderer;
