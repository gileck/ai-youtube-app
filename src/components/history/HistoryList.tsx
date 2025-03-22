'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Chip, Button, Divider, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { AIHistoryItem, TopicsResponseData, SummaryResponseData, TopicItem } from '../../services/client/ai/types';
import { getHistoryItems, removeHistoryItem, clearHistory } from '../../services/client/historyService';

export default function HistoryList() {
  const [historyItems, setHistoryItems] = useState<AIHistoryItem[]>([]);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  
  // Load history items on mount
  useEffect(() => {
    setHistoryItems(getHistoryItems());
  }, []);
  
  // Format timestamp to relative time
  const formatTimestamp = (timestamp: number): string => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return 'Unknown time';
    }
  };
  
  // Format cost to currency
  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(4)}`;
  };
  
  // Handle removing a history item
  const handleRemove = (id: string) => {
    if (removeHistoryItem(id)) {
      setHistoryItems(prevItems => prevItems.filter(item => item.id !== id));
    }
  };
  
  // Handle clearing all history
  const handleClearHistory = () => {
    clearHistory();
    setHistoryItems([]);
    setConfirmClearOpen(false);
  };
  
  // Render the result based on its type
  const renderResult = (item: AIHistoryItem): React.ReactNode => {
    // Check if result is a string
    if (typeof item.result === 'string') {
      // For string results (question, keypoints)
      if (item.action === 'question' && item.params.type === 'question') {
        return (
          <>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Q: {item.params.question}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body1">
              A: {item.result}
            </Typography>
          </>
        );
      }
      
      // For keypoints or other string results
      return <Typography variant="body2">{item.result}</Typography>;
    }
    
    // Check if result is a topics response
    if ('chapterTopics' in item.result) {
      const topicsResult = item.result as TopicsResponseData;
      
      return (
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Topics by Chapter
          </Typography>
          
          {topicsResult.chapterTopics.map((chapter, index: number) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">{chapter.title}</Typography>
              <Box sx={{ pl: 2 }}>
                {chapter.topics.map((topic: TopicItem, topicIndex: number) => (
                  <Box key={topicIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ mr: 1 }}>{topic.emoji}</Typography>
                    <Typography variant="body2">{topic.text}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      );
    } else if ('finalSummary' in item.result && 'chapterSummaries' in item.result) {
      // Summary response
      const summaryResult = item.result as SummaryResponseData;
      
      return (
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Summary
          </Typography>
          <Typography paragraph>{summaryResult.finalSummary}</Typography>
          
          {summaryResult.chapterSummaries.length > 0 && (
            <>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Chapter Summaries
              </Typography>
              {summaryResult.chapterSummaries.map((chapter, index: number) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">{chapter.title}</Typography>
                  <Typography variant="body2">{chapter.summary}</Typography>
                </Box>
              ))}
            </>
          )}
        </Box>
      );
    } else {
      // Fallback for unknown structured results
      return (
        <Typography variant="body2">
          {JSON.stringify(item.result, null, 2)}
        </Typography>
      );
    }
  };
  
  return (
    <Box>
      {historyItems.length > 0 ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={() => setConfirmClearOpen(true)}
            >
              Clear History
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {historyItems.map((item) => (
              <Grid item xs={12} key={item.id}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" component={Link} href={`/video/${item.videoId}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
                        {item.videoTitle}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip 
                          label={item.action.charAt(0).toUpperCase() + item.action.slice(1)} 
                          size="small" 
                          color="primary" 
                        />
                        <Chip 
                          label={formatCost(item.cost)} 
                          size="small" 
                          variant="outlined" 
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(item.timestamp)}
                        </Typography>
                      </Box>
                    </Box>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => handleRemove(item.id)}
                    >
                      Remove
                    </Button>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {renderResult(item)}
                </Paper>
              </Grid>
            ))}
          </Grid>
          
          {/* Confirm Clear Dialog */}
          <Dialog
            open={confirmClearOpen}
            onClose={() => setConfirmClearOpen(false)}
          >
            <DialogTitle>Clear History</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to clear all history? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmClearOpen(false)}>Cancel</Button>
              <Button onClick={handleClearHistory} color="error">
                Clear All
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No History Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Your history will appear here after you use AI actions on videos.
          </Typography>
          <Button 
            component={Link} 
            href="/"
            variant="contained" 
            color="primary"
            sx={{ mt: 2 }}
          >
            Go to Home
          </Button>
        </Box>
      )}
    </Box>
  );
}
