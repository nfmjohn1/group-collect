/**
 * Facebook Content Script - Member Scraper
 * Scrapes pending member requests from Facebook groups
 */

console.log('Group Collect scraper content script loaded');

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SCRAPE_PAGE') {
    console.log('Scraping Facebook page...');

    try {
      // TODO: Implement Facebook DOM scraping logic
      // This will extract member data from the approval queue

      const scrapedData = {
        groupName: 'Example Group',
        members: [
          // Sample data structure
          // {
          //   id: '123',
          //   facebookUsername: 'john.doe',
          //   firstName: 'John',
          //   lastName: 'Doe',
          //   joinedOn: new Date(),
          //   q1: 'Answer 1',
          //   q2: 'Answer 2',
          //   q3: 'Answer 3',
          //   status: 'pending',
          // }
        ],
      };

      sendResponse({ success: true, data: scrapedData });
    } catch (error) {
      console.error('Scraping error:', error);
      sendResponse({ success: false, error: error });
    }
  }

  return true;
});

// Detect when user is on Facebook group members page
function detectGroupPage() {
  const url = window.location.href;
  const isGroupMembersPage = url.includes('facebook.com/groups/') &&
    (url.includes('/members') || url.includes('/member_requests'));

  if (isGroupMembersPage) {
    console.log('On Facebook group members page');
    // TODO: Notify background script or show badge
  }
}

// Run detection on page load and URL changes
detectGroupPage();

// Monitor for URL changes (Facebook is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    detectGroupPage();
  }
}).observe(document, { subtree: true, childList: true });

export {};
