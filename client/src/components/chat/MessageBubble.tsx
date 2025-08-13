import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  EllipsisVerticalIcon,
  ArrowUturnLeftIcon,
  HeartIcon,
  FaceSmileIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  showAvatar: boolean;
  onReply: () => void;
  onReact?: (emoji: string) => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar,
  onReply,
  onReact,
  onDelete,
  onEdit
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const formatTime = (date: Date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();
    
    if (isToday) {
      return format(messageDate, 'HH:mm');
    } else {
      return format(messageDate, 'MMM d, HH:mm');
    }
  };

  const getStatusIcon = () => {
    if (!isOwn) return null;

    const DoubleCheckIcon = ({ className }: { className: string }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 16 16">
        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
        <path d="m7.507 6.128-.614-.485a.75.75 0 0 0-.478-.238h-.413a.75.75 0 0 0-.53.22L3.27 7.827a.75.75 0 1 0 1.06 1.061l2.202-2.202.975.785z"/>
      </svg>
    );

    switch (message.status) {
      case 'sent':
        return <CheckIcon className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <DoubleCheckIcon className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <DoubleCheckIcon className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const renderMessageContent = () => {
    switch (message.messageType) {
      case 'text':
        return (
          <p className="break-words whitespace-pre-wrap">
            {message.content.text}
          </p>
        );
      
      case 'image':
        return (
          <div className="space-y-2">
            {message.content.media?.map((media: any, index: number) => (
              <img
                key={index}
                src={media.url}
                alt=""
                className="max-w-xs rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {/* Open image viewer */}}
              />
            ))}
            {message.content.text && (
              <p className="mt-2">{message.content.text}</p>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className="space-y-2">
            {message.content.media?.map((media: any, index: number) => (
              <video
                key={index}
                src={media.url}
                controls
                className="max-w-xs rounded-lg shadow-md"
                poster={media.thumbnailUrl}
              />
            ))}
            {message.content.text && (
              <p className="mt-2">{message.content.text}</p>
            )}
          </div>
        );
      
      case 'audio':
      case 'voice':
        return (
          <div className="flex items-center space-x-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <button className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="flex-1">
              <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: '30%' }}></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {message.content.media?.[0]?.duration || '0:30'}
              </p>
            </div>
          </div>
        );
      
      case 'document':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="p-2 bg-blue-500 text-white rounded">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {message.content.media?.[0]?.filename || 'Document'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {message.content.media?.[0]?.size 
                  ? `${(message.content.media[0].size / 1024 / 1024).toFixed(2)} MB`
                  : 'Unknown size'
                }
              </p>
            </div>
          </div>
        );
      
      case 'location':
        return (
          <div className="space-y-2">
            <div className="w-64 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-4xl">📍</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {message.content.location?.address || 'Shared location'}
            </p>
          </div>
        );
      
      default:
        return <p>Unsupported message type</p>;
    }
  };

  const quickReactions = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      <div className={`flex items-end space-x-2 max-w-sm md:max-w-md lg:max-w-lg ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        {!isOwn && showAvatar && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {message.sender.avatar ? (
              <img
                src={message.sender.avatar}
                alt={message.sender.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {message.sender.username[0]?.toUpperCase()}
              </div>
            )}
          </motion.div>
        )}

        {/* Message Content */}
        <div className="relative">
          {/* Reply Preview */}
          {message.replyTo && (
            <div className={`mb-2 p-2 rounded-lg border-l-2 ${
              isOwn 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' 
                : 'bg-gray-100 dark:bg-gray-700 border-gray-400'
            }`}>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {message.replyTo.sender.username}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {message.replyTo.content.text || 'Media message'}
              </p>
            </div>
          )}

          {/* Main Message Bubble */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`p-3 rounded-2xl shadow-sm relative ${
              isOwn
                ? 'chat-bubble-sent ml-auto'
                : 'chat-bubble-received'
            }`}
          >
            {/* Sender name for group chats */}
            {!isOwn && !showAvatar && (
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {message.sender.username}
              </p>
            )}

            {/* Message Content */}
            <div className="text-sm">
              {renderMessageContent()}
            </div>

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {message.reactions.map((reaction: any, index: number) => (
                  <motion.span
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-700 rounded-full text-xs shadow-sm"
                  >
                    {reaction.emoji}
                    <span className="ml-1 text-gray-500 dark:text-gray-400">
                      {reaction.count || 1}
                    </span>
                  </motion.span>
                ))}
              </div>
            )}

            {/* Message time and status */}
            <div className={`flex items-center justify-end space-x-1 mt-1 ${
              isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
            }`}>
              <span className="text-xs">
                {formatTime(message.createdAt)}
              </span>
              {message.edited.isEdited && (
                <span className="text-xs opacity-70">edited</span>
              )}
              {getStatusIcon()}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className={`absolute top-0 flex items-center space-x-1 z-10 ${
                  isOwn ? '-left-20' : '-right-20'
                }`}
              >
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <FaceSmileIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                
                <button
                  onClick={onReply}
                  className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <ArrowUturnLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>

                {isOwn && (
                  <>
                    <button
                      onClick={onEdit}
                      className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <PencilSquareIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    
                    <button
                      onClick={onDelete}
                      className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* Quick Reactions */}
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className={`absolute top-10 bg-white dark:bg-gray-700 rounded-full shadow-lg p-2 flex space-x-1 z-20 ${
                  isOwn ? '-left-32' : '-right-32'
                }`}
              >
                {quickReactions.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => onReact?.(emoji)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;