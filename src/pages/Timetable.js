import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { useConfirm } from '../components/ConfirmDialog';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const TIME_LABELS = { 1: '8-9', 2: '9-10', 3: '10:15-11:15', 4: '11:15-12:15', 5: '13-14', 6: '14-15', 7: '15:15-16:15', 8: '16:15-17:15' };

export default function Timetable() {
  const { confirm, ConfirmDialogUI } = useConfirm();
  const [timetables, setTimetables] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genForm, setGenForm] = useState({ department: '', semester: '1', section: 'A', academicYear: '2024-25' });
  const [genError, setGenError] = useState('');
  const [genSuccess, setGenSuccess] = useState('');

  const fetchTimetables = () => {
    setLoading(true);
    API.get('/timetables').then(res => { setTimetables(res.data.timetables); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchTimetables(); }, []);

  const handleGenerate = async (e) => {
    e.preventDefault(); setGenerating(true); setGenError(''); setGenSuccess('');
    try {
      const res = await API.post('/timetables/generate', { ...genForm, semester: Number(genForm.semester) });
      setGenSuccess(res.data.message);
      fetchTimetables();
      setTimeout(() => { setShowGenModal(false); setGenSuccess(''); }, 1500);
    } catch (err) {
      setGenError(err.response?.data?.message || 'Generation failed');
    } finally { setGenerating(false); }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete Timetable?',
      message: 'This timetable and all its slots will be permanently removed.',
      icon: '🗓️',
      confirmText: 'Yes, Delete',
      confirmColor: '#ef4444',
    });
    if (!ok) return;
    await API.delete(`/timetables/${id}`);
    if (selected?._id === id) setSelected(null);
    fetchTimetables();
  };

  const handleView = async (tt) => {
    const res = await API.get(`/timetables/${tt._id}`);
    setSelected(res.data.timetable);
  };

  const getSlot = (day, period) => {
    if (!selected) return null;
    return selected.slots.find(s => s.day === day && s.period === period);
  };

  return (
    <div>
      {ConfirmDialogUI}
      <div className="page-header">
        <h1>Timetable Management</h1>
        <p>Generate and view class schedules</p>
      </div>
      <div className="page-body">

        {/* List */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-header">
            <h3>Timetables ({timetables.length})</h3>
            <button className="btn btn-success" onClick={() => { setShowGenModal(true); setGenError(''); setGenSuccess(''); }}>⚡ Generate Timetable</button>
          </div>
          {loading ? <div className="loading">Loading...</div> : (
            timetables.length === 0 ? (
              <div className="empty-state"><div className="icon">🗓️</div><p>No timetables yet. Generate your first one!</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Department</th><th>Semester</th><th>Section</th><th>Academic Year</th><th>Slots</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {timetables.map(tt => (
                      <tr key={tt._id} style={{ cursor: 'pointer' }}>
                        <td><strong>{tt.department}</strong></td>
                        <td>Sem {tt.semester}</td>
                        <td>Section {tt.section}</td>
                        <td>{tt.academicYear}</td>
                        <td>{tt.slots.length} periods</td>
                        <td><span className={`badge ${tt.isActive ? 'badge-green' : 'badge-red'}`}>{tt.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleView(tt)}>👁️ View</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(tt._id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Timetable Grid View */}
        {selected && (
          <div className="card">
            <div className="section-header" style={{ marginBottom: 20 }}>
              <div>
                <h3>📅 {selected.department} — Sem {selected.semester} Section {selected.section}</h3>
                <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>Academic Year: {selected.academicYear}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕ Close</button>
            </div>
            <div className="tt-grid">
              <table className="tt-table">
                <thead>
                  <tr>
                    <th>Day / Period</th>
                    {PERIODS.map(p => (
                      <th key={p}>P{p}<br /><span style={{ fontWeight: 400, fontSize: 10 }}>{TIME_LABELS[p]}</span></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map(day => (
                    <tr key={day}>
                      <th style={{ textAlign: 'left', background: 'var(--bg2)', padding: '10px 12px' }}>{day}</th>
                      {PERIODS.map(period => {
                        const slot = getSlot(day, period);
                        return (
                          <td key={period} style={{ verticalAlign: 'top', minWidth: 110 }}>
                            {slot ? (
                              <div className="tt-cell">
                                <div className="tt-subject">{slot.subject?.code || slot.subject?.name}</div>
                                <div className="tt-faculty">👨‍🏫 {slot.faculty?.name?.split(' ')[0]}</div>
                                <div className="tt-room">🏫 {slot.classroom?.roomNumber}</div>
                              </div>
                            ) : (
                              <div className="tt-empty">—</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {showGenModal && (
        <div className="modal-overlay" onClick={() => setShowGenModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚡ Generate Timetable</h3>
              <button className="modal-close" onClick={() => setShowGenModal(false)}>✕</button>
            </div>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>Make sure subjects are added with faculty assigned before generating.</p>
            {genError && <div className="alert alert-error">{genError}</div>}
            {genSuccess && <div className="alert alert-success">✅ {genSuccess}</div>}
            <form onSubmit={handleGenerate}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <input className="form-control" value={genForm.department} onChange={e => setGenForm({ ...genForm, department: e.target.value })} placeholder="e.g. Computer Science" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Semester *</label>
                  <select className="form-control" value={genForm.semester} onChange={e => setGenForm({ ...genForm, semester: e.target.value })}>
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <input className="form-control" value={genForm.section} onChange={e => setGenForm({ ...genForm, section: e.target.value })} placeholder="A" />
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <input className="form-control" value={genForm.academicYear} onChange={e => setGenForm({ ...genForm, academicYear: e.target.value })} placeholder="2024-25" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowGenModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={generating}>{generating ? '⚡ Generating...' : '⚡ Generate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
