import React from 'react';
import { Box, Container, Typography, TextField, Button, Grid, Card, CardMedia, CardContent, InputAdornment, Avatar, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Link from 'next/link';
import AppLayout from '../components/layout/AppLayout';
import { fetchFeaturedChannels } from '../services/server/youtube/channelService';
import { formatNumber } from '../utils/formatters';
import { YouTubeChannelDetails } from '../services/server/youtube/types';

export default async function Home() {
  // Featured channels (with fallback data in case API fails)
  const fallbackChannels: YouTubeChannelDetails[] = [
    {
      id: 'UCXuqSBlHAE6Xw-yeJA0Tunw',
      title: 'Linus Tech Tips',
      description: 'Tech videos, hardware, reviews and more!',
      publishedAt: '2008-11-24T00:00:00Z',
      thumbnail: 'https://yt3.googleusercontent.com/ytc/APkrFKbAfC_5NBQ3CM6_6g_Ls5TgUDTHhNMsECbKfNUH=s176-c-k-c0x00ffffff-no-rj',
      bannerUrl: null,
      subscriberCount: 15700000,
      videoCount: 5800,
      viewCount: 6800000000,
      country: 'CA'
    },
    {
      id: 'UCBJycsmduvYEL83R_U4JriQ',
      title: 'Marques Brownlee',
      description: 'MKBHD: Quality Tech Videos | YouTuber | Geek | Consumer Electronics | Tech Head | Internet Personality!',
      publishedAt: '2008-03-21T00:00:00Z',
      thumbnail: 'https://yt3.googleusercontent.com/ytc/APkrFKZWeMCsx4Q9e_Hm6nhOOUQ3fv96QGUXiMr1-pPP=s176-c-k-c0x00ffffff-no-rj',
      bannerUrl: null,
      subscriberCount: 18000000,
      videoCount: 1500,
      viewCount: 3500000000,
      country: 'US'
    },
    {
      id: 'UCsBjURrPoezykLs9EqgamOA',
      title: 'Fireship',
      description: 'High-intensity code tutorials and tech news to help you ship your app faster',
      publishedAt: '2017-09-12T00:00:00Z',
      thumbnail: 'https://yt3.googleusercontent.com/ytc/APkrFKb--NH6RwAGHYsD3KfxX-SAgWgIHrjR5E4Jb5SDSQ=s176-c-k-c0x00ffffff-no-rj',
      bannerUrl: null,
      subscriberCount: 2500000,
      videoCount: 500,
      viewCount: 300000000,
      country: 'US'
    },
    {
      id: 'UC8butISFwT-Wl7EV0hUK0BQ',
      title: 'freeCodeCamp.org',
      description: 'Learn to code for free',
      publishedAt: '2014-12-16T00:00:00Z',
      thumbnail: 'https://yt3.googleusercontent.com/ytc/APkrFKaqca-xQqiQ7mVl8rEn0uZzrBuCPcxlHSR5G_Dqew=s176-c-k-c0x00ffffff-no-rj',
      bannerUrl: null,
      subscriberCount: 8000000,
      videoCount: 1200,
      viewCount: 1500000000,
      country: 'US'
    }
  ];
  
  // Fetch featured channels with fallback
  let featuredChannels: YouTubeChannelDetails[] = [];
  try {
    const response = await fetchFeaturedChannels(4);
    if (response.success && response.data && response.data.length > 0) {
      featuredChannels = response.data;
    } else {
      // Use fallback data if API fails
      featuredChannels = fallbackChannels;
      console.log('Using fallback channel data');
    }
  } catch (error) {
    console.error('Error fetching featured channels:', error);
    // Use fallback data if API fails
    featuredChannels = fallbackChannels;
    console.log('Using fallback channel data due to error');
  }

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
              placeholder="Enter YouTube URL or search term"
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
              Search
            </Button>
          </Box>
          
          {/* Search Type Links */}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              component={Link}
              href="/search?type=video"
              variant="text"
              size="small"
            >
              Search Videos
            </Button>
            <Button 
              component={Link}
              href="/search?type=channel"
              variant="text"
              size="small"
            >
              Search Channels
            </Button>
          </Box>
        </Box>

        {/* Featured Channels */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Featured Channels
          </Typography>
          <Grid container spacing={3}>
            {featuredChannels.length > 0 ? (
              featuredChannels.map((channel) => (
                <Grid item key={channel.id} xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Avatar
                        component={Link}
                        href={`/channel/${channel.id}`}
                        src={channel.thumbnail}
                        alt={channel.title}
                        sx={{
                          width: 80,
                          height: 80,
                          mb: 2,
                          border: '2px solid #f0f0f0',
                        }}
                      />
                      <Typography 
                        variant="h6" 
                        component={Link}
                        href={`/channel/${channel.id}`}
                        sx={{ 
                          textAlign: 'center',
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        {channel.title}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Chip 
                          label={`${formatNumber(channel.subscriberCount)} subscribers`} 
                          size="small"
                          variant="outlined" 
                        />
                      </Box>
                      <Button 
                        variant="outlined" 
                        component={Link}
                        href={`/channel/${channel.id}`}
                        size="small"
                        sx={{ mt: 2 }}
                      >
                        View Channel
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))
            ) : (
              // Fallback for when channels can't be loaded
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Featured channels could not be loaded
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
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
