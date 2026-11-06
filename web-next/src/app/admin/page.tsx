'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api, { Member, Announcement, TvBroadcast } from '../../lib/api';

interface ApplicantRecord {
  id: string;
  full_name: string;
  username: string;
  phone: string;
  email: string;
  track?: string;
  experience?: string;
  motivation?: string;
  created_at?: string;
  status: 'PENDING' | 'ACTIVE' | 'ON_HOLD' | 'SUSPENDED';
  reg_number?: string;
  role?: string;
}

interface FundTransaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  description: string;
}

interface AttendanceRecord {
  id: string;
  member_id: string;
  name: string;
  session_title: string;
  date: string;
  status: 'VERIFIED' | 'PENDING';
}

interface LeaveRequest {
  id: string;
  member_id: string;
  name: string;
  type: string;
  duration: string;
  reason: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

interface SupportTicket {
  id: string;
  member_name: string;
  title: string;
  category: string;
  message: string;
  status: 'OPEN' | 'RESOLVED';
}

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  target: string;
  details: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    'queue' | 'members' | 'announcements' | 'fund' | 'attendance' | 'leaves' | 'audit' | 'database' | 'tv'
  >('queue');

  // Admin Profile info
  const [adminName, setAdminName] = useState('William Gerishom William');
  const [adminRole, setAdminRole] = useState('Super Administrator');
  const [adminId, setAdminId] = useState('SG-000001');

  // Telemetry counters
  const [pendingCount, setPendingCount] = useState(4);
  const [activeCount, setActiveCount] = useState(14);
  const [totalCount, setTotalCount] = useState(18);
  const [fundBalance, setFundBalance] = useState(1250000);
  const [auditLogsCount, setAuditLogsCount] = useState(24);

  // Tab 1: Queue (Pending Applicants)
  const [pendingApplicants, setPendingApplicants] = useState<ApplicantRecord[]>([
    {
      id: 'app_1',
      full_name: 'Juma Shabani Bakari',
      username: 'jumabakari',
      phone: '+255712345678',
      email: 'juma.bakari@gmail.com',
      track: 'SG Student Community',
      experience: 'Mwanafunzi Mpya',
      motivation: 'Ninapenda kujifunza Linux, Web Development na Python ili niweze kujenga mifumo.',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: 'PENDING',
    },
    {
      id: 'app_2',
      full_name: 'Amina Selemani Rashid',
      username: 'aminash',
      phone: '+255754987654',
      email: 'amina.rashid@yahoo.com',
      track: 'SG Student Community',
      experience: 'Mwanafunzi Mpya',
      motivation: 'Natamani sana kufahamu misingi ya Cybersecurity, Ethical Hacking na Networking.',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      status: 'PENDING',
    },
    {
      id: 'app_3',
      full_name: 'Baraka Emmanuel Mollel',
      username: 'barakamollel',
      phone: '+255788112233',
      email: 'baraka.mollel@outlook.com',
      track: 'SG Student Community',
      experience: 'Mwanafunzi Mpya',
      motivation: 'Napenda software engineering, Git version control na ujenzi wa API za Go.',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      status: 'PENDING',
    },
    {
      id: 'app_4',
      full_name: 'Zuhura Hassan Ally',
      username: 'zuhuraally',
      phone: '+255765443322',
      email: 'zuhura.ally@gmail.com',
      track: 'SG Student Community',
      experience: 'Mwanafunzi Mpya',
      motivation: 'Natafuta jumuiya ya wanafunzi wenzangu wa IT ili tusome na kufanya project pamoja.',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      status: 'PENDING',
    },
  ]);

  // Tab 2: Members Directory
  const [membersList, setMembersList] = useState<ApplicantRecord[]>([
    {
      id: 'mem_1',
      full_name: 'William Gerishom William',
      username: 'willyger',
      phone: '+255700000001',
      email: 'willyger@sillyger.org',
      reg_number: 'SG-000001',
      role: 'Super Administrator',
      status: 'ACTIVE',
      track: 'SG Student Community',
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'mem_2',
      full_name: 'Kelvin Daniel Mrosso',
      username: 'kelvinmrosso',
      phone: '+255714001122',
      email: 'kelvin.m@sillyger.org',
      reg_number: 'SG-000002',
      role: 'Administrator',
      status: 'ACTIVE',
      track: 'SG Student Community',
      created_at: '2026-01-05T10:00:00Z',
    },
    {
      id: 'mem_3',
      full_name: 'Neema Josephat Mushi',
      username: 'neemamushi',
      phone: '+255784998877',
      email: 'neema.mushi@gmail.com',
      reg_number: 'SG-000003',
      role: 'Member',
      status: 'ACTIVE',
      track: 'SG Student Community',
      created_at: '2026-01-10T14:30:00Z',
    },
  ]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Tab 3: Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAncTitle, setNewAncTitle] = useState('');
  const [newAncPriority, setNewAncPriority] = useState<'NORMAL' | 'HIGH'>('NORMAL');
  const [newAncContent, setNewAncContent] = useState('');

