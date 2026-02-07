/**
 * Facebook Content Script - Member Scraper
 * Scrapes pending member requests from Facebook groups
 */

console.log('Group Collect scraper content script loaded');

// Types for scraped data
interface ScrapedMember {
  id: string;
  facebookUsername: string;
  profileUrl: string;
  firstName?: string;
  lastName?: string;
  joinedOn: Date;
  answers: { question: string; answer: string }[];
  status: 'pending';
}

interface ScrapedData {
  groupName: string;
  groupId: string;
  members: ScrapedMember[];
}

/**
 * Show a banner at the top of the page displaying the Google Sheets destination
 */
async function showDataDestinationBanner() {
  // Don't add banner if already exists
  if (document.getElementById('group-collect-banner')) {
    return;
  }

  try {
    // Get settings directly from Chrome storage (avoid import issues)
    const result = await chrome.storage.local.get('settings');
    const settings = result.settings;
    const sheetsUrl = settings?.googleSheetUrl || 'Not configured yet - Set up in extension settings';

    const banner = document.createElement('div');
    banner.id = 'group-collect-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 999999;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: slideDown 0.3s ease-out;
    `;

    banner.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between;">
        <div style="flex: 1;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">
            📊 Group Collect: Data Collection Active
          </div>
          <div style="font-size: 13px; opacity: 0.95; display: flex; align-items: center; gap: 8px;">
            <span>Data will be pushed to:</span>
            <input 
              type="text" 
              value="${sheetsUrl}" 
              readonly 
              style="
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 6px;
                padding: 6px 12px;
                color: white;
                font-size: 12px;
                flex: 1;
                max-width: 600px;
                cursor: ${sheetsUrl.startsWith('http') ? 'pointer' : 'default'};
              "
              ${sheetsUrl.startsWith('http') ? `onclick="window.open('${sheetsUrl}', '_blank')" title="Click to open Google Sheet"` : 'title="Configure in extension settings"'}
            />
          </div>
        </div>
        <button 
          id="close-group-collect-banner"
          style="
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
            margin-left: 16px;
          "
          onmouseover="this.style.background='rgba(255,255,255,0.3)'"
          onmouseout="this.style.background='rgba(255,255,255,0.2)'"
        >
          Minimize
        </button>
      </div>
    `;

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.9); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(banner);
    console.log('✅ Group Collect: Banner added to page');

    // Add close button functionality
    document.getElementById('close-group-collect-banner')?.addEventListener('click', () => {
      banner.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => {
        banner.remove();
        document.body.style.paddingTop = '';
      }, 300);
    });

    // Adjust body padding to prevent content from being hidden
    document.body.style.paddingTop = banner.offsetHeight + 'px';

  } catch (error) {
    console.error('❌ Group Collect: Error showing data destination banner:', error);
  }
}

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
 * Extract group information from current page
 */
function extractGroupInfo(): { groupName: string; groupId: string } | null {
  try {
    // Extract group ID from URL
    const urlMatch = window.location.href.match(/groups\/(\d+|[^\/]+)/);
    const groupId = urlMatch ? urlMatch[1] : '';

    // Try to find group name from page title or header
    let groupName = '';

    // Method 1: From page title
    const titleMatch = document.title.match(/^(.+?)\s*\|/);
    if (titleMatch) {
      groupName = titleMatch[1].trim();
    }

    // Method 2: From group header (various selectors Facebook uses)
    if (!groupName) {
      const headerSelectors = [
        'h1[class*="gmql0nx0"]', // Facebook's obfuscated class
        'h1 a[href*="/groups/"]',
        '[role="heading"] a[href*="/groups/"]',
        'h1',
      ];

      for (const selector of headerSelectors) {
        const element = document.querySelector(selector);
        if (element?.textContent) {
          groupName = element.textContent.trim();
          break;
        }
      }
    }

    if (groupId && groupName) {
      return { groupName, groupId };
    }

    return null;
  } catch (error) {
    console.error('Error extracting group info:', error);
    return null;
  }
}

/**
 * Extract member data from pending requests
 */
function scrapeMemberRequests(): ScrapedMember[] {
  const members: ScrapedMember[] = [];

  try {
    // Facebook uses dynamic class names, so we look for structural patterns
    // Look for member request cards/containers
    const memberElements = document.querySelectorAll('[role="article"], [data-pagelet*="member"], div[class*="UserCard"]');

    console.log(`Found ${memberElements.length} potential member elements`);

    memberElements.forEach((element, index) => {
      try {
        const member = extractMemberData(element as HTMLElement, index);
        if (member) {
          members.push(member);
        }
      } catch (error) {
        console.error('Error extracting member data:', error);
      }
    });
  } catch (error) {
    console.error('Error scraping member requests:', error);
  }

  return members;
}

