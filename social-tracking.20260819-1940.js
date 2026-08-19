(() => {
  'use strict';

  const SOCIAL = {
    instagram: { match: /instagram\.com\/zafer\.pro/i, base: 'https://instagram.com/zafer.pro' },
    youtube: { match: /youtube\.com\/@zaferlatif/i, base: 'https://youtube.com/@zaferlatif' }
  };

  function trackedUrl(platform, placement) {
    const spec = SOCIAL[platform];
    if (!spec) return '';
    const url = new URL(spec.base);
    url.searchParams.set('utm_source', '303box');
    url.searchParams.set('utm_medium', placement);
    url.searchParams.set('utm_campaign', 'social_follow');
    url.searchParams.set('utm_content', platform);
    return url.toString();
  }

  function decorateAnchor(anchor, platform, placement) {
    if (!anchor || !SOCIAL[platform]) return;
    anchor.href = trackedUrl(platform, placement);
    anchor.dataset.socialPlatform = platform;
    anchor.dataset.socialPlacement = placement;
  }

  function decorate() {
    document.querySelectorAll('.site-footer a[href]').forEach(anchor => {
      for (const [platform, spec] of Object.entries(SOCIAL)) {
        if (spec.match.test(anchor.href)) decorateAnchor(anchor, platform, 'footer');
      }
    });

    document.querySelectorAll('#creatorFollow a[href]').forEach(anchor => {
      for (const [platform, spec] of Object.entries(SOCIAL)) {
        if (spec.match.test(anchor.href)) decorateAnchor(anchor, platform, 'popup');
      }
    });
  }

  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[data-social-platform][data-social-placement]');
    if (!anchor) return;
    try {
      if (window.__303boxConsent?.analytics === true && typeof window.gtag === 'function') {
        window.gtag('event', 'social_click', {
          social_platform: anchor.dataset.socialPlatform,
          social_placement: anchor.dataset.socialPlacement,
          link_url: anchor.href,
          transport_type: 'beacon'
        });
      }
    } catch (_) {}
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', decorate, { once: true });
  else decorate();

  const observer = new MutationObserver(decorate);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.__303boxSocialTracking = { version: '2100', decorate };
})();
