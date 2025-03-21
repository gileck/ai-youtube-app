import AppLayout from "@/components/layout/AppLayout";
import { Container, Box, Typography } from '@mui/material';
import MonitoringDashboard from '@/components/monitoring/MonitoringDashboard';

export default function MonitoringPage() {
  return (
    <AppLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Usage Monitoring
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            Track your API usage and costs
          </Typography>

          <MonitoringDashboard />
        </Box>
      </Container>
    </AppLayout>
  );
}
