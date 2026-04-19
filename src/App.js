import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Faculty from './pages/Faculty';
import Students from './pages/Students';
import Classrooms from './pages/Classrooms';
import Subjects from './pages/Subjects';
import Timetable from './pages/Timetable';
import MyTimetable from './pages/MyTimetable';
import Notes from './pages/Notes';
import './index.css';

const pages = {
  dashboard: Dashboard,
  faculty: Faculty,
  students: Students,
  classrooms: Classrooms,
  subjects: Subjects,
  timetable: Timetable,
  mytimetable: MyTimetable,
  notes: Notes,
};

function AppInner() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  if (!user) return <Login />;

  const PageComponent = pages[activePage] || Dashboard;

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="main-content">
        <PageComponent setActivePage={setActivePage} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
