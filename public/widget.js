/**
 * Çarkıfelek Widget - Premium Redesign
 * Modern wheel with visible prize names, gradients, and smooth animations
 * Version 4.0.0
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

  function isValidPhone(phone) {
    var cleaned = phone.replace(/\s/g, '').replace(/\(/g, '').replace(/\)/g, '').replace(/-/g, '');
    return /^(\+?90|0)?5\d{9}$/.test(cleaned);
  }

  function formatPhone(phone) {
    var cleaned = phone.replace(/\s/g, '').replace(/\(/g, '').replace(/\)/g, '').replace(/-/g, '');
    if (cleaned.startsWith('90')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('+90')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    return '5' + cleaned.substring(1);
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
            contactInfoType: widget.contact_info_type || 'email'
          },
          widget: {
            title: widget.widget_title || '🎁 Şansını Deneme!',
            description: widget.widget_description || 'Çarkı çevir, arma kazan!',
            buttonText: widget.widget_button_text || 'ÇARKI ÇEVİR',
            showOnLoad: widget.widget_show_on_load || false,
            popupDelay: widget.widget_popup_delay || 0,
            backgroundColor: widget.widget_background_color || 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            buttonColor: widget.widget_button_color || '#f59e0b',
            titleColor: widget.widget_title_color || '#ffffff',
            descriptionColor: widget.widget_description_color || '#a0aec0'
          },
          prizes: widget.prizes || []
        };

        callback(null, widgetData);
      })
      .catch(function(err) {
        callback(err);
      });
  }

  function checkContactUsed(contact, callback) {
    if (!contact || !shopUuid) {
      callback(null, false);
      return;
    }

    var contactType = widgetData.shop.contactInfoType;

    supabaseClient
      .rpc('check_contact_used', {
        p_shop_uuid: shopUuid,
        p_contact: contact,
        p_contact_type: contactType
      })
      .then(function(result) {
        callback(null, result.data || false);
      })
      .catch(function(err) {
        logError('İletişim kontrol hatası', err);
        callback(null, false);
      });
  }

  function logSpin(prizeId, fullName, contact) {
    if (!prizeId || !contact) return;

    log('Kaydediliyor:', prizeId, fullName, contact);

    var contactType = widgetData.shop.contactInfoType;
    var params = {
      p_shop_uuid: shopUuid,
      p_prize_id: prizeId,
      p_full_name: fullName,
      p_ip_address: null,
      p_user_agent: navigator.userAgent
    };

    if (contactType === 'email') {
      params.p_email = contact;
    } else {
      params.p_phone = contact;
    }

    supabaseClient
      .rpc('log_wheel_spin', params)
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
  // WHEEL RENDERING - PREMIUM DESIGN
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
    var isPhone = widgetData.shop.contactInfoType === 'phone';
    var inputPlaceholder = isPhone ? 'Telefon numaranız (5XX XXX XX XX)' : 'E-posta adresiniz';
    var inputType = isPhone ? 'tel' : 'email';
    var inputId = isPhone ? 'carkifelek-phone' : 'carkifelek-email';

    return '<div id="carkifelek-widget" style="' + getWidgetStyles() + '">' +
      '<button id="carkifelek-toggle" style="' + getToggleButtonStyles() + '">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
          '<circle cx="12" cy="12" r="10"/>' +
          '<path d="M12 6v6l4 2"/>' +
        '</svg>' +
        '<span style="margin-left: 10px; font-weight: 700; letter-spacing: 0.5px;">' + widgetData.widget.buttonText + '</span>' +
      '</button>' +
    '</div>' +
      '<div id="carkifelek-modal" style="' + getModalStyles() + '">' +
        '<div style="' + getModalContentStyles() + '">' +
          '<button id="carkifelek-close" style="' + getCloseButtonStyles() + '">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
              '<path d="M18 6L6 18M6 6l12 12"/>' +
            '</svg>' +
          '</button>' +
          '<h2 style="' + getTitleStyles() + '">' + widgetData.widget.title + '</h2>' +
          '<p style="' + getDescriptionStyles() + '">' + widgetData.widget.description + '</p>' +
          '<div style="position: relative; width: 340px; height: 340px; margin: 30px auto;">' +
            '<div id="carkifelek-wheel-glow" style="' + getWheelGlowStyles() + '"></div>' +
            '<canvas id="carkifelek-wheel" width="340" height="340"></canvas>' +
            '<div id="carkifelek-center" style="' + getCenterStyles() + '">🎁</div>' +
            '<div id="carkifelek-pointer" style="' + getPointerStyles() + '"></div>' +
          '</div>' +
          '<div id="carkifelek-result" style="' + getResultStyles() + '"></div>' +
          '<div id="carkifelek-form" style="' + getFormStyles() + '">' +
            '<div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px;">' +
              '<input type="text" id="carkifelek-fullname" placeholder="Ad Soyad" style="' + getInputStyles() + '" />' +
              '<input type="' + inputType + '" id="' + inputId + '" placeholder="' + inputPlaceholder + '" style="' + getInputStyles() + '" />' +
            '<button id="carkifelek-spin" style="' + getSpinButtonStyles() + '">' +
              '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 8px;">' +
                '<path d="M21 12a9 9 0 11-6.21-17.67"/>' +
                '<path d="M21 3v9h-9"/>' +
              '</svg>' +
              'ÇEVİR!' +
            '</button>' +
            '</div>' +
            '<p style="font-size: 11px; color: #718096; text-align: center; font-weight: 500;">🔒 Verileriniz güvende</p>' +
          '</div>' +
          '<div id="carkifelek-success" style="' + getSuccessStyles() + '">' +
            '<div style="font-size: 64px; margin-bottom: 16px; animation: bounceIn 0.6s ease;">🎉</div>' +
            '<h3 style="font-size: 24px; font-weight: 800; margin-bottom: 8px; background: linear-gradient(135deg, #f59e0b, #ef4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">TEBRİKLER!</h3>' +
            '<div id="carkifelek-prize-name" style="font-size: 18px; color: #f59e0b; font-weight: 700; margin-bottom: 16px;"></div>' +
            '<div id="carkifelek-coupon" style="' + getCouponStyles() + '"></div>' +
            '<button id="carkifelek-close-success" style="' + getCloseSuccessButtonStyles() + '">Kapat</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ============================================
  // STYLES - PREMIUM AESTHETICS
  // ============================================

  function getWidgetStyles() {
    return 'position: fixed; bottom: 24px; right: 24px; z-index: 999999;' +
           'opacity: 0; transform: translateY(30px); transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);';
  }

  function getToggleButtonStyles() {
    return 'background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);' +
           'color: white; border: none; padding: 16px 28px; border-radius: 60px;' +
           'font-size: 14px; font-weight: 700; cursor: pointer;' +
           'box-shadow: 0 12px 48px rgba(245, 158, 11, 0.5), 0 0 0 0 rgba(245, 158, 11, 0.4);' +
           'display: flex; align-items: center; transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);' +
           'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;' +
           'text-transform: uppercase; letter-spacing: 1px;';
  }

  function getModalStyles() {
    return 'position: fixed; top: 0; left: 0; right: 0; bottom: 0;' +
           'background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);' +
           'display: none; justify-content: center; align-items: center;' +
           'z-index: 1000000; animation: fadeIn 0.4s ease;';
  }

  function getModalContentStyles() {
    return 'background: ' + widgetData.widget.backgroundColor + ';' +
           'border-radius: 32px; padding: 48px 40px; max-width: 460px; width: 90%;' +
           'box-shadow: 0 32px 64px -16px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1);' +
           'position: relative; overflow: hidden;' +
           'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';
  }

  function getCloseButtonStyles() {
    return 'position: absolute; top: 20px; right: 20px;' +
           'background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);' +
           'color: #ffffff; width: 44px; height: 44px; border-radius: 14px;' +
           'cursor: pointer; display: flex; align-items: center; justify-content: center;' +
           'transition: all 0.2s ease; opacity: 0.7;';
  }

  function getTitleStyles() {
    return 'color: ' + widgetData.widget.titleColor + ';' +
           'font-size: 32px; font-weight: 900; text-align: center;' +
           'margin: 0 0 16px 0; letter-spacing: -0.5px; line-height: 1.2;';
  }

  function getDescriptionStyles() {
    return 'color: ' + widgetData.widget.descriptionColor + ';' +
           'font-size: 16px; line-height: 1.6; text-align: center;' +
           'margin: 0 0 20px 0; font-weight: 500;';
  }

  function getWheelGlowStyles() {
    return 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);' +
           'width: 320px; height: 320px; border-radius: 50%;' +
           'background: radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%);' +
           'pointer-events: none;';
  }

  function getPointerStyles() {
    return 'position: absolute; top: 50%; right: -16px;' +
           'transform: translateY(-50%); width: 0; height: 0;' +
           'border-left: 28px solid #ffffff; border-top: 16px solid transparent;' +
           'border-bottom: 16px solid transparent;' +
           'filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));' +
           'z-index: 10;';
  }

  function getCenterStyles() {
    return 'position: absolute; top: 50%; left: 50%;' +
           'transform: translate(-50%, -50%);' +
           'width: 80px; height: 80px; border-radius: 50%;' +
           'background: linear-gradient(135deg, #ffffff 0%, #f7fafc 100%);' +
           'display: flex; align-items: center; justify-content: center;' +
           'font-size: 36px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 -2px 8px rgba(0,0,0,0.1);' +
           'z-index: 5;';
  }

  function getResultStyles() {
    return 'min-height: 28px; margin: 20px 0; color: #f59e0b; font-weight: 700;' +
           'font-size: 16px; text-align: center;';
  }

  function getFormStyles() {
    return 'margin-top: 24px;';
  }

  function getInputStyles() {
    return 'width: 100%; padding: 16px 20px; border: 2px solid rgba(255,255,255,0.1);' +
           'border-radius: 16px; font-size: 15px; color: #ffffff;' +
           'background: rgba(255,255,255,0.05); outline: none;' +
           'transition: all 0.2s ease; font-family: inherit; font-weight: 500;';
  }

  function getSpinButtonStyles() {
    return 'background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);' +
           'color: white; border: none; padding: 18px 32px; border-radius: 16px;' +
           'font-size: 16px; font-weight: 800; cursor: pointer; display: flex;' +
           'align-items: center; justify-content: center;' +
           'box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);' +
           'transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1); font-family: inherit;' +
           'text-transform: uppercase; letter-spacing: 1px;';
  }

  function getSuccessStyles() {
    return 'display: none; text-align: center; padding: 24px;';
  }

  function getCouponStyles() {
    return 'background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%);' +
           'padding: 16px 24px; border-radius: 16px; margin: 20px 0;' +
           'font-family: "SF Mono", "Monaco", "Inconsolata", monospace;' +
           'font-size: 15px; letter-spacing: 1px; color: #fbbf24;' +
           'border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 600;';
  }

  function getCloseSuccessButtonStyles() {
    return 'background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);' +
           'color: #ffffff; padding: 14px 36px; border-radius: 14px;' +
           'font-size: 15px; font-weight: 700; cursor: pointer;' +
           'transition: all 0.2s ease; margin-top: 24px; text-transform: uppercase; letter-spacing: 1px;';
  }

  // ============================================
  // WHEEL DRAWING WITH PRIZE NAMES
  // ============================================

  function drawWheel() {
    var canvas = document.getElementById('carkifelek-wheel');
    if (!canvas || !widgetData || !widgetData.prizes) return;

    wheelCanvas = canvas;
    wheelContext = canvas.getContext('2d');

    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    var radius = canvas.width / 2 - 20;
    var numPrizes = widgetData.prizes.length;
    var arcSize = (2 * Math.PI) / numPrizes;

    // Clear canvas
    wheelContext.clearRect(0, 0, canvas.width, canvas.height);

    // Save context for rotation
    wheelContext.save();
    wheelContext.translate(centerX, centerY);
    wheelContext.rotate(currentRotation * Math.PI / 180);
    wheelContext.translate(-centerX, -centerY);

    // Draw segments
    for (var i = 0; i < numPrizes; i++) {
      var prize = widgetData.prizes[i];
      var startAngle = i * arcSize;
      var endAngle = startAngle + arcSize - 0.06;

      // Draw segment path
      wheelContext.beginPath();
      wheelContext.moveTo(centerX, centerY);
      wheelContext.arc(centerX, centerY, radius, startAngle, endAngle);
      wheelContext.closePath();

      // Create gradient for segment
      var gradient = wheelContext.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, lightenColor(prize.color, 25));
      gradient.addColorStop(0.7, prize.color);
      gradient.addColorStop(1, darkenColor(prize.color, 15));
      wheelContext.fillStyle = gradient;
      wheelContext.fill();

      // Segment border
      wheelContext.strokeStyle = 'rgba(255,255,255,0.3)';
      wheelContext.lineWidth = 2;
      wheelContext.stroke();

      // Draw prize name
      drawPrizeName(prize.name, startAngle, endAngle, centerX, centerY, radius, prize.color);
    }

    // Outer ring with gradient
    wheelContext.beginPath();
    wheelContext.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
    var ringGradient = wheelContext.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
    ringGradient.addColorStop(0, '#f59e0b');
    ringGradient.addColorStop(0.5, '#ef4444');
    ringGradient.addColorStop(1, '#f59e0b');
    wheelContext.strokeStyle = ringGradient;
    wheelContext.lineWidth = 12;
    wheelContext.stroke();

    // Inner decorative ring
    wheelContext.beginPath();
    wheelContext.arc(centerX, centerY, 60, 0, 2 * Math.PI);
    wheelContext.strokeStyle = 'rgba(255,255,255,0.2)';
    wheelContext.lineWidth = 2;
    wheelContext.stroke();

    wheelContext.restore();
  }

  function drawPrizeName(name, startAngle, endAngle, centerX, centerY, radius, color) {
    var midAngle = startAngle + (endAngle - startAngle) / 2;
    var textRadius = radius * 0.68;

    var textX = centerX + Math.cos(midAngle) * textRadius;
    var textY = centerY + Math.sin(midAngle) * textRadius;

    wheelContext.save();
    wheelContext.translate(textX, textY);
    wheelContext.rotate(midAngle + Math.PI / 2);

    // Text shadow for readability
    wheelContext.shadowColor = 'rgba(0,0,0,0.8)';
    wheelContext.shadowBlur = 8;
    wheelContext.shadowOffsetX = 0;
    wheelContext.shadowOffsetY = 2;

    // Font settings
    wheelContext.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    wheelContext.textAlign = 'center';
    wheelContext.textBaseline = 'middle';

    // Text color based on segment brightness
    var brightness = getBrightness(color);
    wheelContext.fillStyle = brightness > 128 ? '#1a1a2e' : '#ffffff';

    // Truncate long names
    var maxLength = 18;
    var displayName = name.length > maxLength ? name.substring(0, maxLength - 2) + '...' : name;

    wheelContext.fillText(displayName, 0, 0);
    wheelContext.restore();
  }

  function lightenColor(color, percent) {
    var hex = color.replace('#', '');
    var r = parseInt(hex.substr(0, 2), 16);
    var g = parseInt(hex.substr(2, 2), 16);
    var b = parseInt(hex.substr(4, 2), 16);

    r = Math.min(255, Math.floor(r + (255 - r) * percent / 100));
    g = Math.min(255, Math.floor(g + (255 - g) * percent / 100));
    b = Math.min(255, Math.floor(b + (255 - b) * percent / 100));

    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function darkenColor(color, percent) {
    var hex = color.replace('#', '');
    var r = parseInt(hex.substr(0, 2), 16);
    var g = parseInt(hex.substr(2, 2), 16);
    var b = parseInt(hex.substr(4, 2), 16);

    r = Math.max(0, Math.floor(r * (1 - percent / 100)));
    g = Math.max(0, Math.floor(g * (1 - percent / 100)));
    b = Math.max(0, Math.floor(b * (1 - percent / 100)));

    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function getBrightness(color) {
    var hex = color.replace('#', '');
    var r = parseInt(hex.substr(0, 2), 16);
    var g = parseInt(hex.substr(2, 2), 16);
    var b = parseInt(hex.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  }

  // ============================================
  // WHEEL LOGIC
  // ============================================

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

  function spinWheel(prize, fullName, contact) {
    if (isSpinning) return;
    isSpinning = true;

    var prizeIndex = widgetData.prizes.indexOf(prize);
    var numPrizes = widgetData.prizes.length;
    var arcSize = (2 * Math.PI) / numPrizes;
    var prizeAngle = prizeIndex * arcSize + arcSize / 2;

    // Calculate rotation to land on prize
    var targetAngle = 360 * 6 + (360 - prizeAngle * 180 / Math.PI) + 90;
    var duration = 5000;
    var startTime = Date.now();

    function animate() {
      var elapsed = Date.now() - startTime;
      var progress = Math.min(elapsed / duration, 1);

      // Ease out quart
      var easeOut = 1 - Math.pow(1 - progress, 4);
      currentRotation = targetAngle * easeOut;

      drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isSpinning = false;
        showSuccess(prize, fullName, contact);
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

  function showSuccess(prize, fullName, contact) {
    var formEl = document.getElementById('carkifelek-form');
    var resultEl = document.getElementById('carkifelek-result');
    var successEl = document.getElementById('carkifelek-success');
    var prizeNameEl = document.getElementById('carkifelek-prize-name');
    var couponEl = document.getElementById('carkifelek-coupon');

    if (formEl) formEl.style.display = 'none';
    if (resultEl) resultEl.style.display = 'none';
    if (successEl) {
      successEl.style.display = 'block';
    }

    if (prizeNameEl) {
      prizeNameEl.textContent = prize.name;
    }

    if (couponEl && prize.coupon_codes) {
      couponEl.textContent = '🎟️ KOD: ' + prize.coupon_codes;
      couponEl.style.display = 'block';
    } else {
      couponEl.style.display = 'none';
    }

    logSpin(prize.id, fullName, contact);
  }

  function resetWidget() {
    var formEl = document.getElementById('carkifelek-form');
    var resultEl = document.getElementById('carkifelek-result');
    var successEl = document.getElementById('carkifelek-success');
    var fullNameInput = document.getElementById('carkifelek-fullname');
    var isPhone = widgetData.shop.contactInfoType === 'phone';
    var inputId = isPhone ? 'carkifelek-phone' : 'carkifelek-email';
    var contactInput = document.getElementById(inputId);
    var spinBtn = document.getElementById('carkifelek-spin');

    if (formEl) formEl.style.display = 'block';
    if (resultEl) {
      resultEl.innerHTML = '';
      resultEl.style.display = 'block';
    }
    if (successEl) successEl.style.display = 'none';
    if (fullNameInput) {
      fullNameInput.value = '';
      fullNameInput.disabled = false;
    }
    if (contactInput) {
      contactInput.value = '';
      contactInput.disabled = false;
    }
    if (spinBtn) {
      spinBtn.disabled = false;
      spinBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 8px;"><path d="M21 12a9 9 0 11-6.21-17.67"/><path d="M21 3v9h-9"/></svg>ÇEVİR!';
    }

    currentRotation = 0;
    drawWheel();
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  function setupEventListeners() {
    var toggleBtn = document.getElementById('carkifelek-toggle');
    var modal = document.getElementById('carkifelek-modal');
    var closeBtn = document.getElementById('carkifelek-close');
    var spinBtn = document.getElementById('carkifelek-spin');
    var closeSuccessBtn = document.getElementById('carkifelek-close-success');
    var isPhone = widgetData.shop.contactInfoType === 'phone';
    var inputId = isPhone ? 'carkifelek-phone' : 'carkifelek-email';
    var contactInput = document.getElementById(inputId);
    var fullNameInput = document.getElementById('carkifelek-fullname');

    if (!toggleBtn || !modal || !closeBtn || !spinBtn || !contactInput || !fullNameInput) {
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
      var fullName = fullNameInput.value.trim();
      var contact = contactInput.value.trim();

      if (!fullName) {
        showResult('Lütfen adınızı ve soyadınızı girin 😊', '#ef4444');
        fullNameInput.focus();
        return;
      }

      if (fullName.length < 3) {
        showResult('Lütfen geçerli bir ad soyad girin (en az 3 karakter) 📝', '#ef4444');
        fullNameInput.focus();
        return;
      }

      if (!contact) {
        var emptyMsg = isPhone ? 'Lütfen telefon numaranızı girin 😊' : 'Lütfen e-posta adresinizi girin 😊';
        showResult(emptyMsg, '#ef4444');
        contactInput.focus();
        return;
      }

      if (isPhone) {
        if (!isValidPhone(contact)) {
          showResult('Geçerli bir telefon numarası girin 📱 (5XX XXX XX XX)', '#ef4444');
          contactInput.focus();
          return;
        }
        contact = formatPhone(contact);
      } else {
        if (!isValidEmail(contact)) {
          showResult('Geçerli bir e-posta adresi girin 📧', '#ef4444');
          contactInput.focus();
          return;
        }
      }

      checkContactUsed(contact, function(err, used) {
        if (err) {
          logError('İletişim kontrol hatası', err);
          return;
        }

        if (used) {
          var usedMsg = isPhone ? 'Bu telefon numarası ile zaten çark çevirdiniz! 🔄' : 'Bu e-posta ile zaten çark çevirdiniz! 🔄';
          showResult(usedMsg, '#f59e0b');
          return;
        }

        selectedPrize = selectPrize();
        fullNameInput.disabled = true;
        contactInput.disabled = true;
        spinBtn.disabled = true;
        spinBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 8px; animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>ÇEVİRİLİYOR...';
        spinWheel(selectedPrize, fullName, contact);
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

    var handleEnterKey = function(e) {
      if (e.key === 'Enter') {
        spinBtn.click();
      }
    };
    fullNameInput.addEventListener('keypress', handleEnterKey);
    contactInput.addEventListener('keypress', handleEnterKey);
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
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.05); }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    #carkifelek-widget button:hover {
      transform: translateY(-3px) scale(1.05) !important;
      box-shadow: 0 16px 56px rgba(245, 158, 11, 0.6) !important;
    }
    #carkifelek-modal button:hover {
      transform: scale(1.05);
      background: rgba(255,255,255,0.15) !important;
    }
    #carkifelek-fullname:focus,
    #carkifelek-email:focus,
    #carkifelek-phone:focus {
      border-color: #f59e0b !important;
      box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.15), 0 0 0 1px #f59e0b !important;
      background: rgba(255,255,255,0.08) !important;
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
