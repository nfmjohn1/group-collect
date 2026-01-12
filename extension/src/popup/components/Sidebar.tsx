import React from 'react';
import type { NavigationPage } from '@/shared/types';

interface SidebarProps {
  activePage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const navItems: { page: NavigationPage; label: string }[] = [
    { page: 'HOME', label: 'HOME' },
    { page: 'PLAN', label: 'PLAN' },
    { page: 'LINKS', label: 'LINKS' },
    { page: 'SETTINGS', label: 'SETTINGS' },
    { page: 'MESSAGE', label: 'MESSAGE' },
  ];

  return (
    <div className="w-64 h-screen bg-primary flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 text-white">
        <h1 className="text-2xl font-bold">Group</h1>
        <h2 className="text-xl font-semibold">Collect</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`
              w-full px-6 py-4 text-left font-medium transition-colors
              ${
                activePage === item.page
                  ? 'bg-white text-primary'
                  : 'text-white hover:bg-primary-dark'
              }
            `}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
