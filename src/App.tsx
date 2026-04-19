/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import LoginGate from './components/LoginGate';
import StudentPortal from './components/StudentPortal';
import FacultyPortal from './components/FacultyPortal';
import AdminDashboard from './components/AdminDashboard';
import AITutor from './components/AITutor';

export default function App() {
  const [role, setRole] = useState<string | null>(null);

  const handleLogin = (selectedRole: string) => {
    setRole(selectedRole);
  };

  const handleLogout = () => {
    setRole(null);
  };

  return (
    <div className="min-h-screen">
      {!role ? (
        <LoginGate onLogin={handleLogin} />
      ) : (
        <div className="screen active">
          {role === 'student' && <StudentPortal onLogout={handleLogout} />}
          {role === 'faculty' && <FacultyPortal onLogout={handleLogout} />}
          {role === 'admin' && <AdminDashboard onLogout={handleLogout} />}
        </div>
      )}
      <AITutor />
    </div>
  );
}
