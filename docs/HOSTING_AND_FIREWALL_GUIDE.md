# SILLYGER Enterprise: Mwongozo Kamili wa Usanifu, Ulinzi Thabiti, Hosting ya Bure & Cloudflare Firewall

---

## 1. Muundo Kamili wa Mfumo Ulioboreshwa (Polyglot Fullstack Architecture)

Tumeuhama mfumo wa zamani (uliokuwa unachanganya kila kitu kwenye HTML zilizojirudia na maelfu ya mistari ya SQL) na kuelekea kwenye **Enterprise Polyglot Architecture** inayotumiwa na mifumo mikubwa duniani:

| Sehemu | Lugha / Teknolojia | Jukumu Lake Kuu |
| :--- | :--- | :--- |
| **1. Core Backend Engine (`backend-go/`)** | **Go (Golang 1.27)** | Mlango Mkuu (API Gateway), kasi ya ajabu (RAM < 25MB), WebSockets za TV Chat ya papo kwa papo, JWT Auth, na usalama wa data. |
| **2. Web Portal ya Kisasa (`web-next/`)** | **Next.js 14 + React + TypeScript + Tailwind** | Tovuti ya kisasa yenye lugha nyingi (Kiswahili & Kiingereza), Live TV yenye kitufe cha Pause, Kadi ya Kidijitali, na hakuna marudio ya code. |
| **3. Integration Services (`services-worker/`)** | **Node.js / TypeScript** | Huduma za nje kama malipo ya simu (M-Pesa / TigoPesa Daraja API), SMS za Beem Africa, na taarifa za WhatsApp Cloud. |
| **4. Mobile App (`sillyger_app/`)** | **Flutter / Dart** | App ya Android/iOS ya wanachama ikiwa na muonekano wa Blue, logo rasmi, TV pause, na kadi iliyohamishiwa kwenye wasifu. |
| **5. Database** | **PostgreSQL** | Hifadhidata kuu iliyo na majedwali yaliyopangwa vizuri (normalized). |

---

## 2. Mwongozo wa Kuhost BURE 100% (Free-Tier Hosting Guide)

Hutahitaji kulipia hata shilingi moja ya server. Mfumo mzima umeundwa kukaa kwenye huduma za kimataifa zenye viwango vya juu:

