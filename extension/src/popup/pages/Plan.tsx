import React from 'react';

const Plan: React.FC = () => {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Plan & Subscription</h2>

      <div className="bg-gray-50 p-6 rounded-lg">
        <p className="text-gray-600 mb-4">
          Subscription management and plan details will be available here.
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Current Plan</h3>
            <p className="text-gray-600">Free Trial</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Features</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Member data collection</li>
              <li>Google Sheets integration</li>
              <li>Welcome message automation</li>
              <li>Auto-decline feature</li>
            </ul>
          </div>

          <button className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors mt-4">
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default Plan;
