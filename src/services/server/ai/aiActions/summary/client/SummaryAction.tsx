'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Divider,
  Chip
} from '@mui/material';
import SummarizeIcon from '@mui/icons-material/Summarize';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { AIActionParams, AIResponse } from '../../../../../../types/shared/ai';

// Define the props for the renderer component
export interface SummaryRendererProps {
  result: AIResponse;
  params?: AIActionParams;
}

// Define the type for summary response
interface SummaryResponse {
  chapterSummaries: Array<{ title: string; summary: string }>;
  finalSummary: string;
}

/**
 * Renders the result of a summary action
 */
export const SummaryRenderer: React.FC<SummaryRendererProps> = ({ result }) => {
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});
  
  // If the result is a string (shouldn't happen for summary), just display it
  if (typeof result === 'string') {
    return <Typography>{result}</Typography>;
  }
  
  // Cast the result to the expected type
  const summaryResult = result as SummaryResponse;
  
  const handleChapterToggle = (index: number) => () => {
    setExpandedChapters(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  return (
    <Box>
      {/* Main Summary Section */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SummarizeIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Video Summary</Typography>
        </Box>
        <Paper elevation={2} sx={{ p: 3, bgcolor: '#f8f9fa' }}>
          <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
            {summaryResult.finalSummary}
          </Typography>
        </Paper>
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Chapter Summaries Section */}
      <Box>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 2 
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BookmarkIcon color="secondary" sx={{ mr: 1 }} />
            <Typography variant="h6">Chapter Summaries</Typography>
          </Box>
          <Chip 
            label={`${summaryResult.chapterSummaries.length} chapters`} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        </Box>
        
        {summaryResult.chapterSummaries.map((chapter, index) => (
          <Accordion 
            key={index} 
            sx={{ mb: 1 }}
            expanded={!!expandedChapters[index]}
            onChange={handleChapterToggle(index)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="bold">
                {chapter.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">
                {chapter.summary}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
};

/**
 * Action metadata for the Summary action
 */
export const SummaryActionMeta = {
  key: 'summary',
  label: 'Summarize',
  icon: <SummarizeIcon />,
  description: 'Generate a concise summary of the video content'
};

export default SummaryRenderer;
