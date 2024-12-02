import { useEffect, useRef, useState } from 'react';
import trucks from '../assets/trucks.mp4';
interface VideoTimelineProps {
  videoSrc?: string;
  frameCount?: number; // Number of preview frames to generate
}

const VideoTimeline = ({ 
  videoSrc = '/assets/trucks.mp4', 
  frameCount = 10,
  onStart,
  onReset,
  isSimulating
}: VideoTimelineProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, time: 0 });

  // Generate frame previews when video loads
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const generateFramePreviews = async () => {
      const frameArray: string[] = [];
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Generate frames at regular intervals
      for (let i = 0; i < frameCount; i++) {
        const time = (duration / frameCount) * i;
        video.currentTime = time;
        
        // Wait for video to seek to time
        await new Promise(resolve => {
          video.onseeked = resolve;
        });

        // Draw frame to canvas and get data URL
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frameArray.push(canvas.toDataURL('image/jpeg', 0.5));
      }

      setFrames(frameArray);
      
      // Reset video time
      video.currentTime = 0;
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      generateFramePreviews();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [frameCount]);

  // Add timeupdate event listener to track video progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  // Add playback rate setting when video loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = 0.25; // Set playback rate to 0.25x
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      generateFramePreviews();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [frameCount]);

  // Handle timeline hover preview
  const handleTimelineHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const timeline = e.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const previewTime = percent * duration;

    // Update preview position and time
    setPreviewPosition({ 
      x: Math.max(0, Math.min(x - 50, rect.width - 100)), // Keep preview within bounds
      time: previewTime 
    });

    setShowPreview(true);
  };

  const handleTimelineLeave = () => {
    setShowPreview(false);
  };

  // Existing event handlers
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.playbackRate = 0.25; // Ensure rate is set before playing
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleStart = () => {
    togglePlayPause();
    onStart();
  };

  const handleReset = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
    onReset();
  };

  // Update handleTimelineClick to immediately update currentTime
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const timeline = e.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * duration;
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime); // Immediately update UI
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-row w-full items-center">
        <video
        ref={videoRef}
        className="w-full rounded-lg mb-4" 
        style={{width:'200px'}}
        src={trucks}
      />
    <div className="w-full mx-auto mb-4 bg-gray-900 rounded-lg shadow-lg p-4 flex flex-col justify-center ml-4">
      
      
      {/* Hidden canvas for generating frames */}
      {/* <canvas ref={canvasRef} className="hidden" /> */}
      
      <div className="space-y-2 relative">
        {/* Frame previews */}
        <div className="flex w-full h-8 mb-2 rounded overflow-hidden">
          {frames.map((frame, index) => (
            <div 
              key={index}
              className="h-full flex-1"
              style={{
                backgroundImage: `url(${frame})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          ))}
        </div>

        {/* Timeline */}
        <div 
          className="h-2 bg-gray-700 rounded-full cursor-pointer relative"
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineHover}
          onMouseLeave={handleTimelineLeave}
        >
          <div 
            className="absolute h-full bg-teal-500 rounded-full"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          
          {/* Hover preview */}
          {showPreview && (
            <div 
              className="absolute bottom-full mb-2 transform -translate-x-1/2"
              style={{ left: previewPosition.x + 50 }}
            >
              <div className="bg-black rounded p-1 text-white text-xs mb-1 text-center">
                {formatTime(previewPosition.time)}
              </div>
              <div className="w-24 h-16 bg-black rounded overflow-hidden">
                <img 
                  src={frames[Math.floor((previewPosition.time / duration) * frameCount)]} 
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between text-white">
          {/* <button
            onClick={togglePlayPause}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-600 hover:bg-teal-700 transition-colors"
          >
            {isPlaying ? (
              <span className="material-icons text-lg">Pause</span>
            ) : (
              <span className="material-icons text-lg">Play</span>
            )}
          </button> */}

          <div className="flex items-center space-x-2 text-sm font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
      </div>
      
    </div>
    <div className="mb-4 text-center flex flex-col gap-4 ml-4">
          <button
            onClick={handleReset}
            className="px-4 w-64 py-2 text-lg font-semibold rounded bg-gray-800 hover:bg-gray-700 text-white"
          >
            Reset
          </button>
          <button
            onClick={handleStart}
            disabled={isSimulating}
            className={`px-4 py-2 text-lg font-semibold rounded w-64 ${
              isSimulating
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-800 hover:bg-teal-600 text-white"
            }`}
          >
            {isSimulating ? "Running..." : "Run"}
          </button>
        </div>
    </div>
  );
};

export default VideoTimeline;
