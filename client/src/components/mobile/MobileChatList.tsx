import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  CameraIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../../store/useStore';

const MobileChatList: React.FC = () => {
  const { chats, user } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock chats data
  const mockChats = [
    {
      id: '1',
      name: 'John Doe',
      avatar: 'https://via.placeholder.com/50',
      lastMessage: 'Hey! How are you doing?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      unreadCount: 2,
      isOnline: true,
      isTyping: false,
      isGroup: false
    },
    {
      id: '2',
      name: 'Team Project',
      avatar: 'https://via.placeholder.com/50',
      lastMessage: 'Sarah: The design looks great!',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      unreadCount: 0,
      isOnline: false,
      isTyping: true,
      isGroup: true
    },
    {
      id: '3',
      name: 'Jane Smith',
      avatar: 'https://via.placeholder.com/50',
      lastMessage: 'Thanks for your help today 👍',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      unreadCount: 0,
      isOnline: false,
      isTyping: false,
      isGroup: false
    }
  ];

  const filteredChats = mockChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-blue-500 text-white p-4 pt-12">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Convo</h1>
          <div className="flex space-x-2">
            <button className="p-2 hover:bg-blue-600 rounded-full transition-colors">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-blue-600 rounded-full transition-colors">
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </div>

      {/* Stories Section */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Link
            to="/stories"
            className="flex flex-col items-center space-y-1"
          >
            <div className="relative">
              <img
                src={user?.avatar || 'https://via.placeholder.com/60'}
                alt={user?.username || 'My Story'}
                className="w-14 h-14 rounded-full border-2 border-gray-300"
              />
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                <PlusIcon className="w-3 h-3 text-white" />
              </div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">My Story</span>
          </Link>

          {/* Mock story contacts */}
          {[1, 2, 3, 4].map((i) => (
            <Link
              key={i}
              to="/stories"
              className="flex flex-col items-center space-y-1"
            >
              <div className="story-ring p-0.5 rounded-full">
                <img
                  src={`https://via.placeholder.com/60?text=${i}`}
                  alt={`Story ${i}`}
                  className="w-14 h-14 rounded-full border-2 border-white"
                />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">User {i}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map((chat) => (
          <motion.div key={chat.id} whileHover={{ backgroundColor: '#f9fafb' }}>
            <Link
              to={`/chat/${chat.id}`}
              className="flex items-center p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="relative mr-3">
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className="w-12 h-12 rounded-full"
                />
                {chat.isGroup && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="w-3 h-3 text-white" />
                  </div>
                )}
                {!chat.isGroup && chat.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {chat.name}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {formatTime(chat.timestamp)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {chat.isTyping ? (
                      <span className="text-blue-500 italic">typing...</span>
                    ) : (
                      chat.lastMessage
                    )}
                  </p>
                  {chat.unreadCount > 0 && (
                    <div className="flex-shrink-0 ml-2">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {filteredChats.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No chats found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Try a different search term' : 'Start a new conversation'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-around">
          <button className="flex flex-col items-center space-y-1 text-blue-500">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">C</span>
            </div>
            <span className="text-xs">Chats</span>
          </button>
          
          <Link to="/stories" className="flex flex-col items-center space-y-1 text-gray-500">
            <CameraIcon className="w-6 h-6" />
            <span className="text-xs">Stories</span>
          </Link>
          
          <Link to="/profile" className="flex flex-col items-center space-y-1 text-gray-500">
            <div className="w-6 h-6 rounded-full overflow-hidden">
              <img
                src={user?.avatar || 'https://via.placeholder.com/24'}
                alt={user?.username || 'Profile'}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute bottom-20 right-4 w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center"
      >
        <PlusIcon className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
};

export default MobileChatList;