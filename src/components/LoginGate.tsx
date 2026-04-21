import React, { useState } from 'react';

const CREDS: Record<string, { users: Record<string, string>, hint: string }> = {
  student: { users: { student01: 'pass123', s2: 'pass' }, hint: 'user: student01 · pass: pass123' },
  faculty: { users: { faculty01: 'faculty', prof: 'prof123' }, hint: 'user: faculty01 · pass: faculty' },
  admin: { users: { admin: 'admin123', root: 'root' }, hint: 'user: admin · pass: admin123' },
};

interface LoginGateProps {
  onLogin: (role: string) => void;
}

export default function LoginGate({ onLogin }: LoginGateProps) {
  const [loginTarget, setLoginTarget] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (!loginTarget) return;
    if (CREDS[loginTarget].users[username] === password) {
      onLogin(loginTarget);
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
      <div className="w-full max-w-5xl relative z-10">
        <div className="text-center mb-14">
          <div className="font-mono text-[11px] tracking-[0.25em] text-[var(--red)] uppercase mb-5 flex items-center justify-center gap-2">
            <span className="w-7 h-[1px] bg-[var(--red-muted)]"></span>
            Academia AI · ML-Powered
            <span className="w-7 h-[1px] bg-[var(--red-muted)]"></span>
          </div>
          <h1 className="font-serif text-[clamp(2.2rem,5vw,3.6rem)] font-semibold text-[var(--text)] leading-tight mb-4 drop-shadow-[0_0_60px_rgba(204,31,31,0.3)]">
            Academic Success<br /><em className="italic text-[var(--red)]">Intelligently Guided</em>
          </h1>
          <p className="text-sm text-[var(--text3)] max-w-lg mx-auto leading-relaxed">
            Explainable · Prescriptive · Personalized — powered by Neural Network, Random Forest & Logistic Regression
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['student', 'faculty', 'admin'] as const).map((role) => (
            <div
              key={role}
              onClick={() => setLoginTarget(role)}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-7 cursor-pointer transition-all duration-300 hover:bg-[var(--surface2)] hover:border-[var(--border2)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group"
            >
              <div className={`absolute top-0 left-0 right-0 h-0.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                role === 'student' ? 'bg-linear-to-r from-[#cc1f1f] to-[#ff4040]' :
                role === 'faculty' ? 'bg-linear-to-r from-[#1e6e3a] to-[#2d9050]' :
                'bg-linear-to-r from-[#b05c00] to-[#e07a00]'
              }`}></div>
              <div className="text-3xl mb-4 grayscale-[0.2]">{role === 'student' ? '🎓' : role === 'faculty' ? '👨‍🏫' : '⚙️'}</div>
              <div className="font-mono text-[9px] tracking-widest uppercase text-[var(--text3)] mb-1">Portal</div>
              <div className="font-serif text-xl text-[var(--text)] mb-2 capitalize">{role}</div>
              <div className="text-[12.5px] text-[var(--text3)] leading-relaxed mb-4">
                {role === 'student' ? 'Enter your academic profile and receive a personalized ML-powered risk assessment and roadmap.' :
                 role === 'faculty' ? 'Analyze student profiles, trigger interventions, and access cohort-level academic insights.' :
                 'Full system overview: cohort analytics, model performance metrics, training loss curves, and batch management.'}
              </div>
              <button className="w-full py-2.5 border border-[var(--good)] bg-[var(--good)] hover:bg-[var(--good-mid)] hover:border-[var(--good-mid)] rounded-lg text-sm font-medium text-white transition-all shadow-[0_0_15px_rgba(30,110,58,0.2)]">
                Login as {role.charAt(0).toUpperCase() + role.slice(1)} →
              </button>
            </div>
          ))}
        </div>
      </div>

      {loginTarget && (
        <div className="fixed inset-0 bg-black/85 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--surface)] border border-[var(--border2)] rounded-2xl p-8 w-full max-w-sm shadow-[0_30px_80px_rgba(0,0,0,0.7),var(--shadow-red)]">
            <div className="font-serif text-2xl mb-1 text-[var(--text)] capitalize">{loginTarget} Login</div>
            <div className="text-[12.5px] text-[var(--text3)] mb-6">Enter your credentials to continue</div>
            
            <div className="space-y-4">
              <div className="field">
                <label>Username / ID</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={`e.g. ${loginTarget}01`}
                />
                {error && <div className="text-[11.5px] text-[var(--red)] mt-1">Invalid credentials. Please try again.</div>}
              </div>
              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-6">
              <button className="btn-secondary flex-1" onClick={() => { setLoginTarget(null); setError(false); }}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={handleLogin}>Sign In</button>
            </div>
            <div className="text-[10.5px] text-[var(--text3)] mt-4 text-center font-mono">{CREDS[loginTarget].hint}</div>
          </div>
        </div>
      )}
    </div>
  );
}
