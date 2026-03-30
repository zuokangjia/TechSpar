import { createContext, useContext, useState, useRef, useCallback } from "react";
import { getTaskStatus } from "../api/interview";

const TaskStatusContext = createContext(null);

const BASE_POLL_INTERVAL = 3000;
const BACKFILL_POLL_INTERVAL = 8000;
const MAX_POLL_INTERVAL = 15000;
const MAX_POLL_DURATION = 10 * 60 * 1000;

export function TaskStatusProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const timersRef = useRef({});
  const pollStateRef = useRef({});

  const stopPolling = useCallback((taskId) => {
    if (timersRef.current[taskId]) {
      clearTimeout(timersRef.current[taskId]);
      delete timersRef.current[taskId];
    }
    if (pollStateRef.current[taskId]) {
      delete pollStateRef.current[taskId];
    }
  }, []);

  const startTask = useCallback((id, type, label) => {
    stopPolling(id);
    setTasks((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      return [...filtered, { id, type, label, status: "pending" }];
    });

    const initialInterval = type === "profile_backfill" ? BACKFILL_POLL_INTERVAL : BASE_POLL_INTERVAL;
    pollStateRef.current[id] = {
      interval: initialInterval,
      startedAt: Date.now(),
    };

    const pollOnce = async () => {
      const state = pollStateRef.current[id];
      if (!state) return;

      if (Date.now() - state.startedAt > MAX_POLL_DURATION) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: "error",
                  result: { message: "任务轮询超时，请稍后重试或手动刷新。" },
                }
              : t
          )
        );
        stopPolling(id);
        return;
      }

      try {
        const data = await getTaskStatus(id);
        if (data.status === "done" || data.status === "error") {
          setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: data.status, result: data.result } : t))
          );
          stopPolling(id);
          return;
        }

        timersRef.current[id] = setTimeout(pollOnce, state.interval);
      } catch {
        // Back off on transient errors to avoid hot-loop polling.
        state.interval = Math.min(MAX_POLL_INTERVAL, Math.round(state.interval * 1.5));
        timersRef.current[id] = setTimeout(pollOnce, state.interval);
      }
    };

    timersRef.current[id] = setTimeout(pollOnce, initialInterval);
  }, [stopPolling]);

  const dismissTask = useCallback((id) => {
    stopPolling(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [stopPolling]);

  // Global state to track interview creation across route navigations
  const [creatingSessionMode, setCreatingSessionMode] = useState(null);

  return (
    <TaskStatusContext.Provider value={{ tasks, startTask, dismissTask, creatingSessionMode, setCreatingSessionMode }}>
      {children}
    </TaskStatusContext.Provider>
  );
}

export function useTaskStatus() {
  return useContext(TaskStatusContext);
}
