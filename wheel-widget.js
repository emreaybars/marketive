// wheel-widget.js - Çarkıfelek Widget - Email gerekliliği, sabit ID ile veri saklama ve sürekli görünen süre çubuğu eklenmiş versiyon
(function () {
    // Widget için sabit bir ID kullanın, artık rastgele ID oluşturmuyoruz
    const widgetBaseId = 'wheel-of-fortune';
    // Mağaza bazlı benzersiz ID oluştur
    const getWidgetId = () => {
        const scriptElement = document.getElementById('eticaretsiteyoneticisi');
        const shopId = scriptElement ? scriptElement.getAttribute('data-shop-id') : 'default';
        return `${widgetBaseId}-${shopId}`;
    };
    // Widget için benzersiz ID - sayfanın her yerinde kullanılacak
    const widgetId = getWidgetId();
    // Widget ayarları için global değişken
    let widgetSettings = null;
    // LocalStorage ve Cookie için key formatını belirle
    const getStorageKey = (key) => {
        return `${widgetId}_${key}`;
    };
    // Veriyi localStorage'a kaydet
    const saveToLocalStorage = (key, value) => {
        try {
            const storageKey = getStorageKey(key);
            localStorage.setItem(storageKey, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`localStorage kayıt hatası (${key}):`, e);
            return false;
        }
    };

    // localStorage'dan veri oku
    const getFromLocalStorage = (key) => {
        try {
            const storageKey = getStorageKey(key);
            const data = localStorage.getItem(storageKey);
            if (data) {
                const parsedData = JSON.parse(data);
                return parsedData;
            }
        } catch (e) {
            console.error(`localStorage okuma hatası (${key}):`, e);
        }
        return null;
    };
    // Cookie'ye kaydet (daha kalıcı olması için)
    const setCookie = (key, value, days = 30) => {
        try {
            const storageKey = getStorageKey(key);
            const d = new Date();
            d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
            const expires = "expires=" + d.toUTCString();
            // Cookie'ye JSON stringi olarak kaydet
            document.cookie = `${storageKey}=${encodeURIComponent(JSON.stringify(value))};${expires};path=/;SameSite=Lax`;
            return true;
        } catch (e) {
            console.error(`Cookie kayıt hatası (${key}):`, e);
            return false;
        }
    };
    const sendToKlaviyo = async (email, firstName = '', lastName = '') => {
        try {
            // Mağaza ID'sini al
            const scriptElement = document.getElementById('eticaretsiteyoneticisi');
            const shopId = scriptElement ? scriptElement.getAttribute('data-shop-id') : null;

            if (!shopId) {
                console.error('Mağaza ID bulunamadı');
                return { success: false, message: 'Mağaza ID bulunamadı' };
            }

            console.log('Klaviyo entegrasyonu başlatılıyor:', { email, shopId, firstName, lastName });

            // Fetch options
            const fetchOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                mode: 'cors', // Explicitly set CORS mode
                cache: 'no-cache',
                body: new URLSearchParams({
                    email: email,
                    first_name: firstName,
                    last_name: lastName,
                    shop_id: shopId
                })
            };

            console.log('Fetch options:', fetchOptions);

            const response = await fetch('https://carkifelek.io/klaviyo_submit.php', fetchOptions);

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('HTTP error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                console.error('Non-JSON response:', responseText);
                throw new Error('Server response is not JSON: ' + responseText);
            }

            const data = await response.json();
            console.log('Klaviyo response data:', data);

            if (!data.success) {
                console.error('Klaviyo entegrasyonu başarısız:', data.message);
                throw new Error(data.message || 'Klaviyo entegrasyonu başarısız');
            }

            console.log('Klaviyo entegrasyonu başarılı:', data.message);
            return data;

        } catch (error) {
            console.error('Klaviyo entegrasyonu hatası:', error);
            console.error('Error stack:', error.stack);

            // Network hatası mı kontrol et
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                console.error('Network hatası detected. Bu CORS veya network bağlantı sorunu olabilir.');

                // Fallback: Başka bir yöntem deneyebiliriz
                const errorMessage = 'Bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.';

                // Hata mesajını kullanıcıya göster
                const errorElement = document.getElementById(`${widgetId}-error-message`);
                if (errorElement) {
                    errorElement.textContent = errorMessage;
                    errorElement.style.display = 'block';
                }

                return { success: false, message: errorMessage };
            }

            // Diğer hata tipleri için
            const errorMessage = 'E-posta kaydedilirken bir hata oluştu: ' + error.message;

            // Hata durumunda kullanıcıya bilgi ver
            const errorElement = document.getElementById(`${widgetId}-error-message`);
            if (errorElement) {
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block';
            }

            return { success: false, message: error.message };
        }
    };
    // Cookie'den oku
    const getCookie = (key) => {
        try {
            const storageKey = getStorageKey(key);
            const name = storageKey + "=";
            const decodedCookie = decodeURIComponent(document.cookie);
            const ca = decodedCookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) === 0) {
                    const cookieValue = c.substring(name.length);
                    const parsedData = JSON.parse(cookieValue);
                    return parsedData;
                }
            }
        } catch (e) {
        }
        return null;
    };
    // Hem localStorage hem cookie'ye veri kaydet
    const saveData = (key, value) => {
        saveToLocalStorage(key, value);
        setCookie(key, value);
    };
    // Verileri oku (önce localStorage, sonra cookie)
    const getData = (key) => {
        return getFromLocalStorage(key) || getCookie(key);
    };
    // Dönüş sonucunu kaydet
    const saveSpinResult = (result) => {
        saveData('wheelSpin', result);
    };
    // Dönüş sonucunu getir
    const getSpinResult = () => {
        return getData('wheelSpin');
    };
    // Email bilgisini kaydet
    const saveUserEmail = (email) => {
        saveData('userEmail', email);
    };
    // Email bilgisini getir
    const getUserEmail = () => {
        return getData('userEmail');
    };
    // Çark görüldü durumunu kaydet
    const saveWheelSeen = () => {
        saveData('wheelSeen', true);
    };
    // Çark daha önce görülmüş mü?
    const hasSeenWheel = () => {
        return !!getData('wheelSeen');
    };
    // Zamanlayıcı durumunu kaydet
    const saveTimerState = (remainingTime) => {
        const timerState = {
            remainingTime: remainingTime,
            lastUpdated: new Date().getTime()
        };
        saveData('timerState', timerState);
    };
    // Zamanlayıcı durumunu getir
    const getTimerState = () => {
        const timerState = getData('timerState');
        if (timerState && timerState.remainingTime !== undefined && timerState.lastUpdated) {
            // Son güncellemeden bu yana geçen süreyi hesapla
            const now = new Date().getTime();
            const elapsed = Math.floor((now - timerState.lastUpdated) / 1000);
            // Kalan süreyi güncelle
            const actualRemaining = Math.max(0, timerState.remainingTime - elapsed);
            return actualRemaining;
        }
        return null;
    };

    // Veritabanında email kontrolü yapan fonksiyon
    const checkEmailInDatabase = async (email) => {
        try {
            // Mağaza ID'sini al
            const scriptElement = document.getElementById('eticaretsiteyoneticisi');
            const shopId = scriptElement ? scriptElement.getAttribute('data-shop-id') : 'default';

            // API endpoint'ine istek gönder
            const response = await fetch(`https://carkifelek.io/api.php?action=check_email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `shop_id=${shopId}&email=${encodeURIComponent(email)}`
            });

            const data = await response.json();
            return data.exists; // true veya false döner
        } catch (error) {
            console.error('Email kontrolü sırasında hata oluştu:', error);
            return false; // Hata durumunda false döndür
        }
    };

    // Widget stil ve HTML içeriği
    const widgetStyles = `
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        font-family: 'Poppins', sans-serif;
    }
    .carkifelekio a {
    color: #fff;
}
.carkifelekio {
    margin-top: 10px;
}
    .page-wrapper {
        position: relative;
        z-index: 1;
        min-height: 90%;
        --overlay-color: rgba(139, 0, 0);
    }
    .page-wrapper::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--overlay-color);
        z-index: -1;
    }
    .float-button .time-bar-text {
    position: relative !important;
}
    .content-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 35px 20px;
        z-index: 3;
        position: relative;
        background-position: center;
        background-repeat: no-repeat;
    }
    /* Logo Bölümü */
    .logo-container {
    display: none;
        text-align: center;
        margin-bottom: 20px;
    }
    .logo {
        height: 60px;
        max-width: 150px;
        object-fit: contain;
    }
    /* Bilgilendirme Kutusu */
    .wheel-info {
    border-radius: 15px;
    padding: 15px;
    margin-bottom: 0;
    text-align: center;
    width: 100%;
    }
    .wheel-info p {
        color: #fff;
        line-height: 1.4;
        font-size: 14px;
        margin-bottom: 8px;
    }
    .wheel-info p b {
    text-transform: uppercase;
    font-size: 30px;
    display: block;
    margin-bottom: 5px;
    }
    /* Çark Bölümü */
    .wheel-container {
    position: relative;
    width: min(85vw, 350px);
    height: min(85vw, 350px);
    margin: 10px 0;
    background: url(https://carkifelek.io/cark-circle.png);
    background-position: center;
    background-size: cover;
}
    .wheel {
     position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    padding: 15px;
    transform: rotate(0deg);
    transition: transform 5s cubic-bezier(.17,.67,.12,.99);
    background: url(https://carkifelek.io/asgr04w.jpeg) no-repeat center / contain;
    pointer-events: none;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    }
    .wheel path {
    stroke: #ffffff57;
}
    /* Çark Merkezi */
    .wheel-center {
        position: absolute;
        width: 15%;
        height: 15%;
        background: #fff;
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10;
        box-shadow: 0 0 18px 4px rgb(0 0 0 / 17%);
    }
    .wheel-center-inner {
        position: absolute;
        width: 70%;
        height: 70%;
        background: #f0f0f0;
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
    }
    /* İşaretçi (Ok) */
    .marker {
        position: absolute;
        top: -15px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 20;
        width: 30px;
        height: 40px;
        pointer-events: none;
    }
    .marker-arrow {
    width: 40px;
    height: 40px;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.23);
    border-radius: 0 50% 50% 50%;
    -webkit-transform: rotate(-135deg);
    transform: rotate(-135deg);
    background-color: #ffffff;
    position: absolute;
    top: 5px;
    left: 50%;
    margin-left: -20px;
    }
    /* Döndürme Butonu */
    .button-container {
        padding: 0;
        margin-bottom: 15px;
        width: 100%;
        max-width: 350px;
    }
    .spin-button {
    display: block;
    position: relative;
    overflow: hidden;
    width: 100%;
    padding: 15px;
    border: none;
    border-radius: 22px;
    background: #d10000;
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    box-shadow: 1px 5px 0px rgb(0 0 0 / 22%);
    transition: all 0.3s;
    text-decoration: none;
    }
    .spin-button::before {
    content: "";
    position: absolute;
    top: 0;
    left: -120%;
    width: 50%;
    height: 100%;
    background: linear-gradient(
        120deg,
        transparent,
        rgba(255, 255, 255, 0.45),
        transparent
    );
    opacity: 0.9;
    transform: skewX(-20deg);
    animation: spin-shine 3.5s ease-in-out infinite;
    pointer-events: none;
}
.spin-button::before {
    content: "";
    position: absolute;
    top: 0;
    left: -120%;
    width: 50%;
    height: 100%;
    background: linear-gradient(
        120deg,
        transparent,
        rgba(255, 255, 255, 0.45),
        transparent
    );
    opacity: 0.9;
    transform: skewX(-20deg);
    animation: spin-shine 3.5s ease-in-out infinite;
    pointer-events: none;
}
@keyframes spin-shine {
    0% {
        left: -120%;
        opacity: 0;
    }
    15% {
        opacity: 1;
    }
    30% {
        left: 120%;
        opacity: 0;
    }
    100% {
        left: 120%;
        opacity: 0;
    }
}
    .spin-button:hover, .spin-button:active {
        background: #b00000;
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    }
    /* Daha önce çevirmiş buton stili */
    .spin-button.already-spun {
        background-color: #28a745 !important; /* Yeşil renk */
        cursor: pointer;
    }
    /* Devre dışı buton stili */
    .spin-button:disabled {
        background-color: #888 !important;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
    /* Çark Devre Dışı Mesajı */
    .wheel-disabled-message {
        background: rgba(255, 255, 255, 0.9);
        color: #d10000;
        padding: 10px;
        border-radius: 5px;
        margin-top: 10px;
        text-align: center;
        font-weight: 500;
        font-size: 14px;
        display: none;
    }
    /* Kar Efekti */
    .snowflake {
        display: none;
        position: fixed;
        top: -20px;
        color: white;
        font-size: 16px;
        opacity: 0.8;
        z-index: 1;
        pointer-events: none;
        animation: fall linear forwards;
    }
    text {
    text-transform: uppercase;
    font-size: 3.5px;
    font-weight: 700;
}
    @keyframes fall {
        to {
            transform: translateY(100vh);
        }
    }
    /* Ödül Modalı */
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 99999; /* Yüksek z-index değeri */
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s;
    }
    .modal.active {
        display: flex;
        opacity: 1;
    }
    .modal-content {
        background: white;
        width: 90%;
        max-width: 320px;
        border-radius: 15px;
        padding: 20px;
        text-align: center;
        position: relative;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        transform: scale(0.9);
        animation: modalAppear 0.3s forwards;
    }
    @keyframes modalAppear {
        to {
            transform: scale(1);
        }
    }
    .modal-header {
        margin-bottom: 15px;
    }
    .modal-header h2 {
        color: #d10000;
        font-size: 22px;
        margin-bottom: 5px;
    }
    .prize-content {
        background: #d10000;
        color: white;
        padding: 15px;
        border-radius: 10px;
        margin-bottom: 15px;
    }
    .prize-text {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 5px;
    }
    .prize-description {
        font-size: 14px;
        opacity: 0.9;
    }
    .coupon-container {
        background: #f5f5f5;
        padding: 12px;
        border-radius: 10px;
        margin-bottom: 15px;
    }
    .coupon-box {
        border: 2px dashed #d10000;
        padding: 10px;
        border-radius: 5px;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .coupon-label {
        font-size: 12px;
        color: #777;
    }
    .coupon-code {
        font-size: 18px;
        font-weight: 600;
        color: #d10000;
        letter-spacing: 1px;
    }
    .eticaretsiteyoneticisi a {
        color: #fff!important;
    }
    .eticaretsiteyoneticisi {
        margin-top: 10px;
        position:relative!important;
        text-align: center;
        font-size: 11px;
        border-top: 1px solid #fff;
        padding-top: 10px;
        font-weight: 500;
    }
    .copy-button {
        background: #28a745;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 5px;
        margin-top: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        font-size: 13px;
        text-decoration: none;
    }
    .modal-actions {
        display: flex;
        gap: 10px;
    }
    .action-button {
        flex: 1;
        padding: 10px;
        border-radius: 15px;
        font-size: 14px;
        cursor: pointer;
        text-align: center;
        text-decoration: none;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .action-button.primary {
        background: #d10000;
        color: white;
    }
    .action-button.secondary {
        background: #f5f5f5;
        color: #555;
        border: 1px solid #ddd;
    }
    /* Animasyonlar */
    @keyframes markerPulse {
        0%, 100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-3px);
        }
    }
    /* Floating Button */
    .float-button {
      display: inline-block;
        position: fixed;
        bottom: 70px;
        right: 20px;
        width: 180px;
        height: 60px;
      padding:0 10px;
        background: #ff4823;
        border-radius: 20px;
        display: flex; /* Başlangıçta gösterilecek, ancak JS ile kontrol edilecek */
        align-items: center;
        justify-content: center;
        box-shadow: rgba(68, 62, 130, 0.72) 0px 0.602187px 1.08394px -1.25px, rgba(68, 62, 130, 0.635) 0px 2.28853px 4.11936px -2.5px, rgb(255 72 35) 0px 10px 18px -3.75px, rgb(255 72 35) 0px 0.706592px 0.706592px -0.583333px, rgb(255 72 35) 0px 1.80656px 1.80656px -1.16667px, rgb(144 36 14) 0px 3.62176px 3.62176px -1.75px, rgba(59, 41, 117, 0.306) 0px 6.8656px 6.8656px -2.33333px, rgba(59, 41, 117, 0.26) 0px 13.6468px 13.6468px -2.91667px, rgba(59, 41, 117, 0.15) 0px 30px 30px -3.5px !important;
        z-index: 9998; /* Header ve menülerden yüksek ama modaldan düşük */
        cursor: pointer;
        animation: pulse 2s infinite;
        text-decoration: none;
    }
    .float-button img {
        width: 100px;
        height: 100px;
      animation: spin 1.5s infinite;
    }
    @keyframes pulse {
        0% {
            transform: scale(1);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        50% {
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }
        100% {
            transform: scale(1);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
    }
    .float-button h1 {
  color: #FFF;
  font-size: 15px;
  font-family: system-ui;
  font-weight: 600;
    padding-right: 10px;
}
    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(720deg); }
    }
    /* Modal window */
    .modal-window {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 99990; /* Header ve menülerden yüksek ama modaldan düşük */
        display: none;
        opacity: 0;
        transition: opacity 0.3s;
        overflow-y: auto;
    }
    .modal-window.active {
        display: block;
        opacity: 1;
    }
    .modal-window > div {
        width: 95%;
        max-width: 600px;
        margin: 20px auto;
        background: white;
        border-radius: 15px;
        overflow: hidden;
        position: relative;
    }
    .modal-close {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.1);
        width: 30px;
        border: 1px solid #fff;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: #fff;
        text-decoration: none;
        z-index: 100;
    }
    /* Yükleniyor göstergesi */
    .loading {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.8);
        z-index: 100;
        border-radius: 15px;
    }
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255, 0, 0, 0.2);
        border-radius: 50%;
        border-top-color: #d10000;
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    .marker-arrow svg {
    position: absolute;
    height: 16px;
    width: 16px;
    top: 50%;
    left: 50%;
    margin-top: -8px;
    margin-left: -8px;
    -webkit-transform: rotate(135deg);
    transform: rotate(135deg);
}
    /* Hata Mesajı */
    .error-message {
        background: rgba(255, 0, 0, 0.1);
        color: #d10000;
        padding: 15px;
        border-radius: 10px;
        text-align: center;
        margin: 20px;
        border: 1px solid rgba(255, 0, 0, 0.3);
    }
    /* E-posta Form Stili */
    .email-form-container {
        width: 100%;
        max-width: 350px;
        margin-bottom: 20px;
    }
    .email-form {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .form-group {
    position: relative;
}
.form-control {
    width: 100%;
    padding: 15px 15px 15px 50px; /* Sol tarafta mail ikonu için boşluk bırak */
    border: 2px solid rgb(80 80 80 / 27%);
    border-radius: 8px;
    background: rgb(255 255 255);
    color: #3f3f3f;
    font-size: 15px;
    backdrop-filter: blur(5px);
    transition: all 0.3s;
}
.form-control:focus {
    border-color: rgba(255, 255, 255, 0.6);
    outline: none;
}
.mail-icon {
    width: 25px;
    height: 25px;
    background: url(https://cdn.wheelio-app.com/themes/General/mail.svg);
    position: absolute;
    top: 15px;
    left: 15px;
    background-repeat: no-repeat;
    background-position: center;
    opacity: .2;
    pointer-events: none; /* Tıklamaları etkilemesini önle */
}
.form__label {
    position: absolute;
    left: 50px;
    top: 16px;
    font-size: 14px;
    color: #666;
    transition: all 0.3s ease;
    pointer-events: none; /* Tıklamaları etkilemesini önle */
}
.glare {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient( 45deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0) 100% );
    transform: rotate(45deg);
    pointer-events: none;
    animation: slide-glare 3s ease-in-out infinite;
}
@keyframes slide-glare {
    0% {
        transform: translateX(-100%) rotate(45deg);
    }
    100% {
        transform: translateX(100%) rotate(45deg);
    }
}
/* İnput'a tıklandığında veya içinde yazı olduğunda label'ın yukarı taşınması */
.form-control:focus ~ .form__label,
.form-control:not(:placeholder-shown) ~ .form__label {
    top: 10px;
    left: 15px;
    font-size: 10px;
    opacity: 0.9;
    transform: translateY(-50%);
}
/* Placeholder'ı şeffaf yaparak görünmez kıl, böylece kendi label'ımız görünsün */
.form-control::placeholder {
    color: transparent;
}
    .form-control::placeholder {
        color: rgba(255, 255, 255, 0.6);
    }
    .form-label {
        display: block;
        margin-bottom: 5px;
        color: white;
        font-size: 14px;
    }
    .checkbox-group {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-top: 5px;
    }
    label.form__label {
    left: 50px;
    position: absolute;
    top: 16px;
    font-size: 14px;
    color: #666;
}
.form-group:focus~.form__label {
    font-size: 10px !important;
    opacity: .9;
    position: absolute;
    top: 5px;
    padding: 0;
    left: 0;
    transform: none;
}
    .checkbox-group input[type="checkbox"] {
        margin-top: 3px;
        width: 25px;
    height: 25px;
    border-radius: 15px !important;
    }
    .checkbox-group {
    border: dotted #fff 1px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-top: 5px;
    padding: 10px;
    border-radius: 7px;
}
    .checkbox-group label {
        color: rgba(255, 255, 255, 0.8);
        font-size: 12px;
        line-height: 1.4;
    }
    .checkbox-group a {
        color: white;
        text-decoration: underline;
    }
    .form-error {
        color: #ffcccc;
        font-size: 12px;
        margin-top: 5px;
        display: none;
    }
    .mail-icon {
    width: 25px;
    height: 25px;
    background: url(https://cdn.wheelio-app.com/themes/General/mail.svg);
    position: absolute;
    top: 15px;
    left: 15px;
    background-repeat: no-repeat;
    background-position: center;
    opacity: .2;
}
@keyframes emredik {
  0%   {scale: 0.9;}
  100% {scale: 1;}
}
    /* Zaman çubuğu stili */
    .time-bar-container {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 15px;
        background-color: rgba(0, 0, 0, 0.2);
        z-index: 99999;
        display: block; /* Her zaman görünür olsun */
    }
    .time-bar {
        height: 100%;
        width: 100%;
        background: linear-gradient(rgb(209 67 67) 48%, rgb(183 45 45) 49%);
        border-radius: 0;
        transition: width 1s linear;
    }
    .time-bar-text {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 5px 10px;
        border-radius: 11px;
        font-size: 13px;
        font-weight: 500;
        z-index: 99999;
        display: block; /* Her zaman görünür olsun */
    }
    
    /* Timer animasyonu için yeni stiller */
    .timer-container {
        display: inline-block;
        position: relative;
        height: 1.2em;
        overflow: hidden;
    }
    .timer-digits {
        position: relative;
        display: inline-block;
        transition: transform 0.3s ease;
    }
    .timer-digit {
        display: block;
        height: 1.2em;
        line-height: 1.2em;
    }
    .timer-digit.sliding {
        animation: slideDown 0.3s ease;
    }
    .time-bar-container, .time-bar-text {
    display: none !important;
}
    @keyframes slideDown {
        0% {
            transform: translateY(0);
            opacity: 1;
        }
        100% {
            transform: translateY(100%);
            opacity: 0;
        }
    }
    `;
    const widgetHTML = `
    <div id="${widgetId}-container">
        <!-- Gerekli CSS dosyaları -->
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" rel="stylesheet" />
        <!-- Kar Efekti (JavaScript ile oluşturulacak) -->
        <div class="snowfall"></div>
        <!-- Floating Button -->
        <a class="float-button" href="javascript:void(0);" id="${widgetId}-open-wheel-btn">
            <img alt="Çarkı Çevir" src="https://carkifelek.io/cark.png" />
              <h1>
Çarkı Çevir!
  </h1>
        </a>
        <!-- Ana Çark Modalı -->
        <div class="modal-window" id="${widgetId}-wheel-modal">
            <div>
                <a class="modal-close" href="javascript:void(0);" id="${widgetId}-close-wheel-btn">×</a>
                <div class="page-wrapper">
                    <div class="content-container">
                        <!-- Logo -->
                        <div class="logo-container">
                            <img alt="Logo" class="logo" id="${widgetId}-shop-logo" src="https://sektorunlideri.com/noirre.png" />
                        </div>
                        <!-- Bilgilendirme -->
                        <div class="wheel-info">
                            <p><b id="${widgetId}-wheel-title">Çarkı Çevir<br />Hediyeni Kazan!</b>
                            </p>
                            <p id="${widgetId}-wheel-description">Hediyeni almak için hemen çarkı çevir.</p>
                        </div>
                        <!-- E-posta Form Alanı - ONAYLA Butonu Kaldırıldı -->
                        <div class="email-form-container" id="${widgetId}-email-form-container">
                            <form class="email-form" id="${widgetId}-email-form">
                                <div class="form-group">
    <input type="email" class="form-control" id="${widgetId}-email" placeholder=" " required>
    <div class="mail-icon"></div>
    <label for="${widgetId}-email" class="form__label">E-mail adresiniz yazın<span class="error-label"></span></label>
    <div class="form-error" id="${widgetId}-email-error">Lütfen geçerli bir e-posta adresi giriniz.</div>
</div>
                                <div class="form-group">
                                    <div class="checkbox-group">
                                        <input type="checkbox" id="${widgetId}-agreement" required>
                                        <label for="${widgetId}-agreement">
                                            Kampanya ve indirimlerden haberdar olmak için <a href="#" target="_blank">iletişim izni veriyorum</a>.
                                        </label>
                                    </div>
                                    <div class="form-error" id="${widgetId}-agreement-error">Devam etmek için izin vermeniz gerekmektedir.</div>
                                </div>
                                <!-- Submit butonu kaldırıldı -->
                            </form>
                        </div>
                        <div class="button-container">
                            <a class="spin-button" href="javascript:void(0);" id="${widgetId}-spin-button">ÇARKI ÇEVİR
</a>
                            <!-- Çark Devre Dışı Mesajı -->
                            <div class="wheel-disabled-message" id="${widgetId}-wheel-disabled-message">
                                Bu çarkı daha önce çevirdiniz. Tekrar çeviremezsiniz.
                            </div>
                            <div class="eticaretsiteyoneticisi" style="display: none!important;">
                                <a href="https://eticaretsiteyoneticisi.com" id="${widgetId}-brand-link" target="_blank">E-Ticaret Site Yöneticisi</a>
                            </div>
                        </div>
                        <!-- Çark -->
                        <div class="wheel-container">
                            <div class="marker">
                                <div class="marker-arrow">
                                <svg x="0px" y="0px" width="12px" height="12px" viewBox="0 0 12 12"><g transform="translate(0, 0)"><polygon points="7.489 4.667 6 0 4.511 4.667 0 4.667 3.59 7.416 2.101 12 6 9.167 9.899 12 8.41 7.416 12 4.667 7.489 4.667" fill="#ffce01"></polygon></g></svg>
                                </div>
                            </div>
                            <svg class="wheel" id="${widgetId}-wheel" viewbox="0 0 100 100"></svg>
                            <div class="wheel-center">
                                <div class="wheel-center-inner"></div>
                            </div>
                            <!-- Yükleniyor göstergesi -->
                            <div class="loading" id="${widgetId}-loading">
                                <div class="loading-spinner"></div>
                            </div>
                            <!-- Hata Mesajı -->
                            <div class="error-message" id="${widgetId}-error-message" style="display: none;"></div>
                        </div>
                        <div class="carkifelekio"><a href="https://carkifelek.framer.ai/"><strong>ÇarkıFelek</strong> ⚡️ e-ticaret'in yeni deneyimi!</a></div>
                        <!-- Butonu Çevir -->
                    </div>
                </div>
            </div>
        </div>
        <!-- Ödül Modalı -->
        <div class="modal" id="${widgetId}-prize-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Tebrikler!</h2>
                </div>
                <div class="prize-content">
                    <div class="prize-text" id="${widgetId}-prize-text"></div>
                    <div class="prize-description" id="${widgetId}-prize-description"></div>
                </div>
                <div class="coupon-container">
                    <div class="coupon-box">
                        <span class="coupon-label">İndirim Kodunuz:</span>
                        <span class="coupon-code" id="${widgetId}-coupon-code"></span>
                        <a class="copy-button" href="javascript:void(0);" id="${widgetId}-copy-button">
                            <i class="fas fa-copy"></i> Kopyala
                        </a>
                    </div>
                </div>
                <div class="modal-actions">
                    <a class="action-button primary" href="#" id="${widgetId}-product-link" target="_blank">Alışverişe Başla!</a>
                    <a class="action-button secondary" href="javascript:void(0);" id="${widgetId}-close-prize-btn">Kapat</a>
                </div>
            </div>
        </div>
    </div>
    `;
    // Ana widget elemanını oluştur
    const createWidgetElement = () => {
        // Stil elemanını oluştur
        const styleElement = document.createElement('style');
        styleElement.textContent = widgetStyles;
        // Widget container elemanını oluştur
        const widgetElement = document.createElement('div');
        widgetElement.id = widgetId;
        widgetElement.innerHTML = widgetHTML;
        // Stil ve widget elemanlarını sayfaya ekle
        document.head.appendChild(styleElement);
        document.body.appendChild(widgetElement);
        // Zaman çubuğunu doğrudan body'ye ekle
        const timeBarContainer = document.createElement('div');
        timeBarContainer.className = 'time-bar-container';
        timeBarContainer.id = `${widgetId}-time-bar-container`;
        timeBarContainer.innerHTML = `
            <div class="time-bar" id="${widgetId}-time-bar"></div>
        `;
        const timeBarText = document.createElement('div');
        timeBarText.className = 'time-bar-text';
        timeBarText.id = `${widgetId}-time-bar-text`;
        timeBarText.textContent = '5:00'; // Varsayılan değer
        document.body.appendChild(timeBarContainer);
        document.body.appendChild(timeBarText);
        // Yükleniyor göstergesini göster
        showLoading(true);
    };
    // Önceki dönüş durumunu kontrol et ve UI'ı güncelle
    const checkSpinStatus = () => {
        const spinButton = document.getElementById(`${widgetId}-spin-button`);
        const disabledMessage = document.getElementById(`${widgetId}-wheel-disabled-message`);
        const storedResult = getSpinResult();
        if (storedResult) {
            // Buton metnini ve stilini değiştir
            spinButton.textContent = "HEDİYENİ GÖSTER";
            spinButton.classList.add('already-spun');
            // Devre dışı mesajını göster
            if (disabledMessage) {
                disabledMessage.style.display = 'block';
            }
            // Çarkın etkileşimini devre dışı bırak
            const wheel = document.getElementById(`${widgetId}-wheel`);
            if (wheel && widgetSettings && widgetSettings.prizes) {
                const prizeIndex = storedResult.prizeIndex;
                const prizes = widgetSettings.prizes;
                if (prizes && prizes.length > 0 && prizeIndex !== undefined) {
                    // Çarkı kazanan ödül açısına göre sabitliyoruz
                    const prizeAngle = 360 / prizes.length;
                    const targetAngle = (360 - (prizeIndex * prizeAngle)) - (prizeAngle / 2);
                    wheel.style.transition = 'none'; // Animasyonu kapat
                    wheel.style.transform = `rotate(${targetAngle}deg)`;
                }
            }
            // Email formunu gizle çünkü zaten çevirmiş
            const emailFormContainer = document.getElementById(`${widgetId}-email-form-container`);
            if (emailFormContainer) {
                emailFormContainer.style.display = 'none';
            }
            return true;
        }
        return false;
    };
    // Yükleniyor göstergesini göster/gizle
    const showLoading = (show) => {
        const loadingElement = document.getElementById(`${widgetId}-loading`);
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
    };
    // Hata mesajını göster/gizle
    const showError = (message, show = true) => {
        const errorElement = document.getElementById(`${widgetId}-error-message`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = show ? 'block' : 'none';
        }
    };
    // Form validasyonu
    const validateEmail = (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };
    // Email input validasyonu ve fokus efektleri
    const emailInput = document.getElementById(`${widgetId}-email`);
    if (emailInput) {
        emailInput.addEventListener('input', () => {
            if (validateEmail(emailInput.value)) {
                hideFormError(`${widgetId}-email-error`);
            }
        });
        // Odaklandığında label'ı yukarı taşı
        emailInput.addEventListener('focus', () => {
            const label = emailInput.nextElementSibling.nextElementSibling;
            label.classList.add('active');
        });
        // Odaktan çıktığında ve input boşsa label'ı geri getir
        emailInput.addEventListener('blur', () => {
            if (!emailInput.value) {
                const label = emailInput.nextElementSibling.nextElementSibling;
                label.classList.remove('active');
            }
        });
    }
    // Form hata mesajını göster
    const showFormError = (elementId, message) => {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    };
    // Form hata mesajını gizle
    const hideFormError = (elementId) => {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    };
    // Zaman çubuğunu başlat
    const startTimeBar = (remainingSeconds = 300) => {
        const timeBarContainer = document.getElementById(`${widgetId}-time-bar-container`);
        const timeBar = document.getElementById(`${widgetId}-time-bar`);
        const timeBarText = document.getElementById(`${widgetId}-time-bar-text`);
        const floatButtonH1 = document.querySelector(`#${widgetId}-open-wheel-btn h1`);

        if (!timeBarContainer || !timeBar || !timeBarText) return;

        // Eğer interval hala çalışıyorsa temizle
        if (window[`${widgetId}_timeInterval`]) {
            clearInterval(window[`${widgetId}_timeInterval`]);
        }

        // Toplam süre (5 dakika = 300 saniye)
        const totalTime = 300;
        let remainingTime = remainingSeconds;

        // Çubuğu başlangıçta kalan süreye göre ayarla
        const initialWidth = (remainingTime / totalTime) * 100;
        timeBar.style.width = `${initialWidth}%`;

        // Timer HTML'ini oluştur
        const createTimerHTML = (minutes, seconds) => {
            return `
                <span class="timer-container">
                    <span class="timer-digits">
                        <span class="timer-digit">${minutes < 10 ? '0' : ''}${minutes}</span>
                    </span>
                </span>:<span class="timer-container">
                    <span class="timer-digits">
                        <span class="timer-digit">${seconds < 10 ? '0' : ''}${seconds}</span>
                    </span>
                </span>
            `;
        };

        // Dakika:saniye formatında süreyi güncelle
        const updateTimeText = (seconds) => {
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            const timeText = `${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
            timeBarText.textContent = timeText;

            // Float button başlığını güncelle
            if (floatButtonH1) {
                // Önceki saniye değerini sakla
                const prevSeconds = window[`${widgetId}_prevSeconds`] || 0;
                window[`${widgetId}_prevSeconds`] = secs;

                // Saniye değiştiyse animasyon ekle
                if (prevSeconds !== secs) {
                    const timerHTML = createTimerHTML(minutes, secs);
                    floatButtonH1.innerHTML = timerHTML;

                    // Animasyon için saniye kısmını seç
                    const secondsDigit = floatButtonH1.querySelector('.timer-container:last-child .timer-digit');
                    if (secondsDigit) {
                        secondsDigit.classList.add('sliding');
                        setTimeout(() => {
                            secondsDigit.classList.remove('sliding');
                        }, 300);
                    }
                }
            }
        };

        // İlk gösterim
        updateTimeText(remainingTime);

        // Her 1 saniyede bir - zamanlayıcıyı güncelle ve localStorage'a kaydet
        const interval = setInterval(() => {
            remainingTime--;

            // Her saniyede durumu localStorage'a kaydet
            saveTimerState(remainingTime);

            // Genişliği hesapla ve güncelle
            const widthPercentage = (remainingTime / totalTime) * 100;
            timeBar.style.width = `${widthPercentage}%`;

            // Metni güncelle
            updateTimeText(remainingTime);

            // Zaman dolduğunda temizle
            if (remainingTime <= 0) {
                clearInterval(interval);
                // LocalStorage'dan timer durumunu temizle
                saveData('timerState', null);
                // Zaman doluyor ama çubuğu yine de göster, sadece genişliği 0 yap
                timeBar.style.width = '0%';
                timeBarText.textContent = '0:00';

                // Float button başlığını sıfırla
                if (floatButtonH1) {
                    floatButtonH1.textContent = 'Çarkı Çevir!';
                }

                // Prize modalını kapat eğer açıksa
                const prizeModal = document.getElementById(`${widgetId}-prize-modal`);
                if (prizeModal && prizeModal.classList.contains('active')) {
                    closePrizeModal();
                }
            }
        }, 1000);

        // Interval ID'yi global olarak sakla (gerekirse temizlemek için)
        window[`${widgetId}_timeInterval`] = interval;
    };
    // Veritabanından widget ayarlarını al
    const fetchWidgetSettings = async (shopId) => {
        try {
            // API endpoint'i
            const response = await fetch(`https://carkifelek.io/api.php?action=get_widget_data&shop_id=${shopId}`);
            if (!response.ok) {
                let errorMsg = `Veritabanından widget ayarları alınamadı: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.error) {
                        errorMsg = errorData.error;
                    }
                } catch (e) {
                    // JSON parse hatası - varsayılan hata mesajını kullan
                }
                throw new Error(errorMsg);
            }
            const data = await response.json();

            // Ödüller var mı kontrol et
            if (!data.prizes || data.prizes.length === 0) {
                console.error('API\'den ödül verileri alınamadı veya boş.');
                throw new Error('Ödül verileri bulunamadı');
            }
            return data;
        } catch (error) {
            console.error('Widget ayarları alınırken hata oluştu:', error);
            throw error;
        }
    };
    // Widget ayarlarını uygulamak için
    const applyWidgetSettings = (settings) => {

        // Ayarları global değişkene kaydet
        widgetSettings = settings;

        // Mağaza bilgileri
        document.getElementById(`${widgetId}-shop-logo`).src = settings.shop.logo;
        document.getElementById(`${widgetId}-brand-link`).textContent = settings.shop.brandName;
        document.getElementById(`${widgetId}-brand-link`).href = settings.shop.url;

        // Widget içeriği
        document.getElementById(`${widgetId}-wheel-title`).innerHTML = settings.widget.title;
        document.getElementById(`${widgetId}-wheel-description`).textContent = settings.widget.description;

        // Buton ayarları
        const spinButton = document.getElementById(`${widgetId}-spin-button`);
        if (spinButton) {

            // Buton metni
            spinButton.textContent = settings.widget.buttonText;

            // Buton renkleri
            if (settings.widget.buttonColor) {
                spinButton.style.backgroundColor = settings.widget.buttonColor;
            }

            // Buton yazı rengi - widget_settings tablosundan gelen değer
            if (settings.widget.button_text_color) {
                spinButton.style.color = settings.widget.button_text_color;
            } else {
                // Varsayılan yazı rengi
                spinButton.style.color = '#ffffff';
            }
        } else {
            console.error('Buton elementi bulunamadı!'); // Debug için
        }

        // Başlık ve açıklama renklerini uygula
        if (settings.widget.title_color) {
            document.getElementById(`${widgetId}-wheel-title`).style.color = settings.widget.title_color;
        }

        if (settings.widget.description_color) {
            document.getElementById(`${widgetId}-wheel-description`).style.color = settings.widget.description_color;

            // Checkbox içindeki yazı ve link rengini uygula
            const label = document.querySelector(`label[for="${widgetId}-agreement"]`);
            if (label) {
                label.style.color = settings.widget.description_color;
                const link = label.querySelector('a');
                if (link) {
                    link.style.color = settings.widget.description_color;
                }
            }

            // .checkbox-group kenarlık rengini uygula
            const checkboxGroup = document.querySelector(`#${widgetId}-agreement`)?.closest('.checkbox-group');
            if (checkboxGroup) {
                checkboxGroup.style.borderColor = settings.widget.description_color;
            }

            // .carkifelekio div içindeki yazı ve link rengi
            const carkifelekDiv = document.querySelector('.carkifelekio');
            if (carkifelekDiv) {
                carkifelekDiv.style.color = settings.widget.description_color;
                const link = carkifelekDiv.querySelector('a');
                if (link) {
                    link.style.color = settings.widget.description_color;
                }
            }
        }

        // Çark resmi ayarı
        if (settings.widget.wheel_circle_image) {
            const wheel = document.querySelector(`#${widgetId} .wheel`);
            if (wheel) {
                wheel.style.background = `url('${settings.widget.wheel_circle_image}') no-repeat center / contain`;
            }
        }

        // Arkaplan rengi ayarı
        if (settings.widget.backgroundColor) {
            const pageWrapper = document.querySelector(`#${widgetId} .page-wrapper`);
            if (pageWrapper) {
                pageWrapper.style.setProperty('--overlay-color', settings.widget.backgroundColor);
                const overlay = pageWrapper.querySelector('::before');
                if (overlay) {
                    overlay.style.backgroundColor = settings.widget.backgroundColor;
                }
            }
        }

        // Çarkı oluştur
        createWheel(settings.prizes);

        // Yükleniyor göstergesini gizle
        showLoading(false);

        // Daha önce çevirdi mi kontrolü - Buton stilini ayarla
        checkSpinStatus();
    };
    // Kar efektini oluşturma
    const createSnowflakes = () => {
        const snowfall = document.querySelector(`#${widgetId}-container .snowfall`);
        const snowflakeTypes = ['❄', '❅', '❆'];
        const snowflakeCount = window.innerWidth < 768 ? 30 : 50;
        for (let i = 0; i < snowflakeCount; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.innerHTML = snowflakeTypes[Math.floor(Math.random() * snowflakeTypes.length)];
            // Rastgele konum ve boyut
            const size = Math.random() * 12 + 8;
            const left = Math.random() * 100;
            // Rastgele düşme hızı
            const duration = Math.random() * 10 + 10;
            snowflake.style.cssText = `
                left: ${left}vw;
                font-size: ${size}px;
                animation-duration: ${duration}s;
                animation-delay: ${Math.random() * 5}s;
            `;
            snowfall.appendChild(snowflake);
        }
    };
    // Çark oluşturma
    const createWheel = (prizes) => {
        if (!prizes || prizes.length === 0) {
            console.error('Ödül listesi boş, çark oluşturulamıyor.');
            showError('Ödül listesi boş, çark oluşturulamıyor.');
            return;
        }
        const wheel = document.getElementById(`${widgetId}-wheel`);
        const centerX = 50;
        const centerY = 50;
        const radius = 45;
        const anglePerPrize = 360 / prizes.length;
        let svgContent = '';
        prizes.forEach((prize, index) => {
            const startAngle = index * anglePerPrize;
            const endAngle = (index + 1) * anglePerPrize;
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);
            // Dilimlerin yolu
            const pathData = `
                M ${centerX},${centerY}
                L ${x1},${y1}
                A ${radius},${radius} 0 0,1 ${x2},${y2}
                Z
            `;
            // Metin için - Dikey olarak ortalanmış
            const textRadius = radius * 0.65;
            const textAngle = startAngle + anglePerPrize / 2;
            const textRad = (textAngle - 90) * Math.PI / 180;
            const textX = centerX + textRadius * Math.cos(textRad);
            const textY = centerY + textRadius * Math.sin(textRad);
            // Dikey yazı için
            svgContent += `
                <path d="${pathData}"
                      fill="${prize.color || '#ff0000'}"
                      stroke="white"
                      stroke-width="0.3" />
                <text x="${textX}"
                      y="${textY}"
                      fill="white"
                      font-size="3"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      transform="rotate(${textAngle - 90}, ${textX}, ${textY})">
                    ${prize.name}
                </text>
            `;
        });
        wheel.innerHTML = svgContent;
        // Hata mesajını gizle (başarılı durumda)
        showError('', false);
    };
    // Kullanıcı cihaz ve konum bilgilerini topla
    const getUserData = () => {
        const userData = {
            // Tarayıcı ve cihaz bilgileri
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            vendor: navigator.vendor,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            screenColorDepth: window.screen.colorDepth,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            isOnline: navigator.onlineStatus || navigator.onLine,
            cookiesEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            // Sayfa bilgileri
            pageUrl: window.location.href,
            pageTitle: document.title,
            referrer: document.referrer,
            timezoneOffset: new Date().getTimezoneOffset(),
            // Zamanla ilgili bilgiler
            timestamp: new Date().toISOString(),
            localDate: new Date().toString()
        };
        // İsteğe bağlı olarak mevcut olan diğer bilgileri topla
        if (navigator.connection) {
            userData.connectionType = navigator.connection.effectiveType;
            userData.connectionDownlink = navigator.connection.downlink;
        }
        return userData;
    };
    // Ödül kazanma bilgisini sunucuya gönder
    const logPrizeWin = (prizeIndex, couponCode, email) => {
        try {
            // Script elemanını bul
            const scriptElement = document.getElementById('eticaretsiteyoneticisi');
            if (!scriptElement) return;
            // Shop ID'yi al
            const shopId = scriptElement.getAttribute('data-shop-id');
            if (!shopId) return;
            // Ödül bilgilerini al
            const prize = widgetSettings.prizes[prizeIndex];
            if (!prize) return;
            // Ekran çözünürlüğünü al
            const screenRes = `${window.screen.width}x${window.screen.height}`;
            // Form verilerini hazırla
            const formData = new FormData();
            formData.append('shop_id', shopId);
            formData.append('prize_id', prize.id);
            formData.append('coupon_code', couponCode || '');
            formData.append('screen_res', screenRes);
            formData.append('email', email || ''); // Email bilgisini ekle
            // Kullanıcı bilgilerini ekleyelim
            const userData = getUserData();
            formData.append('user_data', JSON.stringify(userData));
            // Kupon ID'sini ekle (varsa)
            if (prize.coupon_ids && prize.coupon_ids.length > 0 && couponCode) {
                const couponIndex = prize.coupons.indexOf(couponCode);
                if (couponIndex !== -1 && prize.coupon_ids[couponIndex]) {
                    formData.append('coupon_id', prize.coupon_ids[couponIndex]);
                }
            }
            // Sunucuya gönder - IP otomatik olarak sunucu tarafında alınacak
            fetch('https://carkifelek.io/api.php?action=log_prize', {
                method: 'POST',
                body: formData
            }).then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('API yanıt içeriği:', text);
                        throw new Error('Ödül kaydı başarısız: ' + response.status);
                    });
                }
                return response.json();
            }).then(data => {
            }).catch(error => {
            });
        } catch (error) {
        }
    };

    // Çarkı döndür - Güncellenmiş fonksiyon - Email kontrolü eklendi
    const spinWheel = async () => {
        const timeBarTextElem = document.getElementById(`${widgetId}-time-bar-text`);
        const floatButtonH1Elem = document.querySelector(`#${widgetId}-open-wheel-btn h1`);
        if (timeBarTextElem && floatButtonH1Elem) {
            floatButtonH1Elem.prepend(timeBarTextElem);
        }
        // Zaten dönüyor mu kontrolü
        const isSpinning = window[`${widgetId}_isSpinning`] || false;
        if (isSpinning) {
            return;
        }

        // Widget ayarlarının yüklenip yüklenmediğini kontrol et
        if (!widgetSettings || !widgetSettings.prizes || widgetSettings.prizes.length === 0) {
            showError('Çark ayarları yüklenemedi. Lütfen sayfayı yenileyip tekrar deneyin.');
            return;
        }

        // ÖNEMLİ: Daha önce çevirdi mi kontrolü
        const storedResult = getSpinResult();
        if (storedResult) {
            showPrizeModal(storedResult.prizeIndex, storedResult.coupon);
            return; // Daha önce çevrilmişse işlemi sonlandır
        }

        // Email bilgisi var mı kontrol et
        let userEmail = getUserEmail();

        // Email yoksa formdan alıp kontrol et
        if (!userEmail) {
            const emailInput = document.getElementById(`${widgetId}-email`);
            const agreementCheckbox = document.getElementById(`${widgetId}-agreement`);

            // Form doğrulaması
            let isValid = true;
            if (!emailInput || !emailInput.value) {
                showFormError(`${widgetId}-email-error`, 'E-posta adresinizi girmelisiniz.');
                isValid = false;
            } else if (!validateEmail(emailInput.value)) {
                showFormError(`${widgetId}-email-error`, 'Lütfen geçerli bir e-posta adresi giriniz.');
                isValid = false;
            } else {
                hideFormError(`${widgetId}-email-error`);
            }

            if (!agreementCheckbox || !agreementCheckbox.checked) {
                showFormError(`${widgetId}-agreement-error`, 'Devam etmek için izin vermeniz gerekmektedir.');
                isValid = false;
            } else {
                hideFormError(`${widgetId}-agreement-error`);
            }

            if (!isValid) {
                return; // Form geçerli değilse işlemi durdur
            }

            // Form geçerliyse e-posta bilgisini al
            userEmail = emailInput.value;

            // Veritabanında email kontrolü yap
            const emailExists = await checkEmailInDatabase(userEmail);
            if (emailExists) {
                showFormError(`${widgetId}-email-error`, 'Bu email adresi zaten kullanılmış. Lütfen başka bir email adresi giriniz.');
                return; // Email veritabanında varsa işlemi durdur
            }

            // Email veritabanında yoksa devam et ve bilgiyi kaydet
            saveUserEmail(userEmail);

            try {
                const klaviyoResult = await sendToKlaviyo(userEmail);
                if (!klaviyoResult.success) {
                    console.error('Klaviyo entegrasyonu başarısız:', klaviyoResult.message);
                    // Klaviyo hatası olsa bile çarkı çevirmeye devam et
                    // Sadece kullanıcıya bilgi ver
                    setTimeout(() => {
                        const errorElement = document.getElementById(`${widgetId}-error-message`);
                        if (errorElement) {
                            errorElement.textContent = 'Email kaydedilirken sorun oluştu, ancak çark dönmeye devam edebilirsiniz.';
                            errorElement.style.display = 'none';
                            setTimeout(() => {
                                errorElement.style.display = 'none';
                            }, 5000);
                        }
                    }, 100);
                }
            } catch (error) {
                console.error('Klaviyo entegrasyonu hata:', error);
                // Hata olsa bile devam et
            }

            // Email formunu gizle
            const emailFormContainer = document.getElementById(`${widgetId}-email-form-container`);
            if (emailFormContainer) {
                emailFormContainer.style.display = 'none';
            }
        } else {
            // Kaydedilmiş email varsa, veritabanında kontrol et
            const emailExists = await checkEmailInDatabase(userEmail);
            if (emailExists) {
                // Kullanıcıya bilgi ver
                alert('Bu email adresi zaten kullanılmış. Lütfen başka bir email adresi giriniz.');

                // Email bilgisini temizle ve formu göster
                saveUserEmail(null);
                const emailFormContainer = document.getElementById(`${widgetId}-email-form-container`);
                if (emailFormContainer) {
                    emailFormContainer.style.display = 'block';
                }
                return;
            }
        }

        // Çark döndürmeye devam et
        const wheel = document.getElementById(`${widgetId}-wheel`);
        const spinButton = document.getElementById(`${widgetId}-spin-button`);
        const prizes = widgetSettings.prizes;

        // Çark durumunu güncelle
        window[`${widgetId}_isSpinning`] = true;
        spinButton.textContent = "DÖNDÜRÜLÜYOR...";
        spinButton.disabled = true; // Butonu devre dışı bırak

        // Ağırlıklı rastgele seçim
        function weightedRandomChoice() {
            const totalWeight = prizes.reduce((sum, prize) => sum + prize.chance, 0);
            let randomNum = Math.random() * totalWeight;
            for (let i = 0; i < prizes.length; i++) {
                if (randomNum < prizes[i].chance) {
                    return i;
                }
                randomNum -= prizes[i].chance;
            }
            return 0;
        }

        // Kazanan ödülü seç
        const winningIndex = weightedRandomChoice();

        // Açıyı hesapla
        const prizeAngle = 360 / prizes.length;
        const targetAngle = (360 - (winningIndex * prizeAngle)) - (prizeAngle / 2);
        const spins = 5; // 5 tam tur
        const totalRotation = (spins * 360) + targetAngle;

        // Hemen sonucu kaydet (çark dönerken bile) - bu önemli bir güvenlik önlemi
        const selectedPrize = prizes[winningIndex];

        // Kupon array kontrolü
        if (!selectedPrize.coupons || selectedPrize.coupons.length === 0) {
            selectedPrize.coupons = [""];
        }
        const randomCoupon = selectedPrize.coupons[Math.floor(Math.random() * selectedPrize.coupons.length)];

        // Zaman damgasını da ekleyerek sonucu sakla
        const currentTime = new Date().toISOString();
        saveSpinResult({
            prizeIndex: winningIndex,
            coupon: randomCoupon,
            email: userEmail,
            timestamp: currentTime
        });

        // Zaman çubuğunu hemen başlat (tam 5 dakika)
        startTimeBar(300);

        // Çarkı döndür
        wheel.style.transition = 'transform 5s cubic-bezier(.17,.67,.12,.99)';
        wheel.style.transform = `rotate(${totalRotation}deg)`;

        // Çark durduğunda
        setTimeout(() => {
            // Buton stilini güncelle
            spinButton.textContent = "HEDİYENİ GÖSTER";
            spinButton.classList.add('already-spun');
            spinButton.disabled = false; // Butonu tekrar aktif et

            // Devre dışı mesajını göster
            const disabledMessage = document.getElementById(`${widgetId}-wheel-disabled-message`);
            if (disabledMessage) {
                disabledMessage.style.display = 'block';
            }

            // Ödül kazanma bilgisini sunucuya kaydet (email ile birlikte)
            logPrizeWin(winningIndex, randomCoupon, userEmail);

            // Ödül modalını göster
            showPrizeModal(winningIndex, randomCoupon);

            // Durumu sıfırla
            window[`${widgetId}_isSpinning`] = false;
        }, 5000);
    };

    // Ödül modalını göster
    const showPrizeModal = (prizeIndex, couponCode) => {
        if (!widgetSettings || !widgetSettings.prizes || prizeIndex >= widgetSettings.prizes.length) {
            console.error('Ödül bilgileri bulunamadı veya geçersiz indeks');
            showError('Ödül bilgileri alınamadı. Lütfen sayfayı yenileyip tekrar deneyin.');
            return;
        }
        const modal = document.getElementById(`${widgetId}-prize-modal`);
        const prizeText = document.getElementById(`${widgetId}-prize-text`);
        const prizeDesc = document.getElementById(`${widgetId}-prize-description`);
        const couponElement = document.getElementById(`${widgetId}-coupon-code`);
        const productLink = document.getElementById(`${widgetId}-product-link`);
        const prizes = widgetSettings.prizes;
        const prize = prizes[prizeIndex];
        prizeText.textContent = prize.name;
        prizeDesc.textContent = prize.description;
        couponElement.textContent = couponCode || "";
        productLink.href = prize.url;
        // Kupon kodu yoksa kupon alanını gizle
        const couponContainer = document.querySelector(`#${widgetId}-prize-modal .coupon-container`);
        if (!couponCode || couponCode.trim() === "") {
            couponContainer.style.display = 'none';
        } else {
            couponContainer.style.display = 'block';
        }
        modal.classList.add('active');
    };
    // Ödül modalını kapat
    const closePrizeModal = () => {
        const modal = document.getElementById(`${widgetId}-prize-modal`);
        modal.classList.remove('active');
    };
    // Çark modalını aç
    const openWheelModal = () => {
        const modal = document.getElementById(`${widgetId}-wheel-modal`);
        modal.classList.add('active');
        // Açıldığında float-button'ı gizle
        const floatButton = document.getElementById(`${widgetId}-open-wheel-btn`);
        floatButton.style.display = 'none';
        // Çarkı gördüğünü kaydet
        saveWheelSeen();
        // Daha önce çevirdi mi kontrolü
        const hasSpunBefore = checkSpinStatus();
        if (!hasSpunBefore) {
            // Email bilgisi var mı kontrol et
            const userEmail = getUserEmail();
            const emailFormContainer = document.getElementById(`${widgetId}-email-form-container`);
            const spinButton = document.getElementById(`${widgetId}-spin-button`);
            if (userEmail) {
                // Email zaten alınmışsa, form alanını gizle
                if (emailFormContainer) emailFormContainer.style.display = 'none';
                if (spinButton) spinButton.style.display = 'block';
            } else {
                // Email yoksa, email formunu göster ve çevirme butonunu gizle
                if (emailFormContainer) emailFormContainer.style.display = 'block';
                if (spinButton) spinButton.style.display = 'block';
            }
        }
    };
    // Çark modalını küçült (kapatmak yerine)
    const minimizeWheelModal = () => {
        const modal = document.getElementById(`${widgetId}-wheel-modal`);
        modal.classList.remove('active');
        // Küçültüldüğünde float-button'ı görünür yap
        const floatButton = document.getElementById(`${widgetId}-open-wheel-btn`);
        floatButton.style.display = 'flex';
    };
    // Kupon kodunu kopyala
    const copyToClipboard = () => {
        const couponCode = document.getElementById(`${widgetId}-coupon-code`).textContent;
        const copyButton = document.getElementById(`${widgetId}-copy-button`);
        if (!couponCode || couponCode.trim() === "") {
            alert('Kopyalanacak kupon kodu yok');
            return;
        }
        navigator.clipboard.writeText(couponCode)
            .then(() => {
                // Kopyalama başarılı
                const originalText = copyButton.innerHTML;
                copyButton.innerHTML = '<i class="fas fa-check"></i> Kopyalandı!';
                copyButton.style.background = '#28a745';
                setTimeout(() => {
                    copyButton.innerHTML = originalText;
                    copyButton.style.background = '';
                }, 2000);
            })
            .catch(err => {
                // Fallback mekanizması
                const textArea = document.createElement('textarea');
                textArea.value = couponCode;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    const originalText = copyButton.innerHTML;
                    copyButton.innerHTML = '<i class="fas fa-check"></i> Kopyalandı!';
                    copyButton.style.background = '#28a745';
                    setTimeout(() => {
                        copyButton.innerHTML = originalText;
                        copyButton.style.background = '';
                    }, 2000);
                } catch (e) {
                    console.error('Kopyalama hatası:', e);
                    alert(`Kupon kodunuz: ${couponCode}`);
                }
                document.body.removeChild(textArea);
            });
    };
    // İlk açılışta durum ayarları
    const setupInitialState = async () => {
        const floatButton = document.getElementById(`${widgetId}-open-wheel-btn`);
        const floatButtonH1 = floatButton.querySelector('h1');

        // Daha önce çevirdi mi kontrolü
        const hasSpun = checkSpinStatus();

        // Zamanlayıcı durumunu kontrol et
        const savedTimerState = getTimerState();
        if (savedTimerState && savedTimerState > 0) {
            // LocalStorage'dan alınan süreyle devam et
            startTimeBar(savedTimerState);
        } else if (hasSpun) {
            // Eğer kaydedilmiş timer yoksa ve çevirme varsa timestamp'e bak
            const storedResult = getSpinResult();
            if (storedResult && storedResult.timestamp) {
                const startTime = new Date(storedResult.timestamp);
                const now = new Date();
                const elapsedSeconds = Math.floor((now - startTime) / 1000);
                const totalTime = 300; // 5 dakika
                if (elapsedSeconds < totalTime) {
                    // Kalan zamanla zaman çubuğunu başlat
                    startTimeBar(totalTime - elapsedSeconds);
                } else {
                    // Süre bitmişse timer'ı 0 olarak ayarla
                    startTimeBar(0);
                    if (floatButtonH1) {
                        floatButtonH1.textContent = 'Çarkı Çevir!';
                    }
                }
            }
        } else {
            // Çevirmemiş ve timer durumu yoksa, timer'ı başlatma
            // Çubuğu yine de göster ama 0 olarak
            const timeBar = document.getElementById(`${widgetId}-time-bar`);
            const timeBarText = document.getElementById(`${widgetId}-time-bar-text`);
            if (timeBar) timeBar.style.width = '0%';
            if (timeBarText) timeBarText.textContent = '0:00';
            if (floatButtonH1) {
                floatButtonH1.textContent = 'Çarkı Çevir!';
            }
        }
        // Eğer çevirmediyse email kontrol et
        if (!hasSpun) {
            const userEmail = getUserEmail();
            const emailFormContainer = document.getElementById(`${widgetId}-email-form-container`);
            const spinButton = document.getElementById(`${widgetId}-spin-button`);
            if (userEmail) {
                // Email alınmışsa, formu gizle
                if (emailFormContainer) emailFormContainer.style.display = 'none';
            }
        }
        // Otomatik açılış ayarını kontrol et
        const showOnLoad = widgetSettings?.widget?.showOnLoad !== false;
        if (hasSeenWheel() || !showOnLoad) {
            // Daha önce görmüşse veya otomatik açılış kapalıysa sadece ikon göster
            floatButton.style.display = 'flex';
        } else {
            // İlk kez görüyorsa çarkı aç, ikonu gizle
            floatButton.style.display = 'none';
            // Gecikme ayarını kontrol et
            const popupDelay = widgetSettings?.widget?.popupDelay || 1000;
            setTimeout(() => {
                openWheelModal();
            }, popupDelay);
        }
    };
    // Event listener'ları ekle
    const setupEventListeners = () => {
        // Spin butonu - Güncellendi: Email kontrolünü de yapacak
        const spinButton = document.getElementById(`${widgetId}-spin-button`);
        spinButton.addEventListener('click', spinWheel);
        // Kopyalama butonu
        document.getElementById(`${widgetId}-copy-button`).addEventListener('click', copyToClipboard);
        // Modal butonları
        document.getElementById(`${widgetId}-close-prize-btn`).addEventListener('click', closePrizeModal);
        document.getElementById(`${widgetId}-open-wheel-btn`).addEventListener('click', openWheelModal);
        document.getElementById(`${widgetId}-close-wheel-btn`).addEventListener('click', minimizeWheelModal);
        // Form otomatik gönderimi engelle
        const emailForm = document.getElementById(`${widgetId}-email-form`);
        if (emailForm) {
            emailForm.addEventListener('submit', e => {
                e.preventDefault(); // Form gönderimini engelle
            });
        }
        // Email input validasyonu
        const emailInput = document.getElementById(`${widgetId}-email`);
        if (emailInput) {
            emailInput.addEventListener('input', () => {
                if (validateEmail(emailInput.value)) {
                    hideFormError(`${widgetId}-email-error`);
                }
            });
        }
        // Checkbox validasyonu
        const agreementCheckbox = document.getElementById(`${widgetId}-agreement`);
        if (agreementCheckbox) {
            agreementCheckbox.addEventListener('change', () => {
                if (agreementCheckbox.checked) {
                    hideFormError(`${widgetId}-agreement-error`);
                }
            });
        }
    };
    // Widget'ı başlat
    const initWidget = async () => {
        try {
            // Konsolda widget bilgilerini göster - hata ayıklama için
            // Widget elemanlarını oluştur
            createWidgetElement();
            // Widget script elemanını bul
            const scriptElement = document.getElementById('eticaretsiteyoneticisi');
            if (!scriptElement) {
                throw new Error('Widget script elemanı bulunamadı (ID: eticaretsiteyoneticisi)');
            }
            // Shop ID'yi al
            const shopId = scriptElement.getAttribute('data-shop-id');
            if (!shopId) {
                throw new Error('data-shop-id özelliği tanımlanmamış');
            }
            // Zamanlayıcı durumunu kontrol et ve varsa yeniden başlat
            const savedTime = getTimerState();
            if (savedTime && savedTime > 0) {
                // Kalan süreyle sayacı başlat
                startTimeBar(savedTime);
            } else {
                // Çevirme durumunu kontrol et
                const storedResult = getSpinResult();
                if (storedResult && storedResult.timestamp) {
                    const startTime = new Date(storedResult.timestamp);
                    const now = new Date();
                    const elapsedSeconds = Math.floor((now - startTime) / 1000);
                    const totalTime = 300; // 5 dakika
                    if (elapsedSeconds < totalTime) {
                        // Kalan zamanla başlat
                        startTimeBar(totalTime - elapsedSeconds);
                    } else {
                        // Süre bitmişse sıfır göster
                        const timeBar = document.getElementById(`${widgetId}-time-bar`);
                        const timeBarText = document.getElementById(`${widgetId}-time-bar-text`);
                        if (timeBar) timeBar.style.width = '0%';
                        if (timeBarText) timeBarText.textContent = '0:00';
                    }
                }
            }
            // Widget ayarlarını al
            const settings = await fetchWidgetSettings(shopId);
            // Ayarları uygula
            applyWidgetSettings(settings);
            // Kar efektini oluştur
            createSnowflakes();
            // Event listenerları ekle
            setupEventListeners();
            // İlk açılış durumunu ayarla
            await setupInitialState();
        } catch (error) {
            console.error('Widget başlatılırken hata oluştu:', error);
            showLoading(false);
            showError(`Widget yüklenirken bir hata oluştu: ${error.message}`);
        }
    };
    // Sayfa yüklendiğinde widget'ı başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }

    // Renk ayarlama yardımcı fonksiyonu
    const adjustColor = (color, amount) => {
        // Hex rengi RGB'ye çevir
        let r = parseInt(color.slice(1, 3), 16);
        let g = parseInt(color.slice(3, 5), 16);
        let b = parseInt(color.slice(5, 7), 16);

        // Renkleri ayarla
        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));

        // RGB'yi hex'e çevir
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };

    // Ziyaretçi ID'sini oluştur veya mevcut olanı al
    function getVisitorId() {
        let visitorId = localStorage.getItem('wheel_visitor_id');
        if (!visitorId) {
            visitorId = 'vis_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('wheel_visitor_id', visitorId);
        }
        return visitorId;
    }

    // Cihaz tipini belirle
    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    }

    // Widget yüklendiğinde ziyaretçi sayısını güncelle
    function updateViewCount() {
        const shopId = document.getElementById('eticaretsiteyoneticisi').getAttribute('data-shop-id');
        if (!shopId) return;

        fetch('https://carkifelek.io/widget_view.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                shop_id: shopId,
                visitor_id: getVisitorId(),
                device_type: getDeviceType()
            })
        }).catch(error => console.error('Görüntülenme sayısı güncellenirken hata:', error));
    }

    // Widget yüklendiğinde görüntülenme sayısını güncelle
    document.addEventListener('DOMContentLoaded', function () {
        updateViewCount();
    });

    // Global scope'a openWheelWidget fonksiyonunu ekle
    window.openWheelWidget = function () {
        const floatButton = document.querySelector(`#${widgetId} .float-button`);
        if (floatButton) {
            floatButton.click();
        } else {
            console.error('Widget butonu bulunamadı!');
        }
    };
})();