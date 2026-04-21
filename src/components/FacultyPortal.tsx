import React, { useState, useEffect, useRef } from 'react';
import { StudentProfile, PredictionResult } from '../types';
import { generateDataset, buildAndTrainNN, makeRandomForest, trainLR, nnPredict, rfPredict, lrPredict, FI_NAMES, FI_COLORS, rfFeatureImportance } from '../lib/ml';
import { computeRisk, getFactors, buildFlags, getRoadmap } from '../lib/utils';
import { SUBSTREAMS, RESOURCES_BY_STREAM } from '../lib/constants';
import { Bot, GraduationCap, LayoutDashboard, FileText, Printer, LogOut, Loader2, Target, AlertTriangle, CheckCircle, Info, Mail, Calendar, Download, BarChart2, Bell, Lock } from 'lucide-react';

interface FacultyPortalProps {
  onLogout: () => void;
}

export default function FacultyPortal({ onLogout }: FacultyPortalProps) {
  const [profile, setProfile] = useState<StudentProfile>({
    prevCgpa: 5.8,
    prevSgpa: 5.4,
    attend: 68,
    assign: 55,
    backlogs: 2,
    sem: 4,
    stream: 'engineering',
    substream: 'cs',
    study: 2,
    participation: 2,
    screen: 4,
    sleep: 6,
  });

  const [models, setModels] = useState<{ nn: any, rf: any, lr: any } | null>(null);
  const [trainingStatus, setTrainingStatus] = useState({ state: 'loading', msg: 'Initialising ML models...', pct: 0, log: 'Loading TensorFlow.js...' });
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'resources'>('roadmap');

  const resultRef = useRef<HTMLDivElement>(null);
  const dbCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function init() {
      const { X, Y } = generateDataset(800);
      const lr = trainLR(X, Y);
      const rf = makeRandomForest(X, Y);
      const nn = await buildAndTrainNN(X, Y, (ep, total, logs) => {
        setTrainingStatus({
          state: 'loading',
          msg: 'Training models...',
          pct: Math.round((ep / total) * 100),
          log: `Epoch ${ep}/${total} — loss: ${(logs?.loss ?? 0).toFixed(4)}`
        });
      });

      setModels({ nn, rf, lr });
      setTrainingStatus({ state: 'ready', msg: 'All models ready', pct: 100, log: 'Ready' });
    }
    init();
  }, []);

  const handleAnalyze = async () => {
    if (!models) return;
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 800));

    const { prevCgpa, attend, assign, backlogs, sem, study, screen, sleep, participation, stress } = profile;
    const x = [
      Math.min(prevCgpa, 10) / 10,
      Math.min(attend, 100) / 100,
      Math.min(assign, 100) / 100,
      Math.min(backlogs, 10) / 10,
      Math.min(sem, 8) / 8,
      Math.min(study, 12) / 12,
      Math.min(screen, 12) / 12,
      Math.min(sleep, 10) / 10,
      participation / 3,
      (stress || 5) / 10,
    ];

    const nnP = await nnPredict(models.nn, x);
    const rfP = rfPredict(models.rf, x);
    const lrP = lrPredict(models.lr, x);
    const ensP = nnP.map((v, j) => v * 0.5 + rfP[j] * 0.3 + lrP[j] * 0.2);
    const catIdx = ensP.indexOf(Math.max(...ensP));
    const cat = (['danger', 'avg', 'good'] as const)[catIdx];
    const risk = computeRisk(prevCgpa, attend, assign, backlogs, sem, study, screen, sleep, stress);
    const confidence = (Math.max(...nnP) * 100).toFixed(1);

    setResult({ nnP, rfP, lrP, ensP, catIdx, cat, risk, confidence });
    setIsAnalyzing(false);
    
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      drawDecisionBoundary(x);
    }, 100);
  };

  const drawDecisionBoundary = (studentX: number[]) => {
    const canvas = dbCanvasRef.current;
    if (!canvas || !models) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    const pad = { top: 18, right: 16, bottom: 34, left: 42 };
    const cw = W - pad.left - pad.right, ch = H - pad.top - pad.bottom;
    
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, W, H);

    const res = 24;
    for (let xi = 0; xi < res; xi++) {
      for (let yi = 0; yi < res; yi++) {
        const cn = (xi + 0.5) / res, an = (yi + 0.5) / res;
        const x = [cn, an, 0.65, 0.1, 0.5, 0.25, 0.3, 0.7, 0.67, 0.5];
        const rfP = rfPredict(models.rf, x);
        const lrP = lrPredict(models.lr, x);
        const ensP = rfP.map((v, j) => v * 0.5 + lrP[j] * 0.5);
        const pred = ensP.indexOf(Math.max(...ensP));
        const alpha = Math.max(...ensP) * 0.38;
        ctx.fillStyle = pred === 0 ? `rgba(192,57,43,${alpha})` : pred === 1 ? `rgba(160,97,10,${alpha})` : `rgba(39,98,50,${alpha})`;
        ctx.fillRect(pad.left + cn * cw, pad.top + (1 - an) * ch, cw / res + 1, ch / res + 1);
      }
    }

    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + ch);
    ctx.lineTo(pad.left + cw, pad.top + ch);
    ctx.stroke();

    ctx.fillStyle = '#606060';
    ctx.font = '10px DM Mono,monospace';
    ctx.textAlign = 'center';
    [0, 2.5, 5, 7.5, 10].forEach(v => ctx.fillText(v.toFixed(1), pad.left + cw * (v / 10), H - 6));
    ctx.fillText('CGPA', pad.left + cw / 2, H - 0);
    [0, 25, 50, 75, 100].forEach(v => {
      ctx.textAlign = 'right';
      ctx.fillText(v.toString(), pad.left - 3, pad.top + ch * (1 - v / 100) + 3);
    });

    if (studentX) {
      const sx = pad.left + studentX[0] * cw, sy = pad.top + (1 - studentX[1]) * ch;
      ctx.fillStyle = '#e8e8e8';
      ctx.font = 'bold 14px serif';
      ctx.textAlign = 'center';
      ctx.fillText('✦', sx, sy + 5);
      ctx.font = '10px Outfit,sans-serif';
      ctx.fillText('Student', sx, sy + 17);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <nav className="sticky top-0 z-50 bg-[rgba(8,8,8,0.92)] backdrop-blur-xl border-b border-[var(--border)] px-8 flex items-center justify-between h-[58px]">
        <div className="flex items-center gap-3">
          <div className="w-[30px] h-[30px] bg-[var(--red)] rounded-lg flex items-center justify-center font-serif text-white shadow-[0_0_14px_var(--red-glow)]">A</div>
          <span className="text-sm font-medium text-[var(--text)]">Academia AI</span>
          <span className="font-mono text-[9.5px] px-2 py-0.5 rounded bg-[var(--good-bg)] text-[#3db56e] border border-[var(--good-border)]">Faculty</span>
        </div>
        <div className="flex gap-1">
          <button className="nav-link active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Analyze Student</button>
          <button className="nav-link" onClick={() => resultRef.current?.scrollIntoView({ behavior: 'smooth' })}>Report</button>
          <button className="nav-link" onClick={() => window.print()}>Print</button>
          <button className="px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all cursor-pointer bg-[var(--danger-bg)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white" onClick={onLogout}>Sign Out</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 pb-16">
        <header className="py-10">
          <div className="font-mono text-[9.5px] tracking-[0.18em] text-[var(--red)] uppercase mb-2">Faculty Portal · Full Access</div>
          <h1 className="font-serif text-[clamp(1.6rem,4vw,2.4rem)] font-semibold leading-tight text-[var(--text)]">
            Student Analysis<br /><em className="italic text-[var(--red)]">& Intervention</em>
          </h1>
          <p className="text-[13.5px] text-[var(--text3)] mt-2">Enter any student's profile — faculty actions are fully unlocked</p>
        </header>



        <section className="mb-10">
          <div className="card">
            <div className="form-section-title">📚 Academic Information</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="field">
                <label>Previous CGPA</label>
                <input type="number" value={profile.prevCgpa} onChange={e => setProfile({ ...profile, prevCgpa: parseFloat(e.target.value) })} min="0" max="10" step="0.1" />
              </div>
              <div className="field">
                <label>Previous SGPA</label>
                <input type="number" value={profile.prevSgpa} onChange={e => setProfile({ ...profile, prevSgpa: parseFloat(e.target.value) })} min="0" max="10" step="0.1" />
              </div>
              <div className="field">
                <label>Attendance (%)</label>
                <input type="number" value={profile.attend} onChange={e => setProfile({ ...profile, attend: parseFloat(e.target.value) })} min="0" max="100" />
              </div>
              <div className="field">
                <label>Assignment Score (%)</label>
                <input type="number" value={profile.assign} onChange={e => setProfile({ ...profile, assign: parseFloat(e.target.value) })} min="0" max="100" />
              </div>
              <div className="field">
                <label>Active Backlogs</label>
                <input type="number" value={profile.backlogs} onChange={e => setProfile({ ...profile, backlogs: parseInt(e.target.value) })} min="0" max="20" />
              </div>
              <div className="field">
                <label>Semester</label>
                <select value={profile.sem} onChange={e => setProfile({ ...profile, sem: parseInt(e.target.value) })}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                className="btn-primary" 
                onClick={handleAnalyze} 
                disabled={trainingStatus.state !== 'ready' || isAnalyzing}
              >
                {isAnalyzing || trainingStatus.state !== 'ready' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isAnalyzing ? 'Analyzing...' : trainingStatus.state !== 'ready' ? 'Loading Models...' : 'Analyze with ML →'}
              </button>
              <button className="btn-secondary" onClick={() => setProfile({ prevCgpa: 0, prevSgpa: 0, attend: 0, assign: 0, backlogs: 0, sem: 1, stream: 'engineering', substream: 'cs', study: 0, participation: 2, screen: 0, sleep: 0 })}>Reset</button>
            </div>
          </div>
        </section>

        {result && (
          <div ref={resultRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {[
                { name: 'Neural Network', weight: '50%', probs: result.nnP, key: 'nn' },
                { name: 'Random Forest', weight: '30%', probs: result.rfP, key: 'rf' },
                { name: 'Logistic Reg.', weight: '20%', probs: result.lrP, key: 'lr' }
              ].map(m => {
                const pi = m.probs.indexOf(Math.max(...m.probs));
                const colors = ['var(--danger)', 'var(--avg)', 'var(--good)'];
                const names = ['Danger', 'Average', 'Good'];
                return (
                  <div key={m.key} className="bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: m.key === 'nn' ? 'var(--purple)' : m.key === 'rf' ? 'var(--teal)' : 'var(--red)' }}></div>
                    <div className="font-mono text-[9.5px] text-[var(--text3)] mb-1">{m.name} · {m.weight}</div>
                    <div className="text-[13.5px] font-semibold mb-1" style={{ color: colors[pi] }}>{names[pi]}</div>
                    <div className="text-[10.5px] text-[var(--text3)]">{(Math.max(...m.probs) * 100).toFixed(0)}% confidence</div>
                  </div>
                );
              })}
            </div>

            <div className={`class-banner p-6 rounded-[var(--radius)] border mb-6 grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_auto] gap-5 items-center ${
              result.cat === 'danger' ? 'bg-[var(--danger-bg)] border-[var(--danger-border)]' :
              result.cat === 'avg' ? 'bg-[var(--avg-bg)] border-[var(--avg-border)]' :
              'bg-[var(--good-bg)] border-[var(--good-border)]'
            }`}>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                result.cat === 'danger' ? 'bg-[var(--red)] text-white shadow-[0_0_20px_var(--red-glow)]' :
                result.cat === 'avg' ? 'bg-[var(--avg)] text-white' :
                'bg-[var(--good)] text-white'
              }`}>
                {result.cat === 'danger' ? '⚠' : result.cat === 'avg' ? '◎' : '✦'}
              </div>
              <div>
                <div className={`font-serif text-2xl font-semibold ${
                  result.cat === 'danger' ? 'text-[var(--red)]' :
                  result.cat === 'avg' ? 'text-[#d07030]' :
                  'text-[#3db56e]'
                }`}>
                  {result.cat === 'danger' ? 'Danger Zone' : result.cat === 'avg' ? 'Average Zone' : 'Good Standing'}
                </div>
                <div className="text-[12.5px] text-[var(--text2)]">Faculty analysis complete. Intervention tools unlocked.</div>
              </div>
              <div className="hidden sm:block text-right">
                <div className="font-serif text-3xl font-semibold text-[var(--purple)]">{result.confidence}%</div>
                <div className="font-mono text-[9.5px] text-[var(--text3)] uppercase tracking-wider">NN Confidence</div>
              </div>
              <div className="hidden sm:block text-right">
                <div className={`font-serif text-3xl font-semibold ${
                  result.cat === 'danger' ? 'text-[var(--red)]' :
                  result.cat === 'avg' ? 'text-[#d07030]' :
                  'text-[#3db56e]'
                }`}>{result.risk}</div>
                <div className="font-mono text-[9.5px] text-[var(--text3)] uppercase tracking-wider">Risk / 100</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              <div className="card">
                <div className="font-mono text-[9.5px] tracking-widest uppercase text-[var(--text3)] mb-4">Decision Boundary — CGPA vs Attendance</div>
                <div className="bg-[#141414] rounded-lg overflow-hidden border border-[var(--border)]">
                  <canvas ref={dbCanvasRef} width={400} height={265} className="w-full h-auto block"></canvas>
                </div>
                <p className="text-[11px] text-[var(--text3)] mt-2">Background = model prediction zone · ✦ = student position</p>
              </div>
              <div className="card">
                <div className="font-mono text-[9.5px] tracking-widest uppercase text-[var(--text3)] mb-4">Feature Importance — Random Forest</div>
                <div className="space-y-2 mt-2">
                  {models && rfFeatureImportance(models.rf).map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v).map(({ v, i }) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="text-[11.5px] text-[var(--text2)] w-32 shrink-0 text-right">{FI_NAMES[i]}</div>
                      <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${v * 100}%`, background: FI_COLORS[i] }}></div>
                      </div>
                      <div className="font-mono text-[10.5px] text-[var(--text3)] w-8 text-right">{(v * 100).toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card mb-6">
              <div className="font-mono text-[9.5px] tracking-widest uppercase text-[var(--text3)] mb-4 flex items-center gap-2">
                Faculty Action Centre 
                <span className="text-[10px] text-[#3db56e] bg-[var(--good-bg)] px-2 py-0.5 rounded border border-[var(--good-border)]">✓ Fully Unlocked</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: <Mail className="w-5 h-5" />, label: 'Send Alert Email', desc: result.cat === 'danger' ? 'Immediate intervention email' : 'Routine progress update' },
                  { icon: <Calendar className="w-5 h-5" />, label: 'Schedule Counselling', desc: 'Book emergency session' },
                  { icon: <Download className="w-5 h-5" />, label: 'Generate Full Report', desc: 'Export PDF with ML insights' },
                  { icon: <BarChart2 className="w-5 h-5" />, label: 'Cohort Analytics', desc: 'Compare against batch trends' },
                  { icon: <Target className="w-5 h-5" />, label: 'Set ML Goals', desc: 'Target checkpoints' },
                  { icon: <Bell className="w-5 h-5" />, label: result.cat === 'danger' ? 'Escalate to HOD' : 'Notify Department', desc: 'Flag for review' }
                ].map((a, i) => (
                  <div key={i} className="bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-4 cursor-pointer transition-all hover:border-[var(--red)] hover:bg-[var(--danger-bg)] hover:-translate-y-1">
                    <div className="text-[var(--red)] mb-2">{a.icon}</div>
                    <div className="text-[12.5px] font-medium text-[var(--text)] mb-1">{a.label}</div>
                    <div className="text-[10.5px] text-[var(--text3)] leading-tight">{a.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>


    </div>
  );
}
