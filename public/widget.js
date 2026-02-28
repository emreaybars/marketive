/**
 * Çarkıfelek Widget - WhatsApp Green Premium Edition
 * Modern wheel with visible prize names, white modal, clean design
 * Version 5.3.0 - Faster spin (4s, 5 rotations) + debug logging
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
            title: widget.widget_title || 'Şansını Deneme! 🎁',
            description: widget.widget_description || 'Çarkı çevir, arma kazan!',
            buttonText: widget.widget_button_text || 'ÇARKI ÇEVİR',
            showOnLoad: widget.widget_show_on_load || false,
            popupDelay: widget.widget_popup_delay || 0,
            backgroundColor: widget.widget_background_color || '#25D366',
            buttonColor: widget.widget_button_color || '#25D366',
            titleColor: widget.widget_title_color || '#1a1a1a',
            descriptionColor: widget.widget_description_color || '#666666'
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
  // COLOR UTILITIES
  // ============================================

  function getContrastColor(hexColor) {
    var hex = hexColor.replace('#', '');
    var r = parseInt(hex.substr(0, 2), 16);
    var g = parseInt(hex.substr(2, 2), 16);
    var b = parseInt(hex.substr(4, 2), 16);
    var brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#1a1a1a' : '#ffffff';
  }

  function lightenColor(hexColor, amount) {
    var hex = hexColor.replace('#', '');
    var r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
    var g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
    var b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
    return '#' +
      (r < 16 ? '0' : '') + r.toString(16) +
      (g < 16 ? '0' : '') + g.toString(16) +
      (b < 16 ? '0' : '') + b.toString(16);
  }

  // ============================================
  // WHEEL RENDERING - WHATSAPP GREEN PREMIUM
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
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
          '<circle cx="12" cy="12" r="10"/>' +
          '<path d="M12 6v6l4 2"/>' +
        '</svg>' +
        '<span style="margin-left: 10px; font-weight: 700;">' + widgetData.widget.buttonText + '</span>' +
      '</button>' +
    '</div>' +
      '<div id="carkifelek-modal" style="' + getModalStyles() + '">' +
        '<div style="' + getModalContentStyles() + '">' +
          '<button id="carkifelek-close" style="' + getCloseButtonStyles() + '">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="2.5">' +
              '<path d="M18 6L6 18M6 6l12 12"/>' +
            '</svg>' +
          '</button>' +
          '<h2 style="' + getTitleStyles() + '">' + widgetData.widget.title + '</h2>' +
          '<p style="' + getDescriptionStyles() + '">' + widgetData.widget.description + '</p>' +
          '<div style="position: relative; width: 300px; height: 300px; margin: 20px auto;">' +
            '<div id="carkifelek-wheel-glow" style="' + getWheelGlowStyles() + '"></div>' +
            '<canvas id="carkifelek-wheel" width="300" height="300"></canvas>' +
            '<div id="carkifelek-center" style="' + getCenterStyles() + '">🎁</div>' +
            '<div id="carkifelek-pointer" style="' + getPointerStyles() + '"></div>' +
          '</div>' +
          '<div id="carkifelek-result" style="' + getResultStyles() + '"></div>' +
          '<div id="carkifelek-form" style="' + getFormStyles() + '">' +
            '<input type="text" id="carkifelek-fullname" placeholder="Ad Soyad" style="' + getInputStyles() + '" />' +
            '<input type="' + inputType + '" id="' + inputId + '" placeholder="' + inputPlaceholder + '" style="' + getInputStyles() + '" />' +
            '<label style="' + getCheckboxStyles() + '" onclick="toggleConsent(\'kvvk\')">' +
              '<div id="carkifelek-kvvk-check" style="' + getCheckboxBoxStyles() + '"></div>' +
              '<span style="' + getCheckboxLabelStyles() + '"><strong>KVKK</strong> bilgilendirme metnini okudum, kabul ediyorum</span>' +
            '</label>' +
            '<label style="' + getCheckboxStyles() + '" onclick="toggleConsent(\'eticaret\')">' +
              '<div id="carkifelek-eticaret-check" style="' + getCheckboxBoxStyles() + '"></div>' +
              '<span style="' + getCheckboxLabelStyles() + '"><strong>Elektronik Ticari İleti</strong> aydınlatma metnini okudum, kabul ediyorum</span>' +
            '</label>' +
            '<div id="carkifelek-consent-error" style="' + getConsentErrorStyles() + '"></div>' +
            '<button id="carkifelek-spin" style="' + getSpinButtonStyles() + '">' +
              '<span id="carkifelek-spin-text" style="font-weight: 700; letter-spacing: 0.5px;">ÇEVİR KAZAN</span>' +
              '<svg id="carkifelek-spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left: 6px;"><path d="M21 12a9 9 0 11-6.21-17.67"/><path d="M21 3v9h-9"/></svg>' +
            '</button>' +
            '<p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 12px; font-weight: 500;">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#25D366" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>' +
              'Verileriniz güvende' +
            '</p>' +
          '</div>' +
          '<div id="carkifelek-success" style="' + getSuccessStyles() + '">' +
            '<div style="font-size: 56px; margin-bottom: 12px;">🎉</div>' +
            '<h3 style="font-size: 22px; font-weight: 800; margin-bottom: 8px; background: linear-gradient(135deg, #25D366, #128C7E); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">TEBRİKLER!</h3>' +
            '<div id="carkifelek-prize-name" style="font-size: 18px; color: #25D366; font-weight: 700; margin-bottom: 12px;"></div>' +
            '<div id="carkifelek-coupon" style="' + getCouponStyles() + '"></div>' +
            '<button id="carkifelek-close-success" style="' + getCloseSuccessButtonStyles() + '">Kapat</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ============================================
  // STYLES - WHATSAPP GREEN PREMIUM
  // ============================================

  function getWidgetStyles() {
    return 'position: fixed; bottom: 20px; right: 20px; z-index: 999999;' +
           'opacity: 0; transform: translateY(20px); transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);';
  }

  function getToggleButtonStyles() {
    return 'background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);' +
           'color: white; border: none; padding: 14px 24px; border-radius: 50px;' +
           'font-size: 14px; font-weight: 700; cursor: pointer;' +
           'box-shadow: 0 10px 40px rgba(37, 211, 102, 0.4);' +
           'display: flex; align-items: center; transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);' +
           'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;' +
           'text-transform: uppercase; letter-spacing: 0.5px;';
  }

  function getModalStyles() {
    return 'position: fixed; top: 0; left: 0; right: 0; bottom: 0;' +
           'background: rgba(0,0,0,0.4); backdrop-filter: blur(8px);' +
           'display: none; justify-content: center; align-items: center;' +
           'z-index: 1000000; animation: fadeIn 0.3s ease;';
  }

  function getModalContentStyles() {
    return 'background: #ffffff;' +
           'border-radius: 20px; padding: 32px 28px 28px 28px; max-width: 420px; width: 90%;' +
           'box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05);' +
           'position: relative; overflow: hidden;' +
           'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';
  }

  function getCloseButtonStyles() {
    return 'position: absolute; top: 16px; right: 16px;' +
           'background: #1a1a1a; border: none; border-radius: 50%;' +
           'color: #ffffff; width: 40px; height: 40px; cursor: pointer;' +
           'display: flex; align-items: center; justify-content: center;' +
           'transition: all 0.2s ease; opacity: 0.8;' +
           'box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
  }

  function getTitleStyles() {
    return 'color: #1a1a1a;' +
           'font-size: 28px; font-weight: 900; text-align: center;' +
           'margin: 0 0 8px 0; letter-spacing: -0.5px; line-height: 1.2;' +
           'background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);' +
           '-webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;';
  }

  function getDescriptionStyles() {
    return 'color: #666666;' +
           'font-size: 15px; line-height: 1.5; text-align: center;' +
           'margin: 0 0 16px 0; font-weight: 500;';
  }

  function getWheelGlowStyles() {
    return 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);' +
           'width: 280px; height: 280px; border-radius: 50%;' +
           'background: radial-gradient(circle, rgba(37, 211, 102, 0.2) 0%, transparent 70%);' +
           'pointer-events: none;';
  }

  function getPointerStyles() {
    return 'position: absolute; top: 50%; right: -12px;' +
           'transform: translateY(-50%); width: 0; height: 0;' +
           'border-left: 24px solid #1a1a1a; border-top: 14px solid transparent;' +
           'border-bottom: 14px solid transparent;' +
           'filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));' +
           'z-index: 10;';
  }

  function getCenterStyles() {
    return 'position: absolute; top: 50%; left: 50%;' +
           'transform: translate(-50%, -50%);' +
           'width: 72px; height: 72px; border-radius: 50%;' +
           'background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);' +
           'display: flex; align-items: center; justify-content: center;' +
           'font-size: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);' +
           'z-index: 5;';
  }

  function getResultStyles() {
    return 'min-height: 24px; margin: 16px 0; color: #25D366; font-weight: 700;' +
           'font-size: 14px; text-align: center;';
  }

  function getFormStyles() {
    return 'margin-top: 16px; display: flex; flex-direction: column; gap: 12px;';
  }

  function getInputStyles() {
    return 'width: 100%; padding: 14px 16px; border: 2px solid #e5e7eb;' +
           'border-radius: 12px; font-size: 15px; color: #1a1a1a;' +
           'background: #f9fafb; outline: none; transition: all 0.2s ease;' +
           'font-family: inherit; font-weight: 500;';
  }

  function getCheckboxStyles() {
    return 'display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px;' +
           'border: 2px solid #e5e7eb; border-radius: 10px; cursor: pointer;' +
           'background: #f9fafb; transition: all 0.2s ease; user-select: none;';
  }

  function getCheckboxBoxStyles() {
    return 'flex-shrink-0; width: 18px; height: 18px; min-width: 18px; border: 2px solid #d1d5db;' +
           'border-radius: 4px; display: flex; align-items: center; justify-content: center;' +
           'transition: all 0.15s ease; background: #ffffff;';
  }

  function getCheckboxLabelStyles() {
    return 'font-size: 12px; line-height: 1.4; color: #4b5563; flex: 1;';
  }

  function getConsentErrorStyles() {
    return 'font-size: 11px; color: #ef4444; font-weight: 600; margin-top: -8px; margin-bottom: 4px;' +
           'display: none; padding-left: 28px;';
  }

  function getSpinButtonStyles() {
    var bgColor = widgetData.widget.buttonColor || '#25D366';
    return 'width: 100%; padding: 14px 24px; border-radius: 12px;' +
           'background: ' + bgColor + '; color: #ffffff;' +
           'font-size: 16px; font-weight: 700; cursor: pointer; border: none;' +
           'display: flex; align-items: center; justify-content: center;' +
           'box-shadow: 0 6px 20px rgba(37, 211, 102, 0.35);' +
           'transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);' +
           'font-family: inherit; text-transform: uppercase; letter-spacing: 0.5px;';
  }

  function getSuccessStyles() {
    return 'display: none; text-align: center; padding: 20px;';
  }

  function getCouponStyles() {
    return 'background: linear-gradient(135deg, rgba(37, 211, 102, 0.08) 0%, rgba(37, 211, 102, 0.12) 100%);' +
           'padding: 12px 20px; border-radius: 12px; margin: 16px 0;' +
           'font-family: "SF Mono", "Monaco", "Inconsolata", monospace;' +
           'font-size: 14px; letter-spacing: 0.5px; color: #25D366;' +
           'border: 1px solid rgba(37, 211, 102, 0.25); font-weight: 600;';
  }

  function getCloseSuccessButtonStyles() {
    return 'background: #f9fafb; border: 1px solid #e5e7eb; color: #1a1a1a;' +
           'padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 700;' +
           'cursor: pointer; transition: all 0.2s ease; margin-top: 16px;' +
           'text-transform: uppercase; letter-spacing: 0.5px;';
  }

  // ============================================
  // WHEEL DRAWING WITH PRIZE NAMES (RADIAL ALIGNMENT)
  // ============================================

  function drawWheel() {
    var canvas = document.getElementById('carkifelek-wheel');
    if (!canvas || !widgetData || !widgetData.prizes) return;

    wheelCanvas = canvas;
    wheelContext = canvas.getContext('2d');

    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    var radius = canvas.width / 2 - 24;
    var numPrizes = widgetData.prizes.length;
    var arcSize = (2 * Math.PI) / numPrizes;

    // Clear canvas
    wheelContext.clearRect(0, 0, canvas.width, canvas.height);

    // Add spinning glow effect
    if (isSpinning) {
      var glowIntensity = Math.sin(Date.now() / 100) * 0.3 + 0.7;
      wheelContext.save();
      wheelContext.beginPath();
      wheelContext.arc(centerX, centerY, radius + 20, 0, 2 * Math.PI);
      wheelContext.fillStyle = 'rgba(37, 211, 102, ' + (0.2 * glowIntensity) + ')';
      wheelContext.fill();
      wheelContext.restore();
    }

    // Save context for rotation
    wheelContext.save();
    wheelContext.translate(centerX, centerY);
    wheelContext.rotate(currentRotation * Math.PI / 180);
    wheelContext.translate(-centerX, -centerY);

    // Draw outer dots (decorative)
    var dotCount = 48;
    var dotRadius = radius + 14;
    for (var i = 0; i < dotCount; i++) {
      var angle = (i / dotCount) * 2 * Math.PI;
      var x = centerX + Math.cos(angle) * dotRadius;
      var y = centerY + Math.sin(angle) * dotRadius;

      wheelContext.beginPath();
      wheelContext.arc(x, y, 2.5, 0, 2 * Math.PI);
      wheelContext.fillStyle = isSpinning ? '#25D366' : '#ffffff';
      wheelContext.fill();
    }

    // Draw slices
    for (var i = 0; i < numPrizes; i++) {
      var prize = widgetData.prizes[i];
      var startAngle = i * arcSize - Math.PI / 2;
      var endAngle = startAngle + arcSize - 0.05;

      // Draw segment path
      wheelContext.beginPath();
      wheelContext.moveTo(centerX, centerY);
      wheelContext.arc(centerX, centerY, radius, startAngle, endAngle);
      wheelContext.closePath();

      // Gradient fill
      var gradient = wheelContext.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, lightenColor(prize.color, 35));
      gradient.addColorStop(0.6, prize.color);
      gradient.addColorStop(1, prize.color);
      wheelContext.fillStyle = gradient;
      wheelContext.fill();

      // Segment border
      wheelContext.strokeStyle = 'rgba(255,255,255,0.4)';
      wheelContext.lineWidth = 2;
      wheelContext.stroke();

      // Draw prize name (radially aligned)
      drawPrizeName(prize.name, startAngle, endAngle, centerX, centerY, radius * 0.70, prize.color);
    }

    // Inner dashed circle
    wheelContext.beginPath();
    wheelContext.arc(centerX, centerY, radius * 0.38, 0, 2 * Math.PI);
    wheelContext.strokeStyle = '#1a1a1a';
    wheelContext.lineWidth = 2;
    wheelContext.setLineDash([6, 6]);
    wheelContext.stroke();
    wheelContext.setLineDash([]);

    // Center white circle
    wheelContext.beginPath();
    wheelContext.arc(centerX, centerY, 38, 0, 2 * Math.PI);
    var centerGradient = wheelContext.createRadialGradient(centerX, centerY, 0, centerX, centerY, 38);
    centerGradient.addColorStop(0, '#ffffff');
    centerGradient.addColorStop(1, '#f5f5f5');
    wheelContext.fillStyle = centerGradient;
    wheelContext.fill();

    // Center icon
    wheelContext.fillStyle = '#25D366';
    wheelContext.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    wheelContext.textAlign = 'center';
    wheelContext.textBaseline = 'middle';
    wheelContext.fillText('🎁', centerX, centerY);

    wheelContext.restore();
  }

  function drawPrizeName(name, startAngle, endAngle, centerX, centerY, radius, color) {
    var midAngle = startAngle + (endAngle - startAngle) / 2;
    var textX = centerX + Math.cos(midAngle) * radius;
    var textY = centerY + Math.sin(midAngle) * radius;

    wheelContext.save();
    wheelContext.translate(textX, textY);
    // Radial alignment: text reads outward from center
    wheelContext.rotate(midAngle);

    // Text shadow for readability
    wheelContext.shadowColor = 'rgba(0,0,0,0.6)';
    wheelContext.shadowBlur = 4;
    wheelContext.shadowOffsetX = 0;
    wheelContext.shadowOffsetY = 1;

    // Font settings
    wheelContext.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    wheelContext.textAlign = 'center';
    wheelContext.textBaseline = 'middle';

    // Text color based on segment brightness
    wheelContext.fillStyle = getContrastColor(color);

    // Truncate long names
    var maxLength = 12;
    var displayName = name.length > maxLength ? name.substring(0, maxLength - 2) + '..' : name;

    wheelContext.fillText(displayName, 0, 0);
    wheelContext.restore();
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
    var rotations = 5; // Reduced for faster spin
    var targetAngle = 360 * rotations + (360 - prizeAngle * 180 / Math.PI) + 90;
    var duration = 4000; // 4 seconds
    var startTime = Date.now();

    // Play tick sound during spin
    var lastTickAngle = 0;
    var tickInterval = Math.floor(360 / numPrizes);

    function animate() {
      var elapsed = Date.now() - startTime;
      var progress = Math.min(elapsed / duration, 1);

      // Enhanced ease out function - starts fast, slows down smoothly
      var easeOut;
      if (progress < 0.5) {
        easeOut = 4 * progress * progress * progress;
      } else {
        easeOut = 1 - Math.pow(-2 * progress + 2, 3) / 2;
      }

      currentRotation = targetAngle * easeOut;

      // Tick sound feedback
      var currentAngle = currentRotation % 360;
      if (Math.floor(currentAngle / tickInterval) > lastTickAngle) {
        lastTickAngle = Math.floor(currentAngle / tickInterval);
        // Optional: Add tick sound here
      }

      drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isSpinning = false;
        triggerConfetti();
        showSuccess(prize, fullName, contact);
      }
    }

    animate();
  }

  // Confetti effect function
  function triggerConfetti() {
    var colors = ['#25D366', '#128C7E', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'];
    var confettiCount = 100;
    var container = document.getElementById('carkifelek-modal');

    if (!container) return;

    for (var i = 0; i < confettiCount; i++) {
      createConfetti(container, colors);
    }
  }

  function createConfetti(container, colors) {
    var confetti = document.createElement('div');
    var color = colors[Math.floor(Math.random() * colors.length)];
    var startX = Math.random() * 100;
    var endX = startX + (Math.random() - 0.5) * 100;
    var rotation = Math.random() * 720;
    var duration = 2000 + Math.random() * 1000;
    var size = 5 + Math.random() * 10;

    confetti.style.cssText =
      'position: absolute;' +
      'left: ' + startX + '%;' +
      'top: 50%;' +
      'width: ' + size + 'px;' +
      'height: ' + size + 'px;' +
      'background: ' + color + ';' +
      'border-radius: 2px;' +
      'opacity: 1;' +
      'transform: rotate(0deg);' +
      'transition: all ' + duration + 'ms cubic-bezier(0.25, 0.46, 0.45, 0.94);' +
      'pointer-events: none;' +
      'z-index: 10000;';

    container.appendChild(confetti);

    // Trigger animation
    setTimeout(function() {
      confetti.style.left = endX + '%';
      confetti.style.top = '120%';
      confetti.style.transform = 'rotate(' + rotation + 'deg)';
      confetti.style.opacity = '0';
    }, 10);

    // Remove from DOM
    setTimeout(function() {
      if (confetti.parentNode) {
        confetti.parentNode.removeChild(confetti);
      }
    }, duration);
  }

  function showResult(message, color) {
    var resultEl = document.getElementById('carkifelek-result');
    var consentErrorEl = document.getElementById('carkifelek-consent-error');

    if (resultEl) {
      resultEl.innerHTML = message;
      resultEl.style.color = color || '#25D366';
    }

    if (consentErrorEl) {
      consentErrorEl.style.display = 'none';
    }
  }

  function showSuccess(prize, fullName, contact) {
    var formEl = document.getElementById('carkifelek-form');
    var resultEl = document.getElementById('carkifelek-result');
    var successEl = document.getElementById('carkifelek-success');
    var prizeNameEl = document.getElementById('carkifelek-prize-name');
    var couponEl = document.getElementById('carkifelek-coupon');

    // Hide form and result
    if (formEl) formEl.style.display = 'none';
    if (resultEl) resultEl.style.display = 'none';

    // Show success with animation
    if (successEl) {
      successEl.style.display = 'block';
      successEl.style.opacity = '0';
      successEl.style.transform = 'scale(0.8)';

      setTimeout(function() {
        successEl.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        successEl.style.opacity = '1';
        successEl.style.transform = 'scale(1)';
      }, 50);
    }

    // Animate prize name
    if (prizeNameEl) {
      prizeNameEl.textContent = prize.name;
      prizeNameEl.style.opacity = '0';
      prizeNameEl.style.transform = 'translateY(20px)';

      setTimeout(function() {
        prizeNameEl.style.transition = 'all 0.4s ease-out';
        prizeNameEl.style.opacity = '1';
        prizeNameEl.style.transform = 'translateY(0)';
      }, 300);
    }

    // Show coupon code with animation
    if (couponEl && prize.coupon_codes) {
      couponEl.textContent = '🎟️ KOD: ' + prize.coupon_codes;
      couponEl.style.display = 'block';
      couponEl.style.opacity = '0';
      couponEl.style.transform = 'scale(0.9)';

      setTimeout(function() {
        couponEl.style.transition = 'all 0.3s ease-out';
        couponEl.style.opacity = '1';
        couponEl.style.transform = 'scale(1)';
      }, 500);
    } else {
      if (couponEl) couponEl.style.display = 'none';
    }

    // Log to database
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

    // Reset checkboxes
    window.widgetConsents = [];

    updateCheckbox('kvvk', false);
    updateCheckbox('eticaret', false);

    var consentErrorEl = document.getElementById('carkifelek-consent-error');
    if (consentErrorEl) consentErrorEl.style.display = 'none';

    if (formEl) formEl.style.display = 'flex';
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
      spinBtn.innerHTML = '<span id="carkifelek-spin-text" style="font-weight: 700; letter-spacing: 0.5px;">ÇEVİR KAZAN</span>' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left: 6px;"><path d="M21 12a9 9 0 11-6.21-17.67"/><path d="M21 3v9h-9"/></svg>';
    }

    // Reset input borders
    resetInputBorder('carkifelek-fullname');
    resetInputBorder(inputId);

    currentRotation = 0;
    drawWheel();
  }

  function resetInputBorder(inputId) {
    var input = document.getElementById(inputId);
    if (input) {
      input.style.borderColor = '#e5e7eb';
      input.style.background = '#f9fafb';
      input.style.boxShadow = 'none';
    }
  }

  function updateCheckbox(type, checked) {
    var checkEl = document.getElementById('carkifelek-' + type + '-check');
    if (!checkEl) return;

    if (checked) {
      checkEl.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5"><path d="M20 6L9 17l-5-5"/></svg>';
      checkEl.style.background = '#25D366';
      checkEl.style.borderColor = '#25D366';
    } else {
      checkEl.innerHTML = '';
      checkEl.style.background = '#ffffff';
      checkEl.style.borderColor = '#d1d5db';
    }
  }

  // Global consent storage
  window.widgetConsents = [];

  function toggleConsent(type) {
    if (!window.widgetConsents) window.widgetConsents = [];

    var index = window.widgetConsents.indexOf(type);
    if (index > -1) {
      window.widgetConsents.splice(index, 1);
      updateCheckbox(type, false);
    } else {
      window.widgetConsents.push(type);
      updateCheckbox(type, true);
    }

    // Clear error if both checked
    var kvvkChecked = window.widgetConsents.includes('kvvk');
    var ticaretChecked = window.widgetConsents.includes('eticaret');

    if (kvvkChecked && ticaretChecked) {
      var errorEl = document.getElementById('carkifelek-consent-error');
      if (errorEl) errorEl.style.display = 'none';
    }
  }

  // Expose toggleConsent globally for inline onclick handlers
  window.toggleConsent = toggleConsent;

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
        highlightError('carkifelek-fullname');
        return;
      }

      if (fullName.length < 3) {
        showResult('Lütfen geçerli bir ad soyad girin (en az 3 karakter) 📝', '#ef4444');
        highlightError('carkifelek-fullname');
        return;
      }

      if (!contact) {
        var emptyMsg = isPhone ? 'Lütfen telefon numaranızı girin 😊' : 'Lütfen e-posta adresinizi girin 😊';
        showResult(emptyMsg, '#ef4444');
        highlightError(inputId);
        return;
      }

      if (isPhone) {
        if (!isValidPhone(contact)) {
          showResult('Geçerli bir telefon numarası girin 📱 (5XX XXX XX XX)', '#ef4444');
          highlightError(inputId);
          return;
        }
        contact = formatPhone(contact);
      } else {
        if (!isValidEmail(contact)) {
          showResult('Geçerli bir e-posta adresi girin 📧', '#ef4444');
          highlightError(inputId);
          return;
        }
      }

      // Check consents
      var kvvkChecked = window.widgetConsents && window.widgetConsents.includes('kvvk');
      var ticaretChecked = window.widgetConsents && window.widgetConsents.includes('eticaret');

      if (!kvvkChecked || !ticaretChecked) {
        showResult('Lütfen zorunlu onayları kabul edin ✓', '#ef4444');
        var consentErrorEl = document.getElementById('carkifelek-consent-error');
        if (consentErrorEl) {
          consentErrorEl.textContent = 'Elektronik ileti onayı gereklidir';
          consentErrorEl.style.display = 'block';
        }
        return;
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

        // All valid, spin the wheel
        selectedPrize = selectPrize();
        fullNameInput.disabled = true;
        contactInput.disabled = true;
        spinBtn.disabled = true;

        // Show loading state
        spinBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite; margin-right: 8px;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span style="font-weight: 700;">ÇEVİRİLİYOR...</span>';

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

    // Input focus handlers
    fullNameInput.addEventListener('focus', function() {
      highlightInput('carkifelek-fullname', false);
    });
    contactInput.addEventListener('focus', function() {
      highlightInput(inputId, false);
    });
  }

  function highlightError(inputId) {
    var input = document.getElementById(inputId);
    if (input) {
      input.style.borderColor = '#ef4444';
      input.style.background = '#fef2f2';
      input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
    }
  }

  function highlightInput(inputId, isError) {
    var input = document.getElementById(inputId);
    if (!input) return;

    if (!isError) {
      input.style.borderColor = '#e5e7eb';
      input.style.background = '#f9fafb';
      input.style.boxShadow = 'none';
    }
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
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    #carkifelek-widget button:hover {
      transform: translateY(-2px) scale(1.02) !important;
      box-shadow: 0 14px 48px rgba(37, 211, 102, 0.5) !important;
    }
    #carkifelek-modal button:hover {
      transform: scale(1.05);
    }
    #carkifelek-close:hover {
      opacity: 1 !important;
      transform: scale(1.1) !important;
    }
    #carkifelek-fullname:focus,
    #carkifelek-email:focus,
    #carkifelek-phone:focus {
      border-color: #25D366 !important;
      box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1), 0 0 0 1px #25D366 !important;
      background: #ffffff !important;
    }
    #carkifelek-spin:disabled {
      opacity: 0.7;
      cursor: not-allowed !important;
      transform: none !important;
      box-shadow: none !important;
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
