import React, { useState, useCallback, useRef, createContext, useContext } from "react";
import "./GridGame.css";
import { runCCode } from "./judge0";
import { useScoreSubmission } from '../../../shared/hooks/useScoreSubmission';
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material";

// Theme bridge — every sub-component reads isDark via context instead of prop-drilling
const ThemeCtx = createContext(false);
const useIsDark = () => useContext(ThemeCtx);

// Star and scoring constants
const MAX_STAGES = 20;
const MAX_STARS_PER_STAGE = 3;
const MAX_POSSIBLE_STARS = MAX_STAGES * MAX_STARS_PER_STAGE; // 60
const DEFAULT_STARS = 1;

// ─── Constants ────────────────────────────────────────────────────────────────
const ROWS = 8;
const COLS = 8;
const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms));
const ANIM = 170;

// ─── Stage manifest ───────────────────────────────────────────────────────────
const STAGES = [
  { id:"watch",       title:"Watch a loop run",           difficulty:"Intro"    },
  { id:"fill",        title:"Fill in the blank",           difficulty:"Intro"    },
  { id:"direction",   title:"Choose the direction",        difficulty:"Intro"    },
  { id:"write1",      title:"Write one loop",              difficulty:"Beginner" },
  { id:"twoblanks",   title:"Two loops, two blanks",       difficulty:"Beginner" },
  { id:"choosedirs",  title:"Choose both directions",      difficulty:"Beginner" },
  { id:"write2",      title:"Write two loops",             difficulty:"Beginner" },
  { id:"debug",       title:"Fix the bugs",                difficulty:"Normal"   },
  { id:"obstacle",    title:"Navigate an obstacle",        difficulty:"Normal"   },
  { id:"countdown",   title:"Countdown loop",              difficulty:"Normal"   },
  { id:"coords",      title:"Read the coordinates",        difficulty:"Normal"   },
  { id:"while",       title:"Learn the while loop",        difficulty:"Hard"     },
  { id:"whilecond",   title:"While with a goal condition", difficulty:"Hard"     },
  { id:"nested",      title:"Nested loops",                difficulty:"Hard"     },
  { id:"multiobs",    title:"Multiple obstacles",          difficulty:"Hard"     },
  { id:"offbyone",    title:"Off-by-one errors",           difficulty:"Hard"     },
  { id:"reverse",     title:"Reverse direction",           difficulty:"Expert"   },
  { id:"collect",     title:"Collect all Pokémon",         difficulty:"Expert"   },
  { id:"shortest",    title:"Shortest path challenge",     difficulty:"Expert"   },
  { id:"grand",       title:"Grand challenge",             difficulty:"Master"   },
];

const DIFF_COLOR_LIGHT = {
  Intro:"#5b7c99", Beginner:"#2563a8", Normal:"#d97706",
  Hard:"#dc2626",  Expert:"#7c3aed",   Master:"#be185d",
};
const DIFF_COLOR_DARK = {
  Intro:"#a8b5c7", Beginner:"#60a5fa", Normal:"#fbbf24",
  Hard:"#f87171",  Expert:"#a78bfa",   Master:"#f472b6",
};
const diffColor = (d, isDark) => (isDark ? DIFF_COLOR_DARK : DIFF_COLOR_LIGHT)[d];

// ─── Core helpers ─────────────────────────────────────────────────────────────
const manhattan = (a,b) => Math.abs(a.row-b.row)+Math.abs(a.col-b.col);
const randInt   = (lo,hi) => Math.floor(Math.random()*(hi-lo+1))+lo;

function calcStars(used, min) {
  if (used <= min)                     return 3;
  if (used <= Math.ceil(min * 1.5))    return 2;
  return 1;
}

async function compileAndRun(src) {
  const wrapped = `#include <stdio.h>\n#define MOVE(r,c) printf("ROW=%d COL=%d\\n",(r),(c));\n${src}`;
  try {
    const res = await runCCode(wrapped);
    if (res.error)           return { err:"⚠️ Connection error." };
    if (res.compile_output)  return { err:"Syntax error:\n"+res.compile_output };
    if (res.stderr)          return { err:"Runtime error:\n"+res.stderr };
    const moves = (res.stdout||"").trim().split("\n")
      .map(l=>{ const m=l.match(/ROW=(\d+)\s+COL=(\d+)/); return m?{row:+m[1],col:+m[2]}:null; })
      .filter(Boolean);
    if (!moves.length) return { err:"No MOVE() calls found — make sure MOVE(r,c) is inside your loop." };
    return { moves };
  } catch { return { err:"⚠️ Could not reach the compiler." }; }
}

async function animatePath(moves, start, obstacles=[], setPos, setTrail, onObstacle, delay=ANIM) {
  let pos = {...start};
  const trail = [];
  for (const tgt of moves) {
    while (pos.row !== tgt.row) {
      const nr = pos.row + (tgt.row > pos.row ? 1 : -1);
      if (obstacles.some(o=>o.row===nr&&o.col===pos.col)) { await onObstacle({row:nr,col:pos.col}); return {pos,hit:true}; }
      pos={row:nr,col:pos.col}; trail.push({...pos}); setPos({...pos}); setTrail([...trail]); await SLEEP(delay);
    }
    while (pos.col !== tgt.col) {
      const nc = pos.col + (tgt.col > pos.col ? 1 : -1);
      if (obstacles.some(o=>o.row===pos.row&&o.col===nc)) { await onObstacle({row:pos.row,col:nc}); return {pos,hit:true}; }
      pos={row:pos.row,col:nc}; trail.push({...pos}); setPos({...pos}); setTrail([...trail]); await SLEEP(delay);
    }
  }
  return {pos, hit:false};
}

// ─── Shared UI components ─────────────────────────────────────────────────────

function Grid({player, targets=[], trail=[], flash=false, obstacles=[], flashCells=[]}) {
  const trailSet = new Set(trail.map(p=>`${p.row},${p.col}`));
  const obsSet   = new Set(obstacles.map(o=>`${o.row},${o.col}`));
  const tgtMap   = {};
  targets.forEach((t,i)=>{ if(!t.caught) tgtMap[`${t.row},${t.col}`]=t.emoji||"⭐"; });
  const flashSet = new Set(flashCells.map(p=>`${p.row},${p.col}`));

  return (
    <div className={`grid-board${flash?" flash-win":""}`}>
      {Array.from({length:ROWS},(_,r)=>(
        <div key={r} className="grid-row">
          {Array.from({length:COLS},(_,c)=>{
            const k=`${r},${c}`;
            const isP = player.row===r&&player.col===c;
            const tgt = tgtMap[k];
            const isO = obsSet.has(k);
            const isT = trailSet.has(k)&&!isP&&!isO;
            const isF = flashSet.has(k);
            return (
              <div key={c} className={`grid-cell${isP?" cell-player":""}${tgt?" cell-pokemon":""}${isO?" cell-obs":""}${isT?" cell-trail":""}${isF?" cell-flash":""}`}>
                {isP?"🧍":tgt||( isO?"🪨":isT?"·":"")}
              </div>
            );
          })}
        </div>
      ))}
      <div className="grid-caption">
        🧍({player.row},{player.col})
        {targets.filter(t=>!t.caught).map((t,i)=><span key={i}> · ⭐({t.row},{t.col})</span>)}
      </div>
    </div>
  );
}

function LoopCounter({current, max, label}) {
  if (!max||max<1) return null;
  return (
    <div className="lc-wrap">
      <div className="lc-header">
        <span className="lc-title">{label||"Loop counter"}</span>
        <span className="lc-i">i = <strong>{current??"-"}</strong></span>
      </div>
      <div className="lc-track">
        {Array.from({length:max},(_,i)=>(
          <div key={i} className={`lc-cell${current!==null&&i<current?" lc-past":""}${current!==null&&i===current?" lc-active":""}`}>{i}</div>
        ))}
      </div>
      <div className="lc-sub">{current!==null?`Iteration ${current+1} of ${max}`:`${max} total`}</div>
    </div>
  );
}

function CodeDisplay({code, activeLine}) {
  return (
    <div className="code-display">
      {code.split("\n").map((line,i)=>(
        <div key={i} className={`code-line${activeLine===i?" code-line-active":""}`}>
          <span className="code-ln">{i+1}</span>
          <span className="code-text">{line}</span>
        </div>
      ))}
    </div>
  );
}

const Callout = ({type,children}) => <div className={`callout callout-${type}`}>{children}</div>;

function Lesson({icon, text, sub}) {
  return (
    <div className="lesson-box">
      <span className="lesson-icon">{icon}</span>
      <div><p className="lesson-text">{text}</p>{sub&&<p className="lesson-sub">{sub}</p>}</div>
    </div>
  );
}

const BtnRow = ({children}) => <div className="btn-row">{children}</div>;

