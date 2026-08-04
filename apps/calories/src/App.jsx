import { useEffect, useState } from "react";
import { loadStore, saveStore, newId, emptyDayLogs } from "./storage.js";
import { todayStr } from "./dateUtils.js";
import { TabBar } from "./ui.jsx";
import TodayView from "./TodayView.jsx";
import FoodsView from "./FoodsView.jsx";
import TrainingView from "./TrainingView.jsx";
import WeightView from "./WeightView.jsx";
import SettingsView from "./SettingsView.jsx";
import FoodPicker from "./FoodPicker.jsx";

export default function App() {
  const [store, setStore] = useState(loadStore);
  const [tab, setTab] = useState("today");
  const [todayDate, setTodayDate] = useState(todayStr);
  const [trainingDate, setTrainingDate] = useState(todayStr);
  const [pickerMeal, setPickerMeal] = useState(null); // set while the Add-food screen is open

  // Write-through persistence: every state change hits localStorage
  // immediately, so closing or killing the app never loses a log.
  useEffect(() => {
    saveStore(store);
  }, [store]);

  // ---- food log ----
  const addLogEntry = (date, meal, payload) =>
    setStore((s) => {
      const day = s.logs[date] || emptyDayLogs();
      const now = Date.now();
      const entry = { id: newId(), grams: 0, ...payload, updatedAt: now };
      const foods = payload.foodId && s.foods[payload.foodId]
        ? { ...s.foods, [payload.foodId]: { ...s.foods[payload.foodId], lastUsedAt: now } }
        : s.foods;
      return {
        ...s,
        foods,
        logs: { ...s.logs, [date]: { ...day, [meal]: [...(day[meal] || []), entry] } },
      };
    });

  const updateLogEntry = (date, meal, entryId, grams) =>
    setStore((s) => {
      const day = s.logs[date];
      if (!day) return s;
      return {
        ...s,
        logs: {
          ...s.logs,
          [date]: {
            ...day,
            [meal]: (day[meal] || []).map((e) => (e.id === entryId ? { ...e, grams, updatedAt: Date.now() } : e)),
          },
        },
      };
    });

  const deleteLogEntry = (date, meal, entryId) =>
    setStore((s) => {
      const day = s.logs[date];
      if (!day) return s;
      return {
        ...s,
        logs: { ...s.logs, [date]: { ...day, [meal]: (day[meal] || []).filter((e) => e.id !== entryId) } },
      };
    });

  // ---- food database ----
  const saveFood = (food) =>
    setStore((s) => ({ ...s, foods: { ...s.foods, [food.id]: { ...s.foods[food.id], ...food } } }));

  const deleteFood = (id) =>
    setStore((s) => {
      const foods = { ...s.foods };
      delete foods[id];
      return { ...s, foods };
    });

  // ---- exercises ----
  const saveExercise = (ex) =>
    setStore((s) => ({ ...s, exercises: { ...s.exercises, [ex.id]: { ...s.exercises[ex.id], ...ex } } }));

  const deleteExercise = (id) =>
    setStore((s) => {
      const exercises = { ...s.exercises };
      delete exercises[id];
      return { ...s, exercises };
    });

  // ---- training log ----
  const addTrainingEntry = (date, payload) =>
    setStore((s) => {
      const day = s.training[date] || { entries: [] };
      const now = Date.now();
      const entry = { id: newId(), ...payload, updatedAt: now };
      return { ...s, training: { ...s.training, [date]: { entries: [...day.entries, entry], updatedAt: now } } };
    });

  const updateTrainingEntry = (date, entryId, patch) =>
    setStore((s) => {
      const day = s.training[date];
      if (!day) return s;
      const now = Date.now();
      return {
        ...s,
        training: {
          ...s.training,
          [date]: {
            ...day,
            entries: day.entries.map((e) => (e.id === entryId ? { ...e, ...patch, updatedAt: now } : e)),
            updatedAt: now,
          },
        },
      };
    });

  const deleteTrainingEntry = (date, entryId) =>
    setStore((s) => {
      const day = s.training[date];
      if (!day) return s;
      return {
        ...s,
        training: { ...s.training, [date]: { ...day, entries: day.entries.filter((e) => e.id !== entryId) } },
      };
    });

  // ---- weight ----
  const saveWeight = (date, kg) =>
    setStore((s) => ({ ...s, weights: { ...s.weights, [date]: { kg: Number(kg), updatedAt: Date.now() } } }));

  const deleteWeight = (date) =>
    setStore((s) => {
      const weights = { ...s.weights };
      delete weights[date];
      return { ...s, weights };
    });

  // ---- settings ----
  const setTargets = (targets) =>
    setStore((s) => ({ ...s, settings: { ...s.settings, targets, updatedAt: Date.now() } }));

  if (pickerMeal) {
    return (
      <FoodPicker
        foods={store.foods}
        meal={pickerMeal}
        onCacheFood={saveFood}
        onAddLog={(meal, payload) => addLogEntry(todayDate, meal, payload)}
        onClose={() => setPickerMeal(null)}
      />
    );
  }

  return (
    <>
      {tab === "today" && (
        <TodayView
          date={todayDate}
          setDate={setTodayDate}
          dayLogs={store.logs[todayDate] || emptyDayLogs()}
          targets={store.settings.targets}
          onAddFood={(meal) => setPickerMeal(meal)}
          onUpdateEntry={(meal, id, grams) => updateLogEntry(todayDate, meal, id, grams)}
          onDeleteEntry={(meal, id) => deleteLogEntry(todayDate, meal, id)}
        />
      )}
      {tab === "foods" && <FoodsView foods={store.foods} onSaveFood={saveFood} onDeleteFood={deleteFood} />}
      {tab === "training" && (
        <TrainingView
          date={trainingDate}
          setDate={setTrainingDate}
          exercises={store.exercises}
          training={store.training}
          dayEntries={store.training[trainingDate]?.entries || []}
          onSaveExercise={saveExercise}
          onDeleteExercise={deleteExercise}
          onLogEntry={(payload) => addTrainingEntry(trainingDate, payload)}
          onUpdateEntry={(id, patch) => updateTrainingEntry(trainingDate, id, patch)}
          onDeleteEntry={(id) => deleteTrainingEntry(trainingDate, id)}
        />
      )}
      {tab === "weight" && <WeightView weights={store.weights} onSaveWeight={saveWeight} onDeleteWeight={deleteWeight} />}
      {tab === "settings" && (
        <SettingsView store={store} setStore={setStore} targets={store.settings.targets} setTargets={setTargets} />
      )}
      <TabBar tab={tab} onTab={setTab} />
    </>
  );
}
