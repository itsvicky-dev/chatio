import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  XMarkIcon,
  CameraIcon,
  PencilIcon,
  PhoneIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../../store/useStore';

interface ProfilePanelProps {
  onClose: () => void;
  userId?: string;
}

const ProfilePanel: React.FC<ProfilePanelProps> = ({ onClose, userId }) => {
  const { user, currentChatId } = useStore();
  const [activeTab, setActiveTab] = useState<'media' | 'files' | 'links'>('media');

  // Mock profile data - in real app this would come from props or API
  const profile = {
    id: userId || user?._id || '1',
    name: user?.username || 'John Doe',
    username: '@johndoe',
    bio: 'Software Developer | Photography Enthusiast | Travel Lover ✈️',
    avatar: 'https://via.placeholder.com/150',
    phone: '+1 (555) 123-4567',
    email: 'john.doe@example.com',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    mutualFriends: 12,
    media: [
      { id: '1', type: 'image', url: 'https://via.placeholder.com/200x200', timestamp: new Date() },
      { id: '2', type: 'video', url: 'https://via.placeholder.com/200x200', timestamp: new Date() },
      { id: '3', type: 'image', url: 'https://via.placeholder.com/200x200', timestamp: new Date() },
    ]
  };

  const isOwnProfile = profile.id === user?._id;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full h-full bg-white dark:bg-gray-800 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Header */}
        <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
          <div className="relative inline-block">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-24 h-24 rounded-full mx-auto mb-3"
            />
            {isOwnProfile && (
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <CameraIcon className="w-4 h-4 text-white" />
              </button>
            )}
            {!isOwnProfile && profile.isOnline && (
              <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          
          <div className="flex items-center justify-center space-x-2 mb-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{profile.name}</h3>
            {isOwnProfile && (
              <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                <PencilIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{profile.username}</p>
          {!profile.isOnline && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Last seen {new Date(profile.lastSeen).toLocaleString()}
            </p>
          )}
          
          {profile.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 max-w-xs mx-auto">
              {profile.bio}
            </p>
          )}

          {!isOwnProfile && profile.mutualFriends > 0 && (
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">
              {profile.mutualFriends} mutual friends
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2">
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                <span>Message</span>
              </button>
              <button className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <PhoneIcon className="w-5 h-5" />
              </button>
              <button className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <VideoCameraIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Profile Information */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex items-center space-x-3">
            <PhoneIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-900 dark:text-white">{profile.phone}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Mobile</p>
            </div>
          </div>
          
          {profile.email && (
            <div className="flex items-center space-x-3">
              <span className="w-5 h-5 text-gray-400 text-sm">@</span>
              <div>
                <p className="text-sm text-gray-900 dark:text-white">{profile.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            {(['media', 'files', 'links'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-4 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'media' && (
            <div className="grid grid-cols-3 gap-2">
              {profile.media.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer"
                >
                  <img
                    src={item.url}
                    alt="Media"
                    className="w-full h-full object-cover"
                  />
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <VideoCameraIcon className="w-6 h-6 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
              {profile.media.length === 0 && (
                <div className="col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
                  No media shared yet
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No files shared yet
            </div>
          )}

          {activeTab === 'links' && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No links shared yet
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      {!isOwnProfile && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              <HeartIcon className="w-4 h-4" />
              <span className="text-sm">Block User</span>
            </button>
            <button className="flex items-center justify-center p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ShareIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProfilePanel;