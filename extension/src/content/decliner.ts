/**
 * Auto-Decline Content Script
 * Automatically declines Facebook group member requests based on configured rules
 */

import type { MemberRequest, UserSettings } from '../shared/types';

console.log('Group Collect: Auto-Decline content script loaded');

// Track declined members to avoid duplicates
const declinedMembers = new Set<string>();

/**
 * Show a temporary popup notification
 */
function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 24px;
    z-index: 1000000;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    animation: fadeIn 0.3s ease-out;
    max-width: 400px;
    display: flex;
    align-items: center;
    gap: 12px;
  `;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
  notification.innerHTML = `
    <span style="font-size: 20px;">${icon}</span>
    <span>${message}</span>
  `;

  document.body.appendChild(notification);

  // Auto-remove after duration
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
}

/**
 * Evaluate if a member should be declined based on rules
 */
function shouldDeclineMember(member: MemberRequest, rules: UserSettings['declineRules']): { shouldDecline: boolean; reason: string } {
  if (!rules) {
    return { shouldDecline: false, reason: '' };
  }

  // Check if email is required but missing
  if (rules.declineIfEmailMissing) {
    const hasEmail = member.q1?.includes('@') || member.q2?.includes('@') || member.q3?.includes('@');
    if (!hasEmail) {
      return { shouldDecline: true, reason: 'Email address missing' };
    }
  }

  // Check required questions
  if (rules.requiredQuestions && rules.requiredQuestions.length > 0) {
    for (const question of rules.requiredQuestions) {
      const answer = member[question as keyof MemberRequest];
      if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
        return { shouldDecline: true, reason: `${question.toUpperCase()} not answered` };
      }
    }
  }

  return { shouldDecline: false, reason: '' };
}

/**
 * Find and click the decline button for a member
 */
async function declineMember(memberId: string): Promise<boolean> {
  try {
    // Facebook UI selectors (these may need to be updated based on FB's UI changes)
    // Look for decline/reject button
    const possibleSelectors = [
      `[data-member-id="${memberId}"] [aria-label*="Decline"]`,
      `[data-member-id="${memberId}"] [aria-label*="Reject"]`,
      `[data-member-id="${memberId}"] button[data-testid*="decline"]`,
      `[data-member-id="${memberId}"] button:has-text("Decline")`,
      `[data-member-id="${memberId}"] button:has-text("Reject")`,
    ];

    for (const selector of possibleSelectors) {
      try {
        const button = document.querySelector(selector) as HTMLButtonElement;
        if (button && !button.disabled) {
          button.click();
          console.log(`Auto-declined member ${memberId}`);
          return true;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Fallback: Look for any decline button near the member's entry
    const memberElement = document.querySelector(`[data-member-id="${memberId}"]`);
    if (memberElement) {
      const buttons = memberElement.querySelectorAll('button');
      for (const button of Array.from(buttons)) {
        const buttonText = button.textContent?.toLowerCase() || '';
        const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';

        if (buttonText.includes('decline') || buttonText.includes('reject') ||
            ariaLabel.includes('decline') || ariaLabel.includes('reject')) {
          button.click();
          console.log(`Auto-declined member ${memberId} (fallback method)`);
          return true;
        }
      }
    }

    console.warn(`Could not find decline button for member ${memberId}`);
    return false;
  } catch (error) {
    console.error(`Error declining member ${memberId}:`, error);
    return false;
  }
}

/**
 * Log declined member to storage
 */
async function logDeclinedMember(member: MemberRequest, reason: string): Promise<void> {
  try {
    // Get existing decline log
    const result = await chrome.storage.local.get('decline_log');
    const declineLog = result.decline_log || [];

    // Add new entry
    declineLog.push({
      id: `decline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      memberId: member.id,
      memberName: member.facebookUsername,
      groupName: member.groupName,
      reason,
      declinedAt: new Date().toISOString(),
    });

    // Save back to storage (keep last 1000 entries)
    await chrome.storage.local.set({
      decline_log: declineLog.slice(-1000),
    });

    console.log(`Logged decline for ${member.facebookUsername}: ${reason}`);
  } catch (error) {
    console.error('Error logging declined member:', error);
  }
}

