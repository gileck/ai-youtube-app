// Summary action parameters
export interface SummaryParams {
  type: 'summary';
  maxLength?: number;
  videoId?: string; // Added videoId for tracking purposes
}

// Summary action response
export interface SummaryResponse {
  chapterSummaries: Array<{ title: string; summary: string }>;
  finalSummary: string;
}

// Intermediate result during summary processing
export interface ChapterSummaryResult {
  title: string;
  summary: string;
  cost: number;
}
