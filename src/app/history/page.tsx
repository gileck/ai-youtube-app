import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import AppLayout from '../../components/layout/AppLayout';
import HistoryList from '../../components/history/HistoryList';

export default function HistoryPage() {
  return (
    <AppLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            AI Action History
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            View your past AI actions and results
          </Typography>
          
          <HistoryList />
        </Box>
      </Container>
    </AppLayout>
  );
}
