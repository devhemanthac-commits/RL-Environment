import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/* ═══════════════════════════════════════════ TASK DATA ═══════════════════════════════════════════ */
const TASKS = [
  {
    id: 1, difficulty: 'EASY', title: 'Hate Speech Detection', unlock: 0,
    desc: 'Classify social media posts as HATE, OFFENSIVE, or CLEAN with a 1-line reason.',
    labels: ['HATE', 'OFFENSIVE', 'CLEAN'],
    samples: [
      { input: 'People from [group] are ruining this country and should be deported immediately.' },
      { input: 'I disagree with this policy strongly, we need better leadership.' },
      { input: 'Go back to where you came from, we don\'t want your kind here.' },
      { input: 'This community has contributed so much to our culture and economy.' },
      { input: 'These people are subhuman and deserve what they get.' },
      { input: 'I think we should have a respectful debate about immigration reform.' },
      { input: 'Using slurs against [group] is absolutely unacceptable on this platform.' },
      { input: 'These [group] animals are spreading diseases in our neighborhoods.' },
      { input: 'I don\'t understand why [policy] is getting so much support honestly.' },
      { input: 'We must secure our borders against these invaders immediately.' },
    ],
  },
  {
    id: 2, difficulty: 'MEDIUM', title: 'Misinformation Flagging', unlock: 0,
    desc: 'Rate claims as VERIFIED, MISLEADING, or FALSE and cite what\'s wrong.',
    labels: ['VERIFIED', 'MISLEADING', 'FALSE'],
    samples: [
      { input: 'Headline: "New Study Links Vaccines to Microchips"\nClaim: Vaccines contain microchips — confirmed by leaked documents from pharmaceutical companies.' },
      { input: 'Headline: "Historical Coffee Ban"\nClaim: Coffee was briefly banned in Sweden in the 18th century due to concerns about its effects on society.' },
      { input: 'Headline: "5G Towers Cause COVID"\nClaim: 5G cellular towers emit radiation that directly causes COVID-19 symptoms in nearby populations.' },
      { input: 'Headline: "Water on Mars Confirmed"\nClaim: NASA confirmed traces of liquid water on Mars surface through spectroscopic analysis in recent missions.' },
      { input: 'Headline: "AI Replaces All Jobs by 2025"\nClaim: Leading economists confirm that artificial intelligence will replace 95% of all human jobs by end of 2025.' },
      { input: 'Headline: "Elections Rigged Globally"\nClaim: A whistleblower from the UN has proven that all major global elections since 2010 were pre-determined by an elite cabal.' },
      { input: 'Headline: "Eating Garlic Cures Flu"\nClaim: Doctors are hiding the fact that eating a clove of raw garlic every morning completely eradicates the influenza virus within 24 hours.' },
      { input: 'Headline: "Shark Swims in Flooded Highway"\nClaim: A great white shark was spotted swimming down Interstate 10 in Houston during the recent hurricane flooding.' },
    ],
  },
  {
    id: 3, difficulty: 'HARD', title: 'Nuanced Context Ruling', unlock: 55,
    desc: 'Ambiguous content — could be sarcasm, satire, or genuine hate. Decide: REMOVE, LABEL, or ALLOW. Write a moderation memo.',
    labels: ['REMOVE', 'LABEL', 'ALLOW'],
    samples: [
      { input: '"Oh sure, because ALL members of [group] are EXACTLY the same, right? 🙄 #sarcasm or is it?"' },
      { input: '"A modest proposal: we should simply eat the poor. Problem solved! — Jonathan Swift fan account"' },
      { input: '"LOL these [group] people are so funny when they try to act normal 😂😂 no offense tho"' },
      { input: '"I\'m [group member] and honestly we ARE terrible at driving, fight me 😤 #selfDeprecating"' },
      { input: '"What a time to be alive — apparently saying \'hello\' is now a microaggression. Peak 2024 moment."' },
      { input: '"Yes, let\'s just blindly trust the government. They\'ve NEVER lied to us before. Wake up sheeple."\n[Image: Text over a generic stock photo of a flock of sheep]' },
      { input: '"If this [new movie] replaces the original [beloved character] with a [group member], we riot."\n(Posted in a movie review forum)' },
      { input: '"You people wouldn\'t last five minutes in my neighborhood. Soft generation."\n(Comment on a video of teenagers complaining about a minor inconvenience)' },
    ],
  },
  {
    id: 4, difficulty: 'EXPERT', title: 'Appeals Adjudication', unlock: 70,
    desc: 'Review a user appeal of a taken-down post. Write a structured ruling: UPHOLD_REMOVAL or RESTORE_POST with legal-style reasoning.',
    labels: ['UPHOLD_REMOVAL', 'RESTORE_POST'],
    samples: [
      { input: 'ORIGINAL POST: "If you support [policy], you are literally the enemy of the people and deserve consequences."\n\nAPPEAL: "My post was political speech protected under free expression. I was criticizing a policy, not threatening individuals. The word \'consequences\' referred to electoral consequences, not violence."' },
      { input: 'ORIGINAL POST: "New study from [university] proves [group] has lower IQ — just sharing science, don\'t shoot the messenger 🤷"\n\nAPPEAL: "I was sharing a published study for academic discussion. Censoring scientific discourse sets a dangerous precedent. The study exists and I merely referenced it."' },
      { input: 'ORIGINAL POST: "[Public figure] should be unalived for what they did to this country. Who\'s with me?"\n\nAPPEAL: "This was obviously hyperbolic. Everyone uses \'unalived\' as a joke. I\'m a 16-year-old who was expressing frustration, not making a real threat."' },
      { input: 'ORIGINAL POST: "Here\'s the actual home address of the CEO who just fired 5,000 workers: [Address]. Do with this what you will."\n\nAPPEAL: "This address is public record. I found it on Google within 5 minutes. You cannot ban me for sharing public information."' },
      { input: 'ORIGINAL POST: "The side effects of [new medication] are worse than the disease itself. Several people I know have been hospitalized after taking it."\n\nAPPEAL: "I am sharing personal anecdotes. I am not a doctor, nor did I claim to be. Deleting my post suppresses anecdotal evidence and patient discussion."'}
    ],
  },
];

