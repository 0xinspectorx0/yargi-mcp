# Yargı MCP - Vercel Dağıtım ve Yayınlama Rehberi

Bu rehber, **Yargı MCP ve Mobil Web/PWA Uygulaması**'nı Vercel üzerinde ücretsiz, otomatik SSL sertifikalı ve global CDN destekli olarak nasıl yayınlayacağınızı anlatır.

---

## 🌟 Vercel'in Avantajları

- **Ücretsiz ve Hızlı:** Vercel Hobby planında ücretsiz barındırma.
- **Otomatik HTTPS/SSL:** `https://projeniz.vercel.app` şeklinde anında güvenli bağlantı.
- **Mobil PWA Desteği:** HTTPS sayesinde telefonunuza (iOS Safari / Android Chrome) *"Ana Ekrana Ekle"* diyerek doğrudan yerel mobil uygulama olarak kurabilirsiniz.
- **Git Entegrasyonu:** GitHub reposuna her `push` yaptığınızda Vercel otomatik olarak yeniden derler ve yayına alır.

---

## 🚀 3 Adımda Vercel'e Dağıtım

### 1. GitHub Reponuzu Hazırlayın
Projeyi kendi GitHub hesabınızda bir repoya aktarın (veya bu repoyu fork/push edin).

### 2. Vercel'e Giriş Yapın ve Projeyi Ekleyin
1. [vercel.com](https://vercel.com) adresine gidin ve GitHub hesabınızla giriş yapın.
2. Sağ üstteki **"Add New..." → "Project"** butonuna tıklayın.
3. GitHub reponuzu listeden seçip **"Import"** butonuna basın.

### 3. Yapılandırma ve Yayınlama
- **Framework Preset:** `Other` olarak bırakın (Vercel `api/index.py` ve `vercel.json` dosyasını otomatik olarak algılar).
- **Root Directory:** `./` (Varsayılan).
- **Environment Variables (Opsiyonel):**
  - `ALLOWED_ORIGINS`: `*`
  - `LOG_LEVEL`: `info`
  - `OPENROUTER_API_KEY`: *(Opsiyonel - Semantik arama için OpenRouter anahtarınız)*

**"Deploy"** butonuna tıklayın! 1-2 dakika içinde projeniz canlıya geçecektir. 🎉

---

## 📱 Yayından Sonra Mobilde Kullanım

Vercel size `https://yargi-mcp.vercel.app` benzeri bir adres verecektir.

1. **iPhone / iPad (iOS):**
   - Vercel adresinizi **Safari** ile açın.
   - Alttaki **Paylaş** simgesine dokunun.
   - **"Ana Ekrana Ekle"** seçeneğini seçin.
   - Artık telefonunuzda yerel bir mobil uygulama gibi çalışır.

2. **Android:**
   - Adresi **Google Chrome** ile açın.
   - Ekranda çıkan **"Uygulamayı Ekle"** butonuna veya sağ üstteki menüden **"Ana Ekrana Ekle"**ye basın.

---

## ⚠️ Vercel ve Serverless Hususları

- **Timeout Süresi:** Vercel Hobby (ücretsiz) planında serverless fonksiyonların çalışma süresi sınırlandırılmıştır (varsayılan 10-15 saniye). Arama ve karar çekme işlemleri bu süre içinde rahatlıkla yanıt verir.
- **Sürekli Arka Plan İşlemleri:** Vercel sunucusuz (serverless) mimaridedir. Eğer sürekli açık kalan stateful bağlantılar (örneğin günlerce açık kalan SSE MCP session'ları) veya yoğun makine öğrenmesi modelleri çalıştıracaksanız, depoda hazır yapılandırmaları bulunan **Fly.io** (`fly.toml`) veya **Railway** (`railway.json`) gibi container tabanlı platformları da tercih edebilirsiniz.
- **Mobil Arayüz & Arama:** Web ve mobil arayüz ile karar taraması için Vercel en hızlı ve pratik çözümdür.
