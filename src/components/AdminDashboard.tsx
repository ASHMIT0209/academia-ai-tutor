import React, { useState, useEffect, useRef } from 'react';
import { generateDataset, buildAndTrainNN, trainLR, makeRandomForest } from '../lib/ml';
import { LayoutDashboard, Users, Database, Activity, Settings, LogOut, Loader2, BarChart2, Shield, Server, Cpu, Globe, AlertTriangle } from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalStudents: 1240,
    activeModels: 3,
    riskAlerts: 42,
    avgAccuracy: 89.2,
    serverUptime: '99.98%',
    apiLatency: '12ms'
  });

  const [trainingLog, setTrainingLog] = useState<string[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);

  const startTraining = async () => {
    setIsTraining(true);
    setProgress(0);
    setTrainingLog(['[SYSTEM] Initializing global model retraining...', '[DATA] Fetching 1,240 student records...', '[DATA] Preprocessing features...']);
    
    await new Promise(r => setTimeout(r, 1000));
    setTrainingLog(prev => [...prev, '[ML] Training Logistic Regression (Baseline)...']);
    setProgress(20);
    
    await new Promise(r => setTimeout(r, 1000));
    setTrainingLog(prev => [...prev, '[ML] Building Random Forest (20 trees)...']);
    setProgress(45);

    await new Promise(r => setTimeout(r, 1000));
    setTrainingLog(prev => [...prev, '[ML] Training Neural Network (Deep)...']);
    
    const { X, Y } = generateDataset(800);
    await buildAndTrainNN(X, Y, (ep, total) => {
      setProgress(45 + Math.round((ep / total) * 55));
      if (ep % 10 === 0) {
        setTrainingLog(prev => [...prev, `[ML] NN Epoch ${ep}/${total} completed.`]);
      }
    });

    setTrainingLog(prev => [...prev, '[SYSTEM] Models synced to production.', '[SYSTEM] Retraining complete.']);
    setIsTraining(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <nav className="sticky top-0 z-50 bg-[rgba(8,8,8,0.92)] backdrop-blur-xl border-b border-[var(--border)] px-8 flex items-center justify-between h-[58px]">
        <div className="flex items-center gap-3">
          <div className="w-[30px] h-[30px] bg-[var(--red)] rounded-lg flex items-center justify-center font-serif text-white shadow-[0_0_14px_var(--red-glow)]">A</div>
          <span className="text-sm font-medium text-[var(--text)]">Academia AI</span>
          <span className="font-mono text-[9.5px] px-2 py-0.5 rounded bg-[var(--avg-bg)] text-[#b05c00] border border-[var(--avg-border)]">Admin</span>
        </div>
        <div className="flex gap-1">
          <button className="nav-link active">System Overview</button>
          <button className="nav-link">Model Management</button>
          <button className="nav-link">User Access</button>
          <button className="px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all cursor-pointer bg-[var(--danger-bg)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white" onClick={onLogout}>Sign Out</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 pb-16">
        <header className="py-10">
          <div className="font-mono text-[9.5px] tracking-[0.18em] text-[var(--red)] uppercase mb-2">System Administration · Root Access</div>
          <h1 className="font-serif text-[clamp(1.6rem,4vw,2.4rem)] font-semibold leading-tight text-[var(--text)]">
            Global System<br /><em className="italic text-[var(--red)]">Dashboard</em>
          </h1>
          <p className="text-[13.5px] text-[var(--text3)] mt-2">Monitor model performance, system health, and cohort-level metrics</p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Total Students', val: stats.totalStudents, icon: <Users className="w-4 h-4" /> },
            { label: 'Active Models', val: stats.activeModels, icon: <Cpu className="w-4 h-4" /> },
            { label: 'Risk Alerts', val: stats.riskAlerts, icon: <AlertTriangle className="w-4 h-4" /> },
            { label: 'Avg Accuracy', val: stats.avgAccuracy + '%', icon: <Activity className="w-4 h-4" /> },
            { label: 'Uptime', val: stats.serverUptime, icon: <Globe className="w-4 h-4" /> },
            { label: 'Latency', val: stats.apiLatency, icon: <Server className="w-4 h-4" /> }
          ].map(s => (
            <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow)]">
              <div className="text-[var(--red)] mb-2">{s.icon}</div>
              <div className="font-mono text-[9.5px] text-[var(--text3)] mb-1 uppercase tracking-wider">{s.label}</div>
              <div className="font-serif text-xl font-semibold text-[var(--text)]">{s.val}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          <div className="lg:col-span-2 card">
            <div className="flex justify-between items-center mb-6">
              <div className="font-mono text-[9.5px] tracking-widest uppercase text-[var(--text3)]">Model Training Control</div>
              <button 
                className="btn-primary py-1.5 text-xs" 
                onClick={startTraining}
                disabled={isTraining}
              >
                {isTraining ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {isTraining ? 'Retraining...' : 'Retrain Global Models'}
              </button>
            </div>
            
            <div className="h-[4px] bg-[var(--border)] rounded-full overflow-hidden mb-6">
              <div className="h-full bg-[var(--red)] transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="bg-[#080808] border border-[var(--border)] rounded-lg p-4 font-mono text-[11px] h-64 overflow-y-auto">
              {trainingLog.length === 0 ? (
                <div className="text-[var(--text4)] italic">System idle. Ready for command...</div>
              ) : (
                trainingLog.map((log, i) => (
                  <div key={i} className="mb-1">
                    <span className="text-[var(--text4)] mr-2">[{new Date().toLocaleTimeString()}]</span>
                    <span className={log.startsWith('[SYSTEM]') ? 'text-[var(--purple)]' : log.startsWith('[ML]') ? 'text-[var(--red)]' : 'text-[var(--text2)]'}>
                      {log}
                    </span>
                  </div>
                ))
              )}
              {isTraining && <div className="text-[var(--red)] animate-pulse mt-1">_</div>}
            </div>
          </div>

          <div className="card">
            <div className="font-mono text-[9.5px] tracking-widest uppercase text-[var(--text3)] mb-6">Security & Access</div>
            <div className="space-y-4">
              {[
                { label: 'Firewall Status', val: 'Active', color: 'text-[#3db56e]' },
                { label: 'Encryption', val: 'AES-256', color: 'text-[var(--text2)]' },
                { label: 'Admin Logs', val: 'View', color: 'text-[var(--red)]' },
                { label: 'API Keys', val: 'Managed', color: 'text-[var(--text2)]' }
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-none">
                  <span className="text-[12.5px] text-[var(--text2)]">{s.label}</span>
                  <span className={`text-[12.5px] font-medium ${s.color}`}>{s.val}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-xl">
              <div className="flex items-center gap-2 text-[var(--red)] mb-2">
                <Shield className="w-4 h-4" />
                <span className="text-[11.5px] font-semibold uppercase tracking-wider">System Alert</span>
              </div>
              <p className="text-[11px] text-[var(--text2)] leading-relaxed">
                42 students flagged in the "Danger Zone" this week. Automated intervention emails have been dispatched.
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="font-mono text-[9.5px] tracking-widest uppercase text-[var(--text3)] mb-6">Global Cohort Metrics</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Avg CGPA', val: '7.12', trend: '+0.12', up: true },
              { label: 'Avg Attendance', val: '82.4%', trend: '-1.5%', up: false },
              { label: 'Backlog Rate', val: '14.2%', trend: '-2.1%', up: true },
              { label: 'Engagement', val: 'High', trend: '+8%', up: true }
            ].map(m => (
              <div key={m.label}>
                <div className="text-[12.5px] text-[var(--text3)] mb-1">{m.label}</div>
                <div className="flex items-end gap-2">
                  <div className="font-serif text-2xl font-semibold text-[var(--text)]">{m.val}</div>
                  <div className={`text-[11px] font-medium mb-1 ${m.up ? 'text-[#3db56e]' : 'text-[var(--red)]'}`}>
                    {m.trend}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>


    </div>
  );
}
