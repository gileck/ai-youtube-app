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
      elevation={0} 
      sx={{ 
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        paddingTop: '56.25%', // 16:9 aspect ratio
        width: '100%',
        bgcolor: 'black'
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
