<template>
  <div ref="ganttContainer" class="gantt-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <select v-model="timeScale" @change="redrawGantt">
        <option value="hour">小时</option>
        <option value="day">天</option>
        <option value="week">周</option>
        <option value="month">月</option>
      </select>
      <button @click="zoomIn">放大</button>
      <button @click="zoomOut">缩小</button>
    </div>

    <!-- 时间刻度条 -->
    <div ref="timelineContainer" class="timeline-container">
      <v-stage
        ref="timelineStageRef"
        :config="{ width: containerWidth, height: 40 }"
        @wheel="handleWheel"
      >
        <v-layer ref="timelineLayerRef">
          <v-line v-for="(line, index) in timelineLines" :key="'line-' + index" :config="line" />
          <v-text
            v-for="(label, index) in timelineLabels"
            :key="'label-' + index"
            :config="label"
          />
        </v-layer>
      </v-stage>
    </div>

    <!-- 甘特图画布 -->
    <div ref="stageContainer" class="stage-container">
      <v-stage
        ref="stageRef"
        :config="{ width: containerWidth, height: containerHeight }"
        @wheel="handleWheel"
      >
        <v-layer ref="layerRef">
          <!-- 网格线 -->
          <v-line
            v-for="(gridLine, index) in gridLines"
            :key="'grid-' + index"
            :config="gridLine"
          />

          <!-- 今日线 -->
          <v-line v-if="todayLine.points" :config="todayLine" />
          <v-text v-if="todayLabel.x" :config="todayLabel" />

          <!-- 依赖关系 -->
          <v-line
            v-for="(dependency, index) in dependencies"
            :key="'dep-' + index"
            :config="dependency.line"
          />
          <v-line
            v-for="(arrow, index) in dependencies"
            :key="'arrow-' + index"
            :config="arrow.arrow"
          />

          <!-- 任务条 -->
          <template v-for="(taskItem, index) in taskItems" :key="'task-' + index">
            <!-- 任务背景条 -->
            <v-rect
              :config="taskItem.background"
              @dragstart="(e: any) => onDragStart(index, e)"
              @dragmove="(e: any) => onDragMove(index, e)"
              @dragend="(e: any) => onDragEnd(index, e)"
            />

            <!-- 进度条 -->
            <v-rect :config="taskItem.progress" />

            <!-- 任务名称 -->
            <v-text :config="taskItem.label" />

            <!-- 进度文本 -->
            <v-text :config="taskItem.progressText" />

            <!-- 调整手柄 -->
            <v-rect
              :config="taskItem.leftHandle"
              @dragstart="(e: any) => onLeftHandleDragStart(index, e)"
              @dragmove="(e: any) => onLeftHandleDragMove(index, e)"
              @dragend="(e: any) => onLeftHandleDragEnd(index, e)"
            />
            <v-rect
              :config="taskItem.rightHandle"
              @dragstart="(e: any) => onRightHandleDragStart(index, e)"
              @dragmove="(e: any) => onRightHandleDragMove(index, e)"
              @dragend="(e: any) => onRightHandleDragEnd(index, e)"
            />
          </template>
        </v-layer>
      </v-stage>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, reactive, watch } from 'vue'
import Konva from 'konva'

// 时间刻度类型
type TimeScale = 'hour' | 'day' | 'week' | 'month'

// 甘特图数据结构
interface GanttTask {
  id: string
  name: string
  start: Date
  end: Date
  progress: number
  color: string
  dependencies?: string[] // 任务依赖
}

// 示例数据
const tasks = ref<GanttTask[]>([
  {
    id: '1',
    name: '项目规划',
    start: new Date(2023, 0, 1),
    end: new Date(2023, 0, 10),
    progress: 100,
    color: '#4CAF50',
  },
  {
    id: '2',
    name: '需求分析',
    start: new Date(2023, 0, 5),
    end: new Date(2023, 0, 15),
    progress: 80,
    color: '#2196F3',
    dependencies: ['1'],
  },
  {
    id: '3',
    name: '设计阶段',
    start: new Date(2023, 0, 12),
    end: new Date(2023, 0, 25),
    progress: 60,
    color: '#FF9800',
    dependencies: ['2'],
  },
  {
    id: '4',
    name: '开发实施',
    start: new Date(2023, 0, 20),
    end: new Date(2023, 1, 10),
    progress: 30,
    color: '#F44336',
    dependencies: ['3'],
  },
])