### Hatua ya 1: Kuhost Go Backend API (Render.com au Fly.io)
1. Fungua akaunti bure kwenye [https://render.com](https://render.com) (ingia kwa kutumia GitHub).
2. Bonyeza **"New +"** kisha chagua **"Web Service"**.
3. Chagua repository yako ya `sillyger-platform`.
4. Render itatambua faili la `backend-go/Dockerfile` tuliloliandaa kiotomatiki.
5. Weka Environment Variables zifuatazo:
   * `PORT`: `8080`
   * `APP_ENV`: `production`
   * `JWT_SECRET`: *(Tengeneza neno refu gumu la siri)*
   * `DATABASE_URL`: *(Connection string ya PostgreSQL kutoka Supabase au Render Postgres)*
6. Chagua **Free Plan ($0/month)** kisha bofya **"Create Web Service"**.
7. Utapata kiungo cha API yako bure: `https://sillyger-api.onrender.com`.

### Hatua ya 2: Kuhost Database (PostgreSQL kwenye Supabase au Render)
1. Kwenye akaunti yako ya Supabase (au Render PostgreSQL Free):
2. Nakili **Connection URI** (inayoanza na `postgres://postgres:...@...pooler.supabase.com:6543/postgres`).
3. Iweke kwenye `DATABASE_URL` ya Go Backend. Go Backend yetu itatengeneza majedwali yote kiotomatiki mara ya kwanza inapowashwa!

### Hatua ya 3: Kuhost Web Portal (Next.js kwenye Vercel)
1. Fungua akaunti bure kwenye [https://vercel.com](https://vercel.com) (ingia kwa GitHub).
2. Bonyeza **"Add New Project"** kisha chagua `sillyger-platform`.
3. Kwenye **Root Directory**, bofya "Edit" na uchague folda ya `web-next`.
4. Weka Environment Variables:
   * `NEXT_PUBLIC_API_URL`: `https://sillyger-api.onrender.com`
5. Bofya **"Deploy"**. Ndani ya sekunde 60, tovuti itakuwa hewani bure na cheti cha SSL (HTTPS) cha kimataifa.

---

## 3. Usanidi wa Domain na Ulinzi Mkali wa Cloudflare Firewall (WAF)

Ili kulinda mfumo wako dhidi ya wadukuzi (hackers), mashambulizi ya DDoS, na majaribio ya kubahatisha nenosiri, **Cloudflare** ndiyo ngao namba moja duniani:

### Hatua ya 1: Kuunganisha Domain Yako kwenye Cloudflare
1. Fungua akaunti bure kwenye [https://cloudflare.com](https://cloudflare.com).
2. Bonyeza **"Add a Domain"** na uandike jina la domain yako (mfano: `sillyger.com`).
3. Chagua **Free Plan ($0)**.
4. Cloudflare itakupa majina mawili ya seva za DNS (Nameservers), mfano:
   * `eva.ns.cloudflare.com`
   * `tom.ns.cloudflare.com`
5. Nenda mahali uliponunua domain yako (kama Namecheap, GoDaddy au Extreme Web) na ubadilishe Nameservers zake ziwe hizi za Cloudflare.

### Hatua ya 2: Kusanidi Rekodi za DNS
Kwenye dashibodi ya Cloudflare sehemu ya **DNS > Records**:
* **A Record (Web):** Jina `@` linaelekea kwenye IP ya Vercel (`76.76.21.21`) na uhakikishe **Proxy status iko ya Njano (Proxied)**.
* **CNAME Record (API):** Jina `api` linaelekea kwenye `sillyger-api.onrender.com` na **Proxy status iko ya Njano (Proxied)**.

> 🛡️ **Faida ya Proxy ya Njano (Orange Cloud ON):** Wadukuzi hawatawahi kuona IP address halisi ya server yako; mashambulizi yote yatakutana na ukuta wa Cloudflare kwanza!

### Hatua ya 3: Kuwasha Sheria za Ulinzi Mkali (Cloudflare Security & WAF Rules)
1. **SSL/TLS Encryption:**
   * Nenda **SSL/TLS > Overview** na uchague **"Full (Strict)"**.
   * Nenda **Edge Certificates** na uwashe:
     * **Always Use HTTPS**: ON
     * **HSTS (HTTP Strict Transport Security)**: ON
     * **Automatic HTTPS Rewrites**: ON
     * **Minimum TLS Version**: `TLS 1.3`
2. **Kuwasha Bot Fight Mode:**
   * Nenda **Security > Bots** na uwashe **"Bot Fight Mode"**. Hii itazuia bots na scrapers zote zisizo rasmi kuingia kwenye mfumo.
3. **Kuweka Sheria za Firewall (WAF Custom Rules):**
   * Nenda **Security > WAF > Custom Rules** na ubonyeze **"Create rule"**:
     * **Jina la Sheria:** `Block Malicious Payloads & Bad Actors`
     * **Expression:** `(http.request.uri.path contains "select" or http.request.uri.path contains "union" or http.request.uri.path contains "../" or http.request.uri.path contains "wp-admin" or http.request.uri.path contains ".env")`
     * **Action:** Chagua **"Block"**.
4. **Rate Limiting (Kuzuia DDoS na Brute Force):**
   * Nenda **Security > WAF > Rate Limiting Rules**:
     * Zuia mtu yeyote anayetuma maombi zaidi ya 50 kwa sekunde 10 kwenye eneo la `/api/auth/login`.

---

## 4. Mabadiliko ya Simu (Flutter Mobile App) Yaliyokamilishwa

Kwenye app ya simu (`sillyger_app`):
1. **TV Pause Button:** Kwenye kicheza TV, mtumiaji anaweza kubofya kitufe cha Pause kusitisha mtiririko ili aweze kusoma au kujibu soga bila kupitwa na maudhui.
2. **Nembo (Logo) kwenye Device Shelf:** Nembo rasmi ya SILLYGER imesanidiwa kuchukua nafasi ya nembo chaguo-msingi ya Flutter kwenye skrini ya simu ya mtumiaji.
3. **Mpangilio Safi wa Tab (Navbar):**
   * Tab ya chini sasa inabeba **Matangazo & Ratiba (Ads & Schedule)** na **TV**.
   * **Kadi ya Mwanachama (Digital ID Card)** imehamishiwa kwenye sehemu ya **Wasifu (Profile)** kwa mpangilio mzuri wa kitaalamu bila vitu kujirudia.
4. **WhatsApp-style Notification Counter:** Alama nyekundu/kijani inayohesabu arifa mpya na kupotea pindi mtumiaji anapozisoma.

---
*Mfumo huu uko tayari kwa viwango vya uzalishaji (Production Ready).*
