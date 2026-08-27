import { state } from "./state.js";

export const $ = id => document.getElementById(id);
export const todayKey = () => dateKey(new Date());
export function dateKey(d){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
export function fromKey(k){ return new Date(k+"T00:00:00"); }
export function formatDate(k){ return fromKey(k).toLocaleDateString("ru-RU",{weekday:"long",day:"numeric",month:"long"}); }
export function formatShort(k){ return fromKey(k).toLocaleDateString("ru-RU",{day:"numeric",month:"short"}); }
export function timeText(sec){
  sec=Math.max(0,Math.floor(sec||0));
  const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;
  return h ? `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
export function isDone(task,date){
  const v=state.completions[task.id]?.[date];
  if(task.type==="timer") return Number(v||0)>=3600;
  if(task.type==="value") return String(v??"").trim()!=="";
  return !!v;
}
export function iconSrc(icon){
  return icon && /\.(svg|png|webp|jpg|jpeg)$/i.test(icon) ? `./icons/${icon}` : null;
}
function safe(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function iconHTML(icon){
  const src=iconSrc(icon);
  if(src) return `<img src="${src}" alt="">`;
  return `<span class="emoji">${safe(icon||"🎮")}</span>`;
}

export function renderAll(handlers){
  renderDate();
  renderDaily(handlers);
  renderPlanned(handlers);
  renderSelectedPlanned(handlers);
  renderProgress();
  renderStats();
}
function renderDate(){
  const d=state.selectedDate,k=dateKey(d),today=todayKey(),isToday=k===today;
  $("dateTitle").textContent=d.toLocaleDateString("ru-RU",{weekday:"long",day:"numeric",month:"long"});
  $("selectedDateLabel").textContent=isToday?"Сегодня":formatDate(k);
  $("todayButton").hidden=isToday;
}
function renderDaily(h){
  const list=$("dailyList"); list.innerHTML="";
  const day=dateKey(state.selectedDate);
  const tasks=state.daily.filter(t=>t.active!==false);
  for(const task of tasks){
    const done=isDone(task,day),value=state.completions[task.id]?.[day] ?? "";
    const row=document.createElement("div"); row.className="task"+(done?" completed":"");

    const check=document.createElement("button"); check.className="check-button"; check.textContent=done?"✓":""; check.title=done?"Снять отметку":"Отметить"; check.onclick=()=>h.toggle(task); row.append(check);
    const ico=document.createElement("div"); ico.className="task-icon"; ico.innerHTML=iconHTML(task.icon); row.append(ico);

    const main=document.createElement("div"); main.className="task-main";
    let meta=task.note || (task.type==="timer"?"таймер 1 час":task.type==="value"?(value?`значение: ${safe(value)}`:"введите значение"):"каждый день");
    main.innerHTML=`<div class="task-name">${safe(task.name)}</div><div class="task-meta">${safe(meta)}</div>`; row.append(main);

    if(task.type==="timer") row.append(timerControls(task,day,Number(value||0),h));
    if(task.type==="value") row.append(valueControls(task,day,value,h));

    const actions=document.createElement("div"); actions.className="task-actions";
    const edit=document.createElement("button"); edit.className="task-action"; edit.title="Редактировать"; edit.textContent="✎"; edit.onclick=()=>h.edit(task,"daily");
    const del=document.createElement("button"); del.className="task-action delete"; del.title="Удалить"; del.textContent="×"; del.onclick=()=>h.remove(task,"daily");
    actions.append(edit,del); row.append(actions);
    list.append(row);
  }
  $("dailyCount").textContent=tasks.length;
}
function timerControls(task,day,value,h){
  const box=document.createElement("div"); box.className="timer-box";
  const active=state.timers[task.id]?.date===day;
  const elapsed=active ? value + Math.floor((Date.now()-state.timers[task.id].startedAt)/1000) : value;
  const t=document.createElement("span"); t.className="timer-time"; t.textContent=timeText(elapsed); box.append(t);
  const start=document.createElement("button"); start.className="timer-start"; start.textContent=active?"Стоп":"Старт"; start.onclick=()=>h.timer(task);
  const reset=document.createElement("button"); reset.className="timer-reset"; reset.title="Сбросить таймер"; reset.textContent="↺"; reset.onclick=()=>h.resetTimer(task);
  box.append(start,reset);
  return box;
}
function valueControls(task,day,value,h){
  const box=document.createElement("div"); box.className="task-value";
  const input=document.createElement("input"); input.className="value-input"; input.placeholder="значение"; input.value=value||""; input.title="Введите значение";
  const save=document.createElement("button"); save.className="value-save"; save.textContent="OK"; save.onclick=()=>h.value(task,input.value.trim());
  input.onkeydown=e=>{if(e.key==="Enter")h.value(task,input.value.trim())};
  box.append(input,save); return box;
}
function plannedRow(task,h){
  const row=document.createElement("div"); row.className="task"+(task.completed?" completed":"");
  const check=document.createElement("button"); check.className="check-button"; check.textContent=task.completed?"✓":""; check.onclick=()=>h.togglePlanned(task); row.append(check);
  const d=fromKey(task.date),date=document.createElement("div");date.className="planned-date";date.innerHTML=`<b>${d.getDate()}</b><small>${d.toLocaleDateString("ru-RU",{month:"short"})}</small>`;row.append(date);
  const ico=document.createElement("div");ico.className="task-icon";ico.innerHTML=iconHTML(task.icon);row.append(ico);
  const main=document.createElement("div");main.className="planned-main";main.innerHTML=`<div class="task-name">${safe(task.name)}</div><div class="task-meta">${safe(formatShort(task.date)+(task.note?" · "+task.note:""))}</div>`;row.append(main);
  const actions=document.createElement("div");actions.className="task-actions";
  const edit=document.createElement("button");edit.className="task-action";edit.title="Редактировать";edit.textContent="✎";edit.onclick=()=>h.edit(task,"planned");
  const del=document.createElement("button");del.className="task-action delete";del.textContent="×";del.onclick=()=>h.remove(task,"planned");actions.append(edit,del);row.append(actions);
  return row;
}
function renderPlanned(h){
  const list=$("plannedList");list.innerHTML="";const today=todayKey();
  const items=state.planned.filter(t=>t.date>=today).sort((a,b)=>a.date.localeCompare(b.date));
  items.slice(0,10).forEach(t=>list.append(plannedRow(t,h)));
  $("plannedCount").textContent=items.length;
}
function renderSelectedPlanned(h){
  const list=$("selectedPlannedList"),day=dateKey(state.selectedDate);list.innerHTML="";
  const items=state.planned.filter(t=>t.date===day);
  items.forEach(t=>list.append(plannedRow(t,h)));
  $("selectedPlannedCount").textContent=items.length;
  $("selectedPlannedSection").hidden=!items.length;
}
function renderProgress(){
  const day=dateKey(state.selectedDate),tasks=state.daily.filter(t=>t.active!==false),done=tasks.filter(t=>isDone(t,day)).length,p=tasks.length?Math.round(done/tasks.length*100):0;
  $("percent").textContent=p+"%";$("progressBar").style.width=p+"%";$("progressText").textContent=`${done} из ${tasks.length} выполнено`;
}
function renderStats(){
  let completed=0;for(const id in state.completions)for(const d in state.completions[id])if(state.completions[id][d])completed++;
  $("completedCount").textContent=completed;
  const days=[];for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);days.push(dateKey(d))}
  let total=state.daily.length*7,done=0;for(const t of state.daily)for(const d of days)if(isDone(t,d))done++;
  $("weekPercent").textContent=(total?Math.round(done/total*100):0)+"%";
  let streak=0;for(let i=0;i<365;i++){const d=new Date();d.setDate(d.getDate()-i);const k=dateKey(d);if(state.daily.length&&state.daily.every(t=>isDone(t,k)))streak++;else break}
  $("streak").textContent=streak;
}
