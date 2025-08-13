import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, HeartIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useStore } from '../../store/useStore';

interface Story {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  type: 'image' | 'video' | 'text';
  timestamp: number;
  views: number;
  isLiked: boolean;
}

const StoriesView: React.FC = () => {
  const { user } = useStore();
  const [stories] = useState<Story[]>([
    {
      id: '1',
      userId: '1',
      username: 'John Doe',
      avatar: 'https://via.placeholder.com/40',
      content: 'https://via.placeholder.com/400x600',
      type: 'image',
      timestamp: Date.now() - 3600000,
      views: 45,
      isLiked: false,
    },
    {
      id: '2',
      userId: '2',
      username: 'Jane Smith',
      avatar: 'https://via.placeholder.com/40',
      content: 'Amazing sunset today! 🌅',
      type: 'text',
      timestamp: Date.now() - 7200000,
      views: 23,
      isLiked: true,
    }
  ]);

  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentStory = stories[currentStoryIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [currentStoryIndex]);

  const handleNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    }
  };

  const handlePreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    }
  };

  const handleLike = () => {
    // Implement like functionality
    console.log('Liked story:', currentStory.id);
  };

  const handleShare = () => {
    // Implement share functionality
    console.log('Shared story:', currentStory.id);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress Indicators */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex gap-1">
          {stories.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: '0%' }}
                animate={{
                  width: index < currentStoryIndex ? '100%' : index === currentStoryIndex ? `${progress}%` : '0%'
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={currentStory.avatar}
            alt={currentStory.username}
            className="w-8 h-8 rounded-full border-2 border-white"
          />
          <div className="text-white">
            <p className="font-semibold">{currentStory.username}</p>
            <p className="text-xs opacity-80">
              {Math.floor((Date.now() - currentStory.timestamp) / 3600000)}h ago
            </p>
          </div>
        </div>
        <button
          onClick={() => window.history.back()}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Story Content */}
      <div className="w-full h-full max-w-md mx-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStory.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full flex items-center justify-center"
          >
            {currentStory.type === 'image' && (
              <img
                src={currentStory.content}
                alt="Story content"
                className="w-full h-full object-cover"
              />
            )}
            {currentStory.type === 'text' && (
              <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 w-full h-full flex items-center justify-center p-8">
                <p className="text-white text-2xl font-bold text-center">{currentStory.content}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Areas */}
        <button
          onClick={handlePreviousStory}
          className="absolute left-0 top-0 w-1/3 h-full bg-transparent"
          disabled={currentStoryIndex === 0}
        />
        <button
          onClick={handleNextStory}
          className="absolute right-0 top-0 w-1/3 h-full bg-transparent"
          disabled={currentStoryIndex === stories.length - 1}
        />
      </div>

      {/* Actions */}
      <div className="absolute bottom-8 left-4 right-4 z-10">
        <div className="flex items-center justify-center space-x-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className="text-white hover:text-red-500 transition-colors"
          >
            {currentStory.isLiked ? (
              <HeartSolidIcon className="w-7 h-7 text-red-500" />
            ) : (
              <HeartIcon className="w-7 h-7" />
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="text-white hover:text-blue-500 transition-colors"
          >
            <ShareIcon className="w-7 h-7" />
          </motion.button>
        </div>
        <div className="text-center text-white/80 text-sm mt-2">
          {currentStory.views} views
        </div>
      </div>
    </div>
  );
};

export default StoriesView;