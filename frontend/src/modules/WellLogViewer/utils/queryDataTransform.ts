/**
 * Utilities to convert fetched well log data to the JSON well-log format (see https://jsonwelllogformat.org/)
 */
import { WellboreLogCurveData_api, WellboreTrajectory_api } from "@api";
import { IntersectionReferenceSystem } from "@equinor/esv-intersection";
import {
    WellLog,
    WellLogCurve,
    WellLogDataRow,
    WellLogHeader,
} from "@webviz/well-log-viewer/dist/components/WellLogTypes";

import _ from "lodash";

export const MAIN_AXIS_CURVE: WellLogCurve = {
    name: "MD",
    unit: "M",
    dimensions: 1,
    valueType: "float",
};

export const SECONDARY_AXIS_CURVE: WellLogCurve = {
    name: "DVER",
    unit: "M",
    dimensions: 1,
    valueType: "float",
};

export function createWellLog(
    curveData: WellboreLogCurveData_api[],
    wellboreTrajectory: WellboreTrajectory_api,
    referenceSystem: IntersectionReferenceSystem
): WellLog {
    // TODO: these all iterate over the curve data list, so should probably just combine them into a single reduce method to optimize
    const header = createLogHeader(wellboreTrajectory);

    // ! Important: Always make sure that the data row and curve arrays are in the same order!
    const curves = createLogCurves(curveData);
    const data = createLogData(curveData, referenceSystem);

    return { header, curves, data };
}

function createLogCurves(curveData: WellboreLogCurveData_api[]): WellLogCurve[] {
    return [MAIN_AXIS_CURVE, SECONDARY_AXIS_CURVE, ...curveData.map(apiCurveToLogCurve)];
}

function apiCurveToLogCurve(curve: WellboreLogCurveData_api): WellLogCurve {
    return {
        name: curve.name,
        // ! The Well Log JSON format does *technically* support multiple dimensions, but the subsurface component does not
        // dimensions: curve.dataPoints[0].length - 1,
        dimensions: 1,
        valueType: typeof curve.dataPoints[0][1],
        // ? if this is just gonna be the meter in depth for all of them
        unit: curve.unit,
        description: curve.curveDescription,
        // quantity,
        // description
    };
}

type SafeWellLogDataRow = [number, ...(WellLogDataRow | [])];
type DataRowAccumulatorMap = Record<number, SafeWellLogDataRow>;

function createLogData(
    curveData: WellboreLogCurveData_api[],
    referenceSystem: IntersectionReferenceSystem
): SafeWellLogDataRow[] {
    // We add 2 since each row also includes the MD and TVD axis curves
    const rowLength = curveData.length + 2;
    const rowAcc: DataRowAccumulatorMap = {};

    curveData.forEach((curve, curveIndex) => {
        curve.dataPoints.forEach(([scaleIdx, entry, ...restData]) => {
            if (!scaleIdx) return console.warn("Unexpected null for scale entry");
            if (restData.length) console.warn("Multi-dimensional data not supported, using first value only");

            maybeInjectDataRow(rowAcc, scaleIdx, rowLength, referenceSystem);

            rowAcc[scaleIdx][curveIndex + 2] = entry === curve.noDataValue ? null : entry;
        });
    });

    return _.sortBy(Object.values(rowAcc), "0");
}

function maybeInjectDataRow(
    rowAcc: DataRowAccumulatorMap,
    targetMdValue: number,
    rowLength: number,
    referenceSystem: IntersectionReferenceSystem
) {
    if (!rowAcc[targetMdValue]) {
        rowAcc[targetMdValue] = Array(rowLength).fill(null) as SafeWellLogDataRow;
        rowAcc[targetMdValue][0] = targetMdValue;
        rowAcc[targetMdValue][1] = referenceSystem.project(targetMdValue)[1] ?? 0;
    }
}

function createLogHeader(wellboreTrajectory: WellboreTrajectory_api): WellLogHeader {
    // TODO: Might want more data from https://api.equinor.com/api-details#api=equinor-subsurfacedata-api-v3&operation=get-api-v-api-version-welllog-wellboreuuid, which provides:
    /*
    {
        "logName": "string",
        "logVersion": 0,
        "sourceUpdateDate": "string",
        "curveName": "string",
        "curveVersion": 0,
        "curveUnit": "string",
        "logActivity": "string",
        "dateLogged": "string",
        "loggingNumber": "string",
        "casingSizeManual": "string"
    }
    */

    return {
        ...getDerivedLogHeaderValues(wellboreTrajectory),
    };
}

type PartialHeader = Pick<WellLogHeader, "startIndex" | "endIndex" | "step">;

function getDerivedLogHeaderValues(wellboreTrajectory: WellboreTrajectory_api): PartialHeader {
    return {
        startIndex: wellboreTrajectory.mdArr[0] ?? 0,
        endIndex: wellboreTrajectory.mdArr[wellboreTrajectory.mdArr.length - 1] ?? 4000,
        // Unsure if this one is even used?
        step: 1,
    };
}
