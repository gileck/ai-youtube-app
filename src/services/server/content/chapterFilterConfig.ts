/**
 * Configuration for filtering out chapters and transcript items based on their content
 */
export const chapterFilterConfig = {
  /**
   * List of words/phrases that will cause a chapter to be filtered out
   * Case-insensitive matching is applied
   */
  filteredPhrases: [
    'sponsor',
    'advertisement',
    'ad break',
    'promotion',
  ],

  /**
   * List of words/phrases that will cause a transcript item to be filtered out
   * Case-insensitive matching is applied
   */
  filteredTranscriptPhrases: [
    'is sponsored by',
    'this video is sponsored by',
    'today\'s sponsor',
    'special thanks to our sponsor',
  ]
};
