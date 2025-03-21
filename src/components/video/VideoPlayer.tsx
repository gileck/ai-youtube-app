import React from 'react';
import { Box, Paper } from '@mui/material';

interface VideoPlayerProps {
  videoId: string;
  title?: string;
}

export default function VideoPlayer({ videoId, title }: VideoPlayerProps) {
  // Pure function to create YouTube embed URL
  const getEmbedUrl = (id: string): string => {
    return `https://www.youtube.com/embed/${id}`;
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        paddingTop: '52.25%', // Slightly reduced height from 16:9 ratio
        width: '100%',
        maxWidth: '100%',
        bgcolor: 'black',
        mx: 'auto', // Center the player
        boxShadow: (theme) => theme.shadows[3]
      }}
    >
      <Box
        component="iframe"
        src={getEmbedUrl(videoId)}
        title={title || "YouTube video player"}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 0
        }}
      />
    </Paper>
  );
}
