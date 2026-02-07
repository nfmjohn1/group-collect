/**
 * Member Capture Manager
 * Observes DOM for member cards and handles capture logic
 */

import { FacebookScraper, ScrapedMemberData } from './FacebookScraper';
import { MemberData, Message, MessageResponse } from '../types/types';

export type CaptureCallback = (count: number) => void;

export class MemberCapture {
  private scraper: FacebookScraper;
  private observer: MutationObserver | null = null;
  private capturedProfileUrls = new Set<string>();
  private onCaptureCallback?: CaptureCallback;
  private autoCapture = true;
  private groupName: string = '';

  constructor(debugMode = false) {
    this.scraper = new FacebookScraper(debugMode);
  }

  /**
   * Set the group name for captured members
   */
  setGroupName(name: string) {
    this.groupName = name;
    console.log(`[Member Capture] Group name set: ${name}`);
  }

  /**
   * Extract group name/slug from a Facebook group URL
   */
  static extractGroupNameFromUrl(url: string): string {
    const match = url.match(/facebook\.com\/groups\/([^\/]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  /**
   * Start observing the page for member cards and captures
   */
  start(onCapture?: CaptureCallback) {
    this.onCaptureCallback = onCapture;
    this.loadExistingCaptures();
    this.observeApproveButtons();
    this.observeNewCards();
  }

  /**
   * Stop observing
   */
  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Load existing captured member URLs to prevent duplicates
   */
  private async loadExistingCaptures() {
    chrome.runtime.sendMessage(
      { type: 'GET_DATA' } as Message,
      (response: MessageResponse) => {
        if (response?.success && response.data?.members) {
          response.data.members.forEach((member: MemberData) => {
            this.capturedProfileUrls.add(member.profileUrl);
          });
          console.log(`[Member Capture] Loaded ${this.capturedProfileUrls.size} existing captures`);
        }
      }
    );
  }

  /**
   * Set auto-capture mode
   */
  setAutoCapture(enabled: boolean) {
    this.autoCapture = enabled;
    console.log(`[Member Capture] Auto-capture ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Manually capture a specific member card
   */
  async captureCard(card: Element): Promise<boolean> {
    const scrapedData = this.scraper.extractMemberData(card);

    if (!scrapedData || !scrapedData.name || !scrapedData.profileUrl) {
      console.log('[Member Capture] Invalid data from card');
      return false;
    }

    // Check if already captured
    if (this.capturedProfileUrls.has(scrapedData.profileUrl)) {
      console.log('[Member Capture] Already captured:', scrapedData.name);
      return false;
    }

    const memberData = this.convertToMemberData(scrapedData);
    const success = await this.saveMemberData(memberData);

    if (success) {
      this.capturedProfileUrls.add(scrapedData.profileUrl);
      if (this.onCaptureCallback) {
        this.onCaptureCallback(this.capturedProfileUrls.size);
      }
    }

    return success;
  }

  /**
   * Capture all member cards, scrolling to load more until none remain
   */
  async captureAllVisible(): Promise<number> {
    let capturedCount = 0;
    let previousCardCount = 0;
    let noNewCardsRounds = 0;
    const maxNoNewRounds = 3; // Stop after 3 scroll attempts with no new cards

    while (noNewCardsRounds < maxNoNewRounds) {
      const cards = this.scraper.findMemberCards();
      console.log(`[Member Capture] Found ${cards.length} cards on page`);

      // Capture and approve each card
      for (const card of cards) {
        const scrapedData = this.scraper.extractMemberData(card);
        if (!scrapedData?.profileUrl || this.capturedProfileUrls.has(scrapedData.profileUrl)) {
          continue;
        }

        const success = await this.captureCard(card);
        if (success) {
          capturedCount++;
          // Click the approve button for this card
          this.clickApproveButton(card);
          // Small delay to let Facebook process the approval
          await this.delay(300);
        }
      }

      // Check if we found new cards compared to last round
      if (cards.length <= previousCardCount) {
        noNewCardsRounds++;
      } else {
        noNewCardsRounds = 0;
      }
      previousCardCount = cards.length;

      // Scroll to the bottom to trigger lazy-loading of more cards
      window.scrollTo(0, document.body.scrollHeight);
      await this.delay(1500); // Wait for Facebook to load more cards
    }

    console.log(`[Member Capture] Captured ${capturedCount} new members total`);
    return capturedCount;
  }

  /**
   * Click the approve button on a member card
   */
  private clickApproveButton(card: Element): void {
    const approveBtn = this.scraper.findApproveButton(card);
    if (approveBtn) {
      (approveBtn as HTMLElement).click();
      console.log('[Member Capture] Clicked approve button');
    } else {
      console.log('[Member Capture] No approve button found on card');
    }
  }

  /**
   * Promise-based delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Observe approve buttons and auto-capture on click
   */
  private observeApproveButtons() {
    // Use event delegation to catch button clicks
    document.addEventListener('click', async (event) => {
      if (!this.autoCapture) return;

      const target = event.target as Element;

      // Check if clicked element or its parent is an approve button
      let element: Element | null = target;
      let approveButton: Element | null = null;

      for (let i = 0; i < 5 && element; i++) {
        const text = element.textContent?.toLowerCase() || '';
        const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';

        if (
          text.includes('approve') ||
          text.includes('accept') ||
          ariaLabel.includes('approve') ||
          ariaLabel.includes('accept')
        ) {
          approveButton = element;
          break;
        }

        element = element.parentElement;
      }

      if (approveButton) {
        console.log('[Member Capture] Approve button clicked, capturing member...');

        // Find the member card containing this button
        let card: Element | null = approveButton;
        for (let i = 0; i < 10 && card; i++) {
          const hasProfileLink = card.querySelector('a[href*="/user/"]') || card.querySelector('a[href*="facebook.com"]');
          if (hasProfileLink) {
            // Wait a moment for the UI to update
            setTimeout(async () => {
              await this.captureCard(card!);
            }, 500);
            break;
          }
          card = card.parentElement;
        }
      }
    }, true); // Use capture phase

    console.log('[Member Capture] Approve button observer started');
  }

  /**
   * Observe DOM for new member cards appearing
   */
  private observeNewCards() {
    this.observer = new MutationObserver((mutations) => {
      // Check if new cards were added
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          // Debounce: only check occasionally
          this.checkForNewCards();
          break;
        }
      }
    });

    // Observe the main content area
    const mainContent = document.querySelector('[role="main"]') || document.body;

    this.observer.observe(mainContent, {
      childList: true,
      subtree: true
    });

    console.log('[Member Capture] New cards observer started');
  }

  private checkForNewCardsTimeout: number | null = null;

  private checkForNewCards() {
    if (this.checkForNewCardsTimeout) {
      clearTimeout(this.checkForNewCardsTimeout);
    }

    this.checkForNewCardsTimeout = window.setTimeout(() => {
      const cards = this.scraper.findMemberCards();
      console.log(`[Member Capture] Detected ${cards.length} member cards on page`);
    }, 1000);
  }

  /**
   * Convert scraped data to MemberData format
   */
  private convertToMemberData(scraped: ScrapedMemberData): MemberData {
    const nameParts = this.parseName(scraped.name || '');
    const email = this.extractEmail(scraped.questions);
    const profileUrl = scraped.profileUrl || '';
    const userId = FacebookScraper.extractUserId(profileUrl);

    const memberData: MemberData = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      fullName: scraped.name || '',
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      profileUrl: profileUrl,
      userId: userId,
      groupName: this.groupName,
      joinedFacebook: '',
      city: ''
    };

    // Add email if found
    if (email) {
      memberData.email = email;
    }

    // Add up to 3 Q&A pairs
    scraped.questions.forEach((qa, idx) => {
      if (idx === 0) {
        memberData.question1 = qa.question;
        memberData.answer1 = qa.answer;
      } else if (idx === 1) {
        memberData.question2 = qa.question;
        memberData.answer2 = qa.answer;
      } else if (idx === 2) {
        memberData.question3 = qa.question;
        memberData.answer3 = qa.answer;
      }
    });

    return memberData;
  }

  /**
   * Parse full name into first and last name
   */
  private parseName(fullName: string): { firstName: string; lastName: string } {
    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 0) {
      return { firstName: '', lastName: '' };
    } else if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    } else {
      return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' ')
      };
    }
  }

  /**
   * Extract email from Q&A pairs
   */
  private extractEmail(questions: Array<{ question: string; answer: string }>): string | null {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

    for (const qa of questions) {
      // Check if question mentions email
      if (qa.question.toLowerCase().includes('email')) {
        const match = qa.answer.match(emailRegex);
        if (match) {
          return match[0];
        }
      }

      // Also check answer for any email pattern
      const match = qa.answer.match(emailRegex);
      if (match) {
        return match[0];
      }
    }

    return null;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save member data to storage via background script
   */
  private async saveMemberData(memberData: MemberData): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'CAPTURE_MEMBER', payload: memberData } as Message,
        (response: MessageResponse) => {
          if (response?.success) {
            console.log('[Member Capture] Saved:', memberData.fullName);
            resolve(true);
          } else {
            console.error('[Member Capture] Failed to save:', response?.error);
            resolve(false);
          }
        }
      );
    });
  }

  /**
   * Debug: Enable scraper debug mode
   */
  enableDebug() {
    this.scraper = new FacebookScraper(true);
  }

  /**
   * Debug: Log current page elements
   */
  debugPage() {
    this.scraper.debugLogElements();
  }

  /**
   * Get scraper instance for manual testing
   */
  getScraper(): FacebookScraper {
    return this.scraper;
  }
}
