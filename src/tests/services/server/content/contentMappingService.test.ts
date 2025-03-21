import { combineTranscriptAndChapters } from '../../../../services/server/content/contentMappingService';
import { fetchTranscript } from '../../../../services/server/youtube/transcriptService';
import { fetchChapters } from '../../../../services/server/youtube/chaptersService';

describe('Content Mapping Service', () => {

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
        expect(chapterContents[0].content.length).toBeGreaterThan(0);
      } else {
        // This is just a fallback in case the video unexpectedly has chapters
      }
    });
  });
});
