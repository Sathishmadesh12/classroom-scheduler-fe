import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const TIME_LABELS = {
  1: '8:00–9:00', 2: '9:00–10:00', 3: '10:15–11:15', 4: '11:15–12:15',
  5: '13:00–14:00', 6: '14:00–15:00', 7: '15:15–16:15', 8: '16:15–17:15',
};

// Subject color palette (cycles through)
const COLORS = [
  { bg: 'rgba(79,142,247,0.18)', border: '#4f8ef7', text: '#93c5fd' },
  { bg: 'rgba(124,58,237,0.18)', border: '#7c3aed', text: '#c4b5fd' },
  { bg: 'rgba(16,185,129,0.18)', border: '#10b981', text: '#6ee7b7' },
  { bg: 'rgba(245,158,11,0.18)', border: '#f59e0b', text: '#fcd34d' },
  { bg: 'rgba(239,68,68,0.18)', border: '#ef4444', text: '#fca5a5' },
  { bg: 'rgba(20,184,166,0.18)', border: '#14b8a6', text: '#5eead4' },
];

export default function MyTimetable() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTTIdx, setSelectedTTIdx] = useState(0);

  // Admin: browse by faculty
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');

  const isFaculty = user?.role === 'faculty';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      API.get('/users?role=faculty').then(res => {
        const faculties = (res.data.users || []).filter(u => u.role === 'faculty');
        setFacultyList(faculties);
      }).catch(() => {});
    }
  }, [isAdmin]);

  const fetchMyTimetable = () => {
    setLoading(true); setError('');
    API.get('/timetables/my-timetable')
      .then(res => { setData(res.data); setSelectedTTIdx(0); })
      .catch(() => setError('Could not load your timetable.'))
      .finally(() => setLoading(false));
  };

  const fetchFacultyTimetable = (facultyId) => {
    if (!facultyId) return;
    setLoading(true); setError('');
    API.get(`/timetables/faculty/${facultyId}`)
      .then(res => { setData(res.data); setSelectedTTIdx(0); })
      .catch(() => setError('Could not load timetable for selected faculty.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isFaculty) fetchMyTimetable();
  }, [isFaculty]);

  // Build subject→color map
  const subjectColorMap = {};
  const tt = data?.timetables?.[selectedTTIdx];
  if (tt) {
    const subjects = [...new Set(
      Object.values(tt.weekGrid).flatMap(daySlots =>
        Object.values(daySlots).filter(Boolean).map(s => s.subject?._id).filter(Boolean)
      )
    )];
    subjects.forEach((sid, i) => { subjectColorMap[sid] = COLORS[i % COLORS.length]; });
  }

  const getCell = (day, period) => tt?.weekGrid?.[day]?.[period] || null;

  return (
    <div>
      <div className="page-header">
        <h1>{isFaculty ? '📅 My Timetable' : '📅 Faculty Timetable Viewer'}</h1>
        <p>{isFaculty ? 'Your personal weekly schedule across all active timetables' : 'View any faculty\'s weekly schedule'}</p>
      </div>

      <div className="page-body">

        {/* Admin: Faculty Selector */}
        {isAdmin && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}>Select Faculty:</label>
              <select
                className="form-control"
                style={{ maxWidth: 320 }}
                value={selectedFacultyId}
                onChange={e => { setSelectedFacultyId(e.target.value); fetchFacultyTimetable(e.target.value); }}
              >
                <option value="">— Choose a faculty member —</option>
                {facultyList.map(f => (
                  <option key={f._id} value={f._id}>{f.name} ({f.department || 'N/A'})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {loading && (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p style={{ color: 'var(--text2)' }}>Loading timetable...</p>
          </div>
        )}

        {error && !loading && (
          <div className="alert alert-error">{error}</div>
        )}

        {!loading && !error && data && (
          <>
            {/* Summary Stats */}
            <div className="stat-grid" style={{ marginBottom: 20 }}>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(79,142,247,0.15)', color: 'var(--accent)' }}>📅</div>
                <div><div className="stat-value">{data.totalWeeklyPeriods}</div><div className="stat-label">Total Weekly Periods</div></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--accent2)' }}>📚</div>
                <div><div className="stat-value">{data.subjectSummary?.length || 0}</div><div className="stat-label">Subjects Assigned</div></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}>🗂️</div>
                <div><div className="stat-value">{data.timetables?.length || 0}</div><div className="stat-label">Active Timetables</div></div>
              </div>
            </div>

            {data.timetables?.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="icon">📭</div>
                  <p>No active timetable assigned yet.</p>
                  <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>Ask admin to generate a timetable with your subjects.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Timetable Tabs (if multiple) */}
                {data.timetables.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    {data.timetables.map((t, i) => (
                      <button
                        key={t.timetableId}
                        className={`btn ${selectedTTIdx === i ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                        onClick={() => setSelectedTTIdx(i)}
                      >
                        {t.department} — Sem {t.semester} {t.section}
                      </button>
                    ))}
                  </div>
                )}

                {/* Week Grid */}
                {tt && (
                  <div className="card" style={{ overflowX: 'auto' }}>
                    <div className="section-header" style={{ marginBottom: 20 }}>
                      <div>
                        <h3>📅 {tt.department} — Semester {tt.semester} · Section {tt.section}</h3>
                        <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>
                          Academic Year: {tt.academicYear} &nbsp;·&nbsp; {tt.totalSlotsPerWeek} periods/week
                        </p>
                      </div>
                    </div>

                    <table className="tt-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 4 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 90, textAlign: 'left', padding: '8px 12px', color: 'var(--text3)', fontSize: 12 }}>Day</th>
                          {PERIODS.map(p => (
                            <th key={p} style={{ padding: '8px 6px', textAlign: 'center', fontSize: 11, color: 'var(--text3)', minWidth: 105 }}>
                              <span style={{ fontWeight: 700, color: 'var(--text2)' }}>P{p}</span>
                              <br />
                              <span style={{ fontWeight: 400, fontSize: 10 }}>{TIME_LABELS[p]}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DAYS.map(day => (
                          <tr key={day}>
                            <td style={{
                              padding: '10px 12px', fontWeight: 700, fontSize: 13,
                              color: 'var(--accent)', background: 'var(--bg2)',
                              borderRadius: 8, verticalAlign: 'middle'
                            }}>
                              {day.slice(0, 3).toUpperCase()}
                            </td>
                            {PERIODS.map(period => {
                              const cell = getCell(day, period);
                              const color = cell?.subject?._id ? subjectColorMap[cell.subject._id] : null;
                              return (
                                <td key={period} style={{ padding: 3, verticalAlign: 'top' }}>
                                  {cell ? (
                                    <div style={{
                                      background: color?.bg || 'rgba(79,142,247,0.12)',
                                      border: `1px solid ${color?.border || 'var(--border)'}`,
                                      borderRadius: 8,
                                      padding: '8px 10px',
                                      fontSize: 12,
                                      minHeight: 72,
                                    }}>
                                      <div style={{ fontWeight: 700, color: color?.text || 'var(--text)', marginBottom: 4, fontSize: 13 }}>
                                        {cell.subject?.code || cell.subject?.name || '—'}
                                      </div>
                                      <div style={{ color: 'var(--text2)', fontSize: 11 }}>
                                        {cell.subject?.name && cell.subject?.code ? cell.subject.name : ''}
                                      </div>
                                      <div style={{ color: 'var(--text3)', fontSize: 11, marginTop: 4 }}>
                                        🏫 {cell.classroom?.roomNumber || cell.classroom?.name || '—'}
                                      </div>
                                      <div style={{ color: 'var(--text3)', fontSize: 10, marginTop: 2 }}>
                                        {cell.startTime} – {cell.endTime}
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{
                                      minHeight: 72, background: 'var(--bg2)',
                                      borderRadius: 8, display: 'flex',
                                      alignItems: 'center', justifyContent: 'center',
                                      color: 'var(--text3)', fontSize: 18
                                    }}>·</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Legend */}
                    {data.subjectSummary?.length > 0 && (
                      <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {data.subjectSummary.map((sub, i) => {
                          const color = COLORS[i % COLORS.length];
                          return (
                            <div key={sub._id} style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '4px 10px', borderRadius: 20,
                              background: color.bg, border: `1px solid ${color.border}`,
                              fontSize: 12, color: color.text
                            }}>
                              <span style={{ fontWeight: 700 }}>{sub.code}</span>
                              <span style={{ color: 'var(--text3)' }}>·</span>
                              <span>{sub.name}</span>
                              <span style={{ marginLeft: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '1px 6px', fontSize: 10 }}>
                                {sub.periodsPerWeek}×/wk
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!loading && !error && !data && isAdmin && !selectedFacultyId && (
          <div className="card">
            <div className="empty-state">
              <div className="icon">👆</div>
              <p>Select a faculty member above to view their timetable.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
