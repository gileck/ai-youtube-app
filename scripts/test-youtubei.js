#!/usr/bin/env node

/**
 * Test script for youtubei.js to fetch and log a YouTube video transcript
 * 
 * Usage:
 * node scripts/test-youtubei.js VIDEO_ID
 * 
 * Example:
 * node scripts/test-youtubei.js dQw4w9WgXcQ
 */

import { Innertube } from 'youtubei.js';

/**
 * Format seconds to a readable time format (MM:SS)
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
function formatTime(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds)) {
    return '00:00';
  }

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

async function main() {
  // Get video ID from command line arguments
  const videoId = process.argv[2];

  if (!videoId) {
    console.error('Please provide a YouTube video ID as an argument');
    console.error('Example: node scripts/test-youtubei.js dQw4w9WgXcQ');
    process.exit(1);
  }

  console.log(`Fetching transcript for video ID: ${videoId} using youtubei.js`);

  try {
    // Initialize the Innertube client with the correct parameters
    const youtube = await Innertube.create({
      lang: 'en',
      location: 'US',
      retrieve_player: false,
    });

    // Get the video info
    const info = await youtube.getInfo(videoId);

    // Get the transcript
    console.log('Fetching transcript data...');
    const transcriptData = await info.getTranscript();

    if (!transcriptData || !transcriptData.transcript || !transcriptData.transcript.content) {
      console.log('No transcript available for this video');
      process.exit(0);
    }

    // Extract transcript segments
    const segments = transcriptData.transcript.content.body.initial_segments || [];

    if (segments.length === 0) {
      console.log('No transcript segments found');
      process.exit(0);
    }

    console.log('\nTranscript:');
    console.log('===========\n');

    // Print each transcript segment with timestamp
    segments.forEach((segment, index) => {
      // Get the text
      const text = segment.snippet.text;

      // Get the timestamp if available
      let timestamp = '00:00';
      if (segment.start_ms !== undefined) {
        timestamp = formatTime(segment.start_ms / 1000);
      }

      console.log(`[${timestamp}] ${text}`);
    });

    console.log(`\nTotal transcript segments: ${segments.length}`);

  } catch (error) {
    console.error('Error fetching transcript:');
    console.error(error.message);

    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// Execute the main function
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