/**
 * Process members and auto-decline based on rules
 */
async function processAutoDecline(): Promise<void> {
  try {
    // Get settings directly from Chrome storage
    const settingsResult = await chrome.storage.local.get('settings');
    const settings = settingsResult.settings as UserSettings | null;

    // Check if settings exist
    if (!settings) {
      console.log('No settings found');
      return;
    }

    // Check if auto-decline is enabled
    if (!settings.activeDeclineFeature) {
      console.log('Auto-decline feature is disabled');
      return;
    }

    // Check if decline rules are configured
    if (!settings.declineRules ||
        (!settings.declineRules.declineIfEmailMissing &&
         (!settings.declineRules.requiredQuestions || settings.declineRules.requiredQuestions.length === 0))) {
      console.log('No decline rules configured');
      return;
    }

    // Get pending members directly from Chrome storage
    const membersResult = await chrome.storage.local.get('members_data');
    const members = (membersResult.members_data || []) as MemberRequest[];
    const pendingMembers = members.filter(m => m.status === 'pending');

    console.log(`Processing ${pendingMembers.length} pending members for auto-decline`);

    let declinedCount = 0;

    for (const member of pendingMembers) {
      // Skip if already processed
      if (declinedMembers.has(member.id)) {
        continue;
      }

      // Evaluate decline rules
      const { shouldDecline, reason } = shouldDeclineMember(member, settings.declineRules);

      if (shouldDecline) {
        // Attempt to decline the member
        const declined = await declineMember(member.userId);

        if (declined) {
          // Mark as declined
          declinedMembers.add(member.id);
          declinedCount++;

          // Update member status in storage directly
          const updatedMembers = members.map(m => 
            m.id === member.id ? { ...m, status: 'declined' as const } : m
          );
          await chrome.storage.local.set({ members_data: updatedMembers });

          // Log the decline
          await logDeclinedMember(member, reason);

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (declinedCount > 0) {
      console.log(`Auto-declined ${declinedCount} members`);

      // Show success notification
      showNotification(
        `✓ Auto-declined ${declinedCount} member${declinedCount > 1 ? 's' : ''}`,
        'success',
        4000
      );

      // Send notification to background
      chrome.runtime.sendMessage({
        type: 'AUTO_DECLINE_COMPLETE',
        count: declinedCount,
      });
    }
  } catch (error) {
    console.error('Error in auto-decline process:', error);
  }
}

/**
 * Initialize auto-decline monitoring
 */
function initializeAutoDecline(): void {
  console.log('Initializing auto-decline feature');

  // Run immediately
  processAutoDecline();

  // Monitor for new members (check every 30 seconds)
  setInterval(() => {
    processAutoDecline();
  }, 30000);

  // Also run when page changes (for single-page app navigation)
  const observer = new MutationObserver((mutations) => {
    // Check if member list changed
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Debounce: only process after changes stop for 2 seconds
        clearTimeout((window as any).autoDeclineTimeout);
        (window as any).autoDeclineTimeout = setTimeout(() => {
          processAutoDecline();
        }, 2000);
        break;
      }
    }
  });

  // Observe the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Check if we're on a Facebook group members page
function isGroupMembersPage(): boolean {
  const url = window.location.href;
  return url.includes('facebook.com/groups') &&
         (url.includes('/members') || url.includes('/member_requests') || url.includes('/member-requests'));
}

// Initialize when on the correct page
if (isGroupMembersPage()) {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAutoDecline);
  } else {
    initializeAutoDecline();
  }
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'RUN_AUTO_DECLINE') {
    // Show working notification
    showNotification('🔄 Processing auto-decline rules...', 'info');

    processAutoDecline().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      // Show error notification
      showNotification('❌ Auto-decline failed: ' + String(error), 'error');
      sendResponse({ success: false, error: String(error) });
    });
    return true; // Keep channel open for async response
  }
});

export {};
