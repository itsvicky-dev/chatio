import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: Date;
  theme: 'light' | 'dark' | 'auto';
}

interface Message {
  _id: string;
  sender: User;
  chat: string;
  content: {
    text?: string;
    media?: Array<{
      url: string;
      type: string;
      filename?: string;
      size?: number;
      duration?: string;
      thumbnailUrl?: string;
    }>;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
  };
  messageType: 'text' | 'image' | 'video' | 'audio' | 'voice' | 'document' | 'location';
  replyTo?: Message;
  reactions: Array<{
    emoji: string;
    user: string;
    count: number;
  }>;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  edited: {
    isEdited: boolean;
    editedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface Chat {
  _id: string;
  name?: string;
  avatar?: string;
  isGroupChat: boolean;
  participants: Array<{
    user: User;
    role: 'admin' | 'member';
    joinedAt: Date;
  }>;
  lastMessage?: Message;
  lastActivity: Date;
  unreadCount: number;
  settings: {
    muteNotifications: boolean;
    pinned: boolean;
  };
}

interface Story {
  _id: string;
  creator: User;
  content: {
    media: {
      url: string;
      type: 'image' | 'video';
      thumbnailUrl?: string;
    };
    text?: string;
    backgroundColor?: string;
  };
  viewers: string[];
  createdAt: Date;
  expiresAt: Date;
}

interface Call {
  _id: string;
  type: 'audio' | 'video';
  caller: User;
  participants: User[];
  status: 'ringing' | 'active' | 'ended';
  startedAt?: Date;
  endedAt?: Date;
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // UI State
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
  currentChatId: string | null;
  
  // Data
  chats: Chat[];
  messages: Record<string, Message[]>;
  contacts: User[];
  stories: Story[];
  onlineUsers: string[];
  
  // Real-time state
  isTyping: Record<string, string[]>;
  activeCall: Call | null;
  incomingCall: Call | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentChat: (chatId: string | null) => void;
  
  // Chat actions
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  removeChat: (chatId: string) => void;
  
  // Message actions
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  
  // Contact actions
  addContact: (contact: User) => void;
  updateContact: (contactId: string, updates: Partial<User>) => void;
  removeContact: (contactId: string) => void;
  setContacts: (contacts: User[]) => void;
  
  // Story actions
  addStory: (story: Story) => void;
  removeStory: (storyId: string) => void;
  setStories: (stories: Story[]) => void;
  
  // Real-time actions
  setOnlineUsers: (users: string[]) => void;
  setTyping: (chatId: string, users: string[]) => void;
  setActiveCall: (call: Call | null) => void;
  setIncomingCall: (call: Call | null) => void;
  
  // Call actions
  acceptCall: (callId: string) => void;
  endCall: () => void;
  
  // Utility actions
  logout: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  theme: 'auto' as const,
  sidebarCollapsed: false,
  currentChatId: null,
  chats: [],
  messages: {},
  contacts: [],
  stories: [],
  onlineUsers: [],
  isTyping: {},
  activeCall: null,
  incomingCall: null,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Auth actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      
      // UI actions
      setTheme: (theme) => set({ theme }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setCurrentChat: (currentChatId) => set({ currentChatId }),
      
      // Chat actions
      addChat: (chat) => set((state) => ({
        chats: [chat, ...state.chats.filter(c => c._id !== chat._id)]
      })),
      
      updateChat: (chatId, updates) => set((state) => ({
        chats: state.chats.map(chat => 
          chat._id === chatId ? { ...chat, ...updates } : chat
        )
      })),
      
      removeChat: (chatId) => set((state) => ({
        chats: state.chats.filter(chat => chat._id !== chatId),
        messages: Object.fromEntries(
          Object.entries(state.messages).filter(([id]) => id !== chatId)
        )
      })),
      
      // Message actions
      addMessage: (message) => set((state) => {
        const chatMessages = state.messages[message.chat] || [];
        // Check if message already exists to prevent duplicates
        const messageExists = chatMessages.some(msg => msg._id === message._id);
        
        if (messageExists) {
          return state; // Don't add duplicate message
        }
        
        return {
          messages: {
            ...state.messages,
            [message.chat]: [...chatMessages, message]
          }
        };
      }),
      
      updateMessage: (messageId, updates) => set((state) => {
        const newMessages = { ...state.messages };
        
        Object.keys(newMessages).forEach(chatId => {
          newMessages[chatId] = newMessages[chatId].map(msg =>
            msg._id === messageId ? { ...msg, ...updates } : msg
          );
        });
        
        return { messages: newMessages };
      }),
      
      removeMessage: (messageId) => set((state) => {
        const newMessages = { ...state.messages };
        
        Object.keys(newMessages).forEach(chatId => {
          newMessages[chatId] = newMessages[chatId].filter(msg => msg._id !== messageId);
        });
        
        return { messages: newMessages };
      }),
      
      setMessages: (chatId, messages) => set((state) => ({
        messages: {
          ...state.messages,
          [chatId]: messages
        }
      })),
      
      // Contact actions
      addContact: (contact) => set((state) => ({
        contacts: [contact, ...state.contacts.filter(c => c._id !== contact._id)]
      })),
      
      updateContact: (contactId, updates) => set((state) => ({
        contacts: state.contacts.map(contact =>
          contact._id === contactId ? { ...contact, ...updates } : contact
        )
      })),
      
      removeContact: (contactId) => set((state) => ({
        contacts: state.contacts.filter(contact => contact._id !== contactId)
      })),
      
      setContacts: (contacts) => set({ contacts }),
      
      // Story actions
      addStory: (story) => set((state) => ({
        stories: [story, ...state.stories.filter(s => s._id !== story._id)]
      })),
      
      removeStory: (storyId) => set((state) => ({
        stories: state.stories.filter(story => story._id !== storyId)
      })),
      
      setStories: (stories) => set({ stories }),
      
      // Real-time actions
      setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
      
      setTyping: (chatId, users) => set((state) => ({
        isTyping: {
          ...state.isTyping,
          [chatId]: users
        }
      })),
      
      setActiveCall: (activeCall) => set({ activeCall }),
      setIncomingCall: (incomingCall) => set({ incomingCall }),
      
      // Call actions
      acceptCall: (callId) => {
        const state = get();
        if (state.incomingCall && state.incomingCall._id === callId) {
          set({ 
            activeCall: state.incomingCall,
            incomingCall: null
          });
        }
      },
      
      endCall: () => set({ activeCall: null, incomingCall: null }),
      
      // Utility actions
      logout: () => set((state) => ({
        ...initialState,
        theme: state.theme, // Keep theme preference
        sidebarCollapsed: state.sidebarCollapsed // Keep UI preferences
      })),
      
      reset: () => set(initialState),
    }),
    {
      name: 'convo-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        chats: state.chats,
        messages: state.messages,
        contacts: state.contacts,
      }),
    }
  )
);