/**
 * Script to output transcript, chapters, and combined results to a file
 * This helps verify that the combination logic is working correctly
 */

import fs from 'fs';
import path from 'path';
import { fetchTranscript } from '../src/services/server/youtube/transcriptService';
import { fetchChapters } from '../src/services/server/youtube/chaptersService';
import { combineTranscriptAndChapters } from '../src/services/server/content/contentMappingService';

// Extract video ID from URL or use directly
function extractVideoId(videoIdOrUrl: string): string {
  if (videoIdOrUrl.includes('youtube.com') || videoIdOrUrl.includes('youtu.be')) {
    const urlObj = new URL(videoIdOrUrl);
    if (videoIdOrUrl.includes('youtube.com')) {
      return urlObj.searchParams.get('v') || '';
    } else {
      return urlObj.pathname.slice(1);
    }
  }
  return videoIdOrUrl;
}

async function outputTranscriptAndChapters(videoIdOrUrl: string): Promise<void> {
  try {
    // Extract video ID
    const videoId = extractVideoId(videoIdOrUrl);
    console.log(`Processing video ID: ${videoId}`);
    
    // Fetch transcript and chapters
    console.log('Fetching transcript...');
    const transcript = await fetchTranscript(videoId);
    console.log(`Fetched ${transcript.length} transcript items`);
    
    console.log('Fetching chapters...');
    const chapters = await fetchChapters(videoId);
    console.log(`Fetched ${chapters.length} chapters`);
    
    // Create fallback chapter if no chapters are available
    const effectiveChapters = chapters.length > 0 
      ? chapters 
      : [{ title: 'Full Video', startTime: 0, endTime: Number.MAX_SAFE_INTEGER }];
    
    // Combine transcript and chapters
    console.log('Combining transcript and chapters...');
    const chapterContents = combineTranscriptAndChapters(transcript, effectiveChapters);
    
    // Prepare output data
    const outputData = {
      videoId,
      transcript: transcript.slice(0, 50).map(item => ({
        offset: item.offset,
        offsetSeconds: item.offset / 1000,
        duration: item.duration,
        text: item.text
      })),
      transcriptTotalItems: transcript.length,
      chapters: effectiveChapters.map(chapter => ({
        title: chapter.title,
        startTime: chapter.startTime,
        endTime: chapter.endTime === Number.MAX_SAFE_INTEGER ? 'MAX_SAFE_INTEGER' : chapter.endTime
      })),
      chapterContents: chapterContents.map(chapter => ({
        title: chapter.title,
        startTime: chapter.startTime,
        endTime: chapter.endTime === Number.MAX_SAFE_INTEGER ? 'MAX_SAFE_INTEGER' : chapter.endTime,
        contentLength: chapter.content.length,
        wordCount: chapter.content.split(/\s+/).length,
        contentPreview: chapter.content.substring(0, 200) + (chapter.content.length > 200 ? '...' : '')
      }))
    };
    
    // Write to file
    const outputPath = path.join(__dirname, '../output', `transcript-chapters-${videoId}.json`);
    
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`Output written to: ${outputPath}`);
    
    // Also create a text file with chapter contents for easier review
    const textOutputPath = path.join(__dirname, '../output', `chapter-contents-${videoId}.txt`);
    let textOutput = `CHAPTER CONTENTS FOR VIDEO ${videoId}\n\n`;
    
    chapterContents.forEach((chapter, index) => {
      textOutput += `=== CHAPTER ${index + 1}: ${chapter.title} ===\n`;
      textOutput += `Time range: ${chapter.startTime}s - ${chapter.endTime === Number.MAX_SAFE_INTEGER ? 'end' : chapter.endTime + 's'}\n`;
      textOutput += `Content length: ${chapter.content.length} chars, ~${chapter.content.split(/\s+/).length} words\n\n`;
      textOutput += `${chapter.content.substring(0, 500)}${chapter.content.length > 500 ? '...' : ''}\n\n`;
      textOutput += `${'-'.repeat(80)}\n\n`;
    });
    
    fs.writeFileSync(textOutputPath, textOutput);
    console.log(`Text output written to: ${textOutputPath}`);
    
  } catch (error) {
    console.error('Error processing transcript and chapters:', error);
  }
}

// Run the script with the provided video URL
const videoUrl = 'https://www.youtube.com/watch?v=01op4XmNmxA';
outputTranscriptAndChapters(videoUrl)
  .then(() => console.log('Done'))
  .catch(err => console.error('Script failed:', err));
