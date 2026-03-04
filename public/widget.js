/**
 * Çarkıfelek Widget - Red Premium Edition
 * Version 9.0.0 - Dinamik UI oluşturma desteği
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================

  var SUPABASE_URL = null;
  var SUPABASE_ANON_KEY = null;
  var shopToken = null;
  var shopId = null;
  var widgetContainer = null;
  var isDynamicWidget = false;

  function initConfig() {
    // Script tag'den konfigürasyon al
    var scriptTag = document.getElementById('carkifelek-widget-script');
    if (scriptTag) {
      SUPABASE_URL = scriptTag.getAttribute('data-supabase-url')?.trim();
      SUPABASE_ANON_KEY = scriptTag.getAttribute('data-supabase-key')?.trim();
      shopToken = scriptTag.getAttribute('data-shop-token') || scriptTag.getAttribute('data-token');
      shopId = scriptTag.getAttribute('data-shop-id');

      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        isDynamicWidget = true;
        return true;
      }
    }

    // DIV container'dan al (eski yöntem)
    var widget = document.getElementById('carkifelek-widget');
    if (!widget) {
      console.error('[Çarkıfelek] Widget bulunamadı');
      return false;
    }

    SUPABASE_URL = widget.getAttribute('data-supabase-url')?.trim();
    SUPABASE_ANON_KEY = widget.getAttribute('data-supabase-key')?.trim();
    shopToken = widget.getAttribute('data-token') || widget.getAttribute('data-shop-token');
    shopId = widget.getAttribute('data-shop-id');
    widgetContainer = widget;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('[Çarkıfelek] API konfigürasyonu eksik');
      return false;
    }

    return true;
  }

  // ============================================
  // ŞİFRELEME YARDIMCILARI
  // ============================================

  function encode(str) {
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
  var supabaseClient = null;
  var selectedPrize = null;
  var hasSpunToday = false;
  var savedSpinData = null;

  // ============================================
  // LOCAL STORAGE HELPERS
  // ============================================

  function getStorageKey() {
    return 'carkifelek_spin_' + (shopId || 'default');
  }

  function saveSpinData(prize, fullName, contact) {
    var key = getStorageKey();
    var data = {
      prize: prize,
      fullName: fullName,
      contact: contact,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    };
    try {
      var encrypted = encode(JSON.stringify(data));
      localStorage.setItem(key, encrypted);
      savedSpinData = data;
      hasSpunToday = true;
    } catch (e) {
      console.error('[Çarkıfelek] LocalStorage kayıt hatası', e);
    }
  }

  function getSpinData() {
    var key = getStorageKey();
    try {
      var encrypted = localStorage.getItem(key);
      if (encrypted) {
        var decrypted = decode(encrypted);
        if (decrypted) {
          var parsed = JSON.parse(decrypted);
          if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
            return parsed;
          } else {
            localStorage.removeItem(key);
            return null;
          }
        }
      }
    } catch (e) {
      console.error('[Çarkıfelek] LocalStorage okuma hatası', e);
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
    return Math.max(0, Math.floor(remaining / 1000 / 60));
  }

  // ============================================
  // SUPABASE SDK LOADER
  // ============================================

  function loadSupabaseSDK(callback) {
    if (window.supabase) {
      try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[Çarkıfelek] Supabase client hazır');
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
        console.log('[Çarkıfelek] Supabase SDK yüklendi');
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
        console.log('[Çarkıfelek] Widget verisi yüklendi', widget);

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
  // DINAMİK WIDGET UI OLUŞTURMA
  // ============================================

  function createWidgetUI() {
    if (!widgetData || !isDynamicWidget) return;

    // Widget container'ı oluştur veya bul
    var container = document.getElementById('carkifelek-widget');
    if (!container) {
      // Script tag'in olduğu yere container ekle
      var scriptTag = document.getElementById('carkifelek-widget-script');
      container = document.createElement('div');
      container.id = 'carkifelek-widget';
      container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;';
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.insertBefore(container, scriptTag.nextSibling);
      } else {
        document.body.appendChild(container);
      }
    }

    widgetContainer = container;

    // Widget HTML'i oluştur
    var prizes = widgetData.prizes;
    var settings = widgetData.settings;
    var shop = widgetData.shop;

    // Çark segmentleri için SVG path'leri oluştur
    var segments = '';
    if (prizes && prizes.length > 0) {
      var anglePerPrize = 360 / prizes.length;
      var radius = 45;
      var centerX = 50;
      var centerY = 50;

      prizes.forEach(function(prize, index) {
        var startAngle = index * anglePerPrize;
        var endAngle = (index + 1) * anglePerPrize;
        var startRad = (startAngle - 90) * Math.PI / 180;
        var endRad = (endAngle - 90) * Math.PI / 180;

        var x1 = centerX + radius * Math.cos(startRad);
        var y1 = centerY + radius * Math.sin(startRad);
        var x2 = centerX + radius * Math.cos(endRad);
        var y2 = centerY + radius * Math.sin(endRad);

        var pathData = 'M ' + centerX + ',' + centerY + ' L ' + x1 + ',' + y1 + ' A ' + radius + ',' + radius + ' 0 0,1 ' + x2 + ',' + y2 + ' Z';

        var displayName = prize.name.length > 12 ? prize.name.substring(0, 12) + '...' : prize.name;
        displayName = displayName.replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // Metin pozisyonu
        var textRadius = radius * 0.65;
        var textAngle = startAngle + anglePerPrize / 2;
        var textRad = (textAngle - 90) * Math.PI / 180;
        var textX = centerX + textRadius * Math.cos(textRad);
        var textY = centerY + textRadius * Math.sin(textRad);

        segments += '<path d="' + pathData + '" fill="' + (prize.color || '#ff0000') + '" stroke="white" stroke-width="0.3"/>';
        segments += '<text x="' + textX + '" y="' + textY + '" fill="white" font-size="3" text-anchor="middle" dominant-baseline="middle" transform="rotate(' + (textAngle - 90) + ', ' + textX + ', ' + textY + ')" style="text-transform: uppercase; font-weight: 700;">' + displayName + '</text>';
      });
    }

    // Widget HTML
    var html = '      <div style="background: ' + settings.backgroundColor + '; border-radius: 16px; padding: 16px; max-width: 320px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);">' +
'        <!-- Logo -->' +
        (shop.logo ? '<div style="text-align: center; margin-bottom: 12px;"><img src="' + shop.logo + '" alt="Logo" style="height: 40px; max-width: 100px; object-fit: contain;"></div>' : '') +
'        <!-- Info -->' +
'        <div style="text-align: center; margin-bottom: 12px;">' +
'          <p style="color: white; font-size: 18px; font-weight: bold; margin: 0 0 4px 0;">' + settings.title + '</p>' +
'          <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0;">' + settings.description + '</p>' +
'        </div>' +
'        <!-- Form -->' +
'        <form id="carkifelek-form" style="margin-bottom: 12px;">' +
'          <input type="text" name="fullName" placeholder="Adınız Soyadınız" required style="width: 100%; padding: 10px 12px; border: none; border-radius: 8px; margin-bottom: 8px; font-size: 14px; box-sizing: border-box;">' +
'          <input type="text" name="contact" placeholder="' + (shop.contactInfoType === 'phone' ? 'Telefon numaranız' : 'E-posta adresiniz') + '" required style="width: 100%; padding: 10px 12px; border: none; border-radius: 8px; margin-bottom: 8px; font-size: 14px; box-sizing: border-box;">' +
'          <button type="submit" class="cf-spin-btn" style="width: 100%; padding: 12px; background: ' + settings.buttonColor + '; color: white; border: none; border-radius: 24px; font-size: 14px; font-weight: bold; cursor: pointer; position: relative; overflow:hidden; box-shadow: 0 4px 0 rgba(0,0,0,0.2); transition: transform 0.1s;">' +
'            <span class="cf-btn-text">' + settings.buttonText + '</span>' +
'          </button>' +
'        </form>' +
'        <!-- Wheel -->' +
'        <svg id="carkifelek-wheel" viewBox="0 0 100 100" style="width: 200px; height: 200px; display: block; margin: 0 auto; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));">' +
'          ' + segments +
'        </svg>' +
'        <!-- Center circle -->' +
'        <div style="position: absolute; width: 30px; height: 30px; background: white; border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); box-shadow: 0 0 10px rgba(0,0,0,0.2); pointer-events: none;"></div>' +
'        <!-- Marker -->' +
'        <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 15px solid transparent; border-right: 15px solid transparent; border-top: 25px solid #ffce01; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3)); pointer-events: none;"></div>' +
'      </div>' +
'      <!-- Close button -->' +
'      <button onclick="document.getElementById(\'carkifelek-widget\').style.display=\'none\'" style="position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.2); border: none; color: white; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">×</button>';

    container.innerHTML = html;

    // Çark container'ı pozisyonla
    var wheelContainer = container.querySelector('svg')?.parentElement;
    if (wheelContainer) {
      wheelContainer.style.position = 'relative';
      wheelContainer.style.display = 'inline-block';
    }
  }

  // ============================================
  // WHEEL SPIN LOGIC
  // ============================================

  function spinWheel(prizeIndex) {
    var wheel = document.getElementById('carkifelek-wheel');
    if (!wheel) return 0;

    var prizes = widgetData.prizes;
    var prizeCount = prizes.length;
    var anglePerPrize = 360 / prizeCount;
    var targetAngle = 270 + (prizeIndex * anglePerPrize) + (anglePerPrize / 2);
    var spinDuration = 5000;
    var spinCount = 5;

    currentRotation = currentRotation + (360 * spinCount) + (targetAngle - (currentRotation % 360));

    wheel.style.transition = 'transform ' + spinDuration + 'ms cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    wheel.style.transform = 'rotate(' + currentRotation + 'deg)';

    return spinDuration;
  }

  // ============================================
  // FORM HANDLING
  // ============================================

  function handleFormSubmit(formData) {
    var sanitized = {
      fullName: formData.fullName ? formData.fullName.trim().replace(/[<>]/g, '') : '',
      contact: formData.contact ? formData.contact.trim().replace(/[<>]/g, '') : ''
    };

    var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized.contact);
    var isPhone = /^(\+?90|0)?5\d{9}$/.test(sanitized.contact.replace(/\s/g, '').replace(/\(/g, '').replace(/\)/g, '').replace(/-/g, ''));

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

    loadSupabaseSDK(function(err) {
      if (err) {
        console.error('[Çarkıfelek] SDK yükleme hatası:', err);
        return;
      }

      fetchWidgetData(shopToken, function(err, data) {
        if (err) {
          console.error('[Çarkıfelek] Veri yükleme hatası:', err);
          return;
        }

        // Dinamik UI oluştur
        if (isDynamicWidget) {
          createWidgetUI();
        }

        // Form submission handler
        var form = document.getElementById('carkifelek-form');
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

            // Button'u disable et
            var btn = form.querySelector('.cf-spin-btn');
            if (btn) {
              btn.disabled = true;
              btn.querySelector('.cf-btn-text').textContent = 'ÇEVİRİLİYOR...';
            }

            setTimeout(function() {
              var prize = widgetData.prizes[randomPrizeIndex];
              alert('🎉 Tebrikler! Kazandınız: ' + prize.name);

              saveSpinData(prize, result.data.fullName, result.data.contact);

              isSpinning = false;
              if (btn) {
                btn.disabled = false;
                btn.querySelector('.cf-btn-text').textContent = widgetData.settings.buttonText;
              }
            }, spinDuration + 500);
          });
        }

        // Check if already spun
        if (checkIfSpunToday()) {
          var remaining = getTimeRemaining();
          if (remaining > 0) {
            alert('Bugün zaten çevirdiniz! ' + remaining + ' dakika sonra tekrar deneyin.');
            var form = document.getElementById('carkifelek-form');
            if (form) {
              form.style.display = 'none';
            }
          }
        }
      });
    });
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
