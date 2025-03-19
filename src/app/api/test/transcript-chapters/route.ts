// import { NextRequest, NextResponse } from 'next/server';
// import { fetchTranscript } from '../../../../services/server/youtube/transcriptService';
// import { fetchChapters } from '../../../../services/server/youtube/chaptersService';
// import { combineTranscriptAndChapters } from '../../../../services/server/content/contentMappingService';
// import fs from 'fs';
// import path from 'path';

// // Extract video ID from URL or use directly
// function extractVideoId(videoIdOrUrl: string): string {
//   if (videoIdOrUrl.includes('youtube.com') || videoIdOrUrl.includes('youtu.be')) {
//     const urlObj = new URL(videoIdOrUrl);
//     if (videoIdOrUrl.includes('youtube.com')) {
//       return urlObj.searchParams.get('v') || '';
//     } else {
//       return urlObj.pathname.slice(1);
//     }
//   }
//   return videoIdOrUrl;
// }

// export async function GET(request: NextRequest) {
//   try {
//     // Get video ID from query parameter or use default
//     const url = new URL(request.url);
//     const videoIdOrUrl = url.searchParams.get('videoId') || 'https://www.youtube.com/watch?v=01op4XmNmxA';
//     const chapterOffset = parseInt(url.searchParams.get('offset') || '20', 10);
//     const skipFirstChapterOffset = url.searchParams.get('skipFirst') !== 'false';
    
//     // Extract video ID
//     const videoId = extractVideoId(videoIdOrUrl);
//     console.log(`Testing video ID: ${videoId} with offset: ${chapterOffset}s (skip first: ${skipFirstChapterOffset})`);
    
//     // Fetch transcript and chapters
//     console.log('Fetching transcript...');
//     const transcript = await fetchTranscript(videoId);
//     console.log(`Fetched ${transcript.length} transcript items`);
    
//     // Debug: Log first few transcript items
//     console.log('First 10 transcript items:');
//     transcript.slice(0, 10).forEach((item, idx) => {
//       console.log(`Item ${idx}: offset=${item.offset}ms (${item.offset/1000}s), duration=${item.duration}ms, text="${item.text}"`);
//     });
    
//     console.log('Fetching chapters...');
//     const chapters = await fetchChapters(videoId);
//     console.log(`Fetched ${chapters.length} chapters`);
    
//     // Debug: Log all chapters
//     console.log('All chapters:');
//     chapters.forEach((chapter, idx) => {
//       console.log(`Chapter ${idx}: "${chapter.title}", startTime=${chapter.startTime}s, endTime=${chapter.endTime}s`);
//     });
    
//     // Create fallback chapter if no chapters are available
//     const effectiveChapters = chapters.length > 0 
//       ? chapters 
//       : [{ title: 'Full Video', startTime: 0, endTime: Number.MAX_SAFE_INTEGER }];
    
//     // Debug: Check for overlapping chapters or gaps
//     console.log('Checking chapter boundaries:');
//     for (let i = 0; i < effectiveChapters.length - 1; i++) {
//       const current = effectiveChapters[i];
//       const next = effectiveChapters[i + 1];
//       if (current.endTime !== next.startTime) {
//         console.log(`Gap or overlap between chapters ${i} and ${i+1}: ${current.endTime} vs ${next.startTime}`);
//       }
//     }
    
//     // Manual test: Check if any transcript items would match chapter criteria
//     console.log('Manual chapter matching test:');
//     const testItems = transcript.slice(0, 20); // Test first 20 items
    
//     testItems.forEach((item, idx) => {
//       const itemStartTime = item.offset / 1000;
//       const itemEndTime = (item.offset + item.duration) / 1000;
      
//       // Try to find matching chapter
//       let matchedChapter = -1;
//       for (let i = 0; i < effectiveChapters.length; i++) {
//         const chapter = effectiveChapters[i];
//         if (
//           itemStartTime >= chapter.startTime && 
//           (itemStartTime < chapter.endTime || chapter.endTime === Number.MAX_SAFE_INTEGER || i === effectiveChapters.length - 1)
//         ) {
//           matchedChapter = i;
//           break;
//         }
//       }
      
//       console.log(`Item ${idx} (${itemStartTime}s - ${itemEndTime}s): matched to chapter ${matchedChapter}`);
//     });
    
//     // Combine transcript and chapters
//     console.log('Combining transcript and chapters...');
//     const chapterContents = combineTranscriptAndChapters(transcript, effectiveChapters, {
//       chapterOffset,
//       skipFirstChapterOffset
//     });
    
//     // Debug: Check chapter content distribution
//     console.log('Chapter content distribution:');
//     chapterContents.forEach((chapter, idx) => {
//       console.log(`Chapter ${idx}: "${chapter.title}", content length: ${chapter.content.length} chars`);
//     });
    
//     // Count items per chapter for debugging
//     const itemsPerChapter: Record<number, number> = {};
//     transcript.forEach(item => {
//       const itemTime = item.offset / 1000; // Convert to seconds
      
