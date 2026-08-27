import { watchAuth, login, register, logout } from "./auth.js";
import { state } from "./state.js";
import { loadAll, ensureDefaults, createDaily, createPlanned, updateTask, deleteTask, saveCompletion } from "./data.js";
import { $, dateKey, todayKey, renderAll } from "./ui.js";
import { openCalendar, closeCalendar, moveMonth } from "./calendar.js";

const ICONS=[
  ["gear.svg","Механорум"],["swords.svg","Бой"],["ticket.svg","Лотерея"],["gem.svg","Кристаллы"],
  ["dragon.svg","Дракон"],["crown.svg","Награда"],["shield.svg","Защита"],["potion.svg","Зелье"],
  ["chest.svg","Сундук"],["coin.svg","Монеты"],["scroll.svg","Задание"],["map.svg","Карта"],
  ["dice.svg","Игра"],["bow.svg","Лучник"],["fire.svg","Огонь"],["star.svg","Звезда"]
];

function authError(e){
  return ({
    "auth/invalid-credential":"Неверный email или пароль",
    "auth/email-already-in-use":"Этот email уже используется",
    "auth/weak-password":"Пароль должен быть минимум 6 символов",
    "auth/invalid-email":"Некорректный email",
    "auth/missing-password":"Введите пароль"
  })[e.code] || e.message || "Ошибка";
}
function setAuthError(text){$("loginError").textContent=text||""}
function setTaskError(text){$("taskError").textContent=text||""}

watchAuth(async user=>{
  if(!user){$("loginScreen").hidden=false;$("app").hidden=true;return}
  $("loginScreen").hidden=true;$("app").hidden=false;$("userEmail").textContent=user.email||"";
  try{await loadAll();await ensureDefaults();render()}catch(e){console.error(e);alert("Не удалось загрузить данные Firebase. Проверь firebaseConfig и Firestore Rules.");}
});

$("loginButton").addEventListener("click",async()=>{
  setAuthError("");
  try{await login($("loginEmail").value.trim(),$("loginPassword").value)}catch(e){setAuthError(authError(e))}
});
$("registerButton").addEventListener("click",async()=>{
  setAuthError("");
  const email=$("loginEmail").value.trim(),password=$("loginPassword").value;
  if(!email||!password){setAuthError("Введите email и пароль");return}
  try{await register(email,password)}catch(e){setAuthError(authError(e))}
});
$("logoutButton").addEventListener("click",logout);
$("userButton").addEventListener("click",()=>{$("userMenu").hidden=!$("userMenu").hidden});
document.addEventListener("click",e=>{
  if(!$("userMenu").hidden && !e.target.closest("#userMenu") && !e.target.closest("#userButton"))$("userMenu").hidden=true;
});

function render(){renderAll(handlers); updateRunningTimers();}
const handlers={
  toggle: async task=>{
    const day=dateKey(state.selectedDate),value=state.completions[task.id]?.[day];
    if(task.type==="timer"){ if(Number(value||0)>=3600) await saveCompletion(task.id,day,0); else await saveCompletion(task.id,day,3600); }
    else if(task.type==="value"){ if(value) await saveCompletion(task.id,day,""); else openModal("daily",task); }
    else await saveCompletion(task.id,day,!value);
    render();
  },
  value: async(task,value)=>{await saveCompletion(task.id,dateKey(state.selectedDate),value);render()},
  timer: task=>{
    const id=task.id,day=dateKey(state.selectedDate);
    if(state.timers[id]?.date===day){stopTimer(task);return}
    state.timers[id]={date:day,startedAt:Date.now()};
    render();
  },
  resetTimer: async task=>{
    const id=task.id;
    if(state.timers[id]){clearInterval(state.timers[id].interval);delete state.timers[id]}
    await saveCompletion(id,dateKey(state.selectedDate),0);
    render();
  },
  togglePlanned: async task=>{await updateTask("planned",task.id,{completed:!task.completed});render()},
  edit:(task,type)=>openModal(type,task),
  remove:async(task,type)=>{
    if(confirm(`Удалить «${task.name}»?`)){if(state.timers[task.id]){clearInterval(state.timers[task.id].interval);delete state.timers[task.id]}await deleteTask(type,task.id);render()}
  }
};

