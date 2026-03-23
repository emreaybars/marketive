/**
 * Çarkıfelek Widget - Red Premium Edition
 * Version 7.1.0 - API Key Pattern
 * 
 * GÜVENLİK: Bu widget artık doğrudan Supabase'e bağlanmıyor.
 * Tüm istekler proxy API üzerinden API Key ile yapılıyor.
 */

(function () {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================

    var API_URL = null;
    var API_KEY = null;
    var WIDGET_POSITION = 'middle-right'; // default position

    function getConfig() {
        var widget = document.getElementById('carkifelek-widget');
        var script = document.getElementById('carkifelek-widget-script');

        if (widget) {
            API_URL = widget.getAttribute('data-api-url');
            API_KEY = widget.getAttribute('data-api-key');
            WIDGET_POSITION = widget.getAttribute('data-widget-position') || 'middle-right';
        }

        // Script tag'den de key alınabilir (backward compatibility)
        if (!API_KEY && script) {
            API_KEY = script.getAttribute('data-api-key');
        }

        // API URL yoksa script src'sinden türet
        if (!API_URL && script) {
            var src = script.getAttribute('src');
            if (src) {
                var url = new URL(src);
                API_URL = url.origin + '/api/widget';
            }
        }

        return API_URL && API_KEY;
    }

    // ============================================
    // API CLIENT
    // ============================================

    var apiClient = {
        get: function (endpoint, params) {
            var url = API_URL + endpoint;
            if (params) {
                var queryString = Object.keys(params)
                    .map(function (key) { return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]); })
                    .join('&');
                url += '?' + queryString;
            }

            return fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (response) { return response.json(); });
        },

        post: function (endpoint, data) {
            return fetch(API_URL + endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(function (response) { return response.json(); });
        }
    };

    // ============================================
    // STATE
    // ============================================

    var widgetData = null;
    var isSpinning = false;
    var currentRotation = 0;
    var shopUuid = null;
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

    function formatTimeRemaining(minutes) {
        var hours = Math.floor(minutes / 60);
        var mins = minutes % 60;
        return hours > 0 ? hours + ' saat ' + mins + ' dakika' : mins + ' dakika';
    }

    // ============================================
    // LOGGING
    // ============================================

    function log() {
        if (console && console.log) {
            console.log.apply(console, ['[Çarkıfelek]'].concat(Array.prototype.slice.call(arguments)));
        }
    }

    function logError() {
        if (console && console.error) {
            console.error.apply(console, ['[Çarkıfelek HATA]'].concat(Array.prototype.slice.call(arguments)));
        }
    }

    // ============================================
    // VALIDATION
    // ============================================

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
    // API FUNCTIONS
    // ============================================

    async function loadWidgetData() {
        try {
            log('Widget verileri yükleniyor...');
            var data = await apiClient.get('/data', { api_key: API_KEY });

            if (data.error) {
                logError('API Hatası:', data.error);
                return false;
            }

            widgetData = data;
            shopUuid = data.shop ? data.shop.uuid : null;

            // Update widget position from database if available
            if (data.widget && data.widget.widgetPosition) {
                WIDGET_POSITION = data.widget.widgetPosition;
                log('Widget pozisyonu veritabanından güncellendi:', WIDGET_POSITION);
            }

            log('Widget verileri yüklendi:', data.shop ? data.shop.name : 'Bilinmiyor');
            return true;
        } catch (err) {
            logError('Veri yükleme hatası:', err);
            return false;
        }
    }

    async function checkContactUsed(contact, callback) {
        try {
            var data = await apiClient.post('/check-contact', {
                api_key: API_KEY,
                contact: contact
            });

            callback(null, data.exists);
        } catch (err) {
            callback(err, false);
        }
    }

    async function logSpin(prize, fullName, contact) {
        // Server-side already saved the spin and returned coupon code
        // This function is now just for logging purposes
        if (!prize || !contact) return;
        log('Spin tamamlandı:', prize.id, fullName, contact);
    }

    async function trackWidgetView() {
        if (!shopUuid) return;

        try {
            await apiClient.post('/view', {
                api_key: API_KEY,
                user_agent: navigator.userAgent,
                referrer: document.referrer
            });
        } catch (err) {
            // Tracking hatalarını görmezden gel
        }
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
        container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999999;';
        container.innerHTML = buildWidgetHTML();
        document.body.appendChild(container);

        setupEventListeners();
        trackWidgetView();

        // Animation entry ve otomatik modal açma
        setTimeout(function () {
            var widgetEl = document.getElementById('carkifelek-widget');
            if (widgetEl) {
                widgetEl.style.opacity = '1';
            }

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
                var toggleBtn = document.getElementById('carkifelek-toggle');
                if (toggleBtn) {
                    toggleBtn.style.display = 'flex';
                }
            }
        }, 100);
    }

    function buildWidgetHTML() {
        var shop = widgetData.shop;
        var widget = widgetData.widget;
        var prizes = widgetData.prizes;

        var isPhone = shop.contactInfoType === 'phone';
        var inputPlaceholder = isPhone ? '5xx xxx xx xx' : 'ornek@example.com';
        var inputType = isPhone ? 'tel' : 'email';
        var inputId = isPhone ? 'carkifelek-phone' : 'carkifelek-email';

        var bgStyle = widget.backgroundColor || 'rgba(139, 0, 0, 0.9)';

        // Check if user has already spun today
        checkIfSpunToday();

        // Build form content based on spin state
        var formContent = '';
        if (hasSpunToday && savedSpinData) {
            // Already spun - show prize info
            var timeRemaining = getTimeRemaining();
            var timeText = formatTimeRemaining(timeRemaining);

            formContent =
                '<div id="carkifelek-form" style="width: 100%; max-width: 350px; margin: 0 auto; text-align: center;">' +
                '<div style="background: rgba(255,255,255,0.15); border-radius: 12px; padding: 20px; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.2);">' +
                '<div style="font-size: 40px; margin-bottom: 10px;text-align:center;">🎁</div>' +
                '<h3 style="color: #fff; font-size: 16px; margin: 0 0 8px 0; font-weight: 600;text-align:center;">Çarkı Zaten Çevirdiniz!</h3>' +
                '<p style="color: rgba(255,255,255,0.9); font-size: 13px; margin: 0 0 15px 0; line-height: 1.5;">Kazandığınız ödül: <strong>' + escapeHtml(savedSpinData.prize ? savedSpinData.prize.name : 'Ödül') + '</strong></p>' +
                '<button id="carkifelek-view-prize" style="background: linear-gradient(90deg, #ffffff 0%, #c9c9c9 100%); color: #1a1a1a; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; width: 100%; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">Ödülümü Gör</button>' +
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
                '<span id="carkifelek-spin-text">' + escapeHtml(widget.buttonText || 'ÇARKI ÇEVİR') + '</span>' +
                '</button>' +
                '</div>';
        }

        // Position-specific CSS class
        var positionClass = 'carkifelek-position-' + WIDGET_POSITION.replace('-', '');

        return '<div id="carkifelek-widget" data-widget-position="' + WIDGET_POSITION + '" style="' + getWidgetStyles() + '">' +
            '<button id="carkifelek-toggle" class="' + positionClass + '" data-position="' + WIDGET_POSITION + '" style="' + getToggleButtonStyles(widget.backgroundColor, widgetData.shop.buttonTextColor) + '">' +
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
            '<div class="wheel-container" style="position: relative; width: min(70vw, 280px); height: min(70vw, 280px); margin: 0 auto; background: url(https://qiiygcclanmgzlrcpmle.supabase.co/storage/v1/object/public/widget/cark-circle.png); background-position: center; background-size: cover;">' +
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
            '<svg id="carkifelek-wheel" viewBox="0 0 100 100" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; padding: 12px; transform: rotate(0deg); pointer-events: none; background: url(https://carkifelek.io/asgr04w.jpeg) no-repeat center / contain;"></svg>' +
            '</div>' +
            // Center with logo
            '<div style="position: absolute; width: 15%; height: 15%; background: #fff; border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; box-shadow: 0 0 18px 4px rgba(0,0,0,0.17); overflow: hidden; display: flex; align-items: center; justify-content: center;">' +
            (shop.logo ?
                '<img src="' + escapeHtml(shop.logo) + '" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; padding: 2px;" />' :
                '<div style="position: absolute; width: 70%; height: 70%; background: #f0f0f0; border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); box-shadow: inset 0 0 5px rgba(0,0,0,0.2);"></div>'
            ) +
            '</div>' +
            '</div>' +
            '</div>' +

            // RIGHT SIDE - FORM
            '<div class="carkifelek-form-side" style="width: 100%; max-width: 320px;">' +
            // 2. TITLE (Başlık)
            '<div style="text-align: center; margin-bottom: 5px;">' +
            '<h2 style="color: ' + (widget.titleColor || '#fff') + '; font-size: 18px; font-weight: 700; margin: 0;">' + escapeHtml(widget.title || 'Çarkı Çevir<br/>Hediyeni Kazan!') + '</h2>' +
            '</div>' +

            // 3. DESCRIPTION (Açıklama)
            '<div style="text-align: center; margin-bottom: 12px;">' +
            '<p style="color: ' + (widget.descriptionColor || '#fff') + '; font-size: 12px; margin: 0; opacity: 0.9;">' + escapeHtml(widget.description || 'Hediyeni almak için hemen çarkı çevir.') + '</p>' +
            '</div>' +

            // 4. FORM CONTENT (Dynamic based on spin state)
            formContent +

            // 5. BUTTON CONTENT (Dynamic based on spin state)
            buttonContent +

            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +

            // Success Modal - Monochrome Premium Design
            '<div id="carkifelek-prize-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); z-index: 1000001; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; pointer-events: auto;">' +
            '<div style="background: linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%); width: 90%; max-width: 340px; border-radius: 20px; padding: 0; text-align: center; position: relative; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0,0,0,0.05); transform: scale(0.9); animation: modalAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; overflow: hidden;">' +
            // Header with confetti decoration
            '<div style="background: ' + widget.backgroundColor + '; padding: 25px 20px 20px; position: relative;">' +
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
            '<div id="carkifelek-coupon-container" style="background: ' + widget.backgroundColor + '; border-radius: 12px; padding: 16px; margin-bottom: 16px; position: relative;">' +
            '<div style="background: transparent; padding: 0 0 15px 0px; font-size: 14px; color: #fff; text-transform: uppercase; letter-spacing: 1px;">Kupon Kodu</div>' +
            '<div style="border: 1px dashed rgba(255,255,255,0.3); padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.05);">' +
            '<div id="carkifelek-coupon-code" style="font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 2px; font-family: \'Courier New\', monospace;"></div>' +
            '</div>' +
            '<button id="carkifelek-copy-coupon" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 10px 16px; border-radius: 8px; margin-top: 12px; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; width: 100%; justify-content: center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Kodu Kopyala</button>' +
            '</div>' +
            // Buttons
            '<div style="display: flex; gap: 10px;">' +
            '<a id="carkifelek-product-link" href="#" target="_blank" style="flex: 1; padding: 14px 16px; border-radius: 10px; font-size: 14px; cursor: pointer; text-align: center; text-decoration: none; font-weight: 600; background: ' + widget.backgroundColor + '; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: all 0.2s;">Alışverişe Başla</a>' +
            '<button id="carkifelek-close-prize" style="flex: 1; padding: 14px 16px; border-radius: 10px; font-size: 14px; cursor: pointer; text-align: center; font-weight: 600; background: #f5f5f5; color: #555; border: 1px solid #e0e0e0; transition: all 0.2s;">Kapat</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
    }

    // ============================================
    // STYLES - RED PREMIUM DESIGN
    // ============================================

    function getWidgetStyles() {
        var positionStyles = '';
        var rotateStyles = '';

        switch (WIDGET_POSITION) {
            case 'top-right':
                positionStyles = 'top: 20px; right: -53px;';
                rotateStyles = 'rotate: -90deg;';
                break;
            case 'top-left':
                positionStyles = 'top: 20px; left: -53px;';
                rotateStyles = 'rotate: 90deg;';
                break;
            case 'middle-right':
                positionStyles = 'top: 50%; right: -53px; transform: translateY(-50%);';
                rotateStyles = 'rotate: -90deg;';
                break;
            case 'middle-left':
                positionStyles = 'top: 50%; left: -53px; transform: translateY(-50%);';
                rotateStyles = 'rotate: 90deg;';
                break;
            case 'bottom-right':
                positionStyles = 'bottom: 20px; right: -53px;';
                rotateStyles = 'rotate: -90deg;';
                break;
            case 'bottom-left':
                positionStyles = 'bottom: 20px; left: -53px;';
                rotateStyles = 'rotate: 90deg;';
                break;
            default:
                positionStyles = 'top: 50%; right: -53px; transform: translateY(-50%);';
                rotateStyles = 'rotate: -90deg;';
        }

        return 'position: fixed; ' + positionStyles + ' z-index: 999999;' +
            'opacity: 1; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); pointer-events: all;';
    }

    function getToggleButtonStyles(bgColor, textColor) {
        var bg = bgColor || '#1a1a1a';
        var color = textColor || '#ffffff';
        var rotate = '';
        var transformOrigin = '';
        var boxShadow = '';

        switch (WIDGET_POSITION) {
            case 'top-right':
                rotate = 'rotate(-90deg)';
                transformOrigin = 'right center';
                boxShadow = '-4px 4px 20px rgba(0, 0, 0, 0.3)';
                break;
            case 'top-left':
                rotate = 'rotate(90deg)';
                transformOrigin = 'left center';
                boxShadow = '4px 4px 20px rgba(0, 0, 0, 0.3)';
                break;
            case 'middle-right':
                rotate = 'rotate(-90deg)';
                transformOrigin = 'right center';
                boxShadow = '-4px 4px 20px rgba(0, 0, 0, 0.3)';
                break;
            case 'middle-left':
                rotate = 'rotate(90deg)';
                transformOrigin = 'left center';
                boxShadow = '4px 4px 20px rgba(0, 0, 0, 0.3)';
                break;
            case 'bottom-right':
                rotate = 'rotate(-90deg)';
                transformOrigin = 'right center';
                boxShadow = '-4px -4px 20px rgba(0, 0, 0, 0.3)';
                break;
            case 'bottom-left':
                rotate = 'rotate(90deg)';
                transformOrigin = 'left center';
                boxShadow = '4px -4px 20px rgba(0, 0, 0, 0.3)';
                break;
            default:
                rotate = 'rotate(-90deg)';
                transformOrigin = 'right center';
                boxShadow = '-4px 4px 20px rgba(0, 0, 0, 0.3)';
        }

        return 'background: ' + bg + ';' +
            'color: ' + color + ';' + rotate +
            'border: none; padding: 12px 20px; border-radius: 3px;' +
            'font-size: 14px; font-weight: 600; cursor: pointer;' +
            'box-shadow: ' + boxShadow + ';' +
            'display: flex; align-items: center; justify-content: center; gap: 8px;' +
            'min-height: 50px;' +
            'position: relative; overflow: visible;' +
            'transition: all 0.3s;' +
            'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;' +
            'transform-origin: ' + transformOrigin + ';' +
            'pointer-events: auto; ' + rotate + ';';
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

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
            if (angle <= 30) return 8;
            if (angle <= 45) return 10;
            if (angle <= 60) return 12;
            if (angle <= 90) return 14;
            return 16;
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

            // Metin pozisyonu
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

        // Use prize ID for matching instead of object comparison
        var prizeIndex = widgetData.prizes.findIndex(function(p) { return p.id === prize.id; });
        var numPrizes = widgetData.prizes.length;
        var prizeAngle = 360 / numPrizes;
        var targetAngle = (360 - (prizeIndex * prizeAngle)) - (prizeAngle / 2);
        var rotations = 5;
        var totalRotation = currentRotation + (rotations * 360) + targetAngle;
        currentRotation = totalRotation;

        // Apply transition and rotation
        svg.style.transition = 'transform 5s cubic-bezier(.17,.67,.12,.99)';
        svg.style.transform = 'rotate(' + totalRotation + 'deg)';

        setTimeout(function () {
            isSpinning = false;
            if (wheelContainer) {
                wheelContainer.classList.remove('spinning');
            }
            var shakeWrapper = document.querySelector('.wheel-shake-wrapper');
            if (shakeWrapper) {
                shakeWrapper.style.animation = 'none';
            }

            // Reset spin button
            var spinBtn = document.getElementById('carkifelek-spin');
            if (spinBtn) {
                spinBtn.disabled = false;
                spinBtn.innerHTML = '<span id="carkifelek-spin-text">' + (widgetData.widget.buttonText || 'ÇARKI ÇEVİR') + '</span>';
            }

            saveSpinData(prize, fullName, contact);
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

        if (prizeNameEl) prizeNameEl.textContent = prize.name || '';
        if (prizeDescEl) prizeDescEl.textContent = prize.description || '';

        // Show coupon code
        if (prize.coupon_code_result && couponEl && couponContainer) {
            couponEl.textContent = prize.coupon_code_result;
            couponContainer.style.display = 'block';
        } else if (couponContainer) {
            couponContainer.style.display = 'none';
        }

        // Set product link
        if (productLink) {
            if (prize.url) {
                productLink.href = prize.url;
            } else {
                productLink.href = widgetData.shop.url || '#';
            }
            // Show toggle button when product link is clicked
            productLink.onclick = function (e) {
                var toggleBtn = document.getElementById('carkifelek-toggle');
                if (toggleBtn) {
                    toggleBtn.style.display = 'flex';
                    toggleBtn.style.opacity = '1';
                    toggleBtn.style.transform = 'scale(1)';
                }
            };
        }

        // Close existing modal before showing new one to prevent double modal
        if (modal && modal.style.display === 'flex') {
            closePrizeModal();
        }

        // Show modal
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(function () {
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
            setTimeout(function () {
                modal.style.display = 'none';
            }, 300);
        }

        // Close main modal and show toggle button
        var mainModal = document.getElementById('carkifelek-modal');
        var toggleBtn = document.getElementById('carkifelek-toggle');
        if (mainModal) {
            mainModal.style.display = 'none';
        }
        if (toggleBtn) {
            toggleBtn.style.display = 'flex';
            toggleBtn.style.opacity = '1';
            toggleBtn.style.transform = 'scale(1)';
        }
    }

    function copyCouponCode() {
        var couponEl = document.getElementById('carkifelek-coupon-code');
        var copyBtn = document.getElementById('carkifelek-copy-coupon');

        if (couponEl && couponEl.textContent) {
            navigator.clipboard.writeText(couponEl.textContent).then(function () {
                if (copyBtn) {
                    copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Kopyalandı!';
                    copyBtn.style.background = 'rgba(255,255,255,0.25)';
                    copyBtn.style.borderColor = 'rgba(255,255,255,0.4)';
                    setTimeout(function () {
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
        var isPhone = widgetData.shop.contactInfoType === 'phone';
        var inputId = isPhone ? 'carkifelek-phone' : 'carkifelek-email';
        var contactInput = document.getElementById(inputId);

        if (!toggleBtn || !modal || !closeBtn) {
            logError('Bazı elementler bulunamadı');
            return;
        }

        // Add dynamic styles for toggle button based on position
        var dynamicStyles = document.createElement('style');
        var activeTransform = '';

        switch (WIDGET_POSITION) {
            case 'top-right':
            case 'middle-right':
            case 'bottom-right':
                activeTransform = 'rotate(-90deg) scale(0.98)';
                break;
            case 'top-left':
            case 'middle-left':
            case 'bottom-left':
                activeTransform = 'rotate(90deg) scale(0.98)';
                break;
            default:
                activeTransform = 'rotate(-90deg) scale(0.98)';
        }

        dynamicStyles.textContent = `
        #carkifelek-toggle:hover:active {
            transform: ${activeTransform} !important;
        }
        `;
        document.head.appendChild(dynamicStyles);

        // Generate wheel SVG
        generateWheelSVG();

        // Toggle button click handler
        toggleBtn.onclick = function (e) {
            // Tıklanan konumu kontrol et (sağ üst köşe = kapatma butonu ::after)
            var rect = toggleBtn.getBoundingClientRect();
            var clickX = e.clientX - rect.left;
            var clickY = e.clientY - rect.top;
            var isCloseClick = clickX > rect.width - 30 && clickY < 30;

            if (isCloseClick) {
                // Kapatma butonuna tıklandı - widget'ı tamamen gizle
                toggleBtn.style.display = 'none';
                return;
            }

            // Toggle'ı tam boyuta getir ve modalı aç
            toggleBtn.style.opacity = '1';
            toggleBtn.style.transform = 'scale(1)';
            modal.style.display = 'flex';
            toggleBtn.style.display = 'none';
        };

        // Close button - toggle durumuna geç (küçültme)
        closeBtn.onclick = function () {
            modal.style.display = 'none';
            toggleBtn.style.display = 'flex';
            // Toggle tam görünür şekilde göster
            toggleBtn.style.opacity = '1';
            toggleBtn.style.transform = 'scale(1)';
        };

        // View Prize button (for users who already spun)
        if (viewPrizeBtn) {
            viewPrizeBtn.onclick = function () {
                showSavedPrize();
            };
        }

        // Spin button (only if user hasn't spun yet)
        if (spinBtn) {
            spinBtn.onclick = function () {
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
                checkContactUsed(contact, function (err, used) {
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

                    // SERVER-SIDE PRIZE SELECTION: API call first to get prize and check rate limiting
                    apiClient.post('/spin', {
                        api_key: API_KEY,
                        full_name: fullName,
                        contact: contact,
                        user_agent: navigator.userAgent
                    }).then(function (data) {
                        if (data.error) {
                            // Rate limit or other error
                            spinBtn.disabled = false;
                            spinBtn.innerHTML = '<span id="carkifelek-spin-text">' + (widgetData.widget.buttonText || 'ÇARKI ÇEVİR') + '</span>';
                            if (contactInput) contactInput.disabled = false;
                            if (fullNameInput) fullNameInput.disabled = false;

                            var errorEl = document.getElementById('carkifelek-email-error');
                            if (errorEl) {
                                errorEl.textContent = data.message || data.error;
                                errorEl.style.display = 'block';
                            }
                            return;
                        }

                        // Server selected prize
                        selectedPrize = data.prize;

                        // Add coupon code from server response
                        if (data.coupon_code) {
                            selectedPrize.coupon_code_result = data.coupon_code;
                        }

                        // Spin wheel with server-selected prize
                        spinWheel(selectedPrize, fullName, contact);
                    }).catch(function (err) {
                        logError('Spin başlatma hatası', err);
                        spinBtn.disabled = false;
                        spinBtn.innerHTML = '<span id="carkifelek-spin-text">' + (widgetData.widget.buttonText || 'ÇARKI ÇEVİR') + '</span>';
                        if (contactInput) contactInput.disabled = false;
                        if (fullNameInput) fullNameInput.disabled = false;

                        var errorEl = document.getElementById('carkifelek-email-error');
                        if (errorEl) {
                            errorEl.textContent = 'Bir hata oluştu. Lütfen tekrar deneyin.';
                            errorEl.style.display = 'block';
                        }
                    });
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
        modal.onclick = function (e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                toggleBtn.style.display = 'flex';
            }
        };

        // Enter key
        if (contactInput) {
            contactInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    spinBtn.click();
                }
            });
        }
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    function init() {
        if (isInitialized) return;

        log('Çarkıfelek Widget başlatılıyor...');

        if (!getConfig()) {
            logError('Widget konfigürasyonu eksik: data-api-url ve data-api-key gerekli');
            return;
        }

        loadWidgetData().then(function (success) {
            if (success) {
                renderWidget();
                isInitialized = true;
                log('Çarkıfelek Widget başlatıldı');
            } else {
                logError('Widget verileri yüklenemedi');
            }
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

    /* Toggle button close icon (after pseudo-element) */
    #carkifelek-toggle::after {
      content: "×";
      position: absolute;
      top: -8px;
      right: -8px;
      width: 22px;
      height: 22px;
      background: #696969;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      z-index: 1001;
      font-size: 14px;
      line-height: 1;
      color: white;
      font-weight: bold;
      border: 2px solid white;
      font-family: Arial, sans-serif;
    }
    #carkifelek-toggle:hover::after {
      background: #dc2626;
      transform: scale(1.1);
    }
    #carkifelek-toggle:active::after {
      transform: scale(0.95);
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
      animation: toggle-shine 3s ease-in-out infinite;
      pointer-events: none;
    }

    @keyframes toggle-shine {
      0% { left: -80%; opacity: 0; }
      15% { opacity: 1; }
      30% { left: 80%; opacity: 0; }
      100% { left: 80%; opacity: 0; }
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
        transform: rotate(-15deg);
      }
      50% {
        transform: rotate(15deg);
      }
      100% {
        transform: rotate(-15deg);
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

    /* ============================================
       POSITION-SPECIFIC CSS CLASSES
       Her pozisyon için ayrı CSS stilleri
       ============================================ */

    /* Top Right Position */
    #carkifelek-toggle.carkifelek-position-topright {
        top: 50px;
        right: 65px;
    }
    #carkifelek-toggle.carkifelek-position-topright:hover {
      /* Top Right hover stilleri */
    }

    /* Top Left Position */
    #carkifelek-toggle.carkifelek-position-topleft {
        top: 50px;
        left: 65px;
    }
    #carkifelek-toggle.carkifelek-position-topleft:hover {
      /* Top Left hover stilleri */
    }

    /* Middle Right Position */
    #carkifelek-toggle.carkifelek-position-middleright {
        rotate: -90deg;
    }
    #carkifelek-toggle.carkifelek-position-middleright:hover {
      /* Middle Right hover stilleri */
    }

    /* Middle Left Position */
    #carkifelek-toggle.carkifelek-position-middleleft {
      rotate: 90deg;
    }
    #carkifelek-toggle.carkifelek-position-middleleft:hover {
      /* Middle Left hover stilleri */
    }

    /* Bottom Right Position */
    #carkifelek-toggle.carkifelek-position-bottomright {
        right: 70px;
        bottom: 50px;
    }
    #carkifelek-toggle.carkifelek-position-bottomright:hover {
      /* Bottom Right hover stilleri */
    }

    /* Bottom Left Position */
    #carkifelek-toggle.carkifelek-position-bottomleft {
        left: 70px;
        bottom: 50px;
    }
    #carkifelek-toggle.carkifelek-position-bottomleft:hover {
      /* Bottom Left hover stilleri */
    }

    /* Close Icon Position-Specific Styles */
    #carkifelek-toggle.carkifelek-position-topleft::after,
    #carkifelek-toggle.carkifelek-position-middleleft::after,
    #carkifelek-toggle.carkifelek-position-bottomleft::after {
      /* Sol taraftaki pozisyonlar için close icon pozisyonu */
      left: -8px;
      right: auto;
    }

    #carkifelek-toggle.carkifelek-position-topright::after,
    #carkifelek-toggle.carkifelek-position-middleright::after,
    #carkifelek-toggle.carkifelek-position-bottomright::after {
      /* Sağ taraftaki pozisyonlar için close icon pozisyonu */
      right: -8px;
      left: auto;
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
