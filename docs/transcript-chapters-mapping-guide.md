# YouTube Transcript-Chapters Mapping Guide

This document explains the implementation of the transcript-chapters mapping service, which is a critical component of the YouTube AI Summarizer application. The service follows strict server-side code guidelines with pure functions, separation of concerns, and standardized interfaces.

## Architecture Overview

The transcript-chapters mapping process follows a clean separation of concerns:

```
┌────────────────┐     ┌────────────────┐
│                │     │                │
│  Transcript    │     │  Chapters      │
│  Service       │     │  Service       │
│  (Pure)        │     │  (Pure)        │
│                │     │                │
└───────┬────────┘     └────────┬───────┘
        │                       │
        │ TranscriptItem[]      │ Chapter[]
        │                       │
        ▼                       ▼
┌──────────────────────────────────────────┐
│                                          │
│  Content Mapping Service                 │
│  combineTranscriptAndChapters()          │
│  (Pure function)                         │
│                                          │
└──────────────────────┬───────────────────┘
                       │
                       │ ChapterContent[]
                       │
                       ▼
┌──────────────────────────────────────────┐
│                                          │
│  AI Action Processor                     │
│  (Uses structured content for AI tasks)  │
│                                          │
└──────────────────────────────────────────┘
```

## Interface Definitions

### Input Types

```typescript
// From transcriptService.ts
export interface TranscriptItem {
  text: string;     // Transcribed text segment
  offset: number;   // Start time in milliseconds
  duration: number; // Duration in milliseconds
}

// From chaptersService.ts
export interface Chapter {
  title: string;     // Chapter title
  startTime: number; // Start time in seconds
  endTime: number;   // End time in seconds
}
```

### Output Type

```typescript
// From types/shared/ai.ts
export interface ChapterContent {
  title: string;     // Chapter title
  startTime: number; // Start time in seconds
  endTime: number;   // End time in seconds
  content: string;   // Combined transcript text for this chapter
}
```

## Implementation Details

The `combineTranscriptAndChapters` function is a pure function that takes transcript items and chapters as input and returns an array of chapter contents:

```typescript
export function combineTranscriptAndChapters(
  transcript: TranscriptItem[],
  chapters: Chapter[]
): ChapterContent[] {
  // Implementation details...
}
```

### Key Implementation Challenges

1. **Timestamp Unit Mismatch**: Transcript timestamps are in milliseconds, while chapter timestamps are in seconds.
2. **Scaling Issues**: In some videos, transcript duration may be much shorter than video duration.
3. **Edge Cases**: Handling chapters with `Number.MAX_SAFE_INTEGER` as end time, empty chapters, etc.

### Algorithm

The algorithm follows these steps:

1. **Initialization**:
   - Create empty chapter content objects for each chapter
   - Calculate total transcript and video duration for scaling

2. **Timestamp Scaling**:
   - Determine if scaling is needed by comparing durations
   - If needed, map transcript timestamps to video timeline using relative positioning

3. **Transcript Mapping**:
   - For each transcript item:
     - Convert/scale its timestamp
     - Find the appropriate chapter based on timestamp
     - Add the text to that chapter's content
   - Special handling for the last chapter to ensure it gets content

4. **Finalization**:
   - Trim whitespace from all chapter contents
   - Return the array of chapter contents

### Handling Edge Cases

The implementation includes special handling for:

- **Empty inputs**: Returns an empty array if either transcript or chapters are empty
- **Last chapter**: Assigns the last 50 transcript items to the last chapter
- **Unmatched items**: Uses relative positioning as a fallback
- **Timestamp scaling**: Automatically detects and handles timestamp mismatches

## Usage in API Flow

The transcript-chapters mapping is used in the AI action flow as follows:

1. **Fetch Data**: The API endpoint fetches transcript and chapters in parallel
   ```typescript
   const [transcript, chapters] = await Promise.all([
     fetchTranscript(videoId),
     fetchChapters(videoId)
   ]);
   ```

2. **Create Fallback**: If no chapters are available, create a fallback chapter
   ```typescript
   const effectiveChapters = chapters.length > 0 
     ? chapters 
     : [{ title: 'Full Video', startTime: 0, endTime: Number.MAX_SAFE_INTEGER }];
   ```

3. **Combine Content**: Map transcript items to chapters
   ```typescript
   const chapterContents = combineTranscriptAndChapters(transcript, effectiveChapters);
   ```

4. **Process with AI**: Use the structured content for AI processing
   ```typescript
   const result = await processor.process(fullTranscript, chapterContents, model);
   ```

5. **Return Response**: Return a standardized response with success status
   ```typescript
   return NextResponse.json({
     success: true,
     data: {
       result,
       cost
     }
   }, { status: 200 });
   ```

## Design Principles

The implementation adheres to the following principles:

1. **Pure Functions**: All operations are implemented as pure functions with no side effects
2. **Separation of Concerns**: Data fetching, content mapping, and AI processing are kept separate
3. **Standardized Interfaces**: Clear input/output interfaces for all components
4. **Error Handling**: All edge cases are properly handled with fallbacks
5. **No Direct Side Effects**: Business logic is kept separate from side effects
6. **Consistent Response Format**: All endpoints return status code 200 with standardized response format

## Testing

The implementation includes comprehensive tests:

1. **Unit Tests**: Testing the mapping logic with controlled inputs
2. **Integration Tests**: Testing the entire flow from video ID to mapped content
3. **Edge Case Tests**: Testing special cases like videos without chapters

## Example

For a video with chapters like "Introduction" (0-125s), "Main Content" (125-355s), etc., and transcript items with timestamps, the function will properly map each transcript segment to its corresponding chapter, handling all edge cases and ensuring no chapters are left empty.
