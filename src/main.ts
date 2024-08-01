import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/main.css'; 
import 'leaflet/dist/leaflet.css';

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
