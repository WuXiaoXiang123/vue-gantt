<template>
  <div class="gantt-container">
    <Timeline :timeScale="timeScale" @change="onTimeScaleChange" />
    <div class="task-bars">
      <TaskBar
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :timeScale="timeScale"
        @updateTask="updateTask"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Timeline from './Timeline.vue'
import TaskBar from './TaskBar.vue'
import { useGantt } from '../composables/useGantt'
import { GanttTask } from '../types'

const { tasks, timeScale, updateTask } = useGantt()

const onTimeScaleChange = (newScale: string) => {
  timeScale.value = newScale
}

// Watch for changes in tasks to update the task bars accordingly
watch(tasks, (newTasks) => {
  // Logic to handle task updates when the time scale changes
  // This can include recalculating positions or other necessary updates
})
</script>

<style scoped>
.gantt-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.task-bars {
  position: relative;
  height: calc(100% - 50px); /* Adjust based on timeline height */
  overflow: hidden;
}
</style>