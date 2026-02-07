/**
 * Onboarding page script
 */

document.addEventListener('DOMContentLoaded', () => {
  // Get Started button - opens popup
  const getStartedBtn = document.getElementById('getStartedBtn');
  getStartedBtn.addEventListener('click', () => {
    // Mark onboarding as complete
    chrome.storage.local.set({ onboarding_complete: true }, () => {
      // Open the extension popup (or redirect to a Facebook group)
      window.close();
    });
  });

  // Help link - opens documentation (future)
  const helpLink = document.getElementById('helpLink');
  helpLink.addEventListener('click', (e) => {
    e.preventDefault();
    // TODO: Open help documentation page
    alert('Help documentation coming soon!');
  });

  // Settings link - opens settings page
  const settingsLink = document.getElementById('settingsLink');
  settingsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // Add smooth scroll effect
  window.addEventListener('scroll', () => {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step) => {
      const rect = step.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) {
        step.style.opacity = '1';
      }
    });
  });
});
