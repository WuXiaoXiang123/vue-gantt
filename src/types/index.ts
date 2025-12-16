// src/types/index.ts

export type TimeScale = 'minute' | 'hour' | 'day' | 'week' | 'month';

export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  color: string;
  dependencies?: string[]; // Task dependencies
}

export interface GanttState {
  tasks: GanttTask[];
  timeRange: {
    min: number;
    max: number;
  };
  timeScale: TimeScale;
}