function ProgressBar({stage}) {
  const isDark = useIsDark();
  return (
    <div className="progress-bar">
      <div className="progress-track"><div className="progress-fill" style={{width:`${(stage/(STAGES.length-1))*100}%`}}/></div>
      <div className="progress-steps">
        {STAGES.map((s,i)=>(
          <div key={s.id} className={`progress-step${i<stage?" step-done":i===stage?" step-active":""}`}>
            <div className="progress-dot" style={i===stage?{boxShadow:`0 0 0 4px ${diffColor(s.difficulty, isDark)}33`}:{}}>
              {i<stage?"✓":i+1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DiffBadge = ({d}) => {
  const isDark = useIsDark();
  const c = diffColor(d, isDark);
  return (
    <span className="diff-badge" style={{background:c+"22",color:c,borderColor:c+"55"}}>{d}</span>
  );
};

// ─── Generic "run code" hook ──────────────────────────────────────────────────
function useRunner(initPlayer, initTargets=[], obstacles=[]) {
  const [player, setPlayer]   = useState({...initPlayer});
  const [targets, setTargets] = useState(initTargets.map(t=>({...t,caught:false})));
  const [trail, setTrail]     = useState([]);
  const [running, setRunning] = useState(false);
  const [flash, setFlash]     = useState(false);
  const [msg, setMsg]         = useState(null);
  const [msgType, setMsgType] = useState("info");
  const [won, setWon]         = useState(false);
  const [stars, setStars]     = useState(0);
  const [moveCount, setMoveCount] = useState(0);

  function reset(newPlayer, newTargets) {
    setPlayer({...(newPlayer||initPlayer)});
    setTargets((newTargets||initTargets).map(t=>({...t,caught:false})));
    setTrail([]); setFlash(false); setMsg(null); setWon(false); setStars(0); setMoveCount(0);
  }

  async function run(code, playerOverride, targetsOverride, obstaclesOverride) {
    const pl  = playerOverride  || player;
    const tgs = targetsOverride || targets;
    const obs = obstaclesOverride !== undefined ? obstaclesOverride : obstacles;

    setRunning(true); setMsg("⏳ Compiling…"); setMsgType("info");
    const {moves, err} = await compileAndRun(code);
    if (err) { setMsg(err); setMsgType("error"); setRunning(false); return {ok:false}; }

    setPlayer({...pl}); setTargets(tgs.map(t=>({...t,caught:false}))); setTrail([]); setFlash(false); setWon(false); setMsg(null);

    let stepCount = 0;
    const {pos, hit} = await animatePath(moves, pl, obs,
      (p)=>setPlayer(p),
      (t)=>{ setTrail(t); stepCount=t.length; setMoveCount(t.length); },
      async(obsPos)=>{ setMsg(`💥 Hit a rock at (${obsPos.row},${obsPos.col})! Reroute around it.`); setMsgType("error"); },
      ANIM
    );
    setRunning(false);
    if (hit) return {ok:false, pos};

    // check all targets caught
    const uncaught = tgs.filter(t=>!t.caught);
    if (uncaught.length === 1) {
      const tgt = uncaught[0];
      if (pos.row===tgt.row && pos.col===tgt.col) {
        const s = calcStars(stepCount, manhattan(pl, tgt));
        setStars(s); setFlash(true); setWon(true); setMoveCount(stepCount);
        return {ok:true, pos, steps:stepCount, stars:s};
      } else {
        const rd=tgt.row-pos.row, cd=tgt.col-pos.col;
        const parts=[];
        if (cd!==0) parts.push(`${Math.abs(cd)} col(s) ${cd>0?"right":"left"}`);
        if (rd!==0) parts.push(`${Math.abs(rd)} row(s) ${rd>0?"down":"up"}`);
        setMsg(`Not there — ${parts.join(", ")} off.`); setMsgType("hint");
        return {ok:false, pos};
      }
    }
    return {ok:false, pos, steps:stepCount};
  }

  return {player,setPlayer,targets,setTargets,trail,setTrail,running,flash,setFlash,msg,setMsg,msgType,setMsgType,won,setWon,stars,setStars,moveCount,setMoveCount,reset,run};
}

// ─── STAGE 1 · WATCH ─────────────────────────────────────────────────────────
function S1Watch({onComplete}) {
  const scene = {
    player:{row:3,col:1}, pokemon:{row:3,col:5},
    code:`for (int i = 0; i < 4; i++) {\n    c++;\n    MOVE(r, c);\n}`,
    moves:[{row:3,col:2},{row:3,col:3},{row:3,col:4},{row:3,col:5}],
  };
  const [player,setPlayer]   = useState({...scene.player});
  const [trail,setTrail]     = useState([]);
  const [loopI,setLoopI]     = useState(null);
  const [running,setRunning] = useState(false);
  const [done,setDone]       = useState(false);
  const [flash,setFlash]     = useState(false);
  const [aLine,setALine]     = useState(null);

  async function play() {
    setRunning(true); setPlayer({...scene.player}); setTrail([]);
    setDone(false); setFlash(false); setLoopI(null);
    for (let i=0;i<scene.moves.length;i++) {
      setLoopI(i); setALine(1); await SLEEP(600);
      setPlayer({...scene.moves[i]}); setTrail(t=>[...t,scene.moves[i]]); await SLEEP(180);
    }
    setALine(null); setLoopI(null); setFlash(true); setDone(true); setRunning(false);
  }

  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="👀" text="A for loop runs a block of code a set number of times." sub="Watch i count up — each iteration the character moves one step right."/>
        <CodeDisplay code={scene.code} activeLine={aLine}/>
        <LoopCounter current={loopI} max={4}/>
        {done&&<Callout type="success">✅ The loop ran <strong>4 times</strong>. i went 0→1→2→3. Each iteration = one step.</Callout>}
        <BtnRow>
          <button className="btn btn-primary" onClick={play} disabled={running}>{running?"▶ Running…":done?"▶ Watch again":"▶ Play"}</button>
          {done&&<button className="btn btn-success" onClick={() => onComplete(DEFAULT_STARS)}>Got it! Next →</button>}
        </BtnRow>
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...scene.pokemon,caught:false,emoji:"⭐"}]} trail={trail} flash={flash}/></div>
    </div>
  );
}

// ─── STAGE 2 · FILL THE BLANK ─────────────────────────────────────────────────
function S2Fill({onComplete}) {
  const scene = {player:{row:2,col:1},pokemon:{row:2,col:6}};
  const dist  = scene.pokemon.col - scene.player.col;
  const [val,setVal]       = useState("");
  const [player,setPlayer] = useState({...scene.player});
  const [trail,setTrail]   = useState([]);
  const [loopI,setLoopI]   = useState(null);
  const [running,setRunning]= useState(false);
  const [flash,setFlash]   = useState(false);
  const [msg,setMsg]       = useState(null);
  const [mtype,setMtype]   = useState("info");
  const [won,setWon]       = useState(false);

  async function run() {
    const n=parseInt(val);
    if(isNaN(n)||n<1||n>15){setMsg("Enter 1–15.");setMtype("error");return;}
    setRunning(true);setMsg(null);setPlayer({...scene.player});setTrail([]);setFlash(false);setWon(false);
    let pos={...scene.player};
    for(let i=0;i<n;i++){
      setLoopI(i);await SLEEP(350);
      if(pos.col+1>=COLS){setMsg("Out of bounds! Smaller number.");setMtype("error");setRunning(false);setLoopI(null);return;}
      pos={row:pos.row,col:pos.col+1};setPlayer({...pos});setTrail(t=>[...t,{...pos}]);
    }
    setLoopI(null);setRunning(false);
    if(pos.col===scene.pokemon.col){setFlash(true);setWon(true);setMsg(`🎉 Correct! ${n} steps lands you right on it.`);setMtype("success");}
    else if(pos.col<scene.pokemon.col){setMsg(`${scene.pokemon.col-pos.col} column(s) short — try bigger.`);setMtype("hint");}
    else{setMsg(`Overshot by ${pos.col-scene.pokemon.col} — try smaller.`);setMtype("hint");}
  }

  const n=parseInt(val);
  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="🔢" text="The number in a for loop controls how many times it runs." sub={`The Pokémon is ${dist} columns away. What number fills the blank?`}/>
        <div className="fill-block">
          <div className="code-display">
            <div className="code-line"><span className="code-ln">1</span><span className="code-text"><span className="syn-kw">for</span> (<span className="syn-kw">int</span> i = 0; i &lt;&nbsp;</span><input className="blank-input" type="number" min="1" max="15" placeholder="?" value={val} onChange={e=>{setVal(e.target.value);setMsg(null);}} onKeyDown={e=>e.key==="Enter"&&!running&&run()}/><span className="code-text">; i++) {"{"}</span></div>
            <div className="code-line"><span className="code-ln">2</span><span className="code-text">{"    "}c++;</span></div>
            <div className="code-line"><span className="code-ln">3</span><span className="code-text">{"    "}MOVE(r, c);</span></div>
            <div className="code-line"><span className="code-ln">4</span><span className="code-text">{"}"}</span></div>
          </div>
        </div>
        <LoopCounter current={loopI} max={!isNaN(n)&&n>0?n:null}/>
        {msg&&<Callout type={mtype}>{msg}</Callout>}
        <BtnRow>
          <button className="btn btn-primary" onClick={run} disabled={running||!val}>{running?"Running…":"▶ Run"}</button>
          {won&&<button className="btn btn-success" onClick={() => onComplete(DEFAULT_STARS)}>Next →</button>}
        </BtnRow>
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...scene.pokemon,caught:false}]} trail={trail} flash={flash}/></div>
    </div>
  );
}

// ─── STAGE 3 · CHOOSE DIRECTION ───────────────────────────────────────────────
function S3Direction({onComplete}) {
  const scene = {player:{row:1,col:4},pokemon:{row:5,col:4},count:4};
  const dirInfo = {
    "r++":["down ↓","r++"],
    "r--":["up ↑","r--"],
    "c++":["right →","c++"],
    "c--":["left ←","c--"],
  };
  const [chosen,setChosen] = useState(null);
  const [player,setPlayer] = useState({...scene.player});
  const [trail,setTrail]   = useState([]);
  const [loopI,setLoopI]   = useState(null);
  const [running,setRunning]= useState(false);
  const [flash,setFlash]   = useState(false);
  const [msg,setMsg]       = useState(null);
  const [mtype,setMtype]   = useState("info");
  const [won,setWon]       = useState(false);
  const [tries,setTries]   = useState(0);

  async function run() {
    if(!chosen){setMsg("Pick a direction!");setMtype("error");return;}
    setRunning(true);setMsg(null);setPlayer({...scene.player});setTrail([]);setFlash(false);setWon(false);
    let pos={...scene.player};
    for(let i=0;i<scene.count;i++){
      setLoopI(i);await SLEEP(380);
      let nr=pos.row,nc=pos.col;
      if(chosen==="r++")nr++;else if(chosen==="r--")nr--;else if(chosen==="c++")nc++;else nc--;
      if(nr<0||nr>=ROWS||nc<0||nc>=COLS){setMsg("Out of bounds!");setMtype("error");setRunning(false);setLoopI(null);return;}
      pos={row:nr,col:nc};setPlayer({...pos});setTrail(t=>[...t,{...pos}]);
    }
    setLoopI(null);setRunning(false);setTries(t=>t+1);
    if(pos.row===scene.pokemon.row&&pos.col===scene.pokemon.col){
      setFlash(true);setWon(true);setMsg(`🎉 Correct! r++ increases the row → moves down.`);setMtype("success");
    } else {
      setMsg(`"${chosen}" moves you ${dirInfo[chosen][0]} — the Pokémon is below you. Rows increase downward.`);setMtype("hint");
    }
  }

  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="🧭" text="r is the row, c is the column. ++ increases, -- decreases." sub="Row 0 is the top. The Pokémon is below — which operator moves you down?"/>
        <div className="dir-grid">
          {Object.entries(dirInfo).map(([d,[label]])=>(
            <button key={d} className={`dir-btn${chosen===d?" dir-btn-active":""}`} onClick={()=>{setChosen(d);setMsg(null);}} disabled={running}>{d}  ({label})</button>
          ))}
        </div>
        {chosen&&(
          <div className="code-display" style={{marginTop:12}}>
            <div className="code-line"><span className="code-ln">1</span><span className="code-text"><span className="syn-kw">for</span> (i = 0; i &lt; {scene.count}; i++) {"{"}</span></div>
            <div className="code-line"><span className="code-ln">2</span><span className="code-text">{"    "}<span className="syn-chosen">{chosen}</span>;  MOVE(r, c);</span></div>
            <div className="code-line"><span className="code-ln">3</span><span className="code-text">{"}"}</span></div>
          </div>
        )}
        <LoopCounter current={loopI} max={scene.count}/>
        {msg&&<Callout type={mtype}>{msg}</Callout>}
        {tries>=2&&!won&&<Callout type="hint">💡 Row 0 is at the top. Going DOWN = row number increases = r++.</Callout>}
        <BtnRow>
          <button className="btn btn-primary" onClick={run} disabled={running||!chosen}>{running?"Running…":"▶ Run"}</button>
          {won&&<button className="btn btn-success" onClick={() => onComplete(DEFAULT_STARS)}>Next →</button>}
        </BtnRow>
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...scene.pokemon,caught:false}]} trail={trail} flash={flash}/></div>
    </div>
  );
}

