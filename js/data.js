import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import { db } from "./firebase.js";
import { state } from "./state.js";


const collectionRef = name =>
  collection(
    db,
    "users",
    state.user.uid,
    name
  );


const documentRef = (name, id) =>
  doc(
    db,
    "users",
    state.user.uid,
    name,
    id
  );


export async function loadAll() {

  const [
    dailySnap,
    plannedSnap,
    completionSnap
  ] = await Promise.all([

    getDocs(
      collectionRef("dailyTasks")
    ),

    getDocs(
      collectionRef("plannedTasks")
    ),

    getDocs(
      collectionRef("completions")
    )

  ]);


  state.daily = [];

  state.planned = [];

  state.completions = {};


  dailySnap.forEach(x => {

    const data = x.data();

    state.daily.push({

      id: x.id,

      ...data,

      type:
        data.type === "timer"
          ? "check"
          : (data.type || "check"),

      required:
        data.required !== false,

      order:
        Number.isFinite(data.order)
          ? data.order
          : (Number(data.createdAt) || Date.now())

    });

  });


  plannedSnap.forEach(x => {

    state.planned.push({

      id: x.id,

      ...x.data()

    });

  });


  completionSnap.forEach(x => {

    state.completions[x.id] =
      x.data();

  });


  sortDaily();

}


export async function ensureDefaults() {

  if (state.daily.length) {
    return;
  }


  const defaults = [

    {
      name: "Зарядка кристаллов",
      type: "check",
      required: true,
      gold: 0,
      note: ""
    },

    {
      name: "Задание на 2 подарка",
      type: "check",
      required: true,
      gold: 0,
      note: ""
    },

    {
      name: "Механорум",
      type: "check",
      required: true,
      gold: 0,
      note: ""
    }

  ];


  for (
    let i = 0;
    i < defaults.length;
    i++
  ) {

    const task = {

      ...defaults[i],

      active: true,

      order: i,

      createdAt:
        Date.now() + i

    };


    const ref =
      await addDoc(
        collectionRef("dailyTasks"),
        task
      );


    state.daily.push({

      id: ref.id,

      ...task

    });

  }


  sortDaily();

}


function nextOrder(required) {

  const items =
    state.daily.filter(
      task =>
        task.required === required
    );


  return items.length
    ? Math.max(
        ...items.map(
          task =>
            Number(task.order) || 0
        )
      ) + 1
    : 0;

}


export async function createDaily(
  task
) {

  const isRequired =
    task.required !== false;


  const payload = {

    ...task,

    active: true,

    required: isRequired,

    gold:
      Number(task.gold) || 0,

    order:
      nextOrder(isRequired),

    createdAt:
      Date.now()

  };


  const ref =
    await addDoc(
      collectionRef("dailyTasks"),
      payload
    );


  state.daily.push({

    id: ref.id,

    ...payload

  });


  sortDaily();

}


export async function createPlanned(
  task
) {

  const ref =
    await addDoc(
      collectionRef("plannedTasks"),
      {

        ...task,

        completed: false,

        createdAt:
          Date.now()

      }
    );


  state.planned.push({

    id: ref.id,

    ...task,

    completed: false

  });

}


export async function updateTask(
  kind,
  id,
  data
) {

  const name =
    kind === "daily"
      ? "dailyTasks"
      : "plannedTasks";


  await updateDoc(

    documentRef(
      name,
      id
    ),

    data

  );


  const arr =
    kind === "daily"
      ? state.daily
      : state.planned;


  const obj =
    arr.find(
      item =>
        item.id === id
    );


  if (obj) {

    Object.assign(
      obj,
      data
    );

  }


  if (
    kind === "daily"
  ) {

    sortDaily();

  }

}


export async function deleteTask(
  kind,
  id
) {

  const name =
    kind === "daily"
      ? "dailyTasks"
      : "plannedTasks";


  await deleteDoc(

    documentRef(
      name,
      id
    )

  );


  if (
    kind === "daily"
  ) {

    state.daily =
      state.daily.filter(
        task =>
          task.id !== id
      );

  } else {

    state.planned =
      state.planned.filter(
        task =>
          task.id !== id
      );

  }

}


export async function reorderDaily(
  required,
  orderedIds
) {

  const updates =
    orderedIds.map(
      (id, index) => {

        const task =
          state.daily.find(
            item =>
              item.id === id
          );


        if (task) {

          task.order =
            index;

        }


        return updateDoc(

          documentRef(
            "dailyTasks",
            id
          ),

          {
            order: index
          }

        );

      }
    );


  await Promise.all(
    updates
  );


  sortDaily();

}


export function sortDaily() {

  state.daily.sort(

    (a, b) => (

      a.required === b.required

        ? (
            (Number(a.order) || 0) -
            (Number(b.order) || 0)
          )

        : a.required
          ? -1
          : 1

    )

  );

}


export async function saveCompletion(
  taskId,
  date,
  value
) {

  if (
    !state.completions[taskId]
  ) {

    state.completions[taskId] = {};

  }


  state.completions[taskId][date] =
    value;


  const dayData = {};


  for (
    const id of Object.keys(
      state.completions
    )
  ) {

    if (
      state.completions[id][date]
      !== undefined
    ) {

      dayData[id] =
        state.completions[id][date];

    }

  }


  await setDoc(

    documentRef(
      "completions",
      date
    ),

    dayData,

    {
      merge: true
    }

  );

}