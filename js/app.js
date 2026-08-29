import {
  watchAuth,
  login,
  register,
  logout
} from "./auth.js";


import {
  state
} from "./state.js";


import {
  loadAll,
  ensureDefaults,
  createDaily,
  createPlanned,
  updateTask,
  deleteTask,
  saveCompletion,
  reorderDaily
} from "./data.js";


import {
  $,
  dateKey,
  renderAll
} from "./ui.js";


import {
  openCalendar,
  closeCalendar,
  moveMonth
} from "./calendar.js";


function authError(e) {

  return (

    {

      "auth/invalid-credential":
        "Неверный email или пароль",

      "auth/email-already-in-use":
        "Этот email уже используется",

      "auth/weak-password":
        "Пароль должен быть минимум 6 символов",

      "auth/invalid-email":
        "Некорректный email",

      "auth/missing-password":
        "Введите пароль"

    }[e.code]

    ||

    e.message

    ||

    "Ошибка"

  );

}


function setAuthError(
  text
) {

  $("loginError")
    .textContent =
    text || "";

}


function setTaskError(
  text
) {

  $("taskError")
    .textContent =
    text || "";

}


watchAuth(
  async user => {

    if (!user) {

      $("loginScreen").hidden =
        false;

      $("app").hidden =
        true;

      return;

    }


    $("loginScreen").hidden =
      true;


    $("app").hidden =
      false;


    $("userEmail")
      .textContent =
      user.email || "";


    try {

      await loadAll();

      await ensureDefaults();

      render();

    } catch (
      e
    ) {

      console.error(e);

      alert(
        "Не удалось загрузить данные Firebase. " +
        "Проверь firebaseConfig и Firestore Rules."
      );

    }

  }
);


/* AUTH */

$("loginButton")
  .addEventListener(
    "click",
    async () => {

      setAuthError("");


      const email =
        $("loginEmail")
          .value
          .trim();


      const password =
        $("loginPassword")
          .value;


      if (
        !email ||
        !password
      ) {

        setAuthError(
          "Введите email и пароль"
        );

        return;

      }


      try {

        await login(
          email,
          password
        );

      } catch (
        e
      ) {

        setAuthError(
          authError(e)
        );

      }

    }
  );


$("registerButton")
  .addEventListener(
    "click",
    async () => {

      setAuthError("");


      const email =
        $("loginEmail")
          .value
          .trim();


      const password =
        $("loginPassword")
          .value;


      if (
        !email ||
        !password
      ) {

        setAuthError(
          "Введите email и пароль"
        );

        return;

      }


      try {

        await register(
          email,
          password
        );

      } catch (
        e
      ) {

        setAuthError(
          authError(e)
        );

      }

    }
  );


$("logoutButton")
  .addEventListener(
    "click",
    logout
  );


$("userButton")
  .addEventListener(
    "click",
    () => {

      $("userMenu").hidden =
        !$("userMenu").hidden;

    }
  );


document
  .addEventListener(
    "click",
    e => {

      if (

        !$("userMenu").hidden &&

        !e.target.closest(
          "#userMenu"
        ) &&

        !e.target.closest(
          "#userButton"
        )

      ) {

        $("userMenu").hidden =
          true;

      }

    }
  );


/* RENDER */

function render() {

  renderAll(
    handlers
  );

}


/* HANDLERS */

const handlers = {

  toggle:
    async task => {

      const day =
        dateKey(
          state.selectedDate
        );


      const value =
        state.completions[
          task.id
        ]?.[day];


      if (
        task.type === "value"
      ) {

        if (value) {

          await saveCompletion(
            task.id,
            day,
            ""
          );


          render();

        } else {

          const input =
            document.querySelector(
              `.value-input[data-task-id="${CSS.escape(task.id)}"]`
            );


          if (input) {

            input.focus();

          }

        }


        return;

      }


      await saveCompletion(
        task.id,
        day,
        !value
      );


      render();

    },


  value:
    async (
      task,
      value
    ) => {

      await saveCompletion(
        task.id,
        dateKey(
          state.selectedDate
        ),
        value
      );


      render();

    },


  togglePlanned:
    async task => {

      await updateTask(
        "planned",
        task.id,
        {
          completed:
            !task.completed
        }
      );


      render();

    },


  edit:
    (
      task,
      type
    ) => {

      openModal(
        type,
        task
      );

    },


  remove:
    async (
      task,
      type
    ) => {

      if (
        confirm(
          `Удалить «${task.name}»?`
        )
      ) {

        await deleteTask(
          type,
          task.id
        );


        render();

      }

    },


  reorder:
    async (
      required,
      dragId,
      targetId
    ) => {

      const ids =
        state.daily

          .filter(
            task =>
              task.active !== false &&
              task.required ===
                required
          )

          .map(
            task =>
              task.id
          );


      const from =
        ids.indexOf(
          dragId
        );


      const to =
        ids.indexOf(
          targetId
        );


      if (
        from < 0 ||
        to < 0 ||
        from === to
      ) {

        return;

      }


      ids.splice(
        from,
        1
      );


      ids.splice(
        to,
        0,
        dragId
      );


      await reorderDaily(
        required,
        ids
      );


      render();

    }

};


