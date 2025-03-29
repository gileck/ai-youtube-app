'use client';

import React, { useState, useCallback, memo } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  useTheme,
  CardActionArea,
  Collapse,
  Button,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { PodcastQAResponseData, QuestionDeepDiveResponseData } from '../../../../../../types/shared/ai';
import { useApiClient } from '../../../../../../contexts/ApiContext';
import { useSettings } from '../../../../../../contexts/SettingsContext';
import { ACTION_TYPES } from '../../../aiActions/constants';
import QuestionDeepDiveDialog from '../../../aiActions/questiondeepdive/client/QuestionDeepDiveDialog';
import { QuestionDeepDiveParams } from '../../../aiActions/questiondeepdive/types';

// Define the props for the compact renderer component
export interface CompactPodcastQARendererProps {
  result: PodcastQAResponseData;
  videoId?: string;
  transcript?: string;
}

// Memoized Q&A item component to prevent unnecessary re-renders
const QAItem = memo(({
  qaItem,
  chapterIndex,
  index,
  isExpanded,
  toggleExpand,
  onFullAnswerClick,
  chapterTitle,
  videoId
}: {
  qaItem: any;
  chapterIndex: number;
  index: number;
  isExpanded: boolean;
  toggleExpand: () => void;
  onFullAnswerClick: (question: string, chapterTitle: string) => void;
  chapterTitle: string;
  videoId?: string;
}) => {
  const theme = useTheme();

  // Memoized answer content to prevent re-rendering when collapsed
  const answerContent = React.useMemo(() => (
    <CardContent sx={{
      pt: 0,
      pb: 1,
      px: 1,
      bgcolor: theme.palette.action.hover,
      borderTop: `1px solid ${theme.palette.divider}`
    }}>
      {/* Answer */}
      <Typography
        variant="caption"
        color="primary"
        sx={{
          display: 'block',
          fontWeight: 'medium',
          mb: 0.5
        }}
      >
        Answer:
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontSize: '0.7rem',
          mb: qaItem.quotes && qaItem.quotes.length > 0 ? 1 : 0,
          pl: 1
        }}
      >
        {qaItem.answer}
      </Typography>

      {/* Supporting Quotes */}
      {qaItem.quotes && qaItem.quotes.length > 0 && (
        <>
          <Typography
            variant="caption"
            color="primary"
            sx={{
              display: 'block',
              fontWeight: 'medium',
              mb: 0.5
            }}
          >
            Supporting Quotes:
          </Typography>
          <Box sx={{ pl: 1 }}>
            {qaItem.quotes.slice(0, 3).map((quote: string, quoteIndex: number) => (
              <Typography
                key={`quote-${quoteIndex}`}
                variant="body2"
                sx={{
                  mb: quoteIndex < Math.min(qaItem.quotes.length, 3) - 1 ? 0.5 : 0,
                  fontSize: '0.7rem',
                  fontStyle: 'italic',
                  borderLeft: '2px solid',
                  borderColor: theme.palette.primary.light,
                  pl: 1,
                  py: 0.3
                }}
              >
                &quot;{quote}&quot;
              </Typography>
            ))}
          </Box>
        </>
      )}

      {/* Full Answer Button */}
      <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          size="small"
          variant="text"
          color="primary"
          startIcon={<ZoomInIcon fontSize="small" />}
          onClick={(e) => {
            e.stopPropagation();
            onFullAnswerClick(qaItem.question, chapterTitle);
          }}
          sx={{
            fontSize: '0.7rem',
            py: 0.5,
            textTransform: 'none'
          }}
        >
          Full Answer
        </Button>
      </Box>
    </CardContent>
  ), [qaItem, theme.palette, chapterTitle, onFullAnswerClick]);

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        borderRadius: 1,
        '&:last-child': { mb: 0 }
      }}
    >
      <CardActionArea
        onClick={toggleExpand}
        sx={{ p: 0 }}
      >
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', flexGrow: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'medium',
                  flexGrow: 1,
                  fontSize: '0.75rem',
                  lineHeight: 1.2
                }}
              >
                Q: {qaItem.question}
              </Typography>
            </Box>
            {isExpanded ? (
              <ExpandLessIcon fontSize="small" color="action" />
            ) : (
              <ExpandMoreIcon fontSize="small" color="action" />
            )}
          </Box>
        </CardContent>
      </CardActionArea>

      {/* Use Collapse for animation but with memoized content */}
      <Collapse in={isExpanded} unmountOnExit>
        {answerContent}
      </Collapse>
    </Card>
  );
});

QAItem.displayName = 'QAItem';

