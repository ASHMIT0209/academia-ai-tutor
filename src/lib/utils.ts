import { Factor, RiskCategory, RoadmapItem } from "../types";

export function computeRisk(cgpa: number, att: number, assign: number, bl: number, sem: number, study: number, screen: number, sleepH: number, stress?: number) {
  const c = isNaN(cgpa) ? 0 : cgpa;
  const a = isNaN(att) ? 0 : att;
  const as = isNaN(assign) ? 0 : assign;
  const b = isNaN(bl) ? 0 : bl;
  const s = isNaN(sem) ? 1 : sem;
  const st = isNaN(study) ? 0 : study;
  const sc = isNaN(screen) ? 0 : screen;
  const sl = isNaN(sleepH) ? 0 : sleepH;
  const str = isNaN(stress || 5) ? 5 : (stress || 5);

  const semU = s >= 6 ? 1.12 : s <= 2 ? 0.88 : 1.0;
  const base = 100 - (c / 10) * 100 * 0.30 - a * 0.20 - as * 0.16 - (Math.min(st, 8) / 8) * 100 * 0.10 + (Math.min(b, 10) / 10) * 100 * 0.14 + Math.max(0, sc - 3) * 2 + Math.max(0, 6 - sl) * 2 + str * 0.5;
  return Math.round(Math.max(0, Math.min(100, base * semU)));
}

export function getFactors(cgpa: number, att: number, assign: number, bl: number, study: number, screen: number, sleepH: number): Factor[] {
  const c = isNaN(cgpa) ? 0 : cgpa;
  const a = isNaN(att) ? 0 : att;
  const as = isNaN(assign) ? 0 : assign;
  const b = isNaN(bl) ? 0 : bl;
  const st = isNaN(study) ? 0 : study;
  const sc = isNaN(screen) ? 0 : screen;
  const sl = isNaN(sleepH) ? 0 : sleepH;

  return [
    { label: 'CGPA', sub: c < 5 ? 'Critical' : c < 7 ? 'Below target' : 'On track', val: Math.round((c / 10) * 100), weight: '30%', color: c < 5 ? 'var(--danger)' : c < 7 ? 'var(--avg)' : 'var(--good)', bg: c < 5 ? '#FDECEC' : c < 7 ? '#FEF5E7' : '#EEF9EE', icon: c < 5 ? '↓↓' : c < 7 ? '↓' : '↑' },
    { label: 'Attendance', sub: a < 75 ? 'Below 75% minimum' : a < 85 ? 'Borderline' : 'Good', val: Math.round(a), weight: '20%', color: a < 75 ? 'var(--danger)' : a < 85 ? 'var(--avg)' : 'var(--good)', bg: a < 75 ? '#FDECEC' : a < 85 ? '#FEF5E7' : '#EEF9EE', icon: a < 75 ? '↓↓' : a < 85 ? '↓' : '↑' },
    { label: 'Assignments', sub: as < 55 ? 'Low quality' : as < 70 ? 'Improvable' : 'Consistent', val: Math.round(as), weight: '16%', color: as < 55 ? 'var(--danger)' : as < 70 ? 'var(--avg)' : 'var(--good)', bg: as < 55 ? '#FDECEC' : as < 70 ? '#FEF5E7' : '#EEF9EE', icon: as < 55 ? '↓' : '↑' },
    { label: 'Backlogs', sub: b === 0 ? 'Clear' : b < 3 ? `${b} active` : `${b} — critical`, val: Math.round(Math.min(b * 14, 60)), weight: '14%', color: b === 0 ? 'var(--good)' : b < 3 ? 'var(--avg)' : 'var(--danger)', bg: b === 0 ? '#EEF9EE' : b < 3 ? '#FEF5E7' : '#FDECEC', icon: b === 0 ? '✓' : b < 3 ? '!' : '!!' },
    { label: 'Study Hours', sub: st < 1.5 ? 'Very low' : st < 3 ? 'Below recommended' : 'Good', val: Math.min(Math.round((st / 8) * 100), 100), weight: '10%', color: st < 1.5 ? 'var(--danger)' : st < 3 ? 'var(--avg)' : 'var(--good)', bg: st < 1.5 ? '#FDECEC' : st < 3 ? '#FEF5E7' : '#EEF9EE', icon: st < 2 ? '↓' : st < 3 ? '◎' : '↑' },
    { label: 'Screen Time', sub: sc > 6 ? 'Very high — impacts focus' : sc > 4 ? 'Moderate' : 'Healthy', val: Math.min(Math.round((sc / 12) * 100), 100), weight: '5%', color: sc > 6 ? 'var(--danger)' : sc > 4 ? 'var(--avg)' : 'var(--good)', bg: sc > 6 ? '#FDECEC' : sc > 4 ? '#FEF5E7' : '#EEF9EE', icon: sc > 6 ? '↓' : sc > 4 ? '◎' : '↑' },
    { label: 'Sleep', sub: sl < 5 ? 'Severely deprived' : sl < 7 ? 'Below optimal' : 'Good', val: Math.min(Math.round((sl / 10) * 100), 100), weight: '5%', color: sl < 5 ? 'var(--danger)' : sl < 7 ? 'var(--avg)' : 'var(--good)', bg: sl < 5 ? '#FDECEC' : sl < 7 ? '#FEF5E7' : '#EEF9EE', icon: sl < 6 ? '↓' : '↑' },
  ];
}

