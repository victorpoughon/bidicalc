<script setup lang="ts">
import "./typography.css";

const model = defineModel<string[]>({ required: true });
</script>
<template>
    <div class="header-col font-mono">
        <div class="topleft"><span class="logo">⇆</span><span class="bidicalc">BIDICALC</span></div>
        <div class="header-col-entry" v-for="label in model" :key="label">{{ label }}</div>
    </div>
</template>

<style scoped>
.topleft {
    width: var(--cell-width);
    height: var(--cell-height);
    text-align: center;
    font-weight: normal;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--color-grey-100);
    color: black;
    border: none;
    outline: none;
    /* outline: 2px solid black; */
    z-index: 1;
}

.topleft .logo {
    font-size: 1.5rem;
    margin: 0.2rem;
    font-weight: normal;
}

.topleft .bidicalc {
    font-size: 0.8rem;
    margin: 0.2rem;
    font-weight: bold;
}

.header-col {
    display: flex;
    gap: 1px;
    padding-left: 1px;
    padding-top: 1px;
    padding-bottom: 1px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: var(--color-gray-200);
}
.header-col div {
    width: var(--cell-width);
    height: var(--cell-height);
    text-align: center;
    font-weight: bold;
    display: flex;
    justify-content: center;
    align-items: center;
}

.header-col .header-col-entry {
    background-color: var(--color-gray-50);
}
</style>
