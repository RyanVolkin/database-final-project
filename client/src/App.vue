<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DistrictPage from './components/District.vue'
import SchoolPage from './components/School.vue'
import HighSchoolPage from './components/HighSchool.vue'
import { getDistrict, getSchools } from './services/api'

// use numeric keys for the tabs
const tab = ref(0)
const district = ref([
  { id: 1, name: 'District A', score: 85 },
  { id: 2, name: 'District B', score: 90 },
  { id: 3, name: 'District C', score: 78 },
])
const school = ref([
  { id: 1, name: 'School A', score: 0 },
  { id: 2, name: 'School B', score: 100 },
  { id: 3, name: 'School C', score: 50 },
  { id: 4, name: 'School D', score: 82 },
])
const items = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    const districtRes = await getDistrict()
    const schoolRes = await getSchools()
    if (!districtRes.ok) throw new Error(`HTTP ${districtRes.status}`)
    if (!schoolRes.ok) throw new Error(`HTTP ${schoolRes.status}`)
    district.value = await districtRes.json()
    school.value = await schoolRes.json()
    console.log(school.value)
  console.log(district.value)
  } catch (err: any) {
    console.error(err)
    error.value = err.message || String(err)
  } finally {
    loading.value = false
  }
})
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
            <SchoolPage :items="school"/>
          </v-tabs-window-item>
          <v-tabs-window-item :value="2">
            <DistrictPage :items="district"/>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>

</style>