/**
 * Extract data from a single member element
 */
function extractMemberData(element: HTMLElement, index: number): ScrapedMember | null {
  try {
    // Extract profile link and username
    const profileLink = element.querySelector('a[href*="/user/"], a[href*="facebook.com/profile"]') as HTMLAnchorElement;
    const profileUrl = profileLink?.href || '';
    const profileMatch = profileUrl.match(/(?:\/user\/|profile\.php\?id=)(\d+)/);
    const userId = profileMatch ? profileMatch[1] : `member_${Date.now()}_${index}`;

    // Extract name
    const nameElement = element.querySelector('[role="heading"], strong, span[dir="auto"]');
    const fullName = nameElement?.textContent?.trim() || 'Unknown User';

    // Try to split name into first and last
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Extract join date (look for date-like text)
    let joinedOn = new Date();
    const dateText = element.textContent?.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2} \w+ \d{4}/);
    if (dateText) {
      joinedOn = new Date(dateText[0]);
    }

    // Extract questions and answers
    const answers = extractQuestionsAndAnswers(element);

    // Extract username from profile URL or use full name
    let facebookUsername = fullName.toLowerCase().replace(/\s+/g, '.');
    if (profileUrl.includes('/')) {
      const urlParts = profileUrl.split('/');
      facebookUsername = urlParts[urlParts.length - 1] || facebookUsername;
    }

    return {
      id: userId,
      facebookUsername,
      profileUrl,
      firstName,
      lastName,
      joinedOn,
      answers,
      status: 'pending' as const,
    };
  } catch (error) {
    console.error('Error extracting member data from element:', error);
    return null;
  }
}

/**
 * Extract questions and answers from member element
 */
function extractQuestionsAndAnswers(element: HTMLElement): { question: string; answer: string }[] {
  const answers: { question: string; answer: string }[] = [];

  try {
    // Look for question-answer patterns
    // Facebook typically shows these as divs with specific structure
    const textBlocks = element.querySelectorAll('div[dir="auto"], span[dir="auto"]');

    let currentQuestion = '';
    textBlocks.forEach((block) => {
      const text = block.textContent?.trim() || '';

      // Questions typically end with '?' or contain certain keywords
      if (text.endsWith('?') || text.toLowerCase().includes('question')) {
        currentQuestion = text;
      } else if (currentQuestion && text.length > 0) {
        // This might be an answer
        // Check if it looks like an email (important for our use case)
        if (text.includes('@') || text.length > 10) {
          answers.push({
            question: currentQuestion,
            answer: text,
          });
          currentQuestion = ''; // Reset for next Q&A pair
        }
      }
    });

    // Also look for specific patterns like "Email:", "Why do you want to join?"
    const emailMatch = element.textContent?.match(/email[:\s]+([^\s]+@[^\s]+)/i);
    if (emailMatch) {
      answers.push({
        question: 'Email',
        answer: emailMatch[1],
      });
    }
  } catch (error) {
    console.error('Error extracting questions and answers:', error);
  }

  return answers;
}

/**
 * Main scraping function
 */
function performScrape(): ScrapedData | null {
  console.log('Starting Facebook scrape...');

  // Extract group information
  const groupInfo = extractGroupInfo();
  if (!groupInfo) {
    console.error('Could not extract group information');
    return null;
  }

  console.log('Group info:', groupInfo);

  // Wait a moment for page to fully load
  const members = scrapeMemberRequests();

  console.log(`Scraped ${members.length} members`);

  return {
    ...groupInfo,
    members,
  };
}

/**
 * Detect when user is on Facebook group members page
 */
function detectGroupPage(): boolean {
  const url = window.location.href;
  console.log('🔍 Group Collect: Checking URL:', url);
  
  // Check if on any Facebook groups page (for now, to test visibility)
  const isGroupPage = url.includes('facebook.com/groups/');
  
  const isGroupMembersPage =
    isGroupPage &&
    (url.includes('/members') ||
     url.includes('/member_requests') ||
     url.includes('/member-requests') ||  // Facebook uses hyphen for some groups
     url.includes('/membership_questions') ||
     url.includes('/membership-questions'));

  if (isGroupMembersPage) {
    console.log('✅ Group Collect: On Facebook group members page - UI should appear');

    // Notify background script that we're on a group page
    chrome.runtime.sendMessage({
      type: 'GROUP_PAGE_DETECTED',
      url: window.location.href,
    });
  } else if (isGroupPage) {
    console.log('ℹ️ Group Collect: On Facebook group page, but not member requests page');
    console.log('💡 To see member scraping features, navigate to Member Requests');
  } else {
    console.log('❌ Group Collect: Not on a Facebook group page');
  }

  return isGroupMembersPage;
}

