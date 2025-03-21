import parseYouTubeChapters from '../services/server/youtube/parseChapters';

describe('YouTube Chapters Parser', () => {
  test('should parse hyphen-separated chapters correctly', () => {
    // Test description with hyphen-separated chapters
    const hyphenChaptersDescription = `
This is a test video description.

0:00:00-Intro
0:01:07-Mike's academic journey, early experiences in powerlifting, personal training, & sports physiology
0:07:25-Mike's transition from powerlifting to bodybuilding, & his scientific & artistic approach
0:13:28-Value of strength training, time efficiency, & how it differs from endurance training
0:26:38-Neurological fatigue in strength training: balancing recovery & pushing the limits

Some other text here.
`;

    // Run the parser
    const chapters = parseYouTubeChapters(hyphenChaptersDescription);

    // Verify results
    expect(chapters).toHaveLength(5);
    
    // Check first chapter
    expect(chapters[0]).toEqual({
      start: 0,
      title: 'Intro'
    });
    
    // Check second chapter
    expect(chapters[1]).toEqual({
      start: 67,
      title: "Mike's academic journey, early experiences in powerlifting, personal training, & sports physiology"
    });
  });
});
