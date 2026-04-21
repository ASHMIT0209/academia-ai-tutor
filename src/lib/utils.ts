import { Factor, RiskCategory, RoadmapItem } from "../types";

export function computeRisk(cgpa: number, att: number, assign: number, bl: number, sem: number, study: number, screen: number, sleepH: number, stress?: number) {
  const semU = sem >= 6 ? 1.12 : sem <= 2 ? 0.88 : 1.0;
  const base = 100 - (cgpa / 10) * 100 * 0.30 - att * 0.20 - assign * 0.16 - (Math.min(study, 8) / 8) * 100 * 0.10 + (Math.min(bl, 10) / 10) * 100 * 0.14 + Math.max(0, screen - 3) * 2 + Math.max(0, 6 - sleepH) * 2 + (stress || 5) * 0.5;
  return Math.round(Math.max(0, Math.min(100, base * semU)));
}

export function getFactors(cgpa: number, att: number, assign: number, bl: number, study: number, screen: number, sleepH: number): Factor[] {
  return [
    { label: 'CGPA', sub: cgpa < 5 ? 'Critical' : cgpa < 7 ? 'Below target' : 'On track', val: Math.round((cgpa / 10) * 100), weight: '30%', color: cgpa < 5 ? 'var(--danger)' : cgpa < 7 ? 'var(--avg)' : 'var(--good)', bg: cgpa < 5 ? '#FDECEC' : cgpa < 7 ? '#FEF5E7' : '#EEF9EE', icon: cgpa < 5 ? '↓↓' : cgpa < 7 ? '↓' : '↑' },
    { label: 'Attendance', sub: att < 75 ? 'Below 75% minimum' : att < 85 ? 'Borderline' : 'Good', val: Math.round(att), weight: '20%', color: att < 75 ? 'var(--danger)' : att < 85 ? 'var(--avg)' : 'var(--good)', bg: att < 75 ? '#FDECEC' : att < 85 ? '#FEF5E7' : '#EEF9EE', icon: att < 75 ? '↓↓' : att < 85 ? '↓' : '↑' },
    { label: 'Assignments', sub: assign < 55 ? 'Low quality' : assign < 70 ? 'Improvable' : 'Consistent', val: Math.round(assign), weight: '16%', color: assign < 55 ? 'var(--danger)' : assign < 70 ? 'var(--avg)' : 'var(--good)', bg: assign < 55 ? '#FDECEC' : assign < 70 ? '#FEF5E7' : '#EEF9EE', icon: assign < 55 ? '↓' : '↑' },
    { label: 'Backlogs', sub: bl === 0 ? 'Clear' : bl < 3 ? `${bl} active` : `${bl} — critical`, val: Math.round(Math.min(bl * 14, 60)), weight: '14%', color: bl === 0 ? 'var(--good)' : bl < 3 ? 'var(--avg)' : 'var(--danger)', bg: bl === 0 ? '#EEF9EE' : bl < 3 ? '#FEF5E7' : '#FDECEC', icon: bl === 0 ? '✓' : bl < 3 ? '!' : '!!' },
    { label: 'Study Hours', sub: study < 1.5 ? 'Very low' : study < 3 ? 'Below recommended' : 'Good', val: Math.min(Math.round((study / 8) * 100), 100), weight: '10%', color: study < 1.5 ? 'var(--danger)' : study < 3 ? 'var(--avg)' : 'var(--good)', bg: study < 1.5 ? '#FDECEC' : study < 3 ? '#FEF5E7' : '#EEF9EE', icon: study < 2 ? '↓' : study < 3 ? '◎' : '↑' },
    { label: 'Screen Time', sub: screen > 6 ? 'Very high — impacts focus' : screen > 4 ? 'Moderate' : 'Healthy', val: Math.min(Math.round((screen / 12) * 100), 100), weight: '5%', color: screen > 6 ? 'var(--danger)' : screen > 4 ? 'var(--avg)' : 'var(--good)', bg: screen > 6 ? '#FDECEC' : screen > 4 ? '#FEF5E7' : '#EEF9EE', icon: screen > 6 ? '↓' : screen > 4 ? '◎' : '↑' },
    { label: 'Sleep', sub: sleepH < 5 ? 'Severely deprived' : sleepH < 7 ? 'Below optimal' : 'Good', val: Math.min(Math.round((sleepH / 10) * 100), 100), weight: '5%', color: sleepH < 5 ? 'var(--danger)' : sleepH < 7 ? 'var(--avg)' : 'var(--good)', bg: sleepH < 5 ? '#FDECEC' : sleepH < 7 ? '#FEF5E7' : '#EEF9EE', icon: sleepH < 6 ? '↓' : '↑' },
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
