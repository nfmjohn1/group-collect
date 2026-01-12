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
  const isGroupMembersPage =
    url.includes('facebook.com/groups/') &&
    (url.includes('/members') ||
     url.includes('/member_requests') ||
     url.includes('/membership_questions'));

  if (isGroupMembersPage) {
    console.log('✓ On Facebook group members page');

    // Notify background script that we're on a group page
    chrome.runtime.sendMessage({
      type: 'GROUP_PAGE_DETECTED',
      url: window.location.href,
    });
  }

  return isGroupMembersPage;
}

/**
 * Add floating action button for manual scraping
 */
function addScrapingButton() {
  // Don't add button if already exists
  if (document.getElementById('group-collect-scrape-btn')) {
    return;
  }

  const button = document.createElement('button');
  button.id = 'group-collect-scrape-btn';
  button.textContent = '📊 Scrape Members';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
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
  `;

  button.onmouseover = () => {
    button.style.background = '#3A5AA4';
    button.style.transform = 'scale(1.05)';
  };

  button.onmouseout = () => {
    button.style.background = '#4A69BD';
    button.style.transform = 'scale(1)';
  };

  button.onclick = async () => {
    button.textContent = '⏳ Scraping...';
    button.disabled = true;

    const data = performScrape();

    if (data && data.members.length > 0) {
      // Send scraped data to background script for storage
      chrome.runtime.sendMessage({
        type: 'SAVE_SCRAPED_DATA',
        data,
      }, (response) => {
        if (response?.success) {
          button.textContent = `✓ Saved ${data.members.length} members!`;
          button.style.background = '#4CAF50';
          setTimeout(() => {
            button.textContent = '📊 Scrape Members';
            button.style.background = '#4A69BD';
            button.disabled = false;
          }, 3000);
        } else {
          button.textContent = '❌ Failed to save';
          button.style.background = '#f44336';
          setTimeout(() => {
            button.textContent = '📊 Scrape Members';
            button.style.background = '#4A69BD';
            button.disabled = false;
          }, 3000);
        }
      });
    } else {
      button.textContent = '❌ No members found';
      button.style.background = '#f44336';
      setTimeout(() => {
        button.textContent = '📊 Scrape Members';
        button.style.background = '#4A69BD';
        button.disabled = false;
      }, 3000);
    }
  };

  document.body.appendChild(button);
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SCRAPE_PAGE') {
    console.log('Received scrape request from extension');

    try {
      const data = performScrape();

      if (data) {
        sendResponse({ success: true, data });
      } else {
        sendResponse({ success: false, error: 'Failed to scrape data' });
      }
    } catch (error) {
      console.error('Scraping error:', error);
      sendResponse({ success: false, error: String(error) });
    }
  }

  return true; // Keep channel open for async response
});

// Run detection on page load and URL changes
const isGroupPage = detectGroupPage();

if (isGroupPage) {
  // Add scraping button after a short delay to ensure page is loaded
  setTimeout(() => {
    addScrapingButton();
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
      }, 2000);
    } else {
      // Remove button if navigating away from group page
      const button = document.getElementById('group-collect-scrape-btn');
      if (button) {
        button.remove();
      }
    }
  }
}).observe(document, { subtree: true, childList: true });

export {};
