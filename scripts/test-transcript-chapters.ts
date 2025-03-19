// /**
//  * Script to test transcript and chapters combination for a specific video
//  * 
//  * This script:
//  * 1. Fetches transcript for a given video ID
//  * 2. Fetches chapters for the same video ID
//  * 3. Combines them using our contentMappingService
//  * 4. Outputs statistics and sample content from each chapter
//  */

// const { fetchTranscript } = require('../src/services/server/youtube/transcriptService');
// const { fetchChapters } = require('../src/services/server/youtube/chaptersService');
// const { combineTranscriptAndChapters } = require('../src/services/server/content/contentMappingService');

// // Extract video ID from URL or use directly
// function extractVideoId(videoIdOrUrl) {
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

// async function testTranscriptChaptersCombination(videoIdOrUrl) {
//   try {
//     // Extract video ID
//     const videoId = extractVideoId(videoIdOrUrl);
//     console.log(`Testing video ID: ${videoId}`);
    
//     // Fetch transcript and chapters
//     console.log('Fetching transcript...');
//     const transcript = await fetchTranscript(videoId);
//     console.log(`Fetched ${transcript.length} transcript items`);
    
//     console.log('Fetching chapters...');
//     const chapters = await fetchChapters(videoId);
//     console.log(`Fetched ${chapters.length} chapters`);
    
//     // Create fallback chapter if no chapters are available
//     const effectiveChapters = chapters.length > 0 
//       ? chapters 
//       : [{ title: 'Full Video', startTime: 0, endTime: Number.MAX_SAFE_INTEGER }];
    
//     if (chapters.length === 0) {
//       console.log('No chapters found, created fallback chapter');
//     }
    
//     // Combine transcript and chapters
//     console.log('Combining transcript and chapters...');
//     const chapterContents = combineTranscriptAndChapters(transcript, effectiveChapters);
    
//     // Output results
//     console.log('\n=== RESULTS ===');
//     console.log(`Total transcript items: ${transcript.length}`);
//     console.log(`Total chapters: ${effectiveChapters.length}`);
//     console.log(`Combined chapter contents: ${chapterContents.length}`);
    
//     // Check for empty chapters
//     const emptyChapters = chapterContents.filter(chapter => chapter.content.trim() === '');
//     console.log(`Empty chapters: ${emptyChapters.length}`);
    
//     if (emptyChapters.length > 0) {
//       console.log('\n!!! WARNING: Empty chapters detected !!!');
//       emptyChapters.forEach(chapter => {
//         console.log(`- "${chapter.title}" (${chapter.startTime}s - ${chapter.endTime === Number.MAX_SAFE_INTEGER ? 'end' : chapter.endTime + 's'})`);
//       });
//     }
    
//     // Output chapter details
//     console.log('\n=== CHAPTER DETAILS ===');
//     chapterContents.forEach((chapter, index) => {
//       const contentLength = chapter.content.length;
//       const contentPreview = chapter.content.substring(0, 100) + (contentLength > 100 ? '...' : '');
//       const wordCount = chapter.content.split(/\s+/).length;
      
//       console.log(`\nChapter ${index + 1}: "${chapter.title}"`);
//       console.log(`Time range: ${chapter.startTime}s - ${chapter.endTime === Number.MAX_SAFE_INTEGER ? 'end' : chapter.endTime + 's'}`);
//       console.log(`Content length: ${contentLength} chars, ~${wordCount} words`);
//       console.log(`Preview: ${contentPreview}`);
//     });
    
//     // Output total content stats
//     const totalContentLength = chapterContents.reduce((sum, chapter) => sum + chapter.content.length, 0);
//     const totalWordCount = chapterContents.reduce((sum, chapter) => sum + chapter.content.split(/\s+/).length, 0);
    
//     console.log('\n=== TOTAL CONTENT STATS ===');
//     console.log(`Total content length: ${totalContentLength} chars`);
//     console.log(`Approximate word count: ${totalWordCount} words`);
    
//   } catch (error) {
//     console.error('Error testing transcript and chapters combination:', error);
//   }
// }

// // Run the test with the provided video URL
// const videoUrl = 'https://www.youtube.com/watch?v=01op4XmNmxA';
// testTranscriptChaptersCombination(videoUrl)
//   .then(() => console.log('\nTest completed'))
//   .catch(err => console.error('Test failed:', err));
