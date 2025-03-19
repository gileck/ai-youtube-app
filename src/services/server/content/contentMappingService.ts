import { TranscriptItem } from '../youtube/transcriptService';
import { Chapter } from '../youtube/chaptersService';
import { ChapterContent } from '../../../types/shared/ai';

/**
 * Combine transcript items with chapters
 * Pure function that maps transcript items to their respective chapters
 * 
 * @param transcript Array of transcript items
 * @param chapters Array of chapters
 * @param options Optional configuration parameters
 * @returns Array of chapter contents with transcript text mapped to each chapter
 */
export function combineTranscriptAndChapters(
  transcript: TranscriptItem[],
  chapters: Chapter[],
  options: {
    chapterOffset?: number;
    skipFirstChapterOffset?: boolean;
  } = {}
): ChapterContent[] {
  // If no transcript or chapters, return empty array
  if (!transcript.length || !chapters.length) {
    return [];
  }
  
  // Set default options
  const chapterOffset = options.chapterOffset ?? 20; // Default 20 seconds offset
  const skipFirstChapterOffset = options.skipFirstChapterOffset ?? true;
  
  // Apply offset to chapter start times
  const offsetAdjustedChapters = chapters.map((chapter, index) => {
    // Skip offset for first chapter if specified
    const shouldApplyOffset = !(index === 0 && skipFirstChapterOffset);
    const offset = shouldApplyOffset ? chapterOffset : 0;
    
    return {
      ...chapter,
      // Apply offset to startTime, ensuring it doesn't go below 0
      startTime: Math.max(0, chapter.startTime - offset)
    };
  });
  
  // Initialize chapter contents with empty content
  const chapterContents: ChapterContent[] = offsetAdjustedChapters.map(chapter => ({
    title: chapter.title,
    startTime: chapter.startTime,
    endTime: chapter.endTime,
    content: ''
  }));
  
  // For debugging
  console.log(`Processing ${transcript.length} transcript items and ${chapters.length} chapters`);
  console.log(`Using chapter offset: ${chapterOffset}s (skip first: ${skipFirstChapterOffset})`);
  console.log(`First transcript item: offset=${transcript[0].offset}ms, text="${transcript[0].text.substring(0, 30)}..."`);
  console.log(`Last transcript item: offset=${transcript[transcript.length-1].offset}ms`);
  console.log(`First chapter: title="${offsetAdjustedChapters[0].title}", startTime=${offsetAdjustedChapters[0].startTime}s (original: ${chapters[0].startTime}s)`);
  console.log(`Last chapter: title="${offsetAdjustedChapters[offsetAdjustedChapters.length-1].title}", startTime=${offsetAdjustedChapters[offsetAdjustedChapters.length-1].startTime}s`);
  
  // Calculate transcript duration and video duration
  const lastTranscriptItem = transcript[transcript.length - 1];
  const transcriptDuration = (lastTranscriptItem.offset + lastTranscriptItem.duration) / 1000; // in seconds
  
  // Calculate video duration from chapters (excluding MAX_SAFE_INTEGER)
  const videoDuration = offsetAdjustedChapters[offsetAdjustedChapters.length - 1].startTime + 300; // Add 5 minutes as a reasonable estimate
  
  console.log(`Transcript duration: ${transcriptDuration}s, Video duration: ${videoDuration}s`);
  
  // Determine if we need to use proportional mapping
  // This is needed when transcript timestamps and chapter timestamps are on different scales
  const useProportionalMapping = transcriptDuration < videoDuration / 10;
  
  console.log(`Using proportional mapping: ${useProportionalMapping}`);
  
  // Distribute transcript items evenly across chapters based on their relative position
  const chapterDistribution: Record<number, number> = {};
  
  transcript.forEach((item, index) => {
    let targetChapter: number;
    
    if (useProportionalMapping) {
      // Use proportional mapping - map transcript position to video position
      const relativePosition = item.offset / (lastTranscriptItem.offset || 1);
      const estimatedVideoPosition = relativePosition * videoDuration;
      
      // Find the chapter that contains this position
      targetChapter = offsetAdjustedChapters.findIndex((chapter, idx) => {
        const isLastChapter = idx === offsetAdjustedChapters.length - 1;
        const nextChapterStart = isLastChapter ? Infinity : offsetAdjustedChapters[idx + 1].startTime;
        return estimatedVideoPosition >= chapter.startTime && estimatedVideoPosition < nextChapterStart;
      });
    } else {
      // Use direct mapping - convert transcript timestamp to seconds and find matching chapter
      const itemTimeSeconds = item.offset / 1000;
      
      targetChapter = offsetAdjustedChapters.findIndex((chapter, idx) => {
        const isLastChapter = idx === offsetAdjustedChapters.length - 1;
        const nextChapterStart = isLastChapter ? Infinity : offsetAdjustedChapters[idx + 1].startTime;
        return itemTimeSeconds >= chapter.startTime && itemTimeSeconds < nextChapterStart;
      });
    }
    
    // If no chapter found, assign based on relative position in the transcript
    if (targetChapter === -1) {
      const relativePosition = index / transcript.length;
      targetChapter = Math.min(offsetAdjustedChapters.length - 1, Math.floor(relativePosition * offsetAdjustedChapters.length));
    }
    
    // Add text to the target chapter
    chapterContents[targetChapter].content += ' ' + item.text;
    
    // Track distribution
    chapterDistribution[targetChapter] = (chapterDistribution[targetChapter] || 0) + 1;
  });
  
  // Log distribution for debugging
  console.log('Transcript distribution across chapters:');
  Object.entries(chapterDistribution).forEach(([chapterIdx, count]) => {
    const percentage = (count / transcript.length * 100).toFixed(1);
    console.log(`Chapter ${chapterIdx}: ${count} items (${percentage}%)`);
  });
  
  // Trim whitespace from content
  return chapterContents.map(chapter => ({
    ...chapter,
    content: chapter.content.trim()
  }));
}
