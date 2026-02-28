/**
 * Çarkıfelek Widget - Premium Design
 * Modern, animated wheel with email capture
 * Version 3.0.0
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
  var shopUuid = null;
  var supabaseClient = null;
  var isInitialized = false;
  var selectedPrize = null;

  // ============================================
  // UTILITIES
  // ============================================

  function log(msg, data) {
    if (console && console.log) {
      console.log('[Çarkıfelek]', msg, data || '');
    }
  }

  function logError(msg, error) {
    if (console && console.error) {
      console.error('[Çarkıfelek]', msg, error || '');
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ============================================
  // SUPABASE SDK LOADER
  // ============================================

  function loadSupabaseSDK(callback) {
    if (window.supabase) {
      try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        log('Supabase client hazır');
        callback(null);
      } catch (err) {
        callback(err);
      }
      return;
    }

    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = function() {
      try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        log('Supabase SDK yüklendi');
        callback(null);
      } catch (err) {
        callback(err);
      }
    };
    script.onerror = function() {
      callback(new Error('SDK yüklenemedi'));
    };
    document.head.appendChild(script);
  }

  // ============================================
  // SUPABASE CALLS
  // ============================================

  function fetchWidgetData(token, callback) {
    if (!supabaseClient) {
      callback(new Error('Supabase client hazır değil'));
      return;
    }

    supabaseClient
      .rpc('get_widget_data', { p_token: token })
      .then(function(result) {
        if (result.error) {
          callback(result.error);
          return;
        }

        if (!result.data || result.data.length === 0) {
          callback(new Error('Veri bulunamadı'));
          return;
        }

        var widget = result.data[0];
        log('Widget verisi yüklendi', widget);

        widgetData = {
          shop: {
            name: widget.shop_name,
            logo: widget.shop_logo,
            url: widget.shop_url,
            brandName: widget.brand_name,
            contactInfoType: widget.contact_info_type
          },
          widget: {
            title: widget.widget_title || '🎁 Şansını Deneme!',
            description: widget.widget_description || 'Çarkı çevir, arma kazan!',
            buttonText: widget.widget_button_text || 'ÇARKI ÇEVİR',
            showOnLoad: widget.widget_show_on_load || false,
            popupDelay: widget.widget_popup_delay || 0,
            backgroundColor: widget.widget_background_color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            buttonColor: widget.widget_button_color || '#f59e0b',
            titleColor: widget.widget_title_color || '#ffffff',
            descriptionColor: widget.widget_description_color || '#f3f4f6'
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
        logError('Email kontrol hatası', err);
        callback(null, false);
      });
  }

  function logSpin(prizeId, email) {
    if (!prizeId || !email) return;

    log('Kaydediliyor:', prizeId, email);

    supabaseClient
      .rpc('log_wheel_spin', {
        p_shop_uuid: shopUuid,
        p_prize_id: prizeId,
        p_email: email,
        p_ip_address: null,
        p_user_agent: navigator.userAgent
      })
      .then(function(result) {
        log('Kayıt başarılı:', result.data);
      })
      .catch(function(err) {
        logError('Kayıt hatası', err);
      });
  }

  function trackWidgetView() {
    if (!shopUuid || !supabaseClient) return;

    supabaseClient.rpc('track_widget_view', {
      p_shop_uuid: shopUuid,
      p_ip_address: null,
      p_user_agent: navigator.userAgent,
      p_referrer: document.referrer
    }).then().catch(function() {});
  }

  // ============================================
  // WHEEL RENDERING
  // ============================================

  function renderWidget() {
    log('Widget render ediliyor...');

    var existing = document.getElementById('carkifelek-widget-container');
    if (existing) existing.remove();

    var container = document.createElement('div');
    container.id = 'carkifelek-widget-container';
    container.innerHTML = buildWidgetHTML();
    document.body.appendChild(container);

    setupEventListeners();
    drawWheel();

    // Animation entry
    setTimeout(function() {
      var widget = document.getElementById('carkifelek-widget');
      if (widget) {
        widget.style.opacity = '1';
        widget.style.transform = 'translateY(0)';
      }
    }, 100);
  }

  function buildWidgetHTML() {
    var colors = widgetData.prizes.map(function(p) { return p.color; });

    return '<div id="carkifelek-widget" style="' + getWidgetStyles() + '">' +
      '<button id="carkifelek-toggle" style="' + getToggleButtonStyles() + '">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<circle cx="12" cy="12" r="10"/>' +
          '<path d="M12 6v6l4 2"/>' +
        '</svg>' +
        '<span style="margin-left: 8px; font-weight: 600;">' + widgetData.widget.buttonText + '</span>' +
      '</button>' +
    '</div>' +
      '<div id="carkifelek-modal" style="' + getModalStyles() + '">' +
        '<div style="' + getModalContentStyles() + '">' +
          '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">' +
            '<div style="' + getHeaderStyles() + '">🎁 ' + widgetData.widget.title.replace(/<br>/g, ' ') + '</div>' +
            '<button id="carkifelek-close" style="' + getCloseButtonStyles() + '">✕</button>' +
          '</div>' +
          '<p style="' + getDescriptionStyles() + '">' + widgetData.widget.description + '</p>' +
          '<div style="position: relative; width: 320px; height: 320px; margin: 20px auto;">' +
            '<canvas id="carkifelek-wheel" width="320" height="320"></canvas>' +
            '<div id="carkifelek-pointer" style="' + getPointerStyles() + '"></div>' +
          '</div>' +
          '<div id="carkifelek-result" style="' + getResultStyles() + '"></div>' +
          '<div id="carkifelek-form" style="' + getFormStyles() + '">' +
            '<div style="display: flex; gap: 10px; margin-bottom: 10px;">' +
              '<input type="email" id="carkifelek-email" placeholder="E-posta adresiniz" style="' + getInputStyles() + '" />' +
            '<button id="carkifelek-spin" style="' + getSpinButtonStyles() + '">ÇEVİR!</button>' +
            '</div>' +
            '<p style="font-size: 11px; color: #9ca3af; text-align: center;">🔒 Verileriniz güvende</p>' +
          '</div>' +
          '<div id="carkifelek-success" style="' + getSuccessStyles() + '">' +
            '<div style="font-size: 48px; margin-bottom: 10px;">🎉</div>' +
            '<div style="font-size: 18px; font-weight: 600; margin-bottom: 5px;">Tebrikler!</div>' +
            '<div id="carkifelek-prize-name" style="font-size: 16px; color: #f59e0b; font-weight: 700;"></div>' +
            '<div id="carkifelek-coupon" style="' + getCouponStyles() + '"></div>' +
            '<button id="carkifelek-close-success" style="' + getCloseSuccessButtonStyles() + '">Kapat</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ============================================
  // STYLES
  // ============================================

  function getWidgetStyles() {
    return 'position: fixed; bottom: 20px; right: 20px; z-index: 999999;' +
           'opacity: 0; transform: translateY(20px); transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);';
  }

  function getToggleButtonStyles() {
    return 'background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);' +
           'color: white; border: none; padding: 14px 24px; border-radius: 50px;' +
           'font-size: 14px; font-weight: 600; cursor: pointer;' +
           'box-shadow: 0 10px 40px rgba(245, 158, 11, 0.4);' +
           'display: flex; align-items: center; transition: all 0.3s ease;' +
           'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';
  }

  function getModalStyles() {
    return 'position: fixed; top: 0; left: 0; right: 0; bottom: 0;' +
           'background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);' +
           'display: none; justify-content: center; align-items: center;' +
           'z-index: 1000000; animation: fadeIn 0.3s ease;';
  }

  function getModalContentStyles() {
    return 'background: ' + widgetData.widget.backgroundColor + ';' +
           'border-radius: 24px; padding: 40px; max-width: 420px; width: 90%;' +
           'box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);' +
           'position: relative; overflow: hidden;' +
           'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';
  }

  function getCloseButtonStyles() {
    return 'background: rgba(255,255,255,0.1); border: none;' +
           'color: #ffffff; width: 36px; height: 36px; border-radius: 50%;' +
           'cursor: pointer; font-size: 18px; display: flex;' +
           'align-items: center; justify-content: center;' +
           'transition: all 0.2s ease;';
  }

  function getHeaderStyles() {
    return 'color: ' + widgetData.widget.titleColor + ';' +
           'font-size: 28px; font-weight: 700;';
  }

  function getDescriptionStyles() {
    return 'color: ' + widgetData.widget.descriptionColor + ';' +
           'font-size: 15px; line-height: 1.5;';
  }

  function getPointerStyles() {
    return 'position: absolute; top: 50%; right: -5px;' +
           'transform: translateY(-50%); width: 0; height: 0;' +
           'border-left: 20px solid #ffffff; border-top: 12px solid transparent;' +
           'border-bottom: 12px solid transparent; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));';
  }

  function getResultStyles() {
    return 'min-height: 24px; margin: 15px 0; color: #f59e0b; font-weight: 600; font-size: 16px;';
  }

  function getFormStyles() {
    return 'margin-top: 10px;';
  }

  function getInputStyles() {
    return 'flex: 1; padding: 14px 16px; border: 2px solid rgba(255,255,255,0.1);' +
           'border-radius: 12px; font-size: 14px; color: #ffffff;' +
           'background: rgba(255,255,255,0.05); outline: none;' +
           'transition: all 0.2s ease; font-family: inherit;';
  }

  function getSpinButtonStyles() {
    return 'background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);' +
           'color: white; border: none; padding: 14px 28px; border-radius: 12px;' +
           'font-size: 15px; font-weight: 700; cursor: pointer;' +
           'box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);' +
           'transition: all 0.3s ease; font-family: inherit;';
  }

  function getSuccessStyles() {
    return 'display: none; text-align: center; padding: 20px;';
  }

  function getCouponStyles() {
    return 'background: rgba(255,255,255,0.1); padding: 12px 20px;' +
           'border-radius: 12px; margin: 20px 0; font-family: monospace;' +
           'font-size: 14px; letter-spacing: 1px; color: #fbbf24;';
  }

  function getCloseSuccessButtonStyles() {
    return 'background: rgba(255,255,255,0.1); border: none;' +
           'color: #ffffff; padding: 12px 30px; border-radius: 12px;' +
           'font-size: 14px; font-weight: 600; cursor: pointer;' +
           'transition: all 0.2s ease; margin-top: 20px;';
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  function setupEventListeners() {
    var toggleBtn = document.getElementById('carkifelek-toggle');
    var modal = document.getElementById('carkifelek-modal');
    var closeBtn = document.getElementById('carkifelek-close');
    var spinBtn = document.getElementById('carkifelek-spin');
    var emailInput = document.getElementById('carkifelek-email');
    var closeSuccessBtn = document.getElementById('carkifelek-close-success');

    if (!toggleBtn || !modal || !closeBtn || !spinBtn || !emailInput) {
      logError('Bazı elementler bulunamadı');
      return;
    }

    toggleBtn.onclick = function() {
      modal.style.display = 'flex';
      resetWidget();
    };

    closeBtn.onclick = function() {
      modal.style.display = 'none';
    };

    spinBtn.onclick = function() {
      var email = emailInput.value.trim();

      if (!email) {
        showResult('Lütfen e-posta adresinizi girin 😊', '#ef4444');
        emailInput.focus();
        return;
      }

      if (!isValidEmail(email)) {
        showResult('Geçerli bir e-posta adresi girin 📧', '#ef4444');
        emailInput.focus();
        return;
      }

      checkEmailUsed(email, function(err, used) {
        if (err) {
          logError('Email kontrol hatası', err);
          return;
        }

        if (used) {
          showResult('Bu e-posta ile zaten çark çevirdiniz! 🔄', '#f59e0b');
          return;
        }

        // Email valid, spin the wheel
        selectedPrize = selectPrize();
        emailInput.disabled = true;
        spinBtn.disabled = true;
        spinBtn.textContent = 'ÇEVİRİLİYOR...';
        spinWheel(selectedPrize, email);
      });
    };

    closeSuccessBtn.onclick = function() {
      modal.style.display = 'none';
    };

    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    };

    // Enter key to spin
    emailInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        spinBtn.click();
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
    var radius = canvas.width / 2 - 15;
    var numPrizes = widgetData.prizes.length;
    var arcSize = (2 * Math.PI) / numPrizes;

    wheelContext.clearRect(0, 0, canvas.width, canvas.height);

    wheelContext.save();
    wheelContext.translate(centerX, centerY);
    wheelContext.rotate(currentRotation * Math.PI / 180);
    wheelContext.translate(-centerX, -centerY);

    // Draw segments
    for (var i = 0; i < numPrizes; i++) {
      var prize = widgetData.prizes[i];
      var startAngle = i * arcSize;
      var endAngle = startAngle + arcSize - 0.08;

      wheelContext.beginPath();
      wheelContext.moveTo(centerX, centerY);
      wheelContext.arc(centerX, centerY, radius, startAngle, endAngle);
      wheelContext.closePath();

      // Create gradient for each segment
      var gradient = wheelContext.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, adjustColor(prize.color, 30));
      gradient.addColorStop(1, prize.color);
      wheelContext.fillStyle = gradient;
      wheelContext.fill();

      // Segment border
      wheelContext.strokeStyle = 'rgba(255,255,255,0.3)';
      wheelContext.lineWidth = 2;
      wheelContext.stroke();
    }

    // Outer glow ring
    wheelContext.beginPath();
    wheelContext.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI);
    wheelContext.strokeStyle = 'rgba(255,255,255,0.3)';
    wheelContext.lineWidth = 10;
    wheelContext.stroke();

    // Center circle
    wheelContext.beginPath();
    wheelContext.arc(centerX, centerY, 40, 0, 2 * Math.PI);
    wheelContext.fillStyle = '#ffffff';
    wheelContext.fill();

    // Center icon
    wheelContext.fillStyle = '#f59e0b';
    wheelContext.font = 'bold 24px Arial';
    wheelContext.textAlign = 'center';
    wheelContext.textBaseline = 'middle';
    wheelContext.fillText('🎁', centerX, centerY);

    wheelContext.restore();
  }

  function adjustColor(color, amount) {
    var hex = color.replace('#', '');
    var r = parseInt(hex.substr(0, 2), 16);
    var g = parseInt(hex.substr(2, 2), 16);
    var b = parseInt(hex.substr(4, 2), 16);

    r = Math.min(255, Math.max(0, r + amount));
    g = Math.min(255, Math.max(0, g + amount));
    b = Math.min(255, Math.max(0, b + amount));

    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function selectPrize() {
    if (!widgetData || !widgetData.prizes) return null;

    var totalChance = 0;
    for (var i = 0; i < widgetData.prizes.length; i++) {
      totalChance += widgetData.prizes[i].chance || 0;
    }

    var random = Math.random() * totalChance;
    for (var j = 0; j < widgetData.prizes.length; j++) {
      random -= widgetData.prizes[j].chance || 0;
      if (random <= 0) {
        return widgetData.prizes[j];
      }
    }

    return widgetData.prizes[0];
  }

  function spinWheel(prize, email) {
    if (isSpinning) return;
    isSpinning = true;

    var prizeIndex = widgetData.prizes.indexOf(prize);
    var numPrizes = widgetData.prizes.length;
    var arcSize = (2 * Math.PI) / numPrizes;
    var prizeAngle = prizeIndex * arcSize + arcSize / 2;

    // Calculate rotation to land on prize
    var targetAngle = 360 * 5 + (360 - prizeAngle * 180 / Math.PI) + 90;
    var duration = 4000;
    var startTime = Date.now();

    function animate() {
      var elapsed = Date.now() - startTime;
      var progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      var easeOut = 1 - Math.pow(1 - progress, 3);
      currentRotation = targetAngle * easeOut;

      drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isSpinning = false;
        showSuccess(prize, email);
      }
    }

    animate();
  }

  function showResult(message, color) {
    var resultEl = document.getElementById('carkifelek-result');
    if (resultEl) {
      resultEl.innerHTML = message;
      resultEl.style.color = color || '#f59e0b';
    }
  }

  function showSuccess(prize, email) {
    var formEl = document.getElementById('carkifelek-form');
    var resultEl = document.getElementById('carkifelek-result');
    var successEl = document.getElementById('carkifelek-success');
    var prizeNameEl = document.getElementById('carkifelek-prize-name');
    var couponEl = document.getElementById('carkifelek-coupon');

    if (formEl) formEl.style.display = 'none';
    if (resultEl) resultEl.style.display = 'none';
    if (successEl) {
      successEl.style.display = 'block';
      successEl.style.animation = 'bounceIn 0.5s ease';
    }

    if (prizeNameEl) {
      prizeNameEl.textContent = prize.name;
    }

    if (couponEl && prize.coupon_codes) {
      couponEl.textContent = '🎟️ Kupon: ' + prize.coupon_codes;
    } else {
      couponEl.style.display = 'none';
    }

    // Log to database
    logSpin(prize.id, email);
  }

  function resetWidget() {
    var formEl = document.getElementById('carkifelek-form');
    var resultEl = document.getElementById('carkifelek-result');
    var successEl = document.getElementById('carkifelek-success');
    var emailInput = document.getElementById('carkifelek-email');
    var spinBtn = document.getElementById('carkifelek-spin');

    if (formEl) {
      formEl.style.display = 'block';
    }
    if (resultEl) {
      resultEl.innerHTML = '';
      resultEl.style.display = 'block';
    }
    if (successEl) {
      successEl.style.display = 'none';
    }
    if (emailInput) {
      emailInput.value = '';
      emailInput.disabled = false;
    }
    if (spinBtn) {
      spinBtn.disabled = false;
      spinBtn.textContent = 'ÇEVİR!';
    }

    currentRotation = 0;
    drawWheel();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function parseTokenAndGetUuid(token) {
    try {
      var padded = token + '==='.slice(0, (4 - token.length % 4) % 4);
      var decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
      var payload = JSON.parse(decoded);
      return payload.uid || null;
    } catch (e) {
      logError('Token parse hatası', e);
      return null;
    }
  }

  function init() {
    if (isInitialized) return;
    isInitialized = true;

    log('Başlatılıyor...');

    var widgetScript = document.getElementById('carkifelek-widget-script');
    if (!widgetScript) {
      logError('Widget script element bulunamadı');
      return;
    }

    var shopToken = widgetScript.getAttribute('data-shop-token') ||
                    widgetScript.getAttribute('data-wheel-id');

    if (!shopToken) {
      logError('Shop token bulunamadı');
      return;
    }

    log('Shop token OK');

    shopUuid = parseTokenAndGetUuid(shopToken);
    if (shopUuid) {
      log('Shop UUID:', shopUuid);
    }

    loadSupabaseSDK(function(err) {
      if (err) {
        logError('Supabase SDK hatası', err);
        return;
      }

      fetchWidgetData(shopToken, function(err, data) {
        if (err) {
          logError('Widget verisi hatası', err);
          return;
        }

        setTimeout(function() {
          renderWidget();
          trackWidgetView();
        }, data.widget.showOnLoad ? data.widget.popupDelay : 0);
      });
    });
  }

  // Add CSS animations
  var style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes bounceIn {
      0% { transform: scale(0.8); opacity: 0; }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); opacity: 1; }
    }
    #carkifelek-widget button:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 15px 50px rgba(245, 158, 11, 0.5) !important;
    }
    #carkifelek-modal button:hover {
      transform: scale(1.05);
    }
    #carkifelek-email:focus {
      border-color: #f59e0b !important;
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
    }
  `;
  document.head.appendChild(style);

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

})();
