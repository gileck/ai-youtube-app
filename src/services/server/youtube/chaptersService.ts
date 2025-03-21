import parseYouTubeChapters from './parseChapters';
import axios from 'axios';

export interface Chapter {
  title: string;
  startTime: number;
  endTime: number;
}

/**
 * Fetch chapters for a YouTube video
 * Pure function that fetches and transforms chapter data
 * 
 * @param videoId YouTube video ID
 * @returns Array of chapters with title, startTime, and endTime
 */
export async function fetchChapters(videoId: string): Promise<Chapter[]> {
  try {
    // First, we need to fetch the video description
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.error('YouTube API key not found in environment variables');
      return [];
    }

    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );

    if (!response.data.items || response.data.items.length === 0) {
      return [];
    }

    const description = response.data.items[0].snippet.description;

    // Parse chapters from the description
    const rawChapters = parseYouTubeChapters(description);

    if (!rawChapters || !Array.isArray(rawChapters) || rawChapters.length === 0) {
      return [];
    }

    // Transform to our internal format and calculate end times
    return rawChapters.map((chapter, index, array) => {
      const nextChapter = array[index + 1];

      return {
        title: chapter.title,
        startTime: chapter.start,
        // If this is the last chapter, use a large number as end time
        // Otherwise, use the start time of the next chapter
        endTime: nextChapter ? nextChapter.start : Number.MAX_SAFE_INTEGER
      };
    });
  } catch (error) {
    console.error(`Error fetching chapters for video ${videoId}:`, error);
    return [];
  }
}
