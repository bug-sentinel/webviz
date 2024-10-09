import { RealizationNumberSelection } from "@framework/types/realizationFilterTypes";

/**
 * Convert a realization number selection to a string tag for a realization picker.
 *
 * The string tag is in the format "start-end" or "number".
 */
export function makeRealizationPickerTagFromRealizationNumberSelection(selection: RealizationNumberSelection): string {
    if (typeof selection === "number") {
        return `${selection}`;
    }
    return `${selection.start}-${selection.end}`;
}

/**
 * Convert realization number selections to string tags for a realization picker.
 *
 * The string tags are in the format "start-end" or "number".
 *
 * The selection can be be null, in which case an empty array is returned.
 */
export function makeRealizationPickerTagsFromRealizationNumberSelections(
    selections: readonly RealizationNumberSelection[] | null
): string[] {
    if (!selections) return [];

    return selections.map(makeRealizationPickerTagFromRealizationNumberSelection);
}

/**
 * Convert a string tag from a realization picker to a realization number selection.
 *
 * The string tag is expected to be in the format "start-end" or "number".
 */
export function makeRealizationNumberSelectionFromRealizationPickerTag(tag: string): RealizationNumberSelection {
    const split = tag.split("-");
    if (split.length === 1) {
        return parseInt(split[0]);
    }
    return { start: parseInt(split[0]), end: parseInt(split[1]) };
}

/**
 * Convert string tags from a realization picker to realization number selections.
 */
export function makeRealizationNumberSelectionsFromRealizationPickerTags(tags: string[]): RealizationNumberSelection[] {
    return tags.map(makeRealizationNumberSelectionFromRealizationPickerTag);
}

/**
 * Create the best suggested realization number selections from an array of realization numbers.
 *
 * Sequences of realization numbers are combined into range. Separate realization numbers are kept as is.
 */
export function createBestSuggestedRealizationNumberSelections(
    realizationNumbers: readonly number[]
): readonly RealizationNumberSelection[] {
    // Remove duplicates and sort the realization numbers and create a single range from the start
    const sortedRealizationNumbers = [...new Set(realizationNumbers)].sort((a, b) => a - b);

    if (sortedRealizationNumbers.length === 0) {
        return [];
    }
    if (sortedRealizationNumbers.length === 1) {
        return [sortedRealizationNumbers[0]];
    }

    const realizationNumberSelections: RealizationNumberSelection[] = [];
    let currentSelection: RealizationNumberSelection | null = null;
    for (const realizationNumber of sortedRealizationNumbers) {
        // Initialize the current selection
        if (currentSelection === null) {
            currentSelection = realizationNumber;
        } else if (typeof currentSelection === "number" && realizationNumber === currentSelection + 1) {
            currentSelection = { start: currentSelection, end: realizationNumber };
        } else if (typeof currentSelection === "number") {
            realizationNumberSelections.push(currentSelection);
            currentSelection = realizationNumber;
        } else if (realizationNumber === currentSelection.end + 1) {
            currentSelection.end = realizationNumber;
        } else {
            realizationNumberSelections.push(currentSelection);
            currentSelection = realizationNumber;
        }
    }

    // Add last created selection
    if (currentSelection) {
        realizationNumberSelections.push(currentSelection);
    }

    return realizationNumberSelections;
}

/**
 * Convert an array of realization numbers into an array of realization number selections based on an existing selection.
 */
// export function convertRealizationNumbersToRealizationNumberSelections(
//     realizationNumbers: readonly number[],
//     existingSelections: readonly RealizationNumberSelection[] | null
// ): readonly RealizationNumberSelection[] {
//     if (!existingSelections) {
//         return createBestSuggestedRealizationNumberSelections(realizationNumbers);
//     }

//     const newSelections: RealizationNumberSelection[] = [];
//     const realizationSet = new Set(realizationNumbers);

//     for (const selection of existingSelections) {
//         if (typeof selection === "number") {
//             if (realizationSet.has(selection)) {
//                 newSelections.push(selection);
//             }
//         } else {
//             const { start, end } = selection;
//             let newStart = start;
//             let newEnd = end;

//             // Extend the range if possible
//             const newStartCandidate = newStart - 1;
//             // Extend the range to the left if the candidate is in the realization set and not already covered by another range

//             // TODO: FIX OVERLAPPING RANGES
//             while (realizationSet.has(newStart - 1) && !newSelections.some((sel) => sel.start <= newStartCandidate)) {
//                 newStart--;
//             }
//             while (realizationSet.has(newEnd + 1)) {
//                 newEnd++;
//             }

//             // Check for overlapping ranges
//             const overlappingRange = newSelections.find(
//                 (sel) => typeof sel !== "number" && sel.start <= newEnd && sel.end >= newStart
//             );

//             if (overlappingRange && typeof overlappingRange !== "number") {
//                 overlappingRange.start = Math.min(overlappingRange.start, newStart);
//                 overlappingRange.end = Math.max(overlappingRange.end, newEnd);
//             } else {
//                 newSelections.push({ start: newStart, end: newEnd });
//             }
//         }
//     }

//     // Add any remaining realization numbers that are not in the existing selections
//     for (const number of realizationNumbers) {
//         if (
//             !newSelections.some((selection) => {
//                 if (typeof selection === "number") {
//                     return selection === number;
//                 } else {
//                     return selection.start <= number && selection.end >= number;
//                 }
//             })
//         ) {
//             newSelections.push(number);
//         }
//     }

//     return newSelections;
// }