const ganttContainer = ref<HTMLDivElement | null>(null)
const stageContainer = ref<HTMLDivElement | null>(null)
const timelineContainer = ref<HTMLDivElement | null>(null)

// Vue-Konva refs
const timelineStageRef = ref<any>(null)
const timelineLayerRef = ref<any>(null)
const stageRef = ref<any>(null)
const layerRef = ref<any>(null)

// 时间刻度状态
const timeScale = ref<TimeScale>('day')
// 缩放因子
const zoomFactor = ref<number>(1)
// 容器尺寸
const containerWidth = ref<number>(0)
const containerHeight = ref<number>(0)
// 左侧留白宽度
const LEFT_PADDING = 150

// 拖拽状态
const dragState = reactive({
  index: -1,
  startX: 0,
  initialStart: 0,
  initialEnd: 0,
})

// 计算时间范围
const getTimeRange = () => {
  const starts = tasks.value.map((task) => task.start.getTime())
  const ends = tasks.value.map((task) => task.end.getTime())
  // 添加一些边距
  const min = Math.min(...starts)
  const max = Math.max(...ends)
  const range = max - min
  return {
    min: min - range * 0.1,
    max: max + range * 0.1,
  }
}

// 根据时间刻度获取时间单位毫秒数
const getTimeUnitMs = () => {
  switch (timeScale.value) {
    case 'hour':
      return 60 * 60 * 1000
    case 'day':
      return 24 * 60 * 60 * 1000
    case 'week':
      return 7 * 24 * 60 * 60 * 1000
    case 'month':
      return 30 * 24 * 60 * 60 * 1000
    default:
      return 24 * 60 * 60 * 1000
  }
}

// 将日期转换为X坐标
const dateToX = (date: Date, timeRange: { min: number; max: number }, width: number) => {
  const totalTime = (timeRange.max - timeRange.min) / zoomFactor.value
  const timeOffset = date.getTime() - timeRange.min
  return (timeOffset / totalTime) * width
}

// 将X坐标转换为日期
const xToDate = (x: number, timeRange: { min: number; max: number }, width: number) => {
  const totalTime = (timeRange.max - timeRange.min) / zoomFactor.value
  const timeOffset = (x / width) * totalTime
  return new Date(timeRange.min + timeOffset)
}

// 将任务索引转换为Y坐标
const taskToY = (index: number, rowHeight: number) => {
  return index * rowHeight
}

// 生成时间刻度标记
const generateTimeTicks = (timeRange: { min: number; max: number }) => {
  const ticks = []
  const unitMs = getTimeUnitMs()
  let currentTime = Math.floor(timeRange.min / unitMs) * unitMs

  while (currentTime <= timeRange.max) {
    ticks.push(new Date(currentTime))
    currentTime += unitMs
  }

  return ticks
}

// 获取时间标签格式
const getTimeLabel = (tick: Date): string => {
  switch (timeScale.value) {
    case 'hour':
      return `${tick.getMonth() + 1}/${tick.getDate()} ${tick.getHours()}:00`
    case 'day':
      return `${tick.getMonth() + 1}-${tick.getDate()}`
    case 'week':
      return `W${Math.ceil(tick.getDate() / 7)}`
    case 'month':
      return `${tick.getFullYear()}-${tick.getMonth() + 1}`
    default:
      return `${tick.getMonth() + 1}-${tick.getDate()}`
  }
}

