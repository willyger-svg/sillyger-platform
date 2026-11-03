# SILLYGER (SG) Digital Membership & Governance Platform (v1.4)

Mfumo rasmi wa kidijitali wa uanachama, mtaala na utawala wa jumuiya ya **SILLYGER (SG)** kwa mujibu wa **Katiba ya SILLYGER Version 1.4** na **Sheria ya Ulinzi wa Taarifa Binafsi Tanzania (PDPA 2022)**.

> **Motto:** *"Learn Together. Build Together. Own the Future Together."*

---

## ✅ HALI YA MRADI (DEVELOPMENT ROADMAP STATUS)

| Phase | Jina la Hatua | Hadhi | Maelezo |
|---|---|---|---|
| **Phase 1** | **Public Website, Constitution v1.4 Reader & Registration Gate** | ✅ **Kikamilifu** | Tovuti kuu (`index.html`), Interactive Constitution Reader (`constitution.html`), na Usajili wenye PDPA 2022 & Cybersecurity Ethics Gate (`register.html`). |
| **Phase 2** | **Member Portal, WhatsApp Gateway & Active Member Workspace** | ✅ **Kikamilifu** | Kuingia kwa SHA-256 (`member-portal.html`), WhatsApp Gate (`PENDING` vs `ACTIVE`), Check-in ya Mahudhurio (Art. 9), Maombi ya Ruhusa (Art. 10), Tiketi za Msaada (Art. 6.12) na Kubadili Nenosiri (Art. 6.13). |
| **Phase 3** | **Super Administrator Command Center, RBAC & Audit Logs** | ✅ **Kikamilifu** | Jopo la Utawala (`admin-portal.html`), foleni ya kuidhinisha maombi na jenereta ya `SG-000001+`, Dossier Inspector, Leja ya SG Community Fund (Art. 13), Matangazo Rasmi na Immutable Audit Logs (Art. 7.7). |
| **Phase 4** | **Supabase PostgreSQL Schema, Security Hardening & Cloud Deploy** | ✅ **Kikamilifu** | `schema.sql` kamili (majedwali yote 9 + RLS), XSS protection (`SGUtils.escapeHtml`), SHA-256 password hashing na `netlify.toml` kwa hosting ya bure. |

---

## 📂 MUUNDO WA MRADI (PROJECT STRUCTURE)

```text
sillyger-platform/
├── index.html              # Tovuti kuu ya umma (Hero, Dhamira, Vitengo 11, Mtaala 10, Live Stats)
├── constitution.html       # Msomaji wa Katiba v1.4 (Preamble, Art. 1–20, App. A & B, Live Search)
├── register.html           # Fomu ya Maombi ya Uanachama yenye Katiba, Ethics & PDPA 2022 Gate
├── member-portal.html      # Member Portal (Login, WhatsApp Gate, Mahudhurio, Ruhusa, Tiketi, Masomo)
├── admin-portal.html       # Executive Command Center (Queue, RBAC, Matangazo, Fund, Audit, Settings)
├── schema.sql              # PostgreSQL Schema & RLS Policies kwa ajili ya Supabase (Idempotent)
├── netlify.toml            # Usanidi wa ulinzi (Security Headers) na Clean URLs (/katiba, /jiunge, /portal, /admin)
├── css/
│   └── custom.css          # Cyber theme, glassmorphism, animations na monospace typography
├── js/
│   ├── config.js           # Mipangilio mikuu, Supabase config, Vitengo 11, Mtaala 10 & SGUtils (XSS protection)
│   ├── store.js            # Injini ya Hifadhi (LocalStorage + Supabase Sync + Salted SHA-256 Hashing)
│   ├── constitution-data.js# Nakala kamili ya Katiba v1.4 kwa ajili ya utafutaji wa papo hapo
│   ├── main.js             # UI scripts za tovuti kuu na live platform telemetry
│   ├── register.js         # Uthibitishaji wa usajili (+255) na ulinzi wa kikao cha Admin
│   ├── member-portal.js    # Logic ya Member Dashboard, WhatsApp Gate, Mahudhurio, Ruhusa & Tiketi
│   └── admin-portal.js     # Logic ya Super Admin Command Center, RBAC, Fund Ledger & Backups
└── README.md               # Mwongozo kamili wa mradi, Database na Hosting
```

---

## 🖥️ JINSI YA KUENDESHA KWENYE KOMPYUTA YAKO (RUN LOCALLY)

```bash
cd /home/willyger/sillyger-platform
python3 -m http.server 8080
```
Kisha fungua kwenye kivinjari: **`http://localhost:8080`**

---

## ☁️ MWONGOZO HATUA KWA HATUA: JINSI YA KUPATA DATABASE YA BURE (SUPABASE)

Ili mwombaji anayejisajili kwenye **simu yake** aonekane moja kwa moja kwenye **Admin Dashboard yako**, unahitaji hifadhidata ya mtandaoni (**Cloud Database**). Tunatumia **Supabase** kwa sababu ni **BURE 100% (Free Tier)** na mradi huu tayari umetengenezewa kila kitu ndani ya `schema.sql`!

