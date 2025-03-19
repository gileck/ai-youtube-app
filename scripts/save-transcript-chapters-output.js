/**
 * Script to fetch and save the combined chapters and transcript data
 * This will save the output to files for easier review
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Video ID to test
const videoId = '01op4XmNmxA';

// Overlap offset in seconds
const overlapOffsetSeconds = 5;

// Make request to the new API endpoint
console.log(`Fetching combined chapters and transcript for video ID: ${videoId} with ${overlapOffsetSeconds}s overlap offset`);
http.get(`http://localhost:3001/api/chapters-transcript?videoId=${videoId}&offset=${overlapOffsetSeconds}`, (res) => {
  let data = '';

  // A chunk of data has been received
  res.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received
  res.on('end', () => {
    try {
      // Parse the JSON response
      const result = JSON.parse(data);
      
      if (!result.success) {
        console.error('Error from API:', result.error, result.details);
        return;
      }
      
      const combinedData = result.data;
      
      // Create output directory if it doesn't exist
      const outputDir = path.join(__dirname, '../output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Save the full combined data
      const combinedOutputPath = path.join(outputDir, `combined-data-${videoId}-offset${overlapOffsetSeconds}.json`);
      fs.writeFileSync(combinedOutputPath, JSON.stringify(combinedData, null, 2));
      console.log(`Combined data saved to: ${combinedOutputPath}`);
      
      // Save chapters with content as separate file for easier review
      const chaptersOutputPath = path.join(outputDir, `chapters-content-${videoId}-offset${overlapOffsetSeconds}.json`);
      const chaptersWithContent = combinedData.chapters.map(chapter => ({
        title: chapter.title,
        startTime: chapter.startTime,
        endTime: chapter.endTime === Number.MAX_SAFE_INTEGER ? 'MAX_SAFE_INTEGER' : chapter.endTime,
        contentLength: chapter.content.length,
        wordCount: chapter.content.split(/\s+/).length,
        contentPreview: chapter.content.substring(0, 200) + (chapter.content.length > 200 ? '...' : '')
      }));
      fs.writeFileSync(chaptersOutputPath, JSON.stringify(chaptersWithContent, null, 2));
      console.log(`Chapters with content saved to: ${chaptersOutputPath}`);
      
      // Generate and save a text file with chapter contents
      const textOutputPath = path.join(outputDir, `chapter-contents-${videoId}-offset${overlapOffsetSeconds}.txt`);
      let textOutput = `CHAPTER CONTENTS FOR VIDEO ${videoId}\n`;
      textOutput += `Using ${overlapOffsetSeconds}s overlap offset between chapters\n\n`;
      
      combinedData.chapters.forEach((chapter, index) => {
        textOutput += `=== CHAPTER ${index + 1}: ${chapter.title} ===\n`;
        textOutput += `Time range: ${chapter.startTime}s - ${chapter.endTime === Number.MAX_SAFE_INTEGER ? 'end' : chapter.endTime + 's'}\n`;
        textOutput += `Content length: ${chapter.content.length} chars, ~${chapter.content.split(/\s+/).length} words\n\n`;
        textOutput += `${chapter.content.substring(0, 500)}${chapter.content.length > 500 ? '...' : ''}\n\n`;
        textOutput += `${'-'.repeat(80)}\n\n`;
      });
      
      fs.writeFileSync(textOutputPath, textOutput);
      console.log(`Text output saved to: ${textOutputPath}`);
      
      // Print summary
      console.log('\nSummary:');
      console.log(`- Video ID: ${combinedData.videoId}`);
      console.log(`- Transcript items: ${combinedData.metadata.transcriptItemCount}`);
      console.log(`- Chapters: ${combinedData.metadata.chapterCount}`);
      console.log(`- Total duration: ${combinedData.metadata.totalDuration}s`);
      console.log(`- Overlap offset: ${combinedData.metadata.overlapOffsetSeconds}s`);
      
      // Print chapter distribution
      console.log('\nChapter content distribution:');
      combinedData.chapters.forEach((chapter, index) => {
        console.log(`- Chapter ${index + 1}: "${chapter.title}" - ${chapter.content.length} chars, ${chapter.segments.length} segments`);
      });
    } catch (error) {
      console.error('Error processing response:', error);
    }
  });
}).on('error', (error) => {
  console.error('Error making request:', error);
});