export function getRoadmap(cat: RiskCategory, cgpa: number, att: number, bl: number, study: number): RoadmapItem[] {
  const nextCgpa = Math.min(10, (cat === 'danger' ? cgpa + 0.9 : cat === 'avg' ? cgpa + 0.55 : cgpa + 0.25)).toFixed(2);
  const attGap = Math.max(0, 75 - Math.round(att));
  if (cat === 'danger') return [
    { week: 'Week 1–2', color: 'var(--danger)', title: 'Emergency Academic Audit', desc: `List all pending subjects, backlogs, and deadlines. Book a faculty advisor meeting immediately. Draft a clearing schedule for ${bl} active backlog(s).`, tags: ['Advisor Meeting', 'Backlog List', 'Deadline Map'] },
    { week: 'Week 3–4', color: 'var(--danger)', title: `Attendance Sprint — close the ${attGap}% gap`, desc: 'Zero absences for 4 weeks. Notify faculty of any medical constraints. Attendance recovery is non-negotiable at this stage.', tags: ['Zero Absences', 'Tracker', 'Permission Letters'] },
    { week: 'Week 5–6', color: 'var(--avg)', title: 'Backlog Clearance Programme', desc: '1.5 hrs/day per backlog subject. Break the syllabus into 3-day chapter chunks. Track completion with a physical checklist.', tags: ['Chapter Plans', 'Study Blocks', 'Peer Groups'] },
    { week: 'Week 7–8', color: 'var(--avg)', title: 'Assignment Submission Recovery', desc: 'Target 75%+ on all upcoming assignments. Seek office hours. Resubmit any pending work, even if late.', tags: ['Assignment Log', 'Office Hours', 'Checklist'] },
    { week: 'Week 9–11', color: 'var(--purple)', title: 'Internal Exam Bootcamp', desc: 'High-weightage topic sheets. Solve 3 past papers per subject under timed conditions. Focus on concept mapping.', tags: ['Past Papers', 'Time-boxing', 'Concept Maps'] },
    { week: 'Semester End', color: 'var(--good)', title: `Target CGPA: ${nextCgpa}`, desc: 'Review roadmap every 2 weeks with advisor. Achievable with consistent effort across all areas.', tags: ['Semester Review', 'Celebrate Wins'] },
  ];
  if (cat === 'avg') return [
    { week: 'Week 1', color: 'var(--avg)', title: 'Strengths & Gaps Analysis', desc: 'Map top vs weak subjects. Identify which subjects are dragging your CGPA.', tags: ['Subject Matrix', 'Gap List'] },
    { week: 'Week 2–3', color: 'var(--avg)', title: 'Structured Daily Routine', desc: `${Math.max(3, (study + 1.5)).toFixed(1)} hrs/day using Pomodoro (25-min blocks). Mornings for hardest subjects.`, tags: ['Timetable', 'Pomodoro', 'Sleep Schedule'] },
    { week: 'Week 4–6', color: 'var(--avg)', title: 'Assignment Excellence Drive', desc: '80%+ on all submissions. Peer review before submitting. Correct returned assignments immediately.', tags: ['Peer Review', 'Feedback Loop', 'Quality'] },
    { week: 'Week 7–9', color: 'var(--purple)', title: 'Internal Exam Strategy', desc: 'High-yield topic sheets. 2 past papers per subject. Short-answer and derivation focus.', tags: ['Topic Priority', 'Mock Tests'] },
    { week: 'Semester End', color: 'var(--good)', title: `Target CGPA: ${nextCgpa}`, desc: 'Track weekly. A 0.2 gain by mid-semester means you are on track.', tags: ['Progress Check'] },
  ];
  return [
    { week: 'Week 1–2', color: 'var(--good)', title: 'Advanced Subject Mastery', desc: 'Identify subjects where 90%+ is achievable. Deep-dive beyond the syllabus.', tags: ['Deep Learning', 'Extra Reading'] },
    { week: 'Week 3–6', color: 'var(--good)', title: 'Research & Project Involvement', desc: 'Apply to a faculty research project or open-source initiative. Build your academic profile.', tags: ['Research Apply', 'GitHub Portfolio'] },
    { week: 'Week 7–10', color: 'var(--accent)', title: 'Competitive & Career Prep', desc: '1 hr/day for GATE, placements, or a Coursera certification. Build a 2-project portfolio.', tags: ['GATE Prep', 'Placement', 'Certification'] },
    { week: 'Ongoing', color: 'var(--good)', title: `Sustain & Stretch to ${nextCgpa}`, desc: `Protect your ${cgpa.toFixed(2)} CGPA. Mentor a peer — teaching solidifies understanding.`, tags: ['Peer Mentoring', 'Consistency'] },
  ];
}

export function buildFlags(cgpa: number, att: number, assign: number, bl: number, study: number, screen: number, sleepH: number, sem: number, risk: number, stress?: number) {
  const flags: [string, string][] = [];
  if (cgpa < 5) flags.push(['f-danger', 'CGPA Critical']); else if (cgpa < 6.5) flags.push(['f-avg', 'CGPA Below Target']);
  if (att < 75) flags.push(['f-danger', 'Attendance Deficit']); else if (att < 85) flags.push(['f-avg', 'Borderline Attendance']);
  if (assign < 55) flags.push(['f-danger', 'Weak Assignments']);
  if (bl > 0) flags.push(['f-danger', `${bl} Active Backlog${bl > 1 ? 's' : ''}`]);
  if (study < 2) flags.push(['f-avg', 'Low Study Hours']);
  if (screen > 6) flags.push(['f-avg', 'High Screen Time']);
  if (sleepH < 5) flags.push(['f-danger', 'Severe Sleep Deficit']); else if (sleepH < 7) flags.push(['f-avg', 'Low Sleep']);
  if (sem >= 6 && risk > 50) flags.push(['f-danger', 'Late-Stage Risk']);
  if (stress && stress >= 8) flags.push(['f-danger', 'High Stress']);
  if (flags.length === 0) flags.push(['f-good', 'No Critical Flags']);
  return flags;
}
