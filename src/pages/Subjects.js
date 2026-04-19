import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { useConfirm } from '../components/ConfirmDialog';

const emptyForm = { name: '', code: '', department: '', semester: '1', credits: '3', hoursPerWeek: '3', type: 'theory', faculty: '' };

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { confirm, ConfirmDialogUI } = useConfirm();

  const fetchAll = () => {
    setLoading(true);
    Promise.all([API.get('/subjects'), API.get('/users?role=faculty')]).then(([s, f]) => {
      setSubjects(s.data.subjects); setFaculty(f.data.users); setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setError(''); setShowModal(true); };
  const openEdit = (s) => {
    setForm({ name: s.name, code: s.code, department: s.department, semester: String(s.semester), credits: String(s.credits), hoursPerWeek: String(s.hoursPerWeek), type: s.type, faculty: s.faculty?._id || '' });
    setEditId(s._id); setError(''); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, semester: Number(form.semester), credits: Number(form.credits), hoursPerWeek: Number(form.hoursPerWeek) };
      if (!payload.faculty) delete payload.faculty;
      if (editId) await API.put(`/subjects/${editId}`, payload);
      else await API.post('/subjects', payload);
      setShowModal(false); fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm({
      title: 'Delete Subject?',
      message: `"${name}" will be permanently deleted. Associated timetable slots will also be affected.`,
      icon: '📚',
      confirmText: 'Yes, Delete',
      confirmColor: '#ef4444',
    });
    if (!ok) return;
    await API.delete(`/subjects/${id}`);
    fetchAll();
  };

  const typeColors = { theory: 'badge-blue', lab: 'badge-yellow', elective: 'badge-purple' };

  return (
    <div>
      {ConfirmDialogUI}
      <div className="page-header">
        <h1>Subject Management</h1>
        <p>Manage subjects, assign faculty, and set weekly hours</p>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="section-header">
            <h3>All Subjects ({subjects.length})</h3>
            <button className="btn btn-primary" onClick={openAdd}>+ Add Subject</button>
          </div>
          {loading ? <div className="loading">Loading...</div> : subjects.length === 0 ? (
            <div className="empty-state"><div className="icon">📚</div><p>No subjects found. Add your first subject.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Subject</th><th>Code</th><th>Dept</th><th>Sem</th><th>Type</th><th>Hours/Week</th><th>Faculty</th><th>Actions</th></tr></thead>
                <tbody>
                  {subjects.map(s => (
                    <tr key={s._id}>
                      <td><strong>{s.name}</strong></td>
                      <td><span className="badge badge-blue">{s.code}</span></td>
                      <td>{s.department}</td>
                      <td>Sem {s.semester}</td>
                      <td><span className={`badge ${typeColors[s.type]}`}>{s.type}</span></td>
                      <td>{s.hoursPerWeek}h</td>
                      <td>{s.faculty?.name || <span style={{ color: 'var(--text3)' }}>Unassigned</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id, s.name)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Subject' : 'Add Subject'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Subject Name *</label>
                  <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Code *</label>
                  <input className="form-control" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. CS301" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <input className="form-control" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Semester *</label>
                  <select className="form-control" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="theory">Theory</option>
                    <option value="lab">Lab</option>
                    <option value="elective">Elective</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Hours/Week</label>
                  <input className="form-control" type="number" min="1" max="8" value={form.hoursPerWeek} onChange={e => setForm({ ...form, hoursPerWeek: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Credits</label>
                  <input className="form-control" type="number" min="1" max="6" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Assign Faculty</label>
                  <select className="form-control" value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })}>
                    <option value="">— Select Faculty —</option>
                    {faculty.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Subject'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
