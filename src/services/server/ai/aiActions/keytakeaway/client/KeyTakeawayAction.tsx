'use client';

import React, { useState } from 'react';
import { 
  Typography, 
  List, 
  Box, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Paper,
  Button,
  CircularProgress,
  Divider
} from '@mui/material';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import { KeyTakeawayResponse, KeyTakeawayResponseData, TakeawayCategory } from '../../../../../../types/shared/ai';
import { useApiClient } from '../../../../../../contexts/ApiContext';
import { useSettings } from '../../../../../../contexts/SettingsContext';
import { ACTION_TYPES } from '../../../aiActions/constants';

// Define the props for the renderer component
export interface KeyTakeawayRendererProps {
  result: KeyTakeawayResponse;
  videoId?: string;
}

/**
 * Renders the result of a key takeaway action
 */
export const KeyTakeawayRenderer: React.FC<KeyTakeawayRendererProps> = ({ result, videoId }) => {
  const { apiClient } = useApiClient();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<TakeawayCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Parse the result when the component mounts or when the result changes
  React.useEffect(() => {
    setCategories(result.categories);
  }, [result]);

  // Function to refresh the recommendations
  const handleRefresh = async () => {
    if (!videoId) {
      setError('Video ID is missing. Cannot refresh recommendations.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!apiClient) {
        throw new Error('API client not available');
      }

      const response = await apiClient.processVideo<KeyTakeawayResponseData>({
        videoId,
        action: ACTION_TYPES.KEYTAKEAWAY,
        model: settings.aiModel,
        costApprovalThreshold: settings.costApprovalThreshold,
        skipCache: true,
        params: { type: ACTION_TYPES.KEYTAKEAWAY }
      });

      if (response.success && response.data) {
        setCategories(response.data.result.categories);
      } else {
        throw new Error(response.error?.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error refreshing key takeaways:', error);
      setError('Failed to refresh recommendations. Please try again.');
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

  // If there are no categories or all categories are empty, display a message
  if (categories.length === 0 || categories.every(category => category.takeaways.length === 0)) {
    return (
      <Typography>
        No actionable recommendations found in this video.
      </Typography>
    );
  }

  // Count total recommendations across all categories
  const totalRecommendations = categories.reduce(
    (total, category) => total + category.takeaways.length,
    0
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Key Actionable Recommendations</Typography>
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
        {totalRecommendations} specific recommendations found in {categories.length} categories.
        Click on each recommendation to see more details.
      </Typography>

      {categories.map((category, categoryIndex) => (
        <Box key={`category-${categoryIndex}`} sx={{ mb: 3 }}>
          {/* Category Divider with Name */}
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
              {category.name}
            </Typography>
            <Divider sx={{ flexGrow: 1, ml: 2 }} />
          </Box>

          {/* Takeaways for this category */}
          <List sx={{ width: '100%' }}>
            {category.takeaways.map((recommendation, index) => (
              <Paper
                key={`recommendation-${categoryIndex}-${index}`}
                variant="outlined"
                sx={{ mb: 2, overflow: 'hidden' }}
              >
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`recommendation-${categoryIndex}-${index}-content`}
                    id={`recommendation-${categoryIndex}-${index}-header`}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography
                        variant="h6"
                        sx={{
                          mr: 1.5,
                          fontSize: '1.5rem',
                          lineHeight: 1
                        }}
                      >
                        {recommendation.emoji}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 'medium',
                          flexGrow: 1
                        }}
                      >
                        {recommendation.recommendation}
                      </Typography>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ pt: 0 }}>
                    <Box>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Implementation Details:
                      </Typography>
                      <Typography variant="body2" paragraph sx={{ pl: 2 }}>
                        {recommendation.details}
                      </Typography>

                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Why It Works:
                      </Typography>
                      <Typography variant="body2" paragraph sx={{ pl: 2 }}>
                        {recommendation.mechanism}
                      </Typography>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Paper>
            ))}
          </List>
        </Box>
      ))}
    </Box>
  );
};

/**
 * Action metadata for the Key Takeaway action
 */
export const KeyTakeawayActionMeta = {
  key: 'keytakeaway',
  label: 'Key Takeaways',
  icon: <LightbulbOutlinedIcon />,
  description: 'Extract actionable recommendations from the video'
};

export default KeyTakeawayRenderer;
