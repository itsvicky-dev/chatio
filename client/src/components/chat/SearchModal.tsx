import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, MagnifyingGlassIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useStore } from '../../store/useStore';

interface SearchModalProps {
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ onClose }) => {
  const { chats, messages } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searches = localStorage.getItem('recentSearches');
    if (searches) {
      setRecentSearches(JSON.parse(searches));
    }
  }, []);

  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        performSearch(searchTerm);
        setIsSearching(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const performSearch = (query: string) => {
    const results: any[] = [];

    // Search in chats
    chats.forEach(chat => {
      const chatName = chat.isGroupChat 
        ? chat.name 
        : chat.participants?.find((p: any) => p.user._id !== useStore.getState().user?._id)?.user.username;
      
      if (chatName?.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          type: 'chat',
          id: chat._id,
          name: chatName,
          avatar: chat.avatar || chat.participants?.[0]?.user.avatar,
          isGroupChat: chat.isGroupChat
        });
      }
    });

    // Search in messages
    Object.entries(messages).forEach(([chatId, chatMessages]) => {
      chatMessages.forEach(message => {
        if (message.content.text?.toLowerCase().includes(query.toLowerCase())) {
          const chat = chats.find(c => c._id === chatId);
          results.push({
            type: 'message',
            id: message._id,
            chatId,
            chatName: chat?.name || chat?.participants?.[0]?.user.username,
            senderName: message.sender.username,
            content: message.content.text,
            timestamp: message.createdAt
          });
        }
      });
    });

    setSearchResults(results.slice(0, 20)); // Limit results
  };

  const addToRecentSearches = (term: string) => {
    const newSearches = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(newSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newSearches));
  };

  const handleSearchSelect = (result: any) => {
    addToRecentSearches(searchTerm);
    
    if (result.type === 'chat') {
      // Navigate to chat
      console.log('Navigate to chat:', result.id);
    } else if (result.type === 'message') {
      // Navigate to message in chat
      console.log('Navigate to message:', result.id, 'in chat:', result.chatId);
    }
    
    onClose();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: -20 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages and contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {searchTerm.trim().length === 0 ? (
            /* Recent Searches */
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Recent Searches
                </h3>
                {recentSearches.length > 0 && (
                  <button
                    onClick={clearRecentSearches}
                    className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {recentSearches.length === 0 ? (
                <div className="text-center py-12">
                  <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No recent searches
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchTerm(search)}
                      className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <ClockIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{search}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : isSearching ? (
            /* Loading */
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : searchResults.length === 0 ? (
            /* No Results */
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No results found for "{searchTerm}"
              </p>
            </div>
          ) : (
            /* Search Results */
            <div className="p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Search Results ({searchResults.length})
              </h3>

              <div className="space-y-3">
                {searchResults.map((result, index) => (
                  <motion.button
                    key={`${result.type}-${result.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSearchSelect(result)}
                    className="w-full flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {result.avatar ? (
                        <img
                          src={result.avatar}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {result.name?.[0]?.toUpperCase() || result.chatName?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {result.type === 'chat' ? result.name : result.chatName}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {result.type === 'chat' ? 'Chat' : 'Message'}
                        </span>
                      </div>

                      {result.type === 'message' && (
                        <>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                            From: {result.senderName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {result.content}
                          </p>
                        </>
                      )}

                      {result.type === 'chat' && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {result.isGroupChat ? 'Group Chat' : 'Direct Message'}
                        </p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SearchModal;