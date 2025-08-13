import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PhoneIcon,
  PhoneXMarkIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import {
  MicrophoneIcon as MicrophoneSolidIcon,
  VideoCameraIcon as VideoCameraSolidIcon,
  SpeakerWaveIcon as SpeakerWaveSolidIcon
} from '@heroicons/react/24/solid';
import { useStore } from '../../store/useStore';

const CallWindow: React.FC = () => {
  const { activeCall, incomingCall, endCall, acceptCall } = useStore();
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  const call = activeCall || incomingCall;

  useEffect(() => {
    if (activeCall) {
      const timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [activeCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    endCall();
    setCallDuration(0);
  };

  const handleAcceptCall = () => {
    if (incomingCall) {
      acceptCall(incomingCall.id);
    }
  };

  if (!call) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full h-full max-w-md mx-auto bg-gradient-to-b from-gray-900 via-gray-800 to-black rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* Video Area */}
      <div className="relative h-2/3 bg-gray-900">
        {call.type === 'video' && !isCameraOff ? (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <VideoCameraIcon className="w-12 h-12" />
              </div>
              <p className="text-sm opacity-80">Camera connected</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-center"
            >
              <img
                src={call.caller.avatar || 'https://via.placeholder.com/120'}
                alt={call.caller.username}
                className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-white/20"
              />
              <h3 className="text-white text-xl font-semibold">{call.caller.username}</h3>
              <p className="text-white/60 text-sm">
                {incomingCall ? 'Incoming call...' : activeCall ? formatDuration(callDuration) : 'Connecting...'}
              </p>
            </motion.div>
          </div>
        )}

        {/* Self Video (Picture in Picture) */}
        {call.type === 'video' && activeCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 right-4 w-24 h-32 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20"
          >
            <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
              <div className="text-white text-xs">You</div>
            </div>
          </motion.div>
        )}

        {/* Call Status */}
        <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-white text-sm font-medium">
            {incomingCall ? 'Incoming' : activeCall ? 'Connected' : 'Calling'}
          </span>
        </div>
      </div>

      {/* Call Controls */}
      <div className="h-1/3 p-6 flex flex-col justify-center">
        {/* Primary Actions */}
        <div className="flex items-center justify-center space-x-6 mb-6">
          {incomingCall ? (
            <>
              {/* Accept Call */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAcceptCall}
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <PhoneIcon className="w-8 h-8 text-white" />
              </motion.button>
              
              {/* Decline Call */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleEndCall}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <PhoneXMarkIcon className="w-8 h-8 text-white" />
              </motion.button>
            </>
          ) : (
            <>
              {/* Mute */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMuted(!isMuted)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                  isMuted ? 'bg-red-500' : 'bg-gray-600'
                }`}
              >
                {isMuted ? (
                  <MicrophoneSolidIcon className="w-6 h-6 text-white" />
                ) : (
                  <MicrophoneIcon className="w-6 h-6 text-white" />
                )}
              </motion.button>

              {/* End Call */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleEndCall}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <PhoneXMarkIcon className="w-8 h-8 text-white" />
              </motion.button>

              {/* Video Toggle */}
              {call.type === 'video' && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsCameraOff(!isCameraOff)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                    isCameraOff ? 'bg-red-500' : 'bg-gray-600'
                  }`}
                >
                  {isCameraOff ? (
                    <VideoCameraSolidIcon className="w-6 h-6 text-white" />
                  ) : (
                    <VideoCameraIcon className="w-6 h-6 text-white" />
                  )}
                </motion.button>
              )}
            </>
          )}
        </div>

        {/* Secondary Actions */}
        {activeCall && (
          <div className="flex items-center justify-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isSpeakerOn ? 'bg-blue-500' : 'bg-gray-700'
              }`}
            >
              {isSpeakerOn ? (
                <SpeakerWaveSolidIcon className="w-5 h-5 text-white" />
              ) : (
                <SpeakerWaveIcon className="w-5 h-5 text-white" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-700"
            >
              <EllipsisHorizontalIcon className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CallWindow;