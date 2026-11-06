'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import api, { Member, Announcement } from '../../lib/api';

// Possible Courses Data
const POSSIBLE_COURSES = [
  {
    id: 'course-1',
    code: 'SG-101',
    title: 'Linux Fundamentals & Shell Scripting',
    category: 'Mifumo & OS',
    badge: 'Msingi Mkuu',
    description: 'Kujifunza mfumo wa uendeshaji wa Linux, amri za terminal (Bash), automation na uendeshaji wa seva.',
  },
  {
    id: 'course-2',
    code: 'SG-102',
    title: 'Modern Full-Stack Web Development',
    category: 'Programu za Wavuti',
    badge: 'Mahitaji Makubwa',
    description: 'Kujenga mifumo ya wavuti inayotumika sokoni kwa kutumia HTML5, CSS3/Tailwind, JavaScript, React/Next.js na REST APIs.',
  },
  {
    id: 'course-3',
    code: 'SG-103',
    title: 'Cybersecurity & Ethical Hacking Basics',
    category: 'Usalama wa Kimtandao',
    badge: 'Ulinzi wa Mifumo',
    description: 'Misingi ya usalama wa mifumo, utambuzi wa mianya (vulnerabilities), kanuni za cryptography, na ulinzi wa taarifa binafsi (PDPA 2022).',
  },
  {
    id: 'course-4',
    code: 'SG-104',
    title: 'Python for Problem Solving & Automation',
    category: 'Lugha ya Programu',
    badge: 'Inayobadilika Sana',
    description: 'Kujifunza mantiki ya programu, algorithms, usomaji na uchakataji wa data, pamoja na automation ya kazi za kompyuta.',
  },
  {
    id: 'course-5',
    code: 'SG-105',
    title: 'Git, GitHub & Open Source Collaboration',
    category: 'Usimamizi wa Kazi',
    badge: 'Muhimu kwa Kila Dev',
    description: 'Kudhibiti matoleo ya kanuni (version control), kufanya kazi kwa ushirikiano kwenye timu, pull requests, na michango ya open-source.',
  },
  {
    id: 'course-6',
    code: 'SG-106',
    title: 'Computer Networking Essentials',
    category: 'Miundombinu ya Mtandao',
    badge: 'Uelewa wa Ndani',
    description: 'Muundo wa mitandao, OSI model, TCP/IP, IP addressing (IPv4/IPv6), DNS, routing, na firewalls.',
  },
  {
    id: 'course-7',
    code: 'SG-107',
    title: 'Database Architecture & SQL',
    category: 'Hifadhidata',
    badge: 'Usimamizi wa Data',
    description: 'Muundo wa hifadhidata za mahusiano (PostgreSQL/MySQL), uandishi wa queries bora za SQL, indexation na usalama wa hifadhidata.',
  },
  {
    id: 'course-8',
    code: 'SG-108',
    title: 'DevOps & Cloud Computing Intro',
    category: 'Wingu & Miundombinu',
    badge: 'Mustakabali wa IT',
    description: 'Misingi ya kontena (Docker), CI/CD pipelines, uwekaji wa mifumo hewani (deployments), na huduma za Cloud.',
  },
  {
    id: 'course-9',
    code: 'SG-109',
    title: 'Backend Engineering with Go & Node.js',
    category: 'Uhandisi wa Nyuma',
    badge: 'Ufanisi wa Juu',
    description: 'Ujenzi wa API zenye kasi na uwezo wa kuhudumia maelfu ya maombi kwa sekunde (high-concurrency microservices).',
  },
  {
    id: 'course-10',
    code: 'SG-110',
    title: 'Professional Tech Ethics & Career Growth',
    category: 'Maadili & Ukuaji wa Kitaaluma',
    badge: 'Maadili ya Kazi',
    description: 'Kujenga wasifu (CV/Portfolio) wa kiwango cha kimataifa, maandalizi ya usaili wa kiufundi (technical interviews), na uongozi katika jamii ya teknolojia.',
  },
];

// Profile Picture Real-time Compressor
function compressImageToDataUrl(file: File, maxDimension = 280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Tafadhali chagua faili la picha (JPG, PNG, WebP).'));
    }
    if (file.size > 8 * 1024 * 1024) {
      return reject(new Error('Picha ni kubwa mno (zaidi ya 8MB). Chagua picha ndogo kidogo.'));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxDimension || h > maxDimension) {
          if (w > h) {
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          } else {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Hitilafu ya canvas.'));
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Hitilafu wakati wa kusoma picha.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Hitilafu wakati wa kufungua faili.'));
    reader.readAsDataURL(file);
  });
}

function PortalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Authentication State
  const [member, setMember] = useState<Member | null>(null);
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotNotice, setShowForgotNotice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [alertBanner, setAlertBanner] = useState<string | null>(null);

  // Student Dashboard State
  const [currentStudentTab, setCurrentStudentTab] = useState<
    'overview' | 'whatsapp' | 'updates' | 'attendance' | 'courses' | 'profile' | 'settings'
  >('overview');

  // Modals
  const [activeModal, setActiveModal] = useState<
    'leave' | 'ticket' | 'changePassword' | 'editProfile' | null
  >(null);

  // Dashboard Data
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [whatsappInviteUrl, setWhatsappInviteUrl] = useState(
    'https://chat.whatsapp.com/KRxyaSoVcUCGLq0PdOy6Jb?s=cl&p=a&iam=2'
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendanceList, setAttendanceList] = useState<
    { id: string; title: string; date: string; status: 'VERIFIED' | 'PENDING' }[]
  >([]);
  const [checkinInput, setCheckinInput] = useState('');
  const [leaveRequests, setLeaveRequests] = useState<
    { id: string; category: string; duration: string; reason: string; date: string; status: 'APPROVED' | 'PENDING' }[]
  >([]);
  const [supportTickets, setSupportTickets] = useState<
    { id: string; category: string; title: string; message: string; date: string; status: 'OPEN' | 'RESOLVED' }[]
  >([]);

  // Modal form states
  const [leaveCategory, setLeaveCategory] = useState('Academic');
  const [leaveDuration, setLeaveDuration] = useState('Siku 1 - 3');
  const [leaveReason, setLeaveReason] = useState('');

  const [ticketCategory, setTicketCategory] = useState('Account & Approval');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwModalMsg, setPwModalMsg] = useState<string | null>(null);

  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editInterest, setEditInterest] = useState('');
  const [pendingAvatar, setPendingAvatar] = useState('');
  const [editProfileError, setEditProfileError] = useState<string | null>(null);

  // Toast / sync feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize and handle URL Alerts
  useEffect(() => {
    const alertType = searchParams.get('alert');
    const prefillUser = searchParams.get('user');

    if (prefillUser) {
      setCredential(prefillUser);
    }

    if (alertType === 'session_expired') {
      setAlertBanner('🔒 Mfumo umeboreshwa kiusalama (PDPA 2022). Tafadhali ingia tena kwenye akaunti yako.');
    } else if (alertType === 'login_required') {
      setAlertBanner('🔒 Tafadhali ingia kwanza kwenye Dashboard yako ili kufikia ukurasa huo.');
    } else if (alertType === 'admin_required') {
      setAlertBanner('⚠️ Ukurasa wa Admin unahitaji mamlaka ya Msimamizi (Administrator RBAC).');
    }

    // Check existing session
    const current = api.getCurrentMember();
    if (current) {
      setMember(current);
      generateQr(current);
      setEditFullName(current.full_name || '');
      setEditPhone(current.phone || '');
      setEditInterest(current.learning_interest || current.motivation || '');
      setPendingAvatar(current.avatar_url || '');

      // Load portal state from Supabase
      api.getMyPortalState()
        .then((state) => {
          if (state && state.member) {
            setMember(state.member);
            generateQr(state.member);
            setEditFullName(state.member.full_name || '');
            setEditPhone(state.member.phone || '');
            setEditInterest(state.member.learning_interest || state.member.motivation || '');
            setPendingAvatar(state.member.avatar_url || '');
            if (state.whatsapp_invite_url) {
              setWhatsappInviteUrl(state.whatsapp_invite_url);
            }
            if (state.announcements) {
              setAnnouncements(state.announcements);
            }
            if (state.attendance) {
              setAttendanceList(
                state.attendance.map((att: any) => ({
                  id: att.id,
                  title: att.session_title,
                  date: new Date(att.created_at || att.date).toLocaleDateString('sw-TZ'),
                  status: att.status || (att.is_verified ? 'VERIFIED' : 'PENDING'),
                }))
              );
            }
            if (state.leave_requests) {
              setLeaveRequests(
                state.leave_requests.map((l: any) => ({
                  id: l.id,
                  category: l.category || 'Academic',
                  duration: l.duration || 'Siku 1 - 3',
                  reason: l.reason || '',
                  date: new Date(l.created_at || l.date).toLocaleDateString('sw-TZ'),
                  status: l.status || 'PENDING',
                }))
              );
            }
            if (state.support_tickets) {
              setSupportTickets(
                state.support_tickets.map((t: any) => ({
                  id: t.id,
                  category: t.category || 'General',
                  title: t.subject || t.title || 'Msaada',
                  message: t.message || '',
                  date: new Date(t.created_at || t.date).toLocaleDateString('sw-TZ'),
                  status: t.status || 'OPEN',
                }))
              );
            }
          }
        })
        .catch(() => {});
    }

    // Load announcements
    api.getAnnouncements()
      .then((res) => {
        if (res && res.length > 0) setAnnouncements(res);
      })
      .catch(() => {});
  }, [searchParams]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const generateQr = (m: Member) => {
    const payload = JSON.stringify({
      id: m.reg_number || 'PENDING',
      name: m.full_name,
      status: m.status,
      org: 'SILLYGER Community Tanzania',
      issued: '2026-02-01',
    });
    QRCode.toDataURL(payload, {
      width: 140,
      margin: 1,
      color: { dark: '#0066FF', light: '#0b1120' },
    })
      .then(setQrCodeUrl)
      .catch(() => {});
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await api.login(credential, password);
      const user = res.member;

      // If Admin, redirect to /admin
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        router.push('/admin');
        return;
      }

      setMember(user);
      generateQr(user);
      setEditFullName(user.full_name);
      setEditPhone(user.phone);
      showToast('✓ Umefanikiwa kuingia kwenye Student Dashboard!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu imetokea. Tafadhali hakiki taarifa zako.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    api.clearSession();
    setMember(null);
    showToast('🚪 Umetoka kwenye akaunti yako.');
  };

  const handleSyncDashboard = async () => {
    setIsSyncing(true);
    try {
      const state = await api.getMyPortalState();
      if (state && state.member) {
        setMember(state.member);
        generateQr(state.member);
        setEditFullName(state.member.full_name || '');
        setEditPhone(state.member.phone || '');
        setEditInterest(state.member.learning_interest || state.member.motivation || '');
        setPendingAvatar(state.member.avatar_url || '');
        if (state.whatsapp_invite_url) {
          setWhatsappInviteUrl(state.whatsapp_invite_url);
        }
        if (state.announcements) {
          setAnnouncements(state.announcements);
        }
        if (state.attendance) {
          setAttendanceList(
            state.attendance.map((att: any) => ({
              id: att.id,
              title: att.session_title,
              date: new Date(att.created_at || att.date).toLocaleDateString('sw-TZ'),
              status: att.status || (att.is_verified ? 'VERIFIED' : 'PENDING'),
            }))
          );
        }
        if (state.leave_requests) {
          setLeaveRequests(
            state.leave_requests.map((l: any) => ({
              id: l.id,
              category: l.category || 'Academic',
              duration: l.duration || 'Siku 1 - 3',
              reason: l.reason || '',
              date: new Date(l.created_at || l.date).toLocaleDateString('sw-TZ'),
              status: l.status || 'PENDING',
            }))
          );
        }
        if (state.support_tickets) {
          setSupportTickets(
            state.support_tickets.map((t: any) => ({
              id: t.id,
              category: t.category || 'General',
              title: t.subject || t.title || 'Msaada',
              message: t.message || '',
              date: new Date(t.created_at || t.date).toLocaleDateString('sw-TZ'),
              status: t.status || 'OPEN',
            }))
          );
        }
      }
      showToast('✓ Taarifa zako zimesawazishwa kikamilifu!');
    } catch {
      showToast('✓ Taarifa za hivi punde zimesawazishwa!');
    } finally {
      setIsSyncing(false);
    }
  };

  const openEditProfileModal = () => {
    if (member) {
      setEditFullName(member.full_name || '');
      setEditPhone(member.phone || '');
      setEditInterest(member.learning_interest || member.motivation || '');
      setPendingAvatar(member.avatar_url || '');
      setEditProfileError(null);
    }
    setActiveModal('editProfile');
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setEditProfileError(null);
    try {
      showToast('⏳ Inashinikiza picha...');
      const compressed = await compressImageToDataUrl(file, 280, 0.82);
      setPendingAvatar(compressed);
      showToast('✓ Picha imechaguliwa! Bofya "Hifadhi Wasifu" kuikamilisha.');
    } catch (err: any) {
      setEditProfileError(err.message || 'Hitilafu ya kusoma picha.');
      showToast(err.message || 'Hitilafu ya picha.');
    }
  };

  const handleRemoveAvatar = () => {
    setPendingAvatar('');
    showToast('Picha imeondolewa kwenye hakikisho. Bofya "Hifadhi Wasifu".');
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    if (!editFullName.trim() || editFullName.trim().length < 3) {
      setEditProfileError('Tafadhali weka jina lako kamili (angalau herufi 3).');
      return;
    }
    try {
      const updated = await api.updateProfile({
        full_name: editFullName.trim(),
        phone: editPhone.trim(),
        learning_interest: editInterest.trim(),
        avatar_url: pendingAvatar || '',
      });
      setMember(updated);
      generateQr(updated);
      setActiveModal(null);
      showToast('✓ Wasifu wako na picha vimesasishwa kwenye Database!');
    } catch (err: any) {
      setEditProfileError(err.message || 'Hitilafu ya kusasisha wasifu.');
      showToast(err.message || 'Hitilafu ya kusasisha wasifu');
    }
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinInput.trim()) return;
    try {
      await api.studentCheckin(checkinInput.trim());
    } catch (_) {}
    const newRecord = {
      id: 'att-' + Date.now(),
      title: checkinInput.trim(),
      date: new Date().toLocaleDateString('sw-TZ', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'VERIFIED' as const,
    };
    setAttendanceList([newRecord, ...attendanceList]);
    setCheckinInput('');
    showToast('✓ Mahudhurio yamerekodiwa kwenye Cloud!');
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;
    try {
      await api.submitLeaveRequest(leaveCategory, leaveDuration, leaveReason.trim());
    } catch (_) {}
    const newLeave = {
      id: 'leave-' + Date.now(),
      category: leaveCategory,
      duration: leaveDuration,
      reason: leaveReason.trim(),
      date: new Date().toLocaleDateString('sw-TZ', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'PENDING' as const,
    };
    setLeaveRequests([newLeave, ...leaveRequests]);
    setLeaveReason('');
    setActiveModal(null);
    showToast('✓ Ombi la ruhusa limewasilishwa kwa Admin!');
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketMessage.trim()) return;
    try {
      await api.submitSupportTicket(ticketCategory, ticketTitle.trim(), ticketMessage.trim());
    } catch (_) {}
    const newTicket = {
      id: 'ticket-' + Date.now(),
      category: ticketCategory,
      title: ticketTitle.trim(),
      message: ticketMessage.trim(),
      date: new Date().toLocaleDateString('sw-TZ', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'OPEN' as const,
    };
    setSupportTickets([newTicket, ...supportTickets]);
    setTicketTitle('');
    setTicketMessage('');
    setActiveModal(null);
    showToast('✓ Tiketi ya msaada imetumwa kwa Admin!');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) {
      setPwModalMsg('Nenosiri jipya lazima liwe na herufi 6 au zaidi.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwModalMsg('Nenosiri jipya na uthibitisho hayalingani.');
      return;
    }
    try {
      await api.changePassword(currentPw, newPw);
      setPwModalMsg(null);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setActiveModal(null);
      showToast('✓ Nenosiri lako limebadilishwa kwa usalama kwenye Database (SHA-256)!');
    } catch (err: any) {
      setPwModalMsg(err.message || 'Hitilafu ya kubadili nenosiri.');
    }
  };


  const copyStudentId = () => {
    if (member?.reg_number) {
      navigator.clipboard?.writeText(member.reg_number);
      showToast('✓ Student ID imenakiliwa: ' + member.reg_number);
    } else {
      showToast('Student ID inasubiri idhini.');
    }
  };

  const copyWhatsAppIntro = () => {
    const text = `Habari wakuu, naitwa ${member?.full_name || 'Mwanafunzi'}, nimejiunga rasmi na SILLYGER Community (ID: ${
      member?.reg_number || 'PENDING'
    }). Nina shauku ya kujifunza programu na teknolojia pamoja nanyi! 🚀`;
    navigator.clipboard?.writeText(text);
    showToast('✓ Ujumbe wa utambulisho umenakiliwa!');
  };

  const exportMyData = () => {
    const data = {
      member,
      attendance: attendanceList,
      leaves: leaveRequests,
      tickets: supportTickets,
      exported_at: new Date().toISOString(),
      compliance: 'PDPA 2022 Certified',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sillyger_data_${member?.reg_number || 'student'}.json`;
    a.click();
    showToast('✓ Data zako zimepakuliwa (Export JSON)!');
  };

  const printStudentIdBadge = () => {
    window.print();
  };

  const isAdmin = member?.role === 'SUPER_ADMIN' || member?.role === 'ADMIN';

  return (
    <main className="flex-grow py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 p-4 rounded-2xl bg-slate-900/95 border border-blue-500/50 text-white text-xs font-semibold shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Optional Redirect Alert Banner */}
      {alertBanner && (
        <div
          id="portal-url-alert"
          className="max-w-2xl mx-auto mb-6 p-4 rounded-2xl border border-amber-500/40 bg-amber-950/20 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg"
        >
          <span>{alertBanner}</span>
          <button
            onClick={() => setAlertBanner(null)}
            className="text-amber-300 hover:text-white font-bold p-1"
            title="Funga"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 1: LOGIN (EXACT 1-TO-1 COPY OF member-portal.html)        */}
      {/* ============================================================== */}
      {!member ? (
        <div id="login-view" className="max-w-md mx-auto py-8">
          <div className="sg-glass p-8 sm:p-10 rounded-3xl shadow-2xl">
            <div className="text-center mb-8">
              <img
                src="/assets/sillyger-logo-icon.svg"
                alt="SILLYGER"
                className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-xl shadow-blue-600/30"
              />
              <h1 className="text-2xl font-extrabold text-white">Ingia Student Dashboard</h1>
              <p className="text-xs text-slate-400 mt-1">
                Tumia Email, Username, SG-ID au namba yako ya WhatsApp
              </p>
            </div>

            {errorMsg && (
              <div
                id="login-error"
                className="mb-5 p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs leading-relaxed"
              >
                {errorMsg}
              </div>
            )}

            <form id="member-login-form" onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                  htmlFor="login-credential"
                >
                  Email / Username / WhatsApp
                </label>
                <input
                  type="text"
                  id="login-credential"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  className="w-full sg-input px-3.5 py-3 rounded-xl text-sm font-mono-sg"
                  placeholder="Email, Username au 07XXXXXXXX"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className="block text-xs font-semibold text-slate-300"
                    htmlFor="login-password"
                  >
                    Nenosiri (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotNotice(!showForgotNotice)}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Umesahau?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full sg-input pr-10 pl-3.5 py-3 rounded-xl text-sm"
                    placeholder="Nenosiri lako"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                    aria-label="Onyesha nenosiri"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl btn-sg-primary text-sm flex items-center justify-center gap-2 transition"
              >
                <span>{isLoading ? 'Inafungua Dashboard...' : 'Fungua Dashboard Yangu'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>

            {showForgotNotice && (
              <div
                id="forgot-password-box"
                className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-blue-500/35 text-xs text-slate-300 leading-relaxed animate-fade-in"
              >
                Kwa usalama wa akaunti yako (SHA-256), tafadhali wasiliana na Msimamizi wa Jumuiya (Super Admin) ili kuhakikiwa na kuwekewa nenosiri jipya.
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
              Je, bado hujajiunga kujifunza nasi?
              <Link href="/register" className="text-blue-400 font-bold hover:underline ml-1">
                Fungua Akaunti Hapa &rarr;
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* VIEW 2: TRUE MULTI-PANEL STUDENT DASHBOARD (member-portal.html)*/
        /* ============================================================== */
        <div id="dashboard-view" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ====================================================== */}
            {/* LEFT SIDEBAR NAVIGATION (STICKY ON DESKTOP)            */}
            {/* ====================================================== */}
            <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-24">
              {/* Sidebar Student Identity Card */}
              <div className="sg-glass p-5 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div
                    id="dash-avatar"
                    className="w-12 h-12 rounded-2xl bg-slate-900 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/25 overflow-hidden"
                  >
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src="/assets/sillyger-logo-icon.svg"
                        alt="SG"
                        className="w-full h-full object-contain p-1.5"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 id="dash-full-name" className="text-sm sm:text-base font-extrabold text-white truncate">
                      {member.full_name}
                    </h2>
                    <span id="dash-username" className="text-xs font-mono-sg text-blue-400 block truncate">
                      @{member.full_name.toLowerCase().replace(/\s+/g, '')}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  <span id="dash-member-id" className="font-mono-sg font-bold text-slate-200">
                    {member.reg_number || 'SG-PENDING'}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-sg font-bold ${
                      member.status === 'ACTIVE'
                        ? 'badge-active'
                        : 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {member.status === 'ACTIVE' ? '● Imethibitishwa' : '⏳ Inakaguliwa'}
                  </span>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="sg-glass p-2 sm:p-3 rounded-3xl flex lg:flex-col gap-1.5 overflow-x-auto shadow-xl" aria-label="Menyu ya Dashboard">
                <button
                  type="button"
                  onClick={() => setCurrentStudentTab('overview')}
                  className={`student-nav-btn w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 whitespace-nowrap text-left transition ${
                    currentStudentTab === 'overview'
                      ? 'btn-sg-primary'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70 font-semibold'
                  }`}
                >
                  <span>📊</span>
                  <span>Muhtasari (Overview)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStudentTab('whatsapp')}
                  className={`student-nav-btn w-full px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 whitespace-nowrap text-left transition ${
                    currentStudentTab === 'whatsapp'
                      ? 'btn-sg-primary font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span>💬</span>
                    <span>WhatsApp Group</span>
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      member.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  ></span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStudentTab('updates')}
                  className={`student-nav-btn w-full px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 whitespace-nowrap text-left transition ${
                    currentStudentTab === 'updates'
                      ? 'btn-sg-primary font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span>📢</span>
                    <span>Updates & Ratiba</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-blue-600/20 text-blue-300 font-mono-sg text-[10px] font-bold">
                    {announcements.length || 3}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStudentTab('attendance')}
                  className={`student-nav-btn w-full px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 whitespace-nowrap text-left transition ${
                    currentStudentTab === 'attendance'
                      ? 'btn-sg-primary font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <span>✅</span>
                  <span>Check-in & Ruhusa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStudentTab('courses')}
                  className={`student-nav-btn w-full px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 whitespace-nowrap text-left transition ${
                    currentStudentTab === 'courses'
                      ? 'btn-sg-primary font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <span>📚</span>
                  <span>Possible Courses</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStudentTab('profile')}
                  className={`student-nav-btn w-full px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 whitespace-nowrap text-left transition ${
                    currentStudentTab === 'profile'
                      ? 'btn-sg-primary font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <span>👤</span>
                  <span>Wasifu & Kitambulisho</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStudentTab('settings')}
                  className={`student-nav-btn w-full px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 whitespace-nowrap text-left transition ${
                    currentStudentTab === 'settings'
                      ? 'btn-sg-primary font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <span>⚙️</span>
                  <span>Mipangilio (Settings)</span>
                </button>
              </nav>

              {/* Quick Help Card on Desktop Sidebar */}
              <div className="hidden lg:block sg-glass p-4 rounded-3xl space-y-2.5 shadow-xl">
                <p className="text-xs font-bold text-white">Unahitaji Msaada?</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Kama una swali kuhusu idhini ya akaunti au masomo, tuma ujumbe moja kwa moja kwa Admin.
                </p>
                <button
                  onClick={() => setActiveModal('ticket')}
                  className="w-full py-2 rounded-xl border border-blue-500/40 bg-blue-950/30 hover:bg-blue-900/50 text-xs font-semibold text-blue-300 hover:text-white transition"
                >
                  💬 Uliza Swali / Msaada
                </button>

                {isAdmin && (
                  <div className="pt-1">
                    <Link
                      href="/admin"
                      className="px-3.5 py-2 rounded-xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 hover:text-white text-xs font-bold font-mono-sg flex items-center justify-center gap-1.5 transition"
                    >
                      <span>🛠️ Admin Command</span>
                    </Link>
                  </div>
                )}
              </div>
            </aside>

            {/* ====================================================== */}
            {/* MAIN DASHBOARD WORKSPACE                               */}
            {/* ====================================================== */}
            <div className="lg:col-span-9 space-y-6">
              {/* Top Greeting & Quick Refresh Bar */}
              <div className="sg-glass p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div>
                  <span className="text-[11px] font-mono-sg text-blue-400 uppercase font-semibold block mb-0.5">
                    STUDENT WORKSPACE
                  </span>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                    Karibu Kwenye Dashboard Yako!
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fuatilia hali ya uanachama, WhatsApp Group, updates za karibu na vipindi vyetu vya pamoja.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSyncDashboard}
                    disabled={isSyncing}
                    className="px-3.5 py-2 rounded-xl border border-slate-700 hover:border-blue-500/50 bg-slate-900/70 text-xs font-mono-sg text-slate-200 hover:text-white transition flex items-center gap-1.5"
                  >
                    <span>🔄</span>
                    <span>{isSyncing ? 'Inasawazisha...' : 'Sasisha'}</span>
                  </button>
                  <button
                    onClick={() => setActiveModal('ticket')}
                    className="lg:hidden px-3.5 py-2 rounded-xl border border-blue-500/40 bg-blue-950/30 text-xs font-semibold text-blue-300"
                  >
                    💬 Msaada
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-3.5 py-2 rounded-xl border border-slate-700 hover:border-red-500/50 hover:bg-red-950/30 text-xs text-slate-400 hover:text-red-400 transition flex items-center gap-1.5"
                  >
                    <span>Ondoka</span>
                  </button>
                </div>
              </div>

              {/* ================================================== */}
              {/* PANE 1: OVERVIEW (MUHTASARI WA DASHBOARD)          */}
              {/* ================================================== */}
              {currentStudentTab === 'overview' && (
                <div className="space-y-6">
                  {/* 4 KPI METRIC CARDS */}
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* KPI 1: SG-ID */}
                    <div className="sg-glass p-4 sm:p-5 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Student ID</span>
                        <button
                          onClick={copyStudentId}
                          title="Nakili SG-ID"
                          className="text-[11px] text-blue-400 hover:text-white font-mono-sg"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="text-base sm:text-lg font-extrabold font-mono-sg text-white truncate">
                        {member.reg_number || 'Inasubiri'}
                      </div>
                      <div className="text-[11px] text-slate-400">SG Student Community</div>
                    </div>

                    {/* KPI 2: WhatsApp Status */}
                    <div
                      onClick={() => setCurrentStudentTab('whatsapp')}
                      className="sg-glass p-4 sm:p-5 rounded-2xl space-y-1.5 cursor-pointer hover:border-emerald-500/40 transition"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>WhatsApp Group</span>
                        <span>💬</span>
                      </div>
                      <div
                        className={`text-base sm:text-lg font-extrabold ${
                          member.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {member.status === 'ACTIVE' ? 'Imefunguliwa' : 'Locked'}
                      </div>
                      <div className="text-[11px] text-slate-400">Bofya kuangalia &rarr;</div>
                    </div>

                    {/* KPI 3: Attendance */}
                    <div
                      onClick={() => setCurrentStudentTab('attendance')}
                      className="sg-glass p-4 sm:p-5 rounded-2xl space-y-1.5 cursor-pointer hover:border-blue-500/40 transition"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Vipindi Ulivyoshiriki</span>
                        <span>✅</span>
                      </div>
                      <div className="text-base sm:text-lg font-extrabold font-mono-sg text-white">
                        {attendanceList.length}
                      </div>
                      <div className="text-[11px] text-emerald-400">{attendanceList.length} Imethibitishwa</div>
                    </div>

                    {/* KPI 4: Updates */}
                    <div
                      onClick={() => setCurrentStudentTab('updates')}
                      className="sg-glass p-4 sm:p-5 rounded-2xl space-y-1.5 cursor-pointer hover:border-blue-500/40 transition"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Updates za Karibu</span>
                        <span>📢</span>
                      </div>
                      <div className="text-base sm:text-lg font-extrabold font-mono-sg text-blue-400">
                        {announcements.length || 3}
                      </div>
                      <div className="text-[11px] text-slate-400">Soma matangazo &rarr;</div>
                    </div>
                  </div>

                  {/* Main Overview 2-Column Grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Left Column: WhatsApp Gate + Updates */}
                    <div className="xl:col-span-7 space-y-6">
                      {/* Primary WhatsApp Gate Card */}
                      <div className="sg-glass p-6 sm:p-7 rounded-3xl border border-emerald-500/30 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-lg">
                              💬
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-white">SILLYGER WhatsApp Community</h3>
                              <p className="text-xs text-slate-400">Mjadala wa kila siku wa wanafunzi na wakufunzi</p>
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono-sg font-bold ${
                              member.status === 'ACTIVE'
                                ? 'badge-active'
                                : 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {member.status === 'ACTIVE' ? 'Unlocked' : 'Inakaguliwa'}
                          </span>
                        </div>

                        {member.status === 'ACTIVE' ? (
                          <div className="space-y-4">
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Akaunti yako imethibitishwa kikamilifu! Bofya kitufe hapa chini ili kujiunga na kundi rasmi la WhatsApp la wanafunzi wa SILLYGER.
                            </p>
                            <div className="flex flex-wrap gap-2.5">
                              <a
                                href={whatsappInviteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 inline-flex items-center gap-2 transition"
                              >
                                <span>Fungua WhatsApp Group</span>
                                <span>&rarr;</span>
                              </a>
                              <button
                                onClick={copyWhatsAppIntro}
                                className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:text-white transition"
                              >
                                📋 Nakili Utambulisho
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Maombi yako ya uanachama yanakaguliwa na Super Admin. Kiungo cha kujiunga na kundi la WhatsApp kitafunguka hapa mara baada ya akaunti yako kuthibitishwa.
                            </p>
                            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                              <span>⏳</span>
                              <span>Ukaguzi huchukua kawaida kati ya dakika chache hadi saa 12.</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Recent Updates Preview */}
                      <div className="sg-glass p-5 sm:p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                          <div>
                            <span className="text-[10px] font-mono-sg font-bold text-blue-400 uppercase block">
                              MATANGAZO YA HIVI KARIBUNI
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-white">Updates za Jumuiya</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStudentTab('updates')}
                            className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                          >
                            Ona Zote &rarr;
                          </button>
                        </div>
                        <div className="space-y-3">
                          {announcements.length > 0 ? (
                            announcements.slice(0, 3).map((a) => (
                              <div key={a.id} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold text-white">{a.title}</h4>
                                  <span className="text-[10px] font-mono-sg text-slate-400">
                                    {new Date(a.created_at).toLocaleDateString('sw-TZ')}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 line-clamp-2">{a.content}</p>
                              </div>
                            ))
                          ) : (
                            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400">
                              Ratiba ya mzunguko wa masomo ya wiki hii inatangazwa hivi punde kupitia SILLYGER TV na WhatsApp.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Digital Student ID Card + Onboarding Checklist */}
                    <div className="xl:col-span-5 space-y-6">
                      {/* Printable & Downloadable Digital Student ID Smart-Card */}
                      <div className="sg-glass p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div>
                            <span className="text-[10px] font-mono-sg text-blue-400 uppercase font-bold block">
                              KITAMBULISHO CHA KIDIJITALI
                            </span>
                            <h3 className="text-sm font-bold text-white">Digital Student ID Card</h3>
                          </div>
                          <button
                            onClick={printStudentIdBadge}
                            className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800"
                          >
                            🖨️ Print
                          </button>
                        </div>

                        <div className="rounded-2xl p-5 border border-blue-500/40 bg-gradient-to-b from-[#0b1120] via-[#111a2e] to-[#060a14] space-y-4 shadow-xl">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                              <img src="/assets/sillyger-logo-icon.svg" alt="SG" className="w-8 h-8 rounded-lg" />
                              <div>
                                <span className="font-extrabold text-xs text-white block leading-none">SILLYGER</span>
                                <span className="text-[8px] font-mono-sg text-blue-400 uppercase">Tech Student</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono-sg font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/40">
                              {member.status === 'ACTIVE' ? 'Active Member' : 'Pending'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 py-1">
                            <div className="w-16 h-16 rounded-xl bg-slate-900 border border-blue-500/40 flex items-center justify-center shrink-0 overflow-hidden">
                              {member.avatar_url ? (
                                <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <img src="/assets/sillyger-logo-icon.svg" alt="Avatar" className="w-full h-full p-2 object-contain" />
                              )}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="text-xs font-extrabold text-white truncate">{member.full_name}</div>
                              <div className="text-[11px] font-mono-sg text-blue-400 font-bold">
                                {member.reg_number || 'SG-PENDING'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">{member.phone}</div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                            <div>
                              <span className="text-[8px] font-mono-sg text-slate-500 uppercase block">KUTHIBITISHWA NA</span>
                              <span className="text-[10px] font-bold text-slate-300">Sekretarieti ya SG</span>
                              <span className="text-[8px] font-mono-sg text-slate-500 block mt-0.5">PDPA 2022 Certified</span>
                            </div>
                            {qrCodeUrl && (
                              <img src={qrCodeUrl} alt="QR Code" className="w-14 h-14 rounded-lg bg-white p-1 shadow-md" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Onboarding Checklist Progress Widget */}
                      <div className="sg-glass p-5 sm:p-6 rounded-3xl space-y-4">
                        <span className="text-[10px] font-mono-sg text-blue-400 font-bold uppercase block">
                          ONBOARDING PROGRESS
                        </span>
                        <h4 className="text-xs font-bold text-white">Hatua za Kuanza Masomo</h4>
                        <div className="space-y-2.5 text-xs">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <span>✓</span>
                            <span>Usajili wa fomu umekamilika</span>
                          </div>
                          <div className={`flex items-center gap-2 ${member.status === 'ACTIVE' ? 'text-emerald-400' : 'text-slate-400'}`}>
                            <span>{member.status === 'ACTIVE' ? '✓' : '○'}</span>
                            <span>Idhini ya Super Admin & SG-ID</span>
                          </div>
                          <div className={`flex items-center gap-2 ${member.status === 'ACTIVE' ? 'text-emerald-400' : 'text-slate-400'}`}>
                            <span>{member.status === 'ACTIVE' ? '✓' : '○'}</span>
                            <span>Kujiunga na WhatsApp Group</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <span>○</span>
                            <span>Kushiriki kipindi cha kwanza cha SILLYGER TV</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================== */}
              {/* PANE 2: WHATSAPP & JUMUIYA                         */}
              {/* ================================================== */}
              {currentStudentTab === 'whatsapp' && (
                <div className="space-y-6">
                  <div className="sg-glass p-6 sm:p-8 rounded-3xl border border-emerald-500/30 space-y-5">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl">
                        💬
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">WhatsApp Community Access</h2>
                        <p className="text-xs text-slate-400">Kundi rasmi la majadiliano ya masomo na ushirikiano wa kiteknolojia</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      <p>
                        Kundi hili ni maalum kwa wanafunzi wa SILLYGER. Hapa tunajadili masomo ya programu, usalama wa mifumo (cybersecurity), uendeshaji wa mifumo ya Linux, na kusaidiana kwenye changamoto za kificho za kiufundi.
                      </p>
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
                        <div className="font-bold text-white">Kanuni Kuu za Kundi:</div>
                        <ul className="list-disc list-inside space-y-1 text-slate-400">
                          <li>Heshima na nidhamu ya kimasomo kwa wanajumuiya wote.</li>
                          <li>Mijadala izingatie masuala ya elimu, teknolojia na maendeleo.</li>
                          <li>Hakuna matangazo yasiyoidhinishwa na uongozi (Strict No Spam).</li>
                        </ul>
                      </div>
                    </div>

                    <div className="pt-2">
                      {member.status === 'ACTIVE' ? (
                        <a
                          href={whatsappInviteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl transition"
                        >
                          <span>Fungua Kundi la WhatsApp Moja kwa Moja</span>
                          <span>&rarr;</span>
                        </a>
                      ) : (
                        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <span>🔒 Kiungo cha WhatsApp kitafunguka hapa mara baada ya idhini ya Super Admin.</span>
                          <button
                            type="button"
                            onClick={handleSyncDashboard}
                            className="px-4 py-2 rounded-xl border border-blue-500/40 bg-blue-950/40 text-blue-300 text-xs font-semibold whitespace-nowrap"
                          >
                            🔄 Angalia Hali Sasa
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Copy Intro Card */}
                  <div className="sg-glass p-6 rounded-3xl space-y-4">
                    <div>
                      <span className="text-[10px] font-mono-sg text-emerald-400 font-bold uppercase block">
                        UJUMBE WA KUJITAMBULISHA
                      </span>
                      <h3 className="text-base font-bold text-white">Nakili Utambulisho Wako Kwenye WhatsApp Group</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ukishaingia kwenye WhatsApp Group, unaweza kunakili ujumbe huu mfupi kujitambulisha kwa wanafunzi wenzako:
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono-sg text-slate-200 leading-relaxed">
                      Habari wakuu, naitwa {member.full_name}, nimejiunga rasmi na SILLYGER Community (ID: {member.reg_number || 'PENDING'}). Nina shauku ya kujifunza programu na teknolojia pamoja nanyi! 🚀
                    </div>
                    <button
                      type="button"
                      onClick={copyWhatsAppIntro}
                      className="px-5 py-2.5 rounded-xl btn-sg-primary text-xs"
                    >
                      📋 Nakili Ujumbe wa Utambulisho
                    </button>
                  </div>
                </div>
              )}

              {/* ================================================== */}
              {/* PANE 3: UPDATES & RATIBA                           */}
              {/* ================================================== */}
              {currentStudentTab === 'updates' && (
                <div className="sg-glass p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div>
                      <span className="font-mono-sg text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                        UPDATES ZA KARIBU
                      </span>
                      <h2 className="text-lg font-bold text-white">Matangazo Yote & Ratiba za Vipindi</h2>
                    </div>
                    <span className="text-xs text-slate-400 font-mono-sg">Live Feed</span>
                  </div>
                  <div className="space-y-3">
                    {announcements.length > 0 ? (
                      announcements.map((a) => (
                        <div key={a.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white">{a.title}</h3>
                            <span className="text-[10px] font-mono-sg text-blue-400">
                              {new Date(a.created_at).toLocaleDateString('sw-TZ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{a.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400 font-mono-sg">
                        Hakuna matangazo mapya kwa sasa. Fuatilia tena hivi punde!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================================================== */}
              {/* PANE 4: CHECK-IN & RUHUSA                          */}
              {/* ================================================== */}
              {currentStudentTab === 'attendance' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Check-in ya Kipindi */}
                    <div className="sg-glass p-6 rounded-3xl flex flex-col justify-between space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                          <div>
                            <span className="font-mono-sg text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">
                              MAHUDHURIO YA VIPINDI
                            </span>
                            <h2 className="text-base font-bold text-white">Check-in ya Kipindi</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Rekodi ushiriki wako tunapokuwa na kipindi cha pamoja.</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg badge-active text-[11px] font-mono-sg font-bold shrink-0">
                            {attendanceList.length} Verified
                          </span>
                        </div>

                        <form onSubmit={handleCheckin} className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={checkinInput}
                            onChange={(e) => setCheckinInput(e.target.value)}
                            className="flex-grow sg-input px-3.5 py-2.5 rounded-xl text-xs"
                            placeholder="Mada ya kipindi (mf. Linux Basics)"
                            required
                          />
                          <button
                            type="submit"
                            className="px-4 py-2.5 rounded-xl btn-sg-emerald text-xs whitespace-nowrap"
                          >
                            ✓ Check-in
                          </button>
                        </form>

                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {attendanceList.length > 0 ? (
                            attendanceList.map((att) => (
                              <div key={att.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                                <div>
                                  <span className="text-white font-semibold block">{att.title}</span>
                                  <span className="text-[10px] text-slate-400 font-mono-sg">{att.date}</span>
                                </div>
                                <span className="text-emerald-400 font-mono-sg text-[10px]">● Verified</span>
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center text-xs text-slate-400 font-mono-sg">
                              Huna kumbukumbu za mahudhurio zilizorekodiwa bado.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Maombi ya Ruhusa */}
                    <div className="sg-glass p-6 rounded-3xl flex flex-col justify-between space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                          <div>
                            <span className="font-mono-sg text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-0.5">
                              UDHURU & TAARIFA
                            </span>
                            <h2 className="text-base font-bold text-white">Maombi ya Ruhusa</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Toa taarifa mapema endapo una mitihani au dharura.</p>
                          </div>
                          <button
                            onClick={() => setActiveModal('leave')}
                            className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs transition whitespace-nowrap shrink-0"
                          >
                            + Omba Ruhusa
                          </button>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {leaveRequests.length > 0 ? (
                            leaveRequests.map((l) => (
                              <div key={l.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                                <div className="flex items-center justify-between font-bold text-white">
                                  <span>{l.category}</span>
                                  <span className="text-amber-400 text-[10px] font-mono-sg">{l.status}</span>
                                </div>
                                <div className="text-slate-300 text-[11px]">{l.reason}</div>
                                <div className="text-[10px] text-slate-500 font-mono-sg">{l.duration} · {l.date}</div>
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center text-xs text-slate-400 font-mono-sg">
                              Huna ombi lolote la ruhusa kwa sasa.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================== */}
              {/* PANE 5: POSSIBLE COURSES                           */}
              {/* ================================================== */}
              {currentStudentTab === 'courses' && (
                <div className="space-y-5">
                  <div className="sg-glass p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="font-mono-sg text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                        POSSIBLE COURSES · MASOMO YA PAMOJA
                      </span>
                      <h2 className="text-lg font-bold text-white">Mada 10 Tunazoweza Kujifunza Pamoja</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tunapitia mada hizi kama kundi moja la wanafunzi kulingana na ratiba ya jumuiya.
                      </p>
                    </div>
                    <Link
                      href="/future-divisions"
                      className="text-xs font-semibold text-blue-400 hover:underline shrink-0"
                    >
                      Tazama Future Vision &rarr;
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {POSSIBLE_COURSES.map((c) => (
                      <div key={c.id} className="sg-glass p-5 rounded-3xl space-y-2 border border-slate-800/80 hover:border-blue-500/40 transition">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-lg bg-blue-600/20 text-blue-300 font-mono-sg text-[10px] font-bold">
                            {c.code}
                          </span>
                          <span className="text-[10px] font-mono-sg text-slate-400">{c.category}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white">{c.title}</h3>
                        <p className="text-xs text-slate-300 leading-relaxed">{c.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================================================== */}
              {/* PANE 6: WASIFU & KITAMBULISHO                      */}
              {/* ================================================== */}
              {currentStudentTab === 'profile' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Left Column: Full Details */}
                    <div className="xl:col-span-7 space-y-6">
                      <div className="sg-glass p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                          <div>
                            <span className="font-mono-sg text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                              TAARIFA ZA MWANAFUNZI
                            </span>
                            <h3 className="text-base font-bold text-white">Taarifa Kamili za Wasifu</h3>
                          </div>
                          <button
                            type="button"
                            onClick={openEditProfileModal}
                            className="px-3.5 py-1.5 rounded-xl border border-blue-500/40 bg-blue-950/30 hover:bg-blue-900/50 text-xs font-semibold text-blue-300 hover:text-white transition flex items-center gap-1.5"
                          >
                            <span>✏️</span>
                            <span>Hariri Wasifu</span>
                          </button>
                        </div>

                        {/* Avatar Profile Header */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-blue-500/40 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <img src="/assets/sillyger-logo-icon.svg" alt="SG" className="w-full h-full object-contain p-2" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-extrabold text-white truncate">{member.full_name}</h4>
                            <p className="text-xs font-mono-sg text-blue-400 font-bold">{member.reg_number || 'SG-PENDING'}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{member.email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-400 block mb-0.5">Jina Kamili</span>
                            <span className="text-white font-bold">{member.full_name}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-400 block mb-0.5">Namba ya Simu</span>
                            <span className="text-white font-mono-sg">{member.phone}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-400 block mb-0.5">Barua Pepe (Email)</span>
                            <span className="text-white font-mono-sg truncate block">{member.email}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-400 block mb-0.5">SG-ID</span>
                            <span className="text-blue-400 font-bold font-mono-sg">{member.reg_number || 'Inasubiri'}</span>
                          </div>
                        </div>

                        {/* Learning Goals / Bio */}
                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                          <span className="text-slate-400 block mb-0.5 text-xs">Mada Unazopenda / Ujuzi Unaolenga (Learning Goals & Bio)</span>
                          <span className="text-slate-200 text-xs leading-relaxed">
                            {member.learning_interest || member.motivation || 'Bado hujaweka malengo yako ya masomo. Bofya "Hariri Wasifu" kuongeza.'}
                          </span>
                        </div>
                      </div>

                      {/* Security & Account Protection */}
                      <div className="sg-glass p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                          <div>
                            <span className="font-mono-sg text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                              ULINZI WA AKAUNTI
                            </span>
                            <h3 className="text-base font-bold text-white">Usalama wa Nenosiri & Kikao (PDPA 2022)</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveModal('changePassword')}
                            className="px-3.5 py-1.5 rounded-xl border border-blue-500/40 bg-blue-950/30 hover:bg-blue-900/50 text-xs font-semibold text-blue-300 hover:text-white transition flex items-center gap-1.5"
                          >
                            <span>🔒</span>
                            <span>Badili Nenosiri</span>
                          </button>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                          Nenosiri lako linahifadhiwa kwa hash salama ya cryptographic SHA-256 yenye salt. Hakuna mtu anayeweza kuliona.
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Support Tickets & Direct Admin WhatsApp Help */}
                    <div className="xl:col-span-5 space-y-6">
                      {/* Direct Super Admin WhatsApp Help Card */}
                      <div className="sg-glass p-5 rounded-3xl border border-emerald-500/35 bg-gradient-to-br from-emerald-950/25 to-slate-900/90 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-lg shrink-0">
                            💬
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">Msaada wa Moja kwa Moja WhatsApp</h4>
                            <p className="text-[11px] text-slate-300">Una tatizo lolote la akaunti au swali la dharura? Ongea na Admin mara moja.</p>
                          </div>
                        </div>
                        <a
                          href={`https://wa.me/255750449373?text=${encodeURIComponent('Habari Super Admin SILLYGER, naitwa ' + member.full_name + ' (' + (member.reg_number || 'PENDING') + '). Nahitaji msaada kuhusu: ')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                        >
                          <span>Fungua WhatsApp ya Admin</span>
                          <span>&rarr;</span>
                        </a>
                      </div>

                      <div className="sg-glass p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                          <div>
                            <span className="font-mono-sg text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                              TIKETI & MSAADA
                            </span>
                            <h3 className="text-base font-bold text-white">Tiketi Zangu</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveModal('ticket')}
                            className="px-3 py-1.5 rounded-xl btn-sg-primary text-xs"
                          >
                            + Uliza Swali
                          </button>
                        </div>
                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                          {supportTickets.length > 0 ? (
                            supportTickets.map((t) => (
                              <div key={t.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                                <div className="flex items-center justify-between font-bold text-white">
                                  <span>{t.title}</span>
                                  <span className="text-emerald-400 text-[10px] font-mono-sg">{t.status}</span>
                                </div>
                                <p className="text-slate-300 text-[11px]">{t.message}</p>
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center text-xs text-slate-400 font-mono-sg">
                              Huna tiketi yoyote ya msaada inayofanya kazi.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================== */}
              {/* PANE 7: MIPANGILIO (SETTINGS)                      */}
              {/* ================================================== */}
              {currentStudentTab === 'settings' && (
                <div className="space-y-6">
                  <div className="sg-glass p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="font-mono-sg text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                        MIPANGILIO YA AKAUNTI
                      </span>
                      <h2 className="text-xl font-bold text-white">Mipangilio, Usalama & Faragha</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Dhibiti taarifa zako binafsi, nenosiri, faragha ya data (PDPA 2022) na vikao vyako.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openEditProfileModal}
                      className="px-4 py-2.5 rounded-2xl btn-sg-primary text-xs flex items-center gap-1.5 shrink-0"
                    >
                      <span>✏️</span>
                      <span>Hariri Wasifu</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Card 1: Data Export PDPA */}
                    <div className="sg-glass p-6 rounded-3xl space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-800/80">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-lg shrink-0">
                            📜
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">Faragha ya Data (PDPA 2022)</h3>
                            <p className="text-[11px] text-slate-400">Haki zako za kisheria za taarifa binafsi</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Mfumo wa SILLYGER unaheshimu Sheria ya Ulinzi wa Taarifa Binafsi Tanzania. Una haki ya kupata nakala kamili ya data zako.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={exportMyData}
                        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono-sg text-slate-200 hover:text-white transition flex items-center justify-center gap-1.5"
                      >
                        <span>📥</span>
                        <span>Pakua Data Zangu (Export JSON)</span>
                      </button>
                    </div>

                    {/* Card 2: Session Shield */}
                    <div className="sg-glass p-6 rounded-3xl space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-800/80">
                          <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
                            🛡️
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">Kikao cha Sasa (Session Shield)</h3>
                            <p className="text-[11px] text-slate-400">Hali ya muunganisho wa seva salama</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                            <span className="text-slate-400">Hadhi ya Kikao:</span>
                            <span className="text-emerald-400 font-mono-sg font-bold">● Active & Guarded</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full py-2.5 rounded-xl border border-red-500/40 bg-red-950/30 hover:bg-red-900/50 text-red-300 hover:text-white font-semibold text-xs transition flex items-center justify-center gap-2"
                      >
                        <span>🚪</span>
                        <span>Ondoka kwenye Kifaa Hiki (Sign Out)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODALS                                                         */}
      {/* ============================================================== */}

      {/* MODAL 1: OMBA RUHUSA */}
      {activeModal === 'leave' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="sg-glass p-6 sm:p-8 rounded-3xl border border-blue-500/40 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono-sg text-blue-400 uppercase font-bold block">TAARIFA YA UDHURU</span>
                <h3 className="text-lg font-bold text-white">Wasilisha Ombi la Ruhusa</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white p-1.5">✕</button>
            </div>
            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="leave-category">Sababu Kuu</label>
                <select
                  id="leave-category"
                  value={leaveCategory}
                  onChange={(e) => setLeaveCategory(e.target.value)}
                  className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs"
                >
                  <option value="Academic">Masomo / Mitihani (Academic)</option>
                  <option value="Technical">Changamoto ya Mtandao au Kifaa</option>
                  <option value="Health">Afya / Matibabu</option>
                  <option value="Work">Majukumu Mengine</option>
                  <option value="Family">Dharura ya Familia / Binafsi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="leave-duration">Muda wa Ruhusa</label>
                <select
                  id="leave-duration"
                  value={leaveDuration}
                  onChange={(e) => setLeaveDuration(e.target.value)}
                  className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs"
                >
                  <option value="Siku 1 - 3">Siku 1 - 3</option>
                  <option value="Siku 4 - 7">Wiki 1 (Siku 4 - 7)</option>
                  <option value="Wiki 2">Wiki 2</option>
                  <option value="Zaidi ya Wiki 2">Zaidi ya Wiki 2</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="leave-reason">Maelezo Mafupi</label>
                <textarea
                  id="leave-reason"
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs"
                  placeholder="Andika kwa ufupi sababu yako..."
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Ghairi
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl btn-sg-primary text-xs">
                  Tuma Ombi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TIKETI YA MSAADA */}
      {activeModal === 'ticket' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="sg-glass p-6 sm:p-8 rounded-3xl border border-indigo-500/40 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono-sg text-indigo-400 uppercase font-bold block">MSAADA KWA MWANAFUNZI</span>
                <h3 className="text-lg font-bold text-white">Uliza Swali au Omba Msaada</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white p-1.5">✕</button>
            </div>
            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="ticket-category">Aina ya Msaada</label>
                <select
                  id="ticket-category"
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs"
                >
                  <option value="Account & Approval">Idhini ya Kujiunga & WhatsApp Link</option>
                  <option value="Curriculum & Learning">Masomo ya Pamoja (Courses)</option>
                  <option value="Projects & Research">Miradi ya Wanafunzi</option>
                  <option value="Data & Privacy (PDPA)">Marekebisho ya Taarifa Binafsi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="ticket-title">Kichwa cha Somo</label>
                <input
                  type="text"
                  id="ticket-title"
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs"
                  placeholder="Mf. Maswali kuhusu ufunguzi wa WhatsApp"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="ticket-message">Ujumbe Wako</label>
                <textarea
                  id="ticket-message"
                  rows={3}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs"
                  placeholder="Eleza kwa undani swali lako..."
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Ghairi
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl btn-sg-primary text-xs">
                  Wasilisha Tiketi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BADILI NENOSIRI */}
      {activeModal === 'changePassword' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="sg-glass p-6 sm:p-8 rounded-3xl border border-emerald-500/40 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono-sg text-emerald-400 uppercase font-bold block">USALAMA WA AKAUNTI</span>
                <h3 className="text-lg font-bold text-white">Badili Nenosiri Lako</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white p-1.5">✕</button>
            </div>
            {pwModalMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
                {pwModalMsg}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nenosiri la Sasa</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs"
                  placeholder="Nenosiri lako la sasa"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nenosiri Jipya (Herufi 6+)</label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs"
                  placeholder="Weka nenosiri salama jipya"
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Thibitisha Nenosiri Jipya</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs"
                  placeholder="Rudia nenosiri jipya"
                  minLength={6}
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Ghairi
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl btn-sg-primary text-xs">
                  Hifadhi Nenosiri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: HARIRI WASIFU */}
      {activeModal === 'editProfile' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="sg-glass p-6 sm:p-8 rounded-3xl border border-blue-500/40 max-w-md w-full shadow-2xl space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono-sg text-blue-400 uppercase font-bold block">WASIFU WA MWANAFUNZI</span>
                <h3 className="text-lg font-bold text-white">Hariri Taarifa Binafsi</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white p-1.5">✕</button>
            </div>

            {editProfileError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs">
                {editProfileError}
              </div>
            )}

            <form onSubmit={handleEditProfile} className="space-y-4">
              {/* Profile Picture Upload & Preview */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative shrink-0 mx-auto sm:mx-0">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-blue-600/25 overflow-hidden">
                    <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center overflow-hidden p-1">
                      {pendingAvatar ? (
                        <img src={pendingAvatar} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                      ) : member?.avatar_url ? (
                        <img src={member.avatar_url} alt="Current" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <img src="/assets/sillyger-logo-icon.svg" alt="SG" className="w-full h-full object-contain p-2" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 flex-grow text-center sm:text-left">
                  <span className="block text-xs font-semibold text-slate-200">Picha ya Wasifu (Profile Picture)</span>
                  <p className="text-[11px] text-slate-400">Picha itaonekana kwenye Dashboard na Kitambulisho chako cha SG-ID.</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <label htmlFor="ep-avatar-file" className="px-3.5 py-1.5 rounded-xl btn-sg-primary text-xs cursor-pointer inline-flex items-center gap-1.5">
                      <span>📷</span>
                      <span>Chagua Picha</span>
                    </label>
                    <input
                      type="file"
                      id="ep-avatar-file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                    {(pendingAvatar || member?.avatar_url) && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-3 py-1.5 rounded-xl border border-red-500/40 bg-red-950/30 text-red-300 hover:text-white text-xs transition"
                      >
                        Ondoa Picha
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Jina Kamili *</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs"
                  placeholder="mf. William Gerishom"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Namba ya Simu / WhatsApp (Tanzania) *</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs font-mono-sg"
                  placeholder="mf. +2557XXXXXXXX"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mada Unazopenda / Ujuzi Unaolenga (Learning Goals & Bio)</label>
                <textarea
                  rows={3}
                  value={editInterest}
                  onChange={(e) => setEditInterest(e.target.value)}
                  className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs leading-relaxed"
                  placeholder="mf. Napenda Web Development, Cybersecurity na Python. Lengo langu ni kuwa Full-Stack Engineer."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Ghairi
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl btn-sg-primary text-xs flex items-center gap-1.5">
                  <span>✓ Hifadhi Wasifu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function PortalPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 font-mono-sg text-xs">Inapakia Portal...</div>}>
      <PortalContent />
    </Suspense>
  );
}
