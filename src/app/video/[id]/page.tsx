import React from 'react';
import { Box, Container, Grid, Paper, Typography } from '@mui/material';
import VideoPlayer from '../../../components/video/VideoPlayer';
import VideoDetails from '../../../components/video/VideoDetails';
import VideoActions from '../../../components/ai/VideoActions';
import { fetchVideoDetails, YouTubeVideoDetails } from '../../../services/server/youtube/videoService';
import AppLayout from '../../../components/layout/AppLayout';

// This is a server component that fetches video data
export default async function VideoPage({ params }: { params: { id: string } }) {
  const videoId = params.id;
  
  // Fetch video data from the YouTube API
  let videoData: YouTubeVideoDetails | null = null;
  let error = null;
  
  try {
    const response = await fetchVideoDetails(videoId);
    if (response.success) {
      videoData = response.data || null;
    } else {
      error = response.error?.message || 'Failed to fetch video details';
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'An unknown error occurred';
  }
  
  // If we couldn't fetch the video data, show an error
  if (!videoData) {
    return (
      <AppLayout>
        <Container maxWidth="lg">
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h5" color="error" gutterBottom>
              Error Loading Video
            </Typography>
            <Typography color="text.secondary">
              {error || 'Could not load video details. Please try again later.'}
            </Typography>
          </Box>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <VideoPlayer videoId={videoId} />
          </Grid>
          
          <Grid item xs={12}>
            <VideoDetails video={videoData} />
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                AI Actions
              </Typography>
              <VideoActions videoId={videoId} videoTitle={videoData.title} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </AppLayout>
  );
}
