<template>
  <div class="container">
    <div>
      <h1 class="title">
        web-console
      </h1>
      <h2 class="subtitle">
        A web console to manage your computer remotely, tailored for Raspberry Pi devices
      </h2>
      <VueTerminal/>
    </div>
  </div>
</template>

<script lang="ts">
import VueTerminal from '~/components/VueTerminal.vue'

export default {
  components: {
    VueTerminal,
  }
}
</script>

<style>
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 80px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 30px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
