#!/usr/bin/env node

/**
 * Simple script to fetch and log a YouTube video transcript
 * 
 * Usage:
 * node scripts/fetch-transcript.js VIDEO_ID
 * 
 * Example:
 * node scripts/fetch-transcript.js dQw4w9WgXcQ
 */

// Import the YoutubeTranscript class from the package
const { YoutubeTranscript } = require('youtube-transcript');

/**
 * Format milliseconds to a readable time format (MM:SS)
 * @param {number} ms - Time in milliseconds
 * @returns {string} - Formatted time string
 */
function formatTime(ms) {
  if (typeof ms !== 'number' || isNaN(ms)) {
    return '00:00';
  }

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Clean and format transcript text
 * @param {string} text - Raw transcript text
 * @returns {string} - Cleaned text
 */
function cleanText(text) {
  if (!text) return '';

  // First try to use the 'he' library if it's available
  try {
    return he.decode(text);
  } catch (e) {
    // Fallback to basic replacement if 'he' is not available
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }
}

async function main() {
  // Get video ID from command line arguments
  const videoId = process.argv[2];

  if (!videoId) {
    console.error('Please provide a YouTube video ID as an argument');
    console.error('Example: node scripts/fetch-transcript.js dQw4w9WgXcQ');
    process.exit(1);
  }

  console.log(`Fetching transcript for video ID: ${videoId}`);

  try {
    // Fetch the transcript directly using the YoutubeTranscript class
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcript || transcript.length === 0) {
      console.log('No transcript available for this video');
      process.exit(0);
    }

    console.log('\nTranscript:');
    console.log('===========\n');

    // Print each transcript item with timestamp
    transcript.forEach((item) => {
      // Format the timestamp
      const timestamp = formatTime(item.offset);

      // Clean the text
      const text = cleanText(item.text);

      console.log(`[${timestamp}] ${text}`);
    });

    // Calculate total duration if possible
    if (transcript.length > 0) {
      const lastItem = transcript[transcript.length - 1];
      if (lastItem && lastItem.offset && lastItem.duration) {
        const totalDurationMs = lastItem.offset + lastItem.duration;
        console.log(`\nVideo duration: approximately ${formatTime(totalDurationMs)}`);
      }
    }

    console.log(`\nTotal transcript items: ${transcript.length}`);

  } catch (error) {
    console.error('Error fetching transcript:');
    console.error(error.message);

    // Provide more helpful error messages for common issues
    if (error.message && error.message.includes('disabled')) {
      console.error('\nThis video might not have captions available or they are disabled by the creator.');
    } else if (error.message && error.message.includes('unavailable')) {
      console.error('\nThis video might be private, deleted, or otherwise unavailable.');
    } else if (error.message && error.message.includes('too many requests')) {
      console.error('\nYou have made too many requests. Please try again later.');
    }

    process.exit(1);
  }
}

// Execute the main function
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
