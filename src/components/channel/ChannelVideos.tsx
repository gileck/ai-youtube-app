'use client';

import React, { useState } from 'react';
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
  Divider,
  Collapse,
  Tabs,
  Tab,
  Button,
  Link as MuiLink,
  useTheme
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DescriptionIcon from '@mui/icons-material/Description';
import TopicIcon from '@mui/icons-material/Topic';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { formatNumber, decodeHtmlEntities } from '../../utils/formatters';
import { useHistory } from '../../contexts/HistoryContext';
import { formatDistanceToNow, format } from 'date-fns';
import AIActionModal from '../shared/AIActionModal';
import CompactVideoActions from '../ai/CompactVideoActions';
import { useMediaQuery } from '@mui/material';

// Format duration for display
const formatDurationLabel = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
};

// Format full date
const formatFullDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    return 'Unknown date';
  }
};

// Format publish date
const formatPublishDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return 'Unknown date';
  }
};

/**
 * TruncatedVideoTitle component that truncates the title and handles click behavior
 */
interface TruncatedVideoTitleProps {
  title: string;
  videoId: string;
  maxLength?: number;
  sx?: any;
}

function TruncatedVideoTitle({ title, videoId, maxLength = 63, sx = {} }: TruncatedVideoTitleProps) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const decodedTitle = decodeHtmlEntities(title);

  const isTruncated = decodedTitle.length > maxLength;
  const displayTitle = expanded || !isTruncated
    ? decodedTitle
    : `${decodedTitle.substring(0, maxLength)}...`;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (expanded || !isTruncated) {
      // If already expanded or not truncated, navigate to video page
      router.push(`/video/${videoId}`);
    } else {
      // First click - expand the title
      setExpanded(true);
    }
  };

  return (
    <Typography
      variant="body1"
      onClick={handleClick}
      sx={{
        fontWeight: 'medium',
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        '&:hover': {
          color: 'primary.main',
        },
        mb: 1,
        fontSize: { xs: '0.9rem', sm: '0.9rem' },
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        whiteSpace: 'normal',
        lineHeight: 1.3,
        ...sx
      }}
    >
      {displayTitle}
    </Typography>
  );
}

// Define the video type for reuse
export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  duration?: number;
  viewCount?: number;
  likeCount?: number;
  description?: string;
}

// Shared props for video components
interface VideoComponentProps {
  video: VideoItem;
  isBookmarked: (id: string) => boolean;
  handleBookmarkToggle: (video: VideoItem) => void;
  expandedVideoId: string | null;
  handleExpandToggle: (videoId: string) => void;
  activeTab: Record<string, number>;
  handleTabChange: (videoId: string, newValue: number) => void;
  expandedDescriptions: Record<string, boolean>;
  toggleDescriptionExpand: (videoId: string) => void;
  openAiActionModal: (video: VideoItem) => void;
  truncateDescription: (text: string, maxLength?: number) => string;
  aiActionResults: Record<string, Record<string, unknown>>;
}

