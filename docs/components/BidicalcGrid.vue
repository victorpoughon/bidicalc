<script setup lang="ts">
import { ref, shallowReactive, useTemplateRef, provide, onMounted } from "vue";

import "./colors.css";
import CellGrid from "./CellGrid.vue";

import { CellGridInjectionKey } from "./cellGridProps.ts";

import * as bidi from "bidicalc-engine";
import { examples } from "./examples.ts";

/* INTERNAL STATE */

let [gridIndexing, mutableGridState]: [bidi.GridIndexing, bidi.MutableCellMap] = examples[0].fn();

const cellWidth = ref(120);
const cellHeight = ref(30);

onMounted(() => {
    // Initial render from example init data
    cellGrid.value?.setGrid(gridIndexing, mutableGridState);
});

// Provide a cell getter to child components
provide(CellGridInjectionKey, {
    get: (ref: string) => mutableGridState.get(ref),
    allRefs: () => mutableGridState.keys(),
    indexing: () => gridIndexing,
});

/* TYPES, EXPOSED METHODS AND EMITS */

const cellGrid = useTemplateRef("cell-grid");

function onSelectExample(ev: Event) {
    const select = ev.target as HTMLSelectElement;
    const value = select.value;
    const index = select.selectedIndex;

    [gridIndexing, mutableGridState] = examples[index].fn();

    cellGrid.value?.setGrid(gridIndexing, mutableGridState);
}

function onUpdate(ref: string, content: string, mode: bidi.ResolutionMode) {
    if (!mutableGridState.has(ref)) {
        console.error("forward grid onUpdate got invalid ref", ref);
        return;
    }

    const updated = bidi.resolveGraph(mutableGridState, ref, content, mode);

    // update mutable storage
    mutableGridState.update(updated);

    // render changed cells
    cellGrid.value?.setCells(updated);
}

function onClear() {
    mutableGridState.update(bidi.CellMap.empty(mutableGridState.keys()));
    cellGrid.value?.setCells(mutableGridState);
}
</script>

<template>
    <div class="bidicalc-widget">
        <div class="bidicalc">
            <CellGrid
                ref="cell-grid"
                :cellWidth="cellWidth"
                :cellHeight="cellHeight"
                @update="(ref, content) => onUpdate(ref, content, 'Bidirectional')"
                @updateForwardOnly="(ref, content) => onUpdate(ref, content, 'ForwardOnly')"
            />
        </div>
    </div>
    <div class="toolbar">
        <div class="examples-select">
            <label for="examples-select-element">Load example:&nbsp;</label>
            <select name="pets" id="examples-select-element" @change="onSelectExample">
                <option v-for="(o, index) in examples" :key="index" :value="index.toString()">
                    {{ o.name }}
                </option>
            </select>
        </div>
        <button @click="onClear">Clear</button>
    </div>
</template>

<style scoped>
.toolbar {
    /* background-color: var(--color-gray-100); */
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    width: 80%;
    margin: 1rem auto;
}

select {
    /* undo stuff inherited from vitepress style */
    -webkit-appearance: auto;
    outline: none;
    border: 1px solid black;
    padding: 0.25rem;
}

button {
    background-color: var(--color-gray-900);
    color: white;
    padding: 0 0.5rem;
    height: 30px;
    border-radius: 5px;
}

button:hover {
    background-color: var(--color-gray-700);
}

button:active {
    background-color: var(--color-gray-500);
}

.bidicalc-widget {
    display: flex;
    flex-direction: row;
    justify-content: center;
}

.bidicalc {
    /* margin: 0 auto; */
    display: inline-block;
    /* box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 2px 6px 2px; */
    box-shadow: rgba(67, 71, 85, 0.27) 0px 0px 0.25em, rgba(90, 125, 188, 0.05) 0px 0.25em 1em;
}
</style>
