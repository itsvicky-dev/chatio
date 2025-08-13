import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';

// Components
import Sidebar from '../chat/Sidebar';
import ChatWindow from '../chat/ChatWindow';
import StoriesView from '../stories/StoriesView';
import CallWindow from '../calls/CallWindow';
import ProfilePanel from '../profile/ProfilePanel';
import SettingsPanel from '../settings/SettingsPanel';

// Mobile components
import MobileChatList from '../mobile/MobileChatList';
import MobileChat from '../mobile/MobileChat';

const ChatLayout: React.FC = () => {
  const { 
    currentChatId, 
    sidebarCollapsed, 
    setSidebarCollapsed,
    activeCall,
    incomingCall,
    setCurrentChat,
  } = useStore();
  const location = useLocation();
  
  const [isMobile, setIsMobile] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Clear selected chat when not on a specific chat route
  useEffect(() => {
    const isChatDetail = /^\/chat\/[\w-]+$/.test(location.pathname);
    if (!isChatDetail && currentChatId) {
      setCurrentChat(null);
    }
  }, [location.pathname, currentChatId, setCurrentChat]);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <Routes>
          <Route path="/" element={<MobileChatList />} />
          <Route path="/chat" element={<MobileChatList />} />
          <Route path="/chat/:chatId" element={<MobileChat />} />
          <Route path="/stories" element={<StoriesView />} />
          <Route path="/profile" element={<ProfilePanel />} />
          <Route path="/settings" element={<SettingsPanel />} />
        </Routes>

        {/* Mobile Call Overlay */}
        <AnimatePresence>
          {(activeCall || incomingCall) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
            >
              <CallWindow />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: sidebarCollapsed ? '80px' : '320px'
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg relative z-10"
      >
        <Sidebar 
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onShowProfile={() => setShowProfile(true)}
          onShowSettings={() => setShowSettings(true)}
        />
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <Routes>
          <Route 
            path="/" 
            element={
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center p-8"
                >
                  <div className="w-32 h-32 mx-auto mb-6 gradient-primary rounded-full flex items-center justify-center shadow-2xl">
                    <span className="text-4xl font-bold text-white">C</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Welcome to Convo
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg mb-6 max-w-md mx-auto">
                    Select a conversation to start chatting, or create a new one to begin connecting with friends.
                  </p>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-4xl"
                  >
                    💬
                  </motion.div>
                </motion.div>
              </div>
            } 
          />
          <Route 
            path="/chat" 
            element={
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center p-8"
                >
                  <div className="w-32 h-32 mx-auto mb-6 gradient-primary rounded-full flex items-center justify-center shadow-2xl">
                    <span className="text-4xl font-bold text-white">C</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Welcome to Convo
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg mb-6 max-w-md mx-auto">
                    Select a conversation to start chatting, or create a new one to begin connecting with friends.
                  </p>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-4xl"
                  >
                    💬
                  </motion.div>
                </motion.div>
              </div>
            } 
          />
          <Route 
            path="/chat/:chatId" 
            element={<ChatWindow />} 
          />
          <Route 
            path="/stories" 
            element={<StoriesView />} 
          />
        </Routes>
      </div>

      {/* Right Panel (Profile/Settings) */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-20"
          >
            <ProfilePanel onClose={() => setShowProfile(false)} />
          </motion.div>
        )}
        
        {showSettings && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-20"
          >
            <SettingsPanel onClose={() => setShowSettings(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call Window Overlay */}
      <AnimatePresence>
        {(activeCall || incomingCall) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <CallWindow />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatLayout;