/**
 * SILLYGER (SG) Constitution Version 1.4 Structured Dataset
 * Full text covering Preamble, Articles 1 to 20, Appendices A & B, and Final Declaration
 */

const SG_CONSTITUTION_DATA = {
    metadata: {
        title: "CONSTITUTION, COMMUNITY CHARTER & DIGITAL MEMBERSHIP GOVERNANCE",
        version: "1.4",
        status: "Updated Draft for Member Review",
        officialName: "SILLYGER",
        abbreviation: "SG",
        individualMemberName: "Sillygerian",
        pluralMemberName: "Sillygerians",
        communityName: "SG Community",
        communityFund: "SG Community Fund",
        motto: "Learn Together. Build Together. Own the Future Together."
    },
    sections: [
        {
            id: "preamble",
            type: "preamble",
            title: "PREAMBLE",
            number: "PREAMBLE",
            keywords: "falsafa maono misingi utangulizi jamii technology",
            content: `SILLYGER ni taasisi ya kiteknolojia inayolenga kujenga jamii yenye uwezo wa kuelewa, kuchunguza, kutengeneza, kuboresha na kuendeleza teknolojia.

Tunaamini kwamba maendeleo ya teknolojia yanahitaji zaidi ya kutumia bidhaa zilizotengenezwa na wengine. Yanahitaji watu wenye uwezo wa kuelewa misingi ya teknolojia, kufanya tafiti, kutatua matatizo na kubuni mifumo mipya.

SILLYGER inalenga kuanza kama jumuiya ya watu wanaojifunza na kushirikiana, kisha kukua hatua kwa hatua kuwa taasisi yenye uwezo wa kufanya tafiti, kutengeneza bidhaa, kuendesha miundombinu ya teknolojia na kumiliki mali za kiteknolojia.

SILLYGER inajengwa kwa ushiriki wa wanachama wake. Hakuna mtu anayepaswa kuchukuliwa kuwa mmiliki binafsi wa jumuiya kwa sababu ya kuwa mwanzilishi, kiongozi au msimamizi.

Katiba hii inaweka misingi ya uanachama, utawala, elimu, teknolojia, fedha, mali, faragha, nidhamu na matumizi ya mifumo ya kidijitali.`
        },
        {
            id: "article-1",
            type: "article",
            number: "ARTICLE 1",
            title: "Jina na Utambulisho",
            keywords: "jina utambulisho sg sillygerian kauli mbiu nembo",
            content: `1.1 Jina rasmi la taasisi ni SILLYGER.
1.2 Kifupisho rasmi ni SG.
1.3 Mwanachama mmoja ataitwa Sillygerian na wanachama kwa pamoja wataitwa Sillygerians.
1.4 Jumuiya ya wanachama itaitwa SG Community.
1.5 Mfuko wa pamoja utaitwa SG Community Fund.
1.6 Kauli mbiu rasmi ni: Learn Together. Build Together. Own the Future Together.
1.7 SILLYGER inaweza kuwa na vitengo, miradi, maabara, programu, matawi na taasisi tanzu kwa mujibu wa maamuzi na taratibu zake.
1.8 Utambulisho, nembo, majina na alama za SILLYGER vitatumika kwa shughuli zilizoidhinishwa.`
        },
        {
            id: "article-2",
            type: "article",
            number: "ARTICLE 2",
            title: "Maono, Dhamira na Malengo",
            keywords: "vision mission malengo utafiti elimu uzalishaji miundombinu",
            content: `2.1 Vision:
Kuwa taasisi yenye uwezo wa kimataifa katika elimu, utafiti, ubunifu, uhandisi na umiliki wa teknolojia.

2.2 Mission:
Kuunganisha watu wenye shauku ya teknolojia, kuwajengea maarifa ya kina, kuwapa mazingira ya kufanya majaribio na tafiti, na kuwawezesha kuunda teknolojia zenye manufaa kwa jamii.

2.3 Malengo:
- Kutoa elimu ya kina ya Computer Science, Electronics na Cybersecurity.
- Kujenga uwezo wa kutengeneza software na hardware.
- Kufanya tafiti za kisayansi na kiteknolojia.
- Kuendeleza uwezo wa wanachama kufanya kazi kwa ushirikiano.
- Kutengeneza bidhaa, huduma na mifumo yetu wenyewe.
- Kujenga miundombinu ya teknolojia.
- Kukuza uvumbuzi na utatuzi wa matatizo halisi.
- Kushirikiana na vyuo, taasisi, watafiti na makampuni.
- Kujenga mazingira ya maendeleo ya kiteknolojia kwa muda mrefu.`
        },
        {
            id: "article-3",
            type: "article",
            number: "ARTICLE 3",
            title: "Vitengo na Maeneo ya Maendeleo",
            keywords: "vitengo divisions ai robotics cybersecurity architecture systems networks",
            content: `SILLYGER itakuwa na uwezo wa kuanzisha vitengo vifuatavyo kadiri rasilimali na uwezo vitakavyoruhusu:

3.1 SILLYGER Technologies: Uhandisi wa teknolojia, software, hardware na mifumo.
3.2 SILLYGER Research Institute: Tafiti za kisayansi, majaribio, uchunguzi na maendeleo ya kiteknolojia.
3.3 SILLYGER AI: Artificial Intelligence, Machine Learning, Deep Learning, AI Models, Intelligent Agents, Computer Vision na NLP.
3.4 SILLYGER Robotics: Robotics, Autonomous Systems, Embedded Systems, Sensors, Actuators na Automation.
3.5 SILLYGER Cybersecurity: Ethical Hacking, Penetration Testing, Digital Forensics, Defensive Security, Malware Analysis na Security Research.
3.6 SILLYGER Computer Architecture: Logic Gates, Digital Circuits, CPUs, GPUs, Memory Systems, Processors, Instruction Sets na Computer Architecture.
3.7 SILLYGER Systems: Operating Systems, Linux Kernels, Drivers, Compilers, System Software na Programming Languages.
3.8 SILLYGER Data Systems: Databases, Big Data, Data Engineering, Distributed Databases na Data Infrastructure.
3.9 SILLYGER Networks & Infrastructure: Computer Networks, Servers, Cloud Computing, Internet Technologies na Data Centers.
3.10 SILLYGER Electronics: Electronic Circuits, Integrated Circuits, Microcontrollers, PCB Design na Electronic Devices.
3.11 SILLYGER Innovation & Products: Kubadilisha mawazo, tafiti na miradi kuwa bidhaa na huduma zinazoweza kutumika.

3.12 Majina ya vitengo hivi ni sehemu ya maono ya muda mrefu. Kutajwa kwenye katiba hakumaanishi kwamba tayari vimeanzishwa au vina miundombinu. Kila kitengo kitaanzishwa kwa utaratibu rasmi.`
        },
        {
            id: "article-4",
            type: "article",
            number: "ARTICLE 4",
            title: "Umiliki na Haki za Wanachama",
            keywords: "umiliki haki uongozi mawazo ubaguzi mapendekezo michango",
            content: `4.1 SILLYGER Community inajengwa kwa ushiriki wa wanachama wake.
4.2 Kila mwanachama ana haki ya kutoa mawazo, mapendekezo na maoni bila kubaguliwa kwa cheo au uzoefu.
4.3 Mwanachama ana haki ya:
- Kushiriki katika mijadala.
- Kupendekeza mabadiliko ya katiba.
- Kuanzisha wazo la mradi.
- Kupendekeza utafiti.
- Kuanzisha changamoto za kujifunza.
- Kushiriki katika miradi.
- Kuomba taarifa za jumuiya kwa mujibu wa taratibu.
- Kushiriki katika maamuzi yanayomhusu.
- Kupata taarifa kuhusu matumizi ya fedha za pamoja.
4.4 Uongozi ni dhamana ya kuratibu na kulinda jumuiya, si mamlaka ya kumiliki mawazo au kazi za wanachama.
4.5 Umiliki wa kisheria wa taasisi, mali na chapa utazingatia usajili na nyaraka rasmi.`
        },
        {
            id: "article-5",
            type: "article",
            number: "ARTICLE 5",
            title: "Uanachama na Usajili",
            keywords: "usajili kujiunga akaunti tovuti maombi idhini",
            content: `5.1 Mtu anayetaka kujiunga atatuma maombi kupitia tovuti rasmi ya SILLYGER.
5.2 Mwombaji atatoa taarifa sahihi zinazohitajika kwa usajili.
5.3 Mwombaji atasoma na kukubali katiba, kanuni na masharti ya uanachama.
5.4 Maombi yatakaguliwa na kuidhinishwa na mamlaka husika.
5.5 Baada ya kuidhinishwa, mwanachama atapatiwa utambulisho wa SILLYGER na akaunti binafsi.
5.6 Kila mwanachama atakuwa na akaunti moja rasmi isipokuwa kuwe na sababu maalumu iliyoidhinishwa.
5.7 Mwanachama haruhusiwi kutumia akaunti ya mtu mwingine au kumpa mtu mwingine akaunti yake.
5.8 Uanachama hautategemea kuwa na vifaa vya gharama kubwa au uzoefu wa awali. Nia ya kujifunza, uadilifu na kuheshimu taratibu ni muhimu.`
        },
        {
            id: "article-6",
            type: "article",
            number: "ARTICLE 6",
            title: "SILLYGER Digital Membership System",
            keywords: "portal dashboard member id status learning attendance projects notifications security",
            content: `6.1 Mfumo rasmi: SILLYGER itakuwa na mfumo rasmi wa kidijitali unaoitwa SILLYGER Member Portal. Kila mwanachama atakuwa na akaunti yake binafsi inayomwezesha kusimamia taarifa zake, kufuatilia maendeleo yake na kushiriki katika shughuli za jumuiya.
6.2 Akaunti binafsi: Kila akaunti itakuwa na Unique Member ID, Username, Jina kamili, Email au namba ya simu iliyothibitishwa, Profile Picture (kwa hiari), Membership Category, Tarehe ya kujiunga, Status, Learning Profile, Activity History, na Security Settings. Member ID haitabadilika bila utaratibu maalumu.
6.3 Member Dashboard: Dashboard itaonyesha jina, Member ID, hali ya uanachama, matangazo, ratiba za vipindi, mahudhurio, maendeleo ya masomo, assignments, projects, challenges, notifications na rekodi za michango.
6.4 Profile Management: Mwanachama anaweza kusasisha taarifa zinazoruhusiwa na kuchagua zipi zionekane kwa wengine.
6.5 Learning Management: Inajumuisha Learning Paths, Courses, Assignments, Quizzes, na Feedback.
6.6 Attendance Management: Mfumo unavunja mahudhurio kuwa: Planned Attendance, Verified Attendance, Participation, na Contribution. Check-in pekee si ushahidi kamili wa uelewa.
6.7 Projects & Research: Kuona miradi, kujiunga na timu, kufuata milestones na kuweka ripoti.
6.8 Community & Communication: Announcements, Discussion Forums, Learning Groups. WhatsApp inatumika kwa mawasiliano lakini Member Portal ndio mfumo rasmi wa kumbukumbu.
6.9 Achievements & Recognition: Vyeti na utambuzi vinatolewa tu kwa kazi zilizothibitishwa.
6.10 Financial Records: Mwanachama anaona michango na risiti zake pekee. Taarifa za fedha za wengine zinalindwa.
6.11 Notifications: Taarifa za kiotomatiki za masomo, miradi na usalama.
6.12 Help & Support: Uwasilishaji wa tiketi za usaidizi na kero.
6.13 Account Security: Password Hashing, Verification, Session Management, MFA, RBAC na Audit Logs. Passwords hazionyeshwi hata kwa admins.
6.14 Account Status: PENDING, ACTIVE, ON_HOLD, SUSPENDED, INACTIVE, TERMINATED.
6.15 Account Ownership: Akaunti ni ya mwanachama binafsi. Hairuhusiwi kuhamisha au kuuza.`
        },
        {
            id: "article-7",
            type: "article",
            number: "ARTICLE 7",
            title: "Administration Portal na Madaraka",
            keywords: "admin madaraka audit logs rbac super admin permissions",
            content: `7.1 SILLYGER itakuwa na Administration Portal tofauti na Member Portal.
7.2 Kila admin atakuwa na akaunti yake yenye ruhusa kulingana na jukumu lake.
7.3 Hakutakuwa na matumizi ya akaunti moja ya admin kwa viongozi wote.
7.4 Majukumu yanaweza kujumuisha: Super Administrator, Membership Administrator, Education Administrator, Research Coordinator, Project Manager, Finance Administrator, Community Moderator, Technical Administrator, Security Administrator, Data Protection Officer.
7.5 Admin ataweza kufanya shughuli zilizoidhinishwa na jukumu lake tu.
7.6 Hakuna admin anayepaswa kuona au kubadilisha taarifa nyeti bila sababu halali na ruhusa inayohitajika.
7.7 Mabadiliko muhimu yatarekodiwa katika Audit Logs.
7.8 Super Administrator hatakuwa na mamlaka ya kubadilisha fedha, kufuta taarifa au kuondoa mwanachama bila kufuata taratibu zinazotakiwa.`
        },
        {
            id: "article-8",
            type: "article",
            number: "ARTICLE 8",
            title: "Elimu na Mtaala",
            keywords: "mtaala masomo theory practical computer architecture ai linux cybersecurity",
            content: `Mtaala wa msingi utakuwa na ngazi 10:
1. Computer Fundamentals & Electronics.
2. Digital Logic & Computer Architecture.
3. Programming & Software Engineering.
4. Operating Systems & Linux.
5. Computer Networking & Internet.
6. Cybersecurity Fundamentals.
7. Ethical Hacking & Penetration Testing.
8. Databases, Backend & Cloud.
9. Advanced Cybersecurity & Research.
10. Innovation & Real-world Projects.

8.1 Mafunzo yatahusisha theory, practical, assignments, challenges na projects.
8.2 Lengo ni kuelewa teknolojia, si kukariri commands.
8.3 Wanachama wanaweza kupendekeza masomo na mabadiliko ya mtaala.
8.4 AI itaruhusiwa kusaidia kujifunza, lakini haitachukua nafasi ya uelewa na uthibitishaji wa maarifa.`
        },
        {
            id: "article-9",
            type: "article",
            number: "ARTICLE 9",
            title: "Mahudhurio na Ushiriki",
            keywords: "mahudhurio ushiriki planned verified checkin",
            content: `9.1 Mahudhurio yatasimamiwa kupitia Member Portal.
9.2 Mwanachama ataweza kuonyesha vipindi anavyopanga kuhudhuria.
9.3 Planned Attendance haitachukuliwa kama Verified Attendance.
9.4 Ushiriki unaweza kuthibitishwa kwa njia ya check-in, usimamizi wa kipindi, shughuli za darasani au njia nyingine iliyoidhinishwa.
9.5 Ushiriki wa mijadala, assignments, challenges, research na projects unaweza kutambuliwa kama shughuli za jumuiya.
9.6 Mwanachama ataweza kuomba marekebisho ya rekodi ya mahudhurio yenye makosa.`
        },
        {
            id: "article-10",
            type: "article",
            number: "ARTICLE 10",
            title: "Kutoshiriki na Ruhusa",
            keywords: "ruhusa kutoshiriki siku tano saba onyo dharura",
            content: `10.1 Mwanachama anatarajiwa kushiriki kwa kadiri ya uwezo wake.
10.2 Onyo la awali linaweza kutolewa karibu siku ya tano ya kutoshiriki.
10.3 Mapitio ya hali ya mwanachama yanaweza kufanyika karibu siku ya saba.
10.4 Mwanachama anaweza kuomba ruhusa kutokana na ugonjwa, kazi, masomo, familia au sababu binafsi.
10.5 Matatizo ya mtandao na vifaa hayapaswi kusababisha kuondolewa moja kwa moja.
10.6 Mwanachama atakuwa na nafasi ya kueleza hali yake kabla ya hatua zisizo za dharura kuchukuliwa.`
        },
        {
            id: "article-11",
            type: "article",
            number: "ARTICLE 11",
            title: "Majukwaa Rasmi",
            keywords: "majukwaa website portal whatsapp mawasiliano",
            content: `11.1 Tovuti ya SILLYGER ndiyo itakuwa sehemu kuu ya usimamizi wa uanachama.
11.2 Majukwaa rasmi: SILLYGER Website, Member Portal, Administration Portal, Learning Platform, Project Management Platform, Official Communication Channels, na Research Repository.
11.3 WhatsApp na majukwaa mengine yanaweza kutumika kwa mawasiliano na uratibu.
11.4 Taarifa rasmi za uanachama zitahifadhiwa kwenye mifumo rasmi.`
        },
        {
            id: "article-12",
            type: "article",
            number: "ARTICLE 12",
            title: "Rasilimali na Michango",
            keywords: "michango rasilimali servers hosting licenses gharama elimu bure",
            content: `12.1 Wanachama wanaweza kukubaliana kuchangia gharama za rasilimali za pamoja (hosting, cloud, servers, vifaa).
12.2 Michango ya gharama si mapato binafsi ya mwanzilishi au viongozi.
12.3 Kila mchango utakuwa na maelezo ya gharama, matumizi na utaratibu wa taarifa.
12.4 Elimu ya msingi itaendelea kuwa bure kadiri inavyowezekana.
12.5 Leseni na akaunti zitatumika kwa kufuata masharti ya watoa huduma.`
        },
        {
            id: "article-13",
            type: "article",
            number: "ARTICLE 13",
            title: "SG Community Fund",
            keywords: "mfuko community fund mapato miundombinu ai servers labs",
            content: `13.1 SG Community Fund ni mfuko wa pamoja wa SILLYGER.
13.2 Mapato yanaweza kutoka kwenye miradi ya pamoja, bidhaa, huduma, tafiti, mashindano, sponsorships na ushirikiano.
13.3 Mapato yanayokubaliwa kuwa ya jumuiya yatawekwa kwenye mfuko.
13.4 Matumizi: Computers na servers, AI Infrastructure, Robotics Labs, Electronics Workshops, Cybersecurity Labs, Cloud Infrastructure na Data Centers.
13.5 Mapato, matumizi, salio na mali zitawekewa kumbukumbu rasmi.
13.6 Fedha za jumuiya hazitakuwa mali binafsi ya viongozi.
13.7 Kazi binafsi ya mwanachama haitakuwa mapato ya jumuiya bila makubaliano ya awali.`
        },
        {
            id: "article-14",
            type: "article",
            number: "ARTICLE 14",
            title: "Maadili na Cybersecurity",
            keywords: "maadili cybersecurity ethical hacking malware data theft sheria",
            content: `14.1 SILLYGER itafuata sheria na maadili ya teknolojia.
14.2 Hairuhusiwi kufanya unauthorized access, credential theft, account hijacking, phishing ya kudhuru, malware deployment, data theft au destructive attacks.
14.3 Practical cybersecurity itafanyika kwenye authorized labs, CTFs au mifumo yenye ruhusa ya wazi.
14.4 Mwanachama atawajibika kulinda taarifa na mifumo ya taasisi.
14.5 Maarifa yatatumika kujenga, kutafiti na kulinda.`
        },
        {
            id: "article-15",
            type: "article",
            number: "ARTICLE 15",
            title: "Faragha na Ulinzi wa Taarifa (Data Privacy)",
            keywords: "faragha privacy pdpa 2022 tanzania taarifa binafsi biometrics",
            content: `15.1 SILLYGER itakusanya taarifa zinazohitajika kwa madhumuni yaliyoelezwa.
15.2 Taarifa za wanachama zitalindwa dhidi ya matumizi yasiyoidhinishwa.
15.3 Mwanachama ataelezwa aina ya taarifa zinazokusanywa, sababu, muda wa kuhifadhi na namna ya kuomba marekebisho.
15.4 Upatikanaji wa taarifa utategemea majukumu na ruhusa. Taarifa nyeti hazitaonyeshwa bila msingi halali.
15.5 Taarifa za biometric kama fingerprint au face recognition hazitakusanywa kwa lazima kwa madhumuni ya kawaida ya uanachama.
15.6 Mwanachama ataweza kuomba nakala ya taarifa zake, marekebisho au kufungwa kwa akaunti.
15.7 SILLYGER itazingatia Personal Data Protection Act, 2022 na kanuni zinazotumika Tanzania.
15.8 Taasisi itahakikisha inatimiza masharti husika ya usajili na ulinzi wa data kabla ya kuchakata taarifa.`
        },
        {
            id: "article-16",
            type: "article",
            number: "ARTICLE 16",
            title: "Miradi na Haki Miliki (Intellectual Property)",
            keywords: "haki miliki intellectual property ip miradi source code mikataba",
            content: `16.1 Kila mradi mkubwa utakuwa na makubaliano ya umiliki wa kazi na michango.
16.2 Makubaliano yataeleza: Washiriki, Majukumu, Umiliki wa source code, Umiliki wa bidhaa, Intellectual Property, Leseni, Mgawanyo wa mapato na Mchango wa SG Community Fund.
16.3 Kazi binafsi ya mwanachama haitakuwa mali ya SILLYGER moja kwa moja.
16.4 Kazi iliyokubaliwa kuwa mali ya pamoja itasajiliwa na kusimamiwa kwa utaratibu rasmi.`
        },
        {
            id: "article-17",
            type: "article",
            number: "ARTICLE 17",
            title: "Uongozi na Maamuzi",
            keywords: "uongozi uchaguzi uwajibikaji kura demokrasia",
            content: `17.1 SILLYGER itakuwa na mfumo wa uongozi unaowajibika kwa wanachama.
17.2 Viongozi watachaguliwa au kuteuliwa kwa utaratibu utakaokubaliwa.
17.3 Maamuzi muhimu yatahusisha mashauriano na upigaji kura pale inapohitajika.
17.4 Wanachama watakuwa na nafasi ya kupendekeza mabadiliko na kupinga maamuzi kwa utaratibu wa haki.`
        },
        {
            id: "article-18",
            type: "article",
            number: "ARTICLE 18",
            title: "Nidhamu na Utatuzi wa Migogoro",
            keywords: "nidhamu migogoro suspension adhabu onyo termination",
            content: `18.1 Ukiukaji wa katiba unaweza kusababisha onyo, restriction, suspension au termination.
18.2 Mwanachama atapewa taarifa ya kosa na nafasi ya kujieleza pale inapowezekana.
18.3 Malalamiko yanaweza kuwasilishwa kupitia Member Portal au njia rasmi.
18.4 Migogoro itashughulikiwa kwa haki, usiri na uwazi unaofaa. Hatua za dharura zinaweza kuchukuliwa panapokuwa na tishio la usalama au uharibifu wa mifumo.`
        },
        {
            id: "article-19",
            type: "article",
            number: "ARTICLE 19",
            title: "Mabadiliko ya Katiba",
            keywords: "mabadiliko kura marekebisho versioning",
            content: `19.1 Katiba inaweza kubadilishwa kadiri SILLYGER inavyokua.
19.2 Mapendekezo yatawasilishwa kwa wanachama. Mabadiliko makubwa yatahitaji mashauriano na idhini kwa kura.
19.3 Toleo jipya litahifadhi historia ya matoleo yaliyotangulia.
19.4 Hakuna mabadiliko yatakayofanywa kwa siri na mtu mmoja bila mamlaka.`
        },
        {
            id: "article-20",
            type: "article",
            number: "ARTICLE 20",
            title: "Masharti ya Mwisho",
            keywords: "masharti sheria usajili kuanza kutumika",
            content: `20.1 Uanachama hautoi dhamana ya ajira, kipato, cheti au matokeo maalumu.
20.2 Maendeleo ya SILLYGER yatategemea uwezo, ushirikiano, rasilimali na juhudi za wanachama.
20.3 Katiba hii itaanza kutumika baada ya kupitiwa na kuidhinishwa kwa utaratibu wa taasisi.
20.4 Masuala ya usajili wa kisheria, umiliki wa mali na wajibu wa taasisi yatafuata sheria zinazotumika.`
        },
        {
            id: "appendix-a",
            type: "appendix",
            number: "APPENDIX A",
            title: "SILLYGER Member Portal — Account Structure",
            keywords: "appendix a member id lifecycle dashboard privacy roles",
            content: `A1. Member Account:
Kila Sillygerian atakuwa na akaunti binafsi yenye Member ID ya kipekee (mf. SG-000001, username, status: ACTIVE, type: STANDARD, joined date). Member ID itatengenezwa na mfumo na haitategemea cheo.

A2. Member Dashboard:
Profile, Membership Status, Announcements, Attendance Overview, Learning Progress, Courses, Assignments, Challenges, Projects, Research, Achievements, Financial Records, Notifications, Account Security, Help & Support.

A3. Account Privacy:
Password, email binafsi, simu, fedha na logins hazitaonekana hadharani au kwa wanachama wengine.

A4. Account Roles:
Guest, Applicant, Member, Instructor, Project Lead, Moderator, Administrator, Super Administrator.

A5. Account Lifecycle:
1. Mwombaji anajisajili kupitia tovuti.
2. Mfumo unatengeneza maombi yenye hadhi ya PENDING.
3. Membership Admin anakagua maombi.
4. Maombi yanaidhinishwa au kukataliwa.
5. Mwombaji aliyeidhinishwa anapewa Unique Member ID (SG-xxxxxx) na hadhi kuwa ACTIVE.
6. Mwanachama anaingia kwenye portal na kufunguliwa huduma rasmi ikiwemo kiungo cha WhatsApp Group.

A6. Platform Security:
Password Hashing, MFA, RBAC, Audit Logging, Database Backups, Encrypted Connections, Rate Limiting na Incident Response.`
        },
        {
            id: "appendix-b",
            type: "appendix",
            number: "APPENDIX B",
            title: "Official Digital Platform Structure",
            keywords: "appendix b platforms website member portal admin portal structure",
            content: `SILLYGER Website:
- Public Home Page
- About SILLYGER
- Vision & Mission
- Research Areas & Divisions
- Membership Registration
- Public Announcements
- Contact & Support

SILLYGER Member Portal:
- Member Dashboard
- My Profile
- My Learning & Attendance
- My Projects & Achievements
- My Financial Records
- WhatsApp Gate / Community Access
- My Security & Support Requests

SILLYGER Administration Portal:
- Dashboard & Analytics
- Member Management (Review & Sequential SG-ID Assignment)
- Attendance Management
- Learning & Projects Management
- Financial Management & SG Community Fund
- Roles & RBAC Permissions
- Audit Logs`
        },
        {
            id: "final-declaration",
            type: "declaration",
            number: "FINAL DECLARATION",
            title: "Tamko Rasmi la Mwisho",
            keywords: "tamko declaration mwisho learn build own",
            content: `SILLYGER si mahali pa kupokea maarifa pekee. Ni mazingira ya kujifunza, kujaribu, kushirikiana, kufanya utafiti na kujenga teknolojia.

Tunataka kuelewa logic gates na kujenga processors; kuelewa operating systems na kuunda mifumo yetu; kuelewa AI na kufanya utafiti wa models zetu; kujifunza networking na hatimaye kujenga miundombinu yetu wenyewe.

Kila Sillygerian ana nafasi ya kuchangia katika safari hii.

"We are not here only to use technology. We are here to understand it, build it, improve it, and shape its future."

SILLYGER — Learn Together. Build Together. Own the Future Together.
End of Constitution — Version 1.4`
        }
    ]
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SG_CONSTITUTION_DATA;
}
