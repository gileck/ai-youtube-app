'use client';

import React, { useEffect } from 'react';
import { useHistory } from '../../contexts/HistoryContext';
import { YouTubeChannelDetails } from '../../services/server/youtube/types';

interface ChannelViewTrackerProps {
  channelData: YouTubeChannelDetails;
  children: React.ReactNode;
}

export default function ChannelViewTracker({ channelData, children }: ChannelViewTrackerProps) {
  const { addToHistory } = useHistory();
  
  useEffect(() => {
    // Track this channel view in history
    if (channelData) {
      addToHistory({
        id: channelData.id,
        title: channelData.title,
        thumbnail: channelData.thumbnail,
        type: 'channel',
      });
    }
  }, [channelData]);
  
  return <>{children}</>;
}
