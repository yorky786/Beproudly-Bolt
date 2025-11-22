import { VideoQualityOption } from '../types';
import { supabase } from '../lib/supabase';

export const VIDEO_QUALITY_OPTIONS: VideoQualityOption[] = [
  { label: 'Low (360p)', resolution: '640x360', bitrate: 500000, value: '360p' },
  { label: 'Medium (480p)', resolution: '854x480', bitrate: 1000000, value: '480p' },
  { label: 'High (720p)', resolution: '1280x720', bitrate: 2500000, value: '720p' },
  { label: 'HD (1080p)', resolution: '1920x1080', bitrate: 5000000, value: '1080p' },
];

export const VIDEO_CONSTRAINTS = {
  MIN_DURATION: 5,
  MAX_DURATION: 60,
  MAX_FILE_SIZE: 100 * 1024 * 1024,
  ALLOWED_FORMATS: ['video/mp4', 'video/webm', 'video/quicktime'],
};

export interface VideoUploadResult {
  url: string;
  path: string;
  thumbnailUrl?: string;
  thumbnailPath?: string;
}

export async function uploadVideo(
  videoBlob: Blob,
  userId: string,
  folder: 'profiles' | 'blazebold' = 'profiles'
): Promise<{ data: VideoUploadResult | null; error: any }> {
  try {
    const timestamp = Date.now();
    const fileName = `${userId}_${timestamp}.webm`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, videoBlob, {
        contentType: 'video/webm',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    const thumbnailBlob = await generateThumbnailBlob(videoBlob);
    let thumbnailUrl: string | undefined;
    let thumbnailPath: string | undefined;

    if (thumbnailBlob) {
      const thumbFileName = `${userId}_${timestamp}_thumb.jpg`;
      const thumbPath = `thumbnails/${thumbFileName}`;

      const { error: thumbError } = await supabase.storage
        .from('videos')
        .upload(thumbPath, thumbnailBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (!thumbError) {
        const { data: thumbUrlData } = supabase.storage
          .from('videos')
          .getPublicUrl(thumbPath);
        thumbnailUrl = thumbUrlData.publicUrl;
        thumbnailPath = thumbPath;
      }
    }

    return {
      data: {
        url: urlData.publicUrl,
        path: filePath,
        thumbnailUrl,
        thumbnailPath,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error uploading video:', error);
    return { data: null, error };
  }
}

export async function generateThumbnailBlob(videoBlob: Blob): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(null);
        return;
      }

      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        video.currentTime = Math.min(1, video.duration / 2);
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(video.src);
            resolve(blob);
          },
          'image/jpeg',
          0.8
        );
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(null);
      };

      video.src = URL.createObjectURL(videoBlob);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      resolve(null);
    }
  });
}

export async function deleteVideo(filePath: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase.storage.from('videos').remove([filePath]);
    return { error };
  } catch (error) {
    return { error };
  }
}

export async function getVideoDuration(videoBlob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Math.round(video.duration));
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(videoBlob);
  });
}

export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  if (!VIDEO_CONSTRAINTS.ALLOWED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid video format. Please use MP4, WebM, or MOV.',
    };
  }

  if (file.size > VIDEO_CONSTRAINTS.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Video file too large. Maximum size is ${VIDEO_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024)}MB.`,
    };
  }

  return { valid: true };
}

export function formatVideoDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export async function generateVideoThumbnail(
  videoFile: File,
  seekTime: number = 0
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(seekTime, video.duration / 2);
    });

    video.addEventListener('seeked', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg');
      }
    });

    video.addEventListener('error', () => {
      reject(new Error('Failed to load video'));
    });

    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
}

export async function compressVideo(
  videoFile: File,
  quality: VideoQualityOption
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);

    video.addEventListener('loadedmetadata', async () => {
      const stream = (video as any).captureStream?.() || (video as any).mozCaptureStream?.();

      if (!stream) {
        resolve(videoFile);
        return;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm',
        videoBitsPerSecond: quality.bitrate,
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      mediaRecorder.onerror = () => {
        reject(new Error('Video compression failed'));
      };

      video.play();
      mediaRecorder.start();

      video.addEventListener('ended', () => {
        mediaRecorder.stop();
      });
    });

    video.load();
  });
}

export function getOptimalQuality(fileSize: number): VideoQualityOption {
  if (fileSize < 10 * 1024 * 1024) return VIDEO_QUALITY_OPTIONS[2];
  if (fileSize < 50 * 1024 * 1024) return VIDEO_QUALITY_OPTIONS[1];
  return VIDEO_QUALITY_OPTIONS[0];
}
