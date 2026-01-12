import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useMemberStore } from '@/store/memberStore';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Plan from './pages/Plan';
import Links from './pages/Links';
import Settings from './pages/Settings';
import Message from './pages/Message';
import Login from './pages/Login';
import Signup from './pages/Signup';
import type { NavigationPage } from '@/shared/types';

function App() {
  const { isAuthenticated, isLoading: authLoading, loadUser } = useAuthStore();
  const { loadSettings } = useSettingsStore();
  const { loadMembers } = useMemberStore();
  const [currentPage, setCurrentPage] = useState<NavigationPage>('HOME');
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    // Load user authentication state
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    // Load settings and members when authenticated
    if (isAuthenticated) {
      loadSettings();
      loadMembers();
    }
  }, [isAuthenticated, loadSettings, loadMembers]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication pages if not logged in
  if (!isAuthenticated) {
    return showSignup ? (
      <Signup onSwitchToLogin={() => setShowSignup(false)} />
    ) : (
      <Login onSwitchToSignup={() => setShowSignup(true)} />
    );
  }

  // Render main app with sidebar navigation
  const renderPage = () => {
    switch (currentPage) {
      case 'HOME':
        return <Home />;
      case 'PLAN':
        return <Plan />;
      case 'LINKS':
        return <Links />;
      case 'SETTINGS':
        return <Settings />;
      case 'MESSAGE':
        return <Message />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activePage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-y-auto bg-white">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
