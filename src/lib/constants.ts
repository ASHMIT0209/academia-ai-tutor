export const SUBSTREAMS: Record<string, string[]> = {
  engineering: ['cs:Computer Science / IT', 'ec:Electronics / Electrical', 'me:Mechanical', 'ce:Civil', 'ch:Chemical', 'bi:Biotechnology'],
  science: ['phy:Physics', 'chem:Chemistry', 'math:Mathematics', 'stat:Statistics', 'bio:Biology'],
  commerce: ['fin:Finance', 'mkt:Marketing', 'hr:Human Resources', 'bba:Business Administration', 'eco:Economics'],
  arts: ['eng:English Literature', 'his:History', 'geo:Geography', 'pol:Political Science', 'psy:Psychology'],
  medical: ['mbbs:MBBS', 'pharm:Pharmacy', 'nursing:Nursing', 'bpt:Physiotherapy', 'bio:Biotechnology']
};

export const SUBSTREAM_SUBJECTS: Record<string, string[]> = {
  cs: ['Data Structures', 'Algorithms', 'DBMS', 'OS', 'Networks'],
  ec: ['Signals & Systems', 'Analog Electronics', 'Digital Circuits', 'Microprocessors', 'Control Systems'],
  me: ['Thermodynamics', 'Fluid Mechanics', 'Manufacturing', 'Materials Science', 'CAD'],
  ce: ['Structural Analysis', 'Geotechnics', 'Fluid Mechanics', 'Environmental Engineering', 'Surveying'],
  phy: ['Classical Mechanics', 'Electrodynamics', 'Quantum Mechanics', 'Thermodynamics', 'Optics'],
  chem: ['Organic Chemistry', 'Physical Chemistry', 'Analytical Chemistry', 'Inorganic Chemistry', 'Spectroscopy'],
  math: ['Calculus', 'Linear Algebra', 'Differential Equations', 'Statistics', 'Numerical Methods'],
  fin: ['Accounting', 'Financial Analysis', 'Corporate Finance', 'Economics', 'Statistics'],
  mkt: ['Marketing Management', 'Consumer Behavior', 'Brand Management', 'Digital Marketing', 'Research Methods'],
  eng: ['Literary Theory', 'Creative Writing', 'Linguistics', 'British Literature', 'Research Methods'],
  his: ['World History', 'Political History', 'Economic History', 'Research Methods', 'Historiography'],
  mbbs: ['Anatomy', 'Physiology', 'Biochemistry', 'Pharmacology', 'Pathology'],
  pharm: ['Pharmaceutics', 'Pharmacology', 'Medicinal Chemistry', 'Clinical Pharmacy', 'Pharmacognosy']
};

export const RESOURCES_BY_STREAM: Record<string, Record<string, string[]>> = {
  engineering: {
    cs: ['MIT OCW (ocw.mit.edu)', 'LeetCode for DSA', 'CS50 on edX', 'GeeksforGeeks', 'YouTube: Abdul Bari'],
    ec: ['NPTEL Electronics', 'All About Circuits', 'Khan Academy (Electrical)', 'Falstad Simulator', 'YouTube: Neso Academy'],
    me: ['NPTEL Mechanical', 'MIT Thermo OCW', 'Engineering Toolbox', 'YouTube: Efficient Engineer', 'Coursera: AutoCAD'],
    ce: ['NPTEL Civil', 'Structville.com', 'SketchUp Free', 'YouTube: Dr. Soil', 'Civil Eng. Academy']
  },
  science: {
    phy: ['MIT OCW Physics', 'Khan Academy', 'HyperPhysics', 'Coursera: Physics', 'YouTube: Walter Lewin'],
    chem: ['ChemLibreTexts', 'Khan Academy Chem', 'NPTEL Chemistry', 'Coursera: Chemistry', 'YouTube: Tyler DeWitt'],
    math: ['Paul\'s Online Math Notes', 'MIT OCW Math', 'Wolfram Alpha', 'Khan Academy', '3Blue1Brown (YouTube)']
  },
  commerce: {
    fin: ['Investopedia', 'Khan Academy Finance', 'Coursera: Wharton', 'CFA Institute Resources', 'CFI Free Courses'],
    mkt: ['HubSpot Academy', 'Coursera: Marketing', 'Google Skillshop', 'YouTube: Marketing 91', 'Philip Kotler Lectures']
  },
  arts: {
    eng: ['JSTOR', 'Project Gutenberg', 'Coursera: Writing', 'Purdue OWL', 'Google Scholar'],
    his: ['JSTOR', 'Khan Academy History', 'Coursera: History', 'Primary Source Databases', 'Oxford Reference']
  },
  medical: {
    mbbs: ['Grays Anatomy Online', 'Robbins Pathology', 'Medscape', 'AMBOSS Platform', 'YouTube: Armando Hasudungan'],
    pharm: ['PharmacyLibrary', 'Goodman & Gilman Online', 'USNLM Resources', 'Coursera: Pharmacology', 'YouTube: Strong Medicine']
  }
};
