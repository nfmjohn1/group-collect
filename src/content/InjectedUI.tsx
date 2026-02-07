import React, { useState, useEffect } from 'react';
import './InjectedUI.css';
import { MemberCapture } from './MemberCapture';

interface InjectedUIProps {
  memberCapture: MemberCapture;
}

const InjectedUI: React.FC<InjectedUIProps> = ({ memberCapture }) => {
  const [capturedCount, setCapturedCount] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [autoCapture, setAutoCapture] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    // Get initial count
    loadCount();

    // Update count every 2 seconds
    const interval = setInterval(loadCount, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadCount = () => {
    chrome.runtime.sendMessage({ type: 'GET_DATA' }, (response) => {
      if (response?.success) {
        setCapturedCount(response.data.count || 0);
      }
    });
  };

  const handleViewData = () => {
    // Open popup by clicking the extension icon programmatically isn't possible
    // Instead, open a new viewer page
    window.open(chrome.runtime.getURL('viewer.html'), '_blank');
  };

  const handleCaptureAll = async () => {
    setIsCapturing(true);
    try {
      const count = await memberCapture.captureAllVisible();
      alert(`Captured ${count} new members!`);
      loadCount();
    } catch (error) {
      console.error('Capture failed:', error);
      alert('Failed to capture members. Check console for details.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleToggleAutoCapture = () => {
    const newValue = !autoCapture;
    setAutoCapture(newValue);
    memberCapture.setAutoCapture(newValue);
  };

  return (
    <div className={`gc-injected-bar ${isMinimized ? 'gc-minimized' : ''}`}>
      <div className="gc-bar-content">
        <div className="gc-bar-left">
          <div className="gc-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7V12C2 16.97 5.55 21.54 12 22C18.45 21.54 22 16.97 22 12V7L12 2Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="gc-bar-info">
            <h3 className="gc-bar-title">Group Collect Active</h3>
            <p className="gc-bar-subtitle">
              {capturedCount} {capturedCount === 1 ? 'member' : 'members'} captured
            </p>
          </div>
        </div>

        <div className="gc-bar-right">
          <button
            className="gc-btn gc-btn-toggle"
            onClick={handleToggleAutoCapture}
            title={autoCapture ? 'Auto-capture ON' : 'Auto-capture OFF'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {autoCapture ? (
                <path d="M8 2L2 5V8C2 11.31 4.77 14.21 8 14.89C11.23 14.21 14 11.31 14 8V5L8 2Z" fill="currentColor" />
              ) : (
                <path d="M8 2L2 5V8C2 11.31 4.77 14.21 8 14.89C11.23 14.21 14 11.31 14 8V5L8 2Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
              )}
            </svg>
            {autoCapture ? 'Auto' : 'Manual'}
          </button>
          <button
            className="gc-btn gc-btn-primary"
            onClick={handleCaptureAll}
            disabled={isCapturing}
          >
            {isCapturing ? 'Capturing...' : 'Capture All'}
          </button>
          <button className="gc-btn gc-btn-secondary" onClick={handleViewData}>
            View Data
          </button>
          <button
            className="gc-btn gc-btn-icon"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {isMinimized ? (
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" />
              ) : (
                <path d="M4 10L8 6L12 10" stroke="currentColor" strokeWidth="2" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InjectedUI;
