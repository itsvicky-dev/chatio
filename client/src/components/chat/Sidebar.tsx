import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon,
  PlusIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useStore } from '../../store/useStore';
import { useTheme } from '../../providers/ThemeProvider';

// Components
import ChatList from './ChatList';
import StoriesBar from '../stories/StoriesBar';
import NewChatModal from './NewChatModal';
import SearchModal from './SearchModal';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onShowProfile: () => void;
  onShowSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  onShowProfile,
  onShowSettings
}) => {
  const { user, chats, token, addChat, setContacts } = useStore();
  const { theme, setTheme, currentTheme } = useTheme();
  const [showNewChat, setShowNewChat] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  const toggleTheme = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // Fetch chats on mount
  useEffect(() => {
    const fetchChats = async () => {
      if (!token) return;

      setIsLoadingChats(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        // Fetch chats
        const chatsResponse = await axios.get(`${API_URL}/chats`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (chatsResponse.data.success) {
          chatsResponse.data.data.chats.forEach((chat: any) => addChat(chat));
        }

        // Also fetch contacts for new chat creation
        const contactsResponse = await axios.get(`${API_URL}/users/contacts`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (contactsResponse.data.success) {
          setContacts(contactsResponse.data.data.contacts || []);
        }
      } catch (error) {
        console.error('Failed to fetch chats and contacts:', error);
      } finally {
        setIsLoadingChats(false);
      }
    };

    // Only fetch if we don't have chats loaded
    if (token && chats.length === 0) {
      fetchChats();
    }
  }, [token, chats.length]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 relative overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 gradient-primary rounded-2xl flex items-center justify-center shadow-md">
                <span className="text-lg font-bold text-white">C</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Convo
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Connected
                </p>
              </div>
            </motion.div>
          )}

          <div className="flex items-center space-x-2">
            {!collapsed && (
              <>
                {/* Theme Toggle */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTheme}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {currentTheme === 'dark' ? (
                    <SunIcon className="w-5 h-5" />
                  ) : (
                    <MoonIcon className="w-5 h-5" />
                  )}
                </motion.button>

                {/* New Chat */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNewChat(true)}
                  className="p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-md"
                >
                  <PlusIcon className="w-5 h-5" />
                </motion.button>
              </>
            )}

            {/* Collapse Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleCollapse}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Bars3Icon className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSearch(true)}
              className="w-full flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              <span className="text-sm">Search conversations...</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stories */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4"
          >
            <StoriesBar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat List */}
      <div className="flex-1 overflow-hidden">
        <ChatList collapsed={collapsed} />
      </div>

      {/* Bottom User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!collapsed ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onShowProfile}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-1"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-800"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-800">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {user?.username}
                </p>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Online
                  </span>
                </div>
              </div>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShowProfile}
              className="mx-auto"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-800"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-800">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              )}
            </motion.button>
          )}

          {!collapsed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShowSettings}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-all"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showNewChat && (
          <NewChatModal onClose={() => setShowNewChat(false)} />
        )}
        {showSearch && (
          <SearchModal onClose={() => setShowSearch(false)} />
        )}
      </AnimatePresence>

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-tr from-green-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default Sidebar;