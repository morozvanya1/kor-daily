import { state } from "./state.js";
import { $, dateKey, fromKey, todayKey, isDone } from "./ui.js";

export function openCalendar(){
  state.calendarMonth=new Date(state.selectedDate.getFullYear(),state.selectedDate.getMonth(),1);
  state.calendarSelected=dateKey(state.selectedDate);
  renderCalendar();
  $("calendarModal").hidden=false;
}
export function closeCalendar(){ $("calendarModal").hidden=true; }
export function moveMonth(delta){
  state.calendarMonth.setMonth(state.calendarMonth.getMonth()+delta);
  renderCalendar();
}
export function renderCalendar(){
  const d=state.calendarMonth,y=d.getFullYear(),m=d.getMonth();
  $("calendarMonthTitle").textContent=d.toLocaleDateString("ru-RU",{month:"long",year:"numeric"});
  const grid=$("calendarGrid");grid.innerHTML="";
  ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].forEach(x=>{const w=document.createElement("div");w.className="weekday";w.textContent=x;grid.append(w)});
  const offset=(new Date(y,m,1).getDay()+6)%7;
  for(let i=0;i<offset;i++)grid.append(document.createElement("div"));
  const days=new Date(y,m+1,0).getDate();
  for(let n=1;n<=days;n++){
    const k=dateKey(new Date(y,m,n)),b=document.createElement("button");
    b.className="calendar-cell";
    b.textContent=n;
    if(k===todayKey())b.classList.add("today");
    if(k===state.calendarSelected)b.classList.add("selected");
    if(state.daily.length&&state.daily.every(t=>isDone(t,k)))b.classList.add("complete");
    b.onclick=()=>{
      state.calendarSelected=k;
      state.selectedDate=fromKey(k);
      $("calendarSelectedInfo").textContent=state.selectedDate.toLocaleDateString("ru-RU",{weekday:"long",day:"numeric",month:"long"});
      renderCalendar();
      $("calendarModal").hidden=true;
      document.dispatchEvent(new CustomEvent("kor:dateChanged"));
    };
    grid.append(b);
  }
  $("calendarSelectedInfo").textContent=state.calendarSelected?fromKey(state.calendarSelected).toLocaleDateString("ru-RU",{weekday:"long",day:"numeric",month:"long"}):"Выберите день";
}