// ─── STAGE 4 · WRITE ONE LOOP ─────────────────────────────────────────────────
function S4Write1({onComplete}) {
  const pl={row:1,col:1}, pk={row:1,col:6};
  const dist=pk.col-pl.col;
  const starter=(r,c)=>`#include <stdio.h>\nint main() {\n    int r = ${r}, c = ${c};\n\n    for (int i = 0; i < ___; i++) {\n        c++;\n        MOVE(r, c);\n    }\n    return 0;\n}`;
  const [code,setCode]=useState(starter(pl.row,pl.col));
  const {player,trail,running,flash,msg,msgType,won,stars,reset,run}=useRunner(pl,[{...pk}]);

  async function doRun(){
    const result=await run(code,pl,[{...pk,caught:false}],[]);
    if(result?.ok){
      // message already set in hook for single target — override with friendlier
    }
  }

  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="✏️" text={`Replace ___ with the right number to reach the Pokémon.`} sub={`Target is ${dist} columns to the right.`}/>
        <div className="write-hints"><div className="wh-row"><span className="wh-dir">→ Right</span><span className="wh-val">replace <code>___</code> with <strong>{dist}</strong></span></div></div>
        <textarea className="code-editor" value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} rows={9}/>
        {msg&&<Callout type={msgType}>{msg}</Callout>}
        <BtnRow>
          <button className="btn btn-ghost" onClick={()=>{setCode(starter(pl.row,pl.col));reset();}} disabled={running}>↩ Reset</button>
          <button className="btn btn-primary" onClick={doRun} disabled={running}>{running?"Running…":"▶ Run"}</button>
          {won&&<button className="btn btn-success" onClick={() => onComplete(stars)}>Next →</button>}
        </BtnRow>
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...pk,caught:false}]} trail={trail} flash={flash}/></div>
    </div>
  );
}

// ─── STAGE 5 · TWO BLANKS ────────────────────────────────────────────────────
function S5TwoBlanks({onComplete}) {
  const pl={row:1,col:1},pk={row:5,col:6};
  const cd=pk.col-pl.col, rd=pk.row-pl.row;
  const [v1,setV1]=useState(""), [v2,setV2]=useState("");
  const [player,setPlayer]=useState({...pl});
  const [trail,setTrail]=useState([]);
  const [li1,setLi1]=useState(null),[li2,setLi2]=useState(null);
  const [activeLoop,setActiveLoop]=useState(null);
  const [running,setRunning]=useState(false);
  const [flash,setFlash]=useState(false);
  const [msg,setMsg]=useState(null),[mtype,setMtype]=useState("info");
  const [won,setWon]=useState(false);

  async function run(){
    const n1=parseInt(v1),n2=parseInt(v2);
    if(isNaN(n1)||n1<1||isNaN(n2)||n2<1){setMsg("Fill both blanks (1–10).");setMtype("error");return;}
    setRunning(true);setMsg(null);setPlayer({...pl});setTrail([]);setFlash(false);setWon(false);
    let pos={...pl};const tr=[];
    setActiveLoop(1);
    for(let i=0;i<n1;i++){setLi1(i);await SLEEP(320);if(pos.col+1>=COLS){setMsg("Loop 1 out of bounds!");setMtype("error");setRunning(false);setLi1(null);setActiveLoop(null);return;}pos={row:pos.row,col:pos.col+1};tr.push({...pos});setPlayer({...pos});setTrail([...tr]);}
    setLi1(null);setActiveLoop(2);
    for(let i=0;i<n2;i++){setLi2(i);await SLEEP(320);if(pos.row+1>=ROWS){setMsg("Loop 2 out of bounds!");setMtype("error");setRunning(false);setLi2(null);setActiveLoop(null);return;}pos={row:pos.row+1,col:pos.col};tr.push({...pos});setPlayer({...pos});setTrail([...tr]);}
    setLi2(null);setActiveLoop(null);setRunning(false);
    if(pos.row===pk.row&&pos.col===pk.col){setFlash(true);setWon(true);setMsg("🎉 Both loops correct! You chained two directions.");setMtype("success");}
    else{const p=[];if(pk.col-pos.col!==0)p.push(`${Math.abs(pk.col-pos.col)} col(s) ${pk.col>pos.col?"right":"left"}`);if(pk.row-pos.row!==0)p.push(`${Math.abs(pk.row-pos.row)} row(s) ${pk.row>pos.row?"down":"up"}`);setMsg(`Not there — ${p.join(", ")}.`);setMtype("hint");}
  }

  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="🔗" text="Two loops run one after the other — the second starts where the first ended." sub="Fill both blanks to move right then down."/>
        <div className="fill-block">
          <div className="two-blank-label">Loop 1 — move right ({cd} steps)</div>
          <div className={`code-display${activeLoop===1?" loop-active":""}`}>
            <div className="code-line"><span className="code-ln">1</span><span className="code-text"><span className="syn-kw">for</span> (i=0; i&lt;&nbsp;</span><input className="blank-input" type="number" min="1" max="10" placeholder="?" value={v1} onChange={e=>{setV1(e.target.value);setMsg(null);}}/><span className="code-text">; i++) {"{ c++; MOVE(r,c); }"}</span></div>
          </div>
          <LoopCounter current={li1} max={!isNaN(parseInt(v1))&&parseInt(v1)>0?parseInt(v1):null} label="Loop 1"/>
          <div className="two-blank-label" style={{marginTop:8}}>Loop 2 — move down ({rd} steps)</div>
          <div className={`code-display${activeLoop===2?" loop-active":""}`}>
            <div className="code-line"><span className="code-ln">2</span><span className="code-text"><span className="syn-kw">for</span> (i=0; i&lt;&nbsp;</span><input className="blank-input" type="number" min="1" max="10" placeholder="?" value={v2} onChange={e=>{setV2(e.target.value);setMsg(null);}}/><span className="code-text">; i++) {"{ r++; MOVE(r,c); }"}</span></div>
          </div>
          <LoopCounter current={li2} max={!isNaN(parseInt(v2))&&parseInt(v2)>0?parseInt(v2):null} label="Loop 2"/>
        </div>
        {msg&&<Callout type={mtype}>{msg}</Callout>}
        <BtnRow>
          <button className="btn btn-primary" onClick={run} disabled={running||!v1||!v2}>{running?"Running…":"▶ Run"}</button>
          {won&&<button className="btn btn-success" onClick={() => onComplete(DEFAULT_STARS)}>Next →</button>}
        </BtnRow>
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...pk,caught:false}]} trail={trail} flash={flash}/></div>
    </div>
  );
}

// ─── STAGE 6 · CHOOSE BOTH DIRECTIONS ────────────────────────────────────────
function S6ChooseDirs({onComplete}) {
  const pl={row:6,col:6}, pk={row:2,col:1};
  const dirs=["r++","r--","c++","c--"];
  const dirLabel={"r++":"r++ (↓)","r--":"r-- (↑)","c++":"c++ (→)","c--":"c-- (←)"};
  const [d1,setD1]=useState(null),[d2,setD2]=useState(null);
  const [player,setPlayer]=useState({...pl});
  const [trail,setTrail]=useState([]);
  const [li1,setLi1]=useState(null),[li2,setLi2]=useState(null);
  const [running,setRunning]=useState(false);
  const [flash,setFlash]=useState(false);
  const [msg,setMsg]=useState(null),[mtype,setMtype]=useState("info");
  const [won,setWon]=useState(false);
  const cnt1=Math.abs(pk.row-pl.row), cnt2=Math.abs(pk.col-pl.col);

  async function run(){
    if(!d1||!d2){setMsg("Choose both directions!");setMtype("error");return;}
    setRunning(true);setMsg(null);setPlayer({...pl});setTrail([]);setFlash(false);setWon(false);
    let pos={...pl};const tr=[];
    for(let i=0;i<cnt1;i++){setLi1(i);await SLEEP(320);let nr=pos.row,nc=pos.col;if(d1==="r++")nr++;else if(d1==="r--")nr--;else if(d1==="c++")nc++;else nc--;if(nr<0||nr>=ROWS||nc<0||nc>=COLS){setMsg("Loop 1 goes OOB!");setMtype("error");setRunning(false);setLi1(null);return;}pos={row:nr,col:nc};tr.push({...pos});setPlayer({...pos});setTrail([...tr]);}
    setLi1(null);
    for(let i=0;i<cnt2;i++){setLi2(i);await SLEEP(320);let nr=pos.row,nc=pos.col;if(d2==="r++")nr++;else if(d2==="r--")nr--;else if(d2==="c++")nc++;else nc--;if(nr<0||nr>=ROWS||nc<0||nc>=COLS){setMsg("Loop 2 goes OOB!");setMtype("error");setRunning(false);setLi2(null);return;}pos={row:nr,col:nc};tr.push({...pos});setPlayer({...pos});setTrail([...tr]);}
    setLi2(null);setRunning(false);
    if(pos.row===pk.row&&pos.col===pk.col){setFlash(true);setWon(true);setMsg("🎉 Both directions right!");setMtype("success");}
    else{setMsg(`Wrong direction(s) — ended at (${pos.row},${pos.col}), needed (${pk.row},${pk.col}).`);setMtype("hint");}
  }

  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="🎯" text="Each loop needs its own direction. Pick one for each." sub={`Loop 1 runs ${cnt1} times, loop 2 runs ${cnt2} times. You're at (${pl.row},${pl.col}), target is (${pk.row},${pk.col}).`}/>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          <div style={{flex:1}}>
            <div className="two-blank-label">Loop 1 direction ({cnt1} steps)</div>
            <div className="dir-grid" style={{marginTop:6}}>
              {dirs.map(d=><button key={d} className={`dir-btn${d1===d?" dir-btn-active":""}`} onClick={()=>{setD1(d);setMsg(null);}} disabled={running}>{dirLabel[d]}</button>)}
            </div>
          </div>
          <div style={{flex:1}}>
            <div className="two-blank-label">Loop 2 direction ({cnt2} steps)</div>
            <div className="dir-grid" style={{marginTop:6}}>
              {dirs.map(d=><button key={d} className={`dir-btn${d2===d?" dir-btn-active":""}`} onClick={()=>{setD2(d);setMsg(null);}} disabled={running}>{dirLabel[d]}</button>)}
            </div>
          </div>
        </div>
        <LoopCounter current={li1} max={cnt1} label="Loop 1"/>
        <LoopCounter current={li2} max={cnt2} label="Loop 2"/>
        {msg&&<Callout type={mtype}>{msg}</Callout>}
        <BtnRow>
          <button className="btn btn-primary" onClick={run} disabled={running||!d1||!d2}>{running?"Running…":"▶ Run"}</button>
          {won&&<button className="btn btn-success" onClick={() => onComplete(DEFAULT_STARS)}>Next →</button>}
        </BtnRow>
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...pk,caught:false}]} trail={trail} flash={flash}/></div>
    </div>
  );
}

