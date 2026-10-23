// campus-connect/frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import {
  FilePlus2, Search, ShieldCheck, BookOpen, RotateCcw,
  CheckCircle2, PlayCircle, User, LogIn, LogOut
} from 'lucide-react';
import StudentReportView from './components/StudentReportView';
import StudentTrackerView from './components/StudentTrackerView';
import StaffDashboardView from './components/StaffDashboardView';
import RoutingGuideModal from './components/RoutingGuideModal';
import DuplicateReviewModal from './components/DuplicateReviewModal';
import LoginModal from './components/LoginModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'track' | 'staff'
  const [config, setConfig] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedTicketNumber, setSelectedTicketNumber] = useState('CC-2026-1041');

  // Auth state (Student or Admin)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cc_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loginModalConfig, setLoginModalConfig] = useState({ open: false, role: 'student' });

  const [isRoutingGuideOpen, setIsRoutingGuideOpen] = useState(false);
  const [duplicateModalTicket, setDuplicateModalTicket] = useState(null);
  const [externalDraft, setExternalDraft] = useState(null);
  const [demoStep, setDemoStep] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAllData = async () => {
    try {
      const [cfgRes, tckRes, anaRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/tickets'),
        fetch('/api/analytics')
      ]);
      if (cfgRes.ok) setConfig(await cfgRes.json());
      if (tckRes.ok) {
        const tData = await tckRes.json();
        setTickets(tData.tickets || []);
      }
      if (anaRes.ok) setAnalytics(await anaRes.json());
    } catch (_) {
      // ignore initial error
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    localStorage.setItem('cc_user', JSON.stringify(user));
    localStorage.setItem('cc_token', token);
    if (user.role === 'admin') {
      setActiveTab('staff');
      showToast(`Signed in as Admin: ${user.name}`, 'success');
    } else {
      setActiveTab('report');
      showToast(`Signed in as Student: ${user.name} (${user.roll_number})`, 'success');
    }
  };

  const handleQuickRoleLogin = async (role) => {
    const email = role === 'admin' ? 'admin@equinox.edu' : 'student@equinox.edu';
    const password = role === 'admin' ? 'admin123' : 'student123';
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        handleLoginSuccess(data.user, data.token);
      }
    } catch (_) {
      // fallback
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('cc_user');
    localStorage.removeItem('cc_token');
    if (activeTab === 'staff') setActiveTab('report');
    showToast('Signed out successfully.', 'success');
  };

  const handleTicketCreated = async (newTicket) => {
    await loadAllData();
    setSelectedTicketNumber(newTicket.ticket_number);
    setActiveTab('track');
    if (newTicket.status === 'Needs Info') {
      showToast(`Ticket #${newTicket.ticket_number} submitted. Please supply the missing details below.`, 'warning');
    } else if (newTicket.is_duplicate_flagged) {
      showToast(`Ticket #${newTicket.ticket_number} created and flagged as a potential duplicate for staff review.`, 'warning');
    } else {
      showToast(`Ticket #${newTicket.ticket_number} created and routed to ${newTicket.department}.`, 'success');
    }
  };

  const handleSupplyMissingInfo = async (ticketNumber, payload) => {
    const res = await fetch(`/api/tickets/${encodeURIComponent(ticketNumber)}/supply-info`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      await loadAllData();
      setSelectedTicketNumber(data.ticket.ticket_number);
      showToast(`Missing details added! Ticket #${data.ticket.ticket_number} routed to ${data.ticket.department}.`, 'success');
      return data.ticket;
    }
  };

  const handleUpvoteExisting = async (ticketNumber, studentName) => {
    const res = await fetch(`/api/tickets/${encodeURIComponent(ticketNumber)}/upvote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_name: studentName || currentUser?.name || 'Campus Student',
        note: 'Student confirmed experiencing the same issue.'
      })
    });
    if (res.ok) {
      await loadAllData();
      setSelectedTicketNumber(ticketNumber);
      setActiveTab('track');
      showToast(`Linked to existing ticket #${ticketNumber}.`, 'success');
    }
  };

  const handleStaffUpdateTicket = async (ticketNumber, updates) => {
    const res = await fetch(`/api/tickets/${encodeURIComponent(ticketNumber)}/staff-update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...updates,
        staff_actor: currentUser?.role === 'admin' ? `${currentUser.name} (Admin)` : 'Campus Facilities Dispatcher'
      })
    });
    if (res.ok) {
      await loadAllData();
      showToast(`Ticket #${ticketNumber} updated (${updates.status || 'Assigned'}).`, 'success');
    }
  };

  const handleMergeDuplicate = async (flaggedNum, primaryNum, staffNote) => {
    const res = await fetch(`/api/tickets/${encodeURIComponent(flaggedNum)}/duplicate-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'merge',
        target_ticket_number: primaryNum,
        staff_note: staffNote
      })
    });
    if (res.ok) {
      await loadAllData();
      showToast(`Merged #${flaggedNum} into primary ticket #${primaryNum}.`, 'success');
    }
  };

  const handleDismissDuplicate = async (flaggedNum, staffNote) => {
    const res = await fetch(`/api/tickets/${encodeURIComponent(flaggedNum)}/duplicate-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'dismiss',
        staff_note: staffNote
      })
    });
    if (res.ok) {
      await loadAllData();
      showToast(`Duplicate flag dismissed for #${flaggedNum}.`, 'success');
    }
  };

  const handleResetDemo = async () => {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    if (res.ok) {
      await loadAllData();
      setSelectedTicketNumber('CC-2026-1041');
      setDemoStep(0);
      showToast('Demo data reset.', 'success');
    }
  };

  const runGuidedDemoStep = async (stepNumber) => {
    setDemoStep(stepNumber);

    if (stepNumber === 1) {
      if (!currentUser || currentUser.role !== 'student') {
        await handleQuickRoleLogin('student');
      }
      setActiveTab('report');
      setExternalDraft({
        complaintText: 'Water is leaking really fast from the pipe under the washbasin and flooding the floor!',
        building: 'Hostel Block B (Bhaskara Hall)',
        specificLocation: '',
        additionalDetails: '',
        photoPresetKey: '',
        autoAnalyze: true
      });
      showToast('Step 1: Incomplete complaint analysed — AI is requesting missing location details.', 'warning');
    } else if (stepNumber === 2) {
      setActiveTab('report');
      setExternalDraft({
        complaintText: 'Water is leaking really fast from the pipe under the washbasin and flooding the floor!',
        building: 'Hostel Block B (Bhaskara Hall)',
        specificLocation: '2nd Floor, North Wing Washroom (Sink #2)',
        additionalDetails: 'Under-sink angle valve ruptured — water pooling on tiles',
        photoPresetKey: 'plumbing_leak',
        autoAnalyze: true
      });
      showToast('Step 2: Missing details & photo supplied — AI completed triage and detected a duplicate.', 'success');
    } else if (stepNumber === 3) {
      if (!currentUser || currentUser.role !== 'admin') {
        await handleQuickRoleLogin('admin');
      }
      setActiveTab('staff');
      const flagged = tickets.find(t => t.is_duplicate_flagged && !t.merged_into) || tickets[1];
      if (flagged) {
        setDuplicateModalTicket(flagged);
      }
      showToast('Step 3: Signed in as Admin — Reviewing flagged duplicate on Staff Dashboard.', 'warning');
    } else if (stepNumber === 4) {
      if (!currentUser || currentUser.role !== 'admin') {
        await handleQuickRoleLogin('admin');
      }
      const targetNum = selectedTicketNumber || 'CC-2026-1041';
      await handleStaffUpdateTicket(targetNum, {
        status: 'In Progress',
        assigned_technician: 'Ramesh Kumar (Senior Master Plumber)',
        technician_phone: '+91 98110-44101',
        staff_note: 'Isolation valve shut off; replacing ruptured 15mm angle valve.'
      });
      await handleStaffUpdateTicket(targetNum, {
        status: 'Resolved',
        assigned_technician: 'Ramesh Kumar (Senior Master Plumber)',
        technician_phone: '+91 98110-44101',
        staff_note: 'Replaced 15mm brass angle valve, verified zero leaks, and cleaned floor.'
      });
      setSelectedTicketNumber(targetNum);
      setActiveTab('track');
      showToast(`Step 4: Ticket #${targetNum} resolved! Viewing full student progress history.`, 'success');
    }
  };

  const flaggedDuplicatesCount = tickets.filter(t => t.is_duplicate_flagged && !t.merged_into).length;
  const primaryForModal = duplicateModalTicket
    ? tickets.find(t => t.ticket_number === duplicateModalTicket.duplicate_of_ticket)
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Simple Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg border text-xs font-medium flex items-center gap-2 ${
              toast.type === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* SIMPLE CLEAN HEADER WITH STUDENT & ADMIN LOGIN */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              CC
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 leading-none">
                CampusConnect
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {config?.campus?.name || 'Equinox Main Campus'} • AI Maintenance System
              </div>
            </div>
          </div>

          {/* 3 Main Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'report'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              Submit Complaint
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('track')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'track'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Track Ticket ({selectedTicketNumber})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'staff'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin / Staff Dashboard
              {flaggedDuplicatesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold">
                  {flaggedDuplicatesCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Actions: Student Login / Admin Login / User Status */}
          <div className="flex flex-wrap items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    currentUser.role === 'admin'
                      ? 'bg-slate-900 text-white'
                      : 'bg-sky-100 text-sky-800'
                  }`}
                >
                  {currentUser.role === 'admin' ? 'Admin' : 'Student'}
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {currentUser.name}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setLoginModalConfig({
                      open: true,
                      role: currentUser.role === 'admin' ? 'student' : 'admin'
                    })
                  }
                  className="text-[11px] text-sky-700 hover:underline font-medium ml-1"
                >
                  Switch
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1 text-slate-500 hover:text-rose-600 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLoginModalConfig({ open: true, role: 'student' })}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-300 flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  Student Login
                </button>
                <button
                  type="button"
                  onClick={() => setLoginModalConfig({ open: true, role: 'admin' })}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Admin Login
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsRoutingGuideOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Routing Guide
            </button>
            <button
              type="button"
              onClick={handleResetDemo}
              title="Reset Demo Data"
              className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Simple Demo Flow Bar */}
        <div className="bg-slate-100/80 border-t border-slate-200 px-4 py-2">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
              <PlayCircle className="w-3.5 h-3.5 text-slate-700" />
              Quick Demo Steps:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { step: 1, label: '1. Incomplete Complaint' },
                { step: 2, label: '2. Supply Missing Info' },
                { step: 3, label: '3. Review Duplicate' },
                { step: 4, label: '4. Resolve & Track' }
              ].map(item => (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => runGuidedDemoStep(item.step)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                    demoStep === item.step
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {activeTab === 'report' && (
          <StudentReportView
            currentUser={currentUser}
            onOpenStudentLogin={() => setLoginModalConfig({ open: true, role: 'student' })}
            campus={config?.campus}
            samplePhotos={config?.sample_photos}
            onTicketCreated={handleTicketCreated}
            onUpvoteExisting={handleUpvoteExisting}
            externalDraft={externalDraft}
            clearExternalDraft={() => setExternalDraft(null)}
          />
        )}

        {activeTab === 'track' && (
          <StudentTrackerView
            tickets={tickets}
            selectedTicketNumber={selectedTicketNumber}
            onSelectTicket={(tNum) => setSelectedTicketNumber(tNum)}
            onSupplyMissingInfo={handleSupplyMissingInfo}
          />
        )}

        {activeTab === 'staff' && (
          currentUser?.role === 'admin' ? (
            <StaffDashboardView
              tickets={tickets}
              analytics={analytics}
              routingGuide={config?.routing_guide}
              onStaffUpdateTicket={handleStaffUpdateTicket}
              onOpenDuplicateModal={(t) => setDuplicateModalTicket(t)}
              onViewInStudentTracker={(tNum) => {
                setSelectedTicketNumber(tNum);
                setActiveTab('track');
              }}
            />
          ) : (
            <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center space-y-4 my-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900">Admin / Staff Login Required</h2>
                <p className="text-xs text-slate-500">
                  Please sign in with an Admin / Staff account to assign technicians, update ticket statuses, and merge duplicate reports.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('admin')}
                  className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  1-Click Demo Admin Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setLoginModalConfig({ open: true, role: 'admin' })}
                  className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In with Credentials
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Modals */}
      <LoginModal
        isOpen={loginModalConfig.open}
        initialRole={loginModalConfig.role}
        onClose={() => setLoginModalConfig(prev => ({ ...prev, open: false }))}
        onLoginSuccess={handleLoginSuccess}
      />

      <RoutingGuideModal
        isOpen={isRoutingGuideOpen}
        onClose={() => setIsRoutingGuideOpen(false)}
        campus={config?.campus}
        routingGuide={config?.routing_guide}
      />

      <DuplicateReviewModal
        isOpen={Boolean(duplicateModalTicket)}
        onClose={() => setDuplicateModalTicket(null)}
        flaggedTicket={duplicateModalTicket}
        primaryTicket={primaryForModal}
        onMerge={handleMergeDuplicate}
        onDismiss={handleDismissDuplicate}
      />
    </div>
  );
}
