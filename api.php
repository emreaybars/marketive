<?php
// api.php - Çarkıfelek Widget API - Kazanılan ödül ve email kaydı + Brevo entegrasyonu
// CORS ayarları
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json; charset=utf-8');

// Geliştirme modu - Canlıya alınca kapatın
$dev_mode = false;
if ($dev_mode) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// OPTIONS isteği için erken yanıt
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Veritabanı bağlantı bilgileri
$db_config = [
    'host' => 'localhost',
    'username' => 'u843469443_carkifelekio', // Kendi kullanıcı adınızı girin
    'password' => 'Naruto1998.-',      // Kendi şifrenizi girin
    'database' => 'u843469443_carkifelekio'           // Kendi veritabanı adınızı girin
];

// Brevo entegrasyonunu dahil et
define('BREVO_API_KEY', 'your-brevo-api-key');
define('BREVO_LIST_ID', 3); // Brevo'daki liste ID'nizi buraya yazın

require_once 'brevo_integration.php';

// Hata kayıt fonksiyonu
function logError($message)
{
    $logFile = __DIR__ . '/api_errors.log';
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message" . PHP_EOL;
    // Hata logunu dosyaya yaz
    file_put_contents($logFile, $logMessage, FILE_APPEND);
}

// Veritabanı bağlantı fonksiyonu
function connectDB()
{
    global $db_config;
    try {
        $dsn = "mysql:host={$db_config['host']};dbname={$db_config['database']};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ];
        $pdo = new PDO($dsn, $db_config['username'], $db_config['password'], $options);
        return $pdo;
    } catch (PDOException $e) {
        logError("Veritabanı bağlantı hatası: " . $e->getMessage());
        return null;
    }
}

