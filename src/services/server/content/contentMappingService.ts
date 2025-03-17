import { TranscriptItem } from '../youtube/transcriptService';
import { Chapter } from '../youtube/chaptersService';
import { ChapterContent } from '../../../types/shared/ai';

/**
 * Combine transcript items with chapters
 * Pure function that maps transcript items to their respective chapters
 * 
 * @param transcript Array of transcript items
 * @param chapters Array of chapters
 * @returns Array of chapter contents with transcript text mapped to each chapter
 */
export function combineTranscriptAndChapters(
  transcript: TranscriptItem[],
  chapters: Chapter[]
): ChapterContent[] {
  // If no transcript or chapters, return empty array
  if (!transcript.length || !chapters.length) {
    return [];
  }
  
  // Initialize chapter contents with empty content
  const chapterContents: ChapterContent[] = chapters.map(chapter => ({
    title: chapter.title,
    startTime: chapter.startTime,
    endTime: chapter.endTime,
    content: ''
  }));
  
  // Map each transcript item to its corresponding chapter
  transcript.forEach(item => {
    const itemTime = item.offset / 1000; // Convert to seconds
    
    // Find the chapter this item belongs to
    const chapterIndex = chapters.findIndex(chapter => 
      itemTime >= chapter.startTime && itemTime < chapter.endTime
    );
    
    // If found a matching chapter, add the text to its content
    if (chapterIndex !== -1) {
      chapterContents[chapterIndex].content += ' ' + item.text;
    }
  });
  
  // Trim whitespace from content
  return chapterContents.map(chapter => ({
    ...chapter,
    content: chapter.content.trim()
  }));
}
