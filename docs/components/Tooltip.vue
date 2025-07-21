<script setup lang="ts">
import BidicalcTooltip from "./BidicalcTooltip.vue";
import { ref, useTemplateRef } from "vue";
import * as bidi from "bidicalc-engine";

const tooltip = useTemplateRef("bidicalc-tooltip");
const tooltipClass = ref("");
const tooltipTitle = ref("");
const tooltipHTMLContent = ref("");

function noSolutionDescription(cell: bidi.NoSolutionCellClean): string {
    let s = '';
    s += `Unable to solve:<br>`
    s += `${cell.expression} = ${cell.goal}<br>`;
    s += '<br>';
    const refs = cell.composedModel.refs.singles;

    if (refs.length === 0) {
        s += "No leaf variables to update."
    }
    else {
        s += `With leaf variables:<br>`;
        s += `${cell.composedModel.refs.singles}`;
    }
    return s;
}

defineExpose({
    show(element: HTMLElement, cell: bidi.CleanCell) {
        tooltipClass.value = cell.kind.toLowerCase();

        if (cell.kind === "Error") {
            tooltipTitle.value = cell.error.title();
            tooltipHTMLContent.value = cell.error.long();
        } else if (cell.kind === "Solution") {
            tooltipTitle.value = "";
            tooltipHTMLContent.value = cell.expression;
        } else if (cell.kind === "NoSolution") {
            tooltipTitle.value = "No solution";
            tooltipHTMLContent.value = noSolutionDescription(cell);
        } else {
            return;
        }

        tooltip.value?.show(element, "right");
    },
    hide() {
        tooltip.value?.hide();
    },
});


</script>

<template>
    <BidicalcTooltip ref="bidicalc-tooltip">
        <div class="bidicalc-tooltip" :class="tooltipClass">
            <span v-show="tooltipTitle.length > 0" class="bidicalc-tooltip-title">{{ tooltipTitle }}</span>
            <span class="tooltip-content" v-html="tooltipHTMLContent"></span>
        </div>
    </BidicalcTooltip>
</template>

<style scoped>
.bidicalc-tooltip {
    color: white;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    border-radius: 6px;
    background-color: var(--color-gray-900);
    box-shadow:
        rgba(0, 0, 0, 0.16) 0px 3px 6px,
        rgba(0, 0, 0, 0.23) 0px 3px 6px;

    padding: 10px;
}

.bidicalc-tooltip .bidicalc-tooltip-title {
    padding: 8px 16px;
    margin-bottom: 8px;
    font-size: 1.1rem;
    display: block;
    width: 100%;
    color: white;
    font-weight: bold;
    text-align: center;
    border-radius: 6px;
}

.bidicalc-tooltip .tooltip-content {
    margin: 6px 6px;
}

.bidicalc-tooltip.error, .bidicalc-tooltip.nosolution {
    width: 230px;
}

.bidicalc-tooltip.solution {
    font-weight: bold;
}

.bidicalc-tooltip.error .bidicalc-tooltip-title {
    background-color: var(--color-red-700);
    color: white;
}

.bidicalc-tooltip.nosolution .bidicalc-tooltip-title {
    background-color: var(--color-yellow-300);
    color: black;
}

</style>
