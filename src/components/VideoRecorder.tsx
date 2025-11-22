import { useState, useRef, useEffect } from 'react';
import { Video, Square, Upload, Check, RotateCcw, Camera } from 'lucide-react';

interface VideoRecorderProps {
  onVideoRecorded: (blob: Blob, duration: number) => void;
  onVideoUploaded?: (file: File) => void;
  maxDuration?: number;
  minDuration?: number;
  theme?: 'light' | 'dark';
}

export default function VideoRecorder({
  onVideoRecorded,
  onVideoUploaded,
  maxDuration = 60,
  minDuration = 5,
  theme = 'dark'
}: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const startRecording = async () => {
    if (!cameraActive) {
      await startCamera();
      return;
    }

    if (!streamRef.current) return;

    try {
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        recordedBlobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setRecordedVideo(url);
        stopCamera();
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      if (file.size > 100 * 1024 * 1024) {
        setError('Video file is too large (max 100MB)');
        return;
      }
      const url = URL.createObjectURL(file);
      setRecordedVideo(url);
      recordedBlobRef.current = file;
      if (onVideoUploaded) {
        onVideoUploaded(file);
      }
    }
  };

  const handleRetake = () => {
    setRecordedVideo(null);
    recordedBlobRef.current = null;
    setRecordingTime(0);
    setError(null);
  };

  const handleConfirm = () => {
    if (recordedBlobRef.current && recordingTime >= minDuration) {
      onVideoRecorded(recordedBlobRef.current, recordingTime);
    } else {
      setError(`Video must be at least ${minDuration} seconds long`);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-4">
      {error && (
        <div className={`${isDark ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-red-50 border-red-200 text-red-600'} border rounded-xl p-3 text-sm`}>
          {error}
        </div>
      )}

      <div className="relative bg-black rounded-2xl overflow-hidden aspect-[9/16] max-h-[600px]">
        {recordedVideo ? (
          <video
            src={recordedVideo}
            controls
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {isRecording && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')} / {Math.floor(maxDuration / 60)}:{(maxDuration % 60).toString().padStart(2, '0')}
          </div>
        )}

        {!isRecording && !recordedVideo && !cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a]">
            <div className="text-center text-white">
              <div className="bg-gradient-to-r from-[#ff5555] to-[#ff9500] rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Camera className="w-12 h-12" />
              </div>
              <p className="text-sm opacity-75">Ready to record</p>
            </div>
          </div>
        )}

        {cameraActive && !isRecording && !recordedVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-white">
              <div className="bg-red-500/20 rounded-full p-4 backdrop-blur-sm">
                <Video className="w-12 h-12" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {!recordedVideo && (
          <>
            {!isRecording ? (
              <button
                onClick={cameraActive ? startRecording : startCamera}
                className={`flex-1 ${isDark ? 'bg-gradient-to-r from-[#ff5555] to-[#ff9500] hover:shadow-lg hover:shadow-[#ff5555]/50' : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'} text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2`}
              >
                <Video className="w-5 h-5" />
                {cameraActive ? 'Start Recording' : 'Open Camera'}
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2"
              >
                <Square className="w-5 h-5" />
                Stop Recording
              </button>
            )}

            {onVideoUploaded && (
              <label className={`flex-1 ${isDark ? 'bg-[#3a3a3a] text-white border border-[#ff5555]/20 hover:bg-[#4a4a4a]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 cursor-pointer`}>
                <Upload className="w-5 h-5" />
                Upload
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </>
        )}

        {recordedVideo && (
          <>
            <button
              onClick={handleRetake}
              className={`flex-1 ${isDark ? 'bg-[#3a3a3a] text-white border border-[#ff5555]/20 hover:bg-[#4a4a4a]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2`}
            >
              <RotateCcw className="w-5 h-5" />
              Retake
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 ${isDark ? 'bg-gradient-to-r from-[#ff5555] to-[#ff9500] hover:shadow-lg hover:shadow-[#ff5555]/50' : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'} text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2`}
            >
              <Check className="w-5 h-5" />
              Use This Video
            </button>
          </>
        )}
      </div>

      <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'} text-center`}>
        Record a {minDuration}-{maxDuration} second video
      </p>
    </div>
  );
}
