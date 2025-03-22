#!/usr/bin/env node

/**
 * Script to fetch YouTube video transcripts using youtubei.js
 * 
 * Usage:
 * node scripts/youtubei-transcript.js VIDEO_ID
 * 
 * Example:
 * node scripts/youtubei-transcript.js dQw4w9WgXcQ
 */

import { Innertube } from 'youtubei.js/web';

/**
 * Format milliseconds to a readable time format (MM:SS)
 * @param {number} ms - Time in milliseconds
 * @returns {string} - Formatted time string
 */
function formatTime(ms) {
  if (typeof ms !== 'number' || isNaN(ms)) {
    return '00:00';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Fetch transcript for a YouTube video
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Array>} - Array of transcript segments with start_ms and text
 */
async function fetchTranscript(videoId) {
  try {
    // Initialize the Innertube client
    const youtube = await Innertube.create({
      lang: 'en',
      location: 'US',
      retrieve_player: false,
    });
    
    // Get the video info
    const info = await youtube.getInfo(videoId);
    
    // Get the transcript
    const transcriptData = await info.getTranscript();
    
    if (!transcriptData || !transcriptData.transcript || !transcriptData.transcript.content) {
      throw new Error('No transcript available for this video');
    }
    
    // Extract transcript segments
    const segments = transcriptData.transcript.content.body.initial_segments || [];
    
    if (segments.length === 0) {
      throw new Error('No transcript segments found');
    }
    
    // Return the segments in a clean format
    return segments.map(segment => {
      // Convert start_ms from string to number
      const startMs = parseInt(segment.start_ms, 10);
      
      return {
        start_ms: startMs,
        end_ms: parseInt(segment.end_ms, 10),
        text: segment.snippet.text,
        start_time_text: segment.start_time_text?.text || formatTime(startMs)
      };
    });
  } catch (error) {
    console.error('Error fetching transcript:', error.message);
    throw error;
  }
}

async function main() {
  // Get video ID from command line arguments
  const videoId = process.argv[2];

  if (!videoId) {
    console.error('Please provide a YouTube video ID as an argument');
    console.error('Example: node scripts/youtubei-transcript.js dQw4w9WgXcQ');
    process.exit(1);
  }

  console.log(`Fetching transcript for video ID: ${videoId}`);

  try {
    // Fetch the transcript
    const transcript = await fetchTranscript(videoId);
    
    console.log('\nTranscript:');
    console.log('===========\n');

    // Print each transcript segment with timestamp
    transcript.forEach(segment => {
      // Use the formatted start time from the API if available, otherwise format it ourselves
      const timeDisplay = segment.start_time_text || formatTime(segment.start_ms);
      console.log(`[${timeDisplay}] ${segment.text}`);
    });

    console.log(`\nTotal transcript segments: ${transcript.length}`);
    
    // Example of how to get full text
    const fullText = transcript.map(segment => segment.text).join(' ');
    console.log(`\nFull transcript length: ${fullText.length} characters`);
    
  } catch (error) {
    console.error('Failed to fetch transcript:');
    console.error(error.message);
    process.exit(1);
  }
}

// Execute the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