function stopTimer(task){
  const running=state.timers[task.id];if(!running)return;
  clearInterval(running.interval);
  const day=running.date,base=Number(state.completions[task.id]?.[day]||0),elapsed=base+Math.floor((Date.now()-running.startedAt)/1000);
  delete state.timers[task.id];
  saveCompletion(task.id,day,Math.min(elapsed,3600)).then(render);
}
function updateRunningTimers(){
  for(const id in state.timers){
    if(!state.timers[id].interval){
      state.timers[id].interval=setInterval(()=>{ 
        const t=state.daily.find(x=>x.id===id),r=state.timers[id];
        if(!r||!t)return;
        const elapsed=Number(state.completions[id]?.[r.date]||0)+Math.floor((Date.now()-r.startedAt)/1000);
        if(elapsed>=3600){stopTimer(t)}else render();
      },1000);
    }
  }
}
function changeDay(delta){
  const d=new Date(state.selectedDate);d.setDate(d.getDate()+delta);state.selectedDate=d;render();
}
$("prevDayButton").addEventListener("click",()=>changeDay(-1));
$("nextDayButton").addEventListener("click",()=>changeDay(1));
$("todayButton").addEventListener("click",()=>{state.selectedDate=new Date();render()});
$("dateTitleButton").addEventListener("click",openCalendar);

$("calendarButton").addEventListener("click",openCalendar);
$("closeCalendarButton")?.addEventListener("click",closeCalendar);
$("prevMonthButton").addEventListener("click",()=>moveMonth(-1));
$("nextMonthButton").addEventListener("click",()=>moveMonth(1));
document.addEventListener("kor:dateChanged",render);

function buildIconPicker(selected){
  const p=$("iconPicker");p.innerHTML="";
  ICONS.forEach(([file,label])=>{
    const b=document.createElement("button");b.type="button";b.className="icon-choice"+(file===selected?" selected":"");b.title=label;
    b.innerHTML=`<img src="./icons/${file}" alt="${label}">`;
    b.addEventListener("click",()=>{$("taskIcon").value=file;buildIconPicker(file)});
    p.append(b);
  });
}
function openModal(type,task=null){
  state.modalType=type;state.editing=task;setTaskError("");
  $("modalTitle").textContent=task?"Редактировать задание":type==="daily"?"Новое ежедневное":"Новое задание на дату";
  $("taskName").value=task?.name||"";
  $("taskIcon").value=task?.icon&&/\.(svg|png|webp|jpg|jpeg)$/i.test(task.icon)?task.icon:"gear.svg";
  $("taskType").value=task?.type||"check";
  $("taskNote").value=task?.note||"";
  $("taskDate").value=task?.date||dateKey(state.selectedDate);
  $("dateField").hidden=type!=="planned";
  $("valueHint").hidden=$("taskType").value!=="value";
  buildIconPicker($("taskIcon").value);
  $("taskModal").hidden=false;
}
function closeTaskModal(){ $("taskModal").hidden=true;state.editing=null; }
function openNew(type){openModal(type,null)}
$("addTaskButton").addEventListener("click",()=>openNew("daily"));
$("emptyDailyButton").addEventListener("click",()=>openNew("daily"));
$("plannedButton").addEventListener("click",()=>openNew("planned"));
$("taskType").addEventListener("change",e=>{$("valueHint").hidden=e.target.value!=="value"});
$("saveTaskButton").addEventListener("click",async()=>{
  setTaskError("");
  const name=$("taskName").value.trim();if(!name){setTaskError("Введите название");return}
  const task={name,icon:$("taskIcon").value||"gear.svg",type:$("taskType").value,note:$("taskNote").value.trim()};
  if(state.modalType==="planned"){if(!$("taskDate").value){setTaskError("Выберите дату");return}task.date=$("taskDate").value}
  try{
    if(state.editing) await updateTask(state.modalType,state.editing.id,task);
    else if(state.modalType==="daily") await createDaily(task);
    else await createPlanned(task);
    closeTaskModal();render();
  }catch(e){console.error(e);setTaskError("Не удалось сохранить. Проверь Firestore Rules.")}
});
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>{
  const id=b.dataset.close;if(id==="taskModal")closeTaskModal();else if(id==="calendarModal")closeCalendar();
}));
$("taskModal").addEventListener("click",e=>{if(e.target===$("taskModal"))closeTaskModal()});
$("calendarModal").addEventListener("click",e=>{if(e.target===$("calendarModal"))closeCalendar()});
