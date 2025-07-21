<script setup lang="ts">
import SoloCell from "./SoloCell.vue";

import { ref, useTemplateRef } from "vue";
import * as bidi from "bidicalc-engine";

const el1 = useTemplateRef("el1");
const el2 = useTemplateRef("el2");
const el3 = useTemplateRef("el3");
const processElements = [el1, el2, el3];

const statusBar = ref("");

function onHover(id: number) {
    const cell = processElements[id].value?.getCell();

    if (cell) {
        statusBar.value = cell.kind;
    } else {
        statusBar.value = "<no cell>";
    }
}

function onLeave() {
    statusBar.value = "";
}
</script>

<template>
    <SoloCell ref="el1" @mouseenter="onHover(0)" @mouseleave="onLeave()" />
    <SoloCell ref="el2" @mouseenter="onHover(1)" @mouseleave="onLeave()" />
    <SoloCell ref="el3" @mouseenter="onHover(2)" @mouseleave="onLeave()" />
    <div class="status-bar">{{ statusBar }}</div>
</template>

<style scoped>
input {
    display: block;
    margin: 4px;
}
.status-bar {
    width: 300px;
    height: 2rem;
    background-color: lightgrey;
}
</style>
