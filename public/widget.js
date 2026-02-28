/**
 * Çarkıfelek Widget - Secure Version
 * Uses token-based authentication through your own API
 * No Supabase keys exposed to client
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    shopToken: '',
    apiBaseUrl: 'https://qiiygcclanmgzlrcpmle.supabase.co/functions/v1', // Supabase Edge Functions
  };

  // State
  let widgetData = null;
  let wheelCanvas = null;
  let wheelContext = null;
  let isSpinning = false;
  let currentRotation = 0;
  let sessionEmail = null;
  let sessionPhone = null;
  let hasSpun = false;

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    console.log('🎡 Çarkıfelek Widget initializing...');

    const widgetScript = document.getElementById('carkifelek-widget-script');
    if (!widgetScript) {
      console.error('❌ Widget script not found!');
      return;
    }

    CONFIG.shopToken = widgetScript.getAttribute('data-shop-token') || '';
    console.log('📝 Shop token:', CONFIG.shopToken ? 'found' : 'NOT FOUND');
    console.log('🌐 API Base URL:', CONFIG.apiBaseUrl);

    // Derive API base URL from script src
    const scriptSrc = widgetScript.src;
    if (scriptSrc) {
      const url = new URL(scriptSrc);
      CONFIG.apiBaseUrl = `${url.protocol}//${url.hostname}`;
      if (url.port) {
        CONFIG.apiBaseUrl += `:${url.port}`;
      }
    }

    // Check for previous spin
    checkPreviousSpin();

    // Fetch widget data
    fetchWidgetData();

    // Track widget view
    trackWidgetView();
  }

  // ============================================
  // API CALLS - VIA YOUR SECURE API
  // ============================================

  async function fetchWidgetData() {
    if (!CONFIG.shopToken) {
      console.error('Shop token not provided');
      return;
    }

    try {
      const response = await fetch(
        `${CONFIG.apiBaseUrl}/widget-data?token=${encodeURIComponent(CONFIG.shopToken)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ.CRUDP1Lc6HGkUqY0Q_cwl6FqZf_PxN8qYi50cKLIXngk'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      widgetData = data;

      // Render widget after data is loaded
      setTimeout(() => {
        renderWidget();
      }, widgetData.widget.showOnLoad ? widgetData.widget.popupDelay : 0);

    } catch (error) {
      console.error('Failed to fetch widget data:', error);
    }
  }

  async function checkEmailInDatabase(email) {
    if (!widgetData || !email) return false;

    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: CONFIG.shopToken,
          email: email
        })
      });

      const result = await response.json();
      return result.exists || false;

    } catch (error) {
      console.error('Email check error:', error);
      return false;
    }
  }

  async function logPrizeWin(prizeId, email, couponCode) {
    if (!widgetData) return;

    const sessionId = getSessionId();

    try {
      await fetch(`${CONFIG.apiBaseUrl}/log-spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: CONFIG.shopToken,
          prize_id: prizeId,
          email: email,
          coupon_code: couponCode,
          session_id: sessionId
        })
      });

      // Store in localStorage
      localStorage.setItem(`cark_${CONFIG.shopToken}_spun`, 'true');
      localStorage.setItem(`cark_${CONFIG.shopToken}_email`, email);
      localStorage.setItem(`cark_${CONFIG.shopToken}_date`, new Date().toISOString());

    } catch (error) {
      console.error('Failed to log prize:', error);
    }
  }

  async function trackWidgetView() {
    const sessionId = getSessionId();

    try {
      await fetch(`${CONFIG.apiBaseUrl}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: CONFIG.shopToken,
          session_id: sessionId
        })
      });
    } catch (error) {
      // Don't fail on tracking errors
    }

    // Store view in localStorage
    const views = JSON.parse(localStorage.getItem(`cark_views`) || '{}');
    views[sessionId] = views[sessionId] || 0;
    views[sessionId]++;
    localStorage.setItem(`cark_views`, JSON.stringify(views));
  }

  // ============================================
  // WHEEL RENDERING & SPIN LOGIC
  // ============================================

  function createWheel(prizes) {
    const container = document.getElementById('carkifelek-wheel-canvas');
    if (!container) return;

    container.innerHTML = '';

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    canvas.id = 'wheel-canvas';
    container.appendChild(canvas);

    wheelCanvas = canvas;
    wheelContext = canvas.getContext('2d');

    drawWheel(prizes);
  }

  function drawWheel(prizes) {
    if (!wheelContext) return;

    const centerX = wheelCanvas.width / 2;
    const centerY = wheelCanvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    wheelContext.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);

    const totalPrizes = prizes.length;
    const arcSize = (2 * Math.PI) / totalPrizes;

    let currentAngle = currentRotation;

    prizes.forEach((prize, index) => {
      const startAngle = currentAngle;
      const endAngle = currentAngle + arcSize;

      // Draw slice
      wheelContext.beginPath();
      wheelContext.moveTo(centerX, centerY);
      wheelContext.arc(centerX, centerY, radius, startAngle, endAngle);
      wheelContext.closePath();

      wheelContext.fillStyle = prize.color;
      wheelContext.fill();

      wheelContext.strokeStyle = '#ffffff';
      wheelContext.lineWidth = 2;
      wheelContext.stroke();

      // Draw text
      wheelContext.save();
      wheelContext.translate(centerX, centerY);
      wheelContext.rotate(startAngle + arcSize / 2);
      wheelContext.textAlign = 'right';
      wheelContext.fillStyle = '#ffffff';
      wheelContext.font = 'bold 14px Arial';
      wheelContext.shadowColor = 'rgba(0,0,0,0.5)';
      wheelContext.shadowBlur = 4;

      const text = prize.name.length > 15
        ? prize.name.substring(0, 12) + '...'
        : prize.name;
      wheelContext.fillText(text, radius - 20, 5);

      wheelContext.restore();

      currentAngle += arcSize;
    });

    // Draw center circle
    wheelContext.beginPath();
    wheelContext.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    wheelContext.fillStyle = '#ffffff';
    wheelContext.fill();

    // Draw pointer
    wheelContext.beginPath();
    wheelContext.moveTo(centerX + radius + 15, centerY);
    wheelContext.lineTo(centerX + radius - 5, centerY - 15);
    wheelContext.lineTo(centerX + radius - 5, centerY + 15);
    wheelContext.closePath();
    wheelContext.fillStyle = '#ff4444';
    wheelContext.fill();
    wheelContext.strokeStyle = '#ffffff';
    wheelContext.lineWidth = 2;
    wheelContext.stroke();
  }

  function spinWheel() {
    if (isSpinning || hasSpun) return;

    const contactType = widgetData.shop.contactInfoType || 'email';
    const emailInput = document.getElementById('cark-email-input');
    const phoneInput = document.getElementById('cark-phone-input');

    const email = contactType === 'email' ? emailInput?.value : sessionEmail;
    const phone = contactType === 'phone' ? phoneInput?.value : sessionPhone;

    if (contactType === 'email' && !isValidEmail(email)) {
      showInputError('cark-email-input');
      return;
    }

    if (contactType === 'phone' && !isValidPhone(phone)) {
      showInputError('cark-phone-input');
      return;
    }

    isSpinning = true;

    if (contactType === 'email') {
      sessionEmail = email;
    } else {
      sessionPhone = phone;
    }

    // Determine prize based on chances
    const prizes = widgetData.prizes;
    const totalChance = prizes.reduce((sum, p) => sum + p.chance, 0);
    let random = Math.random() * totalChance;
    let winningPrize = prizes[0];

    for (const prize of prizes) {
      random -= prize.chance;
      if (random <= 0) {
        winningPrize = prize;
        break;
      }
    }

    // Calculate rotation
    const prizeIndex = prizes.indexOf(winningPrize);
    const arcSize = (2 * Math.PI) / prizes.length;
    const targetAngle = (2 * Math.PI) - (prizeIndex * arcSize) - (arcSize / 2);
    const spins = 5 + Math.random() * 3;
    const finalRotation = spins * 2 * Math.PI + targetAngle;

    // Animate
    const duration = 5000;
    const startTime = performance.now();
    const startRotation = currentRotation;

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      currentRotation = startRotation + (finalRotation * easeOut);

      drawWheel(prizes);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isSpinning = false;
        hasSpun = true;

        let couponCode = null;
        if (winningPrize.coupons && winningPrize.coupons.length > 0) {
          couponCode = winningPrize.coupons[0];
        }

        logPrizeWin(winningPrize.id, email || phone, couponCode);
        showResult(winningPrize, couponCode);
      }
    }

    requestAnimationFrame(animate);
  }

  // ============================================
  // UI RENDERING
  // ============================================

  function renderWidget() {
    if (!widgetData) return;

    if (document.getElementById('carkifelek-widget-container')) return;

    const container = document.createElement('div');
    container.id = 'carkifelek-widget-container';
    container.innerHTML = getWidgetHTML();

    document.body.appendChild(container);

    applyWidgetStyles();
    createWheel(widgetData.prizes);
    setupEventListeners();
  }

  function getWidgetHTML() {
    const { shop, widget } = widgetData;
    const contactType = shop.contactInfoType || 'email';

    return `
      <div id="carkifelek-widget" class="carkifelek-widget">
        <div class="carkifelek-overlay" id="carkifelek-overlay"></div>
        <div class="carkifelek-modal">
          <button class="carkifelek-close" id="carkifelek-close-btn">&times;</button>

          <div class="carkifelek-header">
            <div class="carkifelek-brand">
              ${shop.logo ? `<img src="${shop.logo}" alt="${shop.name}" class="carkifelek-logo">` : ''}
              ${shop.brandName ? `<span class="carkifelek-brand-name">${shop.brandName}</span>` : ''}
            </div>
            <h2 class="carkifelek-title">${widget.title}</h2>
            <p class="carkifelek-description">${widget.description}</p>
          </div>

          <div class="carkifelek-body">
            <div class="carkifelek-wheel-container">
              <div id="carkifelek-wheel-canvas"></div>
            </div>

            <div class="carkifelek-form" id="carkifelek-form">
              ${contactType === 'email' ? `
                <div class="carkifelek-input-group">
                  <input type="email" id="cark-email-input" placeholder="E-posta adresiniz" class="carkifelek-input" />
                </div>
              ` : `
                <div class="carkifelek-input-group">
                  <input type="tel" id="cark-phone-input" placeholder="Telefon numaranız" class="carkifelek-input" />
                </div>
              `}

              <button class="carkifelek-spin-btn" id="carkifelek-spin-btn">
                ${widget.buttonText}
              </button>
            </div>

            <div class="carkifelek-result" id="carkifelek-result" style="display: none;">
              <div class="carkifelek-result-content">
                <h3 class="carkifelek-result-title">Tebrikler! 🎉</h3>
                <p class="carkifelek-result-message" id="cark-result-message"></p>
                <div class="carkifelek-coupon" id="cark-coupon-container" style="display: none;">
                  <p class="carkifelek-coupon-label">Kupon Kodunuz:</p>
                  <div class="carkifelek-coupon-code" id="cark-coupon-code"></div>
                </div>
                <a href="#" class="carkifelek-cta-btn" id="cark-cta-btn" target="_blank">
                  Ödülü Al
                </a>
              </div>
            </div>
          </div>
        </div>

        <button class="carkifelek-trigger" id="carkifelek-trigger-btn">
          🎁
        </button>
      </div>
    `;
  }

  function applyWidgetStyles() {
    const style = document.createElement('style');
    const { widget } = widgetData;

    style.textContent = `
      .carkifelek-widget { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      .carkifelek-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99998; }
      .carkifelek-modal {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto;
        background: ${widget.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
        border-radius: 20px; z-index: 99999; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      }
      .carkifelek-close {
        position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
        border: none; background: rgba(255,255,255,0.2); color: white;
        border-radius: 50%; cursor: pointer; font-size: 20px; z-index: 10;
      }
      .carkifelek-header { padding: 30px 20px; text-align: center; color: white; }
      .carkifelek-brand { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px; }
      .carkifelek-logo { height: 40px; width: auto; }
      .carkifelek-title {
        font-size: 24px; font-weight: bold; margin: 0 0 10px;
        color: ${widget.titleColor || '#ffffff'};
      }
      .carkifelek-description {
        font-size: 14px; margin: 0; opacity: 0.9;
        color: ${widget.descriptionColor || '#ffffff'};
      }
      .carkifelek-body { background: white; border-radius: 0 0 20px 20px; padding: 20px; }
      .carkifelek-wheel-container { display: flex; justify-content: center; margin-bottom: 20px; }
      #carkifelek-wheel-canvas canvas { max-width: 100%; height: auto; }
      .carkifelek-input-group { margin-bottom: 15px; }
      .carkifelek-input {
        width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb;
        border-radius: 10px; font-size: 14px; box-sizing: border-box;
      }
      .carkifelek-input:focus { outline: none; border-color: #667eea; }
      .carkifelek-spin-btn {
        width: 100%; padding: 14px; border: none; border-radius: 10px;
        background: ${widget.buttonColor || '#667eea'}; color: white;
        font-size: 16px; font-weight: bold; cursor: pointer;
        transition: transform 0.2s;
      }
      .carkifelek-spin-btn:hover { transform: scale(1.02); }
      .carkifelek-spin-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .carkifelek-result { text-align: center; padding: 20px; }
      .carkifelek-result-title { font-size: 20px; font-weight: bold; color: #10b981; margin-bottom: 10px; }
      .carkifelek-result-message { color: #6b7280; margin-bottom: 15px; }
      .carkifelek-coupon { background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 15px 0; }
      .carkifelek-coupon-label { font-size: 12px; color: #6b7280; margin-bottom: 5px; }
      .carkifelek-coupon-code {
        font-size: 18px; font-weight: bold; color: #667eea;
        letter-spacing: 2px; font-family: monospace;
      }
      .carkifelek-cta-btn {
        display: inline-block; padding: 12px 24px; background: #10b981;
        color: white; text-decoration: none; border-radius: 10px;
        font-weight: bold;
      }
      .carkifelek-trigger {
        position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px;
        border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white; border-radius: 50%; font-size: 28px; cursor: pointer;
        z-index: 99997; box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
      }
      .carkifelek-input-error { border-color: #ef4444 !important; }
    `;

    document.head.appendChild(style);
  }

  function setupEventListeners() {
    document.getElementById('carkifelek-close-btn')?.addEventListener('click', closeWidget);
    document.getElementById('carkifelek-overlay')?.addEventListener('click', closeWidget);
    document.getElementById('carkifelek-spin-btn')?.addEventListener('click', spinWheel);
    document.getElementById('carkifelek-trigger-btn')?.addEventListener('click', openWidget);

    const input = document.getElementById('cark-email-input') || document.getElementById('cark-phone-input');
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        spinWheel();
      }
    });
  }

  function openWidget() {
    const widget = document.getElementById('carkifelek-widget');
    const overlay = document.getElementById('carkifelek-overlay');
    const modal = document.querySelector('.carkifelek-modal');

    widget?.classList.remove('carkifelek-hidden');
    overlay?.classList.remove('carkifelek-hidden');
    modal?.classList.remove('carkifelek-hidden');
  }

  function closeWidget() {
    const widget = document.getElementById('carkifelek-widget');
    const overlay = document.getElementById('carkifelek-overlay');
    const modal = document.querySelector('.carkifelek-modal');

    widget?.classList.add('carkifelek-hidden');
    overlay?.classList.add('carkifelek-hidden');
    modal?.classList.add('carkifelek-hidden');
  }

  // ============================================
  // VALIDATION
  // ============================================

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone) {
    return /^[0-9+\-\s()]{10,}$/.test(phone);
  }

  function showInputError(inputId) {
    const input = document.getElementById(inputId);
    input?.classList.add('carkifelek-input-error');
    setTimeout(() => input?.classList.remove('carkifelek-input-error'), 2000);
  }

  // ============================================
  // RESULTS
  // ============================================

  function showResult(prize, couponCode) {
    const form = document.getElementById('carkifelek-form');
    const result = document.getElementById('carkifelek-result');
    const message = document.getElementById('cark-result-message');
    const couponContainer = document.getElementById('cark-coupon-container');
    const couponCodeEl = document.getElementById('cark-coupon-code');
    const ctaBtn = document.getElementById('cark-cta-btn');

    form.style.display = 'none';
    result.style.display = 'block';

    message.textContent = `${prize.name} kazandınız!`;

    if (couponCode) {
      couponContainer.style.display = 'block';
      couponCodeEl.textContent = couponCode;
    }

    ctaBtn.href = prize.url;
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  function getSessionId() {
    let sessionId = sessionStorage.getItem('cark_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('cark_session_id', sessionId);
    }
    return sessionId;
  }

  function checkPreviousSpin() {
    const hasSpunBefore = localStorage.getItem(`cark_${CONFIG.shopToken}_spun`);
    const savedEmail = localStorage.getItem(`cark_${CONFIG.shopToken}_email`);
    const spinDate = localStorage.getItem(`cark_${CONFIG.shopToken}_date`);

    if (hasSpunBefore === 'true') {
      hasSpun = true;
      sessionEmail = savedEmail;

      if (spinDate) {
        const daysSince = (Date.now() - new Date(spinDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince >= 1) {
          hasSpun = false;
          localStorage.removeItem(`cark_${CONFIG.shopToken}_spun`);
          localStorage.removeItem(`cark_${CONFIG.shopToken}_email`);
          localStorage.removeItem(`cark_${CONFIG.shopToken}_date`);
        }
      }
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