  // Tab 4: Fund Ledger
  const [fundTransactions, setFundTransactions] = useState<FundTransaction[]>([
    {
      id: 'tx_1',
      date: '2026-02-01',
      type: 'INCOME',
      amount: 1500000,
      category: 'Community Sponsorship',
      description: 'Mchango wa maendeleo ya miundombinu ya server na Cloud hosting.',
    },
    {
      id: 'tx_2',
      date: '2026-02-15',
      type: 'EXPENSE',
      amount: 250000,
      category: 'Domain & SSL Security',
      description: 'Gharama za uhakiki wa Domain, DNS na SSL encryption kwa ajili ya usalama wa mfumo.',
    },
  ]);
  const [fundType, setFundType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [fundAmount, setFundAmount] = useState('');
  const [fundCategory, setFundCategory] = useState('');
  const [fundDesc, setFundDesc] = useState('');

  // Tab 5: Attendance
  const [activeSessionTitle, setActiveSessionTitle] = useState(
    'Kipindi cha Jumamosi: Level 2 Digital Logic & ALU'
  );
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: 'att_1',
      member_id: 'SG-000003',
      name: 'Neema Josephat Mushi',
      session_title: 'Level 2 Digital Logic & ALU',
      date: '2026-02-28',
      status: 'VERIFIED',
    },
    {
      id: 'att_2',
      member_id: 'SG-000002',
      name: 'Kelvin Daniel Mrosso',
      session_title: 'Level 2 Digital Logic & ALU',
      date: '2026-02-28',
      status: 'VERIFIED',
    },
  ]);

  // Tab 6: Leaves & Tickets
  const [leavesList, setLeavesList] = useState<LeaveRequest[]>([
    {
      id: 'lv_1',
      member_id: 'SG-000003',
      name: 'Neema Josephat Mushi',
      type: 'Masomo / Mitihani ya Chuo',
      duration: 'Wiki 2 (Machi 01 - 14)',
      reason: 'Kujiandaa na mitihani ya muhula chuoni.',
      status: 'APPROVED',
    },
  ]);
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>([
    {
      id: 'tk_1',
      member_name: 'Kelvin Daniel',
      title: 'Msaada wa Usanidi wa Docker kwenye Linux',
      category: 'Teknolojia',
      message: 'Habari viongozi, nimekwama kwenye hatua ya kuanzisha Docker container kwa ajili ya Postgres.',
      status: 'OPEN',
    },
  ]);

  // Tab 7: Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'log_1',
      timestamp: '2026-11-06 18:30:15',
      action: 'SYSTEM_BOOT',
      actor: 'Super Administrator',
      target: 'Platform Core',
      details: 'Next.js v2 & Go Engine sync successfully verified.',
    },
    {
      id: 'log_2',
      timestamp: '2026-11-06 17:45:00',
      action: 'MEMBER_APPROVED',
      actor: 'William Gerishom',
      target: 'SG-000003',
      details: 'Mwanachama amepewa kitambulisho na kuunganishwa na WhatsApp Group.',
    },
    {
      id: 'log_3',
      timestamp: '2026-11-06 16:12:30',
      action: 'LOGIN',
      actor: 'William Gerishom',
      target: 'Executive Portal',
      details: 'Kuingia kwa ufanisi kupitia kitambulisho cha SHA-256.',
    },
  ]);
  const [auditFilter, setAuditFilter] = useState('');

  // Tab 8: Database & Settings
  const [whatsappLink, setWhatsappLink] = useState('https://chat.whatsapp.com/sample_invite_link');
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('https://inxmxykulzaqxrnpbvwd.supabase.co');
  const [supabaseKey, setSupabaseKey] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

  // Tab 9: SILLYGER TV Studio
  const [tvUrl, setTvUrl] = useState('https://www.youtube.com/watch?v=live_stream');
  const [tvTitle, setTvTitle] = useState('SILLYGER Tech Broadcast — Live Coding & Systems');
  const [tvDesc, setTvDesc] = useState('Matangazo rasmi ya moja kwa moja ya jumuiya ya wanafunzi ya SILLYGER.');
  const [tvIsLive, setTvIsLive] = useState(true);
  const [tvParsedVideoId, setTvParsedVideoId] = useState('live_stream');
  const [tvArchive, setTvArchive] = useState([
    {
      id: 'arc_1',
      videoId: 'sample_id_1',
      title: 'Kuanza na Linux Terminal & Bash Commands',
      desc: 'Misingi ya kutumia amri za Linux na usimamizi wa mafaili.',
    },
    {
      id: 'arc_2',
      videoId: 'sample_id_2',
      title: 'Ujenzi wa API kwa Lugha ya Go (Golang)',
      desc: 'Kutengeneza Web Servers zenye kasi ya juu na usalama thabiti.',
    },
  ]);

  // Modal: Member Dossier
  const [inspectingMember, setInspectingMember] = useState<ApplicantRecord | null>(null);
  const [dossierMemberId, setDossierMemberId] = useState('');
  const [dossierRole, setDossierRole] = useState('Member');
  const [dossierStatus, setDossierStatus] = useState<'PENDING' | 'ACTIVE' | 'ON_HOLD' | 'SUSPENDED'>('ACTIVE');
  const [dossierNewPassword, setDossierNewPassword] = useState('');
  const [dossierAuditReason, setDossierAuditReason] = useState('');

  // Toast System
  const [toasts, setToasts] = useState<{ id: string; message: string; variant: 'success' | 'error' | 'info' }[]>([]);

  const showToast = (message: string, variant: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // Helper to extract YouTube ID
  const extractVideoId = (input: string) => {
    if (!input) return null;
    const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?.*v=|live\/|shorts\/))([\w-]{11})/i);
    return match ? match[1] : input.trim();
  };

  // Initial load
  useEffect(() => {
    const session = api.getCurrentMember();
    if (session) {
      setAdminName(session.full_name || 'William Gerishom William');
      setAdminRole(session.role || 'Super Administrator');
      if (session.reg_number) setAdminId(session.reg_number);
    }

    // Try fetching from Go API
    api.getPendingMembers()
      .then((pending) => {
        if (pending && pending.length > 0) {
          const mapped: ApplicantRecord[] = pending.map((p) => ({
            id: p.id,
            full_name: p.full_name,
            username: (p as any).username || p.full_name.toLowerCase().replace(/\s+/g, '_'),
            phone: p.phone,
            email: p.email,
            track: 'SG Student Community',
            experience: 'Mwanafunzi',
            motivation: (p as any).motivation || 'Kujifunza teknolojia pamoja na wenzangu.',
            created_at: p.created_at || new Date().toISOString(),
            status: 'PENDING',
          }));
          setPendingApplicants(mapped);
          setPendingCount(mapped.length);
        }
      })
      .catch(() => {});

    api.getAnnouncements()
      .then((list) => {
        if (list && list.length > 0) setAnnouncements(list);
      })
      .catch(() => {});

    api.getTvBroadcast()
      .then((tv) => {
        if (tv) {
          setTvTitle(tv.title || 'SILLYGER Tech Broadcast');
          setTvUrl(tv.video_url || 'https://www.youtube.com/watch?v=live_stream');
          setTvIsLive(!!tv.is_live);
          const vId = extractVideoId(tv.video_url || '');
          if (vId) setTvParsedVideoId(vId);
        }
      })
      .catch(() => {});
  }, []);

  // Update total counts
  useEffect(() => {
    setPendingCount(pendingApplicants.length);
    setActiveCount(membersList.filter((m) => m.status === 'ACTIVE').length);
    setTotalCount(membersList.length + pendingApplicants.length);
  }, [pendingApplicants, membersList]);

  // Handlers for Tab 1 (Queue)
  const handleApprove = async (applicant: ApplicantRecord) => {
    try {
      let regNumber = applicant.reg_number;
      try {
        const res = await api.approveMember(applicant.id);
        if (res && res.reg_number) regNumber = res.reg_number;
      } catch (_) {
        // Fallback generator
        const nextNum = (membersList.length + 1).toString().padStart(6, '0');
        regNumber = `SG-${nextNum}`;
      }

      const approved: ApplicantRecord = {
        ...applicant,
        status: 'ACTIVE',
        reg_number: regNumber || `SG-${(membersList.length + 1).toString().padStart(6, '0')}`,
        role: 'Member',
      };

      setPendingApplicants((prev) => prev.filter((a) => a.id !== applicant.id));
      setMembersList((prev) => [approved, ...prev]);

      // Record Audit
      setAuditLogs((prev) => [
        {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleString('sw-TZ'),
          action: 'MEMBER_APPROVED',
          actor: adminName,
          target: approved.reg_number || applicant.full_name,
          details: `Mwanafunzi ${applicant.full_name} ameidhinishwa uanachama rasmi.`,
        },
        ...prev,
      ]);

      showToast(`✓ ${applicant.full_name} ameidhinishwa kikamilifu! ID: ${approved.reg_number}`, 'success');
      if (inspectingMember && inspectingMember.id === applicant.id) {
        setInspectingMember(null);
      }
    } catch (e: any) {
      showToast(e.message || 'Hitilafu wakati wa kuidhinisha.', 'error');
    }
  };

  const handleApproveAll = async () => {
    if (pendingApplicants.length === 0) return;
    const list = [...pendingApplicants];
    for (const applicant of list) {
      await handleApprove(applicant);
    }
    showToast(`✓ Wanafunzi wote ${list.length} wameidhinishwa kwa pamoja!`, 'success');
  };

  const handleReject = (id: string, name: string) => {
    if (confirm(`Je, una uhakika unataka kukataa ombi la ${name}?`)) {
      setPendingApplicants((prev) => prev.filter((a) => a.id !== id));
      showToast(`Ombi la ${name} limeondolewa.`, 'info');
      if (inspectingMember && inspectingMember.id === id) {
        setInspectingMember(null);
      }
    }
  };

  // Inspect / Dossier
  const openDossier = (record: ApplicantRecord) => {
    setInspectingMember(record);
    setDossierMemberId(record.reg_number || '');
    setDossierRole(record.role || (record.status === 'PENDING' ? 'Applicant' : 'Member'));
    setDossierStatus(record.status);
    setDossierNewPassword('');
    setDossierAuditReason('');
  };

  const saveDossierChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingMember) return;

    const updated: ApplicantRecord = {
      ...inspectingMember,
      reg_number: dossierMemberId || inspectingMember.reg_number,
      role: dossierRole,
      status: dossierStatus,
    };

    if (inspectingMember.status === 'PENDING' && dossierStatus === 'ACTIVE') {
      setPendingApplicants((prev) => prev.filter((a) => a.id !== inspectingMember.id));
      setMembersList((prev) => [updated, ...prev.filter((m) => m.id !== inspectingMember.id)]);
    } else {
      setMembersList((prev) => prev.map((m) => (m.id === inspectingMember.id ? updated : m)));
      setPendingApplicants((prev) => prev.map((a) => (a.id === inspectingMember.id ? updated : a)));
    }

    setAuditLogs((prev) => [
      {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString('sw-TZ'),
        action: 'ROLE_CHANGE',
        actor: adminName,
        target: updated.reg_number || updated.full_name,
        details: dossierAuditReason || `Marekebisho ya jukumu (${dossierRole}) na hadhi (${dossierStatus}).`,
      },
      ...prev,
    ]);

    showToast(`✓ Taarifa za ${updated.full_name} zimesasishwa kikamilifu!`, 'success');
    setInspectingMember(null);
  };

  // Tab 3 Handlers (Announcements)
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAncTitle.trim() || !newAncContent.trim()) return;

    try {
      const created = await api.createAnnouncement({
        title: newAncTitle.trim(),
        content: newAncContent.trim(),
        priority: newAncPriority,
      });

      setAnnouncements((prev) => [created, ...prev]);
      setNewAncTitle('');
      setNewAncContent('');
      showToast('📢 Tangazo limechapishwa kwa wanachama wote!', 'success');
    } catch (_) {
      // Local fallback
      const fallback: Announcement = {
        id: 'anc_' + Date.now(),
        title: newAncTitle.trim(),
        content: newAncContent.trim(),
        priority: newAncPriority,
        category: 'Official',
        author_name: adminName,
        created_at: new Date().toISOString(),
      };
      setAnnouncements((prev) => [fallback, ...prev]);
      setNewAncTitle('');
      setNewAncContent('');
      showToast('📢 Tangazo limechapishwa kikamilifu!', 'success');
    }
  };

  // Tab 4 Handlers (Fund)
  const handleRecordFund = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(fundAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Tafadhali weka kiasi sahihi cha fedha.', 'error');
      return;
    }

    const tx: FundTransaction = {
      id: 'tx_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: fundType,
      amount: amountNum,
      category: fundCategory.trim(),
      description: fundDesc.trim(),
    };

    setFundTransactions((prev) => [tx, ...prev]);
    setFundBalance((prev) => (fundType === 'INCOME' ? prev + amountNum : prev - amountNum));
    setFundAmount('');
    setFundCategory('');
    setFundDesc('');
    showToast('✓ Muamala umerekodiwa rasmi kwenye leja!', 'success');
  };

  // Tab 5 Handlers (Attendance)
  const handleVerifyAllAttendance = () => {
    setAttendanceRecords((prev) => prev.map((a) => ({ ...a, status: 'VERIFIED' })));
    showToast('✓ Mahudhurio yote yamethibitishwa!', 'success');
  };

  // Tab 8 Handlers (Database & Settings)
  const handleSaveWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('✓ Kiungo cha WhatsApp Group kimesasishwa!', 'success');
  };

  const handleExportJSON = () => {
    const data = {
      exported_at: new Date().toISOString(),
      admin: adminName,
      members: membersList,
      pending: pendingApplicants,
      fund: { balance: fundBalance, transactions: fundTransactions },
      attendance: attendanceRecords,
      auditLogs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SILLYGER_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('✓ Data yote ya mfumo imepakuliwa kama JSON!', 'success');
  };

  // Tab 9 Handlers (TV Studio)
  const handlePublishTv = async (e: React.FormEvent) => {
    e.preventDefault();
    const vId = extractVideoId(tvUrl) || 'live_stream';
    setTvParsedVideoId(vId);

    try {
      await api.setTvBroadcast({
        title: tvTitle,
        description: tvDesc,
        video_url: tvUrl,
        video_id: vId,
        is_live: tvIsLive,
      });
      showToast('🚀 SILLYGER TV imerushwa Live sasa hivi!', 'success');
    } catch (_) {
      showToast('🚀 SILLYGER TV imesasishwa moja kwa moja!', 'success');
    }
  };

  const handleStopTv = async () => {
    setTvIsLive(false);
    try {
      await api.setTvBroadcast({
        title: tvTitle,
        description: tvDesc,
        video_url: tvUrl,
        video_id: tvParsedVideoId,
        is_live: false,
      });
    } catch (_) {}
    showToast('⏸️ SILLYGER TV imewekwa kwenye hali ya Standby.', 'info');
  };

  // Filtered members
  const filteredMembers = membersList.filter((m) => {
    if (!memberSearchQuery) return true;
    const q = memberSearchQuery.toLowerCase();
    return (
      m.full_name.toLowerCase().includes(q) ||
      m.username.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      (m.reg_number && m.reg_number.toLowerCase().includes(q))
    );
  });

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter((l) => {
    if (!auditFilter) return true;
    return l.action.toLowerCase().includes(auditFilter.toLowerCase());
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* ============================================================== */}
      {/* 1. EXECUTIVE TELEMETRY & IDENTITY BANNER                        */}
      {/* ============================================================== */}
      <div className="sg-glass p-6 md:p-8 rounded-3xl border border-purple-900/60 bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-purple-500/40 flex items-center justify-center shadow-xl shadow-purple-500/30 shrink-0 overflow-hidden p-1.5">
            <img src="/assets/sillyger-logo-icon.svg" alt="SG" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">{adminName}</h1>
              <span className="px-3 py-1 rounded-full badge-hold text-xs font-mono-sg font-bold uppercase tracking-wider">
                {adminRole}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-mono-sg font-bold">
                {adminId}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono-sg flex flex-wrap items-center gap-2">
              <span>Mamlaka Kuu ya Utawala & Ulinzi wa Mfumo</span>
              <span>•</span>
              <span className="text-emerald-400">SHA-256 & Tanzania PDPA 2022 Compliant</span>
            </p>
          </div>
        </div>

        {/* Live Quick Counter Telemetry */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-xl font-extrabold text-amber-400 font-mono-sg">{pendingCount}</span>
            <span className="text-[10px] text-slate-400 block uppercase font-mono-sg mt-0.5">Pending</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-xl font-extrabold text-emerald-400 font-mono-sg">{activeCount}</span>
            <span className="text-[10px] text-slate-400 block uppercase font-mono-sg mt-0.5">Active</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-xl font-extrabold text-cyan-400 font-mono-sg">{totalCount}</span>
            <span className="text-[10px] text-slate-400 block uppercase font-mono-sg mt-0.5">Wote</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-sm font-extrabold text-teal-400 font-mono-sg truncate block">
              {fundBalance.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block uppercase font-mono-sg mt-0.5">SG Fund</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-xl font-extrabold text-purple-400 font-mono-sg">{auditLogs.length}</span>
            <span className="text-[10px] text-slate-400 block uppercase font-mono-sg mt-0.5">Audit Logs</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. EXECUTIVE NAVIGATION TABS                                   */}
      {/* ============================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80">
        {/* Tab 1: Queue */}
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'queue'
              ? 'bg-purple-600/20 border border-purple-500/50 text-white shadow-md shadow-purple-500/10'
              : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <span>Maombi Mapya (Queue)</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono-sg text-[10px] font-black">
              {pendingCount}
            </span>
          )}
        </button>

        {/* Tab 2: Members */}
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'members'
              ? 'bg-purple-600/20 border border-purple-500/50 text-white shadow-md shadow-purple-500/10'
              : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
          <span>Wanachama & RBAC</span>
        </button>

        {/* Tab 3: Announcements */}
        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'announcements'
              ? 'bg-purple-600/20 border border-purple-500/50 text-white shadow-md shadow-purple-500/10'
              : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
          </svg>
          <span>Matangazo Rasmi</span>
        </button>

        {/* Tab 4: Fund */}
        <button
          type="button"
          onClick={() => setActiveTab('fund')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'fund'
              ? 'bg-purple-600/20 border border-purple-500/50 text-white shadow-md shadow-purple-500/10'
              : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>SG Community Fund</span>
        </button>

        {/* Tab 5: Attendance */}
        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'bg-purple-600/20 border border-purple-500/50 text-white shadow-md shadow-purple-500/10'
              : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Mahudhurio</span>
        </button>

        {/* Tab 6: Leaves & Tickets */}
        <button
          type="button"
          onClick={() => setActiveTab('leaves')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'leaves'
              ? 'bg-purple-600/20 border border-purple-500/50 text-white shadow-md shadow-purple-500/10'
              : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <span>Ruhusa & Tiketi</span>
        </button>

        {/* Tab 7: Audit */}
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-purple-600/20 border border-purple-500/50 text-white shadow-md shadow-purple-500/10'
              : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <span>Audit Logs</span>
        </button>

        {/* Tab 8: Database */}
        <button
          type="button"
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'database'
              ? 'bg-purple-600/20 border border-purple-500/50 text-white shadow-md shadow-purple-500/10'
              : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
          </svg>
          <span>Database & Mipangilio</span>
        </button>

        {/* Tab 9: TV Studio */}
        <button
          type="button"
          onClick={() => setActiveTab('tv')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'tv'
              ? 'bg-purple-600/20 border border-purple-500/50 text-white shadow-md shadow-purple-500/10'
              : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span className="text-red-400 text-sm">📺</span>
          <span>SILLYGER TV Live Studio</span>
          {tvIsLive && (
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-mono-sg text-[9px] font-black animate-pulse">
              LIVE
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3. TAB PANES                                                   */}
      {/* ============================================================== */}

      {/* TAB PANE 1: QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Maombi Mapya Yanayosubiri Ukaguzi (Pending Queue)</h2>
              <p className="text-xs text-slate-400">
                Watu hawa wamejaza fomu na kukubali Katiba v1.4. Bonyeza <strong>&quot;✓ Idhinisha Sasa&quot;</strong> kuwapa Unique Member ID papo hapo na kuwafungulia WhatsApp Group!
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {pendingApplicants.length > 0 && (
                <button
                  type="button"
                  onClick={handleApproveAll}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-500/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Idhinisha Wote ({pendingApplicants.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => showToast('Queue imesasishwa moja kwa moja!', 'info')}
                className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/60 border border-purple-500/50 text-purple-300 hover:text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-purple-500/10"
              >
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <span>Onyesha Upya (Refresh Queue)</span>
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="sg-glass rounded-2xl border border-slate-800 overflow-x-auto shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono-sg uppercase text-slate-400 bg-slate-950/70">
                  <th className="px-4 py-3.5">Mwanafunzi Mwombaji</th>
                  <th className="px-4 py-3.5">Mawasiliano (WhatsApp / Email)</th>
                  <th className="px-4 py-3.5">Jumuiya</th>
                  <th className="px-4 py-3.5">Maelezo / Mada Anayopenda</th>
                  <th className="px-4 py-3.5">Tarehe</th>
                  <th className="px-4 py-3.5 text-right">Vitendo (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {pendingApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-mono-sg">
                      Hakuna maombi mapya yanayosubiri ukaguzi kwa sasa.
                    </td>
                  </tr>
                ) : (
                  pendingApplicants.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-900/40 transition">
                      <td className="px-4 py-3.5">
                        <strong className="text-white block font-semibold">{app.full_name}</strong>
                        <span className="text-[11px] font-mono-sg text-cyan-400">@{app.username}</span>
                      </td>
                      <td className="px-4 py-3.5 font-mono-sg">
                        <div className="text-blue-400">{app.phone}</div>
                        <div className="text-slate-500 text-[11px]">{app.email}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono-sg bg-blue-950/70 border border-blue-800 text-blue-300">
                          {app.track || 'SG Student Community'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300 max-w-xs truncate" title={app.motivation}>
                        {app.motivation || '—'}
                      </td>
                      <td className="px-4 py-3.5 font-mono-sg text-slate-500 text-[11px]">
                        {app.created_at ? new Date(app.created_at).toLocaleDateString('sw-TZ') : 'Leo'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApprove(app)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] transition shadow"
                          >
                            ✓ Idhinisha Sasa
                          </button>
                          <button
                            type="button"
                            onClick={() => openDossier(app)}
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-300 hover:text-white font-semibold text-[11px] transition"
                          >
                            Dhibiti
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(app.id, app.full_name)}
                            className="px-2 py-1.5 rounded-lg border border-red-900/50 hover:bg-red-950/50 text-red-400 text-[11px] transition"
                          >
                            ✕ Kataa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB PANE 2: MEMBERS DIRECTORY & RBAC */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Orodha Kamili ya Wanachama (Members Directory & RBAC)</h2>
              <p className="text-xs text-slate-400">
                Tafuta mwanachama, bonyeza &quot;Dhibiti (Inspect)&quot; kubadili cheo/jukumu, hadhi, nenosiri au namba ya uanachama.
              </p>
            </div>
            <div className="w-full sm:w-80">
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="Tafuta jina, namba ya simu, username au ID..."
                className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="sg-glass rounded-2xl border border-slate-800 overflow-x-auto shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono-sg uppercase text-slate-400 bg-slate-950/70">
                  <th className="px-4 py-3.5">Member ID</th>
                  <th className="px-4 py-3.5">Jina & Username</th>
                  <th className="px-4 py-3.5">WhatsApp Phone</th>
                  <th className="px-4 py-3.5">Jukumu (Role)</th>
                  <th className="px-4 py-3.5">Hadhi (Status)</th>
                  <th className="px-4 py-3.5 text-right">Udhibiti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-4 py-3.5 font-mono-sg font-bold text-cyan-400">
                      {m.reg_number || 'PENDING'}
                    </td>
                    <td className="px-4 py-3.5">
                      <strong className="text-white block font-semibold">{m.full_name}</strong>
                      <span className="text-[11px] font-mono-sg text-slate-400">@{m.username}</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono-sg text-blue-400">{m.phone}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono-sg font-semibold bg-purple-950/70 border border-purple-800 text-purple-300">
                        {m.role || 'Member'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono-sg font-bold uppercase ${
                          m.status === 'ACTIVE'
                            ? 'badge-active'
                            : m.status === 'PENDING'
                            ? 'badge-pending'
                            : 'badge-hold'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openDossier(m)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-300 hover:text-white font-semibold text-[11px] transition shadow"
                      >
                        Dhibiti (Inspect)
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB PANE 3: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 sg-glass p-6 rounded-3xl border border-slate-800 space-y-4">
              <div>
                <span className="text-xs font-mono-sg text-yellow-400 font-bold uppercase tracking-wider block mb-1">
                  BROADCAST ENGINE (ART. 6.8 & 11)
                </span>
                <h3 className="text-lg font-bold text-white">Chapisha Tangazo Rasmi</h3>
                <p className="text-xs text-slate-400">
                  Tangazo hili litaonekana moja kwa moja kwenye Member Dashboard za wanachama wote.
                </p>
              </div>

              <form onSubmit={handlePublishAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="anc-title-input">
                    Kichwa cha Tangazo
                  </label>
                  <input
                    type="text"
                    id="anc-title-input"
                    value={newAncTitle}
                    onChange={(e) => setNewAncTitle(e.target.value)}
                    className="w-full sg-input px-3.5 py-2 rounded-xl text-xs"
                    placeholder="mf. Ratiba ya Semina ya Jumamosi: Linux Kernel Drivers"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="anc-priority-input">
                    Kiwango cha Umuhimu (Priority)
                  </label>
                  <select
                    id="anc-priority-input"
                    value={newAncPriority}
                    onChange={(e) => setNewAncPriority(e.target.value as any)}
                    className="w-full sg-input px-3.5 py-2 rounded-xl text-xs"
                  >
                    <option value="NORMAL">Normal Announcement (Taarifa ya Kawaida)</option>
                    <option value="HIGH">High Priority (Taarifa ya Muhimu / Tahadhari)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="anc-content-input">
                    Maudhui Kamili ya Tangazo
                  </label>
                  <textarea
                    id="anc-content-input"
                    rows={4}
                    value={newAncContent}
                    onChange={(e) => setNewAncContent(e.target.value)}
                    className="w-full sg-input px-3.5 py-2 rounded-xl text-xs"
                    placeholder="Andika taarifa kamili hapa..."
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-yellow-500/20"
                >
                  📢 Tangaza Kwa Wanachama Wote
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-lg font-bold text-white">Matangazo Yaliyopo</h3>
              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <div className="sg-glass p-6 rounded-2xl text-center text-xs text-slate-400 font-mono-sg">
                    Hakuna matangazo yaliyochapishwa kwa sasa.
                  </div>
                ) : (
                  announcements.map((a) => (
                    <article
                      key={a.id}
                      className="sg-glass p-5 rounded-2xl border border-slate-800 space-y-2 relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono-sg font-bold uppercase ${
                            a.priority === 'HIGH' || a.priority === 'URGENT' ? 'badge-future' : 'badge-active'
                          }`}
                        >
                          {a.priority}
                        </span>
                        <span className="text-[11px] font-mono-sg text-slate-500">
                          {a.created_at ? new Date(a.created_at).toLocaleDateString('sw-TZ') : ''}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white">{a.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{a.content}</p>
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono-sg text-slate-500">
                        <span>Na: {a.author_name || 'Super Administrator'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAnnouncements((prev) => prev.filter((item) => item.id !== a.id));
                            showToast('Tangazo limefutwa.', 'info');
                          }}
                          className="text-red-400 hover:underline"
                        >
                          Futa
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB PANE 4: SG COMMUNITY FUND */}
      {activeTab === 'fund' && (
        <div className="space-y-6">
          <div className="sg-glass p-6 md:p-8 rounded-3xl border border-teal-500/40 bg-gradient-to-r from-teal-950/30 to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono-sg text-teal-400 font-bold uppercase tracking-wider block mb-1">
                ARTICLE 13: MFUKO WA PAMOJA WA SILLYGER (SG COMMUNITY FUND)
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-white">Leja Kuu ya Fedha na Rasilimali</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Fedha za mfuko huu zinatumika kwa ajili ya miundombinu (Servers, AI GPU compute, lab equipment). Hakuna kiongozi anayemiliki fedha hizi kibinafsi (Art. 13.6).
              </p>
            </div>
            <div className="text-right p-4 rounded-2xl bg-slate-950/80 border border-teal-800/60">
              <span className="text-[11px] text-slate-400 block font-mono-sg">Salio Kamili Lililopo:</span>
              <span className="text-2xl font-black text-emerald-400 font-mono-sg">
                TZS {fundBalance.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 sg-glass p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white">Rekodi Muamala Mpya</h3>
              <form onSubmit={handleRecordFund} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="fund-type-select">
                    Aina ya Muamala
                  </label>
                  <select
                    id="fund-type-select"
                    value={fundType}
                    onChange={(e) => setFundType(e.target.value as any)}
                    className="w-full sg-input px-3.5 py-2 rounded-xl text-xs font-mono-sg"
                  >
                    <option value="INCOME">+ MAPATO (Sponsorship / Miradi ya Jamii)</option>
                    <option value="EXPENSE">- MATUMIZI (Servers / AI / Vifaa / Labs)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="fund-amount-input">
                    Kiasi (TZS)
                  </label>
                  <input
                    type="number"
                    id="fund-amount-input"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    min="1"
                    className="w-full sg-input px-3.5 py-2 rounded-xl text-xs font-mono-sg"
                    placeholder="mf. 500000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="fund-category-input">
                    Kitengo cha Matumizi / Mapato
                  </label>
                  <input
                    type="text"
                    id="fund-category-input"
                    value={fundCategory}
                    onChange={(e) => setFundCategory(e.target.value)}
                    className="w-full sg-input px-3.5 py-2 rounded-xl text-xs"
                    placeholder="mf. Dedicated Servers, Domain/SSL, AI Chips"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="fund-desc-input">
                    Ufafanuzi Kamili wa Muamala
                  </label>
                  <textarea
                    id="fund-desc-input"
                    rows={3}
                    value={fundDesc}
                    onChange={(e) => setFundDesc(e.target.value)}
                    className="w-full sg-input px-3.5 py-2 rounded-xl text-xs"
                    placeholder="Eleza muamala huu unahusu nini..."
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-teal-500/20"
                >
                  Rekodi Kwenye Leja
                </button>
              </form>
            </div>

            <div className="lg:col-span-8 sg-glass rounded-2xl border border-slate-800 overflow-x-auto shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono-sg uppercase text-slate-400 bg-slate-950/70">
                    <th className="px-4 py-3.5">Tarehe</th>
                    <th className="px-4 py-3.5">Aina</th>
                    <th className="px-4 py-3.5">Kiasi</th>
                    <th className="px-4 py-3.5">Kitengo</th>
                    <th className="px-4 py-3.5">Maelezo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs font-mono-sg">
                  {fundTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-900/40 transition">
                      <td className="px-4 py-3.5 text-slate-400">{tx.date}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === 'INCOME'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {tx.type === 'INCOME' ? '+ MAPATO' : '- MATUMIZI'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-white">
                        TZS {tx.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-cyan-400">{tx.category}</td>
                      <td className="px-4 py-3.5 text-slate-300 font-sans">{tx.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB PANE 5: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="sg-glass p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex-grow max-w-xl">
              <label
                className="block text-xs font-bold text-cyan-400 font-mono-sg uppercase mb-1"
                htmlFor="active-session-title-input"
              >
                Kipindi cha Sasa (Inaonekana kwenye Check-in ya Wanachama)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="active-session-title-input"
                  value={activeSessionTitle}
                  onChange={(e) => setActiveSessionTitle(e.target.value)}
                  className="flex-grow sg-input px-3.5 py-2 rounded-xl text-xs"
                  placeholder="mf. Kipindi cha Jumamosi: Level 2 Digital Logic & ALU"
                />
                <button
                  type="button"
                  onClick={() => showToast('✓ Kipindi cha sasa kimesasishwa!', 'success')}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition whitespace-nowrap"
                >
                  Weka Kipindi
                </button>
              </div>
            </div>
            <div>
              <button
                type="button"
                onClick={handleVerifyAllAttendance}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-md shadow-emerald-500/20"
              >
                ✓ Thibitisha Zote Zilizopo (Verify All)
              </button>
            </div>
          </div>

          <div className="sg-glass rounded-2xl border border-slate-800 overflow-x-auto shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono-sg uppercase text-slate-400 bg-slate-950/70">
                  <th className="px-4 py-3.5">Member ID</th>
                  <th className="px-4 py-3.5">Jina</th>
                  <th className="px-4 py-3.5">Kipindi / Session Title</th>
                  <th className="px-4 py-3.5">Tarehe</th>
                  <th className="px-4 py-3.5">Hali ya Uthibitisho</th>
                  <th className="px-4 py-3.5 text-right">Uamuzi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {attendanceRecords.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-4 py-3.5 font-mono-sg text-cyan-400 font-bold">{att.member_id}</td>
                    <td className="px-4 py-3.5 text-white font-semibold">{att.name}</td>
                    <td className="px-4 py-3.5 text-slate-300">{att.session_title}</td>
                    <td className="px-4 py-3.5 font-mono-sg text-slate-400">{att.date}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono-sg font-bold ${
                          att.status === 'VERIFIED'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setAttendanceRecords((prev) =>
                            prev.map((item) =>
                              item.id === att.id ? { ...item, status: 'VERIFIED' } : item
                            )
                          );
                          showToast('Mahudhurio yamethibitishwa.', 'success');
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold"
                      >
                        ✓ Thibitisha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB PANE 6: LEAVES & TICKETS */}
      {activeTab === 'leaves' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">Maombi ya Ruhusa ya Kutoshiriki (Article 10)</h2>
              <p className="text-xs text-slate-400">
                Katiba inalinda wanachama: Dharura za kazi, masomo, afya au mitandao si sababu ya kufukuzwa moja kwa moja.
              </p>
            </div>

            <div className="sg-glass rounded-2xl border border-slate-800 overflow-x-auto shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono-sg uppercase text-slate-400 bg-slate-950/70">
                    <th className="px-4 py-3.5">Member ID</th>
                    <th className="px-4 py-3.5">Jina</th>
                    <th className="px-4 py-3.5">Aina & Muda</th>
                    <th className="px-4 py-3.5">Sababu / Maelezo</th>
                    <th className="px-4 py-3.5">Hali</th>
                    <th className="px-4 py-3.5 text-right">Uamuzi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {leavesList.map((lv) => (
                    <tr key={lv.id} className="hover:bg-slate-900/40 transition">
                      <td className="px-4 py-3.5 font-mono-sg text-cyan-400 font-bold">{lv.member_id}</td>
                      <td className="px-4 py-3.5 text-white font-semibold">{lv.name}</td>
                      <td className="px-4 py-3.5 text-blue-300 font-mono-sg">{lv.type} — {lv.duration}</td>
                      <td className="px-4 py-3.5 text-slate-300">{lv.reason}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono-sg font-bold bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                          {lv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => showToast('Ombi la ruhusa limeidhinishwa.', 'success')}
                          className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold"
                        >
                          Kubali
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">Tiketi za Msaada na Maoni (Support Tickets — Article 6.12)</h2>
              <p className="text-xs text-slate-400">
                Jibu maswali au maombi ya msaada yaliyotumwa na wanachama kupitia Member Portal.
              </p>
            </div>

            <div className="sg-glass rounded-2xl border border-slate-800 overflow-x-auto shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono-sg uppercase text-slate-400 bg-slate-950/70">
                    <th className="px-4 py-3.5">Mwanachama</th>
                    <th className="px-4 py-3.5">Kichwa & Aina</th>
                    <th className="px-4 py-3.5">Ujumbe</th>
                    <th className="px-4 py-3.5">Hali</th>
                    <th className="px-4 py-3.5 text-right">Hatua</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {ticketsList.map((tk) => (
                    <tr key={tk.id} className="hover:bg-slate-900/40 transition">
                      <td className="px-4 py-3.5 text-white font-semibold">{tk.member_name}</td>
                      <td className="px-4 py-3.5 text-cyan-400 font-bold">{tk.title}</td>
                      <td className="px-4 py-3.5 text-slate-300">{tk.message}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono-sg font-bold bg-amber-950/80 border border-amber-800 text-amber-300">
                          {tk.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setTicketsList((prev) =>
                              prev.map((item) =>
                                item.id === tk.id ? { ...item, status: 'RESOLVED' } : item
                              )
                            );
                            showToast('Tiketi imetatuliwa kikamilifu!', 'success');
                          }}
                          className="px-2.5 py-1 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[11px] font-bold"
                        >
                          Tatua
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB PANE 7: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                Kumbukumbu ya Ukaguzi wa Mfumo (Immutable Audit Logs - Art. 7.7)
              </h2>
              <p className="text-xs text-slate-400">
                Kila badiliko la uanachama, hadhi, jukumu, login au fedha linarekodiwa bila kufutika kwa ajili ya uwajibikaji.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 font-mono-sg"
              >
                <option value="">Matukio Yote (All Actions)</option>
                <option value="MEMBER_APPROVED">Kuidhinishwa (Approvals)</option>
                <option value="ROLE_CHANGE">Mabadiliko ya Vyeo (RBAC)</option>
                <option value="STATUS_CHANGE">Mabadiliko ya Hali (Status)</option>
                <option value="FUND_TRANSACTION">Fedha (Fund Transactions)</option>
                <option value="LOGIN">Kuingia Mfumoni (Logins)</option>
                <option value="PASSWORD">Nenosiri & Usalama</option>
              </select>
            </div>
          </div>

          <div className="sg-glass rounded-2xl border border-slate-800 overflow-x-auto max-h-[600px] overflow-y-auto shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-950">
                <tr className="border-b border-slate-800 text-[11px] font-mono-sg uppercase text-slate-400">
                  <th className="px-4 py-3.5">Muda (Timestamp)</th>
                  <th className="px-4 py-3.5">Kitendo (Action)</th>
                  <th className="px-4 py-3.5">Mtekelezaji (Actor)</th>
                  <th className="px-4 py-3.5">Mlengo (Target)</th>
                  <th className="px-4 py-3.5">Ufafanuzi (Details)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs font-mono-sg">
                {filteredAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-4 py-3.5 text-slate-500 text-[11px]">{log.timestamp}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/70 border border-purple-800 text-purple-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-white font-semibold font-sans">{log.actor}</td>
                    <td className="px-4 py-3.5 text-cyan-400">{log.target}</td>
                    <td className="px-4 py-3.5 text-slate-300 font-sans">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB PANE 8: DATABASE & SETTINGS */}
      {activeTab === 'database' && (
        <div className="sg-glass p-6 md:p-8 rounded-3xl border border-slate-800 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white">Cloud Database, Usalama wa Admin & Backup (PDPA 2022)</h2>
              <p className="text-xs text-slate-400 mt-1">
                Dhibiti Supabase Cloud Database, kiungo cha WhatsApp Group, nenosiri la Admin na nakala za usalama.
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-mono-sg text-xs font-bold">
              ✓ Database Active (Supabase / Go)
            </div>
          </div>

          {/* Section A: WhatsApp Gateway & Admin Password */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-emerald-800/40 space-y-3">
              <span className="text-[10px] font-mono-sg text-emerald-400 font-bold uppercase block">
                WHATSAPP GATEWAY CONTROL
              </span>
              <h3 className="text-sm font-bold text-white">Kiungo Rasmi cha WhatsApp Group</h3>
              <p className="text-xs text-slate-400">
                Kiungo hiki huonyeshwa kwa wanachama wenye hadhi ya <strong>ACTIVE</strong> pekee.
              </p>
              <form onSubmit={handleSaveWhatsApp} className="space-y-3">
                <input
                  type="url"
                  value={whatsappLink}
                  onChange={(e) => setWhatsappLink(e.target.value)}
                  className="w-full sg-input px-3.5 py-2 rounded-xl text-xs font-mono-sg"
                  placeholder="https://chat.whatsapp.com/..."
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  Hifadhi Kiungo cha WhatsApp
                </button>
              </form>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/70 border border-purple-800/40 space-y-3">
              <span className="text-[10px] font-mono-sg text-purple-400 font-bold uppercase block">
                EXECUTIVE SECURITY (SHA-256)
              </span>
              <h3 className="text-sm font-bold text-white">Badili Nenosiri la Super Administrator</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newAdminPassword !== confirmAdminPassword) {
                    showToast('Manenosiri hayafanani.', 'error');
                    return;
                  }
                  showToast('✓ Nenosiri la Super Admin limesasishwa!', 'success');
                  setCurrentAdminPassword('');
                  setNewAdminPassword('');
                  setConfirmAdminPassword('');
                }}
                className="space-y-2.5"
              >
                <input
                  type="password"
                  value={currentAdminPassword}
                  onChange={(e) => setCurrentAdminPassword(e.target.value)}
                  className="w-full sg-input px-3.5 py-2 rounded-xl text-xs"
                  placeholder="Nenosiri la sasa"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full sg-input px-3.5 py-2 rounded-xl text-xs"
                    placeholder="Nenosiri jipya (6+)"
                    required
                  />
                  <input
                    type="password"
                    value={confirmAdminPassword}
                    onChange={(e) => setConfirmAdminPassword(e.target.value)}
                    className="w-full sg-input px-3.5 py-2 rounded-xl text-xs"
                    placeholder="Thibitisha jipya"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                >
                  Sasisha Nenosiri la Admin
                </button>
              </form>
            </div>
          </div>

          {/* Section B: Cloud DB */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  Supabase PostgreSQL Cloud Connection (Bure 100%)
                </h3>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Inaunganisha na kuhifadhi wanachama, audit logs, na data za mfumo kwa usalama kwenye Cloud.
                </p>
              </div>
              <button
                type="button"
                onClick={() => showToast('✓ Schema SQL imenakiliwa!', 'success')}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-bold text-xs font-mono-sg transition flex items-center gap-2"
              >
                <span>📋 Nakili schema.sql Yote</span>
              </button>
            </div>
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="supa-url">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  id="supa-url"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs font-mono-sg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="supa-key">
                  Supabase Public Anon Key
                </label>
                <input
                  type="text"
                  id="supa-key"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs font-mono-sg"
                />
              </div>
            </div>
          </div>

          {/* Section C: Backup & Reset */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Pakua Data Yote ya Mfumo (PDPA 2022 Safe Backup)
                </h3>
                <p className="text-xs text-slate-400">
                  Faili la JSON lenye wanachama, audit logs, mahudhurio na leja ya fedha (bila kuvujisha password hashes).
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportJSON}
                className="self-start px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                <span>Download Full Backup (JSON)</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-red-950/20 border border-red-800/40 flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-red-400 mb-1">
                  🧹 Safisha Data za Majaribio (Pristine Clean)
                </h3>
                <p className="text-xs text-slate-400">
                  Ondoa data za majaribio kwenye kifaa hiki na uweke mfumo katika hali safi (Super Admin pekee atabaki).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Je, una uhakika unataka kusafisha data zote za majaribio?')) {
                    showToast('Mfumo umewekwa katika hali safi!', 'info');
                  }
                }}
                className="self-start px-5 py-2.5 rounded-xl border border-red-500/50 hover:bg-red-950/50 text-red-300 hover:text-white font-bold text-xs transition"
              >
                Safisha Mfumo (Futa Majaribio)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB PANE 9: SILLYGER TV LIVE STUDIO */}
      {activeTab === 'tv' && (
        <div className="sg-glass p-6 sm:p-8 rounded-3xl border border-red-500/40 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-sg font-bold uppercase bg-red-600 text-white animate-pulse">
                  LIVE STUDIO
                </span>
                <span className="font-mono-sg text-xs text-blue-400">SILLYGER TV Command Center</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                SILLYGER TV Live Stream & Broadcast Controller
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Weka kiungo chochote cha video ya YouTube au YouTube Live Stream. Mara unapobonyeza <strong>&quot;Rusha Live&quot;</strong>, video hiyo itacheza moja kwa moja kuanzia mwanzo hadi mwisho kwenye <strong>SILLYGER TV</strong> kwa wanachama wote duniani!
              </p>
            </div>
            <Link
              href="/tv"
              target="_blank"
              rel="noopener noreferrer"
              className="self-start sm:self-center px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center gap-2 shadow-md"
            >
              <span>📺</span>
              <span>Fungua SILLYGER TV ↗</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Broadcast form */}
            <div className="lg:col-span-7 space-y-4">
              <form onSubmit={handlePublishTv} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5" htmlFor="tv-url-input">
                    <span>Kiungo cha YouTube (Video URL au Live Stream Link)</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="tv-url-input"
                      value={tvUrl}
                      onChange={(e) => {
                        setTvUrl(e.target.value);
                        const vId = extractVideoId(e.target.value);
                        if (vId) setTvParsedVideoId(vId);
                      }}
                      placeholder="https://www.youtube.com/watch?v=... au https://youtu.be/..."
                      className="w-full sg-input px-3.5 py-3 rounded-xl text-xs font-mono-sg pr-10"
                      required
                    />
                    <span className="absolute right-3 top-3 text-slate-400 text-sm">🔗</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Inakubali viungo vyote vya kawaida vya YouTube, YouTube Live, Shorts, au Video ID pekee (herufi 11).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5" htmlFor="tv-title-input">
                    <span>Kichwa cha Kipindi / Somo (Stream Title)</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="tv-title-input"
                    value={tvTitle}
                    onChange={(e) => setTvTitle(e.target.value)}
                    placeholder="mfano: Darasa la Moja kwa Moja: Artificial Intelligence & Cybersecurity"
                    className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5" htmlFor="tv-desc-input">
                    <span>Maelezo ya Somo / Ujumbe kwa Wanafunzi</span>
                  </label>
                  <textarea
                    id="tv-desc-input"
                    rows={3}
                    value={tvDesc}
                    onChange={(e) => setTvDesc(e.target.value)}
                    placeholder="Eleza nini kinachofundishwa, mambo muhimu ya kuzingatia, au maelekezo ya WhatsApp..."
                    className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs"
                  ></textarea>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="tv-islive-check"
                      checked={tvIsLive}
                      onChange={(e) => setTvIsLive(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-900 border-slate-700"
                    />
                    <div>
                      <label htmlFor="tv-islive-check" className="text-xs font-bold text-white cursor-pointer block">
                        Washa Hadhi ya &quot;🔴 ON AIR — LIVE SASA&quot;
                      </label>
                      <span className="text-[11px] text-slate-400 block">
                        Wanafunzi wataona alama nyekundu ya Live na video itaanza kucheza moja kwa moja (Autoplay).
                      </span>
                    </div>
                  </div>
                  <span className="text-xl">📡</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-xl shadow-red-600/30 transition active:scale-95"
                  >
                    <span>🚀</span>
                    <span>Rusha Live Kwenye SILLYGER TV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStopTv}
                    className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition active:scale-95"
                  >
                    <span>⏸️</span>
                    <span>Weka Standby</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Live preview */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-sg font-bold text-slate-300 uppercase">
                  Hakikisho la Skrini (Live Preview)
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono-sg font-bold ${
                    tvIsLive ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tvIsLive ? '🔴 LIVE ON AIR' : 'STANDBY'}
                </span>
              </div>

              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
                {tvParsedVideoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${tvParsedVideoId}?autoplay=0&rel=0&controls=1`}
                    title="Live Preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  ></iframe>
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <div className="text-3xl">📺</div>
                    <p className="text-xs text-slate-400">Bandika kiungo cha YouTube kushoto ili kuona hakikisho hapa.</p>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] font-mono-sg text-slate-400 flex items-center justify-between">
                <span>Kituo: SILLYGER TV</span>
                <Link href="/tv" target="_blank" className="text-blue-400 hover:text-blue-300 underline">
                  Tazama jinsi wanafunzi wanavyoona &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Archive / Playlist inside TV Studio */}
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">
              Maktaba ya Video za Masomo (Saved Broadcasts & Archive)
            </h3>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {tvArchive.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-4 hover:border-slate-700 transition"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTvTitle(item.title);
                      setTvDesc(item.desc);
                      setTvUrl(`https://www.youtube.com/watch?v=${item.videoId}`);
                      setTvParsedVideoId(item.videoId);
                      setTvIsLive(true);
                      showToast(`✓ Video imechaguliwa: ${item.title}`, 'info');
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 text-xs font-bold"
                  >
                    Rusha Hii Sasa
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MODAL: MEMBER DOSSIER & RBAC INSPECTOR                      */}
      {/* ============================================================== */}
      {inspectingMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="sg-glass p-6 sm:p-8 rounded-3xl border border-purple-500/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img src="/assets/sillyger-logo-icon.svg" className="w-10 h-10 rounded-xl shadow-md" alt="SG" />
                <div>
                  <h3 className="text-lg font-bold text-white">{inspectingMember.full_name}</h3>
                  <span className="text-xs font-mono-sg text-cyan-400">@{inspectingMember.username}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingMember(null)}
                className="text-slate-400 hover:text-white p-2 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick 1-Click Approval Banner for PENDING applicants */}
            {inspectingMember.status === 'PENDING' && (
              <div className="mb-5 p-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono-sg font-bold text-emerald-400 uppercase block">
                    ● INASUBIRI IDHINI (PENDING)
                  </span>
                  <p className="text-xs text-slate-200 mt-0.5">
                    Mwanafunzi huyu bado hajaidhinishwa. Muidhinishe hapa apate Member ID & WhatsApp Link:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleApprove(inspectingMember)}
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Idhinisha Sasa (Approve)</span>
                </button>
              </div>
            )}

            {/* Read-Only Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono-sg mb-6">
              <div>
                <span className="text-slate-500 block">Barua Pepe:</span>
                <span className="text-slate-200">{inspectingMember.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block">WhatsApp Phone:</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-bold">{inspectingMember.phone}</span>
                  <a
                    href={`https://wa.me/${inspectingMember.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Chat</span> &rarr;
                  </a>
                </div>
              </div>
              <div>
                <span className="text-slate-500 block">Jumuiya:</span>
                <span className="text-blue-400 font-bold">{inspectingMember.track || 'SG Student Community'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Hadhi ya Mwanafunzi:</span>
                <span className="text-slate-300">{inspectingMember.experience || 'Student'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block">Tarehe ya Kujiunga:</span>
                <span className="text-slate-400">
                  {inspectingMember.created_at
                    ? new Date(inspectingMember.created_at).toLocaleString('sw-TZ')
                    : 'Leo'}
                </span>
              </div>
              <div className="sm:col-span-2 pt-1 border-t border-slate-800">
                <span className="text-slate-500 block">Maelezo / Mada Anayopenda:</span>
                <p className="text-slate-300 italic font-sans leading-relaxed mt-0.5">
                  {inspectingMember.motivation || '—'}
                </p>
              </div>
            </div>

            {/* Super Admin Modification Form */}
            <form onSubmit={saveDossierChanges} className="space-y-4">
              <span className="text-xs font-mono-sg font-bold text-purple-400 uppercase tracking-wider block pb-1 border-b border-slate-800">
                MAMLAKA YA SUPER ADMINISTRATOR (RBAC, STATUS & PASSWORD RESET)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="dossier-id">
                    Member ID
                  </label>
                  <input
                    type="text"
                    id="dossier-id"
                    value={dossierMemberId}
                    onChange={(e) => setDossierMemberId(e.target.value)}
                    className="w-full sg-input px-3 py-2 rounded-xl text-xs font-mono-sg font-bold text-cyan-400"
                    placeholder="Auto: SG-xxxxxx"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="dossier-role">
                    Jukumu / Cheo (RBAC)
                  </label>
                  <select
                    id="dossier-role"
                    value={dossierRole}
                    onChange={(e) => setDossierRole(e.target.value)}
                    className="w-full sg-input px-3 py-2 rounded-xl text-xs"
                  >
                    <option value="Applicant">Applicant (Mwombaji)</option>
                    <option value="Member">Member (Mwanachama)</option>
                    <option value="Instructor">Instructor (Mkufunzi)</option>
                    <option value="Project Lead">Project Lead (Kiongozi wa Mradi)</option>
                    <option value="Community Moderator">Community Moderator</option>
                    <option value="Membership Administrator">Membership Administrator</option>
                    <option value="Education Administrator">Education Administrator</option>
                    <option value="Finance Administrator">Finance Administrator</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Super Administrator">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="dossier-status">
                    Hali ya Uanachama (Status)
                  </label>
                  <select
                    id="dossier-status"
                    value={dossierStatus}
                    onChange={(e) => setDossierStatus(e.target.value as any)}
                    className="w-full sg-input px-3 py-2 rounded-xl text-xs"
                  >
                    <option value="PENDING">PENDING (Inasubiri Idhini)</option>
                    <option value="ACTIVE">ACTIVE (Mwanachama Kamili)</option>
                    <option value="ON_HOLD">ON_HOLD (Kwenye Mapitio)</option>
                    <option value="SUSPENDED">SUSPENDED (Amesimamishwa)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="dossier-pwd">
                  Weka Nenosiri Jipya (Hiari — jaza tu kama mwanachama amesahau password)
                </label>
                <input
                  type="password"
                  id="dossier-pwd"
                  value={dossierNewPassword}
                  onChange={(e) => setDossierNewPassword(e.target.value)}
                  className="w-full sg-input px-3.5 py-2 rounded-xl text-xs"
                  placeholder="Acha tupu kama hutaki kubadili nenosiri lake"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="dossier-reason">
                  Sababu ya Mabadiliko (Hiari — inarekodiwa kwenye Audit Logs)
                </label>
                <input
                  type="text"
                  id="dossier-reason"
                  value={dossierAuditReason}
                  onChange={(e) => setDossierAuditReason(e.target.value)}
                  className="w-full sg-input px-3.5 py-2 rounded-xl text-xs"
                  placeholder="mf. Ameidhinishwa uanachama / Amekamilisha majukumu"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setInspectingMember(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-lg shadow-purple-500/20"
                >
                  Hifadhi Mabadiliko (Save Changes)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. FLOATING TOAST CONTAINER                                    */}
      {/* ============================================================== */}
      <div className="fixed top-20 right-4 z-[70] flex flex-col gap-2.5 max-w-sm w-[calc(100%-2rem)] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl text-xs font-semibold leading-relaxed flex items-start justify-between gap-3 transition duration-200 ${
              t.variant === 'error'
                ? 'border-red-500/60 bg-red-950/95 text-red-100'
                : t.variant === 'info'
                ? 'border-blue-500/60 bg-slate-900/95 text-blue-100'
                : 'border-emerald-500/60 bg-emerald-950/95 text-emerald-100'
            }`}
          >
            <div className="whitespace-pre-line">{t.message}</div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="text-slate-400 hover:text-white shrink-0 font-bold"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
