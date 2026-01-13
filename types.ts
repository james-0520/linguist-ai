
export interface TextIssue {
  original: string;
  suggested: string;
  reason: string;
  type: 'typo' | 'redundancy' | 'fluency';
}

export interface AnalysisResult {
  revisedText: string;
  diffText: string;
  issues: TextIssue[];
  summary: string;
}

export interface AnalysisConfig {
  checkRedundancy: boolean;
  checkFluency: boolean;
  revisionLevel: number; // 1 (minimal) to 5 (maximum)
  stylePreference?: string;
}
