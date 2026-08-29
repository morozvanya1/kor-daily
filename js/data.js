import {

  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc

} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


import {
  db
} from "./firebase.js";


import {
  state
} from "./state.js";


const collectionRef =
  name =>
    collection(
      db,
      "users",
      state.user.uid,
      name
    );


const documentRef =
  (name, id) =>
    doc(
      db,
      "users",
      state.user.uid,
      name,
      id
    );


/* =========================================
   LOAD
========================================= */

export async function loadAll() {

  const [

    dailySnap,

    plannedSnap,

    completionSnap,

    goldSnap

  ] = await Promise.all([

    getDocs(
      collectionRef(
        "dailyTasks"
      )
    ),

    getDocs(
      collectionRef(
        "plannedTasks"
      )
    ),

    getDocs(
      collectionRef(
        "completions"
      )
    ),

    getDocs(
      collectionRef(
        "dailyGold"
      )
    )

  ]);


  state.daily = [];

  state.planned = [];

  state.completions = {};

  state.dailyGold = {};


  /* DAILY */

  dailySnap.forEach(
    snapshot => {

      const data =
        snapshot.data();


      state.daily.push({

        id:
          snapshot.id,

        ...data,

        /*
         * Старые таймеры
         * автоматически превращаем
         * в обычную отметку.
         */

        type:
          data.type === "timer"
            ? "check"
            : (
                data.type ||
                "check"
              ),

        required:
          data.required !== false,

        gold:
          Number(
            data.gold
          ) || 0,

        order:
          Number.isFinite(
            data.order
          )
            ? data.order
            : (
                Number(
                  data.createdAt
                ) ||
                Date.now()
              )

      });

    }
  );


  /* PLANNED */

  plannedSnap.forEach(
    snapshot => {

      state.planned.push({

        id:
          snapshot.id,

        ...snapshot.data()

      });

    }
  );


  /*
   * FIRESTORE ХРАНИТ:
   *
   * completions/
   *   2026-08-29
   *      taskId: true
   *
   * Поэтому здесь преобразуем:
   *
   * день -> задания
   *
   * в:
   *
   * задание -> дни
   */

  completionSnap.forEach(
    snapshot => {

      const date =
        snapshot.id;


      const dayData =
        snapshot.data();


      Object.entries(
        dayData
      ).forEach(
        ([taskId, value]) => {

          if (
            !state.completions[
              taskId
            ]
          ) {

            state.completions[
              taskId
            ] = {};

          }


          state.completions[
            taskId
          ][date] =
            value;

        }
      );

    }
  );


  /*
   * Голд за каждый день
   */

  goldSnap.forEach(
    snapshot => {

      const data =
        snapshot.data();


      state.dailyGold[
        snapshot.id
      ] =
        Number(
          data.gold
        ) || 0;

    }
  );


  sortDaily();

}


/* =========================================
   DEFAULTS
========================================= */

export async function ensureDefaults() {

  if (
    state.daily.length
  ) {

    return;

  }


  const defaults = [

    {
      name:
        "Механорум",

      type:
        "check",

      required:
        true,

      gold:
        0,

      note:
        ""

    },

    {
      name:
        "Лотерея",

      type:
        "check",

      required:
        true,

      gold:
        0,

      note:
        ""

    },

    {
      name:
        "Кристаллы",

      type:
        "check",

      required:
        true,

      gold:
        0,

      note:
        ""

    }

  ];


  for (
    let i = 0;
    i < defaults.length;
    i++
  ) {

    const task = {

      ...defaults[i],

      active:
        true,

      order:
        i,

      createdAt:
        Date.now() + i

    };


    const ref =
      await addDoc(
        collectionRef(
          "dailyTasks"
        ),
        task
      );


    state.daily.push({

      id:
        ref.id,

      ...task

    });

  }


  sortDaily();

}


/* =========================================
   ORDER
========================================= */

function nextOrder(
  required
) {

  const items =
    state.daily.filter(
      task =>
        task.required ===
        required
    );


  if (
    !items.length
  ) {

    return 0;

  }


  return (
    Math.max(
      ...items.map(
        task =>
          Number(
            task.order
          ) || 0
      )
    ) + 1
  );

}


