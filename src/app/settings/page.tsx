import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { Container, Box, Typography } from '@mui/material';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import MuiLink from '@mui/material/Link';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import Paper from '@mui/material/Paper';
import SettingsPanel from '@/components/settings/SettingsPanel';

export default function SettingsPage() {
  return (
    <AppLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
            <MuiLink
              component={Link}
              href="/"
              sx={{ display: 'flex', alignItems: 'center' }}
              underline="hover"
              color="inherit"
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
              Home
            </MuiLink>
            <Typography
              sx={{ display: 'flex', alignItems: 'center' }}
              color="text.primary"
            >
              <SettingsIcon sx={{ mr: 0.5 }} fontSize="small" />
              Settings
            </Typography>
          </Breadcrumbs>

          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              mb: 3
            }}
          >
            <SettingsIcon sx={{ mr: 1.5, fontSize: '1.5em', color: 'primary.main' }} />
            Application Settings
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            paragraph
            sx={{ mb: 4, maxWidth: '800px' }}
          >
            Configure your AI model preferences, cost thresholds, and caching settings. These settings will be applied to all future AI operations across the application.
          </Typography>

          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <SettingsPanel />
          </Paper>
        </Box>
      </Container>
    </AppLayout>
  );
}
