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
  saveDailyGold,
  reorderDaily
} from "./data.js";


import {
  $,
  dateKey,
  renderAll,
  renderOptionalVisibility
} from "./ui.js";


import {
  openCalendar,
  closeCalendar,
  moveMonth
} from "./calendar.js";


function authError(
  error
) {

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

    }[
      error.code
    ]

    ||

    error.message

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


/* =========================================
   AUTH
========================================= */

watchAuth(
  async user => {

    if (!user) {

      $("loginScreen")
        .hidden =
        false;

      $("app")
        .hidden =
        true;

      return;

    }


    $("loginScreen")
      .hidden =
      true;


    $("app")
      .hidden =
      false;


    $("userEmail")
      .textContent =
      user.email ||
      "";


    /*
     * Сохраняем настройку
     * скрытия необязательных.
     */

    state.optionalHidden =
      localStorage.getItem(
        `korDailyOptionalHidden_${user.uid}`
      ) === "true";


    try {

      await loadAll();

      await ensureDefaults();

      render();

    } catch (
      error
    ) {

      console.error(
        error
      );


      alert(
        "Не удалось загрузить данные Firebase. Проверь firebaseConfig и Firestore Rules."
      );

    }

  }
);


/* =========================================
   LOGIN
========================================= */

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
        error
      ) {

        setAuthError(
          authError(
            error
          )
        );

      }

    }
  );


/* =========================================
   REGISTER
========================================= */

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
        error
      ) {

        setAuthError(
          authError(
            error
          )
        );

      }

    }
  );


/* LOGOUT */

$("logoutButton")
  .addEventListener(
    "click",
    logout
  );


/* USER MENU */

$("userButton")
  .addEventListener(
    "click",
    () => {

      $("userMenu").hidden =
        !$("userMenu").hidden;

    }
  );


/* =========================================
   RENDER
========================================= */

function render() {

  renderAll(
    handlers
  );

}


/* =========================================
   HANDLERS
========================================= */

const handlers = {


  /* DAILY CHECK */

  toggle:
    async task => {

      const day =
        dateKey(
          state.selectedDate
        );


      const current =
        state
          .completions[
            task.id
          ]?.[day];


      /*
       * Для "Значение":
       *
       * если значение есть —
       * очищаем его.
       *
       * если нет —
       * ставим фокус в поле.
       */

      if (
        task.type ===
        "value"
      ) {

        if (
          String(
            current ?? ""
          ).trim() !== ""
        ) {

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


      /*
       * Обычная отметка.
       */

      await saveCompletion(

        task.id,

        day,

        !current

      );


      render();

    },


  /* VALUE */

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


  /* PLANNED */

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


  /* EDIT */

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


  /* DELETE */

  remove:
    async (
      task,
      type
    ) => {

      if (
        !confirm(
          `Удалить «${task.name}»?`
        )
      ) {

        return;

      }


      await deleteTask(
        type,
        task.id
      );


      render();

    },


  /* REORDER */

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

              task.active !==
                false &&

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


/* =========================================
   DAY NAVIGATION
========================================= */

function changeDay(
  amount
) {

  const date =
    new Date(
      state.selectedDate
    );


  date.setDate(
    date.getDate() +
    amount
  );


  state.selectedDate =
    date;


  render();

}


$("prevDayButton")
  .addEventListener(
    "click",
    () =>
      changeDay(
        -1
      )
  );


$("nextDayButton")
  .addEventListener(
    "click",
    () =>
      changeDay(
        1
      )
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


/* =========================================
   CALENDAR
========================================= */

$("calendarButton")
  .addEventListener(
    "click",
    openCalendar
  );


$("prevMonthButton")
  .addEventListener(
    "click",
    () =>
      moveMonth(
        -1
      )
  );


$("nextMonthButton")
  .addEventListener(
    "click",
    () =>
      moveMonth(
        1
      )
  );


$("calendarModal")
  .addEventListener(
    "click",
    event => {

      if (
        event.target ===
        $("calendarModal")
      ) {

        closeCalendar();

      }

    }
  );


/* =========================================
   OPTIONAL HIDE
========================================= */

$("toggleOptionalButton")
  .addEventListener(
    "click",
    () => {

      state.optionalHidden =
        !state.optionalHidden;


      if (
        state.user
      ) {

        localStorage.setItem(

          `korDailyOptionalHidden_${state.user.uid}`,

          String(
            state.optionalHidden
          )

        );

      }


      renderOptionalVisibility();

    }
  );


/* =========================================
   TASK MODAL
========================================= */

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
    task?.name ||
    "";


  $("taskType")
    .value =

      task?.type ===
        "value"

        ? "value"

        : "check";


  $("taskGold")
    .value =
    task?.gold ??
    "";


  $("taskRequired")
    .value =
    String(
      task?.required !==
        false
    );


  $("taskNote")
    .value =
    task?.note ||
    "";


  $("taskDate")
    .value =
    task?.date ||

    dateKey(
      state.selectedDate
    );


  $("dateField")
    .hidden =
    type !==
    "planned";


  $("requiredField")
    .hidden =
    type !==
    "daily";


  $("goldField")
    .hidden =
    type !==
    "daily";


  $("taskModal")
    .hidden =
    false;


  setTimeout(
    () =>
      $("taskName")
        .focus(),
    0
  );

}


function closeTaskModal() {

  $("taskModal")
    .hidden =
    true;


  state.editing =
    null;

}


/* ADD REQUIRED */

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


/* ADD OPTIONAL */

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


/* ADD PLANNED */

$("plannedButton")
  .addEventListener(
    "click",
    () =>
      openModal(
        "planned"
      )
  );


/* SAVE TASK */

$("saveTaskButton")
  .addEventListener(
    "click",
    async () => {

      setTaskError("");


      const name =
        $("taskName")
          .value
          .trim();


      if (
        !name
      ) {

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
            .value ===
          "true";


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
        error
      ) {

        console.error(
          error
        );


        setTaskError(
          "Не удалось сохранить. Проверь Firestore Rules."
        );

      }

    }
  );


/* CLOSE MODAL */

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
    event => {

      if (
        event.target ===
        $("taskModal")
      ) {

        closeTaskModal();

      }

    }
  );


/* =========================================
   DAILY GOLD
========================================= */

$("saveDailyGoldButton")
  .addEventListener(
    "click",
    async () => {

      const day =
        dateKey(
          state.selectedDate
        );


      const value =
        Math.max(
          0,
          Number(
            $("dailyGoldInput")
              .value
          ) || 0
        );


      try {

        await saveDailyGold(
          day,
          value
        );


        render();

      } catch (
        error
      ) {

        console.error(
          error
        );


        alert(
          "Не удалось сохранить голд."
        );

      }

    }
  );


/*
 * Сохранение голда
 * клавишей Enter.
 */

$("dailyGoldInput")
  .addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Enter"
      ) {

        $("saveDailyGoldButton")
          .click();

      }

    }
  );