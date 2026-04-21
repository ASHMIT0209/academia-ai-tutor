import React, { useState, useEffect, useRef } from 'react';
import { StudentProfile, PredictionResult, RoadmapItem, Factor } from '../types';
import { generateDataset, buildAndTrainNN, makeRandomForest, trainLR, nnPredict, rfPredict, lrPredict, FI_NAMES, FI_COLORS, rfFeatureImportance } from '../lib/ml';
import { computeRisk, getFactors, buildFlags, getRoadmap } from '../lib/utils';
import { SUBSTREAMS, RESOURCES_BY_STREAM } from '../lib/constants';
import { Bot, GraduationCap, LayoutDashboard, FileText, Printer, LogOut, Loader2, Target, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface StudentPortalProps {
  onLogout: () => void;
}

export default function StudentPortal({ onLogout }: StudentPortalProps) {
  const [profile, setProfile] = useState<StudentProfile>({
    prevCgpa: 6.2,
    prevSgpa: 5.9,
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

  useEffect(() => {
    async function init() {
      setTrainingStatus({ state: 'loading', msg: 'Generating dataset...', pct: 5, log: '800 synthetic student records...' });
      const { X, Y } = generateDataset(800);
      
      await new Promise(r => setTimeout(r, 500));
      setTrainingStatus({ state: 'loading', msg: 'Training Logistic Regression...', pct: 20, log: '300 epochs...' });
      const lr = trainLR(X, Y);
      
      await new Promise(r => setTimeout(r, 500));
      setTrainingStatus({ state: 'loading', msg: 'Building Random Forest...', pct: 35, log: '20 decision trees...' });
      const rf = makeRandomForest(X, Y);
      
      await new Promise(r => setTimeout(r, 500));
      setTrainingStatus({ state: 'loading', msg: 'Training Neural Network...', pct: 48, log: '60 epochs...' });
      const nn = await buildAndTrainNN(X, Y, (ep, total, logs) => {
        setTrainingStatus(prev => ({
          ...prev,
          pct: 48 + Math.round((ep / total) * 44),
          log: `Epoch ${ep}/${total} — loss: ${logs.loss.toFixed(4)} — acc: ${((logs.acc || 0) * 100).toFixed(1)}%`
        }));
      });

      setModels({ nn, rf, lr });
      setTrainingStatus({ state: 'ready', msg: 'All models ready', pct: 100, log: 'Training complete — all 3 models ready.' });
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
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <nav className="sticky top-0 z-50 bg-[rgba(8,8,8,0.92)] backdrop-blur-xl border-b border-[var(--border)] px-8 flex items-center justify-between h-[58px]">
        <div className="flex items-center gap-3">
          <div className="w-[30px] h-[30px] bg-[var(--red)] rounded-lg flex items-center justify-center font-serif text-white shadow-[0_0_14px_var(--red-glow)]">A</div>
          <span className="text-sm font-medium text-[var(--text)]">Academia AI</span>
          <span className="font-mono text-[9.5px] px-2 py-0.5 rounded bg-[var(--danger-bg)] text-[var(--red)] border border-[var(--danger-border)]">Student</span>
        </div>
        <div className="flex gap-1">
          <button className="nav-link active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>My Profile</button>
          <button className="nav-link" onClick={() => resultRef.current?.scrollIntoView({ behavior: 'smooth' })}>Report</button>
          <button className="nav-link" onClick={() => window.print()}>Print</button>
          <button className="px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all cursor-pointer bg-[var(--danger-bg)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white" onClick={onLogout}>Sign Out</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 pb-16">
        <header className="py-10">
          <div className="font-mono text-[9.5px] tracking-[0.18em] text-[var(--red)] uppercase mb-2">ML-Powered Academic Analysis</div>
          <h1 className="font-serif text-[clamp(1.6rem,4vw,2.4rem)] font-semibold leading-tight text-[var(--text)]">
            Your Academic<br /><em className="italic text-[var(--red)]">Success Report</em>
          </h1>
          <p className="text-[13.5px] text-[var(--text3)] mt-2">Fill in your academic profile to receive a personalized ML classification and roadmap</p>
        </header>



        <section className="mb-10">
          <div className="card">
            <div className="form-section-title">📚 Academic Information</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="field">
                <label>Previous CGPA <span className="text-[10.5px] font-normal text-[var(--text3)] ml-1">(0–10)</span></label>
                <input type="number" value={profile.prevCgpa} onChange={e => setProfile({ ...profile, prevCgpa: parseFloat(e.target.value) })} min="0" max="10" step="0.1" />
              </div>
              <div className="field">
                <label>Previous SGPA <span className="text-[10.5px] font-normal text-[var(--text3)] ml-1">(0–10)</span></label>
                <input type="number" value={profile.prevSgpa} onChange={e => setProfile({ ...profile, prevSgpa: parseFloat(e.target.value) })} min="0" max="10" step="0.1" />
              </div>
              <div className="field">
                <label>Attendance <span className="text-[10.5px] font-normal text-[var(--text3)] ml-1">(%)</span></label>
                <input type="number" value={profile.attend} onChange={e => setProfile({ ...profile, attend: parseFloat(e.target.value) })} min="0" max="100" />
              </div>
              <div className="field">
                <label>Assignment Score <span className="text-[10.5px] font-normal text-[var(--text3)] ml-1">(%)</span></label>
                <input type="number" value={profile.assign} onChange={e => setProfile({ ...profile, assign: parseFloat(e.target.value) })} min="0" max="100" />
              </div>
              <div className="field">
                <label>Active Backlogs</label>
                <input type="number" value={profile.backlogs} onChange={e => setProfile({ ...profile, backlogs: parseInt(e.target.value) })} min="0" max="20" />
              </div>
              <div className="field">
                <label>Current Semester</label>
                <select value={profile.sem} onChange={e => setProfile({ ...profile, sem: parseInt(e.target.value) })}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Stream</label>
                <select value={profile.stream} onChange={e => setProfile({ ...profile, stream: e.target.value })}>
                  <option value="engineering">Engineering</option>
                  <option value="science">Pure Sciences</option>
                  <option value="commerce">Commerce / BBA</option>
                  <option value="arts">Arts / Humanities</option>
                  <option value="medical">Medical / Pharmacy</option>
                </select>
              </div>
              <div className="field">
                <label>Sub-stream</label>
                <select value={profile.substream} onChange={e => setProfile({ ...profile, substream: e.target.value })}>
                  {SUBSTREAMS[profile.stream]?.map(s => {
                    const [v, l] = s.split(':');
                    return <option key={v} value={v}>{l}</option>;
                  })}
                </select>
              </div>
            </div>

            <div className="form-section-title">🧠 Behavioral & Lifestyle</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="field">
                <label>Study Hours / day</label>
                <input type="number" value={profile.study} onChange={e => setProfile({ ...profile, study: parseFloat(e.target.value) })} min="0" max="16" step="0.5" />
              </div>
              <div className="field">
                <label>Class Participation</label>
                <select value={profile.participation} onChange={e => setProfile({ ...profile, participation: parseInt(e.target.value) })}>
                  <option value={1}>Low</option>
                  <option value={2}>Medium</option>
                  <option value={3}>High</option>
                </select>
              </div>
              <div className="field">
                <label>Screen Time <span className="text-[10.5px] font-normal text-[var(--text3)] ml-1">(hrs/day)</span></label>
                <input type="number" value={profile.screen} onChange={e => setProfile({ ...profile, screen: parseFloat(e.target.value) })} min="0" max="16" step="0.5" />
              </div>
              <div className="field">
                <label>Sleep Hours / day</label>
                <input type="number" value={profile.sleep} onChange={e => setProfile({ ...profile, sleep: parseFloat(e.target.value) })} min="0" max="16" step="0.5" />
              </div>
              <div className="field">
                <label>Stress Level <span className="text-[10.5px] font-normal text-[var(--text3)] ml-1">(1–10)</span></label>
                <input type="number" value={profile.stress || ''} onChange={e => setProfile({ ...profile, stress: parseInt(e.target.value) })} min="1" max="10" />
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
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-[var(--text)]">Ensemble ML Prediction</h2>
              <p className="text-[12.5px] text-[var(--text3)]">Three models vote — weighted majority determines classification</p>
            </div>

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
                    <div className="h-[3px] bg-[var(--border)] rounded-full mt-2 overflow-hidden">
                      <div className="h-full" style={{ width: `${Math.max(...m.probs) * 100}%`, background: colors[pi] }}></div>
                    </div>
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
                <div className="text-[12.5px] text-[var(--text2)]">
                  {result.cat === 'danger' ? 'Immediate academic intervention required — act this week.' :
                   result.cat === 'avg' ? 'Structured guidance can unlock your full potential.' :
                   'Strong academic trajectory — sustain and aim higher.'}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {buildFlags(profile.prevCgpa, profile.attend, profile.assign, profile.backlogs, profile.study, profile.screen, profile.sleep, profile.sem, result.risk, profile.stress).map(([c, t], i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-full text-[10.5px] font-medium border ${
                      c === 'f-danger' ? 'bg-[var(--danger-bg)] text-[var(--red)] border-[var(--danger-border)]' :
                      c === 'f-avg' ? 'bg-[var(--avg-bg)] text-[#d07030] border-[var(--avg-border)]' :
                      'bg-[var(--good-bg)] text-[#3db56e] border-[var(--good-border)]'
                    }`}>{t}</span>
                  ))}
                </div>
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

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
              {[
                { name: 'Prev CGPA', val: profile.prevCgpa.toFixed(2), pct: profile.prevCgpa * 10 },
                { name: 'Prev SGPA', val: profile.prevSgpa.toFixed(2), pct: profile.prevSgpa * 10 },
                { name: 'Attendance', val: Math.round(profile.attend) + '%', pct: profile.attend },
                { name: 'Assignments', val: Math.round(profile.assign) + '%', pct: profile.assign },
                { name: 'Backlogs', val: profile.backlogs, pct: Math.min(profile.backlogs * 10, 100) },
                { name: 'Study Hrs', val: profile.study.toFixed(1) + 'h', pct: (profile.study / 8) * 100 }
              ].map(m => (
                <div key={m.name} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 shadow-[var(--shadow)]">
                  <div className="font-mono text-[9.5px] text-[var(--text3)] mb-1">{m.name}</div>
                  <div className="font-serif text-lg font-semibold text-[var(--text)]">{m.val}</div>
                  <div className="h-[3px] bg-[var(--border)] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[var(--red)] transition-all duration-1000" style={{ width: `${m.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              <div className="card">
                <div className="font-mono text-[9.5px] tracking-widest uppercase text-[var(--text3)] mb-4">Input Weights & Impact</div>
                <div className="space-y-3">
                  {getFactors(profile.prevCgpa, profile.attend, profile.assign, profile.backlogs, profile.study, profile.screen, profile.sleep).map((f, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-none">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: f.bg, color: f.color }}>{f.icon}</div>
                      <div className="flex-1">
                        <div className="text-[12.5px] text-[var(--text)]">{f.label}</div>
                        <div className="text-[10.5px] text-[var(--text3)]">{f.sub}</div>
                      </div>
                      <span className="font-mono text-[9.5px] px-2 py-0.5 rounded bg-[var(--surface2)] text-[var(--text2)] border border-[var(--border)]">
                        {f.weight}
                      </span>
                      <div className="w-14 h-[3px] bg-[var(--border)] rounded-full shrink-0">
                        <div className="h-full rounded-full" style={{ width: `${f.val}%`, background: f.color }}></div>
                      </div>
                      <div className="font-mono text-[10.5px] min-w-[28px] text-right font-medium text-[var(--text2)]">{f.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="font-mono text-[9.5px] tracking-widest uppercase text-[var(--text3)] mb-4">Diagnostic Profile</div>
                <div className="space-y-3 mb-6">
                  {[
                    { label: 'CGPA (×10)', val: Math.round(profile.prevCgpa * 10) },
                    { label: 'Attendance', val: Math.round(profile.attend) },
                    { label: 'Assignments', val: Math.round(profile.assign) },
                    { label: 'Study Score', val: Math.min(Math.round((profile.study / 8) * 100), 100) },
                    { label: 'Sleep Score', val: Math.min(Math.round((profile.sleep / 9) * 100), 100) },
                    { label: 'Risk Score', val: result.risk }
                  ].map(b => (
                    <div key={b.label} className="flex items-center gap-3">
                      <div className="text-[11.5px] text-[var(--text2)] w-28 shrink-0 text-right">{b.label}</div>
                      <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${b.val}%`, background: result.cat === 'danger' ? 'var(--danger)' : result.cat === 'avg' ? 'var(--avg)' : 'var(--good)' }}></div>
                      </div>
                      <div className="font-mono text-[10.5px] text-[var(--text3)] w-8">{b.val}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-[var(--red)] rounded-xl p-4 flex items-center justify-between shadow-[0_0_24px_var(--red-glow)]">
                  <div>
                    <div className="text-[11.5px] text-white/75 mb-1">Next-semester CGPA target</div>
                    <div className="font-serif text-2xl font-semibold text-white">
                      {Math.min(10, (result.cat === 'danger' ? profile.prevCgpa + 0.9 : result.cat === 'avg' ? profile.prevCgpa + 0.55 : profile.prevCgpa + 0.25)).toFixed(2)} / 10
                    </div>
                    <div className="text-[10.5px] text-white/60 mt-1">Achievable in {result.cat === 'danger' ? '2' : '1'} semester(s) with consistent effort</div>
                  </div>
                  <div className="text-3xl opacity-35">🎯</div>
                </div>
              </div>
            </div>

            <div className="card mb-6">
              <div className="font-mono text-[9.5px] tracking-widest uppercase text-[var(--text3)] mb-4">Personalized Roadmap</div>
              <div className="flex gap-1 mb-6 bg-[var(--bg3)] p-1 rounded-lg border border-[var(--border)] w-fit">
                <button className={`px-4 py-1.5 rounded-md text-[12.5px] font-medium transition-all ${activeTab === 'roadmap' ? 'bg-[var(--surface2)] text-[var(--text)] shadow-sm' : 'text-[var(--text3)] hover:text-[var(--text2)]'}`} onClick={() => setActiveTab('roadmap')}>Roadmap</button>
                <button className={`px-4 py-1.5 rounded-md text-[12.5px] font-medium transition-all ${activeTab === 'resources' ? 'bg-[var(--surface2)] text-[var(--text)] shadow-sm' : 'text-[var(--text3)] hover:text-[var(--text2)]'}`} onClick={() => setActiveTab('resources')}>Resources</button>
              </div>

              {activeTab === 'roadmap' ? (
                <div className="roadmap">
                  {getRoadmap(result.cat, profile.prevCgpa, profile.attend, profile.backlogs, profile.study).map((r, i) => (
                    <div key={i} className="rm-item animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="rm-dot" style={{ color: r.color, background: r.color }}></div>
                      <div className="font-mono text-[9.5px] text-[var(--text3)] mb-1 tracking-wider">{r.week}</div>
                      <div className="font-semibold text-[13.5px] text-[var(--text)] mb-1">{r.title}</div>
                      <div className="text-[12.5px] text-[var(--text2)] leading-relaxed">{r.desc}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {r.tags.map(t => <span key={t} className="text-[10.5px] px-2 py-0.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--text3)]">{t}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(RESOURCES_BY_STREAM[profile.stream]?.[profile.substream] || ['Khan Academy', 'Coursera', 'YouTube educational channels', 'NPTEL', 'Google Scholar']).map((r, i) => (
                    <div key={i} className="bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-3 flex gap-3 items-start">
                      <div className="text-lg shrink-0">{['📚', '💻', '🎓', '🔧', '🎥'][i % 5]}</div>
                      <div className="text-[12.5px] text-[var(--text2)]">{r}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>


    </div>
  );
}
