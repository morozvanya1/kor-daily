export const state = {

  user: null,

  daily: [],

  planned: [],

  /*
   * Формат:
   *
   * completions[taskId][date] = значение
   *
   * Например:
   *
   * completions["abc"]["2026-08-29"] = true
   *
   * или:
   *
   * completions["xyz"]["2026-08-29"] = "125"
   */

  completions: {},

  /*
   * Голд:
   *
   * dailyGold["2026-08-29"] = 125
   */

  dailyGold: {},

  selectedDate: new Date(),

  calendarMonth:
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ),

  calendarSelected: null,

  editing: null,

  modalType: "daily",

  drag: null,

  optionalHidden: false

};