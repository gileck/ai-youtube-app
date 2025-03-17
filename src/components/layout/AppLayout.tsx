'use client';

import React, { ReactNode } from 'react';
import { Box, Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Header from './Header';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { ApiProvider } from '../../contexts/ApiContext';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#FF0000', // YouTube red
    },
    secondary: {
      main: '#282828', // YouTube dark
    },
    background: {
      default: '#f9f9f9', // YouTube light gray background
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
  },
});

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SettingsProvider>
        <ApiProvider>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
              {children}
            </Container>
          </Box>
        </ApiProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
