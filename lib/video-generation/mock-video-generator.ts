import { VideoGenerationService } from './video-generation-service';
import { VideoGenerationJob, VideoGenerationInput } from './types';
import { updateVideoLesson, generateId } from '../curriculum/curriculum-service';
import { VideoLessonStatus } from '../curriculum/types';

const JOBS_STORAGE_KEY = 'hunarbee_video_generation_jobs';

function readJobs(): VideoGenerationJob[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeJobs(jobs: VideoGenerationJob[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
}

export class MockVideoGenerator implements VideoGenerationService {
  private runJobSimulation(jobId: string) {
    let currentStep = 1;
    const steps = [
      'Generating voice using Kokoro TTS...',
      'Creating visuals and code screens...',
      'Rendering video with FFmpeg...',
      'Finalizing video and uploading...'
    ];

    const interval = setInterval(async () => {
      const jobs = readJobs();
      const jobIdx = jobs.findIndex(j => j.id === jobId);
      if (jobIdx === -1) {
        clearInterval(interval);
        return;
      }

      const job = jobs[jobIdx];

      // If the job script mentions "fail" at step 3, simulate failure
      if (currentStep === 3 && job.progressMessage.toLowerCase().includes('fail')) {
        clearInterval(interval);
        job.status = 'FAILED';
        job.progressMessage = 'FFmpeg rendering failed: Kokoro audio alignment mismatch.';
        job.updatedAt = new Date().toISOString();
        writeJobs(jobs);

        try {
          await updateVideoLesson(job.videoLessonId, { status: 'FAILED' });
        } catch (e) {
          console.error(e);
        }
        return;
      }

      if (currentStep <= 4) {
        job.step = currentStep;
        job.progressMessage = steps[currentStep - 1];
        job.updatedAt = new Date().toISOString();

        if (currentStep === 4) {
          job.status = 'READY';
          clearInterval(interval);
          
          let simulatedDuration = 120; // 2 minutes placeholder

          try {
            await updateVideoLesson(job.videoLessonId, {
              status: 'READY',
              videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
              thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&auto=format&fit=crop&q=60',
              durationSeconds: simulatedDuration,
            });
          } catch (e) {
            console.error(e);
          }
        } else {
          job.status = 'GENERATING';
        }

        writeJobs(jobs);
        currentStep++;
      }
    }, 1000); // 1 second per step, total 4 seconds
  }

  async generateVideo(input: VideoGenerationInput): Promise<VideoGenerationJob> {
    const now = new Date().toISOString();
    const jobId = generateId('job');
    
    // Set video lesson status to GENERATING
    await updateVideoLesson(input.videoLessonId, {
      status: 'GENERATING',
      script: input.script
    });

    const newJob: VideoGenerationJob = {
      id: jobId,
      videoLessonId: input.videoLessonId,
      status: 'GENERATING',
      progressMessage: 'Initializing generation workflow...',
      step: 1,
      createdAt: now,
      updatedAt: now,
    };

    // If script contains the word "fail", let's store that info in the progress message for the simulation to trigger failure
    if (input.script.toLowerCase().includes('fail')) {
      newJob.progressMessage = 'Initializing generation workflow (fail simulation)...';
    }

    const jobs = readJobs();
    jobs.push(newJob);
    writeJobs(jobs);

    // Run async simulation
    this.runJobSimulation(jobId);

    return newJob;
  }

  async getGenerationStatus(jobId: string): Promise<VideoGenerationJob> {
    const jobs = readJobs();
    const job = jobs.find(j => j.id === jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);
    return job;
  }

  async retryGeneration(jobId: string): Promise<VideoGenerationJob> {
    const jobs = readJobs();
    const idx = jobs.findIndex(j => j.id === jobId);
    if (idx === -1) throw new Error(`Job not found: ${jobId}`);

    const now = new Date().toISOString();
    const job = jobs[idx];
    job.status = 'GENERATING';
    job.step = 1;
    job.progressMessage = 'Restarting generation workflow...';
    job.updatedAt = now;
    writeJobs(jobs);

    await updateVideoLesson(job.videoLessonId, {
      status: 'GENERATING'
    });

    this.runJobSimulation(jobId);

    return job;
  }
}

export const videoGeneratorService = new MockVideoGenerator();
