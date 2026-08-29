import { state } from "./state.js";


export const $ =
  id =>
    document.getElementById(id);


export const todayKey =
  () =>
    dateKey(
      new Date()
    );


export function dateKey(d) {

  const y =
    d.getFullYear();


  const m =
    String(
      d.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      d.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${y}-${m}-${day}`;

}


export function fromKey(k) {

  return new Date(
    k + "T00:00:00"
  );

}


export function formatDate(k) {

  return fromKey(k)
    .toLocaleDateString(
      "ru-RU",
      {
        weekday: "long",
        day: "numeric",
        month: "long"
      }
    );

}


export function formatShort(k) {

  return fromKey(k)
    .toLocaleDateString(
      "ru-RU",
      {
        day: "numeric",
        month: "short"
      }
    );

}


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
    task.type === "value"
  ) {

    return (
      String(
        value ?? ""
      ).trim() !== ""
    );

  }


  return !!value;

}


function safe(s) {

  return String(
    s ?? ""
  ).replace(
    /[&<>"']/g,
    c =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[c]
  );

}


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
      ]?.[day] ?? "";


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


  row.draggable = true;

  row.dataset.id =
    task.id;

  row.dataset.required =
    task.required
      ? "true"
      : "false";


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


  check.title =
    done
      ? "Снять отметку"
      : "Отметить";


  check.onclick =
    () =>
      handlers.toggle(
        task
      );


  row.append(
    check
  );


  const main =
    document.createElement(
      "div"
    );


  main.className =
    "task-main";


  let meta;


  if (task.note) {

    meta =
      task.note;

  } else if (
    task.type === "value"
  ) {

    meta =
      value
        ? `значение: ${safe(value)}`
        : "введите значение";

  } else {

    meta =
      "каждый день";

  }


  const gold =
    Number(task.gold) || 0;


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


  if (
    task.type === "value"
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

  del.title =
    "Удалить";

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


  row.addEventListener(
    "dragstart",
    e => {

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


      e.dataTransfer.effectAllowed =
        "move";


      e.dataTransfer.setData(
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
          element =>
            element.classList.remove(
              "drop-target"
            )
        );

    }
  );


  row.addEventListener(
    "dragover",
    e => {

      if (
        !state.drag ||
        state.drag.id === task.id ||
        state.drag.required !==
          task.required
      ) {

        return;

      }


      e.preventDefault();


      row.classList.add(
        "drop-target"
      );

    }
  );


  row.addEventListener(
    "dragleave",
    () =>
      row.classList.remove(
        "drop-target"
      )
  );


  row.addEventListener(
    "drop",
    async e => {

      e.preventDefault();


      row.classList.remove(
        "drop-target"
      );


      if (
        !state.drag ||
        state.drag.id === task.id ||
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


  input.title =
    "Введите значение";


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
    e => {

      if (
        e.key === "Enter"
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
        task.active !== false &&
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


  $("requiredCount").textContent =
    required;


  $("optionalCount").textContent =
    optional;


  renderPlanned(
    handlers
  );


  renderSelectedPlanned(
    handlers
  );


  renderProgress();

  renderStats();

  renderGoldMonth();

}


function renderDate() {

  const d =
    state.selectedDate;


  const k =
    dateKey(d);


  const today =
    todayKey();


  const isToday =
    k === today;


  $("dateTitle").textContent =
    d.toLocaleDateString(
      "ru-RU",
      {
        weekday: "long",
        day: "numeric",
        month: "long"
      }
    );


  $("selectedDateLabel").textContent =
    isToday
      ? "Сегодня"
      : formatDate(k);


  $("todayButton").hidden =
    isToday;

}


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


  const d =
    fromKey(
      task.date
    );


  const date =
    document.createElement(
      "div"
    );


  date.className =
    "planned-date";


  date.innerHTML = `

    <b>
      ${d.getDate()}
    </b>

    <small>
      ${d.toLocaleDateString(
        "ru-RU",
        {
          month: "short"
        }
      )}
    </small>

  `;


  row.append(
    date
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
            ? " · " + task.note
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


  edit.title =
    "Редактировать";


  edit.textContent =
    "✎";


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
        (a, b) =>
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


  $("plannedCount").textContent =
    items.length;

}


function renderSelectedPlanned(
  handlers
) {

  const list =
    $("selectedPlannedList");


  const day =
    dateKey(
      state.selectedDate
    );


  list.innerHTML =
    "";


  const items =
    state.planned.filter(
      task =>
        task.date === day
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


function renderProgress() {

  const day =
    dateKey(
      state.selectedDate
    );


  const tasks =
    state.daily.filter(
      task =>
        task.active !== false
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


  $("percent").textContent =
    percent + "%";


  $("progressBar")
    .style.width =
    percent + "%";


  $("progressText")
    .textContent =
    `${done} из ${tasks.length} выполнено`;

}


function renderStats() {

  let completed = 0;


  for (
    const id
    in state.completions
  ) {

    for (
      const d
      in state.completions[id]
    ) {

      if (
        state.completions[id][d]
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

    const d =
      new Date();


    d.setDate(
      d.getDate() - i
    );


    days.push(
      dateKey(d)
    );

  }


  const total =
    state.daily.length * 7;


  let done = 0;


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
    ) + "%";


  let streak = 0;


  for (
    let i = 0;
    i < 365;
    i++
  ) {

    const d =
      new Date();


    d.setDate(
      d.getDate() - i
    );


    const k =
      dateKey(d);


    if (
      state.daily.length &&
      state.daily
        .filter(
          task =>
            task.required !== false
        )
        .every(
          task =>
            isDone(
              task,
              k
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


function renderGoldMonth() {

  const selected =
    state.selectedDate;


  const year =
    selected.getFullYear();


  const month =
    selected.getMonth();


  $("goldMonthLabel")
    .textContent =
    `Голд за ${selected.toLocaleDateString(
      "ru-RU",
      {
        month: "long"
      }
    )}`;


  let total = 0;


  for (
    const task
    of state.daily
  ) {

    const gold =
      Number(task.gold) || 0;


    if (!gold)
      continue;


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


      const k =
        dateKey(
          current
        );


      if (
        isDone(
          task,
          k
        )
      ) {

        total +=
          gold;

      }

    }

  }


  $("goldMonthTotal")
    .textContent =
    String(total);

}