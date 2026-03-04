/**
 * Çarkıfelek Widget - Red Premium Edition
 * Design matching wheel-widget-2.js
 * Version 7.0.0 - GÜVENLİK YAMALAR ILE
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================

  // GÜVENLİK: API keys hardcoded değil, data attributes'ten alınıyor
  var SUPABASE_URL = null;
  var SUPABASE_ANON_KEY = null;

  function initConfig() {
    var widget = document.getElementById('carkifelek-widget');
    if (!widget) {
      console.error('[Çarkıfelek] Widget container bulunamadı');
      return false;
    }

    SUPABASE_URL = widget.getAttribute('data-supabase-url');
    SUPABASE_ANON_KEY = widget.getAttribute('data-supabase-key');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('[Çarkıfelek] API konfigürasyonu eksik');
      return false;
    }

    return true;
  }

  // ============================================
  // ŞİFRELEME YARDIMCILARI (Basit XOR şifreleme)
  // ============================================

  function encode(str) {
    // Base64 + XOR encoding ile basit şifreleme
    var encoded = btoa(encodeURIComponent(str));
    var key = 'carkifelek2024';
    var result = '';
    for (var i = 0; i < encoded.length; i++) {
      result += String.fromCharCode(encoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  }

  function decode(str) {
    try {
      var key = 'carkifelek2024';
      var decoded = atob(str);
      var result = '';
      for (var i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return decodeURIComponent(atob(result));
    } catch (e) {
      return null;
    }
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
  // LOCAL STORAGE HELPERS (ŞİFRELİ)
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
      // GÜVENLİK: Verileri şifreleyerek kaydet
      var encrypted = encode(JSON.stringify(data));
      localStorage.setItem(key, encrypted);
      savedSpinData = data;
      hasSpunToday = true;
    } catch (e) {
      logError('LocalStorage kayıt hatası', e);
    }
  }

  function getSpinData() {
    var key = getStorageKey();
    try {
      var encrypted = localStorage.getItem(key);
      if (encrypted) {
        // GÜVENLİK: Şifre çöz
        var decrypted = decode(encrypted);
        if (decrypted) {
          var parsed = JSON.parse(decrypted);
          // 24 saat geçmiş mi kontrol et
          if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
            return parsed;
          } else {
            // Süresi dolmuş, sil
            localStorage.removeItem(key);
            return null;
          }
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

    // GÜVENLİK: Token validation
    if (!token || typeof token !== 'string' || token.length < 10) {
      callback(new Error('Geçersiz token'));
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
          prizes: widget.prizes || [],
          settings: {
            title: widget.title || 'Çarkı Çevir Hediyeni Kazan!',
            description: widget.description || 'Hediyeni almak için çarkı çevir.',
            buttonText: widget.button_text || 'ÇARKI ÇEVİR',
            backgroundColor: widget.background_color || 'rgba(139, 0, 0, 0.9)',
            buttonColor: widget.button_color || '#d10000',
            showOnLoad: widget.show_on_load === true,
            popupDelay: widget.popup_delay || 0
          }
        };

        callback(null, widgetData);
      })
      .catch(function(error) {
        callback(error);
      });
  }

  // ============================================
  // UI UPDATE FUNCTIONS
  // ============================================

  function updateUI() {
    if (!widgetData) return;

    var widget = document.getElementById('carkifelek-widget');

    // Logo
    var logoContainer = widget.querySelector('.cf-logo');
    if (logoContainer && widgetData.shop.logo) {
      logoContainer.src = widgetData.shop.logo;
    }

    // Info
    var infoTitle = widget.querySelector('.cf-info-title');
    var infoDesc = widget.querySelector('.cf-info-desc');
    if (infoTitle) infoTitle.textContent = widgetData.settings.title;
    if (infoDesc) infoDesc.textContent = widgetData.settings.description;

    // Button
    var spinBtn = widget.querySelector('.cf-spin-btn');
    if (spinBtn) {
      spinBtn.textContent = widgetData.settings.buttonText;
      spinBtn.style.backgroundColor = widgetData.settings.buttonColor;
    }
  }

  // ============================================
  // WHEEL SPIN LOGIC
  // ============================================

  function spinWheel(prizeIndex) {
    var wheel = document.getElementById('carkifelek-wheel');
    if (!wheel) return;

    var prizes = widgetData.prizes;
    var prizeCount = prizes.length;
    var anglePerPrize = 360 / prizeCount;
    var targetAngle = 270 + (prizeIndex * anglePerPrize) + (anglePerPrize / 2);
    var spinDuration = 5000;
    var spinCount = 5; // Tam tur sayısı

    currentRotation = currentRotation + (360 * spinCount) + (targetAngle - (currentRotation % 360));

    wheel.style.transition = 'transform ' + spinDuration + 'ms cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    wheel.style.transform = 'rotate(' + currentRotation + 'deg)';

    return spinDuration;
  }

  // ============================================
  // FORM HANDLING
  // ============================================

  function handleFormSubmit(formData) {
    // GÜVENLİK: Input sanitization
    var sanitized = {
      fullName: formData.fullName ? formData.fullName.trim().replace(/[<>]/g, '') : '',
      contact: formData.contact ? formData.contact.trim().replace(/[<>]/g, '') : ''
    };

    var isEmail = isValidEmail(sanitized.contact);
    var isPhone = isValidPhone(sanitized.contact);

    if (!isEmail && !isPhone) {
      return { success: false, error: 'Geçerli bir e-posta veya telefon numarası girin' };
    }

    if (isEmail && widgetData.shop.contactInfoType === 'phone') {
      return { success: false, error: 'Lütfen telefon numaranızı girin' };
    }

    if (isPhone && widgetData.shop.contactInfoType === 'email') {
      return { success: false, error: 'Lütfen e-posta adresinizi girin' };
    }

    return { success: true, data: sanitized };
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    if (!initConfig()) {
      console.error('[Çarkıfelek] Konfigürasyon hatası');
      return;
    }

    var widget = document.getElementById('carkifelek-widget');
    var token = widget.getAttribute('data-token');

    if (!token) {
      console.error('[Çarkıfelek] Token bulunamadı');
      return;
    }

    shopUuid = widget.getAttribute('data-shop-id');

    loadSupabaseSDK(function(err) {
      if (err) {
        console.error('[Çarkıfelek] SDK yükleme hatası:', err);
        return;
      }

      fetchWidgetData(token, function(err, data) {
        if (err) {
          console.error('[Çarkıfelek] Veri yükleme hatası:', err);
          return;
        }

        updateUI();

        // Form submission handler
        var form = widget.querySelector('form');
        if (form) {
          form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (isSpinning) return;

            var formData = new FormData(form);
            var fullName = formData.get('fullName') || '';
            var contact = formData.get('contact') || '';

            var result = handleFormSubmit({ fullName, contact });

            if (!result.success) {
              alert(result.error);
              return;
            }

            // Spin the wheel
            isSpinning = true;
            var randomPrizeIndex = Math.floor(Math.random() * widgetData.prizes.length);
            var spinDuration = spinWheel(randomPrizeIndex);

            setTimeout(function() {
              // Show prize
              var prize = widgetData.prizes[randomPrizeIndex];
              alert('Tebrikler! Kazandınız: ' + prize.name);

              // Save spin data (encrypted)
              saveSpinData(prize, result.data.fullName, result.data.contact);

              isSpinning = false;
            }, spinDuration + 500);
          });
        }

        // Check if already spun
        if (checkIfSpunToday()) {
          var remaining = getTimeRemaining();
          if (remaining > 0) {
            alert('Bugün zaten çevirdiniz! ' + remaining + ' dakika sonra tekrar deneyin.');
          }
        }
      });
    });
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
