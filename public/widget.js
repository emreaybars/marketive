/**
 * Çarkıfelek Widget - Red Premium Edition
 * Design matching wheel-widget-2.js
 * Version 6.0.1 - API keys data attributes'ten
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================

  var SUPABASE_URL = null;
  var SUPABASE_ANON_KEY = null;

  function getConfig() {
    var widget = document.getElementById('carkifelek-widget');
    if (widget) {
      SUPABASE_URL = widget.getAttribute('data-supabase-url');
      SUPABASE_ANON_KEY = widget.getAttribute('data-supabase-key');
    }
    return SUPABASE_URL && SUPABASE_ANON_KEY;
  }

  // ============================================
  // STATE
  // ============================================

  var widgetData = null;
  var isSpinning = false;
  var currentRotation = 0;
  var shopUuid = null;
  var supabaseClient = null;
  var isInitialized = false;
  var selectedPrize = null;
  var hasSpunToday = false;
  var savedSpinData = null;

  // ============================================
  // LOCAL STORAGE HELPERS
  // ============================================

  function getStorageKey() {
    return 'carkifelek_spin_' + (shopUuid || 'default');
  }

  function saveSpinData(prize, fullName, contact) {
    var key = getStorageKey();
    var data = {
      prize: prize,
      fullName: fullName,
      contact: contact,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 saat
    };
    try {
      localStorage.setItem(key, JSON.stringify(data));
      savedSpinData = data;
      hasSpunToday = true;
    } catch (e) {
      logError('LocalStorage kayıt hatası', e);
    }
  }

  function getSpinData() {
    var key = getStorageKey();
    try {
      var data = localStorage.getItem(key);
      if (data) {
        var parsed = JSON.parse(data);
        // 24 saat geçmiş mi kontrol et
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          return parsed;
        } else {
          // Süresi dolmuş, sil
          localStorage.removeItem(key);
          return null;
        }
      }
    } catch (e) {
      logError('LocalStorage okuma hatası', e);
    }
    return null;
  }

  function checkIfSpunToday() {
    var data = getSpinData();
    if (data && data.expiresAt && Date.now() < data.expiresAt) {
      savedSpinData = data;
      hasSpunToday = true;
      return true;
    }
    hasSpunToday = false;
    savedSpinData = null;
    return false;
  }

  function getTimeRemaining() {
    if (!savedSpinData || !savedSpinData.expiresAt) return 0;
    var remaining = savedSpinData.expiresAt - Date.now();
    return Math.max(0, Math.floor(remaining / 1000 / 60)); // dakika cinsinden
  }

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
            title: widget.widget_title || 'Çarkı Çevir<br/>Hediyeni Kazan!',
            description: widget.widget_description || 'Hediyeni almak için hemen çarkı çevir.',
            buttonText: widget.widget_button_text || 'ÇARKI ÇEVİR',
            showOnLoad: widget.widget_show_on_load || false,
            popupDelay: widget.widget_popup_delay || 0,
            backgroundColor: widget.widget_background_color || 'rgba(139, 0, 0, 0.9)',
            buttonColor: widget.widget_button_color || '#d10000',
            buttonTextColor: widget.widget_button_text_color || '#ffffff',
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

  function checkContactUsed(contact, callback) {
    if (!contact || !shopUuid) {
      callback(null, false);
      return;
    }

    var contactType = widgetData.shop.contactInfoType;

    // Doğrudan wheel_spins tablosundan kontrol et
    var query = supabaseClient
      .from('wheel_spins')
      .select('id')
      .eq('shop_id', shopUuid);

    if (contactType === 'email') {
      query = query.eq('email', contact);
    } else {
      query = query.eq('phone', contact);
    }

    query
      .limit(1)
      .then(function(result) {
        callback(null, result.data && result.data.length > 0);
      })
      .catch(function(err) {
        logError('İletişim kontrol hatası', err);
        callback(null, false);
      });
  }

  function logSpin(prize, fullName, contact) {
    if (!prize || !contact) return;

    log('Kaydediliyor:', prize.id, fullName, contact);

    // Basitleştirilmiş RPC fonksiyonu (token doğrulamasız)
    supabaseClient
      .rpc('widget_log_spin_simple', {
        p_shop_uuid: shopUuid,
        p_contact: contact,
        p_prize_id: prize.id,
        p_full_name: fullName
      })
      .then(function(result) {
        if (result.error) {
          logError('Spin kayıt hatası:', result.error.message, result.error);
          return;
        }
        log('Kayıt başarılı - Spin ID:', result.data.spin_id, 'Coupon:', result.data.coupon_code);

        // Prize nesnesine coupon kodunu ekle (modal gösterimi için)
        prize.coupon_code_result = result.data.coupon_code;
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
  // WIDGET RENDERING - RED PREMIUM DESIGN
  // ============================================

  function renderWidget() {
    log('Widget render ediliyor...');

    var existing = document.getElementById('carkifelek-widget-container');
    if (existing) existing.remove();

    var container = document.createElement('div');
    container.id = 'carkifelek-widget-container';
    // Container CSS - görünürlük için gerekli
    container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999999;';
    container.innerHTML = buildWidgetHTML();
    document.body.appendChild(container);

    setupEventListeners();

    // Animation entry ve otomatik modal açma
    setTimeout(function() {
      // Toggle button widget'ını göster
      var widgetEl = document.getElementById('carkifelek-widget');
      if (widgetEl) {
        widgetEl.style.opacity = '1';
      }

      // Debug: showOnLoad değeri
      log('showOnLoad değeri:', widgetData ? widgetData.widget?.showOnLoad : 'widgetData yok');

      // Eğer showOnLoad aktifse modal'ı otomatik aç
      if (widgetData && widgetData.widget && widgetData.widget.showOnLoad) {
        var modal = document.getElementById('carkifelek-modal');
        var toggleBtn = document.getElementById('carkifelek-toggle');
        log('Modal element:', modal);
        log('ToggleBtn element:', toggleBtn);

        if (modal) {
          modal.style.display = 'flex';
          log('Modal display flex yapıldı');
        }
        if (toggleBtn) {
          toggleBtn.style.display = 'none';
          log('ToggleBtn gizlendi');
        }
        log('Modal otomatik açıldı');
      } else {
        log('showOnLoad false, toggle button gösteriliyor');
        // showOnLoad false ise toggle button'ı göster
        var toggleBtn = document.getElementById('carkifelek-toggle');
        if (toggleBtn) {
          toggleBtn.style.display = 'flex';
        }
      }
    }, 100);
  }

  function buildWidgetHTML() {
    var isPhone = widgetData.shop.contactInfoType === 'phone';
    var inputPlaceholder = isPhone ? '5xx xxx xx xx' : 'ornek@example.com';
    var inputType = isPhone ? 'tel' : 'email';
    var inputId = isPhone ? 'carkifelek-phone' : 'carkifelek-email';

    var bgStyle = widgetData.widget.backgroundColor || 'rgba(139, 0, 0, 0.9)';

    // Check if user has already spun today
    checkIfSpunToday();

    // Build form content based on spin state
    var formContent = '';
    if (hasSpunToday && savedSpinData) {
      // Already spun - show prize info
      var timeRemaining = getTimeRemaining();
      var hoursRemaining = Math.floor(timeRemaining / 60);
      var minutesRemaining = timeRemaining % 60;
      var timeText = hoursRemaining > 0 ? hoursRemaining + ' saat ' + minutesRemaining + ' dakika' : minutesRemaining + ' dakika';

      formContent =
        '<div id="carkifelek-form" style="width: 100%; max-width: 350px; margin: 0 auto; text-align: center;">' +
          '<div style="background: rgba(255,255,255,0.15); border-radius: 12px; padding: 20px; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.2);">' +
            '<div style="font-size: 40px; margin-bottom: 10px;">🎁</div>' +
            '<h3 style="color: #fff; font-size: 16px; margin: 0 0 8px 0; font-weight: 600;">Çarkı Zaten Çevirdiniz!</h3>' +
            '<p style="color: rgba(255,255,255,0.9); font-size: 13px; margin: 0 0 15px 0; line-height: 1.5;">Kazandığınız ödül: <strong>' + (savedSpinData.prize ? savedSpinData.prize.name : 'Ödül') + '</strong></p>' +
            '<button id="carkifelek-view-prize" style="background: linear-gradient(135deg, #ffce01 0%, #ffa500 100%); color: #1a1a1a; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; width: 100%; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">Ödülümü Gör</button>' +
          '</div>' +
          '<p style="color: rgba(255,255,255,0.7); font-size: 11px; margin: 0;">Yeniden çevirmek için kalan süre: <strong>' + timeText + '</strong></p>' +
        '</div>';
    } else {
      // Not spun yet - show form
      formContent =
        '<div id="carkifelek-form" style="width: 100%; max-width: 350px; margin: 0 auto 15px;">' +
          // Ad Soyad
          '<div style="position: relative; margin-bottom: 10px;">' +
            '<div style="width: 20px; height: 20px; position: absolute; top: 10px; left: 12px; opacity: 0.3; color: #333;">' +
              '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' +
            '</div>' +
            '<input type="text" id="carkifelek-fullname" placeholder="Ad Soyad" style="' + getInputStyles() + '" />' +
          '</div>' +
          // Email/Phone
          '<div style="position: relative; margin-bottom: 10px;">' +
            '<div style="width: 20px; height: 20px; position: absolute; top: 10px; left: 12px; opacity: 0.3; color: #333;">' +
              (isPhone ?
                '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>' :
                '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>'
              ) +
            '</div>' +
            '<input type="' + inputType + '" id="' + inputId + '" placeholder="' + inputPlaceholder + '" style="' + getInputStyles() + '" />' +
          '</div>' +
          // KVKK Consent
          '<label style="' + getCheckboxStyles() + '">' +
            '<input type="checkbox" id="carkifelek-kvvk-checkbox" style="width: 18px; height: 18px; border-radius: 15px;" />' +
            '<span style="color: rgba(255,255,255,0.8); font-size: 10px; line-height: 1.3;">Tanıtım ve kampanya içerikli SMS ve WhatsApp iletilerini almayı kabul ediyorum. Aydınlatma Metni\'ni okudum ve KVKK kapsamında bilgilendirildim.</span>' +
          '</label>' +
          '<div id="carkifelek-email-error" style="color: #ffcccc; font-size: 12px; margin-top: 5px; display: none;"></div>' +
        '</div>';
    }

    // Button content based on spin state
    var buttonContent = '';
    if (hasSpunToday) {
      buttonContent = '<div style="padding: 0; width: 100%; max-width: 350px; margin: 0 auto;"></div>';
    } else {
      buttonContent =
        '<div style="padding: 0; width: 100%; max-width: 350px; margin: 0 auto;">' +
          '<button id="carkifelek-spin" style="' + getSpinButtonStyles() + '">' +
            '<span id="carkifelek-spin-text">' + widgetData.widget.buttonText + '</span>' +
          '</button>' +
        '</div>';
    }

    return '<div id="carkifelek-widget" style="' + getWidgetStyles() + '">' +
      '<button id="carkifelek-toggle" style="' + getToggleButtonStyles() + '">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' +
        '<span style="font-weight: 600; font-size: 14px; white-space: nowrap;">Çarkı Çevir!</span>' +
      '</button>' +
    '</div>' +
    '<div id="carkifelek-modal" style="' + getModalStyles() + '">' +
      '<div class="carkifelek-modal-content" style="' + getModalContentStyles(bgStyle) + '">' +
        '<button id="carkifelek-close" style="' + getCloseButtonStyles() + '">×</button>' +

        // Desktop: Horizontal Layout Wrapper
        '<div class="carkifelek-layout" style="display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%;">' +

          // LEFT SIDE - WHEEL
          '<div class="carkifelek-wheel-side" style="flex-shrink: 0;">' +
            // 1. WHEEL (Çark)
            '<div class="wheel-container" style="position: relative; width: min(70vw, 280px); height: min(70vw, 280px); margin: 0 auto; background: url(https://carkifelek.io/cark-circle.png); background-position: center; background-size: cover;">' +
              // Marker/Arrow
              '<div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); z-index: 20; width: 25px; height: 35px; pointer-events: none;">' +
                '<div style="width: 35px; height: 35px; box-shadow: 0 2px 2px 0 rgba(0,0,0,0.23); border-radius: 0 50% 50% 50%; transform: rotate(-135deg); background-color: #ffffff; position: absolute; top: 5px; left: 50%; margin-left: -17px;">' +
                  '<svg x="0px" y="0px" width="12px" height="12px" viewBox="0 0 12 12" style="position: absolute; height: 14px; width: 14px; top: 50%; left: 50%; margin-top: -7px; margin-left: -7px; transform: rotate(135deg);">' +
                    '<polygon points="7.489 4.667 6 0 4.511 4.667 0 4.667 3.59 7.416 2.101 12 6 9.167 9.899 12 8.41 7.416 12 4.667 7.489 4.667" fill="#ffce01"></polygon>' +
                  '</svg>' +
                '</div>' +
              '</div>' +
              // Wheel shake wrapper - shake animasyonu burada
              '<div class="wheel-shake-wrapper" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; animation: wheel-shake 2s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite;">' +
                // SVG Wheel - rotation transform sadece burada
                '<svg id="carkifelek-wheel" viewBox="0 0 100 100" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; padding: 12px; transform: rotate(0deg); pointer-events: none; box-shadow: 0 0 10px rgba(0,0,0,0.2); background: url(https://carkifelek.io/asgr04w.jpeg) no-repeat center / contain;"></svg>' +
              '</div>' +
              // Center
              '<div style="position: absolute; width: 15%; height: 15%; background: #fff; border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; box-shadow: 0 0 18px 4px rgba(0,0,0,0.17);">' +
                '<div style="position: absolute; width: 70%; height: 70%; background: #f0f0f0; border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); box-shadow: inset 0 0 5px rgba(0,0,0,0.2);"></div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // RIGHT SIDE - FORM
          '<div class="carkifelek-form-side" style="width: 100%; max-width: 320px;">' +
            // 2. TITLE (Başlık)
            '<div style="text-align: center; margin-bottom: 5px;">' +
              '<h2 style="color: ' + (widgetData.widget.titleColor || '#fff') + '; font-size: 18px; font-weight: 700; margin: 0;">' + widgetData.widget.title + '</h2>' +
            '</div>' +

            // 3. DESCRIPTION (Açıklama)
            '<div style="text-align: center; margin-bottom: 12px;">' +
              '<p style="color: ' + (widgetData.widget.descriptionColor || '#fff') + '; font-size: 12px; margin: 0; opacity: 0.9;">' + widgetData.widget.description + '</p>' +
            '</div>' +

            // 4. FORM CONTENT (Dynamic based on spin state)
            formContent +

            // 5. BUTTON CONTENT (Dynamic based on spin state)
            buttonContent +

        // Success Modal - Monochrome Premium Design
        '<div id="carkifelek-prize-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); z-index: 99999; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; pointer-events: auto;">' +
          '<div style="background: linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%); width: 90%; max-width: 340px; border-radius: 20px; padding: 0; text-align: center; position: relative; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0,0,0,0.05); transform: scale(0.9); animation: modalAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; overflow: hidden;">' +
            // Header with confetti decoration
            '<div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 25px 20px 20px; position: relative;">' +
              '<div style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 40px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px;"></div>' +
              '<div style="font-size: 28px; margin-bottom: 5px;">🎉</div>' +
              '<h2 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 600; letter-spacing: 0.5px;">Tebrikler!</h2>' +
            '</div>' +
            // Prize info
            '<div style="padding: 20px;">' +
              '<div style="background: linear-gradient(135deg, #f5f5f5 0%, #ebebeb 100%); border-radius: 12px; padding: 18px; margin-bottom: 16px; border: 1px solid rgba(0,0,0,0.08);">' +
                '<div id="carkifelek-prize-name" style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px;"></div>' +
                '<div id="carkifelek-prize-desc" style="font-size: 14px; color: #666;"></div>' +
              '</div>' +
              // Coupon section
              '<div id="carkifelek-coupon-container" style="background: #1a1a1a; border-radius: 12px; padding: 16px; margin-bottom: 16px; position: relative;">' +
                '<div style="position: absolute; top: -8px; left: 20px; background: #1a1a1a; padding: 0 8px; font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Kupon Kodu</div>' +
                '<div style="border: 1px dashed rgba(255,255,255,0.3); padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.05);">' +
                  '<div id="carkifelek-coupon-code" style="font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 2px; font-family: \'Courier New\', monospace;"></div>' +
                '</div>' +
                '<button id="carkifelek-copy-coupon" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 10px 16px; border-radius: 8px; margin-top: 12px; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; width: 100%; justify-content: center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Kodu Kopyala</button>' +
              '</div>' +
              // Buttons
              '<div style="display: flex; gap: 10px;">' +
                '<a id="carkifelek-product-link" href="#" target="_blank" style="flex: 1; padding: 14px 16px; border-radius: 10px; font-size: 14px; cursor: pointer; text-align: center; text-decoration: none; font-weight: 600; background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: all 0.2s;">Alışverişe Başla</a>' +
                '<button id="carkifelek-close-prize" style="flex: 1; padding: 14px 16px; border-radius: 10px; font-size: 14px; cursor: pointer; text-align: center; font-weight: 600; background: #f5f5f5; color: #555; border: 1px solid #e0e0e0; transition: all 0.2s;">Kapat</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>' +
'</div>';
  }

  // ============================================
  // STYLES - RED PREMIUM DESIGN
  // ============================================

  function getWidgetStyles() {
    return 'position: fixed; top: 50%; right: 0; transform: translateY(-50%); z-index: 999999;' +
           'opacity: 1; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); pointer-events: all;';
  }

  function getToggleButtonStyles() {
    return 'background: #1a1a1a;' +
           'color: white; border: none; padding: 12px 20px; border-radius: 12px 0 0 12px;' +
           'font-size: 14px; font-weight: 600; cursor: pointer;' +
           'box-shadow: -4px 4px 20px rgba(0, 0, 0, 0.3);' +
           'display: flex; align-items: center; justify-content: center; gap: 8px;' +
           'min-height: 50px;' +
           'position: relative; overflow: hidden;' +
           'transition: all 0.3s;' +
           'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;' +
           'transform: rotate(-0.25turn); transform-origin: right center;' +
           'pointer-events: auto;';
  }

  function getModalStyles() {
    return 'position: fixed; top: 0; left: 0; right: 0; bottom: 0;' +
           'background: rgba(0,0,0,0.7);' +
           'display: none; justify-content: center; align-items: center;' +
           'z-index: 1000000; overflow-y: auto;' +
           'animation: fadeIn 0.3s ease;' +
           'pointer-events: auto;';
  }

  function getModalContentStyles(bgStyle) {
    return 'background: ' + bgStyle + ';' +
           'border-radius: 15px; max-width: 900px; width: 95%;' +
           'margin: 20px auto; overflow: hidden; position: relative;' +
           'padding: 25px;' +
           'font-family: "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';
  }

  function getCloseButtonStyles() {
    return 'position: absolute; top: 10px; right: 10px;' +
           'background: rgba(0,0,0,0.1); border: 1px solid #fff;' +
           'width: 30px; height: 30px; border-radius: 50%;' +
           'display: flex; align-items: center; justify-content: center;' +
           'font-size: 20px; color: #fff; cursor: pointer; z-index: 100;' +
           'transition: all 0.2s;';
  }

  function getInputStyles() {
    return 'width: 100%; padding: 10px 10px 10px 40px;' +
           'border: 1px solid rgb(80 80 80 / 27%); border-radius: 6px;' +
           'background: rgb(255 255 255); color: #3f3f3f;' +
           'font-size: 13px; outline: none; transition: all 0.3s;';
  }

  function getCheckboxStyles() {
    return 'display: flex; align-items: flex-start; gap: 10px;' +
           'border: dotted rgba(255,255,255,0.5) 1px; border-radius: 7px;' +
           'padding: 10px; cursor: pointer; margin-top: 5px;';
  }

  function getSpinButtonStyles() {
    var bgColor = widgetData.widget.buttonColor || '#d10000';
    var textColor = widgetData.widget.buttonTextColor || '#ffffff';
    return 'display: block; position: relative; overflow: hidden;' +
           'width: 100%; padding: 15px; border: none; border-radius: 10px;' +
           'background: ' + bgColor + '; color: ' + textColor + ';' +
           'font-size: 16px; font-weight: 600; cursor: pointer;' +
           'transition: all 0.3s; text-decoration: none;';
  }

  // ============================================
  // WHEEL SVG GENERATION
  // ============================================

  function generateWheelSVG() {
    var svg = document.getElementById('carkifelek-wheel');
    if (!svg || !widgetData || !widgetData.prizes || widgetData.prizes.length === 0) return;

    var centerX = 50;
    var centerY = 50;
    var radius = 45;
    var numPrizes = widgetData.prizes.length;
    var anglePerPrize = 360 / numPrizes;

    var svgContent = '';

    // Metin kısaltma fonksiyonu
    function truncateText(text, maxChars) {
      if (text.length <= maxChars) return text;
      return text.substring(0, maxChars - 2) + '..';
    }

    // Dilim açısına göre maksimum karakter sayısı
    function getMaxChars(angle) {
      // Dar açılar için daha az karakter
      if (angle <= 30) return 6;
      if (angle <= 45) return 8;
      if (angle <= 60) return 10;
      if (angle <= 90) return 12;
      return 14;
    }

    for (var i = 0; i < numPrizes; i++) {
      var prize = widgetData.prizes[i];
      var startAngle = i * anglePerPrize;
      var endAngle = (i + 1) * anglePerPrize;
      var startRad = (startAngle - 90) * Math.PI / 180;
      var endRad = (endAngle - 90) * Math.PI / 180;

      var x1 = centerX + radius * Math.cos(startRad);
      var y1 = centerY + radius * Math.sin(startRad);
      var x2 = centerX + radius * Math.cos(endRad);
      var y2 = centerY + radius * Math.sin(endRad);

      // Dilim yolu
      var pathData = 'M ' + centerX + ',' + centerY + ' L ' + x1 + ',' + y1 + ' A ' + radius + ',' + radius + ' 0 0,1 ' + x2 + ',' + y2 + ' Z';

      // Metin pozisyonu - biraz daha merkeze yakın
      var textRadius = radius * 0.58;
      var textAngle = startAngle + anglePerPrize / 2;
      var textRad = (textAngle - 90) * Math.PI / 180;
      var textX = centerX + textRadius * Math.cos(textRad);
      var textY = centerY + textRadius * Math.sin(textRad);

      // Metni kısalt
      var maxChars = getMaxChars(anglePerPrize);
      var displayText = truncateText(prize.name || '', maxChars);

      // Font boyutunu açıya göre ayarla
      var fontSize = anglePerPrize <= 30 ? 2.5 : (anglePerPrize <= 45 ? 2.8 : 3);

      svgContent += '<path d="' + pathData + '" fill="' + (prize.color || '#ff0000') + '" stroke="white" stroke-width="0.3" />';
      svgContent += '<text x="' + textX + '" y="' + textY + '" fill="white" font-size="' + fontSize + '" text-anchor="middle" dominant-baseline="middle" transform="rotate(' + (textAngle - 90) + ', ' + textX + ', ' + textY + ')" style="font-weight: 700;">' + displayText + '</text>';
    }

    svg.innerHTML = svgContent;
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

    var svg = document.getElementById('carkifelek-wheel');
    var wheelContainer = document.querySelector('.wheel-container');
    if (!svg) {
      isSpinning = false;
      return;
    }

    // Stop idle animations
    if (wheelContainer) {
      wheelContainer.classList.add('spinning');
    }
    svg.style.animation = 'none';
    svg.style.transition = 'none';

    // Force reflow
    void svg.offsetWidth;

    var prizeIndex = widgetData.prizes.indexOf(prize);
    var numPrizes = widgetData.prizes.length;
    var prizeAngle = 360 / numPrizes;
    var targetAngle = (360 - (prizeIndex * prizeAngle)) - (prizeAngle / 2);
    var rotations = 5;
    var totalRotation = currentRotation + (rotations * 360) + targetAngle;
    currentRotation = totalRotation;

    // Apply transition and rotation
    svg.style.transition = 'transform 5s cubic-bezier(.17,.67,.12,.99)';
    svg.style.transform = 'rotate(' + totalRotation + 'deg)';

    setTimeout(function() {
      isSpinning = false;
      // Re-enable pulse animation on container (but not shake)
      if (wheelContainer) {
        wheelContainer.classList.remove('spinning');
      }
      // Permanently disable shake animation on wrapper - keep wheel at final position
      var shakeWrapper = document.querySelector('.wheel-shake-wrapper');
      if (shakeWrapper) {
        shakeWrapper.style.animation = 'none';
      }

      // Save spin data to localStorage (24 hour limit)
      saveSpinData(prize, fullName, contact);

      // Log to database
      logSpin(prize, fullName, contact);

      showPrizeModal(prize, fullName, contact);
    }, 5000);
  }

  function showPrizeModal(prize, fullName, contact) {
    var modal = document.getElementById('carkifelek-prize-modal');
    var prizeNameEl = document.getElementById('carkifelek-prize-name');
    var prizeDescEl = document.getElementById('carkifelek-prize-desc');
    var couponEl = document.getElementById('carkifelek-coupon-code');
    var couponContainer = document.getElementById('carkifelek-coupon-container');
    var productLink = document.getElementById('carkifelek-product-link');

    if (prizeNameEl) prizeNameEl.textContent = prize.name;
    if (prizeDescEl) prizeDescEl.textContent = prize.description || '';

    // Show coupon code - use first code if multiple
    if (prize.coupon_codes && prize.coupon_codes.trim() !== '') {
      var codes = prize.coupon_codes.split('\n').filter(function(c) { return c.trim(); });
      if (couponEl) couponEl.textContent = codes[0] || prize.coupon_codes;
      if (couponContainer) couponContainer.style.display = 'block';
    } else {
      if (couponContainer) couponContainer.style.display = 'none';
    }

    // Set product link
    if (productLink && prize.redirect_url) {
      productLink.href = prize.redirect_url;
    } else if (productLink) {
      productLink.href = widgetData.shop.url || '#';
    }

    // Show modal
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(function() {
        modal.style.opacity = '1';
      }, 10);
    }
  }

  function showSavedPrize() {
    if (savedSpinData && savedSpinData.prize) {
      showPrizeModal(savedSpinData.prize, savedSpinData.fullName, savedSpinData.contact);
    }
  }

  function closePrizeModal() {
    var modal = document.getElementById('carkifelek-prize-modal');
    if (modal) {
      modal.style.opacity = '0';
      setTimeout(function() {
        modal.style.display = 'none';
      }, 300);
    }

    // Close main modal
    var mainModal = document.getElementById('carkifelek-modal');
    if (mainModal) {
      mainModal.style.display = 'none';
    }
  }

  function copyCouponCode() {
    var couponEl = document.getElementById('carkifelek-coupon-code');
    var copyBtn = document.getElementById('carkifelek-copy-coupon');

    if (couponEl && couponEl.textContent) {
      navigator.clipboard.writeText(couponEl.textContent).then(function() {
        if (copyBtn) {
          copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Kopyalandı!';
          copyBtn.style.background = 'rgba(255,255,255,0.25)';
          copyBtn.style.borderColor = 'rgba(255,255,255,0.4)';
          setTimeout(function() {
            copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Kodu Kopyala';
            copyBtn.style.background = 'rgba(255,255,255,0.1)';
            copyBtn.style.borderColor = 'rgba(255,255,255,0.2)';
          }, 2000);
        }
      });
    }
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  function setupEventListeners() {
    var toggleBtn = document.getElementById('carkifelek-toggle');
    var modal = document.getElementById('carkifelek-modal');
    var closeBtn = document.getElementById('carkifelek-close');
    var spinBtn = document.getElementById('carkifelek-spin');
    var viewPrizeBtn = document.getElementById('carkifelek-view-prize');
    var closePrizeBtn = document.getElementById('carkifelek-close-prize');
    var copyBtn = document.getElementById('carkifelek-copy-coupon');
    var productLink = document.getElementById('carkifelek-product-link');
    var isPhone = widgetData.shop.contactInfoType === 'phone';
    var inputId = isPhone ? 'carkifelek-phone' : 'carkifelek-email';
    var contactInput = document.getElementById(inputId);

    if (!toggleBtn || !modal || !closeBtn) {
      logError('Bazı elementler bulunamadı');
      return;
    }

    // Generate wheel SVG
    generateWheelSVG();

    // Toggle button
    toggleBtn.onclick = function() {
      modal.style.display = 'flex';
      toggleBtn.style.display = 'none';
    };

    // Close button
    closeBtn.onclick = function() {
      modal.style.display = 'none';
      toggleBtn.style.display = 'flex';
    };

    // View Prize button (for users who already spun)
    if (viewPrizeBtn) {
      viewPrizeBtn.onclick = function() {
        showSavedPrize();
      };
    }

    // Spin button (only if user hasn't spun yet)
    if (spinBtn) {
      spinBtn.onclick = function() {
        // Check if already spun today
        if (hasSpunToday) {
          showSavedPrize();
          return;
        }

        var fullNameInput = document.getElementById('carkifelek-fullname');
        var fullName = fullNameInput ? fullNameInput.value.trim() : '';
        var contact = contactInput ? contactInput.value.trim() : '';

      // Validate full name
      if (!fullName) {
        var errorEl = document.getElementById('carkifelek-email-error');
        if (errorEl) {
          errorEl.textContent = 'Lütfen adınızı ve soyadınızı girin';
          errorEl.style.display = 'block';
        }
        return;
      }

      if (fullName.length < 3) {
        var errorEl = document.getElementById('carkifelek-email-error');
        if (errorEl) {
          errorEl.textContent = 'Lütfen geçerli bir ad soyad girin (en az 3 karakter)';
          errorEl.style.display = 'block';
        }
        return;
      }

      // Validate contact
      if (!contact) {
        var errorMsg = isPhone ? 'Lütfen telefon numaranızı girin' : 'Lütfen e-posta adresinizi girin';
        var errorEl = document.getElementById('carkifelek-email-error');
        if (errorEl) {
          errorEl.textContent = errorMsg;
          errorEl.style.display = 'block';
        }
        return;
      }

      if (isPhone) {
        if (!isValidPhone(contact)) {
          var errorEl = document.getElementById('carkifelek-email-error');
          if (errorEl) {
            errorEl.textContent = 'Geçerli bir telefon numarası girin';
            errorEl.style.display = 'block';
          }
          return;
        }
        contact = formatPhone(contact);
      } else {
        if (!isValidEmail(contact)) {
          var errorEl = document.getElementById('carkifelek-email-error');
          if (errorEl) {
            errorEl.textContent = 'Lütfen geçerli bir e-posta adresi giriniz.';
            errorEl.style.display = 'block';
          }
          return;
        }
      }

      // Check KVKK checkbox
      var kvvkCheckbox = document.getElementById('carkifelek-kvvk-checkbox');
      if (!kvvkCheckbox || !kvvkCheckbox.checked) {
        var errorEl = document.getElementById('carkifelek-email-error');
        if (errorEl) {
          errorEl.textContent = 'Devam etmek için izin vermeniz gerekmektedir.';
          errorEl.style.display = 'block';
        }
        return;
      }

      // Hide error
      var errorEl = document.getElementById('carkifelek-email-error');
      if (errorEl) errorEl.style.display = 'none';

      // Check if contact already used
      checkContactUsed(contact, function(err, used) {
        if (err) {
          logError('İletişim kontrol hatası', err);
        }

        if (used) {
          var usedMsg = isPhone ? 'Bu telefon numarası ile zaten çark çevirdiniz!' : 'Bu e-posta ile zaten çark çevirdiniz!';
          var errorEl = document.getElementById('carkifelek-email-error');
          if (errorEl) {
            errorEl.textContent = usedMsg;
            errorEl.style.display = 'block';
          }
          return;
        }

        // Disable form
        spinBtn.disabled = true;
        spinBtn.innerHTML = '<span style="display: inline-flex; align-items: center; gap: 8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> DÖNDÜRÜLÜYOR...</span>';
        if (contactInput) contactInput.disabled = true;
        var fullNameInput = document.getElementById('carkifelek-fullname');
        if (fullNameInput) fullNameInput.disabled = true;

        // Select prize and spin
        selectedPrize = selectPrize();
        spinWheel(selectedPrize, fullName, contact);
      });
      };
    }

    // Close prize modal
    if (closePrizeBtn) {
      closePrizeBtn.onclick = closePrizeModal;
    }

    // Copy coupon
    if (copyBtn) {
      copyBtn.onclick = copyCouponCode;
    }

    // Close modal on backdrop click
    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
        toggleBtn.style.display = 'flex';
      }
    };

    // Enter key
    if (contactInput) {
      contactInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          spinBtn.click();
        }
      });
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

    // API keys'i al
    if (!getConfig()) {
      logError('API konfigürasyonu eksik');
      return;
    }

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
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(720deg); }
    }
    @keyframes pulse {
      0% { transform: scale(1); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3); }
      50% { transform: scale(1.05); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4); }
      100% { transform: scale(1); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3); }
    }
    @keyframes modalAppear {
      to { transform: scale(1); }
    }
    @keyframes spin-shine {
      0% { left: -120%; opacity: 0; }
      15% { opacity: 1; }
      30% { left: 120%; opacity: 0; }
      100% { left: 120%; opacity: 0; }
    }

    #carkifelek-toggle:hover {
      background: #333 !important;
    }
    #carkifelek-toggle:active {
      transform: rotate(-0.25turn) scale(0.98) !important;
    }

    /* Toggle button shine effect */
    #carkifelek-toggle::before {
      content: "";
      position: absolute;
      top: 0;
      left: -120%;
      width: 50%;
      height: 100%;
      background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.45), transparent);
      opacity: 0.9;
      transform: skewX(-20deg);
      animation: toggle-shine 3.5s ease-in-out infinite;
      pointer-events: none;
    }

    @keyframes toggle-shine {
      0% { left: -120%; opacity: 0; }
      15% { opacity: 1; }
      30% { left: 120%; opacity: 0; }
      100% { left: 120%; opacity: 0; }
    }
    #carkifelek-spin:hover {
      background: #b00000 !important;
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3) !important;
    }
    #carkifelek-spin:disabled {
      background-color: #888 !important;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: none !important;
    }
    #carkifelek-close:hover {
      opacity: 0.8;
    }

    #carkifelek-wheel path {
      stroke: rgba(255,255,255,0.35);
    }

    /* Wheel shake animation - wrapper'da uygulanır, SVG'nin transform'ını etkilemez */
    @keyframes wheel-shake {
      0% {
        transform: rotate(-3deg);
      }
      50% {
        transform: rotate(3deg);
      }
      100% {
        transform: rotate(-3deg);
      }
    }

    /* Subtle wheel idle animation - pulse effect on container */
    @keyframes wheelPulse {
      0%, 100%{
        filter: drop-shadow(0 0 15px rgba(209, 0, 0, 0.3));
      }
      50%{
        filter: drop-shadow(0 0 25px rgba(209, 0, 0, 0.5));
      }
    }

    .wheel-container {
      animation: wheelPulse 2s ease-in-out infinite;
    }

    .wheel-container.spinning {
      animation: none !important;
    }

    .wheel-container.spinning .wheel-shake-wrapper {
      animation: none !important;
    }

    .wheel-container.spinning::after{
      display: none !important;
    }

    /* Sparkle effect on idle */
    .wheel-container::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 10px;
      height: 10px;
      background: radial-gradient(circle, rgba(255, 206, 1, 0.8) 0%, transparent 70%);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: sparkle 1.5s ease-in-out infinite;
      pointer-events: none;
      z-index: 15;
    }

    @keyframes sparkle {
      0%, 100%{
        opacity: 0;
        transform: translate(-50%, -50%) scale(0);
      }
      50%{
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.5);
      }
    }

    /* Spin button shine effect */
    #carkifelek-spin::before {
      content: "";
      position: absolute;
      top: 0;
      left: -120%;
      width: 50%;
      height: 100%;
      background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.45), transparent);
      opacity: 0.9;
      transform: skewX(-20deg);
      animation: spin-shine 3.5s ease-in-out infinite;
      pointer-events: none;
    }

    /* Desktop Horizontal Layout */
    @media (min-width: 768px) {
      .carkifelek-modal-content {
        display: flex;
        justify-content: center;
        align-items:center;
        min-height: 500px !important;
        padding: 35px !important;
      }

      .carkifelek-layout {
        flex-direction: row !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 40px !important;
        height: 100%;
      }

      .carkifelek-wheel-side {
        width: 340px !important;
        max-width: 45% !important;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .carkifelek-wheel-side .wheel-container {
        width: 100% !important;
        height: auto !important;
        aspect-ratio: 1 !important;
        max-width: 340px !important;
      }

      .carkifelek-form-side {
        width: 100% !important;
        max-width: 400px !important;
        flex: 1 !important;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .carkifelek-form-side > div {
        text-align: left !important;
      }

      .carkifelek-form-side h2 {
        text-align: center !important;
        font-size: 24px !important;
        margin-bottom: 0px !important;
      }

      .carkifelek-form-side p {
        text-align: center !important;
        font-size: 14px !important;
      }
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