/**
 * Add floating action buttons for manual scraping and other actions
 */
function addScrapingButton() {
  // Don't add button if already exists
  if (document.getElementById('group-collect-action-panel')) {
    return;
  }

  const panel = document.createElement('div');
  panel.id = 'group-collect-action-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;

  // Main scrape button
  const scrapeButton = document.createElement('button');
  scrapeButton.id = 'group-collect-scrape-btn';
  scrapeButton.textContent = '📊 Scrape Members';
  scrapeButton.style.cssText = `
    padding: 12px 20px;
    background: #4A69BD;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transition: all 0.2s;
    white-space: nowrap;
  `;

  scrapeButton.onmouseover = () => {
    scrapeButton.style.background = '#3A5AA4';
    scrapeButton.style.transform = 'scale(1.05)';
  };

  scrapeButton.onmouseout = () => {
    scrapeButton.style.background = '#4A69BD';
    scrapeButton.style.transform = 'scale(1)';
  };

  scrapeButton.onclick = async () => {
    scrapeButton.textContent = '⏳ Scraping...';
    scrapeButton.disabled = true;

    // Show working notification
    showNotification('🔄 Scraping member data...', 'info');

    const data = performScrape();

    if (data && data.members.length > 0) {
      // Send scraped data to background script for storage
      chrome.runtime.sendMessage({
        type: 'SAVE_SCRAPED_DATA',
        data,
      }, (response) => {
        if (response?.success) {
          scrapeButton.textContent = `✓ Saved ${data.members.length} members!`;
          scrapeButton.style.background = '#4CAF50';
          
          // Show success notification
          showNotification(
            `✓ Successfully scraped ${data.members.length} member${data.members.length > 1 ? 's' : ''}!`,
            'success',
            4000
          );
          
          setTimeout(() => {
            scrapeButton.textContent = '📊 Scrape Members';
            scrapeButton.style.background = '#4A69BD';
            scrapeButton.disabled = false;
          }, 3000);
        } else {
          scrapeButton.textContent = '❌ Failed to save';
          scrapeButton.style.background = '#f44336';
          
          // Show error notification
          showNotification('❌ Failed to save member data', 'error');
          
          setTimeout(() => {
            scrapeButton.textContent = '📊 Scrape Members';
            scrapeButton.style.background = '#4A69BD';
            scrapeButton.disabled = false;
          }, 3000);
        }
      });
    } else {
      scrapeButton.textContent = '❌ No members found';
      scrapeButton.style.background = '#f44336';
      
      // Show error notification
      showNotification('❌ No members found on this page', 'error');
      
      setTimeout(() => {
        scrapeButton.textContent = '📊 Scrape Members';
        scrapeButton.style.background = '#4A69BD';
        scrapeButton.disabled = false;
      }, 3000);
    }
  };

  // Auto-decline button
  const autoDeclineButton = document.createElement('button');
  autoDeclineButton.id = 'group-collect-autodecline-btn';
  autoDeclineButton.textContent = '🚫 Run Auto-Decline';
  autoDeclineButton.style.cssText = `
    padding: 12px 20px;
    background: #f59e0b;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transition: all 0.2s;
    white-space: nowrap;
  `;

  autoDeclineButton.onmouseover = () => {
    autoDeclineButton.style.background = '#d97706';
    autoDeclineButton.style.transform = 'scale(1.05)';
  };

  autoDeclineButton.onmouseout = () => {
    autoDeclineButton.style.background = '#f59e0b';
    autoDeclineButton.style.transform = 'scale(1)';
  };

  autoDeclineButton.onclick = async () => {
    autoDeclineButton.textContent = '⏳ Processing...';
    autoDeclineButton.disabled = true;

    // Send message to trigger auto-decline
    chrome.runtime.sendMessage({
      type: 'RUN_AUTO_DECLINE',
    }, (response) => {
      if (response?.success) {
        autoDeclineButton.textContent = '✓ Auto-Decline Complete!';
        autoDeclineButton.style.background = '#4CAF50';
        
        setTimeout(() => {
          autoDeclineButton.textContent = '🚫 Run Auto-Decline';
          autoDeclineButton.style.background = '#f59e0b';
          autoDeclineButton.disabled = false;
        }, 3000);
      } else {
        autoDeclineButton.textContent = '❌ Failed';
        autoDeclineButton.style.background = '#ef4444';
        
        setTimeout(() => {
          autoDeclineButton.textContent = '🚫 Run Auto-Decline';
          autoDeclineButton.style.background = '#f59e0b';
          autoDeclineButton.disabled = false;
        }, 3000);
      }
    });
  };

  // Push to Sheets button
  const pushToSheetsButton = document.createElement('button');
  pushToSheetsButton.id = 'group-collect-push-btn';
  pushToSheetsButton.textContent = '📤 Push to Sheets';
  pushToSheetsButton.style.cssText = `
    padding: 12px 20px;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transition: all 0.2s;
    white-space: nowrap;
  `;

  pushToSheetsButton.onmouseover = () => {
    pushToSheetsButton.style.background = '#059669';
    pushToSheetsButton.style.transform = 'scale(1.05)';
  };

  pushToSheetsButton.onmouseout = () => {
    pushToSheetsButton.style.background = '#10b981';
    pushToSheetsButton.style.transform = 'scale(1)';
  };

  pushToSheetsButton.onclick = async () => {
    pushToSheetsButton.textContent = '⏳ Pushing...';
    pushToSheetsButton.disabled = true;

    // Show working notification
    showNotification('🔄 Pushing data to Google Sheets...', 'info');

    // Send message to push to sheets
    chrome.runtime.sendMessage({
      type: 'PUSH_TO_SHEETS',
    }, (response) => {
      if (response?.success) {
        pushToSheetsButton.textContent = '✓ Pushed to Sheets!';
        pushToSheetsButton.style.background = '#4CAF50';
        
        // Show success notification
        showNotification('✓ Data successfully pushed to Google Sheets!', 'success', 4000);
        
        setTimeout(() => {
          pushToSheetsButton.textContent = '📤 Push to Sheets';
          pushToSheetsButton.style.background = '#10b981';
          pushToSheetsButton.disabled = false;
        }, 3000);
      } else {
        pushToSheetsButton.textContent = '❌ Failed';
        pushToSheetsButton.style.background = '#ef4444';
        
        // Show error notification
        showNotification('❌ Failed to push to Google Sheets', 'error');
        
        setTimeout(() => {
          pushToSheetsButton.textContent = '📤 Push to Sheets';
          pushToSheetsButton.style.background = '#10b981';
          pushToSheetsButton.disabled = false;
        }, 3000);
      }
    });
  };

  panel.appendChild(scrapeButton);
  panel.appendChild(autoDeclineButton);
  panel.appendChild(pushToSheetsButton);

  document.body.appendChild(panel);
  console.log('✅ Group Collect: Action panel with 3 buttons added to page');
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SCRAPE_PAGE') {
    console.log('Received scrape request from extension');

    // Show working notification
    showNotification('🔄 Scraping member data...', 'info');

    try {
      const data = performScrape();

      if (data) {
        // Show success notification
        showNotification(
          `✓ Successfully scraped ${data.members.length} member${data.members.length > 1 ? 's' : ''}!`,
          'success',
          4000
        );
        sendResponse({ success: true, data });
      } else {
        // Show error notification
        showNotification('❌ Failed to scrape member data', 'error');
        sendResponse({ success: false, error: 'Failed to scrape data' });
      }
    } catch (error) {
      console.error('Scraping error:', error);
      // Show error notification
      showNotification('❌ Error while scraping: ' + String(error), 'error');
      sendResponse({ success: false, error: String(error) });
    }
  }

  return true; // Keep channel open for async response
});

// Run detection on page load and URL changes
const isGroupPage = detectGroupPage();

if (isGroupPage) {
  // Add scraping button and banner after a short delay to ensure page is loaded
  setTimeout(() => {
    addScrapingButton();
    showDataDestinationBanner();
  }, 2000);
}

// Monitor for URL changes (Facebook is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    const isNowGroupPage = detectGroupPage();

    if (isNowGroupPage) {
      setTimeout(() => {
        addScrapingButton();
        showDataDestinationBanner();
      }, 2000);
    } else {
      // Remove panel and banner if navigating away from group page
      const panel = document.getElementById('group-collect-action-panel');
      if (panel) {
        panel.remove();
      }
      const banner = document.getElementById('group-collect-banner');
      if (banner) {
        banner.remove();
        document.body.style.paddingTop = '';
      }
    }
  }
}).observe(document, { subtree: true, childList: true });

export {};
