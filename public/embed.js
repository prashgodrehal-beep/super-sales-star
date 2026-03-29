// === GrowthAspire AI Agent — Embed Script ===
// Add this to growthaspire.com:
//   <script src="https://your-agent-domain.vercel.app/embed.js"></script>
//
// Two modes:
// 1. HERO MODE (default): Redirects the homepage hero section to the agent
// 2. IFRAME MODE: Embeds the agent as an iframe overlay
//
// Configure with data attributes on the script tag:
//   <script src="..." data-mode="hero" data-target="#hero-section"></script>

(function() {
  'use strict';

  // Config
  var AGENT_URL = document.currentScript?.getAttribute('data-agent-url')
    || document.currentScript?.src.replace('/embed.js', '/agent');
  var MODE = document.currentScript?.getAttribute('data-mode') || 'iframe';
  var TARGET = document.currentScript?.getAttribute('data-target') || null;

  // === IFRAME MODE ===
  // Creates a full-screen iframe overlay with the agent
  function initIframeMode() {
    // Create overlay container
    var overlay = document.createElement('div');
    overlay.id = 'kshama-overlay';
    overlay.style.cssText = [
      'position: fixed',
      'top: 0', 'left: 0', 'right: 0', 'bottom: 0',
      'z-index: 999999',
      'background: #0a1628',
      'transition: opacity 0.4s ease, transform 0.4s ease',
      'opacity: 0',
      'transform: translateY(10px)',
    ].join(';');

    // Create iframe
    var iframe = document.createElement('iframe');
    iframe.src = AGENT_URL;
    iframe.style.cssText = [
      'width: 100%', 'height: 100%',
      'border: none',
      'background: #0a1628',
    ].join(';');
    iframe.allow = 'clipboard-write';

    // Close button (dismiss overlay to browse)
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕ Browse Website';
    closeBtn.style.cssText = [
      'position: absolute', 'top: 16px', 'right: 16px',
      'z-index: 10',
      'padding: 8px 16px',
      'border-radius: 20px',
      'border: 1px solid rgba(0,212,255,0.3)',
      'background: rgba(10,22,40,0.9)',
      'color: #00d4ff',
      'font-size: 13px',
      'font-family: system-ui, sans-serif',
      'cursor: pointer',
      'backdrop-filter: blur(10px)',
    ].join(';');

    closeBtn.onclick = function() {
      overlay.style.opacity = '0';
      overlay.style.transform = 'translateY(10px)';
      setTimeout(function() {
        overlay.style.display = 'none';
      }, 400);
      // Show the re-open button
      reopenBtn.style.display = 'flex';
    };

    overlay.appendChild(iframe);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(function() {
      overlay.style.opacity = '1';
      overlay.style.transform = 'translateY(0)';
    });

    // Re-open button (appears after dismissing)
    var reopenBtn = document.createElement('button');
    reopenBtn.innerHTML = '<span style="font-size:18px">💬</span><span style="margin-left:8px">Talk to Kshama</span>';
    reopenBtn.id = 'kshama-reopen';
    reopenBtn.style.cssText = [
      'display: none',
      'position: fixed', 'bottom: 24px', 'right: 24px',
      'z-index: 999998',
      'padding: 14px 22px',
      'border-radius: 28px',
      'border: none',
      'background: linear-gradient(135deg, #00d4ff, #00b4dc)',
      'color: #0a1628',
      'font-size: 14px',
      'font-weight: 600',
      'font-family: system-ui, sans-serif',
      'cursor: pointer',
      'align-items: center',
      'box-shadow: 0 6px 30px rgba(0,212,255,0.3)',
      'transition: transform 0.2s',
    ].join(';');

    reopenBtn.onmouseenter = function() { reopenBtn.style.transform = 'scale(1.05)'; };
    reopenBtn.onmouseleave = function() { reopenBtn.style.transform = 'scale(1)'; };
    reopenBtn.onclick = function() {
      overlay.style.display = 'block';
      requestAnimationFrame(function() {
        overlay.style.opacity = '1';
        overlay.style.transform = 'translateY(0)';
      });
      reopenBtn.style.display = 'none';
    };

    document.body.appendChild(reopenBtn);
  }

  // === HERO MODE ===
  // Replaces a target element with an iframe of the agent
  function initHeroMode() {
    var target = TARGET ? document.querySelector(TARGET) : null;
    if (!target) {
      console.warn('[Kshama] Hero mode target not found:', TARGET);
      initIframeMode(); // Fallback to iframe mode
      return;
    }

    var iframe = document.createElement('iframe');
    iframe.src = AGENT_URL;
    iframe.style.cssText = [
      'width: 100%',
      'height: 100vh',
      'border: none',
      'background: #0a1628',
      'display: block',
    ].join(';');
    iframe.allow = 'clipboard-write';

    target.innerHTML = '';
    target.appendChild(iframe);
  }

  // Initialize based on mode
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (MODE === 'hero') initHeroMode();
      else initIframeMode();
    });
  } else {
    if (MODE === 'hero') initHeroMode();
    else initIframeMode();
  }
})();