// 时间轴线条计算
const timelineLines = computed(() => {
  if (!ganttContainer.value) return []

  const lines: any = []
  const timeRange = getTimeRange()
  const ticks = generateTimeTicks(timeRange)
  const leftPadding = 150

  ticks.forEach((tick) => {
    const x = dateToX(tick, timeRange, containerWidth.value - leftPadding) + leftPadding

    lines.push({
      points: [x, 0, x, 40],
      stroke: '#ccc',
      strokeWidth: 1,
    })
  })

  return lines
})

// 时间轴标签计算
const timelineLabels = computed(() => {
  if (!ganttContainer.value) return []

  const labels: any = []
  const timeRange = getTimeRange()
  const ticks = generateTimeTicks(timeRange)
  const leftPadding = 150

  ticks.forEach((tick) => {
    const x = dateToX(tick, timeRange, containerWidth.value - leftPadding) + leftPadding
    const timeLabel = getTimeLabel(tick)

    labels.push({
      x: x + 5,
      y: 15,
      text: timeLabel,
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#333',
    })
  })

  return labels
})

// 网格线计算
const gridLines = computed(() => {
  if (!ganttContainer.value) return []

  const lines: any = []
  const timeRange = getTimeRange()
  const ticks = generateTimeTicks(timeRange)
  const leftPadding = 150
  const rowHeight = 50

  // 垂直网格线
  ticks.forEach((tick) => {
    const x = dateToX(tick, timeRange, containerWidth.value - leftPadding) + leftPadding
    lines.push({
      points: [x, 50, x, containerHeight.value],
      stroke: '#eee',
      strokeWidth: 1,
    })
  })

  // 水平网格线
  tasks.value.forEach((_, index) => {
    const y = taskToY(index, rowHeight) + 50 + rowHeight
    lines.push({
      points: [leftPadding, y, containerWidth.value, y],
      stroke: '#eee',
      strokeWidth: 1,
    })
  })

  return lines
})

// 今日线计算
const todayLine = computed(() => {
  const timeRange = getTimeRange()
  const leftPadding = 150
  const today = new Date()

  // 只在时间范围内绘制今日线
  if (today.getTime() >= timeRange.min && today.getTime() <= timeRange.max) {
    const x = dateToX(today, timeRange, containerWidth.value - leftPadding) + leftPadding

    return {
      points: [x, 50, x, 1000],
      stroke: '#ff0000',
      strokeWidth: 2,
      dash: [5, 5],
    }
  }

  return {}
})

// 今日标签计算
const todayLabel = computed(() => {
  const timeRange = getTimeRange()
  const leftPadding = 150
  const today = new Date()

  // 只在时间范围内绘制今日线
  if (today.getTime() >= timeRange.min && today.getTime() <= timeRange.max) {
    const x = dateToX(today, timeRange, containerWidth.value - leftPadding) + leftPadding

    return {
      x: x + 5,
      y: 55,
      text: '今天',
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#ff0000',
    }
  }

  return {}
})

// 依赖关系计算
const dependencies = computed(() => {
  const deps: any = []
  const timeRange = getTimeRange()
  const leftPadding = 150
  const rowHeight = 50

  tasks.value.forEach((task) => {
    if (task.dependencies && task.dependencies.length > 0) {
      task.dependencies.forEach((depId) => {
        const depTask = tasks.value.find((t) => t.id === depId)
        if (depTask) {
          const fromIndex = tasks.value.findIndex((t) => t.id === depId)
          const toIndex = tasks.value.findIndex((t) => t.id === task.id)

          if (fromIndex !== -1 && toIndex !== -1) {
            const fromY = taskToY(fromIndex, rowHeight) + 50 + 15
            const toY = taskToY(toIndex, rowHeight) + 50 + 15
            const fromX =
              dateToX(depTask.end, timeRange, containerWidth.value - leftPadding) + leftPadding
            const toX =
              dateToX(task.start, timeRange, containerWidth.value - leftPadding) + leftPadding

            deps.push({
              line: {
                points: [fromX, fromY, toX, fromY, toX, toY],
                stroke: '#666',
                strokeWidth: 1,
                tension: 0,
                dash: [3, 3],
              },
              arrow: {
                points: [toX - 5, toY - 5, toX, toY, toX - 5, toY + 5],
                stroke: '#666',
                strokeWidth: 1,
                fill: '#666',
              },
            })
          }
        }
      })
    }
  })

  return deps
})

