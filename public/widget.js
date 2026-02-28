/**
 * Çarkıfelek Widget - Supabase RPC Version
 * No CORS issues! Direct database connection via Supabase
 */

(function() {
  'use strict';

  // Supabase configuration
  const SUPABASE_URL = 'https://qiiygcclanmgzlrcpmle.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpaXlnY2NsYW5tZ3pscmNwbWxlIiwicm9sZSI6ImFub24iLCJleHAiOjE5MjAxMjM3NzQ5LCJpYXQiOiIxNzIyMjM3NzQ1In0.G1xXyL-3nXb04y_WtQCJR7tKQmGbIeY-aDmCGFdpnWPA';

  // State
  let widgetData = null;
  let wheelCanvas = null;
  let wheelContext = null;
  let isSpinning = false;
  let currentRotation = 0;
  let hasSpun = false;
  let shopUuid = null;
  let supabaseClient = null;

  // ============================================
  // LOAD SUPABASE SDK
  // ============================================

  function loadSupabaseSDK(callback) {
    // Check if already loaded
    if (window.supabase) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      callback();
      return;
    }

    // Load Supabase SDK from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = function() {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      callback();
    };
    script.onerror = function() {
      console.error('Failed to load Supabase SDK');
    };
    document.head.appendChild(script);
  }

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

    const shopToken = widgetScript.getAttribute('data-shop-token') || widgetScript.getAttribute('data-wheel-id');
    console.log('📝 Shop token:', shopToken ? 'found' : 'NOT FOUND');

    if (!shopToken) {
      console.error('❌ Shop token not provided');
      return;
    }

    // Extract shop UUID from token for later use
    try {
      const parts = shopToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        shopUuid = payload.uid || null;
        console.log('🔑 Shop UUID:', shopUuid);
      }
    } catch (e) {
      console.warn('Could not parse shop UUID from token');
    }

    // Load Supabase SDK first, then fetch data
    loadSupabaseSDK(function() {
      fetchWidgetData(shopToken);
      trackWidgetView(shopToken);
    });
  }

  // ============================================
  // SUPABASE RPC CALLS
  // ============================================

  function fetchWidgetData(token) {
    supabaseClient
      .rpc('get_widget_data', {
        p_token: token
      })
      .then(({ data, error }) => {
        if (error) {
          console.error('RPC Error:', error);
          return;
        }

        if (!data || data.length === 0) {
          console.error('No widget data found');
          return;
        }

        const widget = data[0];
        console.log('✅ Widget data loaded:', widget);

        widgetData = {
          shop: {
            name: widget.shop_name,
            logo: widget.shop_logo,
            url: widget.shop_url,
            brandName: widget.brand_name,
            contactInfoType: widget.contact_info_type
          },
          widget: {
            title: widget.widget_title,
            description: widget.widget_description,
            buttonText: widget.widget_button_text,
            showOnLoad: widget.widget_show_on_load,
            popupDelay: widget.widget_popup_delay,
            backgroundColor: widget.widget_background_color,
            buttonColor: widget.widget_button_color,
            titleColor: widget.widget_title_color,
            descriptionColor: widget.widget_description_color
          },
          prizes: widget.prizes || []
        };

        // Render widget after data is loaded
        setTimeout(() => {
          renderWidget();
        }, widgetData.widget.showOnLoad ? widgetData.widget.popupDelay : 0);
      })
      .catch(err => {
        console.error('Failed to fetch widget data:', err);
      });
  }

  function checkEmailUsed(email) {
    if (!email || !shopUuid) return Promise.resolve(false);

    return supabaseClient
      .rpc('check_email_used', {
        p_shop_uuid: shopUuid,
        p_email: email
      })
      .then(({ data }) => data || false)
      .catch(err => {
        console.error('Check email error:', err);
        return true;
      });
  }

  function logSpin(prizeId, email) {
    if (!prizeId) return;

    supabaseClient
      .rpc('log_wheel_spin', {
        p_shop_uuid: shopUuid,
        p_prize_id: prizeId,
        p_email: email,
        p_ip_address: null,
        p_user_agent: navigator.userAgent
      })
      .then(({ data }) => {
        console.log('✅ Spin logged:', data);
      })
      .catch(err => {
        console.error('Log spin error:', err);
      });
  }

  function trackWidgetView(token) {
    supabaseClient
      .rpc('track_widget_view', {
        p_shop_uuid: shopUuid || '00000000-0000-0000-0000-000000000000',
        p_ip_address: null,
        p_user_agent: navigator.userAgent,
        p_referrer: document.referrer
      })
      .catch(err => {
        console.error('Track view error:', err);
      });
  }

  // ============================================
  // WHEEL RENDERING
  // ============================================

  function renderWidget() {
    console.log('🎨 Rendering widget...');

    // Remove existing widget if any
    const existing = document.getElementById('carkifelek-widget-container');
    if (existing) {
      existing.remove();
    }

    // Create widget container
    const container = document.createElement('div');
    container.id = 'carkifelek-widget-container';
    container.innerHTML = `
      <div id="carkifelek-widget" style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <button id="carkifelek-toggle" style="
          background: ${widgetData.widget.buttonColor || '#d10000'};
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 50px;
          font-weight: bold;
          cursor: pointer;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: transform 0.2s;
        ">
          ${widgetData.widget.buttonText || 'ÇARKI ÇEVİR'}
        </button>
      </div>

      <div id="carkifelek-modal" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      ">
        <div style="
          background: ${widgetData.widget.backgroundColor || 'rgba(139,0,0,0.7)'};
          border-radius: 20px;
          padding: 30px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        ">
          <div style="
            color: ${widgetData.widget.titleColor || '#ffffff'};
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          ">
            ${widgetData.widget.title.replace(/<br>/g, ' ')}
          </div>
          <div style="
            color: ${widgetData.widget.descriptionColor || '#ffffff'};
            font-size: 16px;
            margin-bottom: 30px;
          ">
            ${widgetData.widget.description}
          </div>
          <div style="
            width: 300px;
            height: 300px;
            margin: 0 auto;
            position: relative;
          ">
            <canvas id="carkifelek-wheel" width="300" height="300" style="
              border-radius: 50%;
            "></canvas>
          </div>
          <div id="carkifelek-prize" style="
            margin-top: 20px;
            color: ${widgetData.widget.titleColor || '#ffffff'};
            font-size: 18px;
            font-weight: bold;
          "></div>
          <div id="carkifelek-input" style="
            margin-top: 20px;
            display: none;
          ">
            <input type="email" id="carkifelek-email" placeholder="E-posta adresiniz" style="
              width: 100%;
              padding: 12px;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              box-sizing: border-box;
              margin-bottom: 10px;
            ">
            <button id="carkifelek-submit" style="
              width: 100%;
              background: ${widgetData.widget.buttonColor || '#d10000'};
              color: white;
              border: none;
              padding: 12px;
              border-radius: 8px;
              font-weight: bold;
              cursor: pointer;
              font-size: 16px;
            ">
              ÖDÜLÜ AL
            </button>
          </div>
          <button id="carkifelek-close" style="
            margin-top: 10px;
            background: transparent;
            color: ${widgetData.widget.titleColor || '#ffffff'};
            border: 1px solid rgba(255,255,255,0.3);
            padding: 8px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
          ">
            Kapat
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Setup event listeners
    setupEventListeners();
    drawWheel();
  }

  function setupEventListeners() {
    const toggleBtn = document.getElementById('carkifelek-toggle');
    const modal = document.getElementById('carkifelek-modal');
    const closeBtn = document.getElementById('carkifelek-close');
    const submitBtn = document.getElementById('carkifelek-submit');
    const emailInput = document.getElementById('carkifelek-email');

    toggleBtn.addEventListener('click', function() {
      modal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', function() {
      modal.style.display = 'none';
      resetWidget();
    });

    submitBtn.addEventListener('click', async function() {
      const email = emailInput.value.trim();
      if (!email) {
        alert('Lütfen e-posta adresinizi girin.');
        return;
      }

      if (!isValidEmail(email)) {
        alert('Geçerli bir e-posta adresi girin.');
        return;
      }

      const alreadyUsed = await checkEmailUsed(email);
      if (alreadyUsed) {
        alert('Bu e-posta adresi ile zaten çark çevirdiniz.');
        return;
      }

      // Select prize and spin
      const prizeId = selectPrize();
      spinWheel(prizeId, email);
    });

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
        resetWidget();
      }
    });
  }

  // ============================================
  // WHEEL LOGIC
  // ============================================

  function drawWheel() {
    const canvas = document.getElementById('carkifelek-wheel');
    if (!canvas) return;

    wheelCanvas = canvas;
    wheelContext = canvas.getContext('2d');

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;
    const numPrizes = widgetData.prizes.length;
    const arcSize = (2 * Math.PI) / numPrizes;

    // Clear and save context
    wheelContext.clearRect(0, 0, canvas.width, canvas.height);
    wheelContext.save();
    wheelContext.translate(centerX, centerY);
    wheelContext.rotate(currentRotation * Math.PI / 180);
    wheelContext.translate(-centerX, -centerY);

    // Draw wheel segments
    widgetData.prizes.forEach(function(prize, index) {
      const startAngle = index * arcSize;
      const endAngle = startAngle + arcSize - 0.05;

      wheelContext.beginPath();
      wheelContext.moveTo(centerX, centerY);
      wheelContext.arc(centerX, centerY, radius, startAngle, endAngle);
      wheelContext.closePath();
      wheelContext.fillStyle = prize.color;
      wheelContext.fill();
      wheelContext.stroke();
    });

    // Draw center circle
    wheelContext.beginPath();
    wheelContext.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    wheelContext.fillStyle = '#ffffff';
    wheelContext.fill();

    wheelContext.restore();

    // Draw pointer (not rotated)
    wheelContext.beginPath();
    wheelContext.moveTo(centerX + radius - 10, centerY);
    wheelContext.lineTo(centerX + radius + 10, centerY - 5);
    wheelContext.lineTo(centerX + radius + 10, centerY + 5);
    wheelContext.closePath();
    wheelContext.fillStyle = '#ffffff';
    wheelContext.fill();
  }

  function selectPrize() {
    // Weighted random selection based on prize chances
    const totalChance = widgetData.prizes.reduce(function(sum, prize) {
      return sum + prize.chance;
    }, 0);
    let random = Math.random() * totalChance;

    for (const prize of widgetData.prizes) {
      random -= prize.chance;
      if (random <= 0) {
        return prize.id;
      }
    }

    return widgetData.prizes[0].id;
  }

  function spinWheel(prizeId, email) {
    if (isSpinning) return;

    isSpinning = true;
    const prize = widgetData.prizes.find(function(p) {
      return p.id === prizeId;
    });
    const targetRotation = 360 * 3 + Math.floor(Math.random() * 360);
    const duration = 3000 + Math.random() * 2000;
    const startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      currentRotation = targetRotation * easeOut;

      drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isSpinning = false;
        showPrize(prize);
        logSpin(prizeId, email);
      }
    }

    animate();
  }

  function showPrize(prize) {
    const prizeEl = document.getElementById('carkifelek-prize');
    prizeEl.innerHTML = '🎉 ' + prize.name + ' kazandınız!';
  }

  function resetWidget() {
    const prizeEl = document.getElementById('carkifelek-prize');
    const inputDiv = document.getElementById('carkifelek-input');
    const emailInput = document.getElementById('carkifelek-email');

    if (prizeEl) prizeEl.innerHTML = '';
    if (inputDiv) inputDiv.style.display = 'none';
    if (emailInput) emailInput.value = '';
    hasSpun = false;
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ============================================
  // START WIDGET
  // ============================================

  // Defer initialization to ensure DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
