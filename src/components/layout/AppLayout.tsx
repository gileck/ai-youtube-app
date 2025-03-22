'use client';

import React, { ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import Header from './Header';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Container component="main" sx={{ flexGrow: 1, py: { xs: 1, sm: 2, md: 3 }, px: { xs: 0, sm: 2 } }}>
        {children}
      </Container>
    </Box>
  );
}