// ─── STAGE 7 · WRITE TWO LOOPS ───────────────────────────────────────────────
function S7Write2({onComplete}) {
  const pl={row:1,col:1},pk={row:6,col:5};
  const cd=pk.col-pl.col,rd=pk.row-pl.row;
  const starter=(r,c)=>`#include <stdio.h>\nint main() {\n    int r = ${r}, c = ${c};\n\n    // Loop 1: move right\n    for (int i = 0; i < ___; i++) {\n        c++;\n        MOVE(r, c);\n    }\n\n    // Loop 2: move down\n    for (int i = 0; i < ___; i++) {\n        r++;\n        MOVE(r, c);\n    }\n    return 0;\n}`;
  const [code,setCode]=useState(starter(pl.row,pl.col));
  const {player,trail,running,flash,msg,msgType,won,stars,reset,run}=useRunner(pl,[{...pk}]);
  async function doRun(){await run(code,pl,[{...pk,caught:false}],[]);}
  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="✏️" text="Write both loops yourself to reach the Pokémon." sub="Move right first, then down. Replace both ___ with the correct counts."/>
        <div className="write-hints">
          <div className="wh-row"><span className="wh-dir">→ Right</span><span className="wh-val">first <code>___</code> = <strong>{cd}</strong></span></div>
          <div className="wh-row"><span className="wh-dir">↓ Down</span><span className="wh-val">second <code>___</code> = <strong>{rd}</strong></span></div>
        </div>
        <textarea className="code-editor" value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} rows={14}/>
        {msg&&<Callout type={msgType}>{msg}</Callout>}
        <BtnRow>
          <button className="btn btn-ghost" onClick={()=>{setCode(starter(pl.row,pl.col));reset();}} disabled={running}>↩ Reset</button>
          <button className="btn btn-primary" onClick={doRun} disabled={running}>{running?"Running…":"▶ Run"}</button>
          {won&&<button className="btn btn-success" onClick={() => onComplete(stars)}>Next →</button>}
        </BtnRow>
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...pk,caught:false}]} trail={trail} flash={flash}/></div>
    </div>
  );
}

// ─── STAGE 8 · DEBUG ──────────────────────────────────────────────────────────
function S8Debug({onComplete}) {
  const pl={row:2,col:1},pk={row:5,col:5};
  const buggy=`#include <stdio.h>\nint main() {\n    int r = 2, c = 1;\n\n    // Bug 1: wrong count (should be 4)\n    for (int i = 0; i < 2; i++) {\n        c++;\n        MOVE(r, c);\n    }\n\n    // Bug 2: wrong direction (should move DOWN)\n    for (int i = 0; i < 3; i++) {\n        c++;\n        MOVE(r, c);\n    }\n    return 0;\n}`;
  const fixed=`#include <stdio.h>\nint main() {\n    int r = 2, c = 1;\n\n    for (int i = 0; i < 4; i++) {\n        c++;\n        MOVE(r, c);\n    }\n\n    for (int i = 0; i < 3; i++) {\n        r++;\n        MOVE(r, c);\n    }\n    return 0;\n}`;
  const [code,setCode]=useState(buggy);
  const [hints,setHints]=useState(0);
  const {player,trail,running,flash,msg,msgType,won,stars,reset,run}=useRunner(pl,[{...pk}]);
  const hintList=["💡 Count how many columns from start to target.","💡 The second loop should move DOWN — check the variable.","💡 r++ = down, c++ = right. Which one does each loop need?"];
  async function doRun(){await run(code,pl,[{...pk,caught:false}],[]);}
  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="🐛" text="This code has 2 bugs. Find and fix them both." sub={`Start (${pl.row},${pl.col}) → Target (${pk.row},${pk.col}). Bug 1: wrong count. Bug 2: wrong direction.`}/>
        <textarea className="code-editor" value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} rows={16}/>
        {msg&&<Callout type={msgType}>{msg}</Callout>}
        {hints>0&&<Callout type="hint">{hintList[hints-1]}</Callout>}
        <BtnRow>
          <button className="btn btn-ghost" onClick={()=>{setCode(buggy);reset();}} disabled={running}>↩ Reset</button>
          {hints<3&&!won&&<button className="btn btn-ghost" onClick={()=>setHints(h=>h+1)} disabled={running}>💡 Hint</button>}
          <button className="btn btn-ghost" onClick={()=>setCode(fixed)} disabled={running}>👁 Show fix</button>
          <button className="btn btn-primary" onClick={doRun} disabled={running}>{running?"Running…":"▶ Run"}</button>
          {won&&<button className="btn btn-success" onClick={() => onComplete(stars)}>Next →</button>}
        </BtnRow>
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...pk,caught:false}]} trail={trail} flash={flash}/></div>
    </div>
  );
}

// ─── STAGE 9 · OBSTACLE ───────────────────────────────────────────────────────
function S9Obstacle({onComplete}) {
  const pl={row:4,col:1},pk={row:1,col:5};
  const obs=[{row:4,col:2},{row:4,col:3},{row:4,col:4}];
  const starter=(r,c)=>`#include <stdio.h>\nint main() {\n    int r = ${r}, c = ${c};\n\n    // Rocks block the direct right path!\n    // Go UP first, then RIGHT.\n\n    for (int i = 0; i < ___; i++) {\n        r--;\n        MOVE(r, c);\n    }\n    for (int i = 0; i < ___; i++) {\n        c++;\n        MOVE(r, c);\n    }\n    return 0;\n}`;
  const [code,setCode]=useState(starter(pl.row,pl.col));
  const {player,trail,running,flash,msg,msgType,won,stars,reset,run}=useRunner(pl,[{...pk}],obs);
  async function doRun(){await run(code,pl,[{...pk,caught:false}],obs);}
  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="🪨" text="A wall of rocks blocks your direct path. Go around them." sub="Move UP first to clear the wall, then move RIGHT to reach the target."/>
        <div className="obstacle-info"><span>🧍 ({pl.row},{pl.col})</span><span>⭐ ({pk.row},{pk.col})</span><span>🪨 Row {obs[0].row}, cols {obs[0].col}–{obs[obs.length-1].col}</span></div>
        <textarea className="code-editor" value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} rows={12}/>
        {msg&&<Callout type={msgType}>{msg}</Callout>}
        <BtnRow>
          <button className="btn btn-ghost" onClick={()=>{setCode(starter(pl.row,pl.col));reset();}} disabled={running}>↩ Reset</button>
          <button className="btn btn-primary" onClick={doRun} disabled={running}>{running?"Running…":"▶ Run"}</button>
          {won&&<button className="btn btn-success" onClick={() => onComplete(stars)}>Next →</button>}
        </BtnRow>
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...pk,caught:false}]} trail={trail} flash={flash} obstacles={obs}/></div>
    </div>
  );
}

// ─── STAGE 10 · COUNTDOWN LOOP ───────────────────────────────────────────────
function S10Countdown({onComplete}) {
  const scene={player:{row:3,col:6},pokemon:{row:3,col:1}};
  const dist=scene.player.col-scene.pokemon.col;
  const watchCode=`// Count UP (you've seen this)\nfor (int i = 0; i < 5; i++) {\n    c++;  MOVE(r, c);\n}\n\n// Count DOWN — same distance, opposite direction\nfor (int i = 5; i > 0; i--) {\n    c--;  MOVE(r, c);\n}`;
  const starter=(r,c)=>`#include <stdio.h>\nint main() {\n    int r = ${r}, c = ${c};\n\n    // Use a COUNTDOWN loop to move LEFT\n    for (int i = ___; i > 0; i--) {\n        c--;\n        MOVE(r, c);\n    }\n    return 0;\n}`;
  const [tab,setTab]=useState("learn");
  const [val,setVal]=useState("");
  const [player,setPlayer]=useState({...scene.player});
  const [trail,setTrail]=useState([]);
  const [loopI,setLoopI]=useState(null);
  const [running,setRunning]=useState(false);
  const [flash,setFlash]=useState(false);
  const [msg,setMsg]=useState(null),[mtype,setMtype]=useState("info");
  const [won,setWon]=useState(false);

  async function run(){
    const n=parseInt(val);
    if(isNaN(n)||n<1||n>10){setMsg("Enter 1–10.");setMtype("error");return;}
    setRunning(true);setMsg(null);setPlayer({...scene.player});setTrail([]);setFlash(false);setWon(false);
    let pos={...scene.player};
    for(let i=n;i>0;i--){setLoopI(n-i);await SLEEP(350);if(pos.col-1<0){setMsg("Out of bounds!");setMtype("error");setRunning(false);setLoopI(null);return;}pos={row:pos.row,col:pos.col-1};setPlayer({...pos});setTrail(t=>[...t,{...pos}]);}
    setLoopI(null);setRunning(false);
    if(pos.col===scene.pokemon.col){setFlash(true);setWon(true);setMsg(`🎉 Correct! The countdown loop ran ${n} times moving left.`);setMtype("success");}
    else if(pos.col>scene.pokemon.col){setMsg(`${pos.col-scene.pokemon.col} column(s) short. Try bigger.`);setMtype("hint");}
    else{setMsg(`Overshot by ${scene.pokemon.col-pos.col}. Try smaller.`);setMtype("hint");}
  }

  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="⏱️" text="A loop can count DOWN too — starting high and using i-- and i > 0." sub={`You need to move LEFT ${dist} steps. The Pokémon is to your left.`}/>
        <div className="tab-bar">
          <button className={`tab-btn${tab==="learn"?" tab-active":""}`} onClick={()=>setTab("learn")}>📖 See it</button>
          <button className={`tab-btn${tab==="write"?" tab-active":""}`} onClick={()=>setTab("write")}>✏️ Try it</button>
        </div>
        {tab==="learn"&&<><CodeDisplay code={watchCode}/><Callout type="info">A countdown loop uses <code>i = N; i &gt; 0; i--</code> instead of <code>i = 0; i &lt; N; i++</code>. Same number of steps, different counter style.</Callout><BtnRow><button className="btn btn-primary" onClick={()=>setTab("write")}>Try it →</button></BtnRow></>}
        {tab==="write"&&<>
          <div className="fill-block">
            <div className="code-display">
              <div className="code-line"><span className="code-ln">1</span><span className="code-text"><span className="syn-kw">for</span> (i =&nbsp;</span><input className="blank-input" type="number" min="1" max="10" placeholder="?" value={val} onChange={e=>{setVal(e.target.value);setMsg(null);}}/><span className="code-text">; i &gt; 0; i--) {"{"}</span></div>
              <div className="code-line"><span className="code-ln">2</span><span className="code-text">{"    "}c--;  MOVE(r, c);</span></div>
              <div className="code-line"><span className="code-ln">3</span><span className="code-text">{"}"}</span></div>
            </div>
          </div>
          <LoopCounter current={loopI} max={!isNaN(parseInt(val))&&parseInt(val)>0?parseInt(val):null} label="Countdown"/>
          {msg&&<Callout type={mtype}>{msg}</Callout>}
          <BtnRow>
            <button className="btn btn-primary" onClick={run} disabled={running||!val}>{running?"Running…":"▶ Run"}</button>
            {won&&<button className="btn btn-success" onClick={() => onComplete(DEFAULT_STARS)}>Next →</button>}
          </BtnRow>
        </>}
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...scene.pokemon,caught:false}]} trail={trail} flash={flash}/></div>
    </div>
  );
}