// Hata yanıtı
function respondWithError($message, $details = null, $code = 500)
{
    global $dev_mode;
    http_response_code($code);
    $response = ['error' => $message];
    // Geliştirme modundaysa hata detaylarını da ekle
    if ($dev_mode && $details) {
        $response['details'] = $details;
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

// Domain kontrolü
function isDomainAllowed($shopId, $referrer, $conn)
{
    // Geliştirme modunda ve direct=1 parametresi varsa kontrolü atlayabilirsiniz
    if (isset($_GET['direct']) && $_GET['direct'] === '1') {
        return true;
    }
    try {
        // Mağazanın izin verilen domainlerini al
        $stmt = $conn->prepare("SELECT allowed_domains FROM shops WHERE shop_id = :shop_id");
        $stmt->bindParam(':shop_id', $shopId);
        $stmt->execute();
        $result = $stmt->fetch();
        if (!$result) {
            logError("Mağaza bulunamadı: $shopId");
            return false;
        }
        // allowed_domains sütunu boşsa veya NULL ise tüm domainlere izin ver (eski kayıtlar için)
        if (empty($result['allowed_domains'])) {
            return true;
        }
        // Referrer'dan domain'i çıkar
        $referrerDomain = '';
        if (!empty($referrer)) {
            $parsedUrl = parse_url($referrer);
            if (isset($parsedUrl['host'])) {
                $referrerDomain = strtolower($parsedUrl['host']);
            }
        }
        // Boş domain kontrolü (tarayıcı, doğrudan API çağrısı veya localhost için)
        if (empty($referrerDomain)) {
            // localhost veya 127.0.0.1 gibi yerel geliştirme ortamlarında doğrulama atla
            if (isset($_SERVER['REMOTE_ADDR']) && ($_SERVER['REMOTE_ADDR'] === '127.0.0.1' || $_SERVER['REMOTE_ADDR'] === '::1')) {
                return true;
            }
            // Doğrudan API çağrısı yapılıyorsa izin ver
            if (isset($_SERVER['HTTP_USER_AGENT']) && strpos($_SERVER['HTTP_USER_AGENT'], 'PostmanRuntime') !== false) {
                return true;
            }
            logError("Referrer domain boş: $shopId, IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'Bilinmiyor'));
            return false;
        }
        // İzin verilen domainleri virgülle ayır ve dizi haline getir
        $allowedDomains = array_map('trim', explode(',', strtolower($result['allowed_domains'])));
        // Domain izin verilen listede mi kontrol et
        $isDomainAllowed = in_array($referrerDomain, $allowedDomains);
        if (!$isDomainAllowed) {
            logError("İzinsiz domain erişimi: Shop ID: $shopId, Domain: $referrerDomain, İzin verilenler: " . $result['allowed_domains']);
        }
        return $isDomainAllowed;
    } catch (PDOException $e) {
        logError("Domain doğrulama hatası: " . $e->getMessage());
        return false;
    }
}

// Cihaz ve tarayıcı bilgilerini tespit et
function detectDevice($userAgent)
{
    $deviceType = 'Unknown';
    $browser = 'Unknown';
    $os = 'Unknown';
    // Mobil cihaz kontrolü
    if (preg_match('/(android|iphone|ipad|ipod|blackberry|windows phone)/i', $userAgent)) {
        $deviceType = 'Mobile';
    }
    // Tablet kontrolü
    elseif (preg_match('/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i', $userAgent)) {
        $deviceType = 'Tablet';
    }
    // Masaüstü varsayılan
    else {
        $deviceType = 'Desktop';
    }
    // İşletim sistemi tespiti
    if (preg_match('/windows|win32|win64/i', $userAgent)) {
        $os = 'Windows';
    } elseif (preg_match('/macintosh|mac os x/i', $userAgent)) {
        $os = 'macOS';
    } elseif (preg_match('/android/i', $userAgent)) {
        $os = 'Android';
    } elseif (preg_match('/iphone|ipad|ipod/i', $userAgent)) {
        $os = 'iOS';
    } elseif (preg_match('/linux/i', $userAgent)) {
        $os = 'Linux';
    }
    // Tarayıcı tespiti
    if (preg_match('/MSIE|Trident/i', $userAgent)) {
        $browser = 'Internet Explorer';
    } elseif (preg_match('/Firefox/i', $userAgent)) {
        $browser = 'Firefox';
    } elseif (preg_match('/Chrome/i', $userAgent)) {
        if (preg_match('/Edge/i', $userAgent)) {
            $browser = 'Edge';
        } elseif (preg_match('/Edg/i', $userAgent)) {
            $browser = 'Edge';
        } elseif (preg_match('/OPR|Opera/i', $userAgent)) {
            $browser = 'Opera';
        } else {
            $browser = 'Chrome';
        }
    } elseif (preg_match('/Safari/i', $userAgent)) {
        $browser = 'Safari';
    }
    return [
        'device_type' => $deviceType,
        'os' => $os,
        'browser' => $browser
    ];
}

// Email kontrolü endpoint'i
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'check_email') {
    checkEmail();
    exit;
}

// Email kontrolü fonksiyonu
function checkEmail()
{
    // CORS ayarları
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header('Content-Type: application/json; charset=utf-8');
    // OPTIONS isteği için erken yanıt
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
    // POST parametrelerini kontrol et
    if (!isset($_POST['email']) || !isset($_POST['shop_id'])) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Email ve shop_id parametreleri gereklidir'
        ]);
        return;
    }
    $email = trim($_POST['email']);
    $shopId = $_POST['shop_id'];
    try {
        $conn = connectDB();
        // won_prizes tablosunda email kontrolü
        $stmt = $conn->prepare("SELECT COUNT(*) as count FROM won_prizes WHERE email = :email AND shop_id = :shop_id");
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':shop_id', $shopId);
        $stmt->execute();
        $result = $stmt->fetch();
        $exists = $result['count'] > 0;
        echo json_encode([
            'status' => 'success',
            'exists' => $exists
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Email kontrolü sırasında hata oluştu: ' . $e->getMessage()
        ]);
        logError("Email kontrolü hatası: " . $e->getMessage());
    }
}

