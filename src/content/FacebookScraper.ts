/**
 * Facebook DOM Scraper with Multiple Fallback Strategies
 *
 * Facebook obfuscates their DOM with dynamic class names that change frequently.
 * This scraper uses multiple strategies to find elements reliably.
 */

export interface ScrapedMemberData {
  name: string | null;
  profileUrl: string | null;
  questions: Array<{ question: string; answer: string }>;
}

export class FacebookScraper {
  private debugMode: boolean;

  constructor(debugMode = false) {
    this.debugMode = debugMode;
  }

  private log(...args: any[]) {
    if (this.debugMode) {
      console.log('[FB Scraper]', ...args);
    }
  }

  /**
   * Find all member request cards on the page
   */
  findMemberCards(): Element[] {
    const strategies = [
      // Strategy 1: Look for elements with specific aria-labels
      () => document.querySelectorAll('[role="article"]'),

      // Strategy 2: Look for common card container patterns
      () => document.querySelectorAll('[data-testid*="member"]'),

      // Strategy 3: Find by structure - containers with profile links and approve buttons
      () => {
        const cards: Element[] = [];
        const allDivs = document.querySelectorAll('div');
        allDivs.forEach(div => {
          const hasProfileLink = div.querySelector('a[href*="/user/"]') || div.querySelector('a[href*="facebook.com/"]');
          const hasApproveButton = this.findApproveButton(div);
          if (hasProfileLink && hasApproveButton) {
            cards.push(div);
          }
        });
        return cards;
      }
    ];

    for (const strategy of strategies) {
      try {
        const cards = Array.from(strategy());
        if (cards.length > 0) {
          this.log(`Found ${cards.length} member cards using strategy`);
          return cards;
        }
      } catch (e) {
        this.log('Strategy failed:', e);
      }
    }

    this.log('No member cards found');
    return [];
  }

  /**
   * Extract member data from a single card
   */
  extractMemberData(card: Element): ScrapedMemberData | null {
    try {
      const name = this.extractName(card);
      const profileUrl = this.extractProfileUrl(card);
      const questions = this.extractQuestions(card);

      this.log('Extracted data:', { name, profileUrl, questions });

      if (!name || !profileUrl) {
        this.log('Missing required data (name or profile URL)');
        return null;
      }

      return { name, profileUrl, questions };
    } catch (error) {
      this.log('Error extracting member data:', error);
      return null;
    }
  }

  /**
   * Extract member name with fallback strategies
   */
  private extractName(card: Element): string | null {
    const strategies = [
      // Strategy 1: Link text
      () => {
        const link = card.querySelector('a[href*="/user/"]') || card.querySelector('a[href*="facebook.com/"]');
        return link?.textContent?.trim() || null;
      },

      // Strategy 2: Heading or strong text
      () => {
        const heading = card.querySelector('h2, h3, h4, strong');
        return heading?.textContent?.trim() || null;
      },

      // Strategy 3: aria-label on link
      () => {
        const link = card.querySelector('a[aria-label]');
        return link?.getAttribute('aria-label') || null;
      },

      // Strategy 4: First bold text
      () => {
        const bold = card.querySelector('span[style*="font-weight"]');
        return bold?.textContent?.trim() || null;
      }
    ];

    for (const strategy of strategies) {
      try {
        const name = strategy();
        if (name && name.length > 0 && name.length < 100) {
          return name;
        }
      } catch (e) {
        // Continue to next strategy
      }
    }

    return null;
  }

  /**
   * Extract profile URL with fallback strategies
   */
  private extractProfileUrl(card: Element): string | null {
    const strategies = [
      // Strategy 1: Direct profile link
      () => {
        const link = card.querySelector('a[href*="/user/"]') as HTMLAnchorElement;
        return link?.href || null;
      },

      // Strategy 2: Any facebook.com link with profile info
      () => {
        const links = card.querySelectorAll('a[href*="facebook.com"]');
        for (const link of Array.from(links)) {
          const href = (link as HTMLAnchorElement).href;
          if (href.includes('/user/') || href.includes('/profile.php')) {
            return href;
          }
        }
        return null;
      },

      // Strategy 3: First link in the card
      () => {
        const link = card.querySelector('a[href]') as HTMLAnchorElement;
        const href = link?.href;
        if (href && href.includes('facebook.com')) {
          return href;
        }
        return null;
      }
    ];

    for (const strategy of strategies) {
      try {
        const url = strategy();
        if (url) {
          return this.cleanProfileUrl(url);
        }
      } catch (e) {
        // Continue to next strategy
      }
    }

    return null;
  }