//       // Find the chapter this item belongs to using the same logic as in combineTranscriptAndChapters
//       const chapterIndex = effectiveChapters.findIndex((chapter, idx) => 
//         itemTime >= chapter.startTime && 
//         (
//           itemTime < chapter.endTime || 
//           chapter.endTime === Number.MAX_SAFE_INTEGER || 
//           idx === effectiveChapters.length - 1
//         )
//       );
      
//       if (chapterIndex !== -1) {
//         itemsPerChapter[chapterIndex] = (itemsPerChapter[chapterIndex] || 0) + 1;
//       }
//     });
    
//     console.log('Items per chapter:');
//     Object.entries(itemsPerChapter).forEach(([chapterIdx, count]) => {
//       console.log(`Chapter ${chapterIdx}: ${count} items`);
//     });
    
//     // Create detailed output for verification
//     const detailedOutput = {
//       videoId,
//       chapterOffset,
//       skipFirstChapterOffset,
//       transcript: {
//         totalItems: transcript.length,
//         firstItems: transcript.slice(0, 20).map(item => ({
//           offset: item.offset,
//           offsetSeconds: item.offset / 1000,
//           duration: item.duration,
//           text: item.text
//         })),
//         lastItems: transcript.slice(-20).map(item => ({
//           offset: item.offset,
//           offsetSeconds: item.offset / 1000,
//           duration: item.duration,
//           text: item.text
//         }))
//       },
//       chapters: effectiveChapters.map(chapter => ({
//         title: chapter.title,
//         startTime: chapter.startTime,
//         endTime: chapter.endTime === Number.MAX_SAFE_INTEGER ? 'MAX_SAFE_INTEGER' : chapter.endTime
//       })),
//       chapterContents: chapterContents.map(chapter => ({
//         title: chapter.title,
//         startTime: chapter.startTime,
//         endTime: chapter.endTime === Number.MAX_SAFE_INTEGER ? 'MAX_SAFE_INTEGER' : chapter.endTime,
//         contentLength: chapter.content.length,
//         wordCount: chapter.content.split(/\s+/).length,
//         contentPreview: chapter.content.substring(0, 200) + (chapter.content.length > 200 ? '...' : '')
//       }))
//     };
    
//     // Generate text output for easier review
//     let textOutput = `CHAPTER CONTENTS FOR VIDEO ${videoId}\n`;
//     textOutput += `Using chapter offset: ${chapterOffset}s (skip first: ${skipFirstChapterOffset})\n\n`;
    
//     chapterContents.forEach((chapter, index) => {
//       textOutput += `=== CHAPTER ${index + 1}: ${chapter.title} ===\n`;
//       textOutput += `Time range: ${chapter.startTime}s - ${chapter.endTime === Number.MAX_SAFE_INTEGER ? 'end' : chapter.endTime + 's'}\n`;
//       textOutput += `Content length: ${chapter.content.length} chars, ~${chapter.content.split(/\s+/).length} words\n\n`;
//       textOutput += `${chapter.content.substring(0, 500)}${chapter.content.length > 500 ? '...' : ''}\n\n`;
//       textOutput += `${'-'.repeat(80)}\n\n`;
//     });
    
//     // Prepare results
//     const results = {
//       videoId,
//       chapterOffset,
//       skipFirstChapterOffset,
//       stats: {
//         transcriptItems: transcript.length,
//         originalChapters: chapters.length,
//         effectiveChapters: effectiveChapters.length,
//         combinedChapterContents: chapterContents.length,
//         emptyChapters: chapterContents.filter(chapter => chapter.content.trim() === '').length,
//         totalContentLength: chapterContents.reduce((sum, chapter) => sum + chapter.content.length, 0),
//         totalWordCount: chapterContents.reduce((sum, chapter) => sum + chapter.content.split(/\s+/).length, 0)
//       },
//       emptyChapters: chapterContents
//         .filter(chapter => chapter.content.trim() === '')
//         .map(chapter => ({
//           title: chapter.title,
//           startTime: chapter.startTime,
//           endTime: chapter.endTime
//         })),
//       chapterDetails: chapterContents.map(chapter => ({
//         title: chapter.title,
//         startTime: chapter.startTime,
//         endTime: chapter.endTime,
//         contentLength: chapter.content.length,
//         wordCount: chapter.content.split(/\s+/).length,
//         contentPreview: chapter.content.substring(0, 100) + (chapter.content.length > 100 ? '...' : '')
//       })),
//       itemsPerChapter,
//       detailedOutput,
//       textOutput,
//       transcript: JSON.stringify(transcript),
//       chapters: JSON.stringify(chapters)
//     };
    
//     return NextResponse.json(results);
//   } catch (error) {
//     console.error('Error testing transcript and chapters combination:', error);
//     return NextResponse.json({ 
//       success: false,
//       error: 'Failed to process video',
//       details: error instanceof Error ? error.message : String(error)
//     }, { status: 200 });
//   }
// }
