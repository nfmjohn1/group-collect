import React from 'react';
import { useAuthStore } from '@/store/authStore';

const Home: React.FC = () => {
  const { user, signOut } = useAuthStore();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const openViewData = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/dashboard/index.html'),
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl">
        {/* Welcome Header */}
        <h2 className="text-2xl font-bold mb-2">Welcome to Group Collect!</h2>
        <p className="text-gray-600 mb-6">
          Grow a group, capture a lead, sell your products.
        </p>

        {/* Tagline */}
        <p className="text-lg mb-4">
          Group collect is ready to save you time and make you money!
        </p>

        {/* Active Email */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-600 mb-1">Active Email:</p>
          <p className="text-lg font-semibold text-primary">
            {user?.email || 'Not logged in'}
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors mb-8"
        >
          LOGOUT
        </button>

        {/* Quick Links */}
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={openViewData}
              className="text-primary hover:underline"
            >
              View Data
            </button>
            <span>|</span>
            <a
              href="#"
              className="text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement Log In functionality
              }}
            >
              Log In
            </a>
            <span>|</span>
            <a
              href="#"
              className="text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement Get Support
              }}
            >
              Get Support
            </a>
            <span>|</span>
            <a
              href="#"
              className="text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement Upgrade or Purchase
              }}
            >
              Upgrade or Purchase Installation
            </a>
            <span>|</span>
            <a
              href="#"
              className="text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement Update Card
              }}
            >
              Update Card
            </a>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <a
              href="#"
              className="text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement automate functionality
              }}
            >
              Want to automate and monetize your Facebook Group?
            </a>
            <span>|</span>
            <a
              href="#"
              className="text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement affiliate signup
              }}
            >
              Sign up to be an affiliate
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
