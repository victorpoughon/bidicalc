import type { InjectionKey } from 'vue'
import * as bidi from "bidicalc-engine";

export const CellGridInjectionKey = Symbol() as InjectionKey<{
    allRefs: () => string[];
    get: (ref: string) => bidi.CleanCell;
    indexing: () => bidi.GridIndexing,
}>