// Kazanılan ödülü kaydet
// Yeni endpoint: log_prize - Kazanılan ödülü kaydet
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'log_prize') {
    logPrize();
    exit;
}

// Kazanılan ödülü kaydet
function logPrize()
{
    // CORS ayarları
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header('Content-Type: application/json; charset=utf-8');
    // OPTIONS isteği için erken yanıt
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
    // POST parametrelerini kontrol et
    $requiredParams = ['shop_id', 'prize_id'];
    $missingParams = [];
    foreach ($requiredParams as $param) {
        if (!isset($_POST[$param]) || empty($_POST[$param])) {
            $missingParams[] = $param;
        }
    }
    if (!empty($missingParams)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Eksik parametreler: ' . implode(', ', $missingParams)
        ]);
        return;
    }
    // POST verilerini güvenli bir şekilde al
    $shopId = $_POST['shop_id'];
    $prizeId = (int) $_POST['prize_id'];
    $couponId = isset($_POST['coupon_id']) ? (int) $_POST['coupon_id'] : null;
    $couponCode = isset($_POST['coupon_code']) ? $_POST['coupon_code'] : null;
    $email = isset($_POST['email']) ? $_POST['email'] : null; // Email parametresini al
    // Kullanıcı bilgilerini al
    $userIp = $_SERVER['REMOTE_ADDR'];
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    $referrerUrl = $_SERVER['HTTP_REFERER'] ?? null;
    // Ekran çözünürlüğü bilgisini al
    $screenResolution = isset($_POST['screen_res']) ? $_POST['screen_res'] : null;
    // Cihaz ve tarayıcı bilgilerini tespit et
    $deviceInfo = detectDevice($userAgent);
    try {
        $conn = connectDB();
        // Mağaza ve ödül kontrolü
        $stmt = $conn->prepare("SELECT p.id FROM prizes p
                              JOIN shops s ON p.shop_id = s.shop_id
                              WHERE p.id = :prize_id AND s.shop_id = :shop_id");
        $stmt->bindParam(':prize_id', $prizeId);
        $stmt->bindParam(':shop_id', $shopId);
        $stmt->execute();
        if (!$stmt->fetch()) {
            throw new Exception("Geçersiz mağaza veya ödül ID");
        }
        // Hata ayıklama (debug)
        logError("Ödül kazanma kayıt girişimi - Shop ID: $shopId, Prize ID: $prizeId, Email: " . ($email ? $email : 'Belirtilmemiş') . ", IP: $userIp, Device: {$deviceInfo['device_type']}");
        // won_prizes tablosunun varlığını kontrol et
        $tableExists = false;
        try {
            $checkStmt = $conn->query("SHOW TABLES LIKE 'won_prizes'");
            $tableExists = $checkStmt->rowCount() > 0;
        } catch (PDOException $e) {
            logError("Tablo kontrolü hatası: " . $e->getMessage());
        }
        // won_prizes tablosu yoksa oluştur
        if (!$tableExists) {
            try {
                $createTableSQL = "CREATE TABLE won_prizes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    shop_id VARCHAR(50) NOT NULL,
                    prize_id INT NOT NULL,
                    coupon_id INT DEFAULT NULL,
                    coupon_code VARCHAR(50) DEFAULT NULL,
                    email VARCHAR(255) DEFAULT NULL,
                    user_ip VARCHAR(45) NOT NULL,
                    user_agent VARCHAR(255) NOT NULL,
                    device_type VARCHAR(20) DEFAULT NULL,
                    browser VARCHAR(50) DEFAULT NULL,
                    operating_system VARCHAR(50) DEFAULT NULL,
                    screen_resolution VARCHAR(20) DEFAULT NULL,
                    referrer_url TEXT DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX (shop_id),
                    INDEX (prize_id),
                    INDEX (email),
                    INDEX (created_at)
                )";
                $conn->exec($createTableSQL);
                logError("won_prizes tablosu otomatik oluşturuldu");
            } catch (PDOException $e) {
                logError("Tablo oluşturma hatası: " . $e->getMessage());
            }
        } else {
            // Email sütununu kontrol et ve yoksa ekle
            try {
                $checkEmailColumn = $conn->query("SHOW COLUMNS FROM won_prizes LIKE 'email'");
                if ($checkEmailColumn->rowCount() === 0) {
                    $conn->exec("ALTER TABLE won_prizes ADD COLUMN email VARCHAR(255) DEFAULT NULL AFTER coupon_code, ADD INDEX (email)");
                    logError("won_prizes tablosuna email sütunu eklendi");
                }
            } catch (PDOException $e) {
                logError("Sütun kontrolü hatası: " . $e->getMessage());
            }
        }
        // Shops tablosuna entegrasyon alanlarını ekle
        try {
            $checkBrevoApiKey = $conn->query("SHOW COLUMNS FROM shops LIKE 'brevo_api_key'");
            if ($checkBrevoApiKey->rowCount() === 0) {
                $conn->exec("ALTER TABLE shops 
                    ADD COLUMN brevo_api_key VARCHAR(255) DEFAULT NULL,
                    ADD COLUMN brevo_list_id INT DEFAULT NULL,
                    ADD COLUMN klaviyo_public_key VARCHAR(255) DEFAULT NULL,
                    ADD COLUMN klaviyo_private_key VARCHAR(255) DEFAULT NULL,
                    ADD COLUMN klaviyo_list_id VARCHAR(255) DEFAULT NULL");
                logError("shops tablosuna entegrasyon alanları eklendi");
            }
        } catch (PDOException $e) {
            logError("Entegrasyon alanları eklenirken hata: " . $e->getMessage());
        }
        // Ödül kazanma kaydını ekle
        $stmt = $conn->prepare("INSERT INTO won_prizes
                              (shop_id, prize_id, coupon_id, coupon_code, email, user_ip, user_agent,
                               device_type, browser, operating_system, screen_resolution, referrer_url)
                              VALUES
                              (:shop_id, :prize_id, :coupon_id, :coupon_code, :email, :user_ip, :user_agent,
                               :device_type, :browser, :operating_system, :screen_resolution, :referrer_url)");
        $stmt->bindParam(':shop_id', $shopId);
        $stmt->bindParam(':prize_id', $prizeId);
        $stmt->bindParam(':coupon_id', $couponId);
        $stmt->bindParam(':coupon_code', $couponCode);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':user_ip', $userIp);
        $stmt->bindParam(':user_agent', $userAgent);
        $stmt->bindParam(':device_type', $deviceInfo['device_type']);
        $stmt->bindParam(':browser', $deviceInfo['browser']);
        $stmt->bindParam(':operating_system', $deviceInfo['os']);
        $stmt->bindParam(':screen_resolution', $screenResolution);
        $stmt->bindParam(':referrer_url', $referrerUrl);
        $result = $stmt->execute();
        if (!$result) {
            throw new Exception("Kayıt eklenemedi: " . implode(', ', $stmt->errorInfo()));
        }
        $wonPrizeId = $conn->lastInsertId();
        logError("Ödül kazanma kaydedildi: ID=$wonPrizeId, Shop ID: $shopId, Prize ID: $prizeId, Email: " . ($email ? $email : 'Belirtilmemiş') . ", IP: $userIp");

        // Mağaza ve ödül bilgilerini al
        $shopStmt = $conn->prepare("SELECT name, brand_name, website_url, brevo_api_key, brevo_list_id, klaviyo_public_key, klaviyo_private_key, klaviyo_list_id FROM shops WHERE shop_id = :shop_id");
        $shopStmt->bindParam(':shop_id', $shopId);
        $shopStmt->execute();
        $shopData = $shopStmt->fetch();

        $prizeStmt = $conn->prepare("SELECT name, description FROM prizes WHERE id = :prize_id");
        $prizeStmt->bindParam(':prize_id', $prizeId);
        $prizeStmt->execute();
        $prizeData = $prizeStmt->fetch();

        // Eğer email varsa, entegrasyonları yap
        if ($email) {
            // Brevo entegrasyonu
            if (!empty($shopData['brevo_api_key']) && !empty($shopData['brevo_list_id'])) {
                $attributes = [
                    'SHOP_NAME' => $shopData['name'] ?? '',
                    'SHOP_ID' => $shopId,
                    'PRIZE_NAME' => $prizeData['name'] ?? '',
                    'PRIZE_ID' => $prizeId,
                    'COUPON_CODE' => $couponCode ?? '',
                    'PRIZE_DESCRIPTION' => $prizeData['description'] ?? '',
                    'DEVICE_TYPE' => $deviceInfo['device_type'] ?? '',
                    'SUBSCRIPTION_SOURCE' => 'Sektörün Lideri Hediye Çarkı',
                    'SUBSCRIPTION_DATE' => date('Y-m-d'),
                    'REFERRER_URL' => $referrerUrl ?? ''
                ];

                $subscribeResult = subscribe_to_brevo(
                    $email,
                    $attributes,
                    $shopId,
                    $shopData['name'] ?? '',
                    $couponCode ?? '',
                    $prizeData['name'] ?? '',
                    $prizeData['description'] ?? '',
                    $referrerUrl ?? '',
                    $shopData['brevo_api_key'],
                    $shopData['brevo_list_id']
                );

                // Çark çevirme olayını kaydet
                $eventData = [
                    'event' => 'wheel_spin',
                    'properties' => [
                        'shop_id' => $shopId,
                        'shop_name' => $shopData['name'] ?? '',
                        'prize_id' => $prizeId,
                        'prize_name' => $prizeData['name'] ?? '',
                        'coupon_code' => $couponCode ?? '',
                        'device_type' => $deviceInfo['device_type'] ?? '',
                        'spin_date' => date('Y-m-d'),
                        'referrer_url' => $referrerUrl ?? ''
                    ]
                ];

                track_brevo_event($email, $eventData, $shopId, $shopData['name'] ?? '', $shopData['brevo_api_key']);

                logError("Brevo entegrasyonu - Email: $email, Shop: {$shopData['name']}, Kupon: " . ($couponCode ?? 'Yok') . ", Sonuç: " .
                    ($subscribeResult['success'] ? 'Başarılı' : 'Başarısız - ' . $subscribeResult['message']));
            }

            // Klaviyo entegrasyonu
            if (!empty($shopData['klaviyo_public_key']) && !empty($shopData['klaviyo_private_key']) && !empty($shopData['klaviyo_list_id'])) {
                require_once 'klaviyo_integration.php';

                $klaviyoAttributes = [
                    'Shop Name' => $shopData['name'] ?? '',
                    'Shop ID' => $shopId,
                    'Prize Name' => $prizeData['name'] ?? '',
                    'Prize ID' => $prizeId,
                    'Coupon Code' => $couponCode ?? '',
                    'Prize Description' => $prizeData['description'] ?? '',
                    'Device Type' => $deviceInfo['device_type'] ?? '',
                    'Subscription Source' => 'Sektörün Lideri Hediye Çarkı',
                    'Subscription Date' => date('Y-m-d'),
                    'Referrer URL' => $referrerUrl ?? ''
                ];

                $klaviyoResult = subscribe_to_klaviyo(
                    $email,
                    $klaviyoAttributes,
                    $shopData['klaviyo_public_key'],
                    $shopData['klaviyo_private_key'],
                    $shopData['klaviyo_list_id']
                );

                // Klaviyo olayını kaydet
                $klaviyoEventData = [
                    'event' => 'Wheel Spin',
                    'properties' => [
                        'Shop ID' => $shopId,
                        'Shop Name' => $shopData['name'] ?? '',
                        'Prize ID' => $prizeId,
                        'Prize Name' => $prizeData['name'] ?? '',
                        'Coupon Code' => $couponCode ?? '',
                        'Device Type' => $deviceInfo['device_type'] ?? '',
                        'Spin Date' => date('Y-m-d'),
                        'Referrer URL' => $referrerUrl ?? ''
                    ]
                ];

                track_klaviyo_event($email, $klaviyoEventData, $shopData['klaviyo_private_key']);

                logError("Klaviyo entegrasyonu - Email: $email, Shop: {$shopData['name']}, Kupon: " . ($couponCode ?? 'Yok') . ", Sonuç: " .
                    ($klaviyoResult['success'] ? 'Başarılı' : 'Başarısız - ' . $klaviyoResult['message']));
            }
        }

        // Başarılı yanıt
        echo json_encode([
            'status' => 'success',
            'message' => 'Ödül kazanma başarıyla kaydedildi',
            'won_prize_id' => $wonPrizeId
        ]);
    } catch (Exception $e) {
        // Hata yanıtı
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Ödül kazanma kaydedilemedi: ' . $e->getMessage()
        ]);
        // Hatayı logla
        logError("Ödül kazanma kaydı hatası: " . $e->getMessage());
    }
}

