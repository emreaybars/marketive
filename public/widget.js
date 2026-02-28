/**
 * Çarkıfelek Widget - Supabase RPC Version
 * No CORS issues! Direct database connection via Supabase
 * Version: 2.0.0 (Stable)
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================

  var SUPABASE_URL = 'https://qiiygcclanmgzlrcpmle.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_Z1ngToRO41r4D179j29cNg_ft2jMY7s';

  // ============================================
  // STATE
  // ============================================

  var widgetData = null;
  var wheelCanvas = null;
  var wheelContext = null;
  var isSpinning = false;
  var currentRotation = 0;
  var hasSpun = false;
  var shopUuid = null;
  var supabaseClient = null;
  var isInitialized = false;

  // ============================================
  // UTILITIES
  // ============================================

  function log(message, data) {
    if (console && console.log) {
      console.log('[Carkifelek]', message, data || '');
    }
  }

  function logError(message, error) {
    if (console && console.error) {
      console.error('[Carkifelek]', message, error || '');
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ============================================
  // SUPABASE SDK LOADER
  // ============================================

  function loadSupabaseSDK(callback) {
    // Check if already loaded
    if (window.supabase) {
      try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        log('Supabase client initialized');
        callback(null);
      } catch (err) {
        callback(err);
      }
      return;
    }

    // Load Supabase SDK from CDN
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = function() {
      try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        log('Supabase SDK loaded and client initialized');
        callback(null);
      } catch (err) {
        callback(err);
      }
    };
    script.onerror = function() {
      callback(new Error('Failed to load Supabase SDK'));
    };
    document.head.appendChild(script);
  }

  // ============================================
  // SUPABASE RPC CALLS
  // ============================================

  function fetchWidgetData(token, callback) {
    if (!supabaseClient) {
      callback(new Error('Supabase client not initialized'));
      return;
    }

    supabaseClient
      .rpc('get_widget_data', {
        p_token: token
      })
      .then(function(result) {
        var data = result.data;
        var error = result.error;

        if (error) {
          callback(error);
          return;
        }

        if (!data || data.length === 0) {
          callback(new Error('No widget data found'));
          return;
        }

        var widget = data[0];
        log('Widget data loaded', widget);

        widgetData = {
          shop: {
            name: widget.shop_name,
            logo: widget.shop_logo,
            url: widget.shop_url,
            brandName: widget.brand_name,
            contactInfoType: widget.contact_info_type
          },
          widget: {
            title: widget.widget_title || 'Şansını Dene!',
            description: widget.widget_description || 'Çarkı çevir ve ödül kazan!',
            buttonText: widget.widget_button_text || 'ÇARKI ÇEVİR',
            showOnLoad: widget.widget_show_on_load || false,
            popupDelay: widget.widget_popup_delay || 0,
            backgroundColor: widget.widget_background_color || 'rgba(139,0,0,0.7)',
            buttonColor: widget.widget_button_color || '#d10000',
            titleColor: widget.widget_title_color || '#ffffff',
            descriptionColor: widget.widget_description_color || '#ffffff'
          },
          prizes: widget.prizes || []
        };

        callback(null, widgetData);
      })
      .catch(function(err) {
        callback(err);
      });
  }

  function checkEmailUsed(email, callback) {
    if (!email || !shopUuid) {
      callback(null, false);
      return;
    }

    supabaseClient
      .rpc('check_email_used', {
        p_shop_uuid: shopUuid,
        p_email: email
      })
      .then(function(result) {
        callback(null, result.data || false);
      })
      .catch(function(err) {
        logError('Check email error', err);
        callback(null, true); // On error, assume used (safer)
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
      .then(function(result) {
        log('Spin logged', result.data);
      })
      .catch(function(err) {
        logError('Log spin error', err);
      });
  }

  function trackWidgetView() {
    if (!shopUuid || !supabaseClient) return;

    // Fire and forget - no need to wait
    supabaseClient.rpc('track_widget_view', {
      p_shop_uuid: shopUuid,
      p_ip_address: null,
      p_user_agent: navigator.userAgent,
      p_referrer: document.referrer
    }).then(function() {
      // Success - silently ignore
    }).catch(function(err) {
      logError('Track view error', err);
    });
  }

  // ============================================
  // WHEEL RENDERING
  // ============================================

  function renderWidget() {
    log('Rendering widget...');

    // Remove existing widget if any
    var existing = document.getElementById('carkifelek-widget-container');
    if (existing) {
      existing.remove();
    }

    // Create widget container
    var container = document.createElement('div');
    container.id = 'carkifelek-widget-container';

    // Build widget HTML
    var html = '<div id="carkifelek-widget" style="position:fixed;bottom:20px;right:20px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;">';
    html += '<button id="carkifelek-toggle" style="background:' + (widgetData.widget.buttonColor || '#d10000') + ';color:white;border:none;padding:12px 24px;border-radius:50px;font-weight:bold;cursor:pointer;font-size:16px;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:transform 0.2s;">';
    html += widgetData.widget.buttonText || 'ÇARKI ÇEVİR';
    html += '</button></div>';

    html += '<div id="carkifelek-modal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:none;justify-content:center;align-items:center;z-index:1000000;">';
    html += '<div style="background:' + (widgetData.widget.backgroundColor || 'rgba(139,0,0,0.7)') + ';border-radius:20px;padding:30px;max-width:400px;width:90%;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.3);">';

    html += '<div style="color:' + (widgetData.widget.titleColor || '#ffffff') + ';font-size:28px;font-weight:bold;margin-bottom:10px;">';
    html += widgetData.widget.title.replace(/<br>/g, ' ');
    html += '</div>';

    html += '<div style="color:' + (widgetData.widget.descriptionColor || '#ffffff') + ';font-size:16px;margin-bottom:30px;">';
    html += widgetData.widget.description;
    html += '</div>';

    html += '<div style="width:300px;height:300px;margin:0 auto;position:relative;">';
    html += '<canvas id="carkifelek-wheel" width="300" height="300" style="border-radius:50%;"></canvas>';
    html += '</div>';

    html += '<div id="carkifelek-prize" style="margin-top:20px;color:' + (widgetData.widget.titleColor || '#ffffff') + ';font-size:18px;font-weight:bold;"></div>';
    html += '<div id="carkifelek-input" style="margin-top:20px;display:none;">';
    html += '<input type="email" id="carkifelek-email" placeholder="E-posta adresiniz" style="width:100%;padding:12px;border:none;border-radius:8px;font-size:14px;box-sizing:border-box;margin-bottom:10px;">';
    html += '<button id="carkifelek-submit" style="width:100%;background:' + (widgetData.widget.buttonColor || '#d10000') + ';color:white;border:none;padding:12px;border-radius:8px;font-weight:bold;cursor:pointer;font-size:16px;">ÖDÜLÜ AL</button>';
    html += '</div>';

    html += '<button id="carkifelek-close" style="margin-top:10px;background:transparent;color:' + (widgetData.widget.titleColor || '#ffffff') + ';border:1px solid rgba(255,255,255,0.3);padding:8px 20px;border-radius:20px;cursor:pointer;font-size:14px;">Kapat</button>';
    html += '</div></div>';

    container.innerHTML = html;
    document.body.appendChild(container);

    // Setup event listeners
    setupEventListeners();
    drawWheel();
  }

  function setupEventListeners() {
    var toggleBtn = document.getElementById('carkifelek-toggle');
    var modal = document.getElementById('carkifelek-modal');
    var closeBtn = document.getElementById('carkifelek-close');
    var submitBtn = document.getElementById('carkifelek-submit');
    var emailInput = document.getElementById('carkifelek-email');

    if (!toggleBtn || !modal || !closeBtn || !submitBtn || !emailInput) {
      logError('Some widget elements not found');
      return;
    }

    toggleBtn.addEventListener('click', function() {
      modal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', function() {
      modal.style.display = 'none';
      resetWidget();
    });

    submitBtn.addEventListener('click', function() {
      var email = emailInput.value.trim();

      if (!email) {
        alert('Lütfen e-posta adresinizi girin.');
        return;
      }

      if (!isValidEmail(email)) {
        alert('Geçerli bir e-posta adresi girin.');
        return;
      }

      checkEmailUsed(email, function(err, used) {
        if (err) {
          logError('Email check error', err);
          return;
        }

        if (used) {
          alert('Bu e-posta adresi ile zaten çark çevirdiniz.');
          return;
        }

        // Select prize and spin
        var prizeId = selectPrize();
        spinWheel(prizeId, email);
      });
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
    var canvas = document.getElementById('carkifelek-wheel');
    if (!canvas || !widgetData || !widgetData.prizes) return;

    wheelCanvas = canvas;
    wheelContext = canvas.getContext('2d');

    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    var radius = canvas.width / 2 - 10;
    var numPrizes = widgetData.prizes.length;
    var arcSize = (2 * Math.PI) / numPrizes;

    // Clear canvas
    wheelContext.clearRect(0, 0, canvas.width, canvas.height);

    // Save context for rotation
    wheelContext.save();
    wheelContext.translate(centerX, centerY);
    wheelContext.rotate(currentRotation * Math.PI / 180);
    wheelContext.translate(-centerX, -centerY);

    // Draw wheel segments
    for (var i = 0; i < numPrizes; i++) {
      var prize = widgetData.prizes[i];
      var startAngle = i * arcSize;
      var endAngle = startAngle + arcSize - 0.05;

      wheelContext.beginPath();
      wheelContext.moveTo(centerX, centerY);
      wheelContext.arc(centerX, centerY, radius, startAngle, endAngle);
      wheelContext.closePath();
      wheelContext.fillStyle = prize.color;
      wheelContext.fill();
      wheelContext.strokeStyle = '#ffffff';
      wheelContext.lineWidth = 2;
      wheelContext.stroke();
    }

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
    if (!widgetData || !widgetData.prizes) return null;

    // Weighted random selection based on prize chances
    var totalChance = 0;
    for (var i = 0; i < widgetData.prizes.length; i++) {
      totalChance += widgetData.prizes[i].chance || 0;
    }

    var random = Math.random() * totalChance;
    for (var j = 0; j < widgetData.prizes.length; j++) {
      random -= widgetData.prizes[j].chance || 0;
      if (random <= 0) {
        return widgetData.prizes[j].id;
      }
    }

    return widgetData.prizes[0] ? widgetData.prizes[0].id : null;
  }

  function spinWheel(prizeId, email) {
    if (isSpinning) return;
    if (!widgetData || !widgetData.prizes) return;

    isSpinning = true;

    // Find prize
    var prize = null;
    for (var i = 0; i < widgetData.prizes.length; i++) {
      if (widgetData.prizes[i].id === prizeId) {
        prize = widgetData.prizes[i];
        break;
      }
    }

    var targetRotation = 360 * 3 + Math.floor(Math.random() * 360);
    var duration = 3000 + Math.random() * 2000;
    var startTime = Date.now();

    function animate() {
      var elapsed = Date.now() - startTime;
      var progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      var easeOut = 1 - Math.pow(1 - progress, 3);
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
    var prizeEl = document.getElementById('carkifelek-prize');
    if (prizeEl && prize) {
      prizeEl.innerHTML = '🎉 ' + prize.name + ' kazandınız!';
    }
  }

  function resetWidget() {
    var prizeEl = document.getElementById('carkifelek-prize');
    var inputDiv = document.getElementById('carkifelek-input');
    var emailInput = document.getElementById('carkifelek-email');

    if (prizeEl) prizeEl.innerHTML = '';
    if (inputDiv) inputDiv.style.display = 'none';
    if (emailInput) emailInput.value = '';
    hasSpun = false;
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function parseTokenAndGetUuid(token) {
    try {
      // Decode base64url token
      var padded = token + '==='.slice(0, (4 - token.length % 4) % 4);
      var decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
      var payload = JSON.parse(decoded);
      return payload.uid || null;
    } catch (e) {
      logError('Token parse error', e);
      return null;
    }
  }

  function init() {
    if (isInitialized) return;
    isInitialized = true;

    log('Initializing...');

    var widgetScript = document.getElementById('carkifelek-widget-script');
    if (!widgetScript) {
      logError('Widget script element not found');
      return;
    }

    var shopToken = widgetScript.getAttribute('data-shop-token') ||
                    widgetScript.getAttribute('data-wheel-id');

    if (!shopToken) {
      logError('Shop token not found');
      return;
    }

    log('Shop token found');

    // Parse shop UUID from token
    shopUuid = parseTokenAndGetUuid(shopToken);
    if (shopUuid) {
      log('Shop UUID extracted', shopUuid);
    }

    // Load Supabase SDK then fetch data
    loadSupabaseSDK(function(err) {
      if (err) {
        logError('Failed to load Supabase SDK', err);
        return;
      }

      fetchWidgetData(shopToken, function(err, data) {
        if (err) {
          logError('Failed to fetch widget data', err);
          return;
        }

        // Render widget after delay if configured
        var delay = data && data.widget && data.widget.showOnLoad ?
                    (data.widget.popupDelay || 0) : 0;

        setTimeout(function() {
          renderWidget();
          trackWidgetView();
        }, delay);
      });
    });
  }

  // ============================================
  // START
  // ============================================

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Small delay to ensure page is fully loaded
    setTimeout(init, 100);
  }

})();
