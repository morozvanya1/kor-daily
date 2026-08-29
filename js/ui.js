import {
  state
} from "./state.js";


export const $ =
  id =>
    document.getElementById(
      id
    );


export const todayKey =
  () =>
    dateKey(
      new Date()
    );


export function dateKey(
  date
) {

  const y =
    date.getFullYear();


  const m =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const d =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${y}-${m}-${d}`;

}


export function fromKey(
  key
) {

  return new Date(
    key +
    "T00:00:00"
  );

}


export function formatDate(
  key
) {

  return fromKey(
    key
  ).toLocaleDateString(
    "ru-RU",
    {
      weekday:
        "long",

      day:
        "numeric",

      month:
        "long"
    }
  );

}


export function formatShort(
  key
) {

  return fromKey(
    key
  ).toLocaleDateString(
    "ru-RU",
    {
      day:
        "numeric",

      month:
        "short"
    }
  );

}


/* =========================================
   DONE
========================================= */

export function isDone(
  task,
  date
) {

  const value =
    state
      .completions[
        task.id
      ]?.[date];


  if (
    task.type ===
    "value"
  ) {

    return (

      String(
        value ?? ""
      ).trim() !== ""

    );

  }


  return !!value;

}


/* =========================================
   SAFE
========================================= */

function safe(
  value
) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,

    char => (

      {
        "&":
          "&amp;",

        "<":
          "&lt;",

        ">":
          "&gt;",

        '"':
          "&quot;",

        "'":
          "&#039;"

      }[
        char
      ]

    )
  );

}


/* =========================================
   DAILY ROW
========================================= */

function dailyRow(
  task,
  handlers
) {

  const day =
    dateKey(
      state.selectedDate
    );


  const value =
    state
      .completions[
        task.id
      ]?.[day] ??
    "";


  const done =
    isDone(
      task,
      day
    );


  const row =
    document.createElement(
      "div"
    );


  row.className =
    "task" +
    (
      done
        ? " completed"
        : ""
    );


  row.draggable =
    true;


  row.dataset.id =
    task.id;


  row.dataset.required =
    task.required
      ? "true"
      : "false";


  /* DRAG */

  const drag =
    document.createElement(
      "div"
    );


  drag.className =
    "drag-handle";


  drag.textContent =
    "⋮⋮";


  drag.title =
    "Перетащить";


  row.append(
    drag
  );


  /* CHECK */

  const check =
    document.createElement(
      "button"
    );


  check.className =
    "check-button";


  check.textContent =
    done
      ? "✓"
      : "";


  check.onclick =
    () =>
      handlers.toggle(
        task
      );


  row.append(
    check
  );


  /* MAIN */

  const main =
    document.createElement(
      "div"
    );


  main.className =
    "task-main";


  let meta;


  if (
    task.note
  ) {

    meta =
      task.note;

  } else if (
    task.type ===
    "value"
  ) {

    meta =
      value

        ? `значение: ${safe(
            value
          )}`

        : "введите значение";

  } else {

    meta =
      "каждый день";

  }


  const gold =
    Number(
      task.gold
    ) || 0;


  const goldText =
    gold > 0
      ? ` · ${gold} голд`
      : "";


  main.innerHTML = `

    <div class="task-name">
      ${safe(task.name)}
    </div>

    <div class="task-meta">
      ${safe(meta)}
      ${goldText}
    </div>

  `;


  row.append(
    main
  );


  /* VALUE */

  if (
    task.type ===
    "value"
  ) {

    row.append(

      valueControls(
        task,
        day,
        value,
        handlers
      )

    );

  }


  /* ACTIONS */

  const actions =
    document.createElement(
      "div"
    );


  actions.className =
    "task-actions";


  const edit =
    document.createElement(
      "button"
    );


  edit.className =
    "task-action";


  edit.title =
    "Редактировать";


  edit.textContent =
    "✎";


  edit.onclick =
    () =>
      handlers.edit(
        task,
        "daily"
      );


  const del =
    document.createElement(
      "button"
    );


  del.className =
    "task-action delete";


  del.textContent =
    "×";


  del.onclick =
    () =>
      handlers.remove(
        task,
        "daily"
      );


  actions.append(
    edit,
    del
  );


  row.append(
    actions
  );


  /* DRAG */

  row.addEventListener(
    "dragstart",
    event => {

      state.drag = {

        id:
          task.id,

        required:
          task.required,

        element:
          row

      };


      row.classList.add(
        "dragging"
      );


      event.dataTransfer.effectAllowed =
        "move";


      event.dataTransfer.setData(
        "text/plain",
        task.id
      );

    }
  );


  row.addEventListener(
    "dragend",
    () => {

      row.classList.remove(
        "dragging"
      );


      state.drag =
        null;


      document
        .querySelectorAll(
          ".drop-target"
        )
        .forEach(
          item =>
            item.classList.remove(
              "drop-target"
            )
        );

    }
  );


  row.addEventListener(
    "dragover",
    event => {

      if (

        !state.drag ||

        state.drag.id ===
          task.id ||

        state.drag.required !==
          task.required

      ) {

        return;

      }


      event.preventDefault();


      row.classList.add(
        "drop-target"
      );

    }
  );


  row.addEventListener(
    "dragleave",
    () => {

      row.classList.remove(
        "drop-target"
      );

    }
  );


  row.addEventListener(
    "drop",
    async event => {

      event.preventDefault();


      row.classList.remove(
        "drop-target"
      );


      if (

        !state.drag ||

        state.drag.id ===
          task.id ||

        state.drag.required !==
          task.required

      ) {

        return;

      }


      await handlers.reorder(

        task.required,

        state.drag.id,

        task.id

      );

    }
  );


  return row;

}


/* =========================================
   VALUE
========================================= */

function valueControls(
  task,
  day,
  value,
  handlers
) {

  const box =
    document.createElement(
      "div"
    );


  box.className =
    "value-editor";


  const input =
    document.createElement(
      "input"
    );


  input.className =
    "value-input";


  input.dataset.taskId =
    task.id;


  input.placeholder =
    "значение";


  input.value =
    value || "";


  const save =
    document.createElement(
      "button"
    );


  save.className =
    "value-save";


  save.textContent =
    "OK";


  save.onclick =
    () =>
      handlers.value(
        task,
        input.value.trim()
      );


  input.onkeydown =
    event => {

      if (
        event.key ===
        "Enter"
      ) {

        handlers.value(
          task,
          input.value.trim()
        );

      }

    };


  box.append(
    input,
    save
  );


  return box;

}


/* =========================================
   DAILY LISTS
========================================= */

function renderDailyList(
  list,
  required,
  handlers
) {

  list.innerHTML =
    "";


  const tasks =
    state.daily.filter(

      task =>

        task.active !==
          false &&

        !!task.required ===
          required

    );


  tasks.forEach(
    task =>
      list.append(
        dailyRow(
          task,
          handlers
        )
      )
  );


  return tasks.length;

}


/* =========================================
   MAIN RENDER
========================================= */

export function renderAll(
  handlers
) {

  renderDate();


  const required =
    renderDailyList(
      $("requiredList"),
      true,
      handlers
    );


  const optional =
    renderDailyList(
      $("optionalList"),
      false,
      handlers
    );


  $("requiredCount")
    .textContent =
    required;


  $("optionalCount")
    .textContent =
    optional;


  renderPlanned(
    handlers
  );


  renderSelectedPlanned(
    handlers
  );


  renderProgress();

  renderStats();

  renderDailyGold();

  renderOptionalVisibility();

}


/* =========================================
   DATE
========================================= */

function renderDate() {

  const date =
    state.selectedDate;


  const key =
    dateKey(
      date
    );


  const isToday =
    key ===
    todayKey();


  $("dateTitle")
    .textContent =
    date.toLocaleDateString(
      "ru-RU",
      {
        weekday:
          "long",

        day:
          "numeric",

        month:
          "long"
      }
    );


  $("selectedDateLabel")
    .textContent =
    isToday
      ? "Сегодня"
      : formatDate(
          key
        );


  $("todayButton")
    .hidden =
    isToday;


  $("goldDayDate")
    .textContent =
    isToday
      ? "сегодня"
      : formatDate(
          key
        );


  $("dailyGoldInput")
    .value =
    state.dailyGold[
      key
    ] ?? "";

}


/* =========================================
   PLANNED ROW
========================================= */

function plannedRow(
  task,
  handlers
) {

  const row =
    document.createElement(
      "div"
    );


  row.className =
    "task" +
    (
      task.completed
        ? " completed"
        : ""
    );


  const check =
    document.createElement(
      "button"
    );


  check.className =
    "check-button";


  check.textContent =
    task.completed
      ? "✓"
      : "";


  check.onclick =
    () =>
      handlers.togglePlanned(
        task
      );


  row.append(
    check
  );


  const date =
    fromKey(
      task.date
    );


  const dateBox =
    document.createElement(
      "div"
    );


  dateBox.className =
    "planned-date";


  dateBox.innerHTML = `

    <b>
      ${date.getDate()}
    </b>

    <small>
      ${date.toLocaleDateString(
        "ru-RU",
        {
          month:
            "short"
        }
      )}
    </small>

  `;


  row.append(
    dateBox
  );


  const main =
    document.createElement(
      "div"
    );


  main.className =
    "planned-main";


  main.innerHTML = `

    <div class="task-name">
      ${safe(task.name)}
    </div>

    <div class="task-meta">
      ${safe(
        formatShort(
          task.date
        ) +

        (
          task.note
            ? " · " +
              task.note
            : ""
        )
      )}
    </div>

  `;


  row.append(
    main
  );


  const actions =
    document.createElement(
      "div"
    );


  actions.className =
    "task-actions";


  const edit =
    document.createElement(
      "button"
    );


  edit.className =
    "task-action";


  edit.textContent =
    "✎";


  edit.title =
    "Редактировать";


  edit.onclick =
    () =>
      handlers.edit(
        task,
        "planned"
      );


  const del =
    document.createElement(
      "button"
    );


  del.className =
    "task-action delete";


  del.textContent =
    "×";


  del.onclick =
    () =>
      handlers.remove(
        task,
        "planned"
      );


  actions.append(
    edit,
    del
  );


  row.append(
    actions
  );


  return row;

}


/* =========================================
   PLANNED
========================================= */

function renderPlanned(
  handlers
) {

  const list =
    $("plannedList");


  list.innerHTML =
    "";


  const today =
    todayKey();


  const items =
    state.planned

      .filter(
        task =>
          task.date >=
          today
      )

      .sort(
        (
          a,
          b
        ) =>
          a.date.localeCompare(
            b.date
          )
      );


  items
    .slice(
      0,
      10
    )
    .forEach(
      task =>
        list.append(
          plannedRow(
            task,
            handlers
          )
        )
    );


  $("plannedCount")
    .textContent =
    items.length;

}


/* =========================================
   SELECTED DAY PLANNED
========================================= */

function renderSelectedPlanned(
  handlers
) {

  const list =
    $("selectedPlannedList");


  list.innerHTML =
    "";


  const day =
    dateKey(
      state.selectedDate
    );


  const items =
    state.planned.filter(
      task =>
        task.date ===
        day
    );


  items.forEach(
    task =>
      list.append(
        plannedRow(
          task,
          handlers
        )
      )
  );


  $("selectedPlannedCount")
    .textContent =
    items.length;


  $("selectedPlannedSection")
    .hidden =
    !items.length;

}


/* =========================================
   PROGRESS
========================================= */

function renderProgress() {

  const day =
    dateKey(
      state.selectedDate
    );


  const tasks =
    state.daily.filter(
      task =>
        task.active !==
          false
    );


  const done =
    tasks.filter(
      task =>
        isDone(
          task,
          day
        )
    ).length;


  const percent =
    tasks.length

      ? Math.round(
          done /
          tasks.length *
          100
        )

      : 0;


  $("percent")
    .textContent =
    percent +
    "%";


  $("progressBar")
    .style.width =
    percent +
    "%";


  $("progressText")
    .textContent =
    `${done} из ${tasks.length} выполнено`;

}


/* =========================================
   STATS
========================================= */

function renderStats() {

  let completed =
    0;


  for (
    const taskId
    in state.completions
  ) {

    for (
      const date
      in state.completions[
        taskId
      ]
    ) {

      if (
        state.completions[
          taskId
        ][date]
      ) {

        completed++;

      }

    }

  }


  $("completedCount")
    .textContent =
    completed;


  const days = [];


  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const date =
      new Date();


    date.setDate(
      date.getDate() -
      i
    );


    days.push(
      dateKey(
        date
      )
    );

  }


  const total =
    state.daily.length *
    7;


  let done =
    0;


  for (
    const task
    of state.daily
  ) {

    for (
      const day
      of days
    ) {

      if (
        isDone(
          task,
          day
        )
      ) {

        done++;

      }

    }

  }


  $("weekPercent")
    .textContent =

      (

        total

          ? Math.round(
              done /
              total *
              100
            )

          : 0

      ) +

      "%";


  /*
   * Серия считается
   * только по обязательным.
   */

  let streak =
    0;


  for (
    let i = 0;
    i < 365;
    i++
  ) {

    const date =
      new Date();


    date.setDate(
      date.getDate() -
      i
    );


    const key =
      dateKey(
        date
      );


    const required =
      state.daily.filter(
        task =>
          task.required !==
          false
      );


    if (

      required.length &&

      required.every(
        task =>
          isDone(
            task,
            key
          )
      )

    ) {

      streak++;

    } else {

      break;

    }

  }


  $("streak")
    .textContent =
    streak;

}


/* =========================================
   GOLD
========================================= */

function renderDailyGold() {

  const date =
    state.selectedDate;


  const year =
    date.getFullYear();


  const month =
    date.getMonth();


  let total =
    0;


  for (
    let day = 1;
    day <= 31;
    day++
  ) {

    const current =
      new Date(
        year,
        month,
        day
      );


    if (
      current.getMonth() !==
      month
    ) {

      break;

    }


    const key =
      dateKey(
        current
      );


    total +=
      Number(
        state.dailyGold[
          key
        ] || 0
      );

  }


  $("goldMonthTop")
    .textContent =
    total;

}


/* =========================================
   OPTIONAL VISIBILITY
========================================= */

export function renderOptionalVisibility() {

  const content =
    $("optionalContent");


  const button =
    $("toggleOptionalButton");


  content.hidden =
    state.optionalHidden;


  button.textContent =
    state.optionalHidden
      ? "Показать"
      : "Скрыть";

}