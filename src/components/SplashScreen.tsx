'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

export const SplashScreen = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Hide splash screen after a delay
    const timer = setTimeout(() => {
      setShow(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'background.paper',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.5s ease-out',
      }}
    >
      <Box
        component="img"
        src="/icons/icon-192x192.png"
        alt="App Logo"
        sx={{
          width: 120,
          height: 120,
          mb: 2,
          animation: 'pulse 1.5s infinite ease-in-out',
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(0.95)',
            },
            '50%': {
              transform: 'scale(1)',
            },
            '100%': {
              transform: 'scale(0.95)',
            },
          },
        }}
      />
      <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
        YouTube AI Summarizer
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        Get AI-powered insights from any YouTube video
      </Typography>
      <CircularProgress color="primary" size={40} />
    </Box>
  );
};

export default SplashScreen;