// 任务项计算
const taskItems = computed(() => {
  const items: any = []
  const timeRange = getTimeRange()
  const rowHeight = 50
  const barHeight = 30
  const leftPadding = LEFT_PADDING
  const handleSize = 6

  tasks.value.forEach((task, index) => {
    const y = taskToY(index, rowHeight) + 50
    const startX = dateToX(task.start, timeRange, containerWidth.value - leftPadding) + leftPadding
    const endX = dateToX(task.end, timeRange, containerWidth.value - leftPadding) + leftPadding
    const barWidth = endX - startX

    items.push({
      background: {
        x: startX,
        y: y,
        width: barWidth,
        height: barHeight,
        fill: '#f0f0f0',
        cornerRadius: 4,
        stroke: '#ccc',
        strokeWidth: 1,
        draggable: true,
        // 锁定 Y，限制 X 范围
        dragBoundFunc: (pos: { x: number; y: number }) => {
          const minX = leftPadding
          const maxX = Math.max(leftPadding, containerWidth.value - barWidth)
          let nx = pos.x
          if (nx < minX) nx = minX
          if (nx > maxX) nx = maxX
          return { x: nx, y }
        },
        cursor: 'pointer',
      },
      progress: {
        x: startX,
        y: y,
        width: barWidth * (task.progress / 100),
        height: barHeight,
        fill: task.color,
        cornerRadius: 4,
      },
      label: {
        x: 10,
        y: y + 8,
        text: task.name,
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#333',
      },
      progressText: {
        x: startX + barWidth + 5,
        y: y + 8,
        text: `${task.progress}%`,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: '#666',
      },
      leftHandle: {
        x: startX - handleSize / 2,
        y: y + (barHeight - handleSize) / 2,
        width: handleSize,
        height: handleSize,
        fill: '#666',
        stroke: '#fff',
        strokeWidth: 1,
        draggable: true,
        cursor: 'ew-resize',
        dragBoundFunc: (pos: { x: number; y: number }) => {
          const minX = leftPadding
          const maxX = startX + barWidth - Math.max(8, handleSize)
          let nx = pos.x
          if (nx < minX) nx = minX
          if (nx > maxX) nx = maxX
          return { x: nx, y: y + (barHeight - handleSize) / 2 }
        },
      },
      rightHandle: {
        x: startX + barWidth - handleSize / 2,
        y: y + (barHeight - handleSize) / 2,
        width: handleSize,
        height: handleSize,
        fill: '#666',
        stroke: '#fff',
        strokeWidth: 1,
        draggable: true,
        cursor: 'ew-resize',
        dragBoundFunc: (pos: { x: number; y: number }) => {
          const minX = startX + Math.max(8, handleSize)
          const maxX = Math.max(leftPadding, containerWidth.value)
          let nx = pos.x
          if (nx < minX) nx = minX
          if (nx > maxX) nx = maxX
          return { x: nx, y: y + (barHeight - handleSize) / 2 }
        },
      },
    })
  })

  return items
})

// 拖拽事件处理
const onDragStart = (index: number, e: any) => {
  const node = e.target
  const t = tasks.value[index]
  if (!t) return
  dragState.index = index
  dragState.startX = node.x()
  dragState.initialStart = t.start.getTime()
  dragState.initialEnd = t.end.getTime()
}

const onDragMove = (index: number, e: any) => {
  const node = e.target
  const dx = node.x() - dragState.startX
  const availableWidth = Math.max(1, containerWidth.value - LEFT_PADDING)
  const totalTime = (getTimeRange().max - getTimeRange().min) / zoomFactor.value
  const timeDelta = (dx / availableWidth) * totalTime

  const newStart = new Date(dragState.initialStart + timeDelta)
  const newEnd = new Date(dragState.initialEnd + timeDelta)
  const t = tasks.value[index]
  if (!t) return
  t.start = newStart
  t.end = newEnd
}

