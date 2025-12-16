<template>
  <div class="task-bar" :style="{ left: `${task.startX}px`, width: `${task.width}px` }" @mousedown="onMouseDown">
    <div class="task-bar-content">
      <span class="task-name">{{ task.name }}</span>
      <span class="task-progress">{{ task.progress }}%</span>
    </div>
    <div class="resize-handle left" @mousedown.stop="onResizeStart('left')"></div>
    <div class="resize-handle right" @mousedown.stop="onResizeStart('right')"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, emit } from 'vue';

interface Task {
  id: string;
  name: string;
  startX: number;
  width: number;
  progress: number;
}

const props = defineProps<{
  task: Task;
  onUpdate: (task: Task) => void;
}>();

const emit = defineEmits<{
  (e: 'update', task: Task): void;
}>();

const onMouseDown = (event: MouseEvent) => {
  const initialX = event.clientX;
  const initialStartX = props.task.startX;

  const onMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = moveEvent.clientX - initialX;
    const newStartX = initialStartX + deltaX;
    props.onUpdate({ ...props.task, startX: newStartX });
  };

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
};

const onResizeStart = (direction: 'left' | 'right') => {
  const initialWidth = props.task.width;
  const initialX = props.task.startX;

  const onMouseMove = (event: MouseEvent) => {
    const deltaX = event.clientX - initialX;

    if (direction === 'left') {
      const newWidth = initialWidth - deltaX;
      if (newWidth > 0) {
        props.onUpdate({ ...props.task, startX: initialX + deltaX, width: newWidth });
      }
    } else {
      const newWidth = initialWidth + deltaX;
      if (newWidth > 0) {
        props.onUpdate({ ...props.task, width: newWidth });
      }
    }
  };

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
};
</script>

<style scoped>
.task-bar {
  position: absolute;
  height: 30px;
  background-color: #4CAF50;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 5px;
  color: white;
}

.task-bar-content {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.resize-handle {
  width: 10px;
  height: 30px;
  background-color: #666;
  cursor: ew-resize;
}

.resize-handle.left {
  position: absolute;
  left: -5px;
  top: 0;
}

.resize-handle.right {
  position: absolute;
  right: -5px;
  top: 0;
}
</style>