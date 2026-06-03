import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// global styles
import './style.css'

// base components
import BaseButton from './components/common/BaseButton.vue'
import BaseCard from './components/common/BaseCard.vue'
import BaseInput from './components/common/BaseInput.vue'
import BaseSelect from './components/common/BaseSelect.vue'

const app = createApp(App)

app.component('BaseButton', BaseButton)
app.component('BaseCard', BaseCard)
app.component('BaseInput', BaseInput)
app.component('BaseSelect', BaseSelect)

app.use(router)
app.mount('#app')
