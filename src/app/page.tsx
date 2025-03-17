import React from 'react';
import { Box, Container, Typography, TextField, Button, Grid, Card, CardMedia, CardContent, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Link from 'next/link';
import AppLayout from '../components/layout/AppLayout';

export default function Home() {
  // Featured videos (in a real app, these would be fetched from an API)
  const featuredVideos = [
    {
      id: 'dQw4w9WgXcQ',
      title: 'Rick Astley - Never Gonna Give You Up',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    },
    {
      id: '9bZkp7q19f0',
      title: 'PSY - GANGNAM STYLE(강남스타일)',
      thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
    },
    {
      id: 'kJQP7kiw5Fk',
      title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
      thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg',
    },
    {
      id: 'JGwWNGJdvx8',
      title: 'Ed Sheeran - Shape of You',
      thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/maxresdefault.jpg',
    },
  ];

  return (
    <AppLayout>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
            mb: 6,
            borderRadius: 2,
            bgcolor: 'rgba(255, 0, 0, 0.05)',
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom>
            YouTube AI Summarizer
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            Get AI-powered insights from any YouTube video
          </Typography>
          
          {/* Search Form */}
          <Box
            component="form"
            sx={{
              mt: 4,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              width: '100%',
              maxWidth: 600,
              mx: 'auto',
            }}
            action="/search"
            method="get"
          >
            <TextField
              fullWidth
              name="q"
              placeholder="Enter YouTube URL or video ID"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              sx={{ px: 4, py: 1.5, borderRadius: 2 }}
            >
              Analyze
            </Button>
          </Box>
        </Box>

        {/* Featured Videos */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Featured Videos
          </Typography>
          <Grid container spacing={3}>
            {featuredVideos.map((video) => (
              <Grid item key={video.id} xs={12} sm={6} md={3}>
                <Card
                  component={Link}
                  href={`/video/${video.id}`}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    textDecoration: 'none',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    image={video.thumbnail}
                    alt={video.title}
                    sx={{ aspectRatio: '16/9' }}
                  />
                  <CardContent>
                    <Typography variant="body1" component="h3">
                      {video.title}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* How It Works */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            How It Works
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  1. Enter a YouTube URL
                </Typography>
                <Typography>
                  Paste any YouTube video URL or ID into the search box
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  2. Choose an AI Action
                </Typography>
                <Typography>
                  Select from summarize, ask a question, or extract key points
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  3. Get AI Insights
                </Typography>
                <Typography>
                  Receive AI-generated insights based on the video content
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </AppLayout>
  );
}
