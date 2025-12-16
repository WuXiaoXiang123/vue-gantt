import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import VueKonva from 'vue-konva'
import 'jordium-gantt-vue3/dist/assets/jordium-gantt-vue3.css'
import ganttastic from '@infectoone/vue-ganttastic'
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueKonva)
app.use(ganttastic)

app.mount('#app')
