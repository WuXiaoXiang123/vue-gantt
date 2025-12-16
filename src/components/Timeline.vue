<template>
  <div class="timeline-container">
    <select v-model="timeScale" @change="updateTimeline">
      <option value="minute">分钟</option>
      <option value="hour">小时</option>
      <option value="day">天</option>
      <option value="week">周</option>
      <option value="month">月</option>
    </select>
    <div class="ticks">
      <div
        v-for="tick in ticks"
        :key="tick.date"
        class="tick"
        :style="{ left: `${tick.position}px` }"
      >
        <span>{{ tick.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const timeScale = ref<'minute' | 'hour' | 'day' | 'week' | 'month'>('day');
const ticks = ref<{ date: Date; label: string; position: number }[]>([]);

const updateTimeline = () => {
  const timeUnitMs = getTimeUnitMs();
  const startDate = new Date(); // Replace with actual start date
  const endDate = new Date(); // Replace with actual end date
  endDate.setDate(endDate.getDate() + 30); // Example: 30 days later

  const currentDate = new Date(startDate);
  ticks.value = [];

  while (currentDate <= endDate) {
    const label = getTimeLabel(currentDate);
    const position = calculatePosition(currentDate, startDate, endDate);
    ticks.value.push({ date: currentDate, label, position });
    currentDate.setTime(currentDate.getTime() + timeUnitMs);
  }
};

const getTimeUnitMs = () => {
  switch (timeScale.value) {
    case 'minute': return 60 * 1000;
    case 'hour': return 60 * 60 * 1000;
    case 'day': return 24 * 60 * 60 * 1000;
    case 'week': return 7 * 24 * 60 * 60 * 1000;
    case 'month': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
};

const getTimeLabel = (date: Date): string => {
  switch (timeScale.value) {
    case 'minute':
      return `${date.getHours()}:${date.getMinutes()}`;
    case 'hour':
      return `${date.getHours()}:00`;
    case 'day':
      return `${date.getMonth() + 1}/${date.getDate()}`;
    case 'week':
      return `W${Math.ceil(date.getDate() / 7)}`;
    case 'month':
      return `${date.getFullYear()}-${date.getMonth() + 1}`;
    default:
      return '';
  }
};

const calculatePosition = (date: Date, startDate: Date, endDate: Date): number => {
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = date.getTime() - startDate.getTime();
  return (elapsed / totalDuration) * 100; // Assuming 100% width for the timeline
};

watch(timeScale, updateTimeline);
updateTimeline();
</script>

<style scoped>
.timeline-container {
  position: relative;
  height: 50px;
  border-bottom: 1px solid #ddd;
}

.ticks {
  position: relative;
  height: 100%;
}

.tick {
  position: absolute;
  bottom: 0;
  border-left: 1px solid #ccc;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #333;
}
</style>