  /**
   * Clean and normalize profile URL
   */
  private cleanProfileUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Preserve 'id' param for profile.php URLs, remove everything else
      const idParam = urlObj.searchParams.get('id');
      urlObj.search = '';
      if (idParam) {
        urlObj.searchParams.set('id', idParam);
      }
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Extract user ID or username from a Facebook profile URL
   */
  static extractUserId(profileUrl: string): string {
    try {
      const urlObj = new URL(profileUrl);

      // Format: /profile.php?id=123456789
      const idParam = urlObj.searchParams.get('id');
      if (idParam) {
        return idParam;
      }

      // Format: /user/123456789
      const userMatch = urlObj.pathname.match(/\/user\/(\d+)/);
      if (userMatch) {
        return userMatch[1];
      }

      // Format: /username (last path segment, excluding known FB paths)
      const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 0);
      const knownPaths = ['groups', 'pages', 'events', 'photo', 'watch', 'marketplace', 'gaming', 'profile.php'];
      if (pathSegments.length > 0 && !knownPaths.includes(pathSegments[0])) {
        return pathSegments[pathSegments.length - 1];
      }

      return '';
    } catch {
      return '';
    }
  }

  /**
   * Extract Q&A pairs with fallback strategies
   */
  private extractQuestions(card: Element): Array<{ question: string; answer: string }> {
    const questions: Array<{ question: string; answer: string }> = [];

    const isQuestionText = (text: string): boolean => {
      if (!text || text.length < 3 || text.length > 300) return false;
      return text.endsWith('?') ||
        /^(what|where|when|why|how|which|do you|are you|have you|please|provide|enter|email|name)/i.test(text);
    };

    const strategies = [
      // Strategy 1: Use innerText with line-based parsing (respects CSS display)
      () => {
        const innerText = (card as HTMLElement).innerText || '';
        const lines = innerText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        for (let i = 0; i < lines.length - 1; i++) {
          if (isQuestionText(lines[i])) {
            const answer = lines[i + 1];
            if (answer && !isQuestionText(answer) && answer.length < 500) {
              questions.push({ question: lines[i], answer });
            }
          }
        }
      },

      // Strategy 2: Find spans whose own direct text looks like a question,
      // then grab the next sibling span's text as the answer
      () => {
        const allSpans = card.querySelectorAll('span');
        for (let i = 0; i < allSpans.length; i++) {
          const span = allSpans[i];
          // Get only the direct text content (not deeply nested children)
          const directText = this.getDirectText(span);
          if (isQuestionText(directText)) {
            // Look for answer in next sibling, parent's next sibling, or next span
            const answerText = this.findAnswerNear(span) ||
              (allSpans[i + 1] ? this.getDirectText(allSpans[i + 1]) : '');
            if (answerText && !isQuestionText(answerText) && answerText.length < 500) {
              questions.push({ question: directText, answer: answerText });
            }
          }
        }
      },

      // Strategy 3: Look for containers that hold Q&A pairs as child divs
      () => {
        const allDivs = card.querySelectorAll('div');
        for (const div of Array.from(allDivs)) {
          const children = Array.from(div.children);
          if (children.length >= 2 && children.length <= 4) {
            const firstText = children[0]?.textContent?.trim() || '';
            const secondText = children[1]?.textContent?.trim() || '';
            if (isQuestionText(firstText) && secondText && secondText.length < 500) {
              questions.push({ question: firstText, answer: secondText });
            }
          }
        }
      },

      // Strategy 4: Look for dl/dt/dd structure
      () => {
        const dts = card.querySelectorAll('dt');
        dts.forEach(dt => {
          const dd = dt.nextElementSibling;
          if (dd && dd.tagName === 'DD') {
            questions.push({
              question: dt.textContent?.trim() || '',
              answer: dd.textContent?.trim() || ''
            });
          }
        });
      },

      // Strategy 5: Fallback — scan all text for email patterns and create a synthetic Q&A
      () => {
        const fullText = (card as HTMLElement).innerText || card.textContent || '';
        const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          questions.push({ question: 'Email', answer: emailMatch[0] });
        }
      }
    ];

    for (const strategy of strategies) {
      try {
        strategy();
        if (questions.length > 0) {
          break;
        }
      } catch (e) {
        this.log('Q&A strategy failed:', e);
      }
    }

    // Limit to 3 questions max and deduplicate
    const uniqueQuestions = questions.filter((q, idx, arr) =>
      arr.findIndex(item => item.question === q.question) === idx
    );

    return uniqueQuestions.slice(0, 3);
  }

  /**
   * Get direct text content of an element (excluding deeply nested children)
   */
  private getDirectText(element: Element): string {
    let text = '';
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      }
    }
    // If no direct text, fall back to full textContent for leaf elements
    if (!text.trim() && element.children.length === 0) {
      text = element.textContent || '';
    }
    return text.trim();
  }

  /**
   * Find an answer near a question element by checking siblings and parent siblings
   */
  private findAnswerNear(questionElement: Element): string {
    // Check next sibling
    let next = questionElement.nextElementSibling;
    if (next) {
      const text = next.textContent?.trim() || '';
      if (text.length > 0 && text.length < 500) return text;
    }

    // Check parent's next sibling
    const parent = questionElement.parentElement;
    if (parent) {
      next = parent.nextElementSibling;
      if (next) {
        const text = next.textContent?.trim() || '';
        if (text.length > 0 && text.length < 500) return text;
      }
    }

    return '';
  }

  /**
   * Find approve button in a card or container
   */
  findApproveButton(container: Element | Document = document): Element | null {
    const strategies = [
      // Strategy 1: aria-label
      () => container.querySelector('[aria-label*="Approve" i], [aria-label*="Accept" i]'),

      // Strategy 2: Text content
      () => {
        const buttons = container.querySelectorAll('button, [role="button"]');
        for (const btn of Array.from(buttons)) {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes('approve') || text.includes('accept')) {
            return btn;
          }
        }
        return null;
      },

      // Strategy 3: data-testid
      () => container.querySelector('[data-testid*="approve" i]')
    ];

    for (const strategy of strategies) {
      try {
        const button = strategy();
        if (button) {
          return button;
        }
      } catch (e) {
        // Continue
      }
    }

    return null;
  }

  /**
   * Find decline button in a card or container
   */
  findDeclineButton(container: Element | Document = document): Element | null {
    const strategies = [
      // Strategy 1: aria-label
      () => container.querySelector('[aria-label*="Decline" i], [aria-label*="Reject" i]'),

      // Strategy 2: Text content
      () => {
        const buttons = container.querySelectorAll('button, [role="button"]');
        for (const btn of Array.from(buttons)) {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes('decline') || text.includes('reject')) {
            return btn;
          }
        }
        return null;
      },

      // Strategy 3: data-testid
      () => container.querySelector('[data-testid*="decline" i]')
    ];

    for (const strategy of strategies) {
      try {
        const button = strategy();
        if (button) {
          return button;
        }
      } catch (e) {
        // Continue
      }
    }

    return null;
  }

  /**
   * Debug: Log all elements and their attributes
   */
  debugLogElements(container: Element = document.body) {
    console.log('=== DOM DEBUG ===');

    // Log all links
    const links = container.querySelectorAll('a[href]');
    console.log(`Found ${links.length} links:`);
    links.forEach((link, idx) => {
      if (idx < 10) { // Only log first 10
        console.log({
          text: link.textContent?.slice(0, 50),
          href: (link as HTMLAnchorElement).href,
          ariaLabel: link.getAttribute('aria-label')
        });
      }
    });

    // Log all buttons
    const buttons = container.querySelectorAll('button, [role="button"]');
    console.log(`Found ${buttons.length} buttons:`);
    buttons.forEach((btn, idx) => {
      if (idx < 10) {
        console.log({
          text: btn.textContent?.slice(0, 50),
          ariaLabel: btn.getAttribute('aria-label'),
          testId: btn.getAttribute('data-testid')
        });
      }
    });

    console.log('=== END DEBUG ===');
  }
}
