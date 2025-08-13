import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  XMarkIcon,
  UserCircleIcon,
  BellIcon,
  LockClosedIcon,
  GlobeAltIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../../store/useStore';

interface SettingsPanelProps {
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { user, logout } = useStore();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<'light' | 'dark' | 'system'>('system');
  const [notifications, setNotifications] = useState({
    messages: true,
    calls: true,
    groups: true,
    stories: false
  });

  const settingsItems = [
    {
      id: 'profile',
      icon: UserCircleIcon,
      title: 'Account',
      description: 'Privacy, security, change username',
      action: () => setActiveSection('profile')
    },
    {
      id: 'notifications',
      icon: BellIcon,
      title: 'Notifications',
      description: 'Message, group & call tones',
      action: () => setActiveSection('notifications')
    },
    {
      id: 'privacy',
      icon: LockClosedIcon,
      title: 'Privacy',
      description: 'Block contacts, disappearing messages',
      action: () => setActiveSection('privacy')
    },
    {
      id: 'appearance',
      icon: darkMode === 'dark' ? MoonIcon : darkMode === 'light' ? SunIcon : ComputerDesktopIcon,
      title: 'Appearance',
      description: 'Theme, wallpapers, chat settings',
      action: () => setActiveSection('appearance')
    },
    {
      id: 'language',
      icon: GlobeAltIcon,
      title: 'Language',
      description: 'English (US)',
      action: () => setActiveSection('language')
    },
    {
      id: 'help',
      icon: QuestionMarkCircleIcon,
      title: 'Help',
      description: 'Help center, contact us, privacy policy',
      action: () => setActiveSection('help')
    }
  ];

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
      onClose();
    }
  };

  if (activeSection) {
    return (
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="w-full h-full bg-white dark:bg-gray-800 flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveSection(null)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 rotate-180" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {activeSection}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeSection === 'appearance' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Theme</h3>
                <div className="space-y-2">
                  {[
                    { value: 'light', label: 'Light', icon: SunIcon },
                    { value: 'dark', label: 'Dark', icon: MoonIcon },
                    { value: 'system', label: 'System', icon: ComputerDesktopIcon }
                  ].map(({ value, label, icon: Icon }) => (
                    <label key={value} className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value={value}
                        checked={darkMode === value}
                        onChange={(e) => setDarkMode(e.target.value as typeof darkMode)}
                        className="sr-only"
                      />
                      <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
                      <span className="text-gray-900 dark:text-white">{label}</span>
                      {darkMode === value && (
                        <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-4">
              {Object.entries(notifications).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                  <div>
                    <h4 className="text-gray-900 dark:text-white capitalize">{key}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive notifications for {key}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setNotifications(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Add more sections as needed */}
          {activeSection === 'profile' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <img
                  src={user?.avatar || 'https://via.placeholder.com/100'}
                  alt={user?.name || 'User'}
                  className="w-20 h-20 rounded-full mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user?.username || 'John Doe'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {user?.email || 'john.doe@example.com'}
                </p>
              </div>
              
              <div className="space-y-2">
                <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                  <div className="text-gray-900 dark:text-white">Name</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{user?.username || 'John Doe'}</div>
                </button>
                <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                  <div className="text-gray-900 dark:text-white">About</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Available</div>
                </button>
                <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                  <div className="text-gray-900 dark:text-white">Phone</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{user?.phone || '+1 (555) 123-4567'}</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="w-full h-full bg-white dark:bg-gray-800 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Profile Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <img
            src={user?.avatar || 'https://via.placeholder.com/50'}
            alt={user?.name || 'User'}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {user?.username || 'John Doe'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.email || 'john.doe@example.com'}
            </p>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-2">
          {settingsItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <item.icon className="w-6 h-6 text-gray-500 dark:text-gray-400 mr-3" />
              <div className="flex-1 text-left">
                <div className="text-gray-900 dark:text-white">{item.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-red-600 dark:text-red-400"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6 mr-3" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Convo v1.0.0</p>
          <p>Made with ❤️ for seamless communication</p>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPanel;