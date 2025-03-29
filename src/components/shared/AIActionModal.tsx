'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VideoActions from '../ai/VideoActions';
import { YouTubeVideoDetails } from '../../types/shared/youtube';

interface AIActionModalProps {
  open: boolean;
  onClose: () => void;
  videoData: YouTubeVideoDetails;
  updateAiActionResult?: (videoId: string, result: Record<string, unknown>) => void;
}

export default function AIActionModal({ open, onClose, videoData, updateAiActionResult }: AIActionModalProps) {
  const [loading] = useState(false);

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      aria-labelledby="ai-action-dialog-title"
    >
      <DialogTitle id="ai-action-dialog-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">AI Actions for {videoData.title}</Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
            disabled={loading}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <VideoActions 
            videoId={videoData.id} 
            videoTitle={videoData.title} 
            onResultUpdate={updateAiActionResult ? (result) => updateAiActionResult(videoData.id, result) : undefined}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
