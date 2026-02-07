import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

const Message: React.FC = () => {
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const [selectedGroup, setSelectedGroup] = useState('');
  const [sendMessage, setSendMessage] = useState(false);
  const [interval, setInterval] = useState(1);
  const [maxMessages, setMaxMessages] = useState(0);
  const [messageTemplate, setMessageTemplate] = useState('');

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setSelectedGroup(settings.selectedGroupId || '');
    setSendMessage(settings.sendWelcomeMessage);
    setInterval(settings.messageIntervalMins);
    setMaxMessages(settings.maxMessages);
    setMessageTemplate(settings.messageTemplate);
  }, [settings]);

  const handleToggleMessage = async () => {
    try {
      await updateSettings({ sendWelcomeMessage: !sendMessage });
      setSendMessage(!sendMessage);
    } catch (error) {
      console.error('Error toggling message:', error);
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings({
        sendWelcomeMessage: sendMessage,
        messageIntervalMins: interval,
        maxMessages: maxMessages,
        messageTemplate: messageTemplate,
      });
      alert('Message settings saved successfully!');
    } catch (error) {
      console.error('Error saving message settings:', error);
      alert('Failed to save message settings');
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Welcome Message Settings</h2>

      <div className="space-y-6 max-w-2xl">
        {/* Group Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Please select group to customize
          </label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select</option>
            {/* TODO: Populate with actual groups */}
            <option value="group1">My Facebook Group 1</option>
            <option value="group2">My Facebook Group 2</option>
          </select>
        </div>

        {/* Settings Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-4">Settings</h3>

          <div className="space-y-4">
            {/* Send Welcome Message Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Send welcome message
              </label>
              <button
                onClick={handleToggleMessage}
                className={`
                  relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                  ${sendMessage ? 'bg-primary' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                    ${sendMessage ? 'translate-x-7' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* Send Message Every */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 flex-shrink-0">
                Send message every
              </label>
              <input
                type="number"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                min="1"
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-gray-600">Mins</span>
            </div>

            {/* Max Message Send */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 flex-shrink-0">
                Max message send
              </label>
              <input
                type="number"
                value={maxMessages}
                onChange={(e) => setMaxMessages(parseInt(e.target.value) || 0)}
                min="0"
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-gray-600">Messages</span>
            </div>
          </div>
        </div>

        {/* Message Template */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-4">Message Template</h3>

          <textarea
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            rows={8}
            placeholder="Enter your message template here..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />

          <div className="mt-2 text-sm text-gray-600">
            <p>Available variables:</p>
            <ul className="list-disc list-inside ml-2">
              <li>
                <code className="bg-gray-200 px-1 rounded">{'{first_name}'}</code> - Member's first name
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">{'{last_name}'}</code> - Member's last name
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">{'{group_name}'}</code> - Group name
              </li>
            </ul>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="bg-primary text-white px-8 py-2 rounded-md hover:bg-primary-dark transition-colors"
        >
          SAVE
        </button>
      </div>
    </div>
  );
};

export default Message;
