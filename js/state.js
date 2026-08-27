export const state = {
  user: null,
  daily: [],
  planned: [],
  completions: {},
  selectedDate: new Date(),
  calendarMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  calendarSelected: null,
  editing: null,
  modalType: "daily",
  timers: {}
};
