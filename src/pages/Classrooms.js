import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { useConfirm } from '../components/ConfirmDialog';

const emptyForm = { name: '', roomNumber: '', capacity: '', type: 'lecture', department: '', floor: '', building: '', facilities: '' };

export default function Classrooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { confirm, ConfirmDialogUI } = useConfirm();

  const fetchRooms = () => {
    setLoading(true);
    API.get('/classrooms').then(res => { setRooms(res.data.classrooms); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchRooms(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setError(''); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ name: r.name, roomNumber: r.roomNumber, capacity: r.capacity, type: r.type, department: r.department || '', floor: r.floor || '', building: r.building || '', facilities: (r.facilities || []).join(', ') });
    setEditId(r._id); setError(''); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, capacity: Number(form.capacity), floor: form.floor ? Number(form.floor) : undefined, facilities: form.facilities ? form.facilities.split(',').map(f => f.trim()) : [] };
      if (editId) await API.put(`/classrooms/${editId}`, payload);
      else await API.post('/classrooms', payload);
      setShowModal(false); fetchRooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm({
      title: 'Delete Classroom?',
      message: `"${name}" will be permanently removed. Any assigned timetable slots may be affected.`,
      icon: '🏫',
      confirmText: 'Yes, Delete',
      confirmColor: '#ef4444',
    });
    if (!ok) return;
    await API.delete(`/classrooms/${id}`);
    fetchRooms();
  };

  const typeColors = { lecture: 'badge-blue', lab: 'badge-yellow', seminar: 'badge-purple', auditorium: 'badge-green' };

  return (
    <div>
      {ConfirmDialogUI}
      <div className="page-header">
        <h1>Classroom Management</h1>
        <p>Manage rooms, labs, and their availability</p>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="section-header">
            <h3>All Classrooms ({rooms.length})</h3>
            <button className="btn btn-primary" onClick={openAdd}>+ Add Classroom</button>
          </div>
          {loading ? <div className="loading">Loading...</div> : rooms.length === 0 ? (
            <div className="empty-state"><div className="icon">🏫</div><p>No classrooms found. Add your first room.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Room</th><th>Number</th><th>Type</th><th>Capacity</th><th>Department</th><th>Building</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {rooms.map(r => (
                    <tr key={r._id}>
                      <td><strong>{r.name}</strong></td>
                      <td style={{ color: 'var(--text2)' }}>{r.roomNumber}</td>
                      <td><span className={`badge ${typeColors[r.type] || 'badge-blue'}`}>{r.type}</span></td>
                      <td>{r.capacity}</td>
                      <td>{r.department || '—'}</td>
                      <td>{r.building || '—'}</td>
                      <td><span className={`badge ${r.isAvailable ? 'badge-green' : 'badge-red'}`}>{r.isAvailable ? 'Available' : 'Unavailable'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id, r.name)}>🗑️</button>
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
              <h3>{editId ? 'Edit Classroom' : 'Add Classroom'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Room Name *</label>
                  <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Computer Lab 1" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Room Number *</label>
                  <input className="form-control" value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })} placeholder="e.g. CS-101" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="lecture">Lecture Hall</option>
                    <option value="lab">Laboratory</option>
                    <option value="seminar">Seminar Room</option>
                    <option value="auditorium">Auditorium</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity *</label>
                  <input className="form-control" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-control" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Building</label>
                  <input className="form-control" value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Facilities (comma separated)</label>
                <input className="form-control" value={form.facilities} onChange={e => setForm({ ...form, facilities: e.target.value })} placeholder="Projector, AC, Whiteboard" />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Classroom'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
