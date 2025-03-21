'use client';

import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Paper, Typography, CircularProgress } from '@mui/material';
import { useParams } from 'next/navigation';
import VideoPlayer from '../../../components/video/VideoPlayer';
import { VideoDetails } from '../../../components/video/VideoDetails';
import VideoActions from '../../../components/ai/VideoActions';
import VideoViewTracker from '../../../components/video/VideoViewTracker';
import { YouTubeVideoDetails } from '../../../types/shared/youtube';
import AppLayout from '../../../components/layout/AppLayout';

// This is a client component that fetches and displays video data
export default function VideoPage() {
  const params = useParams();
  const videoId = params?.id as string;

  const [videoData, setVideoData] = useState<YouTubeVideoDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVideoData = async () => {
      if (!videoId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/youtube/video?videoId=${videoId}`);
        const data = await response.json();

        if (data.success) {
          setVideoData(data.data || null);
        } else {
          setError(data.error?.message || 'Failed to fetch video details');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId]);

  // Show loading state
  if (isLoading) {
    return (
      <AppLayout>
        <Container maxWidth="lg">
          <Box sx={{ py: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
          </Box>
        </Container>
      </AppLayout>
    );
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
      <VideoViewTracker videoData={videoData}>
        <Container maxWidth="lg">
          <Box sx={{ py: 4 }}>
            <Grid container spacing={4}>
              {/* Main Content Column */}
              <Grid item xs={12} md={8} lg={9}>
                {/* Video Player - Reduced size */}
                <Box sx={{ mb: 4, maxWidth: '100%' }}>
                  <VideoPlayer videoId={videoData.id} title={videoData.title} />
                </Box>

                {/* Video Details */}
                <Paper sx={{ p: 3, mb: 4 }}>
                  <VideoDetails videoData={videoData} />
                </Paper>

                {/* AI Actions - Moved under video details */}
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    AI Actions
                  </Typography>
                  <VideoActions videoId={videoData.id} videoTitle={videoData.title} />
                </Paper>
              </Grid>

              {/* Sidebar for future content (recommendations, etc.) */}
              <Grid item xs={12} md={4} lg={3}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Related Content
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recommendations will appear here in future updates.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </VideoViewTracker>
    </AppLayout>
  );
}
