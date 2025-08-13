import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhoneIcon, 
  VideoCameraIcon, 
  InformationCircleIcon,
  FaceSmileIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
  MicrophoneIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../../store/useStore';
import { useSocket } from '../../providers/SocketProvider';

// Components
import MessageBubble from './MessageBubble';
// import TypingIndicator from './TypingIndicator';
// import EmojiPicker from './EmojiPicker';
// import MediaPreview from './MediaPreview';
// import VoiceRecorder from './VoiceRecorder';

const ChatWindow: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { 
    messages, 
    chats, 
    currentChatId, 
    setCurrentChat,
    isTyping,
    user 
  } = useStore();
  
  const { sendMessage, joinChat, leaveChat, startTyping, stopTyping } = useSocket();
  
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [typingTimer, setTypingTimer] = useState<number | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentChat = chats.find(chat => chat._id === chatId);
  const chatMessages = messages[chatId || ''] || [];
  const typingUsers = isTyping[chatId || ''] || [];

  useEffect(() => {
    if (chatId) {
      setCurrentChat(chatId);
      joinChat(chatId);
    }

    return () => {
      if (chatId) {
        leaveChat(chatId);
      }
    };
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getChatName = () => {
    if (!currentChat) return 'Unknown Chat';
    if (currentChat.isGroupChat) return currentChat.name || 'Group Chat';
    
    const otherUser = currentChat.participants?.find(
      (p: any) => p.user._id !== user?._id
    );
    return otherUser?.user.username || 'Unknown User';
  };

  const getChatAvatar = () => {
    if (!currentChat) return null;
    if (currentChat.isGroupChat) return currentChat.avatar;
    
    const otherUser = currentChat.participants?.find(
      (p: any) => p.user._id !== user?._id
    );
    return otherUser?.user.avatar;
  };

  const isUserOnline = () => {
    if (!currentChat || currentChat.isGroupChat) return false;
    const otherUser = currentChat.participants?.find(
      (p: any) => p.user._id !== user?._id
    );
    return otherUser?.user.isOnline || false;
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !chatId) return;

    sendMessage(
      chatId,
      { text: messageText.trim() },
      'text',
      replyingTo?._id
    );

    setMessageText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    
    // Stop typing
    if (typingTimer) {
      window.clearTimeout(typingTimer);
    }
    stopTyping(chatId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessageText(value);

    if (!chatId) return;

    // Handle typing indicators
    if (value.trim()) {
      startTyping(chatId);
      
      if (typingTimer) {
        window.clearTimeout(typingTimer);
      }
      
      const timer = window.setTimeout(() => {
        stopTyping(chatId);
      }, 2000);
      
      setTypingTimer(timer);
    } else {
      stopTyping(chatId);
      if (typingTimer) {
        window.clearTimeout(typingTimer);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    messageInputRef.current?.focus();
  };

  const handleFileSelect = (files: FileList) => {
    if (!files.length || !chatId) return;

    Array.from(files).forEach(file => {
      // Handle different file types
      let messageType = 'document';
      if (file.type.startsWith('image/')) messageType = 'image';
      else if (file.type.startsWith('video/')) messageType = 'video';
      else if (file.type.startsWith('audio/')) messageType = 'audio';

      // Create FormData and upload file
      const formData = new FormData();
      formData.append('file', file);

      // Send file message (you'll need to implement file upload)
      sendMessage(chatId, { file }, messageType);
    });
  };

  const handleVoiceRecorded = (audioBlob: Blob) => {
    if (!chatId) return;
    
    // Convert blob to file and send
    const audioFile = new File([audioBlob], 'voice-message.wav', {
      type: 'audio/wav'
    });
    
    sendMessage(chatId, { file: audioFile }, 'voice');
  };

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-2xl">💬</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Chat not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative">
      {/* Chat Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
      >
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="relative">
            {getChatAvatar() ? (
              <img
                src={getChatAvatar()}
                alt=""
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                {getChatName()[0]?.toUpperCase()}
              </div>
            )}
            {isUserOnline() && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
            )}
          </div>

          {/* Chat Info */}
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {getChatName()}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentChat.isGroupChat 
                ? `${currentChat.participants?.length || 0} members`
                : isUserOnline() 
                  ? 'Online' 
                  : 'Offline'
              }
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <PhoneIcon className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <VideoCameraIcon className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <InformationCircleIcon className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900">
        {/* Loading Messages */}
        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-500 dark:text-gray-400">Loading messages...</span>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-2">No messages yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Start the conversation!</p>
              </div>
            ) : (
              chatMessages.map((message, index) => (
                <MessageBubble
                  key={message._id}
                  message={message}
                  isOwn={message.sender._id === user?._id}
                  showAvatar={
                    index === 0 ||
                    chatMessages[index - 1]?.sender._id !== message.sender._id
                  }
                  onReply={() => setReplyingTo(message)}
                />
              ))
            )}
          </AnimatePresence>
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 px-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span>{typingUsers.length} user{typingUsers.length > 1 ? 's' : ''} typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Replying to {replyingTo.sender.username}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {replyingTo.content.text || 'Media message'}
                </p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end space-x-3">
          {/* Media Attachment */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMediaPicker(!showMediaPicker)}
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <PaperClipIcon className="w-5 h-5" />
            </motion.button>

            <AnimatePresence>
              {showMediaPicker && (
                <MediaPreview
                  onClose={() => setShowMediaPicker(false)}
                  onFileSelect={handleFileSelect}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              ref={messageInputRef}
              value={messageText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full p-3 pr-12 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none max-h-32"
              rows={1}
              style={{
                height: 'auto',
                minHeight: '48px',
                maxHeight: '128px'
              }}
            />

            {/* Emoji Button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>

            {/* Emoji Picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <EmojiPicker
                  onEmojiSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Send/Voice Button */}
          {messageText.trim() ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </motion.button>
          ) : (
            <div className="relative">
              {isRecordingVoice ? (
                <VoiceRecorder
                  onRecordingComplete={handleVoiceRecorded}
                  onCancel={() => setIsRecordingVoice(false)}
                />
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseDown={() => setIsRecordingVoice(true)}
                  className="p-3 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors shadow-lg"
                >
                  <MicrophoneIcon className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
      />
    </div>
  );
};

export default ChatWindow;