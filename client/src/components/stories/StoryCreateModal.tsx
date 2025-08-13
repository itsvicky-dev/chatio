import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  PhotoIcon, 
  VideoCameraIcon, 
  PaintBrushIcon,
  FaceSmileIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';
import { useStore } from '../../store/useStore';
import axios from 'axios';
import toast from 'react-hot-toast';

interface StoryCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type StoryType = 'text' | 'media';

const backgroundColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
  '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#f97316'
];

const StoryCreateModal: React.FC<StoryCreateModalProps> = ({ isOpen, onClose }) => {
  const { token, user, addStory } = useStore();
  const [storyType, setStoryType] = useState<StoryType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Text story states
  const [textContent, setTextContent] = useState('');
  const [selectedBgColor, setSelectedBgColor] = useState(backgroundColors[0]);
  
  // Media story states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaCaption, setMediaCaption] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (isLoading) return;
    resetModal();
    onClose();
  };

  const resetModal = () => {
    setStoryType(null);
    setTextContent('');
    setSelectedBgColor(backgroundColors[0]);
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaCaption('');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image or video file');
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size too large. Maximum size is 100MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const removeSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateTextStory = async () => {
    if (!textContent.trim()) {
      toast.error('Please enter some text for your story');
      return;
    }

    if (textContent.length > 500) {
      toast.error('Story text cannot exceed 500 characters');
      return;
    }

    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/stories/text`, {
        content: {
          text: textContent.trim(),
          backgroundColor: selectedBgColor
        },
        privacy: 'contacts'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        addStory(response.data.data.story);
        toast.success('Text story created successfully!');
        handleClose();
      }
    } catch (error: any) {
      console.error('Text story creation error:', error);
      const message = error.response?.data?.message || 'Failed to create story';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMediaStory = async () => {
    if (!selectedFile) {
      toast.error('Please select a file for your story');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('caption', mediaCaption.trim());
      formData.append('privacy', 'contacts');

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/stories/media`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        addStory(response.data.data.story);
        toast.success('Media story created successfully!');
        handleClose();
      }
    } catch (error: any) {
      console.error('Media story creation error:', error);
      const message = error.response?.data?.message || 'Failed to create story';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const addEmojiToCaption = (emoji: string) => {
    setMediaCaption(prev => prev + emoji);
  };

  const addEmojiToText = (emoji: string) => {
    setTextContent(prev => prev + emoji);
  };

  const emojiCategories = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
    'Gestures': ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💋', '💌'],
    'Objects': ['🔥', '✨', '💯', '💫', '⭐', '🌟', '⚡', '💥', '💢', '💨', '💦', '💤', '🎉', '🎊', '🎈', '🎁', '🎀', '🏆', '🥇', '🎯', '🎪', '🎭'],
    'Nature': ['🌍', '🌎', '🌏', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌛', '🌜', '☀️', '🌝', '🌞', '🪐', '⭐', '🌟', '🌠', '🌌', '☁️', '⛅', '🌤️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️']
  };

  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('Smileys');

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {storyType && (
              <button
                onClick={() => setStoryType(null)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {!storyType ? 'Create Story' : storyType === 'text' ? 'Text Story' : 'Media Story'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {!storyType ? (
              /* Story Type Selection */
              <motion.div
                key="type-selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-4"
              >
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  Choose the type of story you want to create
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setStoryType('text')}
                    className="w-full flex items-center space-x-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <PaintBrushIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Text Story</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Create a story with text and background colors</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setStoryType('media')}
                    className="w-full flex items-center space-x-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <PhotoIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Media Story</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Upload photos or videos with captions</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            ) : storyType === 'text' ? (
              /* Text Story Creation */
              <motion.div
                key="text-story"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-4"
              >
                {/* Text Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Story Text ({textContent.length}/500)
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    maxLength={500}
                    placeholder="What's on your mind?"
                    className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  />
                </div>

                {/* Background Colors */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Background Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {backgroundColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedBgColor(color)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          selectedBgColor === color 
                            ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' 
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Emoji Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Add Emojis
                  </label>
                  
                  {/* Emoji Categories */}
                  <div className="flex space-x-2 mb-2 overflow-x-auto pb-1">
                    {Object.keys(emojiCategories).map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedEmojiCategory(category)}
                        className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                          selectedEmojiCategory === category
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  
                  {/* Emoji Grid */}
                  <div className="max-h-24 overflow-y-auto">
                    <div className="grid grid-cols-8 gap-1">
                      {emojiCategories[selectedEmojiCategory as keyof typeof emojiCategories].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => addEmojiToText(emoji)}
                          className="w-8 h-8 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Preview
                  </label>
                  <div 
                    className="w-full h-32 rounded-xl flex items-center justify-center text-white font-semibold p-4 text-center"
                    style={{ backgroundColor: selectedBgColor }}
                  >
                    {textContent || 'Your story text will appear here...'}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Media Story Creation */
              <motion.div
                key="media-story"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-4"
              >
                {!selectedFile ? (
                  /* File Upload Area */
                  <div className="space-y-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center space-y-3 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
                    >
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <PhotoIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-900 dark:text-white">Click to upload media</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Images or videos up to 100MB
                        </p>
                      </div>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  /* File Preview and Caption */
                  <div className="space-y-4">
                    {/* Preview */}
                    <div className="relative rounded-xl overflow-hidden">
                      {selectedFile.type.startsWith('image/') ? (
                        <img
                          src={previewUrl!}
                          alt="Preview"
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <video
                          src={previewUrl!}
                          className="w-full h-48 object-cover"
                          controls
                        />
                      )}
                      <button
                        onClick={removeSelectedFile}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Caption Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Caption (Optional)
                      </label>
                      <textarea
                        value={mediaCaption}
                        onChange={(e) => setMediaCaption(e.target.value)}
                        placeholder="Add a caption to your story..."
                        className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                      />
                    </div>

                    {/* Emoji Picker */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Add Emojis to Caption
                      </label>
                      
                      {/* Emoji Categories */}
                      <div className="flex space-x-2 mb-2 overflow-x-auto pb-1">
                        {Object.keys(emojiCategories).map((category) => (
                          <button
                            key={category}
                            onClick={() => setSelectedEmojiCategory(category)}
                            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                              selectedEmojiCategory === category
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                      
                      {/* Emoji Grid */}
                      <div className="max-h-24 overflow-y-auto">
                        <div className="grid grid-cols-8 gap-1">
                          {emojiCategories[selectedEmojiCategory as keyof typeof emojiCategories].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => addEmojiToCaption(emoji)}
                              className="w-8 h-8 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {storyType && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={storyType === 'text' ? handleCreateTextStory : handleCreateMediaStory}
              disabled={isLoading || (storyType === 'text' ? !textContent.trim() : !selectedFile)}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Story...</span>
                </>
              ) : (
                <span>Create Story</span>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default StoryCreateModal;