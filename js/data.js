import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { db } from "./firebase.js";
import { state } from "./state.js";

const collectionRef = name => collection(db,"users",state.user.uid,name);
const documentRef = (name,id) => doc(db,"users",state.user.uid,name,id);

export async function loadAll(){
  const [dailySnap,plannedSnap,completionSnap] = await Promise.all([
    getDocs(collectionRef("dailyTasks")),
    getDocs(collectionRef("plannedTasks")),
    getDocs(collectionRef("completions"))
  ]);
  state.daily=[]; state.planned=[]; state.completions={};
  dailySnap.forEach(x=>state.daily.push({id:x.id,...x.data()}));
  plannedSnap.forEach(x=>state.planned.push({id:x.id,...x.data()}));

  // Firestore stores completions as:
  // completions/{YYYY-MM-DD} -> { taskId: value }
  // The UI works with:
  // completions[taskId][YYYY-MM-DD] -> value
  // Convert the database structure back into the UI structure on every load.
  completionSnap.forEach(dayDoc=>{
    const date=dayDoc.id;
    const values=dayDoc.data() || {};
    for(const [taskId,value] of Object.entries(values)){
      if(!state.completions[taskId]) state.completions[taskId]={};
      state.completions[taskId][date]=value;
    }
  });
}

export async function ensureDefaults(){
  if(state.daily.length) return;
  const defaults=[
    {name:"Механорум",icon:"gear.svg",type:"check",note:""},
    {name:"Мобить 1 час",icon:"swords.svg",type:"timer",note:""},
    {name:"Лотерея",icon:"ticket.svg",type:"check",note:""},
    {name:"Кристаллы",icon:"gem.svg",type:"check",note:""}
  ];
  for(const task of defaults){
    const ref=await addDoc(collectionRef("dailyTasks"),{...task,active:true,createdAt:Date.now()});
    state.daily.push({id:ref.id,...task,active:true});
  }
}

export async function createDaily(task){
  const ref=await addDoc(collectionRef("dailyTasks"),{...task,active:true,createdAt:Date.now()});
  state.daily.push({id:ref.id,...task,active:true});
}
export async function createPlanned(task){
  const ref=await addDoc(collectionRef("plannedTasks"),{...task,completed:false,createdAt:Date.now()});
  state.planned.push({id:ref.id,...task,completed:false});
}
export async function updateTask(kind,id,data){
  const collectionName=kind==="daily"?"dailyTasks":"plannedTasks";
  await updateDoc(documentRef(collectionName,id),data);
  const arr=kind==="daily"?state.daily:state.planned;
  const obj=arr.find(x=>x.id===id);
  if(obj) Object.assign(obj,data);
}
export async function deleteTask(kind,id){
  const collectionName=kind==="daily"?"dailyTasks":"plannedTasks";
  await deleteDoc(documentRef(collectionName,id));
  if(kind==="daily") state.daily=state.daily.filter(x=>x.id!==id);
  else state.planned=state.planned.filter(x=>x.id!==id);
}

export async function saveCompletion(taskId,date,value){
  if(!state.completions[taskId]) state.completions[taskId]={};
  state.completions[taskId][date]=value;
  const dayData={};
  for(const id of Object.keys(state.completions)){
    if(state.completions[id][date] !== undefined) dayData[id]=state.completions[id][date];
  }
  await setDoc(documentRef("completions",date),dayData,{merge:true});
}
