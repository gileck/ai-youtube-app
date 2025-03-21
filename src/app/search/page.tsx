'use client';

import React, { Suspense } from 'react';
import { Box, Container, Typography, Grid, Card, CardMedia, CardContent, TextField, Button, InputAdornment, ToggleButtonGroup, ToggleButton, Avatar, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '../../components/layout/AppLayout';
import { useHistory } from '../../contexts/HistoryContext';
import { formatDate } from '../../utils/formatters';

// Loading component for Suspense fallback
const SearchPageLoading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
    <CircularProgress />
  </Box>
);

// Separate component that uses useSearchParams
const SearchPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';
  const type = searchParams?.get('type') || 'video';
  
  const [searchQuery, setSearchQuery] = React.useState(query);
  const [searchType, setSearchType] = React.useState(type === 'channel' ? 'channel' : 'video');
  const [searchResults, setSearchResults] = React.useState<{
    id: string;
    title: string;
    description?: string;
    thumbnail: string;
    publishedAt?: string;
    channelId?: string;
    channelTitle?: string;
    type?: string;
    viewCount?: number;
    subscriberCount?: number;
    videoCount?: number;
    duration?: number;
    durationFormatted?: string;
  }[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const { recentVideos, recentChannels, addToBookmarks, removeFromBookmarks, isBookmarked } = useHistory();

  // Fetch search results when query or type changes
  React.useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setSearchResults([]);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const endpoint = type === 'channel' 
          ? `/api/youtube/channels?q=${encodeURIComponent(query)}&sortBy=popularity`
          : `/api/youtube/search?q=${encodeURIComponent(query)}&type=video`;
          
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.success) {
          setSearchResults(data.data || []);
        } else {
          setError(data.error?.message || 'Failed to fetch search results');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [query, type]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=${searchType}`);
    }
  };
  
  const handleTypeChange = (_event: React.MouseEvent<HTMLElement>, newType: string | null) => {
    if (newType) {
      setSearchType(newType as 'video' | 'channel');
    }
  };
  
  const handleBookmarkToggle = (item: {
    id: string;
    title: string;
    thumbnail: string;
    type?: string;
    channelId?: string;
    channelTitle?: string;
  }) => {
    const bookmarkItem = {
      id: item.id,
      title: item.title,
      thumbnail: item.thumbnail,
      type: (item.type || 'video') as 'video' | 'channel',
      channelId: item.channelId || '',
      channelTitle: item.channelTitle || '',
    };
    
    if (isBookmarked(item.id)) {
      removeFromBookmarks(item.id);
    } else {
      addToBookmarks(bookmarkItem);
    }
  };

  return (
    <AppLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4, borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', my: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {query ? 'Search Results' : 'Search'}
          </Typography>
          
          {/* Search Form */}
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{
              mb: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              width: '100%',
              p: 3,
              borderRadius: 2,
              border: '1px solid #eaeaea',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <TextField
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter YouTube URL or search query"
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: 'text.primary',
                  },
                  '& .MuiInputAdornment-root': {
                    color: 'text.primary',
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ px: 3, whiteSpace: 'nowrap', height: { sm: 40 } }}
              >
                Search
              </Button>
            </Box>
            
            {/* Search Type Toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ToggleButtonGroup
                value={searchType}
                exclusive
                onChange={handleTypeChange}
                aria-label="search type"
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 3,
                    py: 0.5,
                    borderRadius: '4px !important',
                    textTransform: 'none',
                    fontWeight: 500,
                  },
                  '& .Mui-selected': {
                    backgroundColor: 'primary.main !important',
                    color: 'white !important',
                  }
                }}
              >
                <ToggleButton value="video" aria-label="videos">
                  <VideoLibraryIcon sx={{ mr: 1 }} />
                  Videos
                </ToggleButton>
                <ToggleButton value="channel" aria-label="channels">
                  <AccountCircleIcon sx={{ mr: 1 }} />
                  Channels
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
          
          {/* Error Message */}
          {error && (
            <Box sx={{ mb: 4, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}
          
          {/* Search Results or Recently Viewed */}
          {query ? (
            // Search Results
            isLoading ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography>Loading results...</Typography>
              </Box>
            ) : searchResults.length > 0 ? (
              <Grid container spacing={3}>
                {searchResults.map((result: {
                  id: string;
                  title: string;
                  thumbnail: string;
                  publishedAt?: string;
                  channelId?: string;
                  channelTitle?: string;
                  description?: string;
                  viewCount?: number;
                  duration?: number;
                  durationFormatted?: string;
                  type?: string;
                }) => (
                  <Grid item xs={12} key={result.id}>
                    {result.type === 'channel' || type === 'channel' ? (
                      // Channel Card
                      <Card 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'column', sm: 'row' },
                          height: '100%'
                        }}
                      >
                        <Box
                          sx={{
                            width: { xs: '100%', sm: 200 },
                            height: { xs: 200, sm: 200 },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'grey.100',
                          }}
                        >
                          <Avatar
                            component={Link}
                            href={`/channel/${result.id}`}
                            src={result.thumbnail}
                            alt={result.title}
                            sx={{
                              width: 120,
                              height: 120,
                              '&:hover': {
                                opacity: 0.9,
                              },
                            }}
                          />
                        </Box>
                        <CardContent sx={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <Typography 
                              variant="h6" 
                              component={Link}
                              href={`/channel/${result.id}`}
                              sx={{ 
                                textDecoration: 'none',
                                color: 'inherit',
                                '&:hover': {
                                  color: 'primary.main',
                                },
                              }}
                            >
                              {result.title}
                            </Typography>
                            <Button
                              onClick={() => handleBookmarkToggle(result)}
                              color={isBookmarked(result.id) ? 'primary' : 'inherit'}
                              sx={{ minWidth: 'auto', p: 1 }}
                            >
                              {isBookmarked(result.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                            </Button>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                            Channel • {result.publishedAt ? formatDate(result.publishedAt) : 'Unknown date'}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            component={Link}
                            href={`/channel/${result.channelId || ''}`}
                            sx={{ 
                              mt: 1,
                              textDecoration: 'none',
                              '&:hover': {
                                color: 'primary.main',
                              },
                            }}
                          >
                            {result.channelTitle || 'Unknown'}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              mb: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {result.description && result.description.length > 0 
                              ? result.description 
                              : 'No description available'}
                          </Typography>
                          <Box sx={{ mt: 'auto' }}>
                            <Button 
                              variant="contained" 
                              color="primary"
                              component={Link}
                              href={`/channel/${result.id}`}
                              size="small"
                            >
                              View Channel
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    ) : (
                      // Video Card
                      <Card 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'column', sm: 'row' },
                          height: '100%'
                        }}
                      >
                        <CardMedia
                          component={Link}
                          href={`/video/${result.id}`}
                          sx={{
                            width: { xs: '100%', sm: 320 },
                            height: { xs: 180, sm: 180 },
                            flexShrink: 0,
                            position: 'relative',
                            '&:hover': {
                              opacity: 0.9,
                            },
                          }}
                        >
                          <Box
                            component="img"
                            src={result.thumbnail}
                            alt={result.title}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        </CardMedia>
                        <CardContent sx={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <Typography 
                              variant="h6" 
                              component={Link}
                              href={`/video/${result.id}`}
                              sx={{ 
                                textDecoration: 'none',
                                color: 'inherit',
                                '&:hover': {
                                  color: 'primary.main',
                                },
                              }}
                            >
                              {result.title}
                            </Typography>
                            <Button
                              onClick={() => handleBookmarkToggle(result)}
                              color={isBookmarked(result.id) ? 'primary' : 'inherit'}
                              sx={{ minWidth: 'auto', p: 1 }}
                            >
                              {isBookmarked(result.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                            </Button>
                          </Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            component={Link}
                            href={`/channel/${result.channelId}`}
                            sx={{ 
                              mt: 1,
                              textDecoration: 'none',
                              '&:hover': {
                                color: 'primary.main',
                              },
                            }}
                          >
                            {result.channelTitle}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {result.publishedAt ? formatDate(result.publishedAt) : 'Unknown date'}
                          </Typography>
                          <Box sx={{ mt: 'auto', pt: 2 }}>
                            <Button 
                              variant="contained" 
                              color="primary"
                              component={Link}
                              href={`/video/${result.id}`}
                              size="small"
                            >
                              Analyze with AI
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="text.secondary">
                  No results found for &quot;{query}&quot;
                </Typography>
              </Box>
            )
          ) : (
            // Recently Viewed Content
            <Box>
              {/* Recently Viewed Videos */}
              {recentVideos.length > 0 && (
                <Box sx={{ mb: 6 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Recently Viewed Videos
                  </Typography>
                  <Grid container spacing={3}>
                    {recentVideos.slice(0, 4).map((video) => (
                      <Grid item xs={12} sm={6} md={3} key={video.id}>
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
                          <CardMedia
                            component={Link}
                            href={`/video/${video.id}`}
                            sx={{
                              position: 'relative',
                              paddingTop: '56.25%', // 16:9 aspect ratio
                            }}
                          >
                            <Box
                              component="img"
                              src={video.thumbnail}
                              alt={video.title}
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          </CardMedia>
                          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                              <Typography 
                                variant="body1" 
                                component={Link} 
                                href={`/video/${video.id}`}
                                sx={{ 
                                  fontWeight: 'medium',
                                  textDecoration: 'none',
                                  color: 'inherit',
                                  '&:hover': {
                                    color: 'primary.main',
                                  },
                                }}
                              >
                                {video.title.length > 60 ? `${video.title.substring(0, 60)}...` : video.title}
                              </Typography>
                              <Button
                                onClick={() => handleBookmarkToggle(video)}
                                color={isBookmarked(video.id) ? 'primary' : 'inherit'}
                                sx={{ minWidth: 'auto', p: 0.5 }}
                              >
                                {isBookmarked(video.id) ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                              </Button>
                            </Box>
                            
                            {video.channelTitle && (
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                component={Link}
                                href={`/channel/${video.channelId}`}
                                sx={{ 
                                  mt: 1,
                                  textDecoration: 'none',
                                  '&:hover': {
                                    color: 'primary.main',
                                  },
                                }}
                              >
                                {video.channelTitle}
                              </Typography>
                            )}
                            
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', pt: 1 }}>
                              Viewed {formatDate(video.viewedAt)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
              
              {/* Recently Viewed Channels */}
              {recentChannels.length > 0 && (
                <Box sx={{ mb: 6 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Recently Viewed Channels
                  </Typography>
                  <Grid container spacing={3}>
                    {recentChannels.slice(0, 4).map((channel) => (
                      <Grid item xs={12} sm={6} md={3} key={channel.id}>
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
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
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
                              <Button
                                onClick={() => handleBookmarkToggle(channel)}
                                color={isBookmarked(channel.id) ? 'primary' : 'inherit'}
                                sx={{ minWidth: 'auto', ml: 1 }}
                              >
                                {isBookmarked(channel.id) ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                              </Button>
                            </Box>
                            
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                              Viewed {formatDate(channel.viewedAt)}
                            </Typography>
                            
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
                    ))}
                  </Grid>
                </Box>
              )}
              
              {recentVideos.length === 0 && recentChannels.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="h6" color="text.primary">
                    Enter a search term or YouTube URL to get started
                  </Typography>
                  <Typography variant="body1" color="text.primary" sx={{ mt: 2 }}>
                    Your recently viewed videos and channels will appear here
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Container>
    </AppLayout>
  );
};

// This is a client component that handles search
export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageLoading />}>
      <SearchPageContent />
    </Suspense>
  );
}
