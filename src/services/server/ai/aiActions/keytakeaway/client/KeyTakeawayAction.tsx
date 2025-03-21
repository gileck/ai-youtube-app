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
  CircularProgress
} from '@mui/material';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import { AIActionParams, AIResponse } from '../../../../../../types/shared/ai';
import { TakeawayItem } from '../types';
import { useApiClient } from '../../../../../../contexts/ApiContext';
import { useSettings } from '../../../../../../contexts/SettingsContext';
import { ACTION_TYPES } from '../../../aiActions/constants';

// Define the props for the renderer component
export interface KeyTakeawayRendererProps {
  result: AIResponse;
  videoId?: string;
}

/**
 * Renders the result of a key takeaway action
 */
export const KeyTakeawayRenderer: React.FC<KeyTakeawayRendererProps> = ({ result, videoId }) => {
  const { apiClient } = useApiClient();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<TakeawayItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Parse the result when the component mounts or when the result changes
  React.useEffect(() => {
    parseResult(result);
  }, [result]);

  // Parse the result into recommendations
  const parseResult = (resultData: AIResponse) => {
    let takeaways: TakeawayItem[] = [];
    
    try {
      // Try to parse the result as an array of chapter takeaways or direct takeaways
      if (Array.isArray(resultData) && resultData.length > 0) {
        // If the first item has a takeaways property, it's a chapter takeaways array
        if ('takeaways' in resultData[0] && Array.isArray(resultData[0].takeaways)) {
          // Extract all takeaways from all chapters
          takeaways = resultData[0].takeaways as TakeawayItem[];
        }
      } else if (resultData && typeof resultData === 'object') {
        // If result has a direct result property that's an array
        if ('result' in resultData && Array.isArray(resultData.result)) {
          // Check if the result contains chapter takeaways
          const firstItem = resultData.result[0];
          if (firstItem && 'takeaways' in firstItem && Array.isArray(firstItem.takeaways)) {
            takeaways = firstItem.takeaways as TakeawayItem[];
          }
        }
      }
      
      // Set the recommendations state
      setRecommendations(takeaways);
      
      // Clear any previous errors
      setError(null);
    } catch (error) {
      console.error('Error parsing key takeaway result:', error);
      setError('Failed to parse recommendations. Please try again.');
    }
  };
  
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
      
      const response = await apiClient.processVideo({
        videoId,
        action: ACTION_TYPES.KEYTAKEAWAY,
        model: settings.aiModel,
        costApprovalThreshold: settings.costApprovalThreshold,
        skipCache: true,
        params: { type: ACTION_TYPES.KEYTAKEAWAY }
      });
      
      if (response.success && response.data) {
        parseResult(response.data.result);
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
  
  // If there are no recommendations, display a message
  if (recommendations.length === 0) {
    return (
      <Typography>
        No actionable recommendations found in this video.
      </Typography>
    );
  }
  
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
        {recommendations.length} specific recommendations found. Click on each recommendation to see more details.
      </Typography>
      
      <List sx={{ width: '100%' }}>
        {recommendations.map((recommendation, index) => (
          <Paper 
            key={`recommendation-${index}`} 
            variant="outlined" 
            sx={{ mb: 2, overflow: 'hidden' }}
          >
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`recommendation-${index}-content`}
                id={`recommendation-${index}-header`}
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
