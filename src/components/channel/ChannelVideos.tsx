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
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Paper,
  Divider
} from '@mui/material';
import Link from 'next/link';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { formatNumber } from '../../utils/formatters';
import { useHistory } from '../../contexts/HistoryContext';
import { formatDistanceToNow, format } from 'date-fns';

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

// Format publish date
const formatPublishDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error("Error formatting publish date:", error);
    return 'Unknown date';
  }
};

// Format full date
const formatFullDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    console.error("Error formatting full date:", error);
    return 'Unknown date';
  }
};

interface ChannelVideosProps {
  videos: {
    id: string;
    title: string;
    thumbnail: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    duration?: number;
    viewCount?: number;
    likeCount?: number;
  }[];
  viewMode?: 'grid' | 'list';
}

export default function ChannelVideos({ videos, viewMode = 'grid' }: ChannelVideosProps) {
  const { isBookmarked, addToBookmarks, removeFromBookmarks } = useHistory();
  
  const handleBookmarkToggle = (video: {
    id: string;
    title: string;
    thumbnail: string;
    channelId: string;
    channelTitle: string;
  }) => {
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

  // Render videos in list view mode
  if (viewMode === 'list') {
    return (
      <Paper variant="outlined">
        <List sx={{ width: '100%', p: 0 }}>
          {videos.map((video, index) => (
            <React.Fragment key={video.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem 
                alignItems="flex-start"
                sx={{ 
                  py: 2,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  }
                }}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    onClick={() => handleBookmarkToggle(video)}
                    size="small"
                  >
                    {isBookmarked(video.id) ? (
                      <BookmarkIcon fontSize="small" color="primary" />
                    ) : (
                      <BookmarkBorderIcon fontSize="small" />
                    )}
                  </IconButton>
                }
              >
                <ListItemAvatar sx={{ mr: 2 }}>
                  <Box sx={{ position: 'relative', width: 120, height: 68 }}>
                    <Avatar 
                      variant="rounded"
                      src={video.thumbnail}
                      alt={video.title}
                      sx={{ 
                        width: 120, 
                        height: 68,
                        borderRadius: 1
                      }}
                      component={Link}
                      href={`/video/${video.id}`}
                    />
                    {video.duration && (
                      <Chip
                        label={formatDurationLabel(video.duration)}
                        size="small"
                        sx={{
                          position: 'absolute',
                          bottom: 4,
                          right: 4,
                          bgcolor: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          '& .MuiChip-label': {
                            px: 1,
                            fontSize: '0.7rem',
                          },
                          height: 20,
                        }}
                      />
                    )}
                  </Box>
                </ListItemAvatar>
                <ListItemText
                  primary={
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
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            bgcolor: 'rgba(0, 0, 0, 0.05)', 
                            borderRadius: 5,
                            px: 2,
                            py: 0.5,
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.1)',
                            }
                          }}
                        >
                          <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">{formatFullDate(video.publishedAt)}</Typography>
                        </Box>
                        
                        {video.viewCount && (
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              bgcolor: 'rgba(0, 0, 0, 0.05)', 
                              borderRadius: 5,
                              px: 2,
                              py: 0.5,
                              '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.1)',
                              }
                            }}
                          >
                            <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">{formatNumber(video.viewCount)}</Typography>
                          </Box>
                        )}
                        
                        {video.likeCount && (
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              bgcolor: 'rgba(0, 0, 0, 0.05)', 
                              borderRadius: 5,
                              px: 2,
                              py: 0.5,
                              '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.1)',
                              }
                            }}
                          >
                            <ThumbUpIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">{formatNumber(video.likeCount)}</Typography>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>
    );
  }

  // Render videos in grid view mode (default)
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
              
              {/* Added publish date */}
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                {formatPublishDate(video.publishedAt)}
              </Typography>
              
              <Box sx={{ mt: 'auto', pt: 1 }}>
                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
                  {video.viewCount && (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        bgcolor: 'rgba(0, 0, 0, 0.05)', 
                        borderRadius: 5,
                        px: 2,
                        py: 0.5,
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.1)',
                        }
                      }}
                    >
                      <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">{formatNumber(video.viewCount)}</Typography>
                    </Box>
                  )}
                  
                  {video.likeCount && (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        bgcolor: 'rgba(0, 0, 0, 0.05)', 
                        borderRadius: 5,
                        px: 2,
                        py: 0.5,
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.1)',
                        }
                      }}
                    >
                      <ThumbUpIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">{formatNumber(video.likeCount)}</Typography>
                    </Box>
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
