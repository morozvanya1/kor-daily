import { state } from "./state.js";

export function dateKey(date=new Date()){
  const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,"0"),d=String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
export function formatDate(value){
  return new Date(value+"T00:00:00").toLocaleDateString("ru-RU",{day:"numeric",month:"long"});
}
export function formatTime(seconds){
  seconds=Math.max(0,Math.floor(seconds));
  const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;
  return h?`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
export function renderDate(){
  document.getElementById("todayTitle").textContent=new Date().toLocaleDateString("ru-RU",{weekday:"long",day:"numeric",month:"long"});
}
function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}

export function renderDaily(onToggle,onDelete,onCounter,onTimer){
  const c=document.getElementById("dailyList"),today=dateKey(); c.innerHTML="";
  const tasks=state.dailyTasks.filter(t=>t.active!==false);
  for(const task of tasks){
    const value=state.completions[task.id]?.[today] ?? (task.type==="counter"?0:false);
    const done=task.type==="counter"?Number(value)>=Number(task.target):task.type==="timer"?Number(value)>=Number(task.target):!!value;
    const el=document.createElement("div"); el.className="task"+(done?" completed":"");
    const cb=document.createElement("button"); cb.className="checkbox"; cb.textContent=done?"✓":""; cb.onclick=()=>onToggle(task); el.appendChild(cb);
    const ic=document.createElement("div"); ic.className="task-icon"; ic.textContent=task.icon||"🎮"; el.appendChild(ic);
    const content=document.createElement("div"); content.className="task-content";
    content.innerHTML=`<div class="task-name">${esc(task.name)}</div><div class="task-meta">${task.note?esc(task.note):"каждый день"}</div>`; el.appendChild(content);
    if(task.type==="counter") el.appendChild(counter(task,today,onCounter));
    if(task.type==="timer") el.appendChild(timer(task,today,onTimer));
    const del=document.createElement("button"); del.className="task-action"; del.textContent="×"; del.onclick=()=>onDelete(task); el.appendChild(del);
    c.appendChild(el);
  }
  document.getElementById("dailyCount").textContent=tasks.length;
}
function counter(task,today,cb){
  const w=document.createElement("div"); w.className="counter"; const v=Number(state.completions[task.id]?.[today]||0);
  const minus=document.createElement("button"); minus.className="counter-button"; minus.textContent="−"; minus.onclick=()=>cb(task,Math.max(0,v-1));
  const text=document.createElement("div"); text.className="counter-value"; text.textContent=`${v}/${task.target}`;
  const plus=document.createElement("button"); plus.className="counter-button"; plus.textContent="+"; plus.onclick=()=>cb(task,Math.min(Number(task.target),v+1));
  w.append(minus,text,plus); return w;
}
function timer(task,today,cb){
  const w=document.createElement("div"); w.className="timer";
  const v=Number(state.completions[task.id]?.[today]||0);
  const text=document.createElement("div"); text.className="timer-value"; text.textContent=`${formatTime(v)} / ${formatTime(task.target)}`;
  const b=document.createElement("button"); b.className="timer-button"; b.textContent=state.timerIntervals[task.id]?"Стоп":"Старт"; b.onclick=()=>cb(task);
  w.append(text,b); return w;
}
export function renderPlanned(onToggle,onDelete){
  const c=document.getElementById("plannedList"),today=dateKey(); c.innerHTML="";
  const items=state.plannedTasks.filter(t=>t.date>=today).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,10);
  for(const task of items){
    const d=new Date(task.date+"T00:00:00"),el=document.createElement("div"); el.className="task"+(task.completed?" completed":"");
    const cb=document.createElement("button"); cb.className="checkbox"; cb.textContent=task.completed?"✓":""; cb.onclick=()=>onToggle(task); el.appendChild(cb);
    const date=document.createElement("div"); date.className="planned-date"; date.innerHTML=`<div class="planned-day">${d.getDate()}</div><div class="planned-month">${d.toLocaleDateString("ru-RU",{month:"short"})}</div>`; el.appendChild(date);
    const ic=document.createElement("div"); ic.className="task-icon"; ic.textContent=task.icon||"🎯"; el.appendChild(ic);
    const cont=document.createElement("div"); cont.className="planned-content"; cont.innerHTML=`<div class="planned-name">${esc(task.name)}</div><div class="planned-meta">${formatDate(task.date)}${task.note?" · "+esc(task.note):""}</div>`; el.appendChild(cont);
    const del=document.createElement("button"); del.className="task-action"; del.textContent="×"; del.onclick=()=>onDelete(task); el.appendChild(del); c.appendChild(el);
  }
  document.getElementById("plannedCount").textContent=state.plannedTasks.length;
}
export function renderProgress(){
  const today=dateKey(),tasks=state.dailyTasks.filter(t=>t.active!==false); let done=0;
  for(const t of tasks){const v=state.completions[t.id]?.[today]; if(t.type==="counter"||t.type==="timer"){if(Number(v||0)>=Number(t.target))done++;}else if(v)done++;}
  const p=tasks.length?Math.round(done/tasks.length*100):0;
  document.getElementById("progressBar").style.width=p+"%"; document.getElementById("todayPercent").textContent=p+"%"; document.getElementById("progressText").textContent=`${done} из ${tasks.length} выполнено`;
}
export function renderStats(){
  let completed=0; for(const id in state.completions) for(const d in state.completions[id]) if(state.completions[id][d]) completed++;
  document.getElementById("statCompleted").textContent=completed;
  const days=[]; for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);days.push(dateKey(d));}
  let total=0,done=0; for(const t of state.dailyTasks){total+=7;for(const d of days)if(state.completions[t.id]?.[d])done++;}
  document.getElementById("statPercent").textContent=(total?Math.round(done/total*100):0)+"%";
  let streak=0; for(let i=0;i<365;i++){const d=new Date();d.setDate(d.getDate()-i);const k=dateKey(d);const all=state.dailyTasks.length&&state.dailyTasks.every(t=>{const v=state.completions[t.id]?.[k];return t.type==="counter"||t.type==="timer"?Number(v||0)>=Number(t.target):!!v});if(all)streak++;else break;}
  document.getElementById("statStreak").textContent=streak;
}