// Memoized chapter component to prevent unnecessary re-renders
const Chapter = memo(({
  chapter,
  chapterIndex,
  expandedItems,
  toggleExpand,
  onFullAnswerClick,
  videoId
}: {
  chapter: any;
  chapterIndex: number;
  expandedItems: Record<string, boolean>;
  toggleExpand: (chapterIndex: number, itemIndex: number) => void;
  onFullAnswerClick: (question: string, chapterTitle: string) => void;
  videoId?: string;
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 2 }}>
      {/* Modern Chapter Title */}
      <Box sx={{ mb: 1.5, mt: chapterIndex > 0 ? 2 : 0 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 500,
            color: theme.palette.primary.main,
            borderBottom: `2px solid ${theme.palette.primary.main}`,
            pb: 0.5,
            display: 'inline-block',
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {chapter.chapterTitle}
        </Typography>
      </Box>

      {/* Compact Q&A List */}
      {chapter.qaItems.map((qaItem: any, index: number) => {
        const isItemExpanded = !!expandedItems[`${chapterIndex}-${index}`];
        return (
          <QAItem
            key={`qa-${chapterIndex}-${index}`}
            qaItem={qaItem}
            chapterIndex={chapterIndex}
            index={index}
            isExpanded={isItemExpanded}
            toggleExpand={() => toggleExpand(chapterIndex, index)}
            onFullAnswerClick={onFullAnswerClick}
            chapterTitle={chapter.chapterTitle}
            videoId={videoId}
          />
        );
      })}
    </Box>
  );
});

Chapter.displayName = 'Chapter';

/**
 * Renders a compact version of podcast Q&A for small screens
 */
export const CompactPodcastQARenderer: React.FC<CompactPodcastQARendererProps> = ({ result, videoId, transcript }) => {
  const theme = useTheme();
  const { apiClient } = useApiClient();
  const { settings } = useSettings();
  const chapters = result.chapters || [];
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState<string | undefined>(undefined);
  const [deepDiveData, setDeepDiveData] = useState<QuestionDeepDiveResponseData | undefined>(undefined);

  // Toggle expansion state for a Q&A item
  const toggleExpand = useCallback((chapterIndex: number, itemIndex: number) => {
    const key = `${chapterIndex}-${itemIndex}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  // Find chapter content by title
  const findChapterContentByTitle = useCallback((title: string): string | undefined => {
    // First try to find the exact chapter in our result
    const chapter = chapters.find(ch =>
      ch.chapterTitle.toLowerCase() === title.toLowerCase() ||
      ch.chapterTitle.toLowerCase().includes(title.toLowerCase()) ||
      title.toLowerCase().includes(ch.chapterTitle.toLowerCase())
    );

    if (chapter) {
      // If we found a matching chapter, return its content from the transcript
      // This is a simplified approach - in a real implementation, you would need to
      // have access to the actual chapter content from the transcript
      return transcript;
    }

    return undefined;
  }, [chapters, transcript]);

  // Handle full answer button click
  const handleFullAnswerClick = useCallback(async (question: string, chapterTitle: string) => {
    if (!apiClient || !videoId) {
      setDialogError("API client or video ID not available");
      setDialogOpen(true);
      return;
    }

    // Find chapter content
    const chapterContent = findChapterContentByTitle(chapterTitle);

    setDialogOpen(true);
    setDialogLoading(true);
    setDialogError(undefined);
    setDeepDiveData(undefined);

    try {
      // Create the params object with the correct structure and proper typing
      const params: QuestionDeepDiveParams = {
        type: ACTION_TYPES.QUESTIONDEEPDIVE,
        question,
        chapterTitle,
        videoId
      };

      // Make the API call with the correct params structure
      const response = await apiClient.processVideo({
        videoId,
        action: ACTION_TYPES.QUESTIONDEEPDIVE,
        model: settings.aiModel,
        costApprovalThreshold: settings.costApprovalThreshold,
        skipCache: !settings.cachingEnabled,
        params
      });

      if (response.success && response.data?.result) {
        setDeepDiveData(response.data.result as any);
      } else {
        setDialogError(response.error?.message || "Failed to get detailed answer");
      }
    } catch (error) {
      console.error("Error fetching deep dive answer:", error);
      setDialogError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setDialogLoading(false);
    }
  }, [apiClient, videoId, settings, findChapterContentByTitle]);

  // Handle dialog close
  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
  }, []);

  // Count total Q&A pairs across all chapters
  const totalQAPairs = chapters.reduce(
    (total, chapter) => total + chapter.qaItems.length,
    0
  );

  // If there are no chapters or all chapters are empty, display a message
  if (chapters.length === 0 || chapters.every(chapter => chapter.qaItems.length === 0)) {
    return (
      <Typography variant="body2">
        No Q&A pairs found in this podcast.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {totalQAPairs} Q&A pairs in {chapters.length} chapters
      </Typography>

      {chapters.map((chapter, chapterIndex) => (
        <React.Fragment key={`chapter-${chapterIndex}`}>
          <Chapter
            chapter={chapter}
            chapterIndex={chapterIndex}
            expandedItems={expandedItems}
            toggleExpand={toggleExpand}
            onFullAnswerClick={handleFullAnswerClick}
            videoId={videoId}
          />

          {chapterIndex < chapters.length - 1 && (
            <Divider sx={{ my: 1 }} />
          )}
        </React.Fragment>
      ))}

      {/* Question Deep Dive Dialog */}
      <QuestionDeepDiveDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        data={deepDiveData}
        loading={dialogLoading}
        error={dialogError}
      />
    </Box>
  );
};

export default CompactPodcastQARenderer;
