<template>
  <div class="g-timeAxis">
    <div class="g-timeUnits-container">
      <div
        v-for="({ label, value, date, width }, index) in timeAxisUnits.upperUnits"
        :key="label"
        class="g-upper-timeUnit"
        :style="{
          background: index % 2 === 0 ? colors.primary : colors.secondary,
          color: colors.text,
          width
        }"
      >
        <slot name="upper-timeUnit" :label="label" :value="value" :date="date">
          {{ label }}
        </slot>
      </div>
    </div>

    <div class="g-timeUnits-container">
      <div
        v-for="({ label, value, date, width }, index) in timeAxisUnits.lowerUnits"
        :key="label"
        class="g-timeUnit"
        :style="{
          background: index % 2 === 0 ? colors.ternary : colors.quartenary,
          color: colors.text,
          flexDirection: precision === 'hour' ? 'column' : 'row',
          alignItems: precision === 'hour' ? '' : 'center',
          width
        }"
      >
        <slot name="timeUnit" :label="label" :value="value" :date="date">
          {{ label }}
        </slot>
        <div
          v-if="precision === 'hour'"
          class="g-timeAxis-hour-pin"
          :style="{ background: colors.text }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import provideConfig from "@/provider/provideConfig"
import useTimeAxisUnits from "@/composables/useTimeAxisUnits"

const { precision, colors } = provideConfig()
const { timeAxisUnits } = useTimeAxisUnits()
</script>

<style scoped>
.g-timeAxis {
  position: sticky;
  top: 0;
  width: 100%;
  height: 80px;
  background: white;
  z-index: 4;
  display: flex;
  flex-direction: column;
}

.g-timeUnits-container {
  display: flex;
  width: 100%;
  height: 50%;
}

.g-timeUnit {
  height: 100%;
  font-size: 65%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.g-upper-timeUnit {
  display: flex;
  height: 100%;
  justify-content: center;
  align-items: center;
}

.g-timeAxis-hour-pin {
  width: 1px;
  height: 10px;
}
</style>
