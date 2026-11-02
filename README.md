# SILLYGER (SG) Digital Membership & Governance Platform (v1.4)

Mfumo rasmi wa kidijitali wa uanachama na utawala wa jumuiya ya **SILLYGER (SG)** kulingana na **Katiba ya SILLYGER Version 1.4**.

---

## 🚀 4-PHASE DEVELOPMENT ROADMAP

| Phase | Jina la Hatua | Hadhi (Status) | Maelezo |
|---|---|---|---|
| **Phase 1** | **Project Structure, Public Website, Constitution Reader & Registration UI** |  **Kikamilifu (Completed)** | Muundo wa faili, Tovuti kuu, Interactive Constitution v1.4 Reader, na Fomu ya Usajili yenye PDPA 2022 & Ethics Gate na LocalStorage fallback. |
| **Phase 2** | **Member Portal Dashboard, Login Flow & WhatsApp Gate** |  *Inafuata (Next)* | Dashibodi ya mwanachama, mfumo wa kuingia, kadi ya WhatsApp Group (Locked kwa `PENDING`, Unlocked kwa `ACTIVE`), na widget za Mahudhurio na Masomo. |
| **Phase 3** | **Administration Portal, Sequential SG-ID Generator & Audit Logs** |  *Inasubiri* | Jopo la utawala (RBAC), kupitia maombi ya PENDING, kutoa namba za `SG-000001` kiotomatiki, na Immutable Audit Logs (Article 7.7). |
| **Phase 4** | **Supabase PostgreSQL Schema, RLS Policies & Free Hosting Deploy** |  *Inasubiri* | Kuunganisha Supabase SDK, jedwali la PostgreSQL lenye Row Level Security (RLS), na usanidi wa kuweka bure mtandaoni (Netlify/Vercel). |

---

## 📂 MUUNDO WA MRADI (PROJECT STRUCTURE)

```text
sillyger-platform/
├── index.html              # Tovuti kuu ya umma (Hero, Motto, Vitengo 11, Mtaala 10, Stats)
├── constitution.html       # Msomaji wa Katiba v1.4 (Preamble, Art. 1-20, App. A & B, Search & Filter)
├── register.html           # Fomu ya Maombi ya Uanachama yenye Constitution & PDPA 2022 Gate
├── member-portal.html      # Member Portal (Stub iliyo tayari kwa Phase 2)
├── admin-portal.html       # Administration Portal (Stub iliyo tayari kwa Phase 3)
├── css/
│   └── custom.css          # Cyber theme, glassmorphism, animations na font za monospace
├── js/
│   ├── config.js           # Mipangilio mikuu, Vitengo 11, Mtaala 10 na URLs
│   ├── store.js            # Safu ya hifadhi ya ndani (LocalStorage) na jenereta ya SG-ID
│   ├── constitution-data.js# Nakala kamili na iliyopangiliwa ya Katiba v1.4 kwa ajili ya utafutaji
│   ├── main.js             # UI scripts, kuonyesha vitengo, mtaala na takwimu za papo hapo
│   └── register.js         # Uthibitishaji wa namba za simu (+255), nenosiri na utoaji wa hadhi ya PENDING
└── README.md               # Mwongozo huu
```

---

## 🛠️ JINSI YA KUJARIBU KWENYE KOMPYUTA YAKO (RUN LOCALLY)

Mfumo umejengwa kwa **100% Free-tier** bila kuhitaji `npm install` au zana nzito za ziada:

### Njia ya 1: Python HTTP Server (Inayopendekezwa)
Kwenye terminal ya Linux:
```bash
cd /home/willyger/sillyger-platform
python3 -m http.server 8080
```
Kisha fungua kivinjari chako kwenye: `http://localhost:8080`

### Njia ya 2: Fungua moja kwa moja (Direct Browser File)
Unaweza pia kubofya mara mbili au kufungua faili la `index.html` kwa kivinjari chochote (Chrome, Firefox, Brave).

---

## 🧪 AKAUNTI ZA MAJARIBIO (PRE-SEEDED TEST DATA)

Safu ya `js/store.js` imewekewa data za awali ili uweze kupima:

1. **Super Admin Account:**
   - Barua pepe: `admin@sillyger.org`
   - Jina la mtumiaji: `willyger`
   - Namba ya Mwanachama: `SG-000001`
   - Hadhi: `ACTIVE`

2. **Active Sillygerian:**
   - Barua pepe: `baraka@example.com`
   - Namba ya Mwanachama: `SG-000002`
   - Hadhi: `ACTIVE` (WhatsApp link imefunguliwa)

3. **Pending Applicant:**
   - Barua pepe: `amina@example.com`
   - Namba ya Mwanachama: `null` (bado haijatolewa)
   - Hadhi: `PENDING` (WhatsApp link imefungwa hadi idhinishwe)

---

## ⚖️ UTII WA SHERIA NA MAADILI (PDPA 2022 & ARTICLE 14)
- **Tanzania Personal Data Protection Act, 2022 (PDPA):** Uanachama unahitaji idhini ya wazi, hakuna data za kibayometriki zinazolazimishwa, na taarifa zinalindwa.
- **Cybersecurity Ethics (Article 14):** Ujuzi wa kiteknolojia unatakiwa kutumika kwa ajili ya kulinda, kufanya tafiti na kujenga, na si kufanya mashambulizi haramu.
