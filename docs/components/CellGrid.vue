<script setup lang="ts">
import { ref, Ref, reactive, useTemplateRef, inject, nextTick } from "vue";
import HeaderRow from "./HeaderRow.vue";
import HeaderCol from "./HeaderCol.vue";
import CellInput from "./CellInput.vue";
import Tooltip from "../components/Tooltip.vue";

import { CellGridInjectionKey } from "./cellGridProps.ts";

import * as bidi from "bidicalc-engine";

/* INTERNAL STATE */

let gridIndexing: bidi.GridIndexing | null = null;
const nrows = ref(0);
const ncols = ref(0);
const indexingEntries = reactive([] as bidi.GridIterator[]);
const colLabels: Ref<string[]> = ref([]);
const rowLabels: Ref<string[]> = ref([]);

/* TYPES, EXPOSED METHODS AND EMITS */

const props = defineProps<{
    cellWidth: number;
    cellHeight: number;
}>();

const tooltip = useTemplateRef("tooltip");
const itemRefs = ref<(InstanceType<typeof CellInput> | null)[]>([]);
const cellsProvider = inject(CellGridInjectionKey);

const emit = defineEmits<{
    update: [ref: string, content: string];
    updateForwardOnly: [ref: string, content: string];
}>();

/* INTERNAL FUNCTIONS */

// workaround https://github.com/vuejs/core/issues/5525
const setCellInputRef = (instance: InstanceType<typeof CellInput> | null, index: number) => {
    itemRefs.value[index] = instance;
};

function setCell(ref: string, cleanCell: bidi.CleanCell) {
    if (gridIndexing === null) {
        console.warn("cellgrid: setCell called but indexing is nul");
        return;
    }

    const cellInput = getCellInput(ref);
    if (cellInput === null) {
        console.warn("missing cellinput for ref", ref);
        return;
    }

    cellInput.setCell(cleanCell);
}

function setCells(cells: bidi.CellMap) {
    cells.forEach(setCell);
}

async function setGrid(indexing: bidi.GridIndexing, cells: bidi.CellMap) {
    nrows.value = indexing.nrows();
    ncols.value = indexing.ncols();
    // use reactive array directly (no .value)
    indexingEntries.length = 0;
    indexingEntries.push(...indexing.allEntries());
    colLabels.value = indexing.cols;
    rowLabels.value = indexing.rows;
    gridIndexing = indexing;

    // ensure the refs array has the expected length so indices align with rendered CellInput components
    const total = nrows.value * ncols.value;
    itemRefs.value.length = total;
    for (let i = 0; i < total; i++) itemRefs.value[i] = itemRefs.value[i] ?? null;

    // wait for DOM/update so v-for ref callbacks run and populate itemRefs
    await nextTick();

    setCells(cells);
}

defineExpose({
    setGrid,
    setCells,
});

function update(ref: string, content: string) {
    emit("update", ref, content);
}

function updateForwardOnly(ref: string, content: string) {
    emit("updateForwardOnly", ref, content);
}

function getCellInput(ref: string): InstanceType<typeof CellInput> | null {
    if (gridIndexing === null) return null;

    const it = gridIndexing.byRef(ref);
    if (it === null) {
        console.error("Got null grid iterator for ref", ref);
        return null;
    }
    const cell = itemRefs.value[it.index];
    return cell ?? null;
}

function onMouseEnter(ref: string, target: HTMLElement) {
    if (gridIndexing === null) return;

    // Don't show tooltip if the cell is being edited
    const cellInput = getCellInput(ref);
    if (!cellInput || cellInput.hasFocus()) return;

    showTooltip(ref, target);
}

function showTooltip(ref: string, target: HTMLElement) {
    if (cellsProvider === undefined) return;
    const hoveredCell = cellsProvider.get(ref);
    tooltip.value?.show(target, hoveredCell);
}

function hideTooltip() {
    tooltip.value?.hide();
}

function onHotKey(ref: string, ev: string) {
    if (gridIndexing === null) return;

    let next: null | bidi.GridIterator = null;

    if (["keyEnter", "keyCtrlDown"].includes(ev)) next = gridIndexing.navDown(ref);
    if (["keyShiftEnter", "keyCtrlUp"].includes(ev)) next = gridIndexing.navUp(ref);
    if (["keyTab", "keyCtrlRight"].includes(ev)) next = gridIndexing.navRight(ref);
    if (["keyShiftTab", "keyCtrlLeft"].includes(ev)) next = gridIndexing.navLeft(ref);

    if (next === null) return;
    const cellInput = itemRefs.value![next.index]!;
    cellInput.setFocus();
}
</script>

<template>
    <div
        class="cell-grid"
        :style="{
            '--nrows': nrows,
            '--ncols': ncols,
            '--cell-width': props.cellWidth + 'px',
            '--cell-height': props.cellHeight + 'px',
        }"
    >
        <HeaderCol v-model="rowLabels" />
        <div class="cell-grid-mid">
            <HeaderRow v-model="colLabels" />
            <div class="cell-grid-inner">
                <CellInput
                    v-for="item in indexingEntries"
                    :ref="(el) => setCellInputRef(el as InstanceType<typeof CellInput>, item.index)"
                    @update="
                        (content: string) => {
                            update(item.ref, content);
                        }
                    "
                    @updateForwardOnly="
                        (content: string) => {
                            updateForwardOnly(item.ref, content);
                        }
                    "
                    :key="item.index"
                    :class="{
                        'last-col': item.isLastCol,
                        'last-row': item.isLastRow,
                    }"
                    @mouseenter="onMouseEnter(item.ref, $event.target)"
                    @mouseleave="hideTooltip"
                    @focus="hideTooltip"
                    @hotkey="(ev) => onHotKey(item.ref, ev)"
                />
            </div>
        </div>
        <Tooltip ref="tooltip" />
    </div>
</template>

<style scoped>
.cell-grid {
    display: flex;
}

.cell-grid-inner {
    display: grid;
    justify-content: center;
    align-content: center;
    gap: 1px;
    padding: 1px;
    background-color: var(--color-gray-400);
    grid-template-columns: repeat(var(--ncols), var(--cell-width));
}
</style>
