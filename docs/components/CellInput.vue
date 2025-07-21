<!--
    This component manages the HTML <input /> element
    of a single cell.
-->

<script setup lang="ts">
import { useTemplateRef, ref, watch, onMounted } from "vue";

import * as bidi from "bidicalc-engine";
import "./colors.css";

/* INTERNAL STATE */

// The bidicalc cell stored by this cell input component instance
let currentState: bidi.CleanCell = bidi.Cell.EmptyClean();

// Used to implement ESC key restoring previous state without emitting an update
let bluringBecauseOfEscapeKey: boolean = false;

// Used to track if any change to the content happened since we got focus
let lastFocusValue: string = "";

// True when focus is 'secondary', meaning the user clicked on the F icon and not on the cell input
const focusSecondary = ref(false);

// HTML input element
const inputElement = useTemplateRef("input-element");

// Input text content and class
const inputText = defineModel({ type: String, default: "" });
const inputClass = ref("");

/* TYPES, EXPOSED METHODS AND EMITS */

type HotKeyEvent =
    | "keyEnter"
    | "keyShiftEnter"
    | "keyTab"
    | "keyShiftTab"
    | "keyCtrlUp"
    | "keyCtrlDown"
    | "keyCtrlLeft"
    | "keyCtrlRight";

const emit = defineEmits<{
    (e: "hotkey", evt: HotKeyEvent): void;
    (e: "update", value: string): void;
    (e: "updateForwardOnly", value: string): void;
    (e: "focus"): void;
    (e: "blur"): void;
}>();

defineExpose({
    hasFocus(): boolean {
        return inputElement.value === document.activeElement;
    },
    setFocus() {
        // Manually set to focus state
        inputElement.value?.focus();
    },
    setCell(cleanCell: bidi.CleanCell) {
        currentState = cleanCell;
        renderBlur(currentState);
    },
});

/* INTERNAL FUNCTIONS */

function renderBlur(cleanCell: bidi.CleanCell) {
    const [text, kind] = bidi.renderBlur(cleanCell);
    inputText.value = text;
    inputClass.value = kind.toLowerCase();
}

function renderFocus(cleanCell: bidi.CleanCell) {
    const [text, kind] = bidi.renderFocus(cleanCell);
    inputText.value = text;
    inputClass.value = kind.toLowerCase();
}

function renderFocusSecondary(cleanCell: bidi.CleanCell) {
    const [text, kind] = bidi.renderFocusSecondary(cleanCell);
    inputText.value = text;
    inputClass.value = kind.toLowerCase();
}

function onHotKey(evt: HotKeyEvent) {
    inputElement.value?.blur();
    emit("hotkey", evt);
}

function onFocus() {
    emit("focus");

    // Render in 'focus mode'
    if (focusSecondary.value) renderFocusSecondary(currentState);
    else renderFocus(currentState);

    // By default next blur will emit, unless overwridden
    bluringBecauseOfEscapeKey = false;

    // For tracking changes, blur will only emit an update event if the content actually changed
    lastFocusValue = inputText.value;
}

// On any lose focus => trigger change event if content has changed
function onBlur() {
    emit("blur");

    const hasChanged = inputText.value !== lastFocusValue;

    // if (!bluringBecauseOfEscapeKey && hasChanged) {
    if (!bluringBecauseOfEscapeKey) {
        if (focusSecondary.value) emit("updateForwardOnly", inputText.value);
        else emit("update", inputText.value);
    }

    // Render in 'blur mode'
    renderBlur(currentState);

    // Reset 'secondary' state for next time we are focused
    focusSecondary.value = false;
}

function onEscape() {
    // Cancel edit, don't emit update event
    bluringBecauseOfEscapeKey = true;
    inputElement.value?.blur();
}

function onFClick() {
    focusSecondary.value = true;
    inputElement.value?.focus();
}

// initial render
onMounted(() => {
    renderBlur(currentState);
});
</script>

