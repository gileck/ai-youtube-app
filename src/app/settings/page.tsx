import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import AppLayout from '../../components/layout/AppLayout';
import SettingsPanel from '../../components/settings/SettingsPanel';

export default function SettingsPage() {
  return (
    <AppLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            App Settings
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            Configure your AI model, caching preferences, and cost thresholds
          </Typography>
          
          <SettingsPanel />
        </Box>
      </Container>
    </AppLayout>
  );
}
