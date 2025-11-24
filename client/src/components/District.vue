<script setup lang="ts">
defineProps<{
    items: Array;
}>()
</script>

<template>
  <v-table class="rounded-lg border elevation-1 ">
    <thead>
      <tr>
        <th class="text-left">
            Name
        </th>
        <th class="text-left">
            Score
        </th>
      </tr>
    </thead>
        <tbody>
            <tr>
                <td>
                    test
                </td>
                <td>
                    test
                </td>
            </tr>
                
        </tbody>
    </v-table>
</template>

<style scoped>

</style>
