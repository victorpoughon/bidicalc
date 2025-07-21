<script setup lang="ts">
const model = defineModel<string[]>({ required: true });
</script>

<template>
    <div class="header-row font-mono">
        <div class="header-row-entry" v-for="label in model" :key="label">
            {{ label }}
        </div>
    </div>
</template>

<style scoped>
.header-row {
    display: flex;
    gap: 1px;
    padding-left: 1px;
    padding-top: 1px;
    padding-right: 1px;
    background-color: var(--color-gray-200);
}

.header-row-entry {
    width: var(--cell-width);
    height: var(--cell-height);
    background-color: var(--color-gray-50);
    text-align: center;
    font-weight: bold;
    border: none;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
