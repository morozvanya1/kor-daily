import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { db } from "./firebase.js";
import { state } from "./state.js";

const col = name => collection(db,"users",state.user.uid,name);
const item = (name,id) => doc(db,"users",state.user.uid,name,id);

export async function loadTasks(){
  state.dailyTasks=[]; state.plannedTasks=[];
  const [d,p]=await Promise.all([getDocs(col("dailyTasks")),getDocs(col("plannedTasks"))]);
  d.forEach(x=>state.dailyTasks.push({id:x.id,...x.data()}));
  p.forEach(x=>state.plannedTasks.push({id:x.id,...x.data()}));
}
export async function createDefaultTasks(){
  if(state.dailyTasks.length) return;
  const defaults=[
    {name:"Механорум",icon:"⚙️",type:"check"},
    {name:"Мобить 1 час",icon:"⚔️",type:"timer",target:3600},
    {name:"Лотерея",icon:"🎟️",type:"check"},
    {name:"Кристаллы",icon:"💎",type:"check"}
  ];
  for(const task of defaults) await addDoc(col("dailyTasks"),{...task,active:true,createdAt:Date.now()});
  await loadTasks();
}
export async function addDailyTask(task){
  const r=await addDoc(col("dailyTasks"),{...task,active:true,createdAt:Date.now()});
  state.dailyTasks.push({id:r.id,...task,active:true});
}
export async function addPlannedTask(task){
  const r=await addDoc(col("plannedTasks"),{...task,completed:false,createdAt:Date.now()});
  state.plannedTasks.push({id:r.id,...task,completed:false});
}
export async function updateTask(type,id,data){
  await updateDoc(item(type==="daily"?"dailyTasks":"plannedTasks",id),data);
}
export async function removeTask(type,id){
  const name=type==="daily"?"dailyTasks":"plannedTasks";
  await deleteDoc(item(name,id));
  if(type==="daily") state.dailyTasks=state.dailyTasks.filter(x=>x.id!==id);
  else state.plannedTasks=state.plannedTasks.filter(x=>x.id!==id);
}
