# Transcript-Chapters Content Combination Flow

This document explains the logic and implementation of how we combine YouTube video transcripts with chapter information to create structured content for AI processing.

## Overview

The transcript-chapters combination process takes raw transcript items and chapter markers from a YouTube video and maps each transcript segment to its corresponding chapter. This creates a structured representation of the video content that can be used for AI processing, such as summarization or question answering.

## Data Flow

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│  Transcript     │     │  Chapters       │
│  Service        │     │  Service        │
│                 │     │                 │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│                                         │
│  Content Mapping Service                │
│  (combineTranscriptAndChapters)         │
│                                         │
└────────────────────┬────────────────────┘
                     │
                     │
                     ▼
┌─────────────────────────────────────────┐
│                                         │
│  AI Processor                           │
│  (Uses structured chapter content)      │
│                                         │
└─────────────────────────────────────────┘
```

## Input Data Structures

### Transcript Items

Transcript items are segments of speech with timing information:

```typescript
interface TranscriptItem {
  text: string;      // The transcribed text
  offset: number;    // Start time in milliseconds
  duration: number;  // Duration in milliseconds
}
```

### Chapters

Chapters are markers that divide the video into logical sections:

```typescript
interface Chapter {
  title: string;     // Chapter title
  startTime: number; // Start time in seconds
  endTime: number;   // End time in seconds (can be Number.MAX_SAFE_INTEGER for the last chapter)
}
```

## Output Data Structure

The output is an array of chapter contents with mapped transcript text:

```typescript
interface ChapterContent {
  title: string;     // Chapter title
  startTime: number; // Start time in seconds
  endTime: number;   // End time in seconds
  content: string;   // Combined transcript text for this chapter
}
```

## Combination Logic

The `combineTranscriptAndChapters` function implements the following logic:

### 1. Initialization

- Initialize an empty `ChapterContent` array based on the chapters input
- Calculate total transcript duration and video duration for scaling

### 2. Timestamp Scaling

A critical aspect of the combination process is handling the mismatch between transcript timestamps (typically in milliseconds) and chapter timestamps (in seconds). The function:

- Determines if scaling is needed by comparing transcript duration to video duration
- If scaling is needed, maps each transcript item's position to the video timeline using relative positioning

```typescript
// Determine if scaling is needed
const needsScaling = totalTranscriptDuration < totalVideoDuration / 10;

// Calculate scaled timestamp
if (needsScaling) {
  const relativePosition = item.offset / (lastItem.offset + lastItem.duration);
  segmentTime = relativePosition * totalVideoDuration;
} else {
  segmentTime = item.offset / 1000; // Convert milliseconds to seconds
}
```

### 3. Chapter Assignment

For each transcript item, the function:

- Handles special cases (e.g., assigns last few items to the last chapter)
- Finds the appropriate chapter based on the item's timestamp
- Uses fallback mechanisms for items that don't match any chapter
- Adds the transcript text to the chapter's content

```typescript
// Special case for last chapter
if (index >= transcript.length - 50) {
  chapterIndex = chapters.length - 1;
} else {
  // Regular chapter matching
  for (let i = 0; i < chapters.length; i++) {
    if (segmentTime >= chapters[i].startTime && 
        (chapters[i].endTime === Number.MAX_SAFE_INTEGER || segmentTime < chapters[i].endTime)) {
      chapterIndex = i;
      break;
    }
  }
  
  // Fallback: assign based on relative position
  if (chapterIndex === -1) {
    const relativePosition = Math.min(1, Math.max(0, segmentTime / totalVideoDuration));
    const chapterPosition = Math.floor(relativePosition * chapters.length);
    chapterIndex = Math.min(chapters.length - 1, Math.max(0, chapterPosition));
  }
}
```

### 4. Content Aggregation

- Transcript text is appended to the corresponding chapter's content
- Final content is trimmed to remove leading/trailing whitespace

## Edge Cases and Handling

The implementation handles several edge cases:

1. **Empty Inputs**: Returns an empty array if either transcript or chapters are empty
2. **Timestamp Mismatches**: Uses scaling to handle different time units
3. **Last Chapter**: Special handling ensures the last chapter gets content
4. **Unmatched Items**: Uses relative positioning as a fallback
5. **Infinite End Times**: Handles chapters with `Number.MAX_SAFE_INTEGER` as end time

## Usage in the AI Processing Flow

The combined chapter contents are used in the AI processing flow:

1. The API endpoint fetches transcript and chapters in parallel
2. The content mapping service combines them using the logic described above
3. The AI processor uses the structured chapter contents for processing (e.g., summarization)
4. Results are returned to the client with proper chapter organization

## Implementation Principles

The implementation follows these principles:

1. **Pure Functions**: The combination logic is implemented as a pure function with no side effects
2. **Separation of Concerns**: Data fetching, content mapping, and AI processing are kept separate
3. **Error Handling**: Edge cases are properly handled to ensure robust processing
4. **Efficiency**: The algorithm is optimized to handle large transcripts efficiently

## Example

For a video with chapters like "Introduction" (0-125s), "Main Topic" (125-300s), etc., and transcript items with timestamps, the function will:

1. Scale transcript timestamps if needed
2. Assign each transcript segment to the appropriate chapter
3. Combine all transcript text within each chapter
4. Return structured chapter contents for AI processing

This structured approach ensures that AI models receive properly organized content that preserves the logical structure of the video.
