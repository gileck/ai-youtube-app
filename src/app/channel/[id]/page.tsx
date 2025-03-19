'use client';

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Avatar, 
  Chip, 
  Button, 
  CircularProgress, 
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
  Divider
} from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SortIcon from '@mui/icons-material/Sort';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import AppLayout from '../../../components/layout/AppLayout';
import ChannelVideos from '../../../components/channel/ChannelVideos';
import ChannelViewTracker from '../../../components/channel/ChannelViewTracker';
import { formatNumber } from '../../../utils/formatters';
import { useHistory } from '../../../contexts/HistoryContext';

// This is a client component that fetches and displays channel data
export default function ChannelPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const channelId = params?.id as string;
  
  // Get filter parameters from URL or use defaults
  const sortBy = searchParams?.get('sortBy') || 'date';
  const durationFilter = searchParams?.get('duration') || 'all';
  
  // Map duration filter to actual min/max duration in seconds
  const getDurationValues = (filter: string): { min: number, max: number } => {
    switch (filter) {
      case '10plus':
        return { min: 600, max: 0 }; // 10+ minutes (600 seconds)
      case '30plus':
        return { min: 1800, max: 0 }; // 30+ minutes (1800 seconds)
      case '60plus':
        return { min: 3600, max: 0 }; // 60+ minutes (3600 seconds)
      default:
        return { min: 600, max: 0 }; // Default to 10+ minutes
    }
  };
  
  const { min: minDuration, max: maxDuration } = getDurationValues(durationFilter);
  
  const [channelData, setChannelData] = useState<any>(null);
  const [channelVideos, setChannelVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  
  const { isBookmarked, addToBookmarks, removeFromBookmarks } = useHistory();
  
  // Update URL when filters change
  const updateFilters = (newSortBy: string, newDuration: string) => {
    const params = new URLSearchParams();
    if (newSortBy) params.set('sortBy', newSortBy);
    if (newDuration) params.set('duration', newDuration);
    router.push(`/channel/${channelId}?${params.toString()}`);
  };
  
  // Handle filter changes
  const handleSortChange = (event: SelectChangeEvent) => {
    updateFilters(event.target.value, durationFilter);
  };
  
  const handleDurationChange = (_event: React.MouseEvent<HTMLElement>, newDuration: string) => {
    if (newDuration !== null) {
      updateFilters(sortBy, newDuration);
    }
  };
  
  // Fetch videos with the current filters
  const fetchVideos = async (pageToken: string | null = null, append: boolean = false) => {
    if (!channelId) return;
    
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    
    setError(null);
    
    try {
      // Build the API URL with all parameters
      let apiUrl = `/api/youtube/channel/${channelId}/videos?maxResults=12&sortBy=${sortBy}&minDuration=${minDuration}`;
      if (maxDuration > 0) {
        apiUrl += `&maxDuration=${maxDuration}`;
      }
      if (pageToken) {
        apiUrl += `&pageToken=${pageToken}`;
      }
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.success && data.data) {
        if (append) {
          setChannelVideos(prev => [...prev, ...data.data.videos]);
        } else {
          setChannelVideos(data.data.videos || []);
        }
        
        setNextPageToken(data.data.pagination?.nextPageToken || null);
        setHasMore(data.data.pagination?.hasMore || false);
      } else {
        setError(data.error?.message || 'Failed to fetch videos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };
  
  // Fetch channel data
  useEffect(() => {
    const fetchChannelData = async () => {
      if (!channelId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch channel details
        const channelResponse = await fetch(`/api/youtube/channel/${channelId}`);
        const channelData = await channelResponse.json();
        
        if (channelResponse.ok && channelData.success) {
          setChannelData(channelData.data);
        } else {
          setError(channelData.error?.message || 'Failed to fetch channel details');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    };
    
    fetchChannelData();
  }, [channelId]);
  
  // Fetch videos when filters change
  useEffect(() => {
    if (channelId) {
      fetchVideos(null, false);
    }
  }, [channelId, sortBy, minDuration, maxDuration]);
  
  const handleLoadMore = () => {
    if (nextPageToken) {
      fetchVideos(nextPageToken, true);
    }
  };
  
  const handleBookmarkToggle = () => {
    if (!channelData) return;
    
    if (isBookmarked(channelData.id)) {
      removeFromBookmarks(channelData.id);
    } else {
      addToBookmarks({
        id: channelData.id,
        title: channelData.title,
        thumbnail: channelData.thumbnail,
        type: 'channel',
      });
    }
  };
  
  // Show loading state
  if (isLoading && !channelData) {
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
  
  // If we couldn't fetch the channel data, show an error
  if (!channelData) {
    return (
      <AppLayout>
        <Container maxWidth="lg">
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h5" color="error" gutterBottom>
              Error Loading Channel
            </Typography>
            <Typography color="text.secondary">
              {error || 'Could not load channel details. Please try again later.'}
            </Typography>
          </Box>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ChannelViewTracker channelData={channelData}>
        <Container maxWidth="lg">
          <Box sx={{ py: 4 }}>
            {/* Channel Header */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' }, 
              alignItems: { xs: 'center', md: 'flex-start' },
              gap: 3,
              mb: 4
            }}>
              {/* Channel Avatar */}
              <Avatar
                src={channelData.thumbnail}
                alt={channelData.title}
                sx={{
                  width: { xs: 120, md: 150 },
                  height: { xs: 120, md: 150 },
                  border: '4px solid #f0f0f0',
                }}
              />
              
              {/* Channel Info */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h4" component="h1">
                    {channelData.title}
                  </Typography>
                  <IconButton 
                    onClick={handleBookmarkToggle}
                    color={isBookmarked(channelData.id) ? 'primary' : 'inherit'}
                    aria-label={isBookmarked(channelData.id) ? 'Remove from bookmarks' : 'Add to bookmarks'}
                  >
                    {isBookmarked(channelData.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  </IconButton>
                </Box>
                
                {/* Channel Stats */}
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
                  {channelData.country && (
                    <Chip 
                      label={channelData.country} 
                      variant="outlined" 
                    />
                  )}
                </Box>
                
                {/* Channel Description */}
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {channelData.description.length > 300
                    ? `${channelData.description.substring(0, 300)}...`
                    : channelData.description}
                </Typography>
              </Box>
            </Box>
            
            {/* Video Filters */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="sort-by-label">Sort By</InputLabel>
                  <Select
                    labelId="sort-by-label"
                    id="sort-by"
                    value={sortBy}
                    label="Sort By"
                    onChange={handleSortChange}
                    startAdornment={<SortIcon sx={{ mr: 1 }} />}
                  >
                    <MenuItem value="date">Latest</MenuItem>
                    <MenuItem value="viewCount">Most Popular</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                    Duration:
                  </Typography>
                  <ToggleButtonGroup
                    value={durationFilter}
                    exclusive
                    onChange={handleDurationChange}
                    aria-label="video duration filter"
                    size="small"
                  >
                    <ToggleButton value="all" aria-label="all videos">
                      All
                    </ToggleButton>
                    <ToggleButton value="10plus" aria-label="10+ minute videos">
                      10+ min
                    </ToggleButton>
                    <ToggleButton value="30plus" aria-label="30+ minute videos">
                      30+ min
                    </ToggleButton>
                    <ToggleButton value="60plus" aria-label="60+ minute videos">
                      60+ min
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ mb: 3 }} />
            
            {/* Channel Videos */}
            <Box>
              <Typography variant="h5" component="h2" gutterBottom>
                Videos
              </Typography>
              
              {isLoading && channelVideos.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <ChannelVideos videos={channelVideos} />
                  
                  {/* Load More Button */}
                  {hasMore && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                      <Button 
                        variant="outlined" 
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        startIcon={isLoadingMore ? <CircularProgress size={20} /> : null}
                      >
                        {isLoadingMore ? 'Loading...' : 'Load More Videos'}
                      </Button>
                    </Box>
                  )}
                  
                  {/* No Videos Message */}
                  {channelVideos.length === 0 && !isLoading && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No videos found with the selected filters.
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Container>
      </ChannelViewTracker>
    </AppLayout>
  );
}
