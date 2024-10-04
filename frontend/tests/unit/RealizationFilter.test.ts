import { Ensemble } from "@framework/Ensemble";
import { RealizationFilter } from "@framework/RealizationFilter";
import { IncludeExcludeFilter, RealizationFilterType } from "@framework/types/realizationFilterTypes";

import { describe, expect, test } from "vitest";

const FIRST_ENSEMBLE_REALIZATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15];

const FIRST_ENSEMBLE = new Ensemble(
    "DROGON",
    "First ensemble UUID",
    "First case",
    "First ensemble",
    FIRST_ENSEMBLE_REALIZATIONS,
    [],
    null,
    ""
);

describe("Test functionality of Realization Filter class", () => {
    test("Test get assigned ensembleIdent", () => {
        const firstRealizationFilter = new RealizationFilter(FIRST_ENSEMBLE);
        expect(firstRealizationFilter.getAssignedEnsembleIdent()).toBe(FIRST_ENSEMBLE.getIdent());
    });

    test("Test set/get filter type", () => {
        const realizationFilter = new RealizationFilter(FIRST_ENSEMBLE);

        expect(realizationFilter.getFilterType()).toBe(RealizationFilterType.BY_REALIZATION_NUMBER);
    });

    test("Test set/get include or exclude filter state", () => {
        const realizationFilter = new RealizationFilter(FIRST_ENSEMBLE);

        expect(realizationFilter.getIncludeOrExcludeFilter()).toBe(IncludeExcludeFilter.INCLUDE_FILTER);
        realizationFilter.setIncludeOrExcludeFilter(IncludeExcludeFilter.EXCLUDE_FILTER);
        expect(realizationFilter.getIncludeOrExcludeFilter()).toBe(IncludeExcludeFilter.EXCLUDE_FILTER);
    });

    test("Test set/get realization index selections", () => {
        const realizationFilter = new RealizationFilter(FIRST_ENSEMBLE);

        expect(realizationFilter.getRealizationNumberSelections()).toBeNull();
        realizationFilter.setRealizationNumberSelections([1, 2, 3]);
        expect(realizationFilter.getRealizationNumberSelections()).toEqual([1, 2, 3]);
        realizationFilter.setRealizationNumberSelections([1, 2, 3, { start: 9, end: 15 }]);
        expect(realizationFilter.getRealizationNumberSelections()).toEqual([1, 2, 3, { start: 9, end: 15 }]);
    });

    test("Test get filtered realizations by realization number - include", () => {
        const realizationFilter = new RealizationFilter(FIRST_ENSEMBLE);
        realizationFilter.setFilterType(RealizationFilterType.BY_REALIZATION_NUMBER);
        realizationFilter.setIncludeOrExcludeFilter(IncludeExcludeFilter.INCLUDE_FILTER);

        realizationFilter.runFiltering();
        expect(realizationFilter.getFilteredRealizations()).toEqual(FIRST_ENSEMBLE_REALIZATIONS);

        realizationFilter.setRealizationNumberSelections([1, 2, 3]);
        realizationFilter.runFiltering();
        expect(realizationFilter.getFilteredRealizations()).toEqual([1, 2, 3]);

        realizationFilter.setRealizationNumberSelections([1, 2, 3, { start: 9, end: 15 }]);
        realizationFilter.runFiltering();
        expect(realizationFilter.getFilteredRealizations()).toEqual([1, 2, 3, 9, 10, 15]);
    });

    test("Test get filtered realizations - exclude", () => {
        const realizationFilter = new RealizationFilter(FIRST_ENSEMBLE);
        realizationFilter.setFilterType(RealizationFilterType.BY_REALIZATION_NUMBER);
        realizationFilter.setIncludeOrExcludeFilter(IncludeExcludeFilter.EXCLUDE_FILTER);

        realizationFilter.runFiltering();
        expect(realizationFilter.getFilteredRealizations()).toEqual(FIRST_ENSEMBLE_REALIZATIONS);

        realizationFilter.setRealizationNumberSelections([1, 2, 3]);
        realizationFilter.runFiltering();
        expect(realizationFilter.getFilteredRealizations()).toEqual([4, 5, 6, 7, 8, 9, 10, 15]);

        realizationFilter.setRealizationNumberSelections([1, 2, 3, { start: 9, end: 15 }]);
        realizationFilter.runFiltering();
        expect(realizationFilter.getFilteredRealizations()).toEqual([4, 5, 6, 7, 8]);
    });
});
