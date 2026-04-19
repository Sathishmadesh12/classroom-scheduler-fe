import React, { useEffect, useState } from 'react';
import API from '../utils/api';

const Icon = {
  People: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>),
  School: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>),
  MeetingRoom: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17 11h-1.5V9H14v2h-1.5v1.5H14V15h1.5v-2.5H17V11zM3 3v18h18V3H3zm16 16H5V5h14v14z"/></svg>),
  Book: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>),
  Calendar: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>),
  PersonAdd: () => (<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>),
  AutoSchedule: () => (<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 8h-8v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1z"/></svg>),
  AddHome: () => (<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 3L2 12h3v8h6v-5h2v5h6v-8h3L12 3zm5 15h-2v-5H9v5H7v-7.81l5-4.5 5 4.5V18zm-4-7h2v2h-2v2h-2v-2H9v-2h2V9h2v2z"/></svg>),
  LibraryAdd: () => (<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/></svg>),
};

export default function Dashboard({ setActivePage }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard/stats').then(res => { setStats(res.data.stats); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Faculty',     value: stats?.totalFaculty ?? 0,    Ic: Icon.People,      color: '#4f8ef7', bg: 'rgba(79,142,247,0.15)' },
    { label: 'Total Students',    value: stats?.totalStudents ?? 0,    Ic: Icon.School,      color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { label: 'Classrooms',        value: stats?.totalClassrooms ?? 0,  Ic: Icon.MeetingRoom, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    { label: 'Subjects',          value: stats?.totalSubjects ?? 0,    Ic: Icon.Book,        color: '#a78bfa', bg: 'rgba(124,58,237,0.15)' },
    { label: 'Active Timetables', value: stats?.totalTimetables ?? 0,  Ic: Icon.Calendar,    color: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
  ];

  const actions = [
    { label: 'Add Faculty',         desc: 'Register new faculty member', Ic: Icon.PersonAdd,    color: '#4f8ef7', bg: 'rgba(79,142,247,0.10)',  hov: 'rgba(79,142,247,0.18)',  border: 'rgba(79,142,247,0.25)',  page: 'faculty' },
    { label: 'Generate Timetable',  desc: 'Auto-schedule classes',       Ic: Icon.AutoSchedule, color: '#10b981', bg: 'rgba(16,185,129,0.10)',  hov: 'rgba(16,185,129,0.18)',  border: 'rgba(16,185,129,0.25)',  page: 'timetable' },
    { label: 'Add Classroom',       desc: 'Register a new room',         Ic: Icon.AddHome,      color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  hov: 'rgba(245,158,11,0.18)',  border: 'rgba(245,158,11,0.25)',  page: 'classrooms' },
    { label: 'Add Subject',         desc: 'Create a new subject',        Ic: Icon.LibraryAdd,   color: '#a78bfa', bg: 'rgba(124,58,237,0.10)',  hov: 'rgba(124,58,237,0.18)',  border: 'rgba(124,58,237,0.25)', page: 'subjects' },
  ];

  return (
    <div>
      {/* Hero header with classroom background */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '48px 32px 40px', minHeight: 190 }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1400&q=80')`,
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          filter: 'brightness(0.20) saturate(0.6)', zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(10,14,26,0.55) 0%, rgba(79,142,247,0.07) 60%, rgba(124,58,237,0.10) 100%)',
          zIndex: 1,
        }} />
        <div style={{ position: 'absolute', top: -50, right: 60, width: 220, height: 220, background: 'radial-gradient(circle, rgba(79,142,247,0.16) 0%, transparent 70%)', zIndex: 1, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 220, width: 180, height: 180, background: 'radial-gradient(circle, rgba(124,58,237,0.13) 0%, transparent 70%)', zIndex: 1, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 6, color: '#e2e8f0' }}>Dashboard</h1>
          <p style={{ color: '#94a3b8', fontSize: 15 }}>Welcome back! Here's an overview of your institution.</p>
        </div>
      </div>

      <div className="page-body" style={{ paddingTop: 24 }}>
        {loading ? <div className="loading">Loading stats...</div> : (
          <>
            {/* Stat cards */}
            <div className="stat-grid" style={{ marginBottom: 28 }}>
              {statCards.map(c => (
                <div key={c.label} className="stat-card">
                  <div className="stat-icon" style={{ background: c.bg, color: c.color }}><c.Ic /></div>
                  <div>
                    <div className="stat-label">{c.label}</div>
                    <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 style={{ marginBottom: 20, fontSize: 17, fontWeight: 700 }}>Quick Actions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                {actions.map(a => <ActionCard key={a.label} a={a} onClick={() => setActivePage(a.page)} />)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ActionCard({ a, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        padding: '20px 20px 18px',
        background: hov ? a.hov : a.bg,
        border: `1px solid ${hov ? a.color + '55' : a.border}`,
        borderRadius: 14, cursor: 'pointer', textAlign: 'left', width: '100%',
        transition: 'all 0.2s ease',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? `0 8px 28px ${a.color}22` : 'none',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${a.color}22`, color: a.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
        boxShadow: hov ? `0 4px 14px ${a.color}33` : 'none',
        transition: 'box-shadow 0.2s',
      }}>
        <a.Ic />
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 5 }}>{a.label}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.4 }}>{a.desc}</div>
    </button>
  );
}
