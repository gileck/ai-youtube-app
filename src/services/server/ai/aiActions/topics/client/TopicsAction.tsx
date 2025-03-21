'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  Paper,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { AIActionParams, AIResponse } from '../../../../../../types/shared/ai';
import { TopicsResponse, ChapterTopics, TopicItem } from '../types';

// Define the props for the renderer component
export interface TopicsRendererProps {
  result: AIResponse;
  params?: AIActionParams;
}

/**
 * Topic item component with expand functionality
 */
const TopicListItem: React.FC<{ topic: TopicItem }> = ({ topic }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Check if topic has bullet points
  const hasBulletPoints = topic.bulletPoints && topic.bulletPoints.length > 0;

  return (
    <Paper
      elevation={1}
      sx={{
        mb: 1,
        p: 1,
        borderRadius: 2,
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 3,
          bgcolor: 'rgba(0, 0, 0, 0.01)'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <Typography variant="h6" sx={{ mr: 1, fontSize: '1.2rem' }}>
            {topic.emoji}
          </Typography>
          <Typography variant="body1">
            {topic.text}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size="small" onClick={toggleExpand}>
            <ExpandMoreIcon
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }}
              fontSize="small"
            />
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {hasBulletPoints && (
          <Box sx={{ mt: 1.5, pl: 4 }}>
            <List dense disablePadding>
              {topic.bulletPoints.map((point, index) => (
                <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 24 }}>
                    <FiberManualRecordIcon sx={{ fontSize: 8 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={point}
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Box sx={{ mt: 2, pl: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Topic Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="Explain in detail"
              size="small"
              color="primary"
              variant="outlined"
              onClick={() => { }}
            />
            <Chip
              label="Generate questions"
              size="small"
              color="secondary"
              variant="outlined"
              onClick={() => { }}
            />
            <Chip
              label="Find related content"
              size="small"
              color="info"
              variant="outlined"
              onClick={() => { }}
            />
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

/**
 * Chapter component with collapsible topics
 */
const ChapterTopicsAccordion: React.FC<{ chapter: ChapterTopics }> = ({ chapter }) => {
  const [expanded, setExpanded] = useState(true);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Paper
        elevation={2}
        sx={{
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Box
          onClick={handleToggle}
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            cursor: 'pointer'
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {chapter.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip
              label={`${chapter.topics.length} topics`}
              size="small"
              sx={{
                mr: 1,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'inherit'
              }}
            />
            <ExpandMoreIcon
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }}
            />
          </Box>
        </Box>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ p: 2 }}>
            {chapter.topics.map((topic, topicIndex) => (
              <TopicListItem key={topicIndex} topic={topic} />
            ))}
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};

/**
 * Renders the result of a topics action
 */
export const TopicsRenderer: React.FC<TopicsRendererProps> = ({ result }) => {
  // If the result is a string (shouldn't happen for topics), just display it
  if (typeof result === 'string') {
    return <Typography>{result}</Typography>;
  }

  // Cast the result to the expected type
  const topicsResult = result as unknown as TopicsResponse;

  // Calculate total topics count
  const totalTopics = topicsResult.chapterTopics.reduce(
    (total, chapter) => total + chapter.topics.length, 0
  );

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FormatListBulletedIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Video Topics</Typography>
          <Chip
            label={`${totalTopics} topics in ${topicsResult.chapterTopics.length} chapters`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ ml: 2 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Key topics from the video organized by chapter. Click on a topic to see more actions.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Chapter Topics Section */}
      <Box>
        {topicsResult.chapterTopics.map((chapter, index) => (
          <ChapterTopicsAccordion
            key={index}
            chapter={chapter}
          />
        ))}
      </Box>
    </Box>
  );
};

/**
 * Action metadata for the Topics action
 */
export const TopicsActionMeta = {
  key: 'topics',
  label: 'Topics',
  icon: <FormatListBulletedIcon />,
  description: 'Outline all topics in the video with emoji-prefixed one-liners'
};

export default TopicsRenderer;
