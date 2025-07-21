<script setup lang="ts">
import TestCellInput from "./TestCellInput.vue";
import TestSoloCell from "./TestSoloCell.vue";
import BidicalcGrid from "../components/BidicalcGrid.vue";

// import * as tf from "@tensorflow/tfjs";
import { onMounted } from "vue";
import * as bidi from "bidicalc-engine";

onMounted(async () => {
    // tf.setBackend("cpu");
    // await tf.ready();
    // console.log("backend", tf.getBackend());
});
</script>

<template>
    <main>
        <h1>bidicalc components tests</h1>

        <h2>BidicalcGrid</h2>
        <BidicalcGrid />

        <h2>TestCellInput</h2>
        <TestCellInput />
    </main>
</template>

<style scoped>

main {
    padding: 3rem;
}

</style>