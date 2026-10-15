/**
 * byePASS - Site Specific Paywall & Overlay Rules + Deep Parsers
 */

const SITE_RULES = [
  {
    name: 'Bloomberg',
    match: ['bloomberg.com'],
    handler: function () {
      // Remove fence and paywall classes
      document.querySelectorAll('html[class], body[class]').forEach(e => {
        if (e.className.includes('fence') || e.className.includes('paywall') || e.className.includes('lock')) {
          e.removeAttribute('class');
        }
      });

      // Unlock body & HTML
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';

      // Bloomberg Next.js Full Article Re-Constructor
      const nextScript = document.querySelector('script#__NEXT_DATA__');
      if (nextScript) {
        try {
          const json = JSON.parse(nextScript.text);
          const story = json?.props?.pageProps?.story;
          if (story && story.body && story.body.content) {
            const jsonPars = story.body.content;
            const articlePars = document.querySelectorAll('div > p[class*="ArticleBodyText_"]');
            
            if (articlePars.length > 0 && articlePars.length < 6) {
              const parClass = articlePars[0].getAttribute('class') || '';
              const article = articlePars[0].parentNode;
              if (article) {
                article.style.maskImage = 'none';
                article.style.webkitMaskImage = 'none';
                article.style.maxHeight = 'none';
                article.style.height = 'auto';

                // Helper to extract text from content array
                function extractContent(items) {
                  let text = '';
                  for (let item of items) {
                    if (item.type === 'text' && item.value) {
                      text += item.value;
                    } else if (item.content) {
                      text += extractContent(item.content);
                    }
                  }
                  return text;
                }

                // Append missing paragraphs from JSON
                jsonPars.forEach(par => {
                  if (['paragraph', 'heading'].includes(par.type) && par.content) {
                    const text = extractContent(par.content);
                    if (text.trim().length > 0) {
                      // Check if already rendered
                      const alreadyRendered = Array.from(article.querySelectorAll('p')).some(p => p.textContent.includes(text.substring(0, 30)));
                      if (!alreadyRendered) {
                        const p = document.createElement('p');
                        p.className = parClass;
                        p.textContent = text;
                        if (par.type === 'heading') p.style.fontWeight = 'bold';
                        article.appendChild(p);
                      }
                    }
                  }
                });
              }
            }
          }
        } catch (e) {
          console.warn('byePASS: Bloomberg JSON parsing error', e);
        }
      }
    },
    selectorsToRemove: [
      'div#paywall-banner',
      'div.leaderboard-container',
      'div[class*="paywall-"]',
      'div[data-component="paywall"]',
      'div[class*="fence-"]',
      'div#fence-root',
      'div.paywall-overlay'
    ]
  },
  {
    name: 'Medium & Subdomains',
    match: ['medium.com', 'towardsdatascience.com', 'betterprogramming.pub', 'javascript.plainenglish.io'],
    selectorsToRemove: [
      'div#credential_picker_container',
      'div[id^="metered-content-bottom-wrapper"]',
      'div.overlay',
      'div[role="dialog"]',
      'div.branch-journeys-top'
    ],
    elementsToRestore: [
      'article p',
      'article',
      'main'
    ]
  },
  {
    name: 'New York Times',
    match: ['nytimes.com'],
    selectorsToRemove: [
      'div#gateway-content',
      'div#standalone-footer',
      'div[data-testid="inline-message"]',
      'div.css-1bd8bfl',
      'div.vi-gateway-container'
    ],
    elementsToRestore: [
      'section[name="articleBody"]',
      'div.StoryBodyCompanionColumn'
    ]
  },
  {
    name: 'The Washington Post',
    match: ['washingtonpost.com'],
    selectorsToRemove: [
      'div[data-qa="paywall"]',
      'div#paywall-container',
      'div.paywall-overlay',
      'div[data-qa="inline-ad"]'
    ]
  },
  {
    name: 'Financial Times',
    match: ['ft.com'],
    selectorsToRemove: [
      'div.o-cookie-message',
      'div.barrier-container',
      'div.overlay__content'
    ]
  },
  {
    name: 'General News & Blogs (Generic Fallback)',
    match: ['*'],
    selectorsToRemove: [
      'div[class*="paywall-overlay"]',
      'div[class*="subscription-prompt"]',
      'div[class*="subscriber-gate"]',
      'div[class*="metered-gate"]',
      'div[class*="modal-backdrop"]',
      'div[class*="fade-overlay"]',
      'div.tp-backdrop',
      'div.tp-modal',
      'div.fc-ab-root',
      'div.sp_veil'
    ],
    elementsToRestore: [
      'article',
      'main',
      '.article-body',
      '.story-body',
      '.content-body',
      '.entry-content',
      '.post-content'
    ]
  }
];

if (typeof window !== 'undefined') {
  window.BYEPASS_RULES = SITE_RULES;
}
