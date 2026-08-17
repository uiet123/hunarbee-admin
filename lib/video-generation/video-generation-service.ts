import { VideoGenerationJob, VideoGenerationInput } from './types';

export interface VideoGenerationService {
  generateVideo(input: VideoGenerationInput): Promise<VideoGenerationJob>;
  getGenerationStatus(jobId: string): Promise<VideoGenerationJob>;
  retryGeneration(jobId: string): Promise<VideoGenerationJob>;
}