// ─── STAGE 11 · READ COORDINATES ─────────────────────────────────────────────
function S11Coords({onComplete}) {
  // Player and pokemon are random-ish but fixed — player must figure out counts from coords
  const pl={row:2,col:1},pk={row:6,col:7};
  const [v1,setV1]=useState(""),[v2,setV2]=useState("");
  const [player,setPlayer]=useState({...pl});
  const [trail,setTrail]=useState([]);
  const [li1,setLi1]=useState(null),[li2,setLi2]=useState(null);
  const [activeLoop,setActiveLoop]=useState(null);
  const [running,setRunning]=useState(false);
  const [flash,setFlash]=useState(false);
  const [msg,setMsg]=useState(null),[mtype,setMtype]=useState("info");
  const [won,setWon]=useState(false);
  const [revealed,setRevealed]=useState(false);

  async function run(){
    const n1=parseInt(v1),n2=parseInt(v2);
    if(isNaN(n1)||n1<1||isNaN(n2)||n2<1){setMsg("Fill both blanks.");setMtype("error");return;}
    setRunning(true);setMsg(null);setPlayer({...pl});setTrail([]);setFlash(false);setWon(false);
    let pos={...pl};const tr=[];
    setActiveLoop(1);
    for(let i=0;i<n1;i++){setLi1(i);await SLEEP(300);pos={row:pos.row,col:pos.col+1};tr.push({...pos});setPlayer({...pos});setTrail([...tr]);}
    setLi1(null);setActiveLoop(2);
    for(let i=0;i<n2;i++){setLi2(i);await SLEEP(300);pos={row:pos.row+1,col:pos.col};tr.push({...pos});setPlayer({...pos});setTrail([...tr]);}
    setLi2(null);setActiveLoop(null);setRunning(false);
    if(pos.row===pk.row&&pos.col===pk.col){setFlash(true);setWon(true);setMsg("🎉 You calculated the counts from coordinates!");setMtype("success");}
    else{setMsg(`Ended at (${pos.row},${pos.col}) but needed (${pk.row},${pk.col}). Recalculate: target_col - start_col = right steps.`);setMtype("hint");}
  }

  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="📐" text="You can calculate loop counts from coordinates." sub="Right steps = target_col − start_col. Down steps = target_row − start_row."/>
        <div className="coords-box">
          <div className="cb-row"><span>🧍 Start:</span><span className="cb-val">row {pl.row}, col {pl.col}</span></div>
          <div className="cb-row"><span>⭐ Target:</span><span className="cb-val">row {pk.row}, col {pk.col}</span></div>
          <div className="cb-row"><span>→ Right steps:</span><span className="cb-val">{pk.col} − {pl.col} = <strong>{revealed?pk.col-pl.col:"?"}</strong></span></div>
          <div className="cb-row"><span>↓ Down steps:</span><span className="cb-val">{pk.row} − {pl.row} = <strong>{revealed?pk.row-pl.row:"?"}</strong></span></div>
          {!revealed&&<button className="btn btn-ghost" style={{marginTop:6,fontSize:12}} onClick={()=>setRevealed(true)}>Show answers</button>}
        </div>
        <div className="fill-block">
          <div className={`code-display${activeLoop===1?" loop-active":""}`}>
            <div className="code-line"><span className="code-ln">1</span><span className="code-text"><span className="syn-kw">for</span> (i=0; i&lt;&nbsp;</span><input className="blank-input" type="number" min="1" max="10" placeholder="?" value={v1} onChange={e=>{setV1(e.target.value);setMsg(null);}}/><span className="code-text">; i++) {"{ c++; MOVE(r,c); }"}</span></div>
          </div>
          <LoopCounter current={li1} max={!isNaN(parseInt(v1))&&parseInt(v1)>0?parseInt(v1):null} label="Right"/>
          <div className={`code-display${activeLoop===2?" loop-active":""}`} style={{marginTop:6}}>
            <div className="code-line"><span className="code-ln">2</span><span className="code-text"><span className="syn-kw">for</span> (i=0; i&lt;&nbsp;</span><input className="blank-input" type="number" min="1" max="10" placeholder="?" value={v2} onChange={e=>{setV2(e.target.value);setMsg(null);}}/><span className="code-text">; i++) {"{ r++; MOVE(r,c); }"}</span></div>
          </div>
          <LoopCounter current={li2} max={!isNaN(parseInt(v2))&&parseInt(v2)>0?parseInt(v2):null} label="Down"/>
        </div>
        {msg&&<Callout type={mtype}>{msg}</Callout>}
        <BtnRow>
          <button className="btn btn-primary" onClick={run} disabled={running||!v1||!v2}>{running?"Running…":"▶ Run"}</button>
          {won&&<button className="btn btn-success" onClick={() => onComplete(DEFAULT_STARS)}>Next →</button>}
        </BtnRow>
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...pk,caught:false}]} trail={trail} flash={flash}/></div>
    </div>
  );
}

// ─── STAGE 12 · WHILE LOOP INTRO ─────────────────────────────────────────────
function S12While({onComplete}) {
  const pl={row:2,col:1},pk={row:2,col:6};
  const dist=pk.col-pl.col;
  const compare=`// FOR loop (familiar)\nfor (int i = 0; i < 5; i++) {\n    c++;  MOVE(r, c);\n}\n\n// WHILE loop (equivalent)\nint i = 0;\nwhile (i < 5) {\n    c++;  MOVE(r, c);\n    i++;     // don't forget this!\n}`;
  const starter=(r,c)=>`#include <stdio.h>\nint main() {\n    int r = ${r}, c = ${c};\n\n    int i = 0;\n    while (i < ___) {\n        c++;\n        MOVE(r, c);\n        i++;\n    }\n    return 0;\n}`;
  const [tab,setTab]=useState("learn");
  const [val,setVal]=useState("");
  const [player,setPlayer]=useState({...pl});
  const [trail,setTrail]=useState([]);
  const [loopI,setLoopI]=useState(null);
  const [running,setRunning]=useState(false);
  const [flash,setFlash]=useState(false);
  const [msg,setMsg]=useState(null),[mtype,setMtype]=useState("info");
  const [won,setWon]=useState(false);

  async function run(){
    const n=parseInt(val);
    if(isNaN(n)||n<1||n>15){setMsg("Enter 1–15.");setMtype("error");return;}
    setRunning(true);setMsg(null);setPlayer({...pl});setTrail([]);setFlash(false);setWon(false);
    let pos={...pl},i=0;
    while(i<n){setLoopI(i);await SLEEP(360);pos={row:pos.row,col:pos.col+1};setPlayer({...pos});setTrail(t=>[...t,{...pos}]);i++;}
    setLoopI(null);setRunning(false);
    if(pos.col===pk.col){setFlash(true);setWon(true);setMsg(`🎉 Your while loop works! Same result as a for loop.`);setMtype("success");}
    else if(pos.col<pk.col){setMsg(`${pk.col-pos.col} short.`);setMtype("hint");}
    else{setMsg(`Overshot by ${pos.col-pk.col}.`);setMtype("hint");}
  }

  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="🔄" text="A while loop keeps going as long as a condition is true." sub="It's just like a for loop — but you manage the counter yourself."/>
        <div className="tab-bar">
          <button className={`tab-btn${tab==="learn"?" tab-active":""}`} onClick={()=>setTab("learn")}>📖 Compare</button>
          <button className={`tab-btn${tab==="write"?" tab-active":""}`} onClick={()=>setTab("write")}>✏️ Write it</button>
        </div>
        {tab==="learn"&&<><CodeDisplay code={compare}/><Callout type="info">Key difference: with <code>while</code>, you must write <code>i++</code> yourself inside the loop — or it runs forever!</Callout><BtnRow><button className="btn btn-primary" onClick={()=>setTab("write")}>Try it →</button></BtnRow></>}
        {tab==="write"&&<>
          <div className="fill-block">
            <div className="code-display">
              <div className="code-line"><span className="code-ln">1</span><span className="code-text"><span className="syn-kw">while</span> (i &lt;&nbsp;</span><input className="blank-input" type="number" min="1" max="15" placeholder="?" value={val} onChange={e=>{setVal(e.target.value);setMsg(null);}}/><span className="code-text">) {"{"}</span></div>
              <div className="code-line"><span className="code-ln">2</span><span className="code-text">{"    "}c++;  MOVE(r, c);</span></div>
              <div className="code-line"><span className="code-ln">3</span><span className="code-text">{"    "}i++;  // increment!</span></div>
              <div className="code-line"><span className="code-ln">4</span><span className="code-text">{"}"}</span></div>
            </div>
          </div>
          <LoopCounter current={loopI} max={!isNaN(parseInt(val))&&parseInt(val)>0?parseInt(val):null}/>
          {msg&&<Callout type={mtype}>{msg}</Callout>}
          <BtnRow>
            <button className="btn btn-primary" onClick={run} disabled={running||!val}>{running?"Running…":"▶ Run"}</button>
            {won&&<button className="btn btn-success" onClick={() => onComplete(DEFAULT_STARS)}>Next →</button>}
          </BtnRow>
        </>}
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...pk,caught:false}]} trail={trail} flash={flash}/></div>
    </div>
  );
}

// ─── STAGE 13 · WHILE WITH CONDITION ─────────────────────────────────────────
function S13WhileCond({onComplete}) {
  const pl={row:1,col:1},pk={row:1,col:6};
  const starter=(r,c)=>`#include <stdio.h>\nint main() {\n    int r = ${r}, c = ${c};\n\n    // Move right WHILE c is less than the target column\n    while (c < ___) {\n        c++;\n        MOVE(r, c);\n    }\n    return 0;\n}`;
  const [tab,setTab]=useState("learn");
  const [val,setVal]=useState("");
  const [player,setPlayer]=useState({...pl});
  const [trail,setTrail]=useState([]);
  const [running,setRunning]=useState(false);
  const [flash,setFlash]=useState(false);
  const [msg,setMsg]=useState(null),[mtype,setMtype]=useState("info");
  const [won,setWon]=useState(false);

  const explain=`// Instead of counting steps, we loop\n// UNTIL we reach the destination column!\n\nwhile (c < target_col) {\n    c++;\n    MOVE(r, c);\n}\n// Stops automatically when c == target_col`;

  async function run(){
    const n=parseInt(val);
    if(isNaN(n)||n<1||n>COLS){setMsg(`Enter 1–${COLS}.`);setMtype("error");return;}
    setRunning(true);setMsg(null);setPlayer({...pl});setTrail([]);setFlash(false);setWon(false);
    let pos={...pl};
    while(pos.col<n){await SLEEP(360);pos={row:pos.row,col:pos.col+1};setPlayer({...pos});setTrail(t=>[...t,{...pos}]);}
    setRunning(false);
    if(pos.col===pk.col){setFlash(true);setWon(true);setMsg(`🎉 The while condition stopped the loop exactly at column ${pk.col}.`);setMtype("success");}
    else{setMsg(`Stopped at col ${pos.col}, needed col ${pk.col}. The condition should be: c < ${pk.col}.`);setMtype("hint");}
  }

  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="🎯" text="A while loop can use the destination itself as the condition — no counter needed!" sub={`Target column is ${pk.col}. Loop while c < ${pk.col}.`}/>
        <div className="tab-bar">
          <button className={`tab-btn${tab==="learn"?" tab-active":""}`} onClick={()=>setTab("learn")}>📖 Concept</button>
          <button className={`tab-btn${tab==="write"?" tab-active":""}`} onClick={()=>setTab("write")}>✏️ Try it</button>
        </div>
        {tab==="learn"&&<><CodeDisplay code={explain}/><Callout type="info">This is useful when you know the <em>target value</em> but not necessarily the number of steps. The loop figures it out itself.</Callout><BtnRow><button className="btn btn-primary" onClick={()=>setTab("write")}>Try it →</button></BtnRow></>}
        {tab==="write"&&<>
          <div className="fill-block">
            <div className="code-display">
              <div className="code-line"><span className="code-ln">1</span><span className="code-text"><span className="syn-kw">while</span> (c &lt;&nbsp;</span><input className="blank-input" type="number" min="1" max={COLS} placeholder="?" value={val} onChange={e=>{setVal(e.target.value);setMsg(null);}}/><span className="code-text">) {"{"}</span></div>
              <div className="code-line"><span className="code-ln">2</span><span className="code-text">{"    "}c++;  MOVE(r, c);</span></div>
              <div className="code-line"><span className="code-ln">3</span><span className="code-text">{"}"}</span></div>
            </div>
            <div className="fill-label">What column should the loop stop at? (target col = <strong>{pk.col}</strong>)</div>
          </div>
          {msg&&<Callout type={mtype}>{msg}</Callout>}
          <BtnRow>
            <button className="btn btn-primary" onClick={run} disabled={running||!val}>{running?"Running…":"▶ Run"}</button>
            {won&&<button className="btn btn-success" onClick={() => onComplete(DEFAULT_STARS)}>Next →</button>}
          </BtnRow>
        </>}
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...pk,caught:false}]} trail={trail} flash={flash}/></div>
    </div>
  );
}

