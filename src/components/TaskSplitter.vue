<template>
  <div class="task-splitter">
    <div v-for="(task, index) in tasks" :key="task.id" class="task-bar">
      <TaskBar
        :task="task"
        @updateTask="updateTask(index, $event)"
      />
      <button @click="splitTask(index)">分割任务</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue'
import TaskBar from './TaskBar.vue'
import type { GanttTask } from '../types'

const props = defineProps<{
  tasks: GanttTask[]
}>()

const updateTask = (index: number, updatedTask: GanttTask) => {
  props.tasks[index] = updatedTask
}

const splitTask = (index: number) => {
  const taskToSplit = props.tasks[index]
  const newTask = { ...taskToSplit, id: `${taskToSplit.id}-split`, start: new Date(taskToSplit.start), end: new Date(taskToSplit.end) }
  props.tasks.push(newTask)
}
</script>

<style scoped>
.task-splitter {
  display: flex;
  flex-direction: column;
}

.task-bar {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
</style>