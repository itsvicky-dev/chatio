import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { useStore } from '../store/useStore';

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (chatId: string, content: any, messageType?: string, replyTo?: string) => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
}

const SocketContext = createContext<SocketContextProps | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastConnectionAttempt, setLastConnectionAttempt] = useState<number>(0);
  const { 
    token, 
    user, 
    addMessage, 
    updateMessage,
    setOnlineUsers,
    setTyping,
    setActiveCall,
    setIncomingCall,
    updateChat,
    isAuthenticated
  } = useStore();

  useEffect(() => {
    // Only connect if authenticated and not already connecting/connected
    if (!isAuthenticated || !token || !user || isConnecting || socket?.connected) {
      return;
    }

    // Debounce connection attempts (minimum 3 seconds between attempts)
    const now = Date.now();
    if (now - lastConnectionAttempt < 3000) {
      console.log('🔌 Connection attempt too soon, debouncing...');
      return;
    }

    console.log('🔌 Initializing socket connection for user:', user.username);
    setIsConnecting(true);
    setLastConnectionAttempt(now);

    // Use server URL directly
    const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    
    const newSocket = io(SERVER_URL, {
      auth: {
        token: token
      },
      transports: ['polling', 'websocket'],
      upgrade: true,
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 3,
      forceNew: false // Don't force new connection
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 Connected to server');
      setIsConnected(true);
      setIsConnecting(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      setIsConnected(false);
      setIsConnecting(false);
      
      // Don't auto-reconnect on server disconnect to prevent loops
      if (reason === 'io server disconnect') {
        console.log('🚫 Server forced disconnect - not auto-reconnecting');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
      setIsConnecting(false);
      
      // Only show error after multiple attempts
      if (error.message === 'Authentication error') {
        toast.error('Authentication failed');
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected to server after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection failed:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('All reconnection attempts failed');
      toast.error('Unable to reconnect to server');
    });

    // Message events
    newSocket.on('new_message', (message) => {
      addMessage(message);
      
      // Update chat's last message
      updateChat(message.chat, {
        lastMessage: message,
        lastActivity: new Date(message.createdAt)
      });

      // Show notification if not the current user
      if (message.sender._id !== user._id) {
        if (Notification.permission === 'granted') {
          new Notification(`New message from ${message.sender.username}`, {
            body: message.content.text || 'Sent an attachment',
            icon: message.sender.avatar || '/default-avatar.png'
          });
        }
      }
    });

    newSocket.on('message_status_updated', ({ messageId, status, userId }) => {
      updateMessage(messageId, { status });
    });

    // Typing events
    newSocket.on('user_typing', ({ chatId, userId, username, isTyping }) => {
      // Don't show typing indicator for the current user
      if (userId === user._id) {
        return;
      }
      
      const currentTyping = useStore.getState().isTyping[chatId] || [];
      
      if (isTyping) {
        if (!currentTyping.includes(userId)) {
          setTyping(chatId, [...currentTyping, userId]);
        }
      } else {
        setTyping(chatId, currentTyping.filter(id => id !== userId));
      }

      // Auto-clear typing after 3 seconds
      if (isTyping) {
        setTimeout(() => {
          const updatedTyping = useStore.getState().isTyping[chatId] || [];
          setTyping(chatId, updatedTyping.filter(id => id !== userId));
        }, 3000);
      }
    });

    // Online status events
    newSocket.on('user_online', ({ userId, username }) => {
      const currentOnline = useStore.getState().onlineUsers;
      if (!currentOnline.includes(userId)) {
        setOnlineUsers([...currentOnline, userId]);
      }
    });

    newSocket.on('user_offline', ({ userId, username }) => {
      const currentOnline = useStore.getState().onlineUsers;
      setOnlineUsers(currentOnline.filter(id => id !== userId));
    });

    // Call events
    newSocket.on('incoming_call', (callData) => {
      setIncomingCall(callData);
    });

    newSocket.on('call_answered', ({ callId, answer }) => {
      // Handle call answered
      console.log('Call answered:', callId);
    });

    newSocket.on('call_rejected', ({ callId }) => {
      setIncomingCall(null);
      toast.error('Call rejected');
    });

    newSocket.on('call_ended', ({ callId }) => {
      setActiveCall(null);
      setIncomingCall(null);
    });

    newSocket.on('ice_candidate', ({ callId, candidate }) => {
      // Handle ICE candidate for WebRTC
      console.log('ICE candidate received:', candidate);
    });

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    setSocket(newSocket);

    return () => {
      console.log('🔌 Cleaning up socket connection for user:', user?.username);
      setIsConnecting(false);
      
      if (newSocket) {
        newSocket.removeAllListeners();
        if (newSocket.connected) {
          newSocket.disconnect();
        }
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, token, user?._id]); // Stable dependencies

  // Socket methods
  const sendMessage = (chatId: string, content: any, messageType = 'text', replyTo?: string) => {
    if (!socket) return;
    
    socket.emit('send_message', {
      chatId,
      content,
      messageType,
      replyTo
    });
  };

  const joinChat = (chatId: string) => {
    if (!socket) return;
    socket.emit('join_chat', chatId);
  };

  const leaveChat = (chatId: string) => {
    if (!socket) return;
    socket.emit('leave_chat', chatId);
  };

  const startTyping = (chatId: string) => {
    if (!socket) return;
    socket.emit('typing_start', { chatId });
  };

  const stopTyping = (chatId: string) => {
    if (!socket) return;
    socket.emit('typing_stop', { chatId });
  };

  const value: SocketContextProps = {
    socket,
    isConnected,
    sendMessage,
    joinChat,
    leaveChat,
    startTyping,
    stopTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
      
      {/* Connection Status Indicator */}
      {isAuthenticated && (
        <>
          {isConnecting && (
            <div className="fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Connecting...</span>
              </div>
            </div>
          )}
          {!isConnected && !isConnecting && (
            <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-sm font-medium">Disconnected</span>
              </div>
            </div>
          )}
        </>
      )}
    </SocketContext.Provider>
  );
};