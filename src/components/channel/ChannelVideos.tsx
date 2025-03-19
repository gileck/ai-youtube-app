'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Chip,
  Stack,
  IconButton
} from '@mui/material';
import Link from 'next/link';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { formatNumber } from '../../utils/formatters';
import { useHistory } from '../../contexts/HistoryContext';

// Format duration for display
const formatDurationLabel = (seconds: number) => {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  } else {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  }
};

interface ChannelVideosProps {
  videos: any[];
}

export default function ChannelVideos({ videos }: ChannelVideosProps) {
  const { isBookmarked, addToBookmarks, removeFromBookmarks } = useHistory();
  
  const handleBookmarkToggle = (video: any) => {
    if (isBookmarked(video.id)) {
      removeFromBookmarks(video.id);
    } else {
      addToBookmarks({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        type: 'video',
        channelId: video.channelId,
        channelTitle: video.channelTitle,
      });
    }
  };

  if (videos.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No videos found for this channel.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {videos.map((video) => (
        <Grid item xs={12} sm={6} md={4} key={video.id}>
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
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component={Link}
                href={`/video/${video.id}`}
                sx={{
                  paddingTop: '56.25%', // 16:9 aspect ratio
                  position: 'relative',
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
              
              {/* Duration Badge */}
              {video.duration && (
                <Chip
                  label={formatDurationLabel(video.duration)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    '& .MuiChip-label': {
                      px: 1,
                    },
                  }}
                />
              )}
            </Box>
            
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                    mb: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.2,
                  }}
                >
                  {video.title}
                </Typography>
                
                <IconButton 
                  size="small" 
                  onClick={() => handleBookmarkToggle(video)}
                  sx={{ ml: 1, flexShrink: 0 }}
                >
                  {isBookmarked(video.id) ? (
                    <BookmarkIcon fontSize="small" color="primary" />
                  ) : (
                    <BookmarkBorderIcon fontSize="small" />
                  )}
                </IconButton>
              </Box>
              
              <Box sx={{ mt: 'auto', pt: 1 }}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {video.viewCount && (
                    <Chip
                      icon={<VisibilityIcon fontSize="small" />}
                      label={formatNumber(video.viewCount)}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  
                  {video.likeCount && (
                    <Chip
                      icon={<ThumbUpIcon fontSize="small" />}
                      label={formatNumber(video.likeCount)}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