// ─── STAGE 14 · NESTED LOOPS ──────────────────────────────────────────────────
function S14Nested({onComplete}) {
  const watchCode=`// Outer loop: rows (move down)\nfor (int r2 = 0; r2 < 3; r2++) {\n    // Inner loop: columns (move right)\n    for (int c2 = 0; c2 < 3; c2++) {\n        MOVE(r2, c2);\n    }\n}`;
  const pl={row:0,col:0};
  // nested 3x3 pattern visits all cells in a 3x3 grid
  const nestedMoves=[];
  for(let r=0;r<3;r++) for(let c=0;c<3;c++) if(!(r===0&&c===0)) nestedMoves.push({row:r,col:c});

  const [player,setPlayer]=useState({...pl});
  const [trail,setTrail]=useState([]);
  const [outerI,setOuterI]=useState(null);
  const [innerI,setInnerI]=useState(null);
  const [running,setRunning]=useState(false);
  const [done,setDone]=useState(false);

  // For the challenge part
  const pk={row:4,col:4};
  const starter=(r,c)=>`#include <stdio.h>\nint main() {\n    int r = ${r}, c = ${c};\n\n    // Outer loop: move down 4 steps\n    for (int step = 0; step < ___; step++) {\n        r++;\n        // Inner: move right 1 step each time\n        for (int j = 0; j < ___; j++) {\n            c++;\n            MOVE(r, c);\n        }\n    }\n    return 0;\n}`;
  const [tab,setTab]=useState("watch");
  const [code,setCode]=useState(starter(0,0));
  const {player:p2,trail:t2,running:r2,flash:f2,msg:m2,msgType:mt2,won:w2,stars:w2Stars,reset:reset2,run:run2}=useRunner(pl,[{...pk}]);

  async function watchPlay(){
    setRunning(true);setPlayer({...pl});setTrail([]);setDone(false);
    for(let r=0;r<3;r++){setOuterI(r);
      for(let c=0;c<3;c++){setInnerI(c);await SLEEP(350);
        setPlayer({row:r,col:c});setTrail(t=>[...t,{row:r,col:c}]);
      }
    }
    setOuterI(null);setInnerI(null);setRunning(false);setDone(true);
  }

  async function doRun(){await run2(code,pl,[{...pk,caught:false}],[]);}

  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="🔁" text="A nested loop is a loop inside another loop." sub="The outer loop runs N times. Each time, the inner loop runs M times. Total = N × M steps."/>
        <div className="tab-bar">
          <button className={`tab-btn${tab==="watch"?" tab-active":""}`} onClick={()=>setTab("watch")}>👀 Watch</button>
          <button className={`tab-btn${tab==="write"?" tab-active":""}`} onClick={()=>setTab("write")}>✏️ Challenge</button>
        </div>
        {tab==="watch"&&<>
          <CodeDisplay code={watchCode}/>
          <div style={{display:"flex",gap:12}}>
            <LoopCounter current={outerI} max={3} label="Outer (rows)"/>
            <LoopCounter current={innerI} max={3} label="Inner (cols)"/>
          </div>
          {done&&<Callout type="success">✅ The outer loop ran 3 times (rows 0→2). Each time, the inner loop ran 3 times (cols 0→2). Total: 9 moves.</Callout>}
          <BtnRow>
            <button className="btn btn-primary" onClick={watchPlay} disabled={running}>{running?"Running…":done?"▶ Again":"▶ Watch"}</button>
            {done&&<button className="btn btn-primary" onClick={()=>setTab("write")}>Challenge →</button>}
          </BtnRow>
        </>}
        {tab==="write"&&<>
          <Callout type="info">Reach ({pk.row},{pk.col}) using a nested loop. The outer loop moves DOWN, the inner moves RIGHT 1 step each time. Fill both ___.</Callout>
          <textarea className="code-editor" value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} rows={12}/>
          {m2&&<Callout type={mt2}>{m2}</Callout>}
          <BtnRow>
            <button className="btn btn-ghost" onClick={()=>{setCode(starter(0,0));reset2();}} disabled={r2}>↩ Reset</button>
            <button className="btn btn-primary" onClick={doRun} disabled={r2}>{r2?"Running…":"▶ Run"}</button>
            {w2&&<button className="btn btn-success" onClick={() => onComplete(w2Stars)}>Next →</button>}
          </BtnRow>
        </>}
      </div>
      <div className="stage-right">
        {tab==="watch"
          ?<Grid player={player} targets={[]} trail={trail} flash={false}/>
          :<Grid player={p2} targets={[{...pk,caught:false}]} trail={t2} flash={f2}/>
        }
      </div>
    </div>
  );
}

// ─── STAGE 15 · MULTIPLE OBSTACLES ───────────────────────────────────────────
function S15MultiObs({onComplete}) {
  const pl={row:0,col:0},pk={row:7,col:7};
  const obs=[{row:2,col:1},{row:2,col:2},{row:2,col:3},{row:2,col:4},{row:5,col:3},{row:5,col:4},{row:5,col:5},{row:5,col:6}];
  const starter=(r,c)=>`#include <stdio.h>\nint main() {\n    int r = ${r}, c = ${c};\n\n    // Two walls block direct paths.\n    // Plan a route that avoids both!\n\n    return 0;\n}`;
  const [code,setCode]=useState(starter(pl.row,pl.col));
  const {player,trail,running,flash,msg,msgType,won,stars,reset,run}=useRunner(pl,[{...pk}],obs);
  async function doRun(){await run(code,pl,[{...pk,caught:false}],obs);}
  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="🗺️" text="Two walls block the direct path. Plan your route carefully before writing." sub="Study the grid — find a path that clears both walls."/>
        <div className="obstacle-info" style={{flexDirection:"column",gap:4}}>
          <span>🪨 Wall 1: row 2, cols 1–4</span>
          <span>🪨 Wall 2: row 5, cols 3–6</span>
          <span>💡 Tip: move right first to col 5+, then navigate down between the walls.</span>
        </div>
        <textarea className="code-editor" value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} rows={12}/>
        {msg&&<Callout type={msgType}>{msg}</Callout>}
        <BtnRow>
          <button className="btn btn-ghost" onClick={()=>{setCode(starter(pl.row,pl.col));reset();}} disabled={running}>↩ Reset</button>
          <button className="btn btn-primary" onClick={doRun} disabled={running}>{running?"Running…":"▶ Run"}</button>
          {won&&<button className="btn btn-success" onClick={() => onComplete(stars)}>Next →</button>}
        </BtnRow>
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...pk,caught:false}]} trail={trail} flash={flash} obstacles={obs}/></div>
    </div>
  );
}

// ─── STAGE 16 · OFF-BY-ONE ────────────────────────────────────────────────────
function S16OffByOne({onComplete}) {
  const pl={row:3,col:1},pk={row:3,col:5};
  // Three code variants with subtle off-by-one bugs
  const variants=[
    {label:"Variant A",code:`#include <stdio.h>\nint main() {\n    int r = 3, c = 1;\n    // Should reach col 5 — does it?\n    for (int i = 0; i <= 4; i++) {\n        c++;\n        MOVE(r, c);\n    }\n    return 0;\n}`,correct:false,explain:"i <= 4 runs 5 times (0,1,2,3,4) — one too many! Use i < 4."},
    {label:"Variant B",code:`#include <stdio.h>\nint main() {\n    int r = 3, c = 1;\n    for (int i = 1; i < 5; i++) {\n        c++;\n        MOVE(r, c);\n    }\n    return 0;\n}`,correct:true,explain:"i starts at 1, ends before 5 — that's 4 iterations. Correct!"},
    {label:"Variant C",code:`#include <stdio.h>\nint main() {\n    int r = 3, c = 1;\n    for (int i = 0; i < 3; i++) {\n        c++;\n        MOVE(r, c);\n    }\n    return 0;\n}`,correct:false,explain:"i < 3 runs only 3 times. One step short — should be i < 4."},
  ];
  const [sel,setSel]=useState(null);
  const [player,setPlayer]=useState({...pl});
  const [trail,setTrail]=useState([]);
  const [running,setRunning]=useState(false);
  const [flash,setFlash]=useState(false);
  const [msg,setMsg]=useState(null),[mtype,setMtype]=useState("info");
  const [won,setWon]=useState(false);
  const [checked,setChecked]=useState({});

  async function tryVariant(idx){
    const v=variants[idx];
    setRunning(true);setMsg(null);setPlayer({...pl});setTrail([]);setFlash(false);
    const {moves,err}=await compileAndRun(v.code);
    if(err){setMsg(err);setMtype("error");setRunning(false);return;}
    const {pos}=await animatePath(moves,pl,[],setPlayer,(t)=>setTrail(t),async()=>{},ANIM);
    setRunning(false);
    const ok=pos.row===pk.row&&pos.col===pk.col;
    setChecked(c=>({...c,[idx]:ok}));
    if(ok){setFlash(true);setMsg(`✅ ${v.label} works! ${v.explain}`);setMtype("success");if(!won){setWon(true);}}
    else{setMsg(`❌ ${v.label} misses: ${v.explain}`);setMtype("error");}
  }

  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="🔍" text="Off-by-one errors are the most common loop bug. The loop runs one time too many or too few." sub="Test all three variants — find which one reaches the Pokémon exactly."/>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {variants.map((v,i)=>(
            <div key={i} className={`variant-card${checked[i]===true?" variant-correct":checked[i]===false?" variant-wrong":""}`}>
              <div className="variant-header">
                <span className="variant-label">{v.label}</span>
                {checked[i]===true&&<span className="variant-badge variant-ok">✓ Correct</span>}
                {checked[i]===false&&<span className="variant-badge variant-bad">✗ Wrong</span>}
              </div>
              <CodeDisplay code={v.code.split("\n").slice(3,6).join("\n")}/>
              <button className="btn btn-ghost" style={{marginTop:6,fontSize:12}} onClick={()=>tryVariant(i)} disabled={running}>▶ Test this</button>
            </div>
          ))}
        </div>
        {msg&&<Callout type={mtype}>{msg}</Callout>}
        {won&&<BtnRow><button className="btn btn-success" onClick={() => onComplete(DEFAULT_STARS)}>Next →</button></BtnRow>}
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...pk,caught:false}]} trail={trail} flash={flash}/></div>
    </div>
  );
}

