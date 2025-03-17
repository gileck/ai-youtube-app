import React from 'react';
import { Box, Container, Typography, Grid, Card, CardMedia, CardContent, TextField, Button, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Link from 'next/link';
import AppLayout from '../../components/layout/AppLayout';
import { fetchSearchResults, YouTubeSearchResult } from '../../services/server/youtube/searchService';

// This is a server component that handles search
export default async function SearchPage(props: { 
  searchParams: { q?: string } 
}) {
  // In Next.js 15, searchParams is asynchronous and must be awaited
  const { searchParams } = props;
  const query = (await searchParams)?.q || '';
  
  // Fetch search results from the YouTube API
  let searchResults: YouTubeSearchResult[] = [];
  let error = null;
  
  if (query) {
    try {
      const response = await fetchSearchResults(query);
      if (response.success) {
        searchResults = response.data || [];
      } else {
        error = response.error?.message || 'Failed to fetch search results';
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
            Search Results
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
            action="/search"
            method="get"
          >
            <TextField
              fullWidth
              name="q"
              defaultValue={query}
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
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ px: 3, whiteSpace: 'nowrap' }}
            >
              Search
            </Button>
          </Box>
          
          {/* Error Message */}
          {error && (
            <Box sx={{ mb: 4, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}
          
          {/* Search Results */}
          {query ? (
            searchResults.length > 0 ? (
              <Grid container spacing={3}>
                {searchResults.map((video: YouTubeSearchResult) => (
                  <Grid item xs={12} key={video.id}>
                    <Card 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        height: '100%'
                      }}
                    >
                      <CardMedia
                        component={Link}
                        href={`/video/${video.id}`}
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
                          src={video.thumbnail}
                          alt={video.title}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </CardMedia>
                      <CardContent sx={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column' }}>
                        <Typography 
                          variant="h6" 
                          component={Link}
                          href={`/video/${video.id}`}
                          sx={{ 
                            textDecoration: 'none',
                            color: 'inherit',
                            '&:hover': {
                              color: 'primary.main',
                            },
                          }}
                        >
                          {video.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {video.channelTitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(video.publishedAt).toLocaleDateString()}
                        </Typography>
                        <Box sx={{ mt: 'auto', pt: 2 }}>
                          <Button 
                            variant="contained" 
                            color="primary"
                            component={Link}
                            href={`/video/${video.id}`}
                            size="small"
                          >
                            Analyze with AI
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
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
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary">
                Enter a search term or YouTube URL to get started
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </AppLayout>
  );
}
