'use client';

import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Card,
  CardContent,
  Divider,
  useTheme,
  Collapse,
  CardActionArea
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { KeyTakeawayResponseData } from '../../../../../../types/shared/ai';

// Define the props for the compact renderer component
export interface CompactKeyTakeawayRendererProps {
  result: KeyTakeawayResponseData;
  videoId?: string;
}

/**
 * Renders a compact version of key takeaways for small screens
 */
export const CompactKeyTakeawayRenderer: React.FC<CompactKeyTakeawayRendererProps> = ({ result }) => {
  const theme = useTheme();
  const categories = result.categories || [];
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  // Toggle expansion state for a takeaway item
  const toggleExpand = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Check if an item is expanded
  const isExpanded = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    return !!expandedItems[key];
  };
  
  // Count total recommendations across all categories
  const totalRecommendations = categories.reduce(
    (total, category) => total + category.takeaways.length,
    0
  );

  // If there are no categories or all categories are empty, display a message
  if (categories.length === 0 || categories.every(category => category.takeaways.length === 0)) {
    return (
      <Typography variant="body2">
        No actionable recommendations found in this video.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {totalRecommendations} recommendations in {categories.length} categories
      </Typography>

      {categories.map((category, categoryIndex) => (
        <Box key={`category-${categoryIndex}`} sx={{ mb: 2 }}>
          {/* Modern Category Title */}
          <Box sx={{ mb: 1.5, mt: categoryIndex > 0 ? 2 : 0 }}>
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
              {category.name}
            </Typography>
          </Box>

          {/* Compact Takeaways List */}
          {category.takeaways.map((recommendation, index) => (
            <Card 
              key={`recommendation-${categoryIndex}-${index}`} 
              variant="outlined"
              sx={{ 
                mb: 1, 
                borderRadius: 1,
                '&:last-child': { mb: 0 }
              }}
            >
              <CardActionArea 
                onClick={() => toggleExpand(categoryIndex, index)}
                sx={{ p: 0 }}
              >
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          mr: 1,
                          fontSize: '1.1rem',
                          lineHeight: 1
                        }}
                      >
                        {recommendation.emoji}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 'medium',
                          flexGrow: 1,
                          fontSize: '0.75rem',
                          lineHeight: 1.2
                        }}
                      >
                        {recommendation.recommendation}
                      </Typography>
                    </Box>
                    {isExpanded(categoryIndex, index) ? (
                      <ExpandLessIcon fontSize="small" color="action" />
                    ) : (
                      <ExpandMoreIcon fontSize="small" color="action" />
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
              
              {/* Collapsible Details */}
              <Collapse in={isExpanded(categoryIndex, index)}>
                <CardContent sx={{ 
                  pt: 0, 
                  pb: 1, 
                  px: 1,
                  bgcolor: theme.palette.action.hover,
                  borderTop: `1px solid ${theme.palette.divider}`
                }}>
                  {/* Implementation Details */}
                  <Typography 
                    variant="caption" 
                    color="primary"
                    sx={{ 
                      display: 'block', 
                      fontWeight: 'medium',
                      mb: 0.5
                    }}
                  >
                    Implementation Details:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.7rem',
                      mb: 1,
                      pl: 1
                    }}
                  >
                    {recommendation.details}
                  </Typography>
                  
                  {/* Why It Works */}
                  <Typography 
                    variant="caption" 
                    color="primary"
                    sx={{ 
                      display: 'block', 
                      fontWeight: 'medium',
                      mb: 0.5
                    }}
                  >
                    Why It Works:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.7rem',
                      pl: 1,
                      mb: recommendation.quotes && recommendation.quotes.length > 0 ? 1 : 0
                    }}
                  >
                    {recommendation.mechanism}
                  </Typography>

                  {/* Supporting Quotes */}
                  {recommendation.quotes && recommendation.quotes.length > 0 && (
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
                        {recommendation.quotes.map((quote, quoteIndex) => (
                          <Typography 
                            key={`quote-${categoryIndex}-${index}-${quoteIndex}`} 
                            variant="body2" 
                            sx={{ 
                              mb: quoteIndex < recommendation.quotes.length - 1 ? 0.5 : 0,
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
                </CardContent>
              </Collapse>
            </Card>
          ))}
          
          {categoryIndex < categories.length - 1 && (
            <Divider sx={{ my: 1 }} />
          )}
        </Box>
      ))}
    </Box>
  );
};

export default CompactKeyTakeawayRenderer;
