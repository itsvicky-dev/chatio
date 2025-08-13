import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeftIcon,
  PhoneIcon,
  VideoCameraIcon,
  EllipsisVerticalIcon,
  PaperAirplaneIcon,
  PlusIcon,
  FaceSmileIcon,
  PaperClipIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../../store/useStore';

const MobileChat: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useStore();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock chat data
  const chatData = {
    id: chatId,
    name: 'John Doe',
    avatar: 'https://via.placeholder.com/40',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    isGroup: false
  };

  // Mock messages
  const messages = [
    {
      id: '1',
      senderId: '2',
      content: 'Hey! How are you doing?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      type: 'text' as const,
      status: 'read' as const
    },
    {
      id: '2',
      senderId: user?._id || '1',
      content: 'I\'m doing great! Just finished a project. How about you?',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      type: 'text' as const,
      status: 'read' as const
    },
    {
      id: '3',
      senderId: '2',
      content: 'That\'s awesome! I\'d love to see it sometime. I\'ve been working on something similar.',
      timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      type: 'text' as const,
      status: 'read' as const
    },
    {
      id: '4',
      senderId: user?._id || '1',
      content: 'Sure! Let\'s catch up over coffee this weekend?',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      type: 'text' as const,
      status: 'delivered' as const
    }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      // In a real app, this would send the message via API
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real app, this would start/stop voice recording
  };

  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 pt-12">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="relative">
            <img
              src={chatData.avatar}
              alt={chatData.name}
              className="w-10 h-10 rounded-full"
            />
            {chatData.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 dark:text-white truncate">
              {chatData.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {chatData.isOnline ? 'Online' : `Last seen ${formatTime(chatData.lastSeen)}`}
            </p>
          </div>

          <div className="flex space-x-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <PhoneIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <VideoCameraIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <EllipsisVerticalIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isOwn = msg.senderId === user?._id;
          const showAvatar = !isOwn && (index === 0 || messages[index - 1].senderId !== msg.senderId);
          
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                showAvatar ? 'mt-4' : 'mt-1'
              }`}
            >
              {!isOwn && showAvatar && (
                <img
                  src={chatData.avatar}
                  alt={chatData.name}
                  className="w-8 h-8 rounded-full mr-2 flex-shrink-0"
                />
              )}
              
              {!isOwn && !showAvatar && <div className="w-10 flex-shrink-0" />}

              <div className={`max-w-xs lg:max-w-md ${isOwn ? 'ml-auto' : ''}`}>
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isOwn
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
                
                <div className={`flex items-center mt-1 space-x-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(msg.timestamp)}
                  </span>
                  {isOwn && (
                    <div className="flex space-x-1">
                      <div className={`w-4 h-4 ${
                        msg.status === 'sent' ? 'text-gray-400' :
                        msg.status === 'delivered' ? 'text-gray-600' : 'text-blue-500'
                      }`}>
                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                          {msg.status === 'read' && (
                            <path d="M10.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L3.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                          )}
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end space-x-2">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <PlusIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full p-3 pr-12 bg-gray-100 dark:bg-gray-700 rounded-2xl border-none resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            
            <div className="absolute right-3 bottom-3 flex space-x-1">
              <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
                <PaperClipIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
                <FaceSmileIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {message.trim() ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
            >
              <PaperAirplaneIcon className="w-5 h-5 text-white" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleRecording}
              className={`p-2 rounded-full transition-colors ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <MicrophoneIcon className={`w-5 h-5 ${
                isRecording ? 'text-white' : 'text-gray-600 dark:text-gray-400'
              }`} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileChat;