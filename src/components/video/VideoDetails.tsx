import React, { useState } from 'react';
import { Box, Typography, Avatar, Divider, Button, Card, CardContent, Link } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { YouTubeVideoDetails } from '../../types/shared/youtube';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NextLink from 'next/link';

interface VideoDetailsProps {
  videoData: YouTubeVideoDetails;
}

export const VideoDetails = ({ videoData }: VideoDetailsProps) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

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

  // Function to get a preview of the description
  const getDescriptionPreview = () => {
    const maxLength = 150;
    if (videoData.description.length <= maxLength) return videoData.description;
    return videoData.description.substring(0, maxLength) + '...';
  };

  return (
    <Box>
      {/* Video Title */}
      <Typography variant="h5" component="h1" gutterBottom>
        {videoData.title}
      </Typography>
      
      {/* Channel and Stats */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={videoData.channelThumbnail || undefined} 
            alt={videoData.channelTitle}
            sx={{ mr: 1.5, width: 40, height: 40 }}
          />
          <Box>
            <Typography variant="subtitle1" component="div">
              <Link 
                component={NextLink} 
                href={`/channel/${videoData.channelId}`}
                underline="hover"
                color="inherit"
                sx={{ fontWeight: 'medium' }}
              >
                {videoData.channelTitle}
              </Link>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatPublishDate(videoData.publishedAt)}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              bgcolor: 'rgba(0, 0, 0, 0.05)', 
              borderRadius: 5,
              px: 2,
              py: 1,
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            <VisibilityOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2">{formatViewCount(videoData.viewCount)}</Typography>
          </Box>
          
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              bgcolor: 'rgba(0, 0, 0, 0.05)', 
              borderRadius: 5,
              px: 2,
              py: 1,
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            <ThumbUpOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2">{formatLikeCount(videoData.likeCount)}</Typography>
          </Box>
          
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              bgcolor: 'rgba(0, 0, 0, 0.05)', 
              borderRadius: 5,
              px: 2,
              py: 1,
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2">{formatDuration(videoData.duration)}</Typography>
          </Box>
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Description */}
      <Card variant="outlined" sx={{ bgcolor: 'background.paper', mb: 2 }}>
        <CardContent>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {expanded ? videoData.description : getDescriptionPreview()}
          </Typography>
          
          {videoData.description.length > 150 && (
            <Button 
              onClick={toggleExpanded}
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ mt: 2, textTransform: 'none' }}
              color="primary"
            >
              {expanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
