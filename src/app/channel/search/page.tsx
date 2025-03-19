import React from 'react';
import { Box, Container, Typography, TextField, Button, Alert, Card, Avatar, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Link from 'next/link';
import AppLayout from '../../../components/layout/AppLayout';
import { resolveChannelByNameOrHandle } from '../../../services/server/youtube/channelService';
import { formatNumber } from '../../../utils/formatters';
import { YouTubeChannelDetails } from '../../../services/server/youtube/types';

// This is a server component that handles channel search by name or handle
export default async function ChannelSearchPage(props: { 
  searchParams: { q?: string } 
}) {
  // In Next.js, searchParams is asynchronous and must be awaited
  const { searchParams } = props;
  const query = (await searchParams)?.q || '';
  
  // State for channel search results
  let channelData: YouTubeChannelDetails | null = null;
  let error: string | null = null;
  
  // Search for channel if query is provided
  if (query) {
    try {
      const response = await resolveChannelByNameOrHandle(query);
      if (response.success) {
        channelData = response.data || null;
      } else {
        error = response.error?.message || 'Failed to find channel';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    }
  }

  return (
    <AppLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Find a Channel
          </Typography>
          
          {/* Search Form */}
          <Box
            component="form"
            sx={{
              mb: 4,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              gap: 2,
              width: '100%',
            }}
            action="/channel/search"
            method="get"
          >
            <TextField
              fullWidth
              name="q"
              defaultValue={query}
              placeholder="Enter channel name or @handle"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ ml: 1, mr: 0.5, color: 'text.secondary' }} />
                ),
              }}
              helperText="Example: @MKBHD or Marques Brownlee"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ px: 3, whiteSpace: 'nowrap' }}
            >
              Find Channel
            </Button>
          </Box>
          
          {/* Search Instructions */}
          {!query && (
            <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
              <Typography variant="h6" gutterBottom>
                How to Find a Channel
              </Typography>
              <Typography variant="body1" paragraph>
                You can search for a YouTube channel using either:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography>
                    <strong>Channel handle</strong> - Include the @ symbol (e.g., @MKBHD)
                  </Typography>
                </Box>
                <Box component="li">
                  <Typography>
                    <strong>Channel name</strong> - Enter the full channel name (e.g., Marques Brownlee)
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
          
          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}
          
          {/* Channel Result */}
          {channelData && (
            <Box sx={{ mb: 4 }}>
              <Card sx={{ p: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, alignItems: { sm: 'center' } }}>
                <Avatar
                  src={channelData.thumbnail}
                  alt={channelData.title}
                  sx={{
                    width: { xs: 100, sm: 120 },
                    height: { xs: 100, sm: 120 },
                    alignSelf: { xs: 'center', sm: 'flex-start' }
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" gutterBottom>
                    {channelData.title}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip 
                      label={`${formatNumber(channelData.subscriberCount)} subscribers`} 
                      variant="outlined" 
                    />
                    <Chip 
                      label={`${formatNumber(channelData.videoCount)} videos`} 
                      variant="outlined" 
                    />
                    <Chip 
                      label={`${formatNumber(channelData.viewCount)} views`} 
                      variant="outlined" 
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {channelData.description.length > 200 
                      ? `${channelData.description.substring(0, 200)}...` 
                      : channelData.description}
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    component={Link}
                    href={`/channel/${channelData.id}`}
                  >
                    View Channel
                  </Button>
                </Box>
              </Card>
            </Box>
          )}
          
          {query && !channelData && !error && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary">
                Searching for &quot;{query}&quot;...
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </AppLayout>
  );
}