// Shared tab content component
function VideoTabContent({ 
  video, 
  activeTab, 
  expandedDescriptions, 
  toggleDescriptionExpand, 
  openAiActionModal, 
  truncateDescription,
  aiActionResults,
  updateAiActionResult
}: Pick<VideoComponentProps, 'video' | 'activeTab' | 'expandedDescriptions' | 'toggleDescriptionExpand' | 'openAiActionModal' | 'truncateDescription' | 'aiActionResults'> & { updateAiActionResult: (videoId: string, result: Record<string, unknown>) => void }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      {/* Description Tab */}
      {(activeTab[video.id] || 0) === 0 && (
        <Box>
          <Typography variant="body2" sx={{ fontSize: '0.8rem', whiteSpace: 'pre-line' }}>
            {video.description ?
              (expandedDescriptions[video.id] ?
                decodeHtmlEntities(video.description) :
                truncateDescription(decodeHtmlEntities(video.description))
              ) :
              'No description available.'
            }
          </Typography>
          {video.description && video.description.length > 150 && (
            <MuiLink
              component="button"
              variant="body2"
              onClick={() => toggleDescriptionExpand(video.id)}
              sx={{
                fontSize: '0.7rem',
                mt: 0.5,
                display: 'block',
                textAlign: 'right',
                width: '100%',
                color: 'primary.main',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              {expandedDescriptions[video.id] ? 'See less' : 'See more...'}
            </MuiLink>
          )}
        </Box>
      )}

      {/* AI Actions Tab */}
      {(activeTab[video.id] || 0) === 1 && (
        <Box>
          {isMobile ? (
            <CompactVideoActions 
              videoId={video.id} 
              videoTitle={video.title} 
              existingResult={aiActionResults[video.id]}
              onResultUpdate={(result: Record<string, unknown>) => updateAiActionResult(video.id, result)}
            />
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 1 }}>
                Use AI to analyze this video content
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<SmartToyIcon />}
                onClick={() => openAiActionModal(video)}
                sx={{ fontSize: '0.75rem' }}
              >
                Open AI Actions
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* More Tab */}
      {(activeTab[video.id] || 0) === 2 && (
        <Stack spacing={1}>
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            Channel: {video.channelTitle}
          </Typography>
          {video.likeCount && (
            <Typography variant="body2" sx={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
              <ThumbUpIcon fontSize="small" sx={{ mr: 1 }} />
              {formatNumber(video.likeCount)} likes
            </Typography>
          )}
          <Button
            variant="outlined"
            size="small"
            component={Link}
            href={`/video/${video.id}`}
            sx={{ mt: 1, fontSize: '0.75rem' }}
          >
            View Full Details
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="secondary"
            component="a"
            href={`/api/chapters-transcript?videoId=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mt: 1, fontSize: '0.75rem' }}
          >
            FULL TRANSCRIPT
          </Button>
        </Stack>
      )}
    </>
  );
}

// Shared tab navigation component
function VideoTabs({ video, activeTab, handleTabChange }: Pick<VideoComponentProps, 'video' | 'activeTab' | 'handleTabChange'>) {
  return (
    <Tabs
      value={activeTab[video.id] || 0}
      onChange={(_, newValue) => handleTabChange(video.id, newValue)}
      variant="fullWidth"
      sx={{
        minHeight: 28,
        '& .MuiTab-root': {
          minHeight: 28,
          py: 0,
          fontSize: '0.65rem',
          minWidth: 0
        }
      }}
    >
      <Tab
        label="Description"
        sx={{ fontSize: '0.65rem', px: 1 }}
      />
      <Tab
        label="AI Actions"
        sx={{ fontSize: '0.65rem', px: 1 }}
      />
      <Tab
        label="More"
        sx={{ fontSize: '0.65rem', px: 1 }}
      />
    </Tabs>
  );
}

// List view component
function VideoListView({ 
  videos, 
  isBookmarked, 
  handleBookmarkToggle, 
  expandedVideoId, 
  handleExpandToggle, 
  activeTab, 
  handleTabChange, 
  expandedDescriptions, 
  toggleDescriptionExpand, 
  openAiActionModal, 
  truncateDescription,
  aiActionResults,
  updateAiActionResult
}: { videos: VideoItem[] } & Omit<VideoComponentProps, 'video'> & { updateAiActionResult: (videoId: string, result: Record<string, unknown>) => void }) {
  return (
    <Box sx={{ width: '100%' }}>
      <List sx={{
        width: '100%',
        p: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 0, sm: 1 }
      }}>
        {videos.map((video, index) => (
          <React.Fragment key={video.id}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                borderBottom: { xs: '1px solid', sm: 'none' },
                borderColor: 'divider',
              }}
            >
              {/* Main content area */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  width: '100%',
                  p: { xs: 1, sm: 2 },
                  pb: { xs: 0.5, sm: 1 },
                }}
              >
                {/* Thumbnail */}
                <Box
                  component={Link}
                  href={`/video/${video.id}`}
                  sx={{
                    position: 'relative',
                    width: { xs: 160, sm: 160 },
                    minWidth: { xs: 160, sm: 160 },
                    height: { xs: 90, sm: 90 },
                    borderRadius: 1,
                    overflow: 'hidden',
                    mr: 2,
                    display: 'block',
                    textDecoration: 'none',
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

                {/* Content */}
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <TruncatedVideoTitle
                    title={video.title}
                    videoId={video.id}
                  />
                </Box>
              </Box>

              {/* Metadata bar - separate flex item under both image and text */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: { xs: 1, sm: 2 },
                  pb: { xs: 0.5, sm: 1 },
                  pt: 0,
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                  }}
                >
                  {formatFullDate(video.publishedAt)} {video.viewCount ? `• ${formatNumber(video.viewCount)} views` : ''}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {/* Expand button */}
                  <IconButton
                    size="small"
                    onClick={() => handleExpandToggle(video.id)}
                    sx={{ mr: 0.5 }}
                  >
                    {expandedVideoId === video.id ? (
                      <ExpandLessIcon fontSize="small" />
                    ) : (
                      <ExpandMoreIcon fontSize="small" />
                    )}
                  </IconButton>

                  {/* Bookmark button */}
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
                </Box>
              </Box>

              {/* Collapsible description box */}
              <Collapse in={expandedVideoId === video.id}>
                <Box
                  sx={{
                    bgcolor: 'action.hover',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {/* Tabs */}
                  <VideoTabs 
                    video={video} 
                    activeTab={activeTab} 
                    handleTabChange={handleTabChange} 
                  />

                  {/* Tab Panels */}
                  <Box sx={{ px: { xs: 1, sm: 2 }, pb: { xs: 1, sm: 1.5 }, pt: 1 }}>
                    <VideoTabContent
                      video={video}
                      activeTab={activeTab}
                      expandedDescriptions={expandedDescriptions}
                      toggleDescriptionExpand={toggleDescriptionExpand}
                      openAiActionModal={openAiActionModal}
                      truncateDescription={truncateDescription}
                      aiActionResults={aiActionResults}
                      updateAiActionResult={updateAiActionResult}
                    />
                  </Box>
                </Box>
              </Collapse>
            </Box>
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
}

// Grid view component
function VideoGridView({ 
  videos, 
  isBookmarked, 
  handleBookmarkToggle, 
  expandedVideoId, 
  handleExpandToggle, 
  activeTab, 
  handleTabChange, 
  expandedDescriptions, 
  toggleDescriptionExpand, 
  openAiActionModal, 
  truncateDescription,
  aiActionResults,
  updateAiActionResult
}: { videos: VideoItem[] } & Omit<VideoComponentProps, 'video'> & { updateAiActionResult: (videoId: string, result: Record<string, unknown>) => void }) {
  return (
    <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
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

            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: { xs: 1, sm: 2, md: 2.5 } }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <TruncatedVideoTitle
                  title={video.title}
                  videoId={video.id}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, px: { xs: 0.5, sm: 0 } }}
                />
              </Box>

              {/* Bottom metadata bar */}
              <Box sx={{
                mt: 'auto',
                pt: 1,
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                  }}
                >
                  {formatFullDate(video.publishedAt)} {video.viewCount ? `• ${formatNumber(video.viewCount)} views` : ''}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {/* Expand button */}
                  <IconButton
                    size="small"
                    onClick={() => handleExpandToggle(video.id)}
                    sx={{ mr: 0.5 }}
                  >
                    {expandedVideoId === video.id ? (
                      <ExpandLessIcon fontSize="small" />
                    ) : (
                      <ExpandMoreIcon fontSize="small" />
                    )}
                  </IconButton>

                  {/* Bookmark button */}
                  <IconButton
                    size="small"
                    onClick={() => handleBookmarkToggle(video)}
                    sx={{ ml: 0 }}
                  >
                    {isBookmarked(video.id) ? (
                      <BookmarkIcon fontSize="small" color="primary" />
                    ) : (
                      <BookmarkBorderIcon fontSize="small" />
                    )}
                  </IconButton>
                </Box>
              </Box>

              {/* Collapsible description box */}
              <Collapse in={expandedVideoId === video.id}>
                <Box
                  sx={{
                    bgcolor: 'action.hover',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    mt: 1
                  }}
                >
                  {/* Tabs */}
                  <VideoTabs 
                    video={video} 
                    activeTab={activeTab} 
                    handleTabChange={handleTabChange} 
                  />

                  {/* Tab Panels */}
                  <Box sx={{ px: { xs: 1, sm: 1.5 }, pb: { xs: 1, sm: 1.5 }, pt: 1 }}>
                    <VideoTabContent
                      video={video}
                      activeTab={activeTab}
                      expandedDescriptions={expandedDescriptions}
                      toggleDescriptionExpand={toggleDescriptionExpand}
                      openAiActionModal={openAiActionModal}
                      truncateDescription={truncateDescription}
                      aiActionResults={aiActionResults}
                      updateAiActionResult={updateAiActionResult}
                    />
                  </Box>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

interface ChannelVideosProps {
  videos: VideoItem[];
  viewMode?: 'grid' | 'list';
}

export default function ChannelVideos({ videos, viewMode = 'grid' }: ChannelVideosProps) {
  const { isBookmarked, addToBookmarks, removeFromBookmarks } = useHistory();
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, number>>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [aiActionModalOpen, setAiActionModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [aiActionResults, setAiActionResults] = useState<Record<string, Record<string, unknown>>>({});

  const handleBookmarkToggle = (video: VideoItem) => {
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

  const handleExpandToggle = (videoId: string) => {
    setExpandedVideoId(expandedVideoId === videoId ? null : videoId);
    // Initialize tab state for this video if it's being expanded
    if (expandedVideoId !== videoId) {
      setActiveTab(prev => ({ ...prev, [videoId]: 0 }));
    }
  };

  const handleTabChange = (videoId: string, newValue: number) => {
    setActiveTab(prev => ({ ...prev, [videoId]: newValue }));
  };

  const toggleDescriptionExpand = (videoId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
  };

  const openAiActionModal = (video: VideoItem) => {
    setSelectedVideo(video);
    setAiActionModalOpen(true);
  };

  const closeAiActionModal = () => {
    setAiActionModalOpen(false);
    setSelectedVideo(null);
  };

  const updateAiActionResult = (videoId: string, result: Record<string, unknown>) => {
    setAiActionResults(prev => ({
      ...prev,
      [videoId]: result
    }));
  };

  // Truncate description to a specific length
  const truncateDescription = (text: string, maxLength = 150) => {
    if (!text) return 'No description available.';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (videos.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No videos found
        </Typography>
      </Box>
    );
  }

  // Shared props for both view components
  const sharedProps = {
    isBookmarked,
    handleBookmarkToggle,
    expandedVideoId,
    handleExpandToggle,
    activeTab,
    handleTabChange,
    expandedDescriptions,
    toggleDescriptionExpand,
    openAiActionModal,
    truncateDescription,
    aiActionResults,
    updateAiActionResult
  };

  return (
    <>
      {/* Render the appropriate view based on viewMode */}
      {viewMode === 'list' ? (
        <VideoListView videos={videos} {...sharedProps} />
      ) : (
        <VideoGridView videos={videos} {...sharedProps} />
      )}

      {/* AI Action Modal */}
      {aiActionModalOpen && selectedVideo && (
        <AIActionModal
          open={aiActionModalOpen}
          onClose={closeAiActionModal}
          videoData={{
            id: selectedVideo.id,
            title: selectedVideo.title,
            channelId: selectedVideo.channelId,
            channelTitle: selectedVideo.channelTitle,
            publishedAt: selectedVideo.publishedAt,
            thumbnail: selectedVideo.thumbnail,
            viewCount: selectedVideo.viewCount || 0,
            likeCount: selectedVideo.likeCount || 0,
            description: selectedVideo.description || '',
            duration: selectedVideo.duration ? String(selectedVideo.duration) : '0',
            channelThumbnail: null,
            commentCount: 0
          }}
          updateAiActionResult={updateAiActionResult}
        />
      )}
    </>
  );
}
