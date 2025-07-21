<script setup lang="ts">
import { ref, onMounted } from "vue";
import { match } from "ts-pattern";
import "./colors.css";

type Placement = "top" | "bottom" | "left" | "right";
const tooltipX = ref(0);
const tooltipY = ref(0);
const tooltipPlacement = ref("top");
const tooltipVisible = ref(false);

function show(target: HTMLElement, placement: Placement) {
    const rect = target.getBoundingClientRect();

    match(placement)
        .with("top", () => {
            tooltipX.value = rect.left + rect.width / 2;
            tooltipY.value = rect.top;
        })
        .with("bottom", () => {
            tooltipX.value = rect.left + rect.width / 2;
            tooltipY.value = rect.bottom;
        })
        .with("left", () => {
            tooltipX.value = rect.left;
            tooltipY.value = rect.top + rect.height / 2;
        })
        .with("right", () => {
            tooltipX.value = rect.right;
            tooltipY.value = rect.top + rect.height / 2;
        })
        .exhaustive();

    tooltipPlacement.value = placement;
    tooltipVisible.value = true;
}

function hide() {
    tooltipVisible.value = false;
}

onMounted(() => {
    // Hide tooltip on any scroll event
    window.addEventListener("scroll", (ev) => {
        hide();
    });
});

defineExpose({
    show,
    hide,
});
</script>

<template>
    <div
        v-if="tooltipVisible"
        class="tooltip-box"
        :class="tooltipPlacement"
        :style="{ top: tooltipY + 'px', left: tooltipX + 'px' }"
    >
        <slot />
        <span class="arrow" :class="tooltipPlacement" />
    </div>
</template>

<style scoped>
.tooltip-box {
    position: fixed;
    font-size: 14px;
    pointer-events: none;
    z-index: 9999;
}

.tooltip-box.top {
    transform: translate(-50%, calc(-100% - 10px));
}
.tooltip-box.bottom {
    transform: translate(-50%, 10px);
}
.tooltip-box.left {
    transform: translate(calc(-100% - 10px), -50%);
}
.tooltip-box.right {
    transform: translate(10px, -50%);
}

.arrow {
    position: absolute;
    width: 0;
    height: 0;
}

.arrow.top {
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid var(--color-gray-900);
}

.arrow.bottom {
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 6px solid var(--color-gray-900);
}

.arrow.left {
    right: -6px;
    top: 50%;
    transform: translateY(-50%);
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 6px solid var(--color-gray-900);
}

.arrow.right {
    left: -6px;
    top: 50%;
    transform: translateY(-50%);
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-right: 6px solid var(--color-gray-900);
}
</style>
