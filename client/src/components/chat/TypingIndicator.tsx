import React from 'react';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  users: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  const getUserText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing`;
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing`;
    } else {
      return `${users[0]} and ${users.length - 1} others are typing`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-center space-x-3 px-4 py-2"
    >
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <div className="flex space-x-1">
            <motion.div
              className="w-1.5 h-1.5 bg-gray-500 rounded-full typing-dot"
              animate={{
                scale: [0.8, 1, 0.8],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0
              }}
            />
            <motion.div
              className="w-1.5 h-1.5 bg-gray-500 rounded-full typing-dot"
              animate={{
                scale: [0.8, 1, 0.8],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
            />
            <motion.div
              className="w-1.5 h-1.5 bg-gray-500 rounded-full typing-dot"
              animate={{
                scale: [0.8, 1, 0.8],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4
              }}
            />
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          {getUserText()}...
        </p>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;