'use client';

import React from 'react';
import { Typography, List, ListItem, ListItemIcon, ListItemText, Box } from '@mui/material';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import CircleIcon from '@mui/icons-material/Circle';
import { AIActionParams, AIResponse } from '../../../../../../types/shared/ai';

// Define the props for the renderer component
export interface KeypointsRendererProps {
  result: AIResponse;
  params?: AIActionParams;
}

/**
 * Renders the result of a keypoints action
 */
export const KeypointsRenderer: React.FC<KeypointsRendererProps> = ({ result }) => {
  // For keypoints, the result is a string with bullet points
  const resultText = result as string;
  
  // Split the result into individual bullet points
  const keypoints = resultText.split('\n').filter(line => line.trim().startsWith('- '));
  
  // If there are no bullet points, just display the raw text
  if (keypoints.length === 0) {
    return <Typography>{resultText}</Typography>;
  }
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Key Points</Typography>
      <List>
        {keypoints.map((keypoint, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <CircleIcon fontSize="small" color="primary" sx={{ fontSize: '0.8rem' }} />
            </ListItemIcon>
            <ListItemText 
              primary={keypoint.replace('- ', '')} 
              primaryTypographyProps={{ variant: 'body1' }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

/**
 * Action metadata for the Keypoints action
 */
export const KeypointsActionMeta = {
  key: 'keypoints',
  label: 'Key Points',
  icon: <FormatListBulletedIcon />,
  description: 'Extract the main points from the video'
};

export default KeypointsRenderer;