// ─── STAGE 17 · REVERSE DIRECTION ────────────────────────────────────────────
function S17Reverse({onComplete}) {
  const pl={row:6,col:7},pk={row:2,col:1};
  const starter=(r,c)=>`#include <stdio.h>\nint main() {\n    int r = ${r}, c = ${c};\n\n    // You're at bottom-right, target is top-left!\n    // Move UP and LEFT.\n\n    return 0;\n}`;
  const [code,setCode]=useState(starter(pl.row,pl.col));
  const {player,trail,running,flash,msg,msgType,won,stars,reset,run}=useRunner(pl,[{...pk}]);
  async function doRun(){await run(code,pl,[{...pk,caught:false}],[]);}
  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="↖️" text="Sometimes you need to move UP (r--) and LEFT (c--). The logic is the same — just decrement instead of increment." sub={`You're at (${pl.row},${pl.col}), target is (${pk.row},${pk.col}). Calculate the step counts yourself.`}/>
        <div className="write-hints">
          <div className="wh-row"><span className="wh-dir">↑ Up</span><span className="wh-val">{pl.row} − {pk.row} = <strong>{pl.row-pk.row}</strong> steps (r--)</span></div>
          <div className="wh-row"><span className="wh-dir">← Left</span><span className="wh-val">{pl.col} − {pk.col} = <strong>{pl.col-pk.col}</strong> steps (c--)</span></div>
        </div>
        <textarea className="code-editor" value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} rows={12}/>
        {msg&&<Callout type={msgType}>{msg}</Callout>}
        <BtnRow>
          <button className="btn btn-ghost" onClick={()=>{setCode(starter(pl.row,pl.col));reset();}} disabled={running}>↩ Reset</button>
          <button className="btn btn-primary" onClick={doRun} disabled={running}>{running?"Running…":"▶ Run"}</button>
          {won&&<button className="btn btn-success" onClick={() => onComplete(stars)}>Next →</button>}
        </BtnRow>
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...pk,caught:false}]} trail={trail} flash={flash}/></div>
    </div>
  );
}

// ─── STAGE 18 · COLLECT ALL ───────────────────────────────────────────────────
function S18Collect({onComplete}) {
  const pl={row:0,col:0};
  const allTargets=[
    {row:0,col:4,emoji:"🐱",caught:false},
    {row:4,col:4,emoji:"🐸",caught:false},
    {row:4,col:0,emoji:"🦋",caught:false},
  ];
  const starter=(r,c)=>`#include <stdio.h>\nint main() {\n    int r = ${r}, c = ${c};\n\n    // Catch all 3 Pokémon in order!\n    // 🐱 at (0,4) → 🐸 at (4,4) → 🦋 at (4,0)\n\n    return 0;\n}`;
  const [code,setCode]=useState(starter(pl.row,pl.col));
  const [player,setPlayer]=useState({...pl});
  const [targets,setTargets]=useState(allTargets.map(t=>({...t})));
  const [trail,setTrail]=useState([]);
  const [running,setRunning]=useState(false);
  const [flash,setFlash]=useState(false);
  const [msg,setMsg]=useState(null),[mtype,setMtype]=useState("info");
  const [won,setWon]=useState(false);

  async function doRun(){
    setRunning(true);setMsg("⏳ Compiling…");setMtype("info");
    const{moves,err}=await compileAndRun(code);
    if(err){setMsg(err);setMtype("error");setRunning(false);return;}
    setPlayer({...pl});setTargets(allTargets.map(t=>({...t})));setTrail([]);setFlash(false);setWon(false);setMsg(null);

    let pos={...pl};const trail=[];let tgts=allTargets.map(t=>({...t}));
    for(const tgt of moves){
      while(pos.row!==tgt.row){pos={row:pos.row+(tgt.row>pos.row?1:-1),col:pos.col};trail.push({...pos});setPlayer({...pos});setTrail([...trail]);await SLEEP(ANIM);
        tgts=tgts.map(t=>!t.caught&&t.row===pos.row&&t.col===pos.col?{...t,caught:true}:t);setTargets([...tgts]);
      }
      while(pos.col!==tgt.col){pos={row:pos.row,col:pos.col+(tgt.col>pos.col?1:-1)};trail.push({...pos});setPlayer({...pos});setTrail([...trail]);await SLEEP(ANIM);
        tgts=tgts.map(t=>!t.caught&&t.row===pos.row&&t.col===pos.col?{...t,caught:true}:t);setTargets([...tgts]);
      }
    }
    setRunning(false);
    const caughtAll=tgts.every(t=>t.caught);
    if(caughtAll){setFlash(true);setWon(true);setMsg("🎉 You caught all 3! Chaining loops to visit multiple targets.");setMtype("success");}
    else{const n=tgts.filter(t=>!t.caught).length;setMsg(`${n} Pokémon still uncaught. Trace your path on the grid.`);setMtype("hint");}
  }

  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="🧳" text="Visit multiple targets in sequence — each loop segment takes you to the next one." sub="Catch 🐱 first, then 🐸, then 🦋. Plan the full route."/>
        <div className="collect-targets">
          {allTargets.map((t,i)=>(
            <div key={i} className={`ct-item${targets[i]?.caught?" ct-caught":""}`}>
              <span className="ct-emoji">{t.emoji}</span>
              <span className="ct-pos">({t.row},{t.col})</span>
              <span className="ct-status">{targets[i]?.caught?"✅ Caught":"⬜ Not yet"}</span>
            </div>
          ))}
        </div>
        <textarea className="code-editor" value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} rows={14}/>
        {msg&&<Callout type={mtype}>{msg}</Callout>}
        <BtnRow>
          <button className="btn btn-ghost" onClick={()=>{setCode(starter(pl.row,pl.col));setPlayer({...pl});setTargets(allTargets.map(t=>({...t})));setTrail([]);setFlash(false);setWon(false);setMsg(null);}} disabled={running}>↩ Reset</button>
          <button className="btn btn-primary" onClick={doRun} disabled={running}>{running?"Running…":"▶ Run"}</button>
          {won&&<button className="btn btn-success" onClick={() => onComplete(DEFAULT_STARS)}>Next →</button>}
        </BtnRow>
      </div>
      <div className="stage-right"><Grid player={player} targets={targets} trail={trail} flash={flash}/></div>
    </div>
  );
}

// ─── STAGE 19 · SHORTEST PATH ─────────────────────────────────────────────────
function S19Shortest({onComplete}) {
  const pl={row:2,col:1},pk={row:6,col:6};
  const obs=[{row:4,col:3},{row:4,col:4},{row:3,col:4},{row:3,col:5}];
  const minDist=manhattan(pl,pk);
  const starter=(r,c)=>`#include <stdio.h>\nint main() {\n    int r = ${r}, c = ${c};\n\n    // Reach the target in as few moves as possible!\n    // Avoid rocks. Optimal ≈ ${minDist} steps.\n\n    return 0;\n}`;
  const [code,setCode]=useState(starter(pl.row,pl.col));
  const [player,setPlayer]=useState({...pl});
  const [trail,setTrail]=useState([]);
  const [running,setRunning]=useState(false);
  const [flash,setFlash]=useState(false);
  const [msg,setMsg]=useState(null),[mtype,setMtype]=useState("info");
  const [won,setWon]=useState(false);
  const [stars,setStars]=useState(0);
  const [moveCount,setMoveCount]=useState(0);
  const [attempts,setAttempts]=useState(0);

  async function doRun(){
    setRunning(true);setMsg("⏳ Compiling…");setMtype("info");
    const{moves,err}=await compileAndRun(code);
    if(err){setMsg(err);setMtype("error");setRunning(false);return;}
    setPlayer({...pl});setTrail([]);setFlash(false);setWon(false);setMsg(null);

    let stepCount=0;
    const{pos,hit}=await animatePath(moves,pl,obs,setPlayer,(t)=>{setTrail(t);stepCount=t.length;setMoveCount(t.length);},async(o)=>{setMsg(`💥 Hit rock at (${o.row},${o.col})!`);setMtype("error");},ANIM);
    setRunning(false);setAttempts(a=>a+1);
    if(hit)return;
    if(pos.row===pk.row&&pos.col===pk.col){
      const s=calcStars(stepCount,minDist);setStars(s);setFlash(true);setWon(true);
      setMsg(`${s===3?"🏆 Optimal!":s===2?"⭐⭐ Great!":"⭐ Got there!"} ${stepCount} moves (best possible ≈ ${minDist}).`);setMtype("success");
    }else{setMsg(`Not there yet — ${stepCount} moves used so far.`);setMtype("hint");}
  }

  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="🏆" text="Reach the target in the fewest moves possible — every extra step costs a star." sub={`Obstacles in the way. Min possible ≈ ${minDist} steps. Can you match it?`}/>
        {won&&<div className="stars-display">{[1,2,3].map(i=><span key={i} className={`star${i<=stars?" star-on":""}`}>★</span>)}<span className="stars-label">{stars===3?"Perfect!":stars===2?"Great!":"Keep trying!"}</span></div>}
        <div className="hunt-stats">
          <div className="hs-item"><span className="hs-label">Your moves</span><span className="hs-val">{moveCount}</span></div>
          <div className="hs-item"><span className="hs-label">Optimal</span><span className="hs-val">~{minDist}</span></div>
          <div className="hs-item"><span className="hs-label">Attempts</span><span className="hs-val">{attempts}</span></div>
        </div>
        <textarea className="code-editor" value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} rows={12}/>
        {msg&&<Callout type={mtype}>{msg}</Callout>}
        <BtnRow>
          <button className="btn btn-ghost" onClick={()=>{setCode(starter(pl.row,pl.col));setPlayer({...pl});setTrail([]);setFlash(false);setWon(false);setMsg(null);setStars(0);setMoveCount(0);}} disabled={running}>↩ Reset</button>
          <button className="btn btn-primary" onClick={doRun} disabled={running}>{running?"Running…":"▶ Run"}</button>
          {won&&<button className="btn btn-success" onClick={() => onComplete(stars)}>Next →</button>}
        </BtnRow>
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...pk,caught:false}]} trail={trail} flash={flash} obstacles={obs}/></div>
    </div>
  );
}

