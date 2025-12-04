<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DistrictPage from './components/District.vue'
import SchoolPage from './components/School.vue'
import HighSchoolPage from './components/HighSchool.vue'
// use numeric keys for the tabs
const tab = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)
</script>

<template>

  <v-app id="app">
    <v-main>
      <!--page selector-->
      <v-container fluid>
        <!--TOP BANNER BAR-->
        <v-app-bar :elevation="2">
          <v-app-bar-title>Ohio School Metrics</v-app-bar-title>
        </v-app-bar>
        <!--PAGE SELECTOR-->
        <v-tabs color="primary" v-model="tab">
          <v-tab :value="0">College Readness</v-tab>
          <v-tab :value="1">School</v-tab>
          <v-tab :value="2">District</v-tab>
        </v-tabs>
        <v-tabs-window v-model="tab">
          <v-tabs-window-item :value="0">
            <HighSchoolPage />
          </v-tabs-window-item>
          <v-tabs-window-item :value="1">
            <SchoolPage/>
          </v-tabs-window-item>
          <v-tabs-window-item :value="2">
            <DistrictPage/>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>

</style>
