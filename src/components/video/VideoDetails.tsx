import React from 'react';
import { Box, Typography, Avatar, Chip, Divider } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { YouTubeVideoDetails } from '../../types/shared/youtube';

interface VideoDetailsProps {
  videoData: YouTubeVideoDetails;
}

export default function VideoDetails({ videoData }: VideoDetailsProps) {
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
      console.error("Error formatting publish date:", error);
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
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Video Title */}
      <Typography variant="h5" component="h1" gutterBottom>
        {videoData.title}
      </Typography>
      
      {/* Channel and Stats */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={videoData.channelThumbnail || undefined} 
            alt={videoData.channelTitle}
            sx={{ mr: 1.5, width: 40, height: 40 }}
          />
          <Box>
            <Typography variant="subtitle1" component="div">
              {videoData.channelTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatPublishDate(videoData.publishedAt)}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            label={formatViewCount(videoData.viewCount)} 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={`${formatLikeCount(videoData.likeCount)} likes`} 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={formatDuration(videoData.duration)} 
            variant="outlined" 
            size="small"
          />
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Description */}
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
        {videoData.description}
      </Typography>
    </Box>
  );
}