### Hatua ya 1: Fungua Akaunti ya Bure kwenye Supabase
1. Fungua kivinjari na uende kwenye: **`https://supabase.com`**
2. Bofya **"Start your project"** kisha chagua **"Continue with GitHub"** (ingia na akaunti yako ya GitHub `willyger-svg`).

### Hatua ya 2: Tengeneza Project Mpya
1. Bofya **"New Project"**.
2. Jaza:
   - **Name:** `sillyger-platform`
   - **Database Password:** Weka nenosiri lolote gumu (hata hutalihitaji kwenye tovuti, lihifadhi tu mahali salama).
   - **Region:** Chagua iliyo karibu (mfano *Frankfurt / Central EU* au *Ireland*).
   - **Pricing Plan:** Hakikisha iko kwenye **Free ($0/month)**.
3. Bofya **"Create new project"** na usubiri takribani dakika 1 hadi iwe tayari.

### Hatua ya 3: Pandisha Jedwali la Database (`schema.sql`)
1. Kwenye menu ya kushoto ndani ya Supabase, bofya **"SQL Editor"** (ikoni yenye `>_`).
2. Bofya **"+ New query"**.
3. Fungua faili la `schema.sql` lililopo ndani ya mradi huu (`/home/willyger/sillyger-platform/schema.sql`), **Copy** maandishi yake yote kuanzia mwanzo hadi mwisho, kisha **Paste** ndani ya SQL Editor ya Supabase.
4. Bofya kitufe cha kijani cha **"Run"** (chini kulia). Utaona ujumbe: **`Success. No rows returned`** — hapo majedwali yote 9 na akaunti ya Super Admin (`SG-000001`) vimeshatengenezwa!

### Hatua ya 4: Chukua Database URL na Anon Key Yako
1. Kwenye menu ya kushoto ndani ya Supabase, shuka chini kwenye **"Project Settings"** (ikoni ya ⚙️) $\rightarrow$ bofya **"API"** (au **"Data API"**).
2. Hapo utaona vitu viwili muhimu:
   - **Project URL:** Inaonekana kama `https://abcdefghijklm.supabase.co` $\rightarrow$ Bofya **Copy**.
   - **Project API Keys (`anon` / `public`):** Inaanza na `eyJhbGciOiJIUzI1NiIs...` $\rightarrow$ Bofya **Copy** *(Usichukue `service_role`, chukua `anon public` pekee!)*.

### Hatua ya 5: Ziweke Kwenye Mfumo wa SILLYGER
Una njia mbili rahisi:
- **Kwa Majaribio ya Haraka:** Ingia kwenye `admin-portal.html` $\rightarrow$ Tab ya **Database & Mipangilio** $\rightarrow$ Bandika *Project URL* na *Anon Key* kisha bofya **"Hifadhi na Unganisha Supabase"**.
- **Kwa Uzinduzi Rasmi (Ili Simu Zote Ziunganike Moja kwa Moja):** Fungua faili la `js/config.js` (mistari ya 10–11) na uziweke hapo:
  ```javascript
  const DEFAULT_SUPABASE_URL = "https://abcdefghijklm.supabase.co";
  const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
  ```
  *(Nota: `SUPABASE_URL` na `anon public key` zimetengenezwa na Supabase zikae kwenye frontend kwa usalama pamoja na RLS policies za `schema.sql`).*

---

## 🌐 JINSI YA KURUSHA TOVUTI HEWANI BURE (GITHUB PAGES AU NETLIFY)

- **GitHub Pages (Haraka zaidi):**
  1. Kwenye GitHub repo yako (`willyger-svg/sillyger-platform`), nenda **Settings** $\rightarrow$ **Pages**.
  2. Chini ya *Build and deployment*, weka Source: **Deploy from a branch**, Branch: **`main`** / **`/(root)`** kisha bofya **Save**.
  3. Ndani ya dakika 1 tovuti yako itakuwa hewani kwenye: `https://willyger-svg.github.io/sillyger-platform/`!
- **Netlify (Inatumia `netlify.toml` moja kwa moja):**
  1. Nenda `https://app.netlify.com` $\rightarrow$ **Add new site** $\rightarrow$ **Import an existing project** $\rightarrow$ Chagua GitHub repo `sillyger-platform` $\rightarrow$ Bofya **Deploy**!

---

## ⚖️ USALAMA NA UTII WA SHERIA (PDPA 2022 & ARTICLE 6.13 / 14)

- **Salted SHA-256 Password Hashing:** Manenosiri yote yanahifadhiwa kama hash zenye salt (`sha256$<salt>$<digest>`), hakuna nenosiri linalohifadhiwa wazi (plaintext) wala kusafirishwa kwenye JSON backups.
- **XSS Hardening:** Kila uingizaji wa taarifa za watumiaji unasafishwa kupitia `SGUtils.escapeHtml`.
- **Immutable Audit Trail (Art. 7.7):** Matukio yote ya utawala yanarekodiwa bila kufutika.
