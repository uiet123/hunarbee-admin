import { VideoLessonStatus } from '../curriculum/types';

export interface VideoGenerationJob {
  id: string;
  videoLessonId: string;
  status: VideoLessonStatus;
  progressMessage: string;
  step: number; // 1 to 4
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoGenerationInput {
  videoLessonId: string;
  script: string;
}