// ─── STAGE 20 · GRAND CHALLENGE ──────────────────────────────────────────────
function genGrandBoard(){
  let pl,pk;
  do{ pl={row:randInt(0,2),col:randInt(0,2)}; pk={row:randInt(5,7),col:randInt(5,7)}; }
  while(manhattan(pl,pk)<7);
  const obs=[];
  for(let t=0;t<60&&obs.length<10;t++){
    const o={row:randInt(1,6),col:randInt(1,6)};
    const clash=(o.row===pl.row&&o.col===pl.col)||(o.row===pk.row&&o.col===pk.col)||obs.some(x=>x.row===o.row&&x.col===o.col);
    if(!clash)obs.push(o);
  }
  return{pl,pk,obs};
}

function S20Grand({onComplete}) {
  const [board,setBoard]=useState(()=>genGrandBoard());
  const makeCode=(r,c)=>`#include <stdio.h>\nint main() {\n    int r = ${r}, c = ${c};\n\n    // Grand challenge — no hints!\n    // Use any loops you know.\n\n    return 0;\n}`;
  const [code,setCode]=useState(()=>makeCode(board.pl.row,board.pl.col));
  const [player,setPlayer]=useState({...board.pl});
  const [trail,setTrail]=useState([]);
  const [running,setRunning]=useState(false);
  const [flash,setFlash]=useState(false);
  const [msg,setMsg]=useState(null),[mtype,setMtype]=useState("info");
  const [won,setWon]=useState(false);
  const [stars,setStars]=useState(0);
  const [moveCount,setMoveCount]=useState(0);
  const [bestStars,setBestStars]=useState(0);

  function newBoard(){
    const b=genGrandBoard();
    setBoard(b);setCode(makeCode(b.pl.row,b.pl.col));setPlayer({...b.pl});
    setTrail([]);setFlash(false);setWon(false);setMsg(null);setStars(0);setMoveCount(0);
  }

  async function doRun(){
    setRunning(true);setMsg("⏳ Compiling…");setMtype("info");
    const{moves,err}=await compileAndRun(code);
    if(err){setMsg(err);setMtype("error");setRunning(false);return;}
    setPlayer({...board.pl});setTrail([]);setFlash(false);setWon(false);setMsg(null);
    let sc=0;
    const{pos,hit}=await animatePath(moves,board.pl,board.obs,setPlayer,(t)=>{setTrail(t);sc=t.length;setMoveCount(t.length);},async(o)=>{setMsg(`💥 Rock at (${o.row},${o.col})!`);setMtype("error");},ANIM);
    setRunning(false);
    if(hit)return;
    if(pos.row===board.pk.row&&pos.col===board.pk.col){
      const s=calcStars(sc,manhattan(board.pl,board.pk));
      setStars(s);setBestStars(b=>Math.max(b,s));
      setFlash(true);setWon(true);
      setMsg(`${"⭐".repeat(s)} ${sc} moves! Best possible ≈ ${manhattan(board.pl,board.pk)}.`);setMtype("success");
    }else{
      const rd=board.pk.row-pos.row,cd=board.pk.col-pos.col;
      const p=[];if(cd!==0)p.push(`${Math.abs(cd)} col(s) ${cd>0?"right":"left"}`);if(rd!==0)p.push(`${Math.abs(rd)} row(s) ${rd>0?"down":"up"}`);
      setMsg(`Not there — ${p.join(", ")} off.`);setMtype("hint");
    }
  }

  return (
    <div className="stage-wrap">
      <div className="stage-left">
        <Lesson icon="🎓" text="Grand challenge — random board, real obstacles, no hints. Use everything you've learned." sub="Try multiple boards! Your best star rating across attempts is tracked."/>
        {won&&<div className="stars-display">{[1,2,3].map(i=><span key={i} className={`star${i<=stars?" star-on":""}`}>★</span>)}<span className="stars-label">{stars===3?"Perfect route!":stars===2?"Great!":"Good try!"}</span></div>}
        <div className="hunt-stats">
          <div className="hs-item"><span className="hs-label">Moves</span><span className="hs-val">{moveCount}</span></div>
          <div className="hs-item"><span className="hs-label">Optimal</span><span className="hs-val">~{manhattan(board.pl,board.pk)}</span></div>
          <div className="hs-item"><span className="hs-label">Best ★</span><span className="hs-val">{bestStars}/3</span></div>
        </div>
        <textarea className="code-editor" value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} rows={12}/>
        {msg&&<Callout type={mtype}>{msg}</Callout>}
        <BtnRow>
          <button className="btn btn-ghost" onClick={newBoard} disabled={running}>🎲 New board</button>
          <button className="btn btn-ghost" onClick={()=>{setCode(makeCode(board.pl.row,board.pl.col));setPlayer({...board.pl});setTrail([]);setFlash(false);setWon(false);setMsg(null);setStars(0);setMoveCount(0);}} disabled={running}>↩ Reset</button>
          <button className="btn btn-primary" onClick={doRun} disabled={running}>{running?"Running…":"▶ Run"}</button>
          {won&&<button className="btn btn-success" onClick={() => onComplete(stars)}>Finish 🎓</button>}
        </BtnRow>
      </div>
      <div className="stage-right"><Grid player={player} targets={[{...board.pk,caught:false}]} trail={trail} flash={flash} obstacles={board.obs}/></div>
    </div>
  );
}

// ─── COMPLETION ───────────────────────────────────────────────────────────────
function Completion({totalStars, onRestart, submitScore, isSubmitting, submitSuccess, submitMessage, snackbarOpen, setSnackbarOpen}) {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === "dark";
  const items=[
    ["Intro",   "A for loop runs N times — the number controls how many steps"],
    ["Intro",   "r is the row, c is the column. Row 0 is at the top"],
    ["Intro",   "r++/r-- = down/up · c++/c-- = right/left"],
    ["Beginner","Chain two loops to move in two directions"],
    ["Beginner","Choose each loop's direction based on where you need to go"],
    ["Normal",  "Countdown loops: i = N; i > 0; i-- moves the other way"],
    ["Normal",  "Calculate loop count from coordinates: target − start"],
    ["Normal",  "Debugging means reading code to find what's wrong"],
    ["Hard",    "Plan around obstacles before you write a single loop"],
    ["Hard",    "while (i < N) {} is equivalent to for — but you manage i yourself"],
    ["Hard",    "while (c < target) {} uses the destination as the condition"],
    ["Hard",    "Nested loops: outer × inner = total moves"],
    ["Expert",  "Off-by-one: i <= N runs N+1 times, i < N runs N times"],
    ["Expert",  "Reverse paths use r-- and c-- — the math is just subtraction"],
    ["Expert",  "Multi-target: sequence your loops to visit each stop"],
    ["Master",  "Optimal paths minimize total moves — plan before you code"],
  ];
  return (
    <div className={`completion-wrap ${isDark ? "theme-dark" : "theme-light"}`}>
      <div className="completion-card">
        <div className="completion-trophy">🎓</div>
        <h2 className="completion-title">Course complete!</h2>
        <p className="completion-sub">20 stages. Everything you learned:</p>
        <div className="completion-list">
          {items.map(([d,t])=>{
            const c = diffColor(d, isDark);
            return (
              <div key={t} className="cl-item">
                <span className="cl-diff" style={{background:c+"22",color:c}}>{d}</span>
                {t}
              </div>
            );
          })}
        </div>
        <pre className="completion-code">{`// Core patterns you now know:
for (int i = 0; i < N; i++)   { r++; MOVE(r,c); }
for (int i = N; i > 0; i--)   { c--; MOVE(r,c); }
int i=0; while (i < N)        { r++; MOVE(r,c); i++; }
while (c < target_col)         { c++; MOVE(r,c); }
for (int a=0;a<R;a++)
  for (int b=0;b<C;b++)       { MOVE(a,b); }`}</pre>
        
        {submitSuccess ? (
          <div className="submit-success-msg" style={{color: "#22c55e", fontWeight: 600, marginTop: 16}}>
            ✓ Score submitted to leaderboard!
          </div>
        ) : (
          <>
            <div className="completion-score-details">
              <span className="completion-stars-count">{totalStars}</span> stars collected 
              (Score: <strong>{totalStars * 10}</strong>)
            </div>
            <button 
              className="btn btn-primary completion-submit-btn" 
              onClick={() => submitScore('GRID', { score: totalStars * 10, wpm: 0, accuracy: Math.round((totalStars / MAX_POSSIBLE_STARS) * 100) })}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : `Submit Score (${totalStars * 10} pts)`}
            </button>
          </>
        )}
        
        <button className="btn btn-ghost" onClick={onRestart} style={{marginTop: 12}}>↩ Start over</button>
      </div>
      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity={submitSuccess ? "success" : "error"} onClose={() => setSnackbarOpen(false)}>
          {submitMessage || (submitSuccess ? "Score submitted!" : "Failed to submit score")}
        </Alert>
      </Snackbar>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
const SCENE_COMPONENTS = [
  S1Watch, S2Fill, S3Direction, S4Write1, S5TwoBlanks,
  S6ChooseDirs, S7Write2, S8Debug, S9Obstacle, S10Countdown,
  S11Coords, S12While, S13WhileCond, S14Nested, S15MultiObs,
  S16OffByOne, S17Reverse, S18Collect, S19Shortest, S20Grand,
];

export default function GridGame() {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === "dark";

  const [stage,setStage] = useState(0);
  const [done,setDone]   = useState(false);
  const totalStarsRef = useRef(0);
  
  // Callback to accumulate stars when a stage completes
  const handleStageComplete = useCallback((stars = 0) => {
    totalStarsRef.current += stars;
  }, []);
  
  const next = useCallback((stars = 0) => { 
    handleStageComplete(stars);
    setStage(s => {
      if (s < STAGES.length - 1) {
        return s + 1;
      }
      setDone(true);
      return s;
    });
  }, [handleStageComplete]);
  
  // Reset totalStars when restarting
  const handleRestart = useCallback(() => {
    totalStarsRef.current = 0;
    setStage(0);
    setDone(false);
  }, []);
  
  // Score submission state
  const { submitScore, isSubmitting, submitMessage, submitSuccess, snackbarOpen, setSnackbarOpen } = useScoreSubmission();
  
  if(done) return <Completion 
    totalStars={totalStarsRef.current}
    onRestart={handleRestart}
    submitScore={submitScore}
    isSubmitting={isSubmitting}
    submitSuccess={submitSuccess}
    submitMessage={submitMessage}
    snackbarOpen={snackbarOpen}
    setSnackbarOpen={setSnackbarOpen}
  />;
  const Scene = SCENE_COMPONENTS[stage];
  const s = STAGES[stage];
  return (
    <ThemeCtx.Provider value={isDark}>
      <div className={`app-root ${isDark ? "theme-dark" : "theme-light"}`}>
        <header className="app-header">
          <div className="app-logo">🎮 <span>Loop Lab</span></div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <DiffBadge d={s.difficulty}/>
            <div className="stage-pill">Stage {stage+1} of {STAGES.length}</div>
          </div>
        </header>
        <ProgressBar stage={stage}/>
        <div className="stage-title-wrap"><h2 className="stage-title">{s.title}</h2></div>
        <main className="app-main"><Scene onComplete={next}/></main>
      </div>
    </ThemeCtx.Provider>
  );
}
