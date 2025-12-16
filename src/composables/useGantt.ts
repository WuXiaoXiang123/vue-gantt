import { ref, computed } from 'vue';
import type { GanttTask } from '../types';

export const useGantt = () => {
  const tasks = ref<GanttTask[]>([]);
  const timeScale = ref<'minute' | 'hour' | 'day' | 'week' | 'month'>('day');
  const zoomFactor = ref<number>(1);

  const addTask = (task: GanttTask) => {
    tasks.value.push(task);
  };

  const updateTask = (taskId: string, updatedTask: Partial<GanttTask>) => {
    const taskIndex = tasks.value.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...updatedTask };
    }
  };

  const removeTask = (taskId: string) => {
    tasks.value = tasks.value.filter(task => task.id !== taskId);
  };

  const getTimeRange = computed(() => {
    const starts = tasks.value.map(task => task.start.getTime());
    const ends = tasks.value.map(task => task.end.getTime());
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    return {
      min: new Date(min),
      max: new Date(max),
    };
  });

  const getTimeUnitMs = computed(() => {
    switch (timeScale.value) {
      case 'minute': return 60 * 1000;
      case 'hour': return 60 * 60 * 1000;
      case 'day': return 24 * 60 * 60 * 1000;
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      case 'month': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  });

  return {
    tasks,
    timeScale,
    zoomFactor,
    addTask,
    updateTask,
    removeTask,
    getTimeRange,
    getTimeUnitMs,
  };
};