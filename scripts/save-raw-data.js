/**
 * Script to fetch and save the raw transcript and chapters data
 * This will save the unmodified API responses to files
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Video ID to test
const videoId = '01op4XmNmxA';

// Function to make an HTTP request and save the response
function fetchAndSave(endpoint, outputFilename) {
  return new Promise((resolve, reject) => {
    console.log(`Fetching data from ${endpoint}...`);
    
    http.get(endpoint, (res) => {
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
          
          // Create output directory if it doesn't exist
          const outputDir = path.join(__dirname, '../output');
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          
          // Save the raw data
          const outputPath = path.join(outputDir, outputFilename);
          fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
          console.log(`Raw data saved to: ${outputPath}`);
          resolve(result);
        } catch (error) {
          console.error('Error processing response:', error);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('Error making request:', error);
      reject(error);
    });
  });
}

// Fetch and save raw transcript data
async function fetchRawTranscript(videoId) {
  try {
    // Create a custom endpoint to get raw transcript data
    const endpoint = `http://localhost:3001/api/youtube/transcript?videoId=${videoId}`;
    return await fetchAndSave(endpoint, `raw-transcript-${videoId}.json`);
  } catch (error) {
    console.error('Failed to fetch transcript:', error);
  }
}

// Fetch and save raw chapters data
async function fetchRawChapters(videoId) {
  try {
    // Create a custom endpoint to get raw chapters data
    const endpoint = `http://localhost:3001/api/youtube/chapters?videoId=${videoId}`;
    return await fetchAndSave(endpoint, `raw-chapters-${videoId}.json`);
  } catch (error) {
    console.error('Failed to fetch chapters:', error);
  }
}

// Run both fetches
async function main() {
  try {
    await Promise.all([
      fetchRawTranscript(videoId),
      fetchRawChapters(videoId)
    ]);
    console.log('All raw data fetched and saved successfully');
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

main();