/* =========================================
   CREATE DAILY
========================================= */

export async function createDaily(
  task
) {

  const required =
    task.required !== false;


  const payload = {

    name:
      task.name,

    type:
      task.type || "check",

    note:
      task.note || "",

    required,

    gold:
      Number(
        task.gold
      ) || 0,

    active:
      true,

    order:
      nextOrder(
        required
      ),

    createdAt:
      Date.now()

  };


  const ref =
    await addDoc(
      collectionRef(
        "dailyTasks"
      ),
      payload
    );


  state.daily.push({

    id:
      ref.id,

    ...payload

  });


  sortDaily();

}


/* =========================================
   CREATE PLANNED
========================================= */

export async function createPlanned(
  task
) {

  const payload = {

    name:
      task.name,

    type:
      task.type || "check",

    note:
      task.note || "",

    date:
      task.date,

    completed:
      false,

    createdAt:
      Date.now()

  };


  const ref =
    await addDoc(
      collectionRef(
        "plannedTasks"
      ),
      payload
    );


  state.planned.push({

    id:
      ref.id,

    ...payload

  });

}


/* =========================================
   UPDATE
========================================= */

export async function updateTask(
  kind,
  id,
  data
) {

  const collectionName =
    kind === "daily"
      ? "dailyTasks"
      : "plannedTasks";


  await updateDoc(

    documentRef(
      collectionName,
      id
    ),

    data

  );


  const arr =
    kind === "daily"
      ? state.daily
      : state.planned;


  const task =
    arr.find(
      item =>
        item.id === id
    );


  if (
    task
  ) {

    Object.assign(
      task,
      data
    );

  }


  if (
    kind === "daily"
  ) {

    sortDaily();

  }

}


/* =========================================
   DELETE
========================================= */

export async function deleteTask(
  kind,
  id
) {

  const collectionName =
    kind === "daily"
      ? "dailyTasks"
      : "plannedTasks";


  await deleteDoc(

    documentRef(
      collectionName,
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


/* =========================================
   REORDER
========================================= */

export async function reorderDaily(
  required,
  orderedIds
) {

  const updates =
    orderedIds.map(
      (
        id,
        index
      ) => {

        const task =
          state.daily.find(
            item =>
              item.id === id
          );


        if (
          task
        ) {

          task.order =
            index;

        }


        return updateDoc(

          documentRef(
            "dailyTasks",
            id
          ),

          {
            order:
              index
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

    (
      a,
      b
    ) => {

      if (
        a.required ===
        b.required
      ) {

        return (

          (
            Number(
              a.order
            ) || 0
          )

          -

          (
            Number(
              b.order
            ) || 0
          )

        );

      }


      return a.required
        ? -1
        : 1;

    }

  );

}


/* =========================================
   COMPLETION
========================================= */

export async function saveCompletion(
  taskId,
  date,
  value
) {

  if (
    !state.completions[
      taskId
    ]
  ) {

    state.completions[
      taskId
    ] = {};

  }


  state.completions[
    taskId
  ][date] =
    value;


  /*
   * Перед записью собираем
   * все значения этой даты.
   */

  const dayData = {};


  for (
    const taskId
    of Object.keys(
      state.completions
    )
  ) {

    const valueForDay =
      state.completions[
        taskId
      ][date];


    if (
      valueForDay !==
      undefined
    ) {

      dayData[
        taskId
      ] =
        valueForDay;

    }

  }


  await setDoc(

    documentRef(
      "completions",
      date
    ),

    dayData,

    {
      merge:
        true
    }

  );

}


/* =========================================
   DAILY GOLD
========================================= */

export async function saveDailyGold(
  date,
  gold
) {

  const value =
    Math.max(
      0,
      Number(gold) || 0
    );


  state.dailyGold[
    date
  ] =
    value;


  await setDoc(

    documentRef(
      "dailyGold",
      date
    ),

    {
      gold:
        value
    },

    {
      merge:
        true
    }

  );

}