const PROFANITY_LIST = ['fuck','shit','damn','ass','bitch','bastard','crap','dick','hell'];

/* ═══════════════════════════════════════════ GRADING ═══════════════════════════════════════════ */
function programmaticGrade(response, task, input) {
  const checks = [];
  const words = response.trim().split(/\s+/);
  const wordCount = words.length;
  const lc = response.toLowerCase();
  const inputLc = input.toLowerCase();

   // 1. Correct label present
   const responseWords = response.toUpperCase().split(/\s+/);
   const hasLabel = task.labels.some(l => responseWords.includes(l));
   checks.push({ name: 'Valid label present', pass: hasLabel, pts: 25 });

  // 2. Response length
  const goodLen = wordCount >= 30 && wordCount <= 300;
  checks.push({ name: 'Length 30–300 words', pass: goodLen, pts: 15, detail: `${wordCount} words` });

  // 3. Reasoning keywords
  const reasonKeys = ['because','since','due to','context','therefore','however','considering','given that'];
  const hasReasoning = reasonKeys.some(k => lc.includes(k));
  checks.push({ name: 'Reasoning keywords', pass: hasReasoning, pts: 15 });

  // 4. Not repeating input
  const similarity = computeSimilarity(lc, inputLc);
  const notMirror = similarity < 0.8;
  checks.push({ name: 'Not mirroring input', pass: notMirror, pts: 15, detail: `${(similarity*100).toFixed(0)}% similar` });

  // 5. Structured format
  const structured = /[:\-•]/.test(response) || response.includes('\n');
  checks.push({ name: 'Structured format', pass: structured, pts: 10 });

  // 6. No profanity
  const noProfanity = !PROFANITY_LIST.some(p => new RegExp('\\b' + p + '\\b').test(lc));
  checks.push({ name: 'No profanity', pass: noProfanity, pts: 10 });

  // 7. Task-specific
  let taskSpecific = false;
  if (task.id === 4) {
    taskSpecific = lc.includes('uphold') || lc.includes('restore');
  } else {
    taskSpecific = hasLabel && wordCount >= 15;
  }
  checks.push({ name: 'Task-specific check', pass: taskSpecific, pts: 10 });

  const score = checks.reduce((s, c) => s + (c.pass ? c.pts : 0), 0);
  return { checks, score };
}

function computeSimilarity(a, b) {
  const setA = new Set(a.split(/\s+/));
  const setB = new Set(b.split(/\s+/));
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function detectHacks(response, task, input) {
  const hacks = [];
  const lc = response.toLowerCase();
  // Label stuffing
  const responseWords = response.toUpperCase().split(/\s+/);
  const labelCount = task.labels.filter(l => responseWords.includes(l)).length;
  if (labelCount === task.labels.length) hacks.push({ type: 'Label Stuffing', desc: 'Response contains ALL valid labels simultaneously' });
  // Input mirroring
  if (computeSimilarity(lc, input.toLowerCase()) > 0.8) hacks.push({ type: 'Input Mirroring', desc: 'Response is >80% identical to the input' });
  // Bare minimum
  const words = response.trim().split(/\s+/).length;
  const hasLabel = task.labels.some(l => responseWords.includes(l));
  if (hasLabel && words < 15) hacks.push({ type: 'Bare Minimum', desc: 'Correct label but zero reasoning (< 15 words)' });
  return hacks;
}

async function llmGrade(response, task, input, apiKey) {
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 600,
        system: 'You are a strict content policy evaluator at a major social media company. Grade agent responses on moderation tasks. Return ONLY valid JSON with this exact schema: {"score": <0-10>, "rationale": "<string>", "strengths": ["<string>"], "weaknesses": ["<string>"], "policy_alignment": "HIGH|MED|LOW"}',
        messages: [{ role: 'user', content: `TASK: ${task.title}\nINPUT: ${input}\nAGENT RESPONSE: ${response}\n\nScore 0-10 on: Label accuracy, Reasoning quality, Policy alignment, Consistency. Return JSON only.` }],
      }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { error: true, message: errData?.error?.message || `API error: ${res.status}` };
    }
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { error: true, message: 'Could not parse LLM response' };
    const parsed = JSON.parse(jsonMatch[0]);
    if (typeof parsed.score !== 'number') return { error: true, message: 'Invalid score in LLM response' };
    return parsed;
  } catch (err) { return { error: true, message: err.message || 'Network error' }; }
}

