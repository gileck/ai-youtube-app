'use client';

import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Button, 
  Avatar, 
  IconButton, 
  Tabs, 
  Tab, 
  Alert, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import BookmarkRemoveIcon from '@mui/icons-material/BookmarkRemove';
import Link from 'next/link';
import AppLayout from '../../components/layout/AppLayout';
import { useHistory, BookmarkItem } from '../../contexts/HistoryContext';
import { formatDate } from '../../utils/formatters';

export default function BookmarksPage() {
  const { bookmarks, removeFromBookmarks, clearBookmarks } = useHistory();
  const [tabValue, setTabValue] = React.useState(0);
  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false);

  const videoBookmarks = bookmarks.filter(item => item.type === 'video');
  const channelBookmarks = bookmarks.filter(item => item.type === 'channel');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleClearConfirmOpen = () => {
    setConfirmClearOpen(true);
  };

  const handleClearConfirmClose = () => {
    setConfirmClearOpen(false);
  };

  const handleClearAll = () => {
    clearBookmarks();
    setConfirmClearOpen(false);
  };

  const renderBookmarkItem = (item: BookmarkItem) => {
    if (item.type === 'video') {
      return (
        <Grid item xs={12} sm={6} md={4} key={item.id}>
          <Card sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            position: 'relative',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
            },
          }}>
            <CardMedia
              component="img"
              image={item.thumbnail}
              alt={item.title}
              sx={{ 
                aspectRatio: '16/9',
                objectFit: 'cover',
              }}
            />
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography 
                variant="body1" 
                component={Link} 
                href={`/video/${item.id}`}
                sx={{ 
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                {item.title}
              </Typography>
              
              {item.channelTitle && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  component={Link}
                  href={`/channel/${item.channelId}`}
                  sx={{ 
                    mt: 1,
                    textDecoration: 'none',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  {item.channelTitle}
                </Typography>
              )}
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Bookmarked on {formatDate(item.addedAt)}
              </Typography>
              
              <Box sx={{ mt: 'auto', pt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  component={Link}
                  href={`/video/${item.id}`}
                >
                  View Video
                </Button>
                
                <IconButton 
                  color="error" 
                  size="small"
                  onClick={() => removeFromBookmarks(item.id)}
                  aria-label="remove bookmark"
                >
                  <BookmarkRemoveIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      );
    } else {
      return (
        <Grid item xs={12} sm={6} md={4} key={item.id}>
          <Card sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            position: 'relative',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
            },
          }}>
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                component={Link}
                href={`/channel/${item.id}`}
                src={item.thumbnail}
                alt={item.title}
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
                href={`/channel/${item.id}`}
                sx={{ 
                  textAlign: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                {item.title}
              </Typography>
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Bookmarked on {formatDate(item.addedAt)}
              </Typography>
              
              <Box sx={{ mt: 'auto', pt: 2, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  component={Link}
                  href={`/channel/${item.id}`}
                >
                  View Channel
                </Button>
                
                <IconButton 
                  color="error" 
                  size="small"
                  onClick={() => removeFromBookmarks(item.id)}
                  aria-label="remove bookmark"
                >
                  <BookmarkRemoveIcon />
                </IconButton>
              </Box>
            </Box>
          </Card>
        </Grid>
      );
    }
  };

  return (
    <AppLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Bookmarks
            </Typography>
            
            {bookmarks.length > 0 && (
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<DeleteIcon />}
                onClick={handleClearConfirmOpen}
              >
                Clear All
              </Button>
            )}
          </Box>
          
          {bookmarks.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="h6" color="text.secondary" textAlign="center">
                You don&apos;t have any bookmarks yet
              </Typography>
            </Alert>
          ) : (
            <>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                  aria-label="bookmark tabs"
                >
                  <Tab label={`All (${bookmarks.length})`} />
                  <Tab label={`Videos (${videoBookmarks.length})`} />
                  <Tab label={`Channels (${channelBookmarks.length})`} />
                </Tabs>
              </Box>
              
              <Grid container spacing={3}>
                {tabValue === 0 && bookmarks.map(renderBookmarkItem)}
                {tabValue === 1 && videoBookmarks.map(renderBookmarkItem)}
                {tabValue === 2 && channelBookmarks.map(renderBookmarkItem)}
              </Grid>
            </>
          )}
        </Box>
      </Container>
      
      {/* Confirmation Dialog for Clearing All Bookmarks */}
      <Dialog
        open={confirmClearOpen}
        onClose={handleClearConfirmClose}
      >
        <DialogTitle>Clear All Bookmarks?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove all your bookmarks? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearConfirmClose}>Cancel</Button>
          <Button onClick={handleClearAll} color="error" variant="contained">
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
