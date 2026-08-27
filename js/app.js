import { initAuth, login, register, logout } from "./auth.js";
import { state } from "./state.js";
import { loadTasks, createDefaultTasks, addDailyTask, addPlannedTask, updateTask, removeTask } from "./tasks.js";
import { dateKey, renderDate, renderDaily, renderPlanned, renderProgress, renderStats, formatTime } from "./ui.js";
import { collection, doc, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { db } from "./firebase.js";

const $=id=>document.getElementById(id), loginScreen=$("loginScreen"), app=$("app");
const completionCol=()=>collection(db,"users",state.user.uid,"completions");
const completionDoc=d=>doc(db,"users",state.user.uid,"completions",d);

async function loadCompletions(){
  state.completions={}; const s=await getDocs(completionCol());
  s.forEach(x=>state.completions[x.id]=x.data());
}
async function saveCompletion(taskId,date,value){
  if(!state.completions[taskId])state.completions[taskId]={};
  state.completions[taskId][date]=value;
  await setDoc(completionDoc(date),state.completionsForDate(date),{merge:true});
}
state.completionsForDate=function(date){const o={};for(const id in state.completions)if(state.completions[id][date]!==undefined)o[id]=state.completions[id][date];return o};

initAuth(async user=>{
  if(!user){loginScreen.hidden=false;app.hidden=true;return}
  loginScreen.hidden=true;app.hidden=false;$("userEmail").textContent=user.email;
  try{await loadTasks();await createDefaultTasks();await loadCompletions();render()}catch(e){console.error(e);alert("Не удалось загрузить данные Firebase. Проверь конфигурацию и Rules.")}
});

$("loginButton").onclick=async()=>{try{await login($("loginEmail").value.trim(),$("loginPassword").value)}catch(e){$("loginError").textContent=authError(e)}};
$("registerButton").onclick=async()=>{try{await register($("loginEmail").value.trim(),$("loginPassword").value)}catch(e){$("loginError").textContent=authError(e)}};
$("logoutButton").onclick=()=>logout();
$("userButton").onclick=()=>{$("userMenu").hidden=!$("userMenu").hidden};
function authError(e){return ({ "auth/invalid-credential":"Неверный email или пароль","auth/email-already-in-use":"Этот email уже используется","auth/weak-password":"Пароль должен быть минимум 6 символов","auth/invalid-email":"Некорректный email"})[e.code]||"Ошибка авторизации"}

function render(){renderDate();renderDaily(toggleDaily,deleteDaily,updateCounter,toggleTimer);renderPlanned(togglePlanned,deletePlanned);renderProgress();renderStats();renderTodaySpecial()}

async function toggleDaily(t){const d=dateKey(),v=!!state.completions[t.id]?.[d];await saveCompletion(t.id,d,!v);render()}
async function updateCounter(t,v){await saveCompletion(t.id,dateKey(),v);render()}
async function togglePlanned(t){t.completed=!t.completed;await updateTask("planned",t.id,{completed:t.completed});render()}
async function deleteDaily(t){if(confirm(`Удалить "${t.name}"?`)){await removeTask("daily",t.id);render()}}
async function deletePlanned(t){if(confirm(`Удалить "${t.name}"?`)){await removeTask("planned",t.id);render()}}

function toggleTimer(t){
  const id=t.id,d=dateKey(); if(state.timerIntervals[id]){clearInterval(state.timerIntervals[id]);delete state.timerIntervals[id];render();return}
  let start=Number(state.completions[id]?.[d]||0);
  state.timerIntervals[id]=setInterval(async()=>{
    start++; if(start>=Number(t.target)){clearInterval(state.timerIntervals[id]);delete state.timerIntervals[id]}
    await saveCompletion(id,d,start);render();
  },1000); render();
}

function renderTodaySpecial(){
  const c=$("todaySpecialList"),d=dateKey();c.innerHTML="";
  state.plannedTasks.filter(t=>t.date===d).forEach(t=>{
    const el=document.createElement("div");el.className="task"+(t.completed?" completed":"");
    const cb=document.createElement("button");cb.className="checkbox";cb.textContent=t.completed?"✓":"";cb.onclick=()=>togglePlanned(t);el.appendChild(cb);
    const ic=document.createElement("div");ic.className="task-icon";ic.textContent=t.icon||"🎯";el.appendChild(ic);
    const cont=document.createElement("div");cont.className="task-content";cont.innerHTML=`<div class="task-name">${escapeHtml(t.name)}</div><div class="task-meta">сегодня</div>`;el.appendChild(cont);c.appendChild(el);
  });
  $("todaySpecialSection").hidden=!c.children.length;
}
function escapeHtml(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}

const modal=$("taskModal");
function openModal(type){state.modalType=type;$("modalTitle").textContent=type==="daily"?"Новое ежедневное":"Задание на дату";$("dateField").hidden=type!=="planned";$("taskName").value="";$("taskIcon").value="🎮";$("taskType").value="check";$("taskTarget").value=10;$("taskNote").value="";$("taskDate").value=dateKey();$("targetField").hidden=true;modal.hidden=false}
$("addTaskButton").onclick=()=>openModal("daily");$("emptyDailyButton").onclick=()=>openModal("daily");$("plannedButton").onclick=()=>openModal("planned");
function closeModal(){$("taskModal").hidden=true}
$("closeModalButton").onclick=closeModal;$("cancelModalButton").onclick=closeModal;
$("taskType").onchange=e=>$("targetField").hidden=e.target.value==="check";
$("saveTaskButton").onclick=async()=>{
  const name=$("taskName").value.trim();if(!name)return alert("Введите название");
  const type=$("taskType").value,task={name,icon:$("taskIcon").value||"🎮",type,note:$("taskNote").value.trim()};
  if(type!=="check")task.target=Number($("taskTarget").value)||1;
  if(state.modalType==="daily")await addDailyTask(task);else{task.date=$("taskDate").value;if(!task.date)return alert("Выберите дату");await addPlannedTask(task)}
  closeModal();render();
};

$("calendarButton").onclick=()=>openCalendar();$("closeCalendarButton").onclick=()=>$("calendarModal").hidden=true;
function openCalendar(){renderCalendar();$("calendarModal").hidden=false}
function renderCalendar(){
  const c=$("calendar"),d=state.calendarMonth,year=d.getFullYear(),month=d.getMonth();
  const first=new Date(year,month,1),days=new Date(year,month+1,0).getDate(),offset=(first.getDay()+6)%7;
  c.innerHTML=`<div class="calendar-title"><button class="calendar-nav" id="prevMonth">‹</button><span>${d.toLocaleDateString("ru-RU",{month:"long",year:"numeric"})}</span><button class="calendar-nav" id="nextMonth">›</button></div>`;
  const grid=document.createElement("div");grid.className="calendar-grid";["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].forEach(x=>{const e=document.createElement("div");e.className="calendar-weekday";e.textContent=x;grid.appendChild(e)});
  for(let i=0;i<offset;i++)grid.appendChild(document.createElement("div"));
  for(let day=1;day<=days;day++){const cell=document.createElement("button");cell.className="calendar-day-cell";const k=dateKey(new Date(year,month,day));cell.textContent=day;if(k===dateKey())cell.classList.add("today");if(state.dailyTasks.length&&state.dailyTasks.every(t=>{const v=state.completions[t.id]?.[k];return t.type==="counter"||t.type==="timer"?Number(v||0)>=Number(t.target):!!v}))cell.classList.add("complete");cell.onclick=()=>{$("calendarDay").textContent=`${new Date(k+"T00:00:00").toLocaleDateString("ru-RU",{weekday:"long",day:"numeric",month:"long"})}`};grid.appendChild(cell)}
  c.appendChild(grid);$("prevMonth").onclick=()=>{d.setMonth(month-1);renderCalendar()};$("nextMonth").onclick=()=>{d.setMonth(month+1);renderCalendar()}
}