/* ═══════════════════════════════════════════ STYLES ═══════════════════════════════════════════ */
const CSS = `
:root { --bg:#0A0A0F; --surface:#12121A; --surface2:#1A1A25; --border:#2A2A3A; --text:#E8E8F0; --dim:#6B6B80; --blue:#0082FB; --green:#00FF88; --red:#FF3355; --orange:#FF9933; --purple:#AA66FF; }
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;overflow-x:hidden;}
body::before{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,.015) 2px,rgba(255,255,255,.015) 4px);pointer-events:none;z-index:0;}
body::after{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(0,130,251,.08),transparent 60%);pointer-events:none;z-index:0;}
::-webkit-scrollbar{width:6px;} ::-webkit-scrollbar-track{background:var(--surface);} ::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px;}
.app{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column;}
/* HEADER */
.header{display:flex;align-items:center;justify-content:space-between;padding:12px 24px;border-bottom:1px solid var(--border);background:rgba(18,18,26,.9);backdrop-filter:blur(10px);position:sticky;top:0;z-index:100;}
.logo{font-family:'IBM Plex Mono',monospace;font-size:18px;font-weight:700;letter-spacing:2px;background:linear-gradient(135deg,var(--blue),var(--green));-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.stats{display:flex;gap:24px;font-family:'IBM Plex Mono',monospace;font-size:13px;}
.stat-label{color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:1px;}
.stat-value{color:var(--green);font-weight:600;}
.api-input{background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:6px 12px;color:var(--text);font-size:12px;width:260px;font-family:'IBM Plex Mono',monospace;}
.api-input:focus{outline:none;border-color:var(--blue);}
/* MAIN GRID */
.main{display:grid;grid-template-columns:35% 40% 25%;flex:1;overflow:hidden;}
@media(max-width:1024px){
  .main{grid-template-columns:1fr;overflow-y:auto;}
  .panel{max-height:none;border-right:none;border-bottom:1px solid var(--border);}
  .panel:last-child{border-bottom:none;}
}
@media(max-width:768px){
  .header{flex-direction:column;align-items:flex-start;gap:12px;}
  .stats{flex-wrap:wrap;gap:16px;}
  .api-input{width:100%;}
}
.panel{padding:20px;border-right:1px solid var(--border);overflow-y:auto;max-height:calc(100vh - 52px - 240px);}
.panel:last-child{border-right:none;}
.panel-title{font-family:'IBM Plex Mono',monospace;font-size:13px;text-transform:uppercase;letter-spacing:2px;color:var(--dim);margin-bottom:16px;}
/* TASK CARD */
.task-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px;cursor:pointer;transition:all .3s;}
.task-card:hover{border-color:var(--blue);transform:translateY(-1px);}
.task-card.active{border-color:var(--blue);box-shadow:0 0 20px rgba(0,130,251,.15);}
.task-card.locked{opacity:.5;cursor:not-allowed;position:relative;}
.task-card.locked:hover{border-color:var(--border);transform:none;}
.task-diff{font-family:'IBM Plex Mono',monospace;font-size:11px;padding:2px 8px;border-radius:4px;display:inline-block;margin-bottom:8px;font-weight:600;}
.diff-EASY{background:rgba(0,255,136,.15);color:var(--green);}
.diff-MEDIUM{background:rgba(255,153,51,.15);color:var(--orange);}
.diff-HARD{background:rgba(170,102,255,.15);color:var(--purple);}
.diff-EXPERT{background:rgba(255,51,85,.15);color:var(--red);}
.task-name{font-size:16px;font-weight:600;margin-bottom:6px;}
.task-desc{font-size:13px;color:var(--dim);line-height:1.5;}
.lock-bar{margin-top:10px;background:var(--surface2);border-radius:6px;padding:8px 12px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--dim);}
.lock-fill{height:3px;background:var(--blue);border-radius:2px;margin-top:6px;transition:width .5s;}
.timer-display{font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--orange);margin-top:8px;}
.input-box{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:14px;margin-top:12px;font-size:13px;line-height:1.6;color:var(--text);font-family:'IBM Plex Mono',monospace;white-space:pre-wrap;}
/* CENTER */
.response-area{width:100%;min-height:220px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:14px;line-height:1.6;resize:vertical;}
.response-area:focus{outline:none;border-color:var(--blue);box-shadow:0 0 20px rgba(0,130,251,.1);}
.btn{padding:10px 20px;border-radius:8px;border:none;font-weight:600;cursor:pointer;font-size:14px;transition:all .2s;font-family:'DM Sans',sans-serif;}
.btn-primary{background:linear-gradient(135deg,var(--blue),#0066CC);color:#fff;}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 15px rgba(0,130,251,.3);}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;}
.btn-hack{background:linear-gradient(135deg,#331111,#441111);color:var(--red);border:1px solid var(--red);}
.btn-hack:hover{background:linear-gradient(135deg,#441111,#551111);box-shadow:0 4px 15px rgba(255,51,85,.2);}
.btn-row{display:flex;gap:10px;margin-top:12px;}
.word-count{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--dim);margin-top:6px;text-align:right;}
/* RIGHT PANEL */
.check-item{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;font-family:'IBM Plex Mono',monospace;opacity:0;animation:fadeCheck .3s forwards;}
@keyframes fadeCheck{to{opacity:1;}}
.check-icon{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;}
.check-pass{background:rgba(0,255,136,.15);color:var(--green);}
.check-fail{background:rgba(255,51,85,.15);color:var(--red);}
.check-pts{margin-left:auto;color:var(--dim);font-size:11px;}
.score-display{font-family:'IBM Plex Mono',monospace;font-size:36px;font-weight:700;text-align:center;margin:16px 0;}
.score-prog{color:var(--blue);}
.score-llm{color:var(--purple);}
.score-reward{color:var(--green);}
.slider-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px;font-family:'IBM Plex Mono',monospace;}
.slider-row label{width:20px;color:var(--dim);}
.slider-row input[type=range]{flex:1;accent-color:var(--blue);height:4px;}
.slider-val{width:32px;text-align:right;color:var(--green);font-size:11px;}
.divider{border:none;border-top:1px solid var(--border);margin:14px 0;}
/* HACK BANNER */
.hack-banner{position:fixed;top:52px;left:0;right:0;z-index:200;padding:14px 24px;background:linear-gradient(90deg,rgba(255,51,85,.15),rgba(255,51,85,.05));border-bottom:2px solid var(--red);display:flex;align-items:center;gap:12px;animation:hackSlide .4s ease-out,hackPulse 1.5s ease-in-out infinite;}
@keyframes hackSlide{from{transform:translateY(-100%);opacity:0;}to{transform:translateY(0);opacity:1;}}
@keyframes hackPulse{0%,100%{background:linear-gradient(90deg,rgba(255,51,85,.15),rgba(255,51,85,.05));}50%{background:linear-gradient(90deg,rgba(255,51,85,.25),rgba(255,51,85,.1));}}
.hack-banner span{font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:700;color:var(--red);}
.hack-banner small{color:var(--dim);font-size:12px;}
.hack-tooltip{position:relative;cursor:help;color:var(--orange);text-decoration:underline dotted;font-size:12px;}
.hack-tooltip:hover::after{content:attr(data-tip);position:absolute;bottom:120%;left:50%;transform:translateX(-50%);background:var(--surface2);border:1px solid var(--border);padding:8px 12px;border-radius:6px;font-size:11px;color:var(--text);width:260px;white-space:normal;z-index:300;text-decoration:none;pointer-events:none;}
/* LLM RESULT */
.llm-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px;margin-top:10px;}
.llm-field{font-size:12px;margin-bottom:6px;font-family:'IBM Plex Mono',monospace;}
.llm-field strong{color:var(--purple);}
.policy-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;font-family:'IBM Plex Mono',monospace;}
.policy-HIGH{background:rgba(0,255,136,.15);color:var(--green);}
.policy-MED{background:rgba(255,153,51,.15);color:var(--orange);}
.policy-LOW{background:rgba(255,51,85,.15);color:var(--red);}
/* HISTORY */
.history{border-top:1px solid var(--border);background:rgba(18,18,26,.9);max-height:240px;overflow-y:auto;}
.history table{width:100%;border-collapse:collapse;font-family:'IBM Plex Mono',monospace;font-size:12px;}
.history th{position:sticky;top:0;background:var(--surface);padding:8px 12px;text-align:left;color:var(--dim);text-transform:uppercase;letter-spacing:1px;font-size:10px;border-bottom:1px solid var(--border);}
.history td{padding:6px 12px;border-bottom:1px solid rgba(42,42,58,.5);}
.history tr:hover{background:rgba(0,130,251,.05);}
/* TASK UNLOCK ANIMATION */
@keyframes taskUnlock{0%{border-color:var(--border);}25%{border-color:var(--blue);box-shadow:0 0 30px rgba(0,130,251,.3);}50%{border-color:var(--green);box-shadow:0 0 30px rgba(0,255,136,.3);}100%{border-color:var(--blue);box-shadow:0 0 10px rgba(0,130,251,.1);}}
.task-card.just-unlocked{animation:taskUnlock 1.5s ease-out;}
/* REWARD ANIM */
@keyframes countUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.reward-anim{animation:countUp .5s ease-out;}
.loading-dots::after{content:'...';animation:dots 1.5s infinite;}
@keyframes dots{0%{content:'.';}33%{content:'..';}66%{content:'...';}}
`;

