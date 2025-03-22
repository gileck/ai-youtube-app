'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Avatar, 
  Chip, 
  Button, 
  CircularProgress, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  IconButton
} from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import SortIcon from '@mui/icons-material/Sort';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
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
  const viewMode = searchParams?.get('view') || 'grid';
  
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
  
  const [channelData, setChannelData] = useState<{
    id: string;
    title: string;
    description: string;
    publishedAt: string;
    thumbnail: string;
    bannerUrl: string | null;
    subscriberCount: number;
    videoCount: number;
    viewCount: number;
    country: string | null;
    type: string;
  } | null>(null);
  const [channelVideos, setChannelVideos] = useState<{
    id: string;
    title: string;
    description: string;
    publishedAt: string;
    channelId: string;
    channelTitle: string;
    thumbnail: string;
    type: string;
    duration: number;
    durationFormatted: string;
    viewCount: number;
    likeCount: number;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  
  const { isBookmarked, addToBookmarks, removeFromBookmarks } = useHistory();
  
  // Update URL when filters change
  const updateFilters = (newSortBy: string, newDuration: string, newViewMode: string) => {
    const params = new URLSearchParams();
    if (newSortBy) params.set('sortBy', newSortBy);
    if (newDuration) params.set('duration', newDuration);
    if (newViewMode) params.set('view', newViewMode);
    router.push(`/channel/${channelId}?${params.toString()}`);
  };
  
  // Handle filter changes
  const handleSortChange = (event: SelectChangeEvent) => {
    updateFilters(event.target.value, durationFilter, viewMode);
  };
  
  const handleDurationChange = (_event: React.MouseEvent<HTMLElement>, newDuration: string) => {
    if (newDuration !== null) {
      updateFilters(sortBy, newDuration, viewMode);
    }
  };

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newViewMode: string) => {
    if (newViewMode !== null) {
      updateFilters(sortBy, durationFilter, newViewMode);
    }
  };
  
  // Fetch videos with the current filters
  const fetchVideos = useCallback(async (pageToken: string | null = null, append: boolean = false) => {
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
  }, [channelId, sortBy, minDuration, maxDuration]);
  
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
  }, [channelId, sortBy, minDuration, maxDuration, fetchVideos]);
  
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
        <Container maxWidth="lg" sx={{ px: 0 }}>
          <Box sx={{ py: { xs: 1, sm: 2 } }}>
            <Box sx={{ py: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress />
            </Box>
          </Box>
        </Container>
      </AppLayout>
    );
  }
  
  // If we couldn't fetch the channel data, show an error
  if (!channelData) {
    return (
      <AppLayout>
        <Container maxWidth="lg" sx={{ px: 0 }}>
          <Box sx={{ py: { xs: 1, sm: 2 } }}>
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="h5" color="error" gutterBottom>
                Error Loading Channel
              </Typography>
              <Typography color="text.secondary">
                {error || 'Could not load channel details. Please try again later.'}
              </Typography>
            </Box>
          </Box>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ChannelViewTracker channelData={channelData}>
        <Container maxWidth="lg" sx={{ px: 0 }}>
          <Box sx={{ py: { xs: 1, sm: 2 } }}>
            {/* Channel Header */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                gap: { xs: 1, sm: 2 }
              }}>
                <Avatar 
                  src={channelData.thumbnail} 
                  alt={channelData.title}
                  sx={{ 
                    width: { xs: 60, sm: 80 }, 
                    height: { xs: 60, sm: 80 }, 
                    mr: { xs: 1, sm: 2 }
                  }}
                />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography 
                      variant="h4" 
                      component="h1"
                      sx={{ 
                        fontSize: { xs: '1.5rem', sm: '2.125rem' },
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal'
                      }}
                    >
                      {channelData.title}
                    </Typography>
                    <IconButton 
                      onClick={handleBookmarkToggle} 
                      sx={{ ml: 1 }}
                      aria-label={isBookmarked(channelId) ? "Remove from bookmarks" : "Add to bookmarks"}
                    >
                      {isBookmarked(channelId) ? (
                        <BookmarkIcon color="primary" />
                      ) : (
                        <BookmarkBorderIcon />
                      )}
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, mt: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`${formatNumber(channelData.subscriberCount)} subscribers`} 
                      variant="outlined"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    />
                    <Chip 
                      label={`${formatNumber(channelData.videoCount)} videos`} 
                      variant="outlined"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    />
                    <Chip 
                      label={`${formatNumber(channelData.viewCount)} views`} 
                      variant="outlined"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    />
                  </Box>
                </Box>
              </Box>
              
              {channelData.description && (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mt: 2, 
                    mb: 3,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'normal'
                  }}
                >
                  {channelData.description}
                </Typography>
              )}
              
              <Divider sx={{ mb: 3 }} />
            </Box>
            
            {/* Filters */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3, 
              flexWrap: 'wrap', 
              gap: { xs: 1, sm: 2 }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel id="sort-select-label" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Sort By</InputLabel>
                  <Select
                    labelId="sort-select-label"
                    id="sort-select"
                    value={sortBy}
                    label="Sort By"
                    onChange={handleSortChange}
                    startAdornment={<SortIcon sx={{ mr: 1 }} />}
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    <MenuItem value="date" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Date (newest)</MenuItem>
                    <MenuItem value="viewCount" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>View Count</MenuItem>
                    <MenuItem value="rating" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Rating</MenuItem>
                  </Select>
                </FormControl>
                
                <ToggleButtonGroup
                  value={durationFilter}
                  exclusive
                  onChange={handleDurationChange}
                  aria-label="duration filter"
                  size="small"
                  sx={{ '& .MuiToggleButton-root': { fontSize: { xs: '0.7rem', sm: '0.8rem' } } }}
                >
                  <ToggleButton value="all" aria-label="all durations">
                    All
                  </ToggleButton>
                  <ToggleButton value="10plus" aria-label="10+ minutes">
                    10+ min
                  </ToggleButton>
                  <ToggleButton value="30plus" aria-label="30+ minutes">
                    30+ min
                  </ToggleButton>
                  <ToggleButton value="60plus" aria-label="60+ minutes">
                    1+ hour
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* View Mode Toggle */}
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="view mode"
                size="small"
              >
                <ToggleButton value="grid" aria-label="grid view">
                  <GridViewIcon />
                </ToggleButton>
                <ToggleButton value="list" aria-label="list view">
                  <ViewListIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            
            {/* Loading State */}
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* Videos Grid */}
                <ChannelVideos videos={channelVideos} viewMode={viewMode as 'grid' | 'list'} />
                
                {/* Load More Button */}
                {hasMore && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Button 
                      variant="outlined" 
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      startIcon={isLoadingMore ? <CircularProgress size={20} /> : null}
                    >
                      {isLoadingMore ? 'Loading...' : 'Load More'}
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
        </Container>
      </ChannelViewTracker>
    </AppLayout>
  );
}