<template>
    <div class="input-wrapper">
        <input
            ref="input-element"
            v-model="inputText"
            :class="inputClass"
            type="text"
            @blur="onBlur"
            @focus="onFocus"
            @keydown.enter.exact.prevent="onHotKey('keyEnter')"
            @keydown.enter.shift.exact.prevent="onHotKey('keyShiftEnter')"
            @keydown.tab.exact.prevent="onHotKey('keyTab')"
            @keydown.tab.shift.exact.prevent="onHotKey('keyShiftTab')"
            @keydown.escape.prevent="onEscape"
            @keydown.up.ctrl.exact.prevent="onHotKey('keyCtrlUp')"
            @keydown.down.ctrl.exact.prevent="onHotKey('keyCtrlDown')"
            @keydown.left.ctrl.exact.prevent="onHotKey('keyCtrlLeft')"
            @keydown.right.ctrl.exact.prevent="onHotKey('keyCtrlRight')"
        />
        <svg
            class="icon-solution"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            @click="onFClick"
            v-show="!focusSecondary"
        >
            <path
                fill="currentColor"
                d="M4.52 3.445C4.66 1.347 7.07.24 8.752 1.501l.11.083l-.007.003l-.991.324a1.3 1.3 0 0 0-.68.56a1.15 1.15 0 0 0-1.17 1.074l-.063.954H7.25a.75.75 0 0 1 0 1.5H5.852l-.427 6.394a2.75 2.75 0 0 1-3.683 2.4l-.248-.089a.75.75 0 0 1 .512-1.41l.248.09a1.25 1.25 0 0 0 1.674-1.091l.42-6.294H3.75a.75.75 0 0 1 0-1.5h.699zm2.778 3.946a1.5 1.5 0 0 1 2.338.274l1.005 1.633l.531-.532q.127.085.278.144l.691.232a.6.6 0 0 1 .2.128c.064.056.1.13.127.204l.029.088l-1.048 1.048l1.192 1.938l.328-.33a.75.75 0 0 1 1.06 1.061l-.327.33a1.5 1.5 0 0 1-2.338-.275L10.359 11.7l-2.078 2.08a.751.751 0 0 1-1.062-1.06l2.331-2.331L8.36 8.45l-.33.328a.75.75 0 0 1-1.06-1.06zm6.466-1.937a.27.27 0 0 1 .253.184l.222.695c.069.211.185.404.339.561s.342.276.549.346l.68.227l.014.003a.27.27 0 0 1 .179.26a.27.27 0 0 1-.179.259l-.68.225c-.208.07-.396.189-.55.347s-.27.349-.338.56l-.222.695a.266.266 0 0 1-.507 0l-.22-.695a1.44 1.44 0 0 0-.34-.562a1.4 1.4 0 0 0-.548-.348l-.681-.227a.278.278 0 0 1-.13-.418a.27.27 0 0 1 .13-.1l.68-.226a1.4 1.4 0 0 0 .542-.348c.151-.158.265-.35.333-.559l.22-.695a.275.275 0 0 1 .254-.184M11.092 0a.37.37 0 0 1 .217.07a.4.4 0 0 1 .138.187l.31.973c.096.296.258.565.474.786c.216.22.48.386.769.484l.952.316l.02.005a.4.4 0 0 1 .18.14a.39.39 0 0 1 0 .445a.4.4 0 0 1-.18.14l-.954.317a1.95 1.95 0 0 0-.768.486a2 2 0 0 0-.474.785l-.31.973a.4.4 0 0 1-.137.186a.37.37 0 0 1-.435 0l-.018-.014a.4.4 0 0 1-.12-.172l-.31-.973a2 2 0 0 0-.58-.889a2 2 0 0 0-.662-.387l-.952-.316a.4.4 0 0 1-.183-.14a.39.39 0 0 1 0-.445a.4.4 0 0 1 .183-.14l.952-.317c.286-.101.545-.268.757-.488c.213-.22.372-.488.466-.782l.31-.973A.37.37 0 0 1 11.092 0"
            />
        </svg>

        <svg
            class="icon-constant"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 16 16"
        >
            <path
                fill="currentColor"
                fill-rule="evenodd"
                d="M6.995 1.84a.75.75 0 0 0-1.49-.18L5.105 5H1.75a.75.75 0 0 0 0 1.5h3.175l-.36 3H1.75a.75.75 0 0 0 0 1.5h2.635l-.38 3.16a.75.75 0 0 0 1.49.18l.4-3.34h3.49l-.38 3.16a.75.75 0 0 0 1.49.18l.4-3.34h3.355a.75.75 0 0 0 0-1.5h-3.175l.36-3h2.815a.75.75 0 0 0 0-1.5h-2.635l.38-3.16a.75.75 0 0 0-1.49-.18l-.4 3.34h-3.49zm2.57 7.66l.36-3h-3.49l-.36 3z"
                clip-rule="evenodd"
            />
        </svg>
    </div>
</template>

<style scoped>
div.input-wrapper {
    position: relative;
    display: inline-block;
}

svg {
    visibility: hidden;
    position: absolute;
    height: 16px;
    width: 16px;
    left: 6px;
    top: calc(var(--cell-height) / 2 - 8px);
    z-index: 3;
    color: var(--color-gray-400);
}

input.solution ~ svg.icon-solution,
input.nosolution ~ svg.icon-solution {
    visibility: visible;
    cursor: pointer;
}

input.constant ~ svg.icon-constant {
    visibility: visible;
}

input {
    font-size: 0.8rem;
    text-align: right;
    z-index: 0;

    background-color: white;
    --background-color-focus: var(--color-blue-50);
    --outline-focus: solid 3px var(--color-blue-700);

    position: relative;

    width: var(--cell-width);
    height: var(--cell-height);
    padding: 5px;

    outline: none;
    border: none;
}

input:focus {
    z-index: 3;
    outline: var(--outline-focus);
    background-color: var(--background-color-focus);
}

input.text {
    background-color: var(--color-gray-200);
    font-weight: bold;
}

input.variable {
}

input.constant {
    /* background-color: var(--color-yellow-100); */
    /* font-weight: bold; */
    padding-left: 28px; /* give space for the icon */
}

input.error {
    background-color: var(--color-red-200);
    outline: solid 2px var(--color-red-700);
    z-index: 2;
    text-decoration: var(--color-red-700) wavy underline;
}

input.error:focus {
    background-color: var(--background-color-focus);
    text-decoration: none;
    outline: var(--outline-focus);
    text-align: right;
    font-weight: normal;
    font-style: normal;
    z-index: 3;
}

input.solution {
    /* background-color: var(--color-green-200); */
    padding-left: 28px; /* give space for the icon */
}

input.nosolution {
    background-color: var(--color-yellow-300);
    text-align: center;
    font-weight: bold;
    font-style: italic;
}

input.nosolution:focus {
    background-color: white;
    text-align: right;
    font-weight: normal;
    font-style: normal;
}

input.solution:focus {
    /* background-color: var(--background-color-focus); */
}
</style>