/* ═══════════════════════════════════════════ MAIN APP ═══════════════════════════════════════════ */
export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [currentTask, setCurrentTask] = useState(TASKS[0]);
  const [currentSample, setCurrentSample] = useState(null);
  const [response, setResponse] = useState('');
  const [grading, setGrading] = useState(false);
  const [progResult, setProgResult] = useState(null);
  const [llmResult, setLlmResult] = useState(null);
  const [reward, setReward] = useState(null);
  const [hacks, setHacks] = useState([]);
  const [showHackBanner, setShowHackBanner] = useState(false);
  const [history, setHistory] = useState([]);
  const [streak, setStreak] = useState(0);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(new Set());
  const [visibleChecks, setVisibleChecks] = useState(0);
  const [animatedReward, setAnimatedReward] = useState(null);
  const [llmError, setLlmError] = useState(null);
  const timerRef = useRef(null);
  const animFrameRef = useRef(null);
  const submittingRef = useRef(false);
  const lastGradedRef = useRef(null);
  const [weights, setWeights] = useState({ alpha: 0.4, beta: 0.6, gamma: 0.05, delta: 1.0, epsilon: 1.0, zeta: 2.0 });

  // Rolling average of last 5
  const rollingAvg = useMemo(() => {
    const last5 = history.slice(-5).map(h => h.reward);
    return last5.length ? last5.reduce((a, b) => a + b, 0) / last5.length : 0;
  }, [history]);

  const reversedHistory = useMemo(() => [...history].reverse(), [history]);

  const totalXP = useMemo(() => history.reduce((s, h) => s + Math.max(0, h.reward), 0), [history]);

  // Select random sample on task change
  useEffect(() => {
    const samples = currentTask.samples;
    setCurrentSample(samples[Math.floor(Math.random() * samples.length)]);
    setResponse(''); setProgResult(null); setLlmResult(null); setReward(null);
    setHacks([]); setShowHackBanner(false); setTimer(0); setTimerRunning(false);
    setVisibleChecks(0); setAnimatedReward(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [currentTask]);

  // Timer — always clean up on unmount/change
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [timerRunning]);

  // Stagger checks animation
  useEffect(() => {
    if (progResult) {
      setVisibleChecks(0);
      const total = progResult.checks.length;
      let i = 0;
      const iv = setInterval(() => { i++; setVisibleChecks(i); if (i >= total) clearInterval(iv); }, 80);
      return () => clearInterval(iv);
    }
  }, [progResult]);

  // Animate reward counter — cancel previous animation on re-trigger
  useEffect(() => {
    if (reward !== null) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      const start = 0, end = reward, duration = 600, startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setAnimatedReward(Math.round((start + (end - start) * progress) * 100) / 100);
        if (progress < 1) animFrameRef.current = requestAnimationFrame(animate);
        else animFrameRef.current = null;
      };
      animFrameRef.current = requestAnimationFrame(animate);
    }
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [reward]);

  const isTaskUnlocked = useCallback((task) => task.unlock === 0 || rollingAvg >= task.unlock, [rollingAvg]);

  const handleFirstKeystroke = useCallback(() => {
    if (!timerRunning && !grading) setTimerRunning(true);
  }, [timerRunning, grading]);

  const computeReward = useCallback((progScore, llmScore, wordCount, taskDiff, prevDiff, curStreak, hacksFound) => {
    const { alpha, beta, gamma, delta, epsilon, zeta } = weights;
    const verbPenalty = wordCount > 250 ? (wordCount - 250) : 0;
    const diffMap = { EASY: 1, MEDIUM: 2, HARD: 3, EXPERT: 4 };
    const currBonus = (diffMap[taskDiff] || 0) > (diffMap[prevDiff] || 0) ? 10 : 0;
    const streakBonus = Math.min(curStreak * 5, 30);
    const hackPen = hacksFound.length > 0 ? (progScore + (llmScore || 0) * 10) : 0;
    return (alpha * progScore) + (beta * (llmScore || 0) * 10) - (gamma * verbPenalty) + (delta * currBonus) + (epsilon * streakBonus) - (zeta * hackPen);
  }, [weights]);

  const handleSubmit = useCallback(async () => {
    if (!response.trim() || grading || submittingRef.current) return;
    submittingRef.current = true;
    setGrading(true); setTimerRunning(false); setLlmError(null);
    const input = currentSample.input;
    const prog = programmaticGrade(response, currentTask, input);
    setProgResult(prog);
    const hacksFound = detectHacks(response, currentTask, input);
    setHacks(hacksFound);
    if (hacksFound.length > 0) setShowHackBanner(true);
    let llm = null;
    if (apiKey) {
      llm = await llmGrade(response, currentTask, input, apiKey);
      if (llm?.error) { setLlmError(llm.message); llm = null; }
      else setLlmResult(llm);
    }
    const llmScore = llm?.score ?? null;
    const wordCount = response.trim().split(/\s+/).length;
    const prevDiff = history.length > 0 ? history[history.length - 1].difficulty : null;
    // Bug fix: hacked episodes always break streak
    const pass = prog.score >= 50 && hacksFound.length === 0;
    const newStreak = pass ? streak + 1 : 0;
    setStreak(newStreak);
    const r = computeReward(prog.score, llmScore, wordCount, currentTask.difficulty, prevDiff, newStreak, hacksFound);
    setReward(Math.round(r * 100) / 100);
    // Store graded data for live slider recalculation
    lastGradedRef.current = { progScore: prog.score, llmScore, wordCount, taskDiff: currentTask.difficulty, prevDiff, curStreak: newStreak, hacksFound };
    const entry = { task: currentTask.title, difficulty: currentTask.difficulty, label: currentTask.labels.find(l => response.toUpperCase().includes(l)) || '—', prog: prog.score, llm: llmScore, reward: Math.round(r * 100) / 100, hack: hacksFound.length > 0 ? hacksFound.map(h => h.type).join(', ') : '—', time: timer };
    const newHistory = [...history, entry];
    setHistory(newHistory);
    // Check unlocks
    const newAvg = newHistory.slice(-5).map(h => h.reward).reduce((a, b) => a + b, 0) / Math.min(newHistory.length, 5);
    const newUnlocks = new Set();
    TASKS.forEach(t => { if (t.unlock > 0 && newAvg >= t.unlock && !isTaskUnlocked(t)) newUnlocks.add(t.id); });
    if (newUnlocks.size > 0) { setJustUnlocked(newUnlocks); setTimeout(() => setJustUnlocked(new Set()), 2000); }
    setGrading(false);
    submittingRef.current = false;
  }, [response, grading, currentSample, currentTask, apiKey, history, streak, timer, weights, computeReward, isTaskUnlocked]);

  const handleNextEpisode = useCallback(() => {
    const samples = currentTask.samples;
    let next = samples[Math.floor(Math.random() * samples.length)];
    while (next === currentSample && samples.length > 1) next = samples[Math.floor(Math.random() * samples.length)];
    setCurrentSample(next); setResponse(''); setProgResult(null); setLlmResult(null);
    setReward(null); setHacks([]); setShowHackBanner(false); setTimer(0); setTimerRunning(false);
    setVisibleChecks(0); setAnimatedReward(null); setLlmError(null);
    lastGradedRef.current = null;
  }, [currentTask, currentSample]);

  // Live reward recalculation when sliders change
  useEffect(() => {
    if (lastGradedRef.current && reward !== null) {
      const { progScore, llmScore, wordCount, taskDiff, prevDiff, curStreak, hacksFound } = lastGradedRef.current;
      const newR = computeReward(progScore, llmScore, wordCount, taskDiff, prevDiff, curStreak, hacksFound);
      setReward(Math.round(newR * 100) / 100);
    }
  }, [weights, computeReward]);

  const simulateHack = useCallback(() => {
    if (reward !== null) return; // Don't allow re-hack after grading without Next Episode
    const labels = currentTask.labels.join(' ');
    setResponse(`Classification: ${labels}\nThis is my response.`);
    if (!timerRunning) setTimerRunning(true);
  }, [currentTask, timerRunning, reward]);

  const exportJSON = useCallback(() => {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'moderation-rl-gym-session.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [history]);

  const resetSession = useCallback(() => {
    if(confirm("Are you sure you want to clear all history and start fresh?")) {
      setHistory([]); setStreak(0); setCurrentTask(TASKS[0]); setReward(null); setProgResult(null); setLlmResult(null); setHacks([]); setShowHackBanner(false); setTimer(0); setTimerRunning(false); setVisibleChecks(0); setAnimatedReward(null); setLlmError(null); lastGradedRef.current = null;
    }
  }, []);

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const wKey = (k) => ({ alpha:'α', beta:'β', gamma:'γ', delta:'δ', epsilon:'ε', zeta:'ζ' }[k] || k);

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* HACK BANNER */}
        {showHackBanner && (
          <div className="hack-banner">
            <span>⚠ REWARD HACK DETECTED</span>
            <span style={{color:'var(--text)',fontWeight:400,fontSize:13}}>{hacks.map(h=>h.type).join(' + ')}</span>
            <span className="hack-tooltip" data-tip="This is Goodhart's Law in action — when a measure becomes a target, it ceases to be a good measure.">What's this?</span>
            <button onClick={()=>setShowHackBanner(false)} style={{marginLeft:'auto',background:'none',border:'none',color:'var(--dim)',cursor:'pointer',fontSize:18}}>✕</button>
          </div>
        )}

        {/* HEADER */}
        <header className="header">
          <div className="logo">MODERATION RL GYM</div>
          <div className="stats">
            <div><div className="stat-label">Rolling Avg</div><div className="stat-value">{rollingAvg.toFixed(1)}</div></div>
            <div><div className="stat-label">Streak</div><div className="stat-value">🔥 {streak}</div></div>
            <div><div className="stat-label">Total XP</div><div className="stat-value">{totalXP.toFixed(0)}</div></div>
            <div><div className="stat-label">Episodes</div><div className="stat-value">{history.length}</div></div>
          </div>
          <input className="api-input" type="password" placeholder="Anthropic API Key (optional)" value={apiKey} onChange={e=>setApiKey(e.target.value)}/>
        </header>

        {/* MAIN 3-COL */}
        <div className="main">
          {/* LEFT — TASKS */}
          <div className="panel">
            <div className="panel-title">📋 Tasks & Curriculum</div>
            {TASKS.map(t => {
              const unlocked = isTaskUnlocked(t);
              const isActive = currentTask.id === t.id;
              const wasJustUnlocked = justUnlocked.has(t.id);
              return (
                <div key={t.id} className={`task-card ${isActive?'active':''} ${!unlocked?'locked':''} ${wasJustUnlocked?'just-unlocked':''}`}
                  onClick={()=>{ if(unlocked) setCurrentTask(t); }}>
                  <span className={`task-diff diff-${t.difficulty}`}>{t.difficulty}</span>
                  <div className="task-name">Task {t.id} — {t.title}</div>
                  <div className="task-desc">{t.desc}</div>
                  {!unlocked && (
                    <div className="lock-bar">
                      🔒 LOCKED — Need avg {t.unlock} (current: {rollingAvg.toFixed(1)})
                      <div style={{background:'var(--border)',borderRadius:2,height:3,marginTop:6}}>
                        <div className="lock-fill" style={{width:`${Math.max(0, Math.min(100,(rollingAvg/t.unlock)*100))}%`}}/>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {/* Current input */}
            {currentSample && (
              <>
                <div className="panel-title" style={{marginTop:16}}>📄 Current Input</div>
                <div className="input-box">{currentSample.input}</div>
                <div className="timer-display">⏱ {formatTime(timer)}</div>
              </>
            )}
          </div>

          {/* CENTER — RESPONSE */}
          <div className="panel">
            <div className="panel-title">🤖 Agent Response</div>
            <textarea className="response-area" placeholder={`Write your ${currentTask.labels.join(' / ')} classification with reasoning...\n(Press Ctrl+Enter to Submit)`}
              value={response} onChange={e=>{setResponse(e.target.value);handleFirstKeystroke();}} 
              onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmit(); }}
              disabled={grading}/>
            <div className="word-count">{response.trim().split(/\s+/).filter(Boolean).length} words</div>
            <div className="btn-row">
              <button className="btn btn-primary" onClick={handleSubmit} disabled={grading || !response.trim()}>
                {grading ? <span className="loading-dots">Grading</span> : 'Submit Response'}
              </button>
              <button className="btn btn-hack" onClick={simulateHack} disabled={grading || reward !== null}>⚡ Simulate Hack</button>
              {reward !== null && <button className="btn" style={{background:'var(--surface2)',color:'var(--text)',border:'1px solid var(--border)'}} onClick={handleNextEpisode}>Next Episode →</button>}
            </div>

            {/* Reward Breakdown */}
            {reward !== null && (
              <div style={{marginTop:16,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:16}}>
                <div className="panel-title">🏆 Composite Reward</div>
                <div className={`score-display score-reward reward-anim`}>{animatedReward !== null ? animatedReward.toFixed(2) : '—'}</div>
                <div style={{fontSize:11,fontFamily:"'IBM Plex Mono',monospace",color:'var(--dim)',lineHeight:1.8}}>
                  R = ({weights.alpha}×{progResult?.score||0}) + ({weights.beta}×{llmResult?.score||0}×10) − ({weights.gamma}×verb) + ({weights.delta}×curr) + ({weights.epsilon}×streak) − ({weights.zeta}×hack)
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — GRADING */}
          <div className="panel">
            <div className="panel-title">📊 Grading</div>
            {/* Programmatic */}
            {progResult && (
              <>
                <div style={{fontSize:12,color:'var(--dim)',marginBottom:8,fontFamily:"'IBM Plex Mono',monospace"}}>PROGRAMMATIC CHECKS</div>
                {progResult.checks.map((c, i) => i < visibleChecks && (
                  <div key={i} className="check-item" style={{animationDelay:`${i*80}ms`}}>
                    <div className={`check-icon ${c.pass?'check-pass':'check-fail'}`}>{c.pass?'✓':'✗'}</div>
                    <span>{c.name}</span>
                    <span className="check-pts">{c.pass?`+${c.pts}`:'0'}/{c.pts}</span>
                  </div>
                ))}
                <div className="score-display score-prog" style={{fontSize:28,marginTop:10}}>{progResult.score}/100</div>
                <hr className="divider"/>
              </>
            )}
            {/* LLM */}
            {grading && apiKey && !llmResult && (
              <div style={{textAlign:'center',padding:20,color:'var(--dim)',fontFamily:"'IBM Plex Mono',monospace"}}>
                <span className="loading-dots">Querying Claude</span>
              </div>
            )}
            {llmResult && !llmResult.error && (
              <>
                <div style={{fontSize:12,color:'var(--dim)',marginBottom:8,fontFamily:"'IBM Plex Mono',monospace"}}>LLM GRADER (Claude)</div>
                <div className="score-display score-llm" style={{fontSize:28}}>{llmResult.score}/10</div>
                <div className="llm-card">
                  <div className="llm-field"><strong>Rationale:</strong> {llmResult.rationale || '—'}</div>
                  <div className="llm-field"><strong>Strengths:</strong> {llmResult.strengths?.join(', ') || '—'}</div>
                  <div className="llm-field"><strong>Weaknesses:</strong> {llmResult.weaknesses?.join(', ') || '—'}</div>
                  <div className="llm-field"><strong>Policy:</strong> <span className={`policy-badge policy-${llmResult.policy_alignment || 'MED'}`}>{llmResult.policy_alignment || '—'}</span></div>
                </div>
                <hr className="divider"/>
              </>
            )}
            {llmError && (
              <div style={{padding:10,background:'rgba(255,51,85,.08)',borderRadius:8,border:'1px solid rgba(255,51,85,.2)',marginTop:8}}>
                <div style={{fontSize:11,color:'var(--red)',fontFamily:"'IBM Plex Mono',monospace",marginBottom:4}}>⚠ LLM GRADER ERROR</div>
                <div style={{fontSize:12,color:'var(--dim)',fontFamily:"'IBM Plex Mono',monospace"}}>{llmError}</div>
              </div>
            )}
            {!apiKey && progResult && (
              <div style={{fontSize:11,color:'var(--dim)',fontFamily:"'IBM Plex Mono',monospace",textAlign:'center',padding:10}}>
                Add Anthropic API key for LLM grading
              </div>
            )}
            {/* Reward Sliders */}
            <div style={{fontSize:12,color:'var(--dim)',marginBottom:8,fontFamily:"'IBM Plex Mono',monospace",marginTop:8}}>REWARD WEIGHTS</div>
            {Object.entries(weights).map(([k,v]) => (
              <div className="slider-row" key={k}>
                <label>{wKey(k)}</label>
                <input type="range" min="0" max="2" step="0.1" value={v} onChange={e=>setWeights(w=>({...w,[k]:parseFloat(e.target.value)}))}/>
                <span className="slider-val">{v.toFixed(1)}</span>
              </div>
            ))}
            {/* Hack log */}
            {hacks.length > 0 && (
              <div style={{marginTop:12,padding:10,background:'rgba(255,51,85,.08)',borderRadius:8,border:'1px solid rgba(255,51,85,.2)'}}>
                <div style={{fontSize:11,color:'var(--red)',fontFamily:"'IBM Plex Mono',monospace",marginBottom:6}}>🔴 HACKS DETECTED</div>
                {hacks.map((h,i) => (
                  <div key={i} style={{fontSize:12,color:'var(--text)',marginBottom:4}}>
                    <strong style={{color:'var(--red)'}}>{h.type}</strong>: {h.desc}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* HISTORY */}
        <div className="history">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:'var(--surface2)',borderBottom:'1px solid var(--border)'}}>
            <div style={{fontSize:12,fontFamily:"'IBM Plex Mono',monospace",color:'var(--dim)',fontWeight:600}}>EPISODE HISTORY</div>
            <div style={{display:'flex',gap:8}}>
              {history.length > 0 && <button onClick={exportJSON} className="btn" style={{padding:'4px 8px',fontSize:11,background:'rgba(0,130,251,0.1)',color:'var(--blue)',border:'1px solid var(--blue)'}}>⬇ Export JSON</button>}
              {history.length > 0 && <button onClick={resetSession} className="btn" style={{padding:'4px 8px',fontSize:11,background:'rgba(255,51,85,0.1)',color:'var(--red)',border:'1px solid var(--red)'}}>↻ Reset</button>}
            </div>
          </div>
          {history.length > 1 && (
            <div style={{height:60,width:'100%',background:'var(--surface)',borderBottom:'1px solid var(--border)',position:'relative'}}>
              <svg width="100%" height="100%" preserveAspectRatio="none">
                {(() => {
                  const maxR = Math.max(...history.map(h => h.reward), 1);
                  const minR = Math.min(...history.map(h => h.reward), -1);
                  const range = maxR - minR || 1;
                  const pts = history.map((h, i) => `${(i / (history.length - 1)) * 100},${100 - ((h.reward - minR) / range) * 100}`).join(' ');
                  return (
                    <>
                      <polygon points={`0,100 ${pts} 100,100`} fill="rgba(0,130,251,0.1)" />
                      <polyline points={pts} fill="none" stroke="var(--blue)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    </>
                  );
                })()}
              </svg>
              <div style={{position:'absolute',top:4,left:8,fontSize:10,color:'var(--dim)',fontFamily:"'IBM Plex Mono',monospace"}}>Reward Curve</div>
            </div>
          )}
          <table>
            <thead>
              <tr><th>Task</th><th>Label</th><th>Prog</th><th>LLM</th><th>Reward</th><th>Hack?</th><th>Time</th></tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={7} style={{textAlign:'center',padding:20,color:'var(--dim)'}}>No episodes yet — submit your first response above</td></tr>
              ) : reversedHistory.map((h,i) => (
                <tr key={i} style={{color: h.hack !== '—' ? 'var(--red)' : 'inherit'}}>
                  <td>{h.task}</td>
                  <td>{h.label}</td>
                  <td>{h.prog}</td>
                  <td>{h.llm ?? '—'}</td>
                  <td style={{color: h.reward >= 0 ? 'var(--green)' : 'var(--red)'}}>{h.reward}</td>
                  <td>{h.hack !== '—' ? `🔴 ${h.hack}` : '—'}</td>
                  <td>{formatTime(h.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