const onDragEnd = (index: number, e: any) => {
  dragState.index = -1
}

// 左手柄（调整开始时间）
const onLeftHandleDragStart = (index: number, e: any) => {
  const node = e.target
  const t = tasks.value[index]
  if (!t) return
  dragState.index = index
  dragState.startX = node.x()
  dragState.initialStart = t.start.getTime()
  dragState.initialEnd = t.end.getTime()
}

const onLeftHandleDragMove = (index: number, e: any) => {
  const node = e.target
  const handleSize = 6
  const centerX = node.x() + handleSize / 2
  const availableWidth = Math.max(1, containerWidth.value - LEFT_PADDING)
  const relX = Math.max(0, Math.min(availableWidth, centerX - LEFT_PADDING))
  const newStart = xToDate(relX, getTimeRange(), availableWidth)
  const t = tasks.value[index]
  if (!t) return
  const minMs = 60 * 60 * 1000 // 最小 1 小时
  if (newStart.getTime() >= t.end.getTime() - minMs) {
    t.start = new Date(t.end.getTime() - minMs)
  } else {
    t.start = newStart
  }
}

const onLeftHandleDragEnd = (index: number, e: any) => {
  dragState.index = -1
}

// 右手柄（调整结束时间）
const onRightHandleDragStart = (index: number, e: any) => {
  const node = e.target
  const t = tasks.value[index]
  if (!t) return
  dragState.index = index
  dragState.startX = node.x()
  dragState.initialStart = t.start.getTime()
  dragState.initialEnd = t.end.getTime()
}

const onRightHandleDragMove = (index: number, e: any) => {
  const node = e.target
  const handleSize = 6
  const centerX = node.x() + handleSize / 2
  const availableWidth = Math.max(1, containerWidth.value - LEFT_PADDING)
  const relX = Math.max(0, Math.min(availableWidth, centerX - LEFT_PADDING))
  const newEnd = xToDate(relX, getTimeRange(), availableWidth)
  const t = tasks.value[index]
  if (!t) return
  const minMs = 60 * 60 * 1000 // 最小 1 小时
  if (newEnd.getTime() <= t.start.getTime() + minMs) {
    t.end = new Date(t.start.getTime() + minMs)
  } else {
    t.end = newEnd
  }
}

const onRightHandleDragEnd = (index: number, e: any) => {
  dragState.index = -1
}

// 更新容器尺寸
const updateContainerSize = () => {
  if (ganttContainer.value) {
    containerWidth.value = ganttContainer.value.clientWidth
    containerHeight.value = Math.max(300, tasks.value.length * 60)
  }
}

// 重绘甘特图
const redrawGantt = () => {
  updateContainerSize()
}

// 窗口大小改变时重绘
const handleResize = () => {
  redrawGantt()
}

// 处理滚轮事件
const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  // 可以添加滚动缩放逻辑
}

// 放大
const zoomIn = () => {
  zoomFactor.value = Math.min(zoomFactor.value * 1.2, 5)
  redrawGantt()
}

// 缩小
const zoomOut = () => {
  zoomFactor.value = Math.max(zoomFactor.value / 1.2, 0.2)
  redrawGantt()
}

// 监听时间刻度变化
watch(timeScale, () => {
  redrawGantt()
})

onMounted(() => {
  console.log('Gantt chart mounted')
  updateContainerSize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.gantt-container {
  width: 100%;
  height: 100%;
  border: 1px solid #ddd;
  overflow: auto;
}

.toolbar {
  padding: 10px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  display: flex;
  gap: 10px;
  align-items: center;
}

.toolbar button {
  padding: 5px 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.toolbar button:hover {
  background-color: #0056b3;
}

.timeline-container {
  width: 100%;
  height: 50px;
  border-bottom: 1px solid #ddd;
}

.stage-container {
  width: 100%;
  height: calc(100% - 50px);
}
</style>