/* DAY NAVIGATION */

function changeDay(
  delta
) {

  const d =
    new Date(
      state.selectedDate
    );


  d.setDate(
    d.getDate() + delta
  );


  state.selectedDate =
    d;


  render();

}


$("prevDayButton")
  .addEventListener(
    "click",
    () =>
      changeDay(-1)
  );


$("nextDayButton")
  .addEventListener(
    "click",
    () =>
      changeDay(1)
  );


$("todayButton")
  .addEventListener(
    "click",
    () => {

      state.selectedDate =
        new Date();


      render();

    }
  );


$("dateTitleButton")
  .addEventListener(
    "click",
    openCalendar
  );


/* CALENDAR */

$("calendarButton")
  .addEventListener(
    "click",
    openCalendar
  );


$("prevMonthButton")
  .addEventListener(
    "click",
    () =>
      moveMonth(-1)
  );


$("nextMonthButton")
  .addEventListener(
    "click",
    () =>
      moveMonth(1)
  );


document.addEventListener(
  "kor:dateChanged",
  render
);


/* TASK MODAL */

const modal =
  $("taskModal");


function openModal(
  type,
  task = null
) {

  state.modalType =
    type;


  state.editing =
    task;


  setTaskError("");


  $("modalTitle")
    .textContent =

      task

        ? "Редактировать задание"

        : type === "daily"

          ? "Новое ежедневное"
          : "Новое задание на дату";


  $("taskName")
    .value =
    task?.name || "";


  $("taskType")
    .value =
    task?.type === "value"
      ? "value"
      : "check";


  $("taskGold")
    .value =
    task?.gold ??
    "";


  $("taskRequired")
    .value =
    String(
      task?.required !== false
    );


  $("taskNote")
    .value =
    task?.note || "";


  $("taskDate")
    .value =
    task?.date ||
    dateKey(
      state.selectedDate
    );


  $("dateField")
    .hidden =
    type !== "planned";


  $("requiredField")
    .hidden =
    type !== "daily";


  $("goldField")
    .hidden =
    type !== "daily";


  $("taskModal")
    .hidden =
    false;


  setTimeout(
    () =>
      $("taskName").focus(),
    0
  );

}


function closeTaskModal() {

  $("taskModal").hidden =
    true;


  state.editing =
    null;

}


/* ADD BUTTONS */

$("addRequiredButton")
  .addEventListener(
    "click",
    () => {

      $("taskRequired")
        .value =
        "true";


      openModal(
        "daily"
      );

    }
  );


$("addOptionalButton")
  .addEventListener(
    "click",
    () => {

      $("taskRequired")
        .value =
        "false";


      openModal(
        "daily"
      );

    }
  );


$("plannedButton")
  .addEventListener(
    "click",
    () =>
      openModal(
        "planned"
      )
  );


/* TYPE */

$("taskType")
  .addEventListener(
    "change",
    () => {

      // «Цель» больше нигде не используется.
      // Тип «timer» удалён.

    }
  );


/* SAVE */

$("saveTaskButton")
  .addEventListener(
    "click",
    async () => {

      setTaskError("");


      const name =
        $("taskName")
          .value
          .trim();


      if (!name) {

        setTaskError(
          "Введите название"
        );

        return;

      }


      const task = {

        name,

        type:
          $("taskType")
            .value,

        note:
          $("taskNote")
            .value
            .trim()

      };


      if (
        state.modalType ===
        "daily"
      ) {

        task.required =
          $("taskRequired")
            .value === "true";


        task.gold =
          Math.max(
            0,
            Number(
              $("taskGold")
                .value
            ) || 0
          );

      } else {

        task.date =
          $("taskDate")
            .value;


        if (
          !task.date
        ) {

          setTaskError(
            "Выберите дату"
          );

          return;

        }

      }


      try {

        if (
          state.editing
        ) {

          await updateTask(
            state.modalType,
            state.editing.id,
            task
          );

        } else if (
          state.modalType ===
          "daily"
        ) {

          await createDaily(
            task
          );

        } else {

          await createPlanned(
            task
          );

        }


        closeTaskModal();

        render();

      } catch (
        e
      ) {

        console.error(e);

        setTaskError(
          "Не удалось сохранить. Проверь Firestore Rules."
        );

      }

    }
  );


/* CLOSE */

document
  .querySelectorAll(
    "[data-close]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.close;


          if (
            id ===
            "taskModal"
          ) {

            closeTaskModal();

          }


          if (
            id ===
            "calendarModal"
          ) {

            closeCalendar();

          }

        }
      );

    }
  );


$("taskModal")
  .addEventListener(
    "click",
    e => {

      if (
        e.target ===
        $("taskModal")
      ) {

        closeTaskModal();

      }

    }
  );


$("calendarModal")
  .addEventListener(
    "click",
    e => {

      if (
        e.target ===
        $("calendarModal")
      ) {

        closeCalendar();

      }

    }
  );