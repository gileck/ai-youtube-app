'use client';

import React, { useEffect } from 'react';
import { useHistory } from '../../contexts/HistoryContext';

interface VideoViewTrackerProps {
  videoData: {
    id: string;
    title: string;
    thumbnail: string;
    channelId: string;
    channelTitle: string;
  };
  children: React.ReactNode;
}

/**
 * Component that tracks video views and adds them to history
 */
export const VideoViewTracker: React.FC<VideoViewTrackerProps> = ({ 
  videoData, 
  children 
}) => {
  const { addToHistory } = useHistory();
  
  useEffect(() => {
    if (videoData?.id) {
      // Add to viewed history when component mounts
      addToHistory({
        id: videoData.id,
        title: videoData.title,
        thumbnail: videoData.thumbnail,
        type: 'video',
        channelId: videoData.channelId,
        channelTitle: videoData.channelTitle,
      });
    }
  }, [videoData?.id, videoData]);
  
  return <>{children}</>;
};

export default VideoViewTracker;
