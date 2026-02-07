import React from 'react';
import ReactDOM from 'react-dom/client';
import { Message, MessageResponse } from '../types/types';
import InjectedUI from './InjectedUI';
import { MemberCapture } from './MemberCapture';

// Logger utility
const log = (message: string, ...args: any[]) => {
  console.log(`[Group Collect] ${message}`, ...args);
};

class GroupCollectContentScript {
  private uiRoot: HTMLDivElement | null = null;
  private reactRoot: any = null;
  private isInjected = false;
  private memberCapture: MemberCapture | null = null;

  constructor() {
    this.init();
  }

  private init() {
    log('Content script initialized');

    // Check if we're on the member requests page
    if (this.isMemberRequestsPage()) {
      log('Member requests page detected!');
      this.notifyBackground();
      this.injectUI();
    } else {
      log('Not on member requests page');
    }

    // Watch for navigation changes (Facebook is a SPA)
    this.observeUrlChanges();
  }

  private isMemberRequestsPage(): boolean {
    const url = window.location.href;
    const pattern = /facebook\.com\/groups\/[^\/]+\/member-requests/;
    return pattern.test(url);
  }

  private notifyBackground() {
    chrome.runtime.sendMessage(
      { type: 'PAGE_DETECTED' } as Message,
      (response: MessageResponse) => {
        if (response?.success) {
          log('Background notified successfully');
        }
      }
    );
  }

  private injectUI() {
    if (this.isInjected) {
      log('UI already injected');
      return;
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.performInjection());
    } else {
      this.performInjection();
    }
  }

  private performInjection() {
    log('Injecting UI...');

    // Create container for React app
    this.uiRoot = document.createElement('div');
    this.uiRoot.id = 'group-collect-ui-root';

    // Insert at the top of the body
    document.body.insertBefore(this.uiRoot, document.body.firstChild);

    // Initialize member capture manager
    this.memberCapture = new MemberCapture(false); // Set to true for debug mode

    // Extract group name from the current URL
    const groupName = MemberCapture.extractGroupNameFromUrl(window.location.href);
    this.memberCapture.setGroupName(groupName);

    // Render React component with capture manager
    this.reactRoot = ReactDOM.createRoot(this.uiRoot);
    this.reactRoot.render(<InjectedUI memberCapture={this.memberCapture} />);

    // Start capturing
    this.memberCapture.start((count) => {
      log(`Total captured: ${count}`);
      // Update UI with new count
      this.reactRoot.render(<InjectedUI memberCapture={this.memberCapture!} />);
    });

    this.isInjected = true;
    log('UI injected successfully');

    // Expose to window for debugging
    (window as any).__groupCollect = {
      scraper: this.memberCapture.getScraper(),
      capture: this.memberCapture,
      debugPage: () => this.memberCapture?.debugPage()
    };
  }

  private removeUI() {
    if (this.memberCapture) {
      this.memberCapture.stop();
      this.memberCapture = null;
    }
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
    if (this.uiRoot) {
      this.uiRoot.remove();
      this.uiRoot = null;
    }
    this.isInjected = false;
    log('UI removed');
  }

  private observeUrlChanges() {
    let lastUrl = window.location.href;

    // Use MutationObserver to detect URL changes in SPA
    const observer = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        log('URL changed:', currentUrl);
        lastUrl = currentUrl;

        if (this.isMemberRequestsPage() && !this.isInjected) {
          this.notifyBackground();
          this.injectUI();
        } else if (!this.isMemberRequestsPage() && this.isInjected) {
          this.removeUI();
        }
      }
    });

    observer.observe(document, { subtree: true, childList: true });
  }
}

// Initialize the content script
new GroupCollectContentScript();
