<script setup lang="ts">
import CellInput from "../components/CellInput.vue";
import { ref, useTemplateRef, onMounted } from "vue";

import * as bidi from "bidicalc-engine";

const log = ref("");
function clear() {
    log.value = "";
}
function onUpdate(str: string) {
    log.value = `'${str}'`;
}

const c1 = useTemplateRef("c1");
const c2 = useTemplateRef("c2");
const c3 = useTemplateRef("c3");
const c4 = useTemplateRef("c4");
const c5 = useTemplateRef("c5");
const c6 = useTemplateRef("c6");
const c7 = useTemplateRef("c7");
const c8 = useTemplateRef("c8");

// If I wanted to support truly settting the initial cell value in cell input
// I would need to give it as a prop, using JSON serialization for example. Yuck.

onMounted(() => {
    c1.value?.setCell(bidi.Cell.EmptyClean());
    c2.value?.setCell(bidi.Cell.TextClean("label:"));
    c3.value?.setCell(bidi.Cell.VariableClean(5.5));
    c4.value?.setCell(bidi.Cell.ConstantClean(5.5));

    const syntaxError = bidi.constructTfModel("=)");
    syntaxError.mapErr((err) => {
        c7.value?.setCell(bidi.Cell.ErrorClean(err, "=)", []));
    });

    c8.value?.setCell(bidi.Cell.ErrorClean(new bidi.InvalidRef("zul"), "zul+1", []));
});
</script>

<template>
    <p style="font-family: monospace">Last update received: {{ log }}</p>
    <button @click="clear">clear log</button>

    <div class="wrapper">
        <div class="group">
            <CellInput @update="onUpdate" ref="c1" />
            <CellInput @update="onUpdate" ref="c2" />
            <CellInput @update="onUpdate" ref="c3" />
            <CellInput @update="onUpdate" ref="c4" />
            <CellInput @update="onUpdate" ref="c5" />
            <CellInput @update="onUpdate" ref="c6" />
            <CellInput @update="onUpdate" ref="c7" />
            <CellInput @update="onUpdate" ref="c8" />
        </div>
    </div>
</template>

<style scoped>
.wrapper {
    display: flex;
}

.group {
    padding: 5px;
    background-color: #ccc;
    display: flex;
    gap: 5px;
    flex-direction: column;
    --cell-width: 200px;
    --cell-height: 30px;
}
</style>
