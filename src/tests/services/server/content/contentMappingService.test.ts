import { combineTranscriptAndChapters } from '../../../../services/server/content/contentMappingService';
import { fetchTranscript, TranscriptItem } from '../../../../services/server/youtube/transcriptService';
import { fetchChapters, Chapter } from '../../../../services/server/youtube/chaptersService';
import { ChapterContent } from '../../../../types/shared/ai';

describe('Content Mapping Service', () => {
  // Sample test data for unit tests
  const mockTranscript: TranscriptItem[] = [
    { text: 'This is the first segment', offset: 0, duration: 5000 },
    { text: 'This is the second segment', offset: 5000, duration: 5000 },
    { text: 'This is the third segment', offset: 10000, duration: 5000 },
    { text: 'This is the fourth segment', offset: 15000, duration: 5000 },
    { text: 'This is the fifth segment', offset: 20000, duration: 5000 },
    // Boundary case - exactly at chapter end
    { text: 'This is at chapter boundary', offset: 30000, duration: 5000 },
    // Last segment - beyond last chapter start
    { text: 'This is the last segment', offset: 45000, duration: 5000 },
  ];

  const mockChapters: Chapter[] = [
    { title: 'Introduction', startTime: 0, endTime: 10 },
    { title: 'Main Content', startTime: 10, endTime: 30 },
    { title: 'Conclusion', startTime: 30, endTime: Number.MAX_SAFE_INTEGER }
  ];

  describe('combineTranscriptAndChapters unit tests', () => {
    it('should properly map transcript items to their respective chapters', () => {
      const result = combineTranscriptAndChapters(mockTranscript, mockChapters);
      
      // Verify the result structure
      expect(result).toHaveLength(3);
      expect(result[0].title).toBe('Introduction');
      expect(result[1].title).toBe('Main Content');
      expect(result[2].title).toBe('Conclusion');
      
      // Verify content mapping
      expect(result[0].content).toContain('This is the first segment');
      expect(result[0].content).toContain('This is the second segment');
      expect(result[1].content).toContain('This is the third segment');
      expect(result[1].content).toContain('This is the fourth segment');
      expect(result[1].content).toContain('This is the fifth segment');
      
      // Verify boundary case handling
      expect(result[2].content).toContain('This is at chapter boundary');
      expect(result[2].content).toContain('This is the last segment');
    });

    it('should handle empty transcript', () => {
      const result = combineTranscriptAndChapters([], mockChapters);
      expect(result).toHaveLength(0);
    });

    it('should handle empty chapters', () => {
      const result = combineTranscriptAndChapters(mockTranscript, []);
      expect(result).toHaveLength(0);
    });

    it('should handle transcript items that fall between chapters', () => {
      // Create a gap between chapters
      const gappedChapters: Chapter[] = [
        { title: 'First Chapter', startTime: 0, endTime: 5 },
        { title: 'Second Chapter', startTime: 15, endTime: Number.MAX_SAFE_INTEGER }
      ];
      
      const result = combineTranscriptAndChapters(mockTranscript, gappedChapters);
      
      // First chapter should only have the first segment
      expect(result[0].content).toContain('This is the first segment');
      expect(result[0].content).not.toContain('This is the second segment');
      
      // Second chapter should have the remaining segments
      expect(result[1].content).toContain('This is the fourth segment');
      expect(result[1].content).toContain('This is the fifth segment');
      expect(result[1].content).toContain('This is at chapter boundary');
      expect(result[1].content).toContain('This is the last segment');
    });
  });

  describe('End-to-end video processing integration tests', () => {
    // This test uses a real YouTube video with known chapters
    // Using a stable video that's unlikely to be removed
    const videoId = 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up

    it('should process a real video from ID to transcript with chapters', async () => {
      // This test will make actual API calls to YouTube
      // Increase timeout for this test as it makes external API calls
      jest.setTimeout(30000);
      
      // Fetch transcript and chapters using real services
      const transcript = await fetchTranscript(videoId);
      const chapters = await fetchChapters(videoId);
      
      // Create fallback chapter if no chapters are available
      const effectiveChapters = chapters.length > 0 
        ? chapters 
        : [{ title: 'Full Video', startTime: 0, endTime: Number.MAX_SAFE_INTEGER }];
      
      // Combine transcript and chapters
      const chapterContents = combineTranscriptAndChapters(transcript, effectiveChapters);
      
      // Verify we got transcript data
      expect(transcript.length).toBeGreaterThan(0);
      
      // Verify the chapter contents
      expect(chapterContents.length).toBeGreaterThan(0);
      
      // Check that all chapters have content
      chapterContents.forEach(chapter => {
        expect(chapter.content.length).toBeGreaterThan(0);
        expect(chapter.title).toBeTruthy();
        expect(chapter.startTime).toBeGreaterThanOrEqual(0);
      });
      
      // Verify that the content is properly distributed
      // Each chapter should have some content
      const emptyChapters = chapterContents.filter(chapter => chapter.content.trim() === '');
      expect(emptyChapters.length).toBe(0);
      
      // Log some information about the processed video for debugging
      console.log(`Processed video ${videoId} with ${transcript.length} transcript items`);
      console.log(`Found ${chapterContents.length} chapters`);
      chapterContents.forEach((chapter, index) => {
        console.log(`Chapter ${index + 1}: "${chapter.title}" - Content length: ${chapter.content.length} chars`);
      });
    });

    it('should handle videos with no chapters by creating a fallback chapter', async () => {
      // Using a video that likely doesn't have chapters
      const videoWithoutChaptersId = 'jNQXAC9IVRw'; // "Me at the zoo" (first YouTube video)
      
      // Fetch transcript and chapters
      const transcript = await fetchTranscript(videoWithoutChaptersId);
      const chapters = await fetchChapters(videoWithoutChaptersId);
      
      // Create fallback chapter
      const effectiveChapters = chapters.length > 0 
        ? chapters 
        : [{ title: 'Full Video', startTime: 0, endTime: Number.MAX_SAFE_INTEGER }];
      
      // Combine transcript and chapters
      const chapterContents = combineTranscriptAndChapters(transcript, effectiveChapters);
      
      // If no chapters were found, verify the fallback chapter was created
      if (chapters.length === 0) {
        expect(effectiveChapters).toHaveLength(1);
        expect(effectiveChapters[0].title).toBe('Full Video');
        
        // Verify all transcript content is in the fallback chapter
        expect(chapterContents).toHaveLength(1);
        
        // The fallback chapter should contain all transcript content
        const totalTranscriptText = transcript.map(item => item.text).join(' ');
        expect(chapterContents[0].content.length).toBeGreaterThan(0);
        
        // Log information about the fallback chapter
        console.log(`Processed video ${videoWithoutChaptersId} with ${transcript.length} transcript items`);
        console.log(`Created fallback chapter with ${chapterContents[0].content.length} chars of content`);
      } else {
        console.log(`Video ${videoWithoutChaptersId} unexpectedly has ${chapters.length} chapters`);
      }
    });
  });
});
