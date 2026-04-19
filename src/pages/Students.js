import React, { useEffect, useState } from "react";
import API from "../utils/api";
import { useConfirm } from "../components/ConfirmDialog";

const emptyForm = { name: "", email: "", password: "", department: "", phone: "" };

export default function Students() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { confirm, ConfirmDialogUI } = useConfirm();

  const fetchStudents = () => {
    setLoading(true);
    API.get("/users?role=student").then(res => { setUsers(res.data.users); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchStudents(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setError(""); setShowModal(true); };
  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: "", department: u.department || "", phone: u.phone || "" });
    setEditId(u._id); setError(""); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (editId) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await API.put(`/users/${editId}`, payload);
      } else {
        await API.post("/auth/register", { ...form, role: "student" });
      }
      setShowModal(false); fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || "Error saving");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm({
      title: "Delete Student?",
      message: `"${name}" will be permanently removed from the system.`,
      icon: "🗑️",
      confirmText: "Yes, Delete",
      confirmColor: "#ef4444",
    });
    if (!ok) return;
    await API.delete(`/users/${id}`);
    fetchStudents();
  };

  return (
    <div>
      {ConfirmDialogUI}
      <div className="page-header">
        <h1>Student Management</h1>
        <p>Manage student records and enrollments</p>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="section-header">
            <h3>All Students ({users.length})</h3>
            <button className="btn btn-primary" onClick={openAdd}>+ Add Student</button>
          </div>
          {loading ? <div className="loading">Loading...</div> : users.length === 0 ? (
            <div className="empty-state"><div className="icon">🎓</div><p>No students found. Add your first student.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td><strong>{u.name}</strong></td>
                      <td style={{ color: "var(--text2)" }}>{u.email}</td>
                      <td>{u.department || "—"}</td>
                      <td>{u.phone || "—"}</td>
                      <td><span className={`badge ${u.isActive ? "badge-green" : "badge-red"}`}>{u.isActive ? "Active" : "Inactive"}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>✏️ Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id, u.name)}>🗑️</button>
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
              <h3>{editId ? "Edit Student" : "Add Student"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password {editId ? "(leave blank)" : "*"}</label>
                  <div style={{ position: "relative" }}>
                    <input className="form-control" type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editId} />
                    <span onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}>{showPassword ? "🙈" : "👁️"}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-control" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Student"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
