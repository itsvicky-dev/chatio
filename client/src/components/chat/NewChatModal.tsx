import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, MagnifyingGlassIcon, UserPlusIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import axios from 'axios';

interface NewChatModalProps {
  onClose: () => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ onClose }) => {
  const { contacts, user, token, addChat, setCurrentChat } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContacts, setFilteredContacts] = useState(contacts);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUserData, setSelectedUserData] = useState<any[]>([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const filtered = contacts.filter(contact =>
      contact.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContacts(filtered);

    // Search for new users if search term is present
    if (searchTerm.trim().length >= 2) {
      searchUsers(searchTerm);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, contacts]);

  const searchUsers = async (query: string) => {
    if (!token) return;
    
    setIsSearching(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSearchResults(response.data.data.users || []);
      }
    } catch (error) {
      console.error('User search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (userId: string, userData?: any) => {
    if (isGroupChat) {
      const isSelected = selectedUsers.includes(userId);
      setSelectedUsers(prev =>
        isSelected
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
      
      // Update selected user data for display
      if (!isSelected && userData) {
        setSelectedUserData(prev => [...prev, userData]);
      } else if (isSelected) {
        setSelectedUserData(prev => prev.filter(u => u._id !== userId));
      }
    } else {
      // Start direct chat
      createDirectChat(userId);
    }
  };

  const createDirectChat = async (participantId: string) => {
    if (!token) return;
    
    setIsCreating(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/chats`, {
        participants: [participantId],
        isGroupChat: false
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const chat = response.data.data.chat;
        addChat(chat);
        setCurrentChat(chat._id);
        navigate(`/chat/${chat._id}`);
        toast.success('Chat created successfully!');
        onClose();
      }
    } catch (error: any) {
      console.error('Direct chat creation failed:', error);
      const message = error.response?.data?.message || 'Failed to create chat';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length < 2 || !token) return;
    
    setIsCreating(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/chats`, {
        participants: selectedUsers,
        name: groupName.trim() || 'New Group',
        isGroupChat: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const chat = response.data.data.chat;
        addChat(chat);
        setCurrentChat(chat._id);
        navigate(`/chat/${chat._id}`);
        toast.success('Group created successfully!');
        onClose();
      }
    } catch (error: any) {
      console.error('Group chat creation failed:', error);
      const message = error.response?.data?.message || 'Failed to create group';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isGroupChat ? 'New Group' : 'New Chat'}
            </h2>
            {isCreating && (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Type Toggle */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setIsGroupChat(false);
                setSelectedUsers([]);
                setSelectedUserData([]);
              }}
              className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl transition-colors ${
                !isGroupChat
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <UserPlusIcon className="w-5 h-5" />
              <span>Direct Chat</span>
            </button>
            <button
              onClick={() => setIsGroupChat(true)}
              className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl transition-colors ${
                isGroupChat
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <UsersIcon className="w-5 h-5" />
              <span>Group Chat</span>
            </button>
          </div>
        </div>

        {/* Group Name Input */}
        <AnimatePresence>
          {isGroupChat && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-6">
                <input
                  type="text"
                  placeholder="Group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={isCreating}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isCreating}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Selected Users (for group chat) */}
        <AnimatePresence>
          {isGroupChat && selectedUsers.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Selected ({selectedUsers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedUserData.map(userData => (
                    <div
                      key={userData._id}
                      className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{userData.username}</span>
                      <button
                        onClick={() => handleUserSelect(userData._id, userData)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredContacts.length === 0 && searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <UsersIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {searchTerm ? 'No users found' : 'No contacts yet'}
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-2">
              {/* Search Results */}
              {searchResults.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Search Results ({searchResults.length})
                  </h4>
                  {searchResults.map((user, index) => (
                    <motion.button
                      key={`search-${user._id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleUserSelect(user._id, user)}
                      disabled={isCreating}
                      className={`w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedUsers.includes(user._id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="relative">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.username[0]?.toUpperCase()}
                          </div>
                        )}
                        {user.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user.bio || user.email}
                        </p>
                      </div>
                      {isGroupChat && selectedUsers.includes(user._id) && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </motion.button>
                  ))}
                  {filteredContacts.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                  )}
                </>
              )}
              
              {/* Contacts */}
              {filteredContacts.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Your Contacts ({filteredContacts.length})
                  </h4>
                  {filteredContacts.map((contact, index) => (
                <motion.button
                  key={contact._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleUserSelect(contact._id, contact)}
                  disabled={isCreating}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedUsers.includes(contact._id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="relative">
                    {contact.avatar ? (
                      <img
                        src={contact.avatar}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {contact.username[0]?.toUpperCase()}
                      </div>
                    )}
                    {contact.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {contact.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {contact.bio || contact.email}
                    </p>
                  </div>
                  {isGroupChat && selectedUsers.includes(contact._id) && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </motion.button>
              ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Create Group Button */}
        <AnimatePresence>
          {isGroupChat && selectedUsers.length >= 2 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-6">
                <button
                  onClick={handleCreateGroup}
                  disabled={isCreating || selectedUsers.length < 2}
                  className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    `Create Group (${selectedUsers.length} members)`
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default NewChatModal;