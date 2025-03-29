'use client';

import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Paper,
  Button,
  CircularProgress,
  Divider
} from '@mui/material';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import { PodcastQAResponse, PodcastQAResponseData, QAChapter, AIActionParams } from '../../../../../../types/shared/ai';
import { useApiClient } from '../../../../../../contexts/ApiContext';
import { useSettings } from '../../../../../../contexts/SettingsContext';
import { ACTION_TYPES } from '../../../aiActions/constants';

// Define the props for the renderer component
export interface PodcastQARendererProps {
  result: PodcastQAResponse | Record<string, unknown>;
  videoId?: string;
}

/**
 * Renders the result of a podcast Q&A action
 */
export const PodcastQARenderer: React.FC<PodcastQARendererProps> = ({ result, videoId }) => {
  const { apiClient } = useApiClient();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [chapters, setChapters] = useState<QAChapter[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Parse the result when the component mounts or when the result changes
  React.useEffect(() => {
    // Check if result is PodcastQAResponse or has chapters property
    if (result && typeof result === 'object' && 'chapters' in result && Array.isArray(result.chapters)) {
      setChapters(result.chapters as QAChapter[]);
    } else {
      // Handle case where result might be a different type
      console.warn('Result does not contain valid chapters property:', result);
      setChapters([]);
    }
  }, [result]);

  // Function to refresh the Q&A pairs
  const handleRefresh = async () => {
    if (!videoId) {
      setError('Video ID is missing. Cannot refresh Q&A pairs.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!apiClient) {
        throw new Error('API client not available');
      }

      const response = await apiClient.processVideo<PodcastQAResponseData>({
        videoId,
        action: ACTION_TYPES.PODCASTQA,
        model: settings.aiModel,
        costApprovalThreshold: settings.costApprovalThreshold,
        skipCache: true,
        params: { type: ACTION_TYPES.PODCASTQA }
      });

      if (response.success && response.data) {
        setChapters(response.data.result.chapters);
      } else {
        throw new Error(response.error?.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error refreshing podcast Q&A:', error);
      setError('Failed to refresh Q&A pairs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If there's an error, display it
  if (error) {
    return (
      <Typography color="error">
        {error}
      </Typography>
    );
  }

  // If there are no chapters or all chapters are empty, display a message
  if (chapters.length === 0 || chapters.every(chapter => chapter.qaItems.length === 0)) {
    return (
      <Typography>
        No Q&A pairs found in this podcast.
      </Typography>
    );
  }

  // Count total Q&A pairs across all chapters
  const totalQAPairs = chapters.reduce(
    (total, chapter) => total + chapter.qaItems.length,
    0
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Podcast Q&A</Typography>
        {videoId && (
          <Button
            variant="outlined"
            size="small"
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {totalQAPairs} question-answer pairs found in {chapters.length} chapters.
        Click on each question to see the answer and supporting quotes.
      </Typography>

      {chapters.map((chapter, chapterIndex) => (
        <Box key={`chapter-${chapterIndex}`} sx={{ mb: 3 }}>
          {/* Chapter Divider with Name */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Divider sx={{ flexGrow: 1, mr: 2 }} />
            <Typography
              variant="subtitle1"
              color="primary"
              sx={{
                fontWeight: 'medium',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.875rem'
              }}
            >
              {chapter.chapterTitle}
            </Typography>
            <Divider sx={{ flexGrow: 1, ml: 2 }} />
          </Box>

          {/* Q&A pairs for this chapter */}
          <Box sx={{ width: '100%' }}>
            {chapter.qaItems.map((qaItem, index) => (
              <Paper
                key={`qa-${chapterIndex}-${index}`}
                variant="outlined"
                sx={{ mb: 2, overflow: 'hidden' }}
              >
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`qa-${chapterIndex}-${index}-content`}
                    id={`qa-${chapterIndex}-${index}-header`}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 'medium',
                          flexGrow: 1
                        }}
                      >
                        Q: {qaItem.question}
                      </Typography>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ pt: 0 }}>
                    <Box>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Answer:
                      </Typography>
                      <Typography variant="body2" paragraph sx={{ pl: 2 }}>
                        {qaItem.answer}
                      </Typography>

                      {qaItem.quotes && qaItem.quotes.length > 0 && (
                        <>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Supporting Quotes:
                          </Typography>
                          <Box sx={{ pl: 2 }}>
                            {qaItem.quotes.map((quote, quoteIndex) => (
                              <Typography 
                                key={`quote-${quoteIndex}`} 
                                variant="body2" 
                                sx={{ 
                                  mb: 1,
                                  fontStyle: 'italic',
                                  borderLeft: '2px solid',
                                  borderColor: 'primary.light',
                                  pl: 1.5,
                                  py: 0.5
                                }}
                              >
                                &quot;{quote}&quot;
                              </Typography>
                            ))}
                          </Box>
                        </>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Paper>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

/**
 * Action metadata for the Podcast Q&A action
 */
export const PodcastQAActionMeta = {
  key: 'podcastqa',
  label: 'Podcast Q&A',
  icon: <QuestionAnswerIcon />,
  description: 'Extract questions and answers from podcast interviews'
};

export default PodcastQARenderer;
