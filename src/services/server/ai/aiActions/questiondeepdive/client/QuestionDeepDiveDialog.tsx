'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  CircularProgress,
  useTheme,
  useMediaQuery,
  IconButton,
  Paper,
  Chip,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import RefreshIcon from '@mui/icons-material/Refresh';
import CachedIcon from '@mui/icons-material/Cached';
import { QuestionDeepDiveResponseData } from '../../../../../../types/shared/ai';
import { useApiClient } from '../../../../../../contexts/ApiContext';
import { useSettings } from '../../../../../../contexts/SettingsContext';
import { ACTION_TYPES } from '../../../aiActions/constants';

interface QuestionDeepDiveDialogProps {
  open: boolean;
  onClose: () => void;
  data?: QuestionDeepDiveResponseData;
  loading?: boolean;
  error?: string;
  onRefresh?: (skipCache: boolean) => void;
  originalQuestion?: string;
  chapterTitle?: string;
  videoId?: string;
}

/**
 * Dialog component to display the detailed answer for a specific question
 */
export const QuestionDeepDiveDialog: React.FC<QuestionDeepDiveDialogProps> = ({
  open,
  onClose,
  data,
  loading = false,
  error,
  onRefresh,
  originalQuestion,
  chapterTitle,
  videoId
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { apiClient } = useApiClient();
  const { settings } = useSettings();
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Format cost to display in dollars with 4 decimal places
  const formatCost = (cost?: number): string => {
    if (cost === undefined) return 'Unknown';
    return `$${cost.toFixed(4)}`;
  };

  // Handle regenerate button click
  const handleRegenerate = async () => {
    if (!apiClient || !videoId || !originalQuestion || !chapterTitle) {
      return;
    }

    setIsRegenerating(true);

    try {
      // If onRefresh is provided, use it
      if (onRefresh) {
        onRefresh(true);
      } else {
        // Otherwise make the API call directly
        const params = {
          type: ACTION_TYPES.QUESTIONDEEPDIVE,
          question: originalQuestion,
          chapterTitle,
          videoId
        };

        await apiClient.processVideo({
          videoId,
          action: ACTION_TYPES.QUESTIONDEEPDIVE,
          model: settings.aiModel,
          costApprovalThreshold: settings.costApprovalThreshold,
          skipCache: true, // Skip cache to regenerate
          params
        });
      }
    } catch (error) {
      console.error("Error regenerating answer:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 2,
          height: fullScreen ? '100%' : 'auto',
          maxHeight: fullScreen ? '100%' : '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QuestionAnswerIcon color="primary" />
          <Typography variant="h6" component="div" sx={{ fontWeight: 'medium', pr: 2 }}>
            Deep Dive
          </Typography>
        </Box>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close" sx={{ mt: -1 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ pt: 2, pb: 1 }}>
        {loading || isRegenerating ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ my: 2 }}>
            {error}
          </Typography>
        ) : data ? (
          <Box>
            {/* Chapter title */}
            {data.chapterTitle && data.chapterTitle !== 'Unknown Chapter' && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip 
                  label={`Chapter: ${data.chapterTitle}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    fontWeight: 500,
                    borderRadius: 1,
                    height: 'auto',
                    py: 0.5
                  }}
                />
              </Box>
            )}
            
            {/* Question */}
            <Paper 
              elevation={0} 
              sx={{ 
                bgcolor: theme.palette.primary.main + '15', 
                p: 2, 
                mb: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.primary.main}30`
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 500,
                  color: theme.palette.primary.dark
                }}
              >
                Q: {data.answer.question || data.question}
              </Typography>
            </Paper>

            {/* Cache status and cost */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              {/* Cost chip */}
              {data.cost !== undefined && (
                <Tooltip title="Cost of generating this answer">
                  <Chip
                    label={`Cost: ${formatCost(data.cost)}`}
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ 
                      fontWeight: 500,
                      borderRadius: 1,
                      height: 'auto',
                      py: 0.5
                    }}
                  />
                </Tooltip>
              )}
              
              {/* Cache status chip */}
              {data.isCached !== undefined && (
                <Chip
                  icon={<CachedIcon fontSize="small" />}
                  label={data.isCached ? "Cached" : "Fresh"}
                  size="small"
                  color={data.isCached ? "success" : "info"}
                  variant="outlined"
                  sx={{ 
                    fontWeight: 500,
                    borderRadius: 1,
                    height: 'auto',
                    py: 0.5
                  }}
                />
              )}
            </Box>

            {/* Short answer */}
            <Paper 
              elevation={0} 
              sx={{ 
                bgcolor: theme.palette.background.default, 
                p: 2, 
                mb: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {data.answer.shortAnswer}
              </Typography>
            </Paper>

            {/* Detailed points */}
            <Typography 
              variant="subtitle1" 
              sx={{ 
                mb: 1, 
                fontWeight: 500,
                color: theme.palette.text.primary
              }}
            >
              Key Points
            </Typography>
            <Box sx={{ mb: 3 }}>
              {data.answer.detailedPoints.map((point, index) => (
                <Box 
                  key={`point-${index}`} 
                  sx={{ 
                    display: 'flex', 
                    mb: 1.5,
                    '&:last-child': { mb: 0 }
                  }}
                >
                  <Box 
                    sx={{ 
                      minWidth: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1.5,
                      mt: 0.3,
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {point}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Supporting quotes */}
            {data.answer.quotes && data.answer.quotes.length > 0 && (
              <>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 1.5, 
                    mt: 3,
                    fontWeight: 500,
                    color: theme.palette.text.primary
                  }}
                >
                  Supporting Quotes
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {data.answer.quotes.map((quote, index) => (
                    <Paper
                      key={`quote-${index}`}
                      variant="outlined"
                      sx={{ 
                        p: 1.5, 
                        mb: 2, 
                        borderRadius: 1,
                        borderColor: theme.palette.divider,
                        borderLeft: `4px solid ${theme.palette.primary.main}`,
                        '&:last-child': { mb: 0 }
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontStyle: 'italic',
                          color: theme.palette.text.secondary
                        }}
                      >
                        "{quote}"
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </>
            )}

            {/* Additional context */}
            {data.answer.additionalContext && (
              <>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 1, 
                    mt: 3,
                    fontWeight: 500,
                    color: theme.palette.text.primary
                  }}
                >
                  Additional Context
                </Typography>
                <Typography variant="body2" paragraph>
                  {data.answer.additionalContext}
                </Typography>
              </>
            )}
          </Box>
        ) : (
          <Typography color="text.secondary" sx={{ my: 2 }}>
            No data available
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          onClick={handleRegenerate}
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          disabled={loading || isRegenerating || !videoId || !originalQuestion}
        >
          Regenerate
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionDeepDiveDialog;