// Action'a göre ilgili fonksiyonu çağır
$action = $_GET['action'] ?? 'get_widget_data';
switch ($action) {
    case 'get_widget_data':
        // Widget verilerini getir
        getWidgetData();
        break;
    case 'log_prize':
        // Kazanılan ödülü kaydet
        logPrize();
        break;
    case 'check_email':
        // Email kontrolü
        checkEmail();
        break;
    default:
        respondWithError("Geçersiz API işlemi", null, 400);
}

// Widget verilerini getir
function getWidgetData()
{
    // Shop ID parametresi kontrolü
    if (!isset($_GET['shop_id']) || empty($_GET['shop_id'])) {
        respondWithError("Mağaza ID parametresi gerekli", null, 400);
    }
    $shop_id = $_GET['shop_id'];
    $conn = connectDB();
    if (!$conn) {
        respondWithError("Veritabanına bağlanılamadı");
    }
    // Referrer bilgisini al
    $referrer = $_SERVER['HTTP_REFERER'] ?? '';
    // Alan adı kontrolü
    if (!isDomainAllowed($shop_id, $referrer, $conn)) {
        respondWithError("Bu alan adından erişim yetkisi bulunmuyor. Lütfen mağaza yöneticinizle iletişime geçin.", null, 403);
    }
    // Mağaza bilgilerini al
    try {
        $stmt = $conn->prepare("SELECT * FROM shops WHERE shop_id = :shop_id");
        $stmt->bindParam(':shop_id', $shop_id);
        $stmt->execute();
        $shop = $stmt->fetch();
        if (!$shop) {
            respondWithError("Mağaza bulunamadı: $shop_id", null, 404);
        }
    } catch (PDOException $e) {
        respondWithError("Mağaza bilgileri alınırken hata oluştu", $e->getMessage());
    }
    // Widget ayarlarını al
    try {
        $stmt = $conn->prepare("SELECT * FROM widget_settings WHERE shop_id = :shop_id");
        $stmt->bindParam(':shop_id', $shop_id);
        $stmt->execute();
        $widgetSettings = $stmt->fetch();
        if (!$widgetSettings) {
            // Varsayılan widget ayarları
            $widgetSettings = [
                'title' => 'Çarkı Çevir<br>Hediyeni Kazan!',
                'description' => 'Hediyeni almak için hemen çarkı çevir.',
                'button_text' => 'ÇARKI ÇEVİR',
                'background_color' => null,
                'button_color' => null,
                'show_on_load' => 1,
                'popup_delay' => 2000
            ];
        }
    } catch (PDOException $e) {
        respondWithError("Widget ayarları alınırken hata oluştu", $e->getMessage());
    }
    // Ödülleri al
    try {
        // Tablo yapısını kontrol et ve varsa active sütununu kullan
        $hasActiveColumn = false;
        try {
            $describeStmt = $conn->prepare("DESCRIBE prizes");
            $describeStmt->execute();
            $columns = $describeStmt->fetchAll(PDO::FETCH_COLUMN);
            $hasActiveColumn = in_array('active', $columns);
        } catch (PDOException $e) {
            // Tablo yapısını kontrol etmeyi atla
        }
        // Sorguyu active sütununun varlığına göre hazırla
        $sql = "SELECT * FROM prizes WHERE shop_id = :shop_id";
        if ($hasActiveColumn) {
            $sql .= " AND active = 1";
        }
        $sql .= " ORDER BY display_order ASC";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':shop_id', $shop_id);
        $stmt->execute();
        $prizes = $stmt->fetchAll();
        if (empty($prizes)) {
            respondWithError("Bu mağaza için tanımlanmış ödül bulunamadı", null, 404);
        }
    } catch (PDOException $e) {
        respondWithError("Ödüller alınırken hata oluştu", $e->getMessage());
    }
    // Kuponları al ve ödüllerle birleştir
    $formattedPrizes = [];
    foreach ($prizes as $prize) {
        try {
            $stmt = $conn->prepare("SELECT id, coupon_code FROM coupons WHERE prize_id = :prize_id");
            $stmt->bindParam(':prize_id', $prize['id']);
            $stmt->execute();
            $coupons = $stmt->fetchAll();
            $couponCodes = [];
            $couponIds = [];
            foreach ($coupons as $coupon) {
                $couponCodes[] = $coupon['coupon_code'];
                $couponIds[] = $coupon['id'];
            }
            $formattedPrize = [
                'id' => $prize['id'],  // Ödül ID'sini de ekle
                'name' => $prize['name'],
                'description' => $prize['description'],
                'coupons' => $couponCodes,
                'coupon_ids' => $couponIds,  // Kupon ID'lerini de ekle
                'url' => $prize['redirect_url'],
                'color' => $prize['color'],
                'chance' => (int) $prize['chance']
            ];
            $formattedPrizes[] = $formattedPrize;
        } catch (PDOException $e) {
            logError("Kupon bilgileri alınırken hata oluştu: prize_id=" . $prize['id'] . ", " . $e->getMessage());
            // Hata durumunda bile ödülü boş kupon listesiyle ekle
            $formattedPrize = [
                'id' => $prize['id'],
                'name' => $prize['name'],
                'description' => $prize['description'],
                'coupons' => [],
                'coupon_ids' => [],
                'url' => $prize['redirect_url'],
                'color' => $prize['color'],
                'chance' => (int) $prize['chance']
            ];
            $formattedPrizes[] = $formattedPrize;
        }
    }
    // Yanıt oluştur
    $response = [
        'shop' => [
            'name' => $shop['name'],
            'logo' => $shop['logo_url'],
            'url' => $shop['website_url'],
            'brandName' => $shop['brand_name']
        ],
        'widget' => [
            'title' => $widgetSettings['title'],
            'description' => $widgetSettings['description'],
            'buttonText' => $widgetSettings['button_text'],
            'showOnLoad' => (bool) ($widgetSettings['show_on_load'] ?? 1),
            'popupDelay' => (int) ($widgetSettings['popup_delay'] ?? 2000),
            'backgroundColor' => $widgetSettings['background_color'],
            'buttonColor' => $widgetSettings['button_color'],
            'title_color' => $widgetSettings['title_color'],
            'description_color' => $widgetSettings['description_color']
        ],
        'prizes' => $formattedPrizes
    ];
    // JSON yanıtı gönder
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}