import React, { useEffect, useState, useCallback } from "react";
import API from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function Attendance() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // ── Tabs ──
  const [tab, setTab] = useState("mark"); // 'mark' | 'sessions' | 'report'

  // ── Mark Attendance state ──
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [markForm, setMarkForm] = useState({
    date: todayStr(),
    subjectId: "",
    period: 1,
    department: user?.department || "",
    semester: 1,
    section: "A",
    notes: "",
  });
  const [attendanceMap, setAttendanceMap] = useState({}); // studentId -> 'present'|'absent'|'late'
  const [markLoading, setMarkLoading] = useState(false);
  const [markError, setMarkError] = useState("");
  const [markSuccess, setMarkSuccess] = useState("");
  const [studentsLoading, setStudentsLoading] = useState(false);

  // ── Sessions state ──
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionFilter, setSessionFilter] = useState({ date: "", subjectId: "", department: "" });

  // ── Report state ──
  const [reportStudents, setReportStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [report, setReport] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  // ── Summary ──
  const [summary, setSummary] = useState(null);

  // Fetch subjects
  useEffect(() => {
    API.get("/subjects").then(res => setSubjects(res.data.subjects || res.data || [])).catch(() => {});
  }, []);

  // Fetch summary
  useEffect(() => {
    API.get("/attendance/summary").then(res => setSummary(res.data)).catch(() => {});
  }, []);

  // Fetch students for report tab
  useEffect(() => {
    if (tab === "report") {
      API.get("/users?role=student").then(res => setReportStudents(res.data.users || [])).catch(() => {});
    }
  }, [tab]);

  // When mark form changes (department/semester/section), fetch students
  const fetchStudentsForMark = useCallback(() => {
    if (!markForm.department || !markForm.semester) return;
    setStudentsLoading(true);
    API.get(`/users?role=student&department=${markForm.department}`)
      .then(res => {
        const all = res.data.users || [];
        setStudents(all);
        // Initialize all as absent
        const init = {};
        all.forEach(s => { init[s._id] = "absent"; });
        setAttendanceMap(init);
      })
      .catch(() => {})
      .finally(() => setStudentsLoading(false));
  }, [markForm.department, markForm.semester]);

  useEffect(() => { fetchStudentsForMark(); }, [fetchStudentsForMark]);

  // Fetch sessions
  const fetchSessions = useCallback(() => {
    setSessionsLoading(true);
    const params = new URLSearchParams();
    if (sessionFilter.date) params.set("date", sessionFilter.date);
    if (sessionFilter.subjectId) params.set("subjectId", sessionFilter.subjectId);
    if (sessionFilter.department) params.set("department", sessionFilter.department);
    API.get(`/attendance?${params}`)
      .then(res => setSessions(res.data.sessions || []))
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, [sessionFilter]);

  useEffect(() => { if (tab === "sessions") fetchSessions(); }, [tab, fetchSessions]);

  const toggleStatus = (studentId) => {
    setAttendanceMap(prev => {
      const cur = prev[studentId] || "absent";
      const next = cur === "present" ? "late" : cur === "late" ? "absent" : "present";
      return { ...prev, [studentId]: next };
    });
  };

  const markAll = (status) => {
    const next = {};
    students.forEach(s => { next[s._id] = status; });
    setAttendanceMap(next);
  };

  const handleMarkSubmit = async (e) => {
    e.preventDefault();
    setMarkError(""); setMarkSuccess(""); setMarkLoading(true);
    try {
      const records = students.map(s => ({ student: s._id, status: attendanceMap[s._id] || "absent" }));
      await API.post("/attendance", { ...markForm, records });
      setMarkSuccess("✅ Attendance marked successfully!");
      API.get("/attendance/summary").then(res => setSummary(res.data)).catch(() => {});
    } catch (err) {
      setMarkError(err.response?.data?.message || "Error saving attendance");
    } finally { setMarkLoading(false); }
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm("Delete this attendance session?")) return;
    await API.delete(`/attendance/${id}`);
    fetchSessions();
  };

  const fetchReport = async () => {
    if (!selectedStudent) return;
    setReportLoading(true);
    try {
      const res = await API.get(`/attendance/report/student/${selectedStudent}`);
      setReport(res.data.report || []);
    } catch { setReport([]); }
    finally { setReportLoading(false); }
  };

  const statusColor = (s) => s === "present" ? "#22c55e" : s === "late" ? "#f59e0b" : "#ef4444";
  const statusBg = (s) => s === "present" ? "#dcfce7" : s === "late" ? "#fef3c7" : "#fee2e2";

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>📋 Attendance Management</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280" }}>Mark and track student attendance</p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Sessions", value: summary.totalSessions, color: "#6366f1", bg: "#ede9fe" },
            { label: "Present", value: summary.present, color: "#22c55e", bg: "#dcfce7" },
            { label: "Absent", value: summary.absent, color: "#ef4444", bg: "#fee2e2" },
            { label: "Late", value: summary.late, color: "#f59e0b", bg: "#fef3c7" },
            { label: "Attendance Rate", value: `${summary.attendanceRate}%`, color: "#0ea5e9", bg: "#e0f2fe" },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, borderRadius: 12, padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { key: "mark", label: "✍️ Mark Attendance" },
          { key: "sessions", label: "📅 View Sessions" },
          { key: "report", label: "📊 Student Report" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer",
            fontWeight: 600, fontSize: 14,
            background: tab === t.key ? "#6366f1" : "#f3f4f6",
            color: tab === t.key ? "#fff" : "#374151",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Mark Attendance Tab ── */}
      {tab === "mark" && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <form onSubmit={handleMarkSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 20 }}>
              {[
                { label: "Date", name: "date", type: "date" },
                { label: "Period", name: "period", type: "select", options: PERIODS.map(p => ({ value: p, label: `Period ${p}` })) },
                { label: "Department", name: "department", type: "text", placeholder: "e.g. CSE" },
                { label: "Semester", name: "semester", type: "select", options: [1,2,3,4,5,6,7,8].map(s => ({ value: s, label: `Sem ${s}` })) },
                { label: "Section", name: "section", type: "text", placeholder: "A" },
              ].map(f => (
                <div key={f.name}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>{f.label}</label>
                  {f.type === "select" ? (
                    <select value={markForm[f.name]} onChange={e => setMarkForm(p => ({ ...p, [f.name]: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14 }}>
                      {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input type={f.type} value={markForm[f.name]} placeholder={f.placeholder}
                      onChange={e => setMarkForm(p => ({ ...p, [f.name]: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
                  )}
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Subject</label>
                <select value={markForm.subjectId} onChange={e => setMarkForm(p => ({ ...p, subjectId: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14 }}>
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Notes (optional)</label>
              <input value={markForm.notes} onChange={e => setMarkForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Any notes about this session..."
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
            </div>

            {/* Students list */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>
                  Students {studentsLoading ? "⏳" : `(${students.length})`}
                </h3>
                <div style={{ display: "flex", gap: 8 }}>
                  {["present", "late", "absent"].map(s => (
                    <button key={s} type="button" onClick={() => markAll(s)} style={{
                      padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12,
                      fontWeight: 600, background: statusBg(s), color: statusColor(s),
                    }}>All {s.charAt(0).toUpperCase() + s.slice(1)}</button>
                  ))}
                </div>
              </div>

              {studentsLoading ? (
                <p style={{ color: "#6b7280", textAlign: "center" }}>Loading students...</p>
              ) : students.length === 0 ? (
                <p style={{ color: "#6b7280", textAlign: "center", padding: 20 }}>
                  {markForm.department ? "No students found for this department." : "Enter a department to load students."}
                </p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10, maxHeight: 400, overflowY: "auto" }}>
                  {students.map(s => {
                    const status = attendanceMap[s._id] || "absent";
                    return (
                      <div key={s._id} onClick={() => toggleStatus(s._id)} style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                        borderRadius: 10, border: `2px solid ${statusColor(status)}`,
                        background: statusBg(status), cursor: "pointer", transition: "all 0.15s",
                        userSelect: "none",
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%", background: statusColor(status),
                          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: 14, flexShrink: 0,
                        }}>{s.name?.[0]?.toUpperCase()}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>{s.email}</div>
                        </div>
                        <span style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: statusColor(status), color: "#fff", textTransform: "uppercase",
                        }}>{status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {markError && <div style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 14 }}>{markError}</div>}
            {markSuccess && <div style={{ background: "#dcfce7", color: "#15803d", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 14 }}>{markSuccess}</div>}

            <button type="submit" disabled={markLoading || students.length === 0 || !markForm.subjectId} style={{
              padding: "12px 28px", background: "#6366f1", color: "#fff", border: "none",
              borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer",
              opacity: markLoading || students.length === 0 || !markForm.subjectId ? 0.6 : 1,
            }}>
              {markLoading ? "Saving..." : "✅ Submit Attendance"}
            </button>
          </form>
        </div>
      )}

      {/* ── Sessions Tab ── */}
      {tab === "sessions" && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          {/* Filters */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <input type="date" value={sessionFilter.date} onChange={e => setSessionFilter(p => ({ ...p, date: e.target.value }))}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14 }} />
            <select value={sessionFilter.subjectId} onChange={e => setSessionFilter(p => ({ ...p, subjectId: e.target.value }))}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14 }}>
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <input value={sessionFilter.department} onChange={e => setSessionFilter(p => ({ ...p, department: e.target.value }))}
              placeholder="Department" style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14 }} />
            <button onClick={fetchSessions} style={{
              padding: "8px 18px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer"
            }}>Search</button>
          </div>

          {sessionsLoading ? <p style={{ textAlign: "center", color: "#6b7280" }}>Loading...</p> :
            sessions.length === 0 ? <p style={{ textAlign: "center", color: "#6b7280" }}>No sessions found.</p> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["Date", "Subject", "Faculty", "Period", "Dept", "Present/Total", "Actions"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "2px solid #e5e7eb" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => {
                    const present = s.records.filter(r => r.status === "present").length;
                    const total = s.records.length;
                    const pct = total ? Math.round((present / total) * 100) : 0;
                    return (
                      <tr key={s._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "10px 14px" }}>{new Date(s.date).toLocaleDateString()}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>{s.subject?.name}<br /><span style={{ fontSize: 11, color: "#6b7280" }}>{s.subject?.code}</span></td>
                        <td style={{ padding: "10px 14px" }}>{s.faculty?.name}</td>
                        <td style={{ padding: "10px 14px" }}>P{s.period}</td>
                        <td style={{ padding: "10px 14px" }}>{s.department}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontWeight: 700, color: pct >= 75 ? "#22c55e" : "#ef4444" }}>{present}/{total}</span>
                          <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 6 }}>({pct}%)</span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <button onClick={() => handleDeleteSession(s._id)} style={{
                            padding: "4px 10px", background: "#fee2e2", color: "#b91c1c",
                            border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600,
                          }}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Report Tab ── */}
      {tab === "report" && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Select Student</label>
              <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14 }}>
                <option value="">-- Choose a student --</option>
                {reportStudents.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
              </select>
            </div>
            <button onClick={fetchReport} disabled={!selectedStudent || reportLoading} style={{
              padding: "10px 20px", background: "#6366f1", color: "#fff", border: "none",
              borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14,
              opacity: !selectedStudent ? 0.6 : 1,
            }}>{reportLoading ? "Loading..." : "Generate Report"}</button>
          </div>

          {report.length > 0 ? (
            <>
              <h3 style={{ marginBottom: 16 }}>Attendance Report by Subject</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                {report.map((r, i) => (
                  <div key={i} style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{r.subject?.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>{r.subject?.code}</div>
                    {/* Progress bar */}
                    <div style={{ background: "#f3f4f6", borderRadius: 6, height: 8, marginBottom: 10 }}>
                      <div style={{ background: r.percentage >= 75 ? "#22c55e" : "#ef4444", borderRadius: 6, height: 8, width: `${r.percentage}%`, transition: "width 0.3s" }} />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: r.percentage >= 75 ? "#22c55e" : "#ef4444" }}>{r.percentage}%</div>
                    <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                      {[["✅", "present", r.present], ["⚠️", "late", r.late], ["❌", "absent", r.absent]].map(([ic, lbl, val]) => (
                        <div key={lbl} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{ic} {val}</div>
                          <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize" }}>{lbl}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>Total: {r.total} classes</div>
                  </div>
                ))}
              </div>
            </>
          ) : selectedStudent && !reportLoading ? (
            <p style={{ color: "#6b7280", textAlign: "center" }}>No attendance data found for this student.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
