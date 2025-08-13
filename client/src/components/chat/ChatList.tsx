import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useStore } from '../../store/useStore';

interface ChatListProps {
  collapsed: boolean;
}

const ChatList: React.FC<ChatListProps> = ({ collapsed }) => {
  const { chats, currentChatId } = useStore();
  const navigate = useNavigate();
  const [hoveredChat, setHoveredChat] = useState<string | null>(null);

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  const formatLastSeen = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const getChatName = (chat: any) => {
    if (chat.isGroupChat) {
      return chat.name || 'Group Chat';
    }
    // For direct chats, show the other user's name
    const otherUser = chat.participants?.find((p: any) => p.user._id !== useStore.getState().user?._id);
    return otherUser?.user.username || 'Unknown User';
  };

  const getChatAvatar = (chat: any) => {
    if (chat.isGroupChat) {
      return chat.avatar;
    }
    // For direct chats, show the other user's avatar
    const otherUser = chat.participants?.find((p: any) => p.user._id !== useStore.getState().user?._id);
    return otherUser?.user.avatar;
  };

  const isUserOnline = (chat: any) => {
    if (chat.isGroupChat) return false;
    const otherUser = chat.participants?.find((p: any) => p.user._id !== useStore.getState().user?._id);
    return otherUser?.user.isOnline || false;
  };

  const getLastMessageText = (chat: any) => {
    const lastMessage = chat.lastMessage;
    if (!lastMessage) return 'No messages yet';
    
    if (lastMessage.messageType === 'text') {
      return lastMessage.content.text || 'Message';
    } else if (lastMessage.messageType === 'image') {
      return '📷 Photo';
    } else if (lastMessage.messageType === 'video') {
      return '🎥 Video';
    } else if (lastMessage.messageType === 'audio') {
      return '🎵 Audio';
    } else if (lastMessage.messageType === 'voice') {
      return '🎤 Voice message';
    } else if (lastMessage.messageType === 'document') {
      return '📄 Document';
    } else if (lastMessage.messageType === 'location') {
      return '📍 Location';
    }
    
    return 'Message';
  };

  if (collapsed) {
    return (
      <div className="p-2 space-y-2">
        {chats.map((chat) => {
          const isActive = currentChatId === chat._id;
          const avatar = getChatAvatar(chat);
          const isOnline = isUserOnline(chat);
          const unreadCount = chat.unreadCount || 0;
          
          return (
            <motion.div
              key={chat._id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <button
                onClick={() => handleChatClick(chat._id)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 relative ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt=""
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-semibold">
                    {getChatName(chat)[0]?.toUpperCase()}
                  </div>
                )}
                
                {/* Online indicator */}
                {isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
                )}
                
                {/* Unread count */}
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-1">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Recent Chats
        </h2>
        
        <AnimatePresence>
          {chats.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No conversations yet
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Start a new chat to begin
              </p>
            </motion.div>
          ) : (
            chats.map((chat, index) => {
              const isActive = currentChatId === chat._id;
              const chatName = getChatName(chat);
              const avatar = getChatAvatar(chat);
              const isOnline = isUserOnline(chat);
              const lastMessageText = getLastMessageText(chat);
              const unreadCount = chat.unreadCount || 0;
              const lastActivity = chat.lastActivity ? formatLastSeen(chat.lastActivity) : '';

              return (
                <motion.div
                  key={chat._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={() => setHoveredChat(chat._id)}
                  onHoverEnd={() => setHoveredChat(null)}
                >
                  <button
                    onClick={() => handleChatClick(chat._id)}
                    className={`w-full p-3 rounded-2xl transition-all duration-200 text-left group ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-blue-500/20 transition-all"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
                            {chatName[0]?.toUpperCase()}
                          </div>
                        )}
                        
                        {/* Online indicator */}
                        {isOnline && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800 pulse-green"
                          />
                        )}
                        
                        {/* Unread indicator */}
                        {unreadCount > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                          >
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </motion.div>
                        )}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-medium truncate ${
                            isActive ? 'text-white' : 'text-gray-900 dark:text-white'
                          }`}>
                            {chatName}
                            {chat.isGroupChat && (
                              <span className="text-xs ml-1 opacity-70">
                                ({chat.participants?.length || 0})
                              </span>
                            )}
                          </h3>
                          <span className={`text-xs flex-shrink-0 ml-2 ${
                            isActive ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {lastActivity}
                          </span>
                        </div>
                        
                        <p className={`text-sm truncate ${
                          isActive ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {lastMessageText}
                        </p>
                      </div>
                    </div>

                    {/* Hover effect overlay */}
                    <AnimatePresence>
                      {hoveredChat === chat._id && !isActive && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl pointer-events-none"
                        />
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatList;