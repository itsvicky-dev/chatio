import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  PhotoIcon, 
  VideoCameraIcon, 
  DocumentIcon, 
  MapPinIcon,
  UserIcon 
} from '@heroicons/react/24/outline';

interface MediaPreviewProps {
  onClose: () => void;
  onFileSelect: (files: FileList) => void;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ onClose, onFileSelect }) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const mediaOptions = [
    {
      icon: PhotoIcon,
      label: 'Photos',
      color: 'text-green-500 bg-green-50 dark:bg-green-900/20',
      onClick: () => imageInputRef.current?.click(),
      accept: 'image/*'
    },
    {
      icon: VideoCameraIcon,
      label: 'Videos',
      color: 'text-red-500 bg-red-50 dark:bg-red-900/20',
      onClick: () => videoInputRef.current?.click(),
      accept: 'video/*'
    },
    {
      icon: DocumentIcon,
      label: 'Documents',
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
      onClick: () => documentInputRef.current?.click(),
      accept: '.pdf,.doc,.docx,.txt,.zip,.rar'
    },
    {
      icon: MapPinIcon,
      label: 'Location',
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
      onClick: () => {
        // Handle location sharing
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            // Send location
            console.log('Location:', position.coords);
          });
        }
      }
    },
    {
      icon: UserIcon,
      label: 'Contact',
      color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
      onClick: () => {
        // Handle contact sharing
        console.log('Share contact');
      }
    }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFileSelect(e.target.files);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
      />

      {/* Media Options */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50"
      >
        <div className="grid grid-cols-3 gap-3 w-48">
          {mediaOptions.map((option, index) => (
            <motion.button
              key={option.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={option.onClick}
              className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className={`p-3 rounded-full ${option.color} group-hover:scale-110 transition-transform`}>
                <option.icon className="w-6 h-6" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300 mt-1 text-center">
                {option.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
};

export default MediaPreview;