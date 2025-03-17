import React from 'react';
import { Box, Typography, Avatar, Chip, Divider } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { YouTubeVideoDetails } from '../../services/server/youtube/videoService';

interface VideoDetailsProps {
  video: YouTubeVideoDetails;
}

export default function VideoDetails({ video }: VideoDetailsProps) {
  // Pure function to format view count
  const formatViewCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  };

  // Pure function to format like count
  const formatLikeCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return `${count}`;
  };

  // Pure function to format publish date
  const formatPublishDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return `${formatDistanceToNow(date)} ago`;
    } catch (error) {
      return 'Unknown date';
    }
  };

  // Format duration from ISO 8601 duration format (PT1H2M3S)
  const formatDuration = (duration: string): string => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 'Unknown duration';
    
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        {video.title}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Chip 
          label={formatViewCount(video.viewCount)} 
          variant="outlined" 
          size="small" 
          sx={{ mr: 1 }}
        />
        <Chip 
          label={`${formatLikeCount(video.likeCount)} likes`} 
          variant="outlined" 
          size="small" 
          sx={{ mr: 1 }}
        />
        <Chip 
          label={formatDuration(video.duration)} 
          variant="outlined" 
          size="small" 
          sx={{ mr: 1 }}
        />
        <Typography variant="body2" color="text.secondary">
          {formatPublishDate(video.publishedAt)}
        </Typography>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar 
          src={video.channelThumbnail || undefined} 
          alt={video.channelTitle}
          sx={{ mr: 2 }}
        />
        <Typography variant="subtitle1">
          {video.channelTitle}
        </Typography>
      </Box>
      
      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
        {video.description.split('\n').slice(0, 3).join('\n')}
        {video.description.split('\n').length > 3 && '...'}
      </Typography>
    </Box>
  );
}
