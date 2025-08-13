import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useStore } from '../../store/useStore';
import StoryCreateModal from './StoryCreateModal';

const StoriesBar: React.FC = () => {
  const { stories, user } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    const userId = story.creator._id;
    if (!acc[userId]) {
      acc[userId] = {
        user: story.creator,
        stories: []
      };
    }
    acc[userId].stories.push(story);
    return acc;
  }, {} as Record<string, { user: any; stories: any[] }>);

  const storyUsers = Object.values(groupedStories);

  const handleAddStory = () => {
    setShowCreateModal(true);
  };

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Stories
        </h3>
      </div>

      <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
        {/* Add Story Button */}
        <motion.button
          onClick={handleAddStory}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0 flex flex-col items-center space-y-2 group"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-lg">
                  {user?.username?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
              <PlusIcon className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400 text-center max-w-16 truncate">
            Your Story
          </span>
        </motion.button>

        {/* Story Users */}
        {storyUsers.map((userStory, index) => (
          <motion.button
            key={userStory.user._id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 flex flex-col items-center space-y-2 group"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full p-0.5 story-ring">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
                  {userStory.user.avatar ? (
                    <img
                      src={userStory.user.avatar}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {userStory.user.username[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {userStory.stories.length > 1 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {userStory.stories.length}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 text-center max-w-16 truncate">
              {userStory.user.username}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Story Create Modal */}
      <StoryCreateModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default StoriesBar;