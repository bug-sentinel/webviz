import React from "react";

import { SurfaceAttributeType_api, SurfaceStatisticFunction_api } from "@api";
import { EnsembleIdent } from "@framework/EnsembleIdent";
import { ModuleFCProps } from "@framework/Module";
import { SyncSettingKey, SyncSettingsHelper } from "@framework/SyncSettings";
import { useEnsembleSet } from "@framework/WorkbenchSession";
import { SingleEnsembleSelect } from "@framework/components/SingleEnsembleSelect";
import { fixupEnsembleIdent, maybeAssignFirstSyncedEnsemble } from "@framework/utils/ensembleUiHelpers";
import { ApiStateWrapper } from "@lib/components/ApiStateWrapper";
import { Button } from "@lib/components/Button";
import { Checkbox } from "@lib/components/Checkbox";
import { CircularProgress } from "@lib/components/CircularProgress";
import { CollapsibleGroup } from "@lib/components/CollapsibleGroup";
import { Input } from "@lib/components/Input";
import { Label } from "@lib/components/Label";
import { RadioGroup } from "@lib/components/RadioGroup";
import { Select, SelectOption } from "@lib/components/Select";
import {
    SurfaceAddress,
    SurfaceAddressFactory,
    SurfaceDirectory,
    TimeType,
    useSurfaceDirectoryQuery,
} from "@modules/_shared/Surface";

import { SurfacePolygonsAddress } from "./SurfacePolygonsAddress";
import { AggregationSelector } from "./components/AggregationSelector";
import { PolygonDirectoryProvider } from "./polygonsDirectoryProvider";
import { useGetWellHeaders, usePolygonDirectoryQuery } from "./queryHooks";
import { state } from "./state";

//-----------------------------------------------------------------------------------------------------------
type LabelledCheckboxProps = {
    label: string;
    checked: boolean;
    onChange: any;
};

function LabelledCheckbox(props: LabelledCheckboxProps): JSX.Element {
    return (
        <Label wrapperClassName=" text-xs flow-root" labelClassName="float-left text-xs" text={props.label}>
            <div className=" float-right">
                <Checkbox onChange={props.onChange} checked={props.checked} />
            </div>
        </Label>
    );
}
function Header(props: { text: string }): JSX.Element {
    return <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mt-2">{props.text}</label>;
}
const TimeTypeEnumToStringMapping = {
    [TimeType.None]: "Static",
    [TimeType.TimePoint]: "Time point",
    [TimeType.Interval]: "Time interval",
};
export function settings({ moduleContext, workbenchSession, workbenchServices }: ModuleFCProps<state>) {
    const myInstanceIdStr = moduleContext.getInstanceIdString();
    console.debug(`${myInstanceIdStr} -- render TopographicMap settings`);

    const ensembleSet = useEnsembleSet(workbenchSession);
    const [selectedEnsembleIdent, setSelectedEnsembleIdent] = React.useState<EnsembleIdent | null>(null);
    const [selectedMeshSurfaceName, setSelectedMeshSurfaceName] = React.useState<string | null>(null);
    const [selectedMeshSurfaceAttribute, setSelectedMeshSurfaceAttribute] = React.useState<string | null>(null);
    const [usePropertySurface, setUsePropertySurface] = React.useState<boolean>(false);
    const [selectedPropertySurfaceName, setSelectedPropertySurfaceName] = React.useState<string | null>(null);
    const [selectedPropertySurfaceAttribute, setSelectedPropertySurfaceAttribute] = React.useState<string | null>(null);
    const [selectedPropertyTimeOrInterval, setSelectedPropertyTimeOrInterval] = React.useState<string | null>(null);
    const [timeType, setTimeType] = React.useState<TimeType>(TimeType.None);
    const [selectedPolygonName, setSelectedPolygonName] = React.useState<string | null>(null);
    const [selectedPolygonAttribute, setSelectedPolygonAttribute] = React.useState<string | null>(null);
    const [linkPolygonNameToSurfaceName, setLinkPolygonNameToSurfaceName] = React.useState<boolean>(true);
    const [selectedWellUuids, setSelectedWellUuids] = moduleContext.useStoreState("selectedWellUuids");
    const [showPolygon, setShowPolygon] = React.useState<boolean>(true);
    const [realizationNum, setRealizationNum] = React.useState<number>(0);
    const [aggregation, setAggregation] = React.useState<SurfaceStatisticFunction_api | null>(null);
    const [showContour, setShowContour] = React.useState(false);
    const [contourStartValue, setContourStartValue] = React.useState<number>(0);
    const [contourIncValue, setContourIncValue] = React.useState<number>(100);
    const [showGrid, setShowGrid] = React.useState(false);
    const [showSmoothShading, setShowSmoothShading] = React.useState(false);
    const [showMaterial, setShowMaterial] = React.useState(false);
    const [show3D, setShow3D] = React.useState(true);

    const syncedSettingKeys = moduleContext.useSyncedSettingKeys();
    const syncHelper = new SyncSettingsHelper(syncedSettingKeys, workbenchServices);
    const syncedValueEnsembles = syncHelper.useValue(SyncSettingKey.ENSEMBLE, "global.syncValue.ensembles");
    const syncedValueSurface = syncHelper.useValue(SyncSettingKey.SURFACE, "global.syncValue.surface");
    const candidateEnsembleIdent = maybeAssignFirstSyncedEnsemble(selectedEnsembleIdent, syncedValueEnsembles);
    const computedEnsembleIdent = fixupEnsembleIdent(candidateEnsembleIdent, ensembleSet);
    if (computedEnsembleIdent && !computedEnsembleIdent.equals(selectedEnsembleIdent)) {
        setSelectedEnsembleIdent(computedEnsembleIdent);
    }
    // Mesh surface
    const meshSurfDirQuery = useSurfaceDirectoryQuery(
        computedEnsembleIdent?.getCaseUuid(),
        computedEnsembleIdent?.getEnsembleName()
    );
    const meshSurfaceDirectory = new SurfaceDirectory(
        meshSurfDirQuery.data
            ? {
                  surfaceMetas: meshSurfDirQuery.data,
                  timeType: TimeType.None,
                  includeAttributeTypes: [SurfaceAttributeType_api.DEPTH],
              }
            : null
    );

    const fixedMeshSurfSpec = fixupSurface(
        meshSurfaceDirectory,
        {
            surfaceName: selectedMeshSurfaceName,
            surfaceAttribute: selectedMeshSurfaceAttribute,
            timeOrInterval: null,
        },
        {
            surfaceName: syncedValueSurface?.name || null,
            surfaceAttribute: syncedValueSurface?.attribute || null,
            timeOrInterval: null,
        }
    );
    const computedMeshSurfaceName = fixedMeshSurfSpec.surfaceName;
    const computedMeshSurfaceAttribute = fixedMeshSurfSpec.surfaceAttribute;

    if (computedMeshSurfaceName && computedMeshSurfaceName !== selectedMeshSurfaceName) {
        setSelectedMeshSurfaceName(computedMeshSurfaceName);
    }
    if (computedMeshSurfaceAttribute && computedMeshSurfaceAttribute !== selectedMeshSurfaceAttribute) {
        setSelectedMeshSurfaceAttribute(computedMeshSurfaceAttribute);
    }

    let meshSurfNameOptions: SelectOption[] = [];
    let meshSurfAttributeOptions: SelectOption[] = [];
    meshSurfNameOptions = meshSurfaceDirectory.getSurfaceNames(null).map((name) => ({ value: name, label: name }));
    meshSurfAttributeOptions = meshSurfaceDirectory
        .getAttributeNames(computedMeshSurfaceName)
        .map((attr) => ({ value: attr, label: attr }));

    // Property surface
    // TODO add timestamp and time interval surfaces
    const propertySurfDirQuery = useSurfaceDirectoryQuery(
        computedEnsembleIdent?.getCaseUuid(),
        computedEnsembleIdent?.getEnsembleName()
    );

    const propertySurfaceDirectory = new SurfaceDirectory(
        propertySurfDirQuery.data
            ? {
                  surfaceMetas: propertySurfDirQuery.data,
                  timeType: timeType,
                  excludeAttributeTypes: [SurfaceAttributeType_api.DEPTH],
              }
            : null
    );

    const fixedPropertySurfSpec = fixupSurface(
        propertySurfaceDirectory,
        {
            surfaceName: selectedPropertySurfaceName,
            surfaceAttribute: selectedPropertySurfaceAttribute,
            timeOrInterval: selectedPropertyTimeOrInterval,
        },
        {
            surfaceName: null,
            surfaceAttribute: null,
            timeOrInterval: null,
        }
    );
    const computedPropertySurfaceName = fixedPropertySurfSpec.surfaceName;
    const computedPropertySurfaceAttribute = fixedPropertySurfSpec.surfaceAttribute;
    const computedPropertyTimeOrInterval = fixedPropertySurfSpec.timeOrInterval;

    if (computedPropertySurfaceName && computedPropertySurfaceName !== selectedPropertySurfaceName) {
        setSelectedPropertySurfaceName(computedPropertySurfaceName);
    }
    if (computedPropertySurfaceAttribute && computedPropertySurfaceAttribute !== selectedPropertySurfaceAttribute) {
        setSelectedPropertySurfaceAttribute(computedPropertySurfaceAttribute);
    }
    if (computedPropertyTimeOrInterval && computedPropertyTimeOrInterval !== computedPropertyTimeOrInterval) {
        setSelectedPropertyTimeOrInterval(computedPropertyTimeOrInterval);
    }
    let propertySurfNameOptions: SelectOption[] = [];
    let propertySurfAttributeOptions: SelectOption[] = [];
    let propertySurfTimeOrIntervalOptions: SelectOption[] = [];

    propertySurfNameOptions = propertySurfaceDirectory
        .getSurfaceNames(null)
        .map((name) => ({ value: name, label: name }));
    propertySurfAttributeOptions = propertySurfaceDirectory
        .getAttributeNames(computedPropertySurfaceName)
        .map((attr) => ({ value: attr, label: attr }));
    if (timeType === TimeType.Interval || timeType === TimeType.TimePoint) {
        propertySurfTimeOrIntervalOptions = propertySurfaceDirectory
            .getTimeOrIntervalStrings(computedPropertySurfaceName, computedPropertySurfaceAttribute)
            .map((interval) => ({
                value: interval,
                label:
                    timeType === TimeType.TimePoint
                        ? isoStringToDateLabel(interval)
                        : isoIntervalStringToDateLabel(interval),
            }));
    }

    // Polygon
    const polygonDirQuery = usePolygonDirectoryQuery(
        computedEnsembleIdent?.getCaseUuid(),
        computedEnsembleIdent?.getEnsembleName()
    );
    const polygonDirProvider = new PolygonDirectoryProvider(polygonDirQuery);

    const computedPolygonName = linkPolygonNameToSurfaceName
        ? polygonDirProvider.validateOrResetPolygonNameFromSurfaceName(computedMeshSurfaceName)
        : polygonDirProvider.validateOrResetPolygonName(selectedPolygonName);
    const computedPolygonAttribute = polygonDirProvider.validateOrResetPolygonAttribute(
        computedPolygonName,
        selectedPolygonAttribute
    );

    if (computedPolygonName && computedPolygonName !== selectedPolygonName) {
        setSelectedPolygonName(computedPolygonName);
    }
    if (computedPolygonAttribute && computedPolygonAttribute !== selectedPolygonAttribute) {
        setSelectedPolygonAttribute(computedPolygonAttribute);
    }
    let polyNameOptions: SelectOption[] = [];
    let polyAttributesOptions: SelectOption[] = [];
    polyNameOptions = polygonDirProvider.polygonNames().map((name) => ({ value: name, label: name }));
    polyAttributesOptions = polygonDirProvider
        .attributesForPolygonName(computedPolygonName)
        .map((attr) => ({ value: attr, label: attr }));

    React.useEffect(
        function propagateMeshSurfaceSelectionToView() {
            let surfAddr: SurfaceAddress | null = null;

            if (computedEnsembleIdent && computedMeshSurfaceName && computedMeshSurfaceAttribute) {
                const addrFactory = new SurfaceAddressFactory(
                    computedEnsembleIdent.getCaseUuid(),
                    computedEnsembleIdent.getEnsembleName(),
                    computedMeshSurfaceName,
                    computedMeshSurfaceAttribute,
                    null
                );

                if (aggregation === null) {
                    surfAddr = addrFactory.createRealizationAddress(realizationNum);
                } else {
                    surfAddr = addrFactory.createStatisticalAddress(aggregation);
                }
            }

            console.debug(`propagateSurfaceSelectionToView() => ${surfAddr ? "valid surfAddr" : "NULL surfAddr"}`);
            moduleContext.getStateStore().setValue("meshSurfaceAddress", surfAddr);
        },
        [selectedEnsembleIdent, selectedMeshSurfaceName, selectedMeshSurfaceAttribute, aggregation, realizationNum]
    );
    React.useEffect(
        function propagatePropertySurfaceSelectionToView() {
            let surfAddr: SurfaceAddress | null = null;
            if (!usePropertySurface) {
                moduleContext.getStateStore().setValue("propertySurfaceAddress", surfAddr);
                return;
            }
            if (computedEnsembleIdent && computedPropertySurfaceName && computedPropertySurfaceAttribute) {
                const addrFactory = new SurfaceAddressFactory(
                    computedEnsembleIdent.getCaseUuid(),
                    computedEnsembleIdent.getEnsembleName(),
                    computedPropertySurfaceName,
                    computedPropertySurfaceAttribute,
                    computedPropertyTimeOrInterval
                );

                if (aggregation === null) {
                    surfAddr = addrFactory.createRealizationAddress(realizationNum);
                } else {
                    surfAddr = addrFactory.createStatisticalAddress(aggregation);
                }
            }

            console.debug(`propagateSurfaceSelectionToView() => ${surfAddr ? "valid surfAddr" : "NULL surfAddr"}`);
            moduleContext.getStateStore().setValue("propertySurfaceAddress", surfAddr);
        },
        [
            selectedEnsembleIdent,
            selectedPropertySurfaceName,
            selectedPropertySurfaceAttribute,
            selectedPropertyTimeOrInterval,
            aggregation,
            realizationNum,
            usePropertySurface,
        ]
    );
    React.useEffect(
        function propogatePolygonsSelectionToView() {
            let polygonAddr: SurfacePolygonsAddress | null = null;
            if (computedEnsembleIdent && computedPolygonName && computedPolygonAttribute && showPolygon) {
                polygonAddr = {
                    caseUuid: computedEnsembleIdent.getCaseUuid(),
                    ensemble: computedEnsembleIdent.getEnsembleName(),
                    name: computedPolygonName,
                    attribute: computedPolygonAttribute,
                    realizationNum: realizationNum,
                };
            }

            moduleContext.getStateStore().setValue("polygonsAddress", polygonAddr);
        },
        [
            selectedEnsembleIdent,
            selectedMeshSurfaceName,
            selectedPolygonName,
            selectedPolygonAttribute,
            linkPolygonNameToSurfaceName,
            showPolygon,
            aggregation,
            realizationNum,
        ]
    );
    React.useEffect(
        function propogateSurfaceSettingsToView() {
            moduleContext.getStateStore().setValue("surfaceSettings", {
                contours: showContour ? [contourStartValue, contourIncValue] : false,
                gridLines: showGrid,
                smoothShading: showSmoothShading,
                material: showMaterial,
            });
        },
        [showContour, contourStartValue, contourIncValue, showGrid, showSmoothShading, showMaterial]
    );
    React.useEffect(
        function propogateSubsurfaceMapViewSettingsToView() {
            moduleContext.getStateStore().setValue("viewSettings", {
                show3d: show3D,
            });
        },
        [show3D]
    );

    const wellHeadersQuery = useGetWellHeaders(computedEnsembleIdent?.getCaseUuid());
    let wellHeaderOptions: SelectOption[] = [];

    if (wellHeadersQuery.data) {
        wellHeaderOptions = wellHeadersQuery.data.map((header) => ({
            label: header.unique_wellbore_identifier,
            value: header.wellbore_uuid,
        }));
    }

    function handleWellsChange(selectedWellUuids: string[], allWellUuidsOptions: SelectOption[]) {
        const newSelectedWellUuids = selectedWellUuids.filter((wellUuid) =>
            allWellUuidsOptions.some((wellHeader) => wellHeader.value === wellUuid)
        );
        setSelectedWellUuids(newSelectedWellUuids);
    }
    function showAllWells(allWellUuidsOptions: SelectOption[]) {
        const newSelectedWellUuids = allWellUuidsOptions.map((wellHeader) => wellHeader.value);

        setSelectedWellUuids(newSelectedWellUuids);
    }
    function hideAllWells() {
        setSelectedWellUuids([]);
    }
    function handleEnsembleSelectionChange(newEnsembleIdent: EnsembleIdent | null) {
        setSelectedEnsembleIdent(newEnsembleIdent);
        if (newEnsembleIdent) {
            syncHelper.publishValue(SyncSettingKey.ENSEMBLE, "global.syncValue.ensembles", [newEnsembleIdent]);
        }
    }

    function handleMeshSurfNameSelectionChange(selectedSurfNames: string[]) {
        const newName = selectedSurfNames[0] ?? null;
        setSelectedMeshSurfaceName(newName);
        if (newName && computedMeshSurfaceAttribute) {
            syncHelper.publishValue(SyncSettingKey.SURFACE, "global.syncValue.surface", {
                name: newName,
                attribute: computedMeshSurfaceAttribute,
            });
        }
    }
    function handleMeshSurfAttributeSelectionChange(selectedSurfAttributes: string[]) {
        const newAttr = selectedSurfAttributes[0] ?? null;
        setSelectedMeshSurfaceAttribute(newAttr);
        if (newAttr && computedMeshSurfaceName) {
            syncHelper.publishValue(SyncSettingKey.SURFACE, "global.syncValue.surface", {
                name: computedMeshSurfaceName,
                attribute: newAttr,
            });
        }
    }
    function handlePropertySurfNameSelectionChange(selectedSurfNames: string[]) {
        const newName = selectedSurfNames[0] ?? null;
        setSelectedPropertySurfaceName(newName);
    }
    function handlePropertySurfAttributeSelectionChange(selectedSurfAttributes: string[]) {
        const newAttr = selectedSurfAttributes[0] ?? null;
        setSelectedPropertySurfaceAttribute(newAttr);
    }
    function handlePolyNameSelectionChange(selectedPolyNames: string[]) {
        const newName = selectedPolyNames[0] ?? null;
        setSelectedPolygonName(newName);
    }
    function handlePolyAttributeSelectionChange(selectedPolyAttributes: string[]) {
        const newAttr = selectedPolyAttributes[0] ?? null;
        setSelectedPolygonAttribute(newAttr);
    }
    function handleAggregationChanged(aggregation: SurfaceStatisticFunction_api | null) {
        setAggregation(aggregation);
    }

    function handleRealizationTextChanged(event: React.ChangeEvent<HTMLInputElement>) {
        const realNum = parseInt(event.target.value, 10);
        if (realNum >= 0) {
            setRealizationNum(realNum);
        }
    }
    function handleContourStartChange(event: React.ChangeEvent<HTMLInputElement>) {
        const contourStart = parseInt(event.target.value, 10);
        if (contourStart >= 0) {
            setContourStartValue(contourStart);
        }
    }
    function handleContourIncChange(event: React.ChangeEvent<HTMLInputElement>) {
        const contourInc = parseInt(event.target.value, 10);
        if (contourInc > 0) {
            setContourIncValue(contourInc);
        }
    }
    function handleTimeOrIntervalSelectionChange(selectedSurfTimeIntervals: string[]) {
        console.debug("handleTimeOrIntervalSelectionChange()");
        const newTimeOrInterval = selectedSurfTimeIntervals[0] ?? null;
        setSelectedPropertyTimeOrInterval(newTimeOrInterval);
        if (newTimeOrInterval) {
            syncHelper.publishValue(SyncSettingKey.DATE, "global.syncValue.date", {
                timeOrInterval: newTimeOrInterval,
            });
        }
    }
    function handleTimeModeChange(event: React.ChangeEvent<HTMLInputElement>) {
        setTimeType(event.target.value as TimeType);
    }
    return (
        <div className="flex flex-col gap-2 overflow-y-auto">
            <CollapsibleGroup expanded={true} title="Ensemble and realization">
                <Label text="Ensemble" synced={syncHelper.isSynced(SyncSettingKey.ENSEMBLE)}>
                    <SingleEnsembleSelect
                        ensembleSet={ensembleSet}
                        value={computedEnsembleIdent ? computedEnsembleIdent : null}
                        onChange={handleEnsembleSelectionChange}
                    />
                </Label>
                <AggregationSelector
                    selectedAggregation={aggregation}
                    onAggregationSelectorChange={handleAggregationChanged}
                />
                {aggregation === null && (
                    <Label text="Realization:">
                        <Input type={"number"} value={realizationNum} onChange={handleRealizationTextChanged} />
                    </Label>
                )}
            </CollapsibleGroup>
            <CollapsibleGroup expanded={true} title="Depth surface">
                <ApiStateWrapper
                    apiResult={meshSurfDirQuery}
                    errorComponent={"Error loading surface directory"}
                    loadingComponent={<CircularProgress />}
                >
                    <Label
                        text="Stratigraphic name"
                        labelClassName={syncHelper.isSynced(SyncSettingKey.SURFACE) ? "bg-indigo-700 text-white" : ""}
                    >
                        <Select
                            options={meshSurfNameOptions}
                            value={computedMeshSurfaceName ? [computedMeshSurfaceName] : []}
                            onChange={handleMeshSurfNameSelectionChange}
                            size={5}
                        />
                    </Label>
                    <Label
                        text="Attribute"
                        labelClassName={syncHelper.isSynced(SyncSettingKey.SURFACE) ? "bg-indigo-700 text-white" : ""}
                    >
                        <Select
                            options={meshSurfAttributeOptions}
                            value={computedMeshSurfaceAttribute ? [computedMeshSurfaceAttribute] : []}
                            onChange={handleMeshSurfAttributeSelectionChange}
                            size={5}
                        />
                    </Label>
                </ApiStateWrapper>
            </CollapsibleGroup>
            <CollapsibleGroup expanded={false} title="Property surface (color)">
                <>
                    <Label
                        wrapperClassName=" flow-root mt-4 mb-2"
                        labelClassName="float-left block text-sm font-medium text-gray-700 dark:text-gray-200"
                        text={"Enable"}
                    >
                        <div className=" float-right">
                            <Checkbox
                                onChange={(e: any) => setUsePropertySurface(e.target.checked)}
                                checked={usePropertySurface}
                            />
                        </div>
                    </Label>
                    {usePropertySurface && (
                        <ApiStateWrapper
                            apiResult={propertySurfDirQuery}
                            errorComponent={"Error loading surface directory"}
                            loadingComponent={<CircularProgress />}
                        >
                            {" "}
                            <RadioGroup
                                value={timeType}
                                direction="horizontal"
                                options={Object.values(TimeType).map((val: TimeType) => {
                                    return { value: val, label: TimeTypeEnumToStringMapping[val] };
                                })}
                                onChange={handleTimeModeChange}
                            />
                            <Label
                                text="Stratigraphic name"
                                labelClassName={
                                    syncHelper.isSynced(SyncSettingKey.SURFACE) ? "bg-indigo-700 text-white" : ""
                                }
                            >
                                <Select
                                    options={propertySurfNameOptions}
                                    value={computedPropertySurfaceName ? [computedPropertySurfaceName] : []}
                                    onChange={handlePropertySurfNameSelectionChange}
                                    size={5}
                                />
                            </Label>
                            <Label
                                text="Attribute"
                                labelClassName={
                                    syncHelper.isSynced(SyncSettingKey.SURFACE) ? "bg-indigo-700 text-white" : ""
                                }
                            >
                                <Select
                                    options={propertySurfAttributeOptions}
                                    value={computedPropertySurfaceAttribute ? [computedPropertySurfaceAttribute] : []}
                                    onChange={handlePropertySurfAttributeSelectionChange}
                                    size={5}
                                />
                            </Label>
                            {timeType !== TimeType.None && (
                                <Label text={timeType === TimeType.TimePoint ? "Time Point" : "Time Interval"}>
                                    <Select
                                        options={propertySurfTimeOrIntervalOptions}
                                        value={computedPropertyTimeOrInterval ? [computedPropertyTimeOrInterval] : []}
                                        onChange={handleTimeOrIntervalSelectionChange}
                                        size={5}
                                    />
                                </Label>
                            )}
                        </ApiStateWrapper>
                    )}
                </>
            </CollapsibleGroup>
            <CollapsibleGroup expanded={false} title="Fault polygons">
                <Label
                    wrapperClassName=" flow-root mt-4 mb-2"
                    labelClassName="float-left block text-sm font-medium text-gray-700 dark:text-gray-200"
                    text={"Enable"}
                >
                    <div className=" float-right">
                        <Checkbox onChange={(e: any) => setShowPolygon(e.target.checked)} checked={showPolygon} />
                    </div>
                </Label>
                {showPolygon && (
                    <ApiStateWrapper
                        apiResult={polygonDirQuery}
                        errorComponent={"Error loading polygons directory"}
                        loadingComponent={<CircularProgress />}
                    >
                        <Label text="Stratigraphic name">
                            <>
                                <Label
                                    wrapperClassName=" flow-root"
                                    labelClassName="float-left"
                                    text={"Use surface stratigraphy"}
                                >
                                    <div className=" float-right">
                                        <Checkbox
                                            onChange={(e: any) => setLinkPolygonNameToSurfaceName(e.target.checked)}
                                            checked={linkPolygonNameToSurfaceName}
                                        />
                                    </div>
                                </Label>
                                <Select
                                    options={polyNameOptions}
                                    value={computedPolygonName ? [computedPolygonName] : []}
                                    onChange={handlePolyNameSelectionChange}
                                    size={5}
                                    disabled={linkPolygonNameToSurfaceName}
                                />
                            </>
                        </Label>

                        <Label text="Attribute">
                            <Select
                                options={polyAttributesOptions}
                                value={computedPolygonAttribute ? [computedPolygonAttribute] : []}
                                placeholder={
                                    linkPolygonNameToSurfaceName
                                        ? `No attributes found for ${computedMeshSurfaceName}`
                                        : `No attributes found for ${computedPolygonName}`
                                }
                                onChange={handlePolyAttributeSelectionChange}
                                size={5}
                            />
                        </Label>
                    </ApiStateWrapper>
                )}
            </CollapsibleGroup>
            <CollapsibleGroup expanded={false} title="Well data">
                <ApiStateWrapper
                    apiResult={wellHeadersQuery}
                    errorComponent={"Error loading wells"}
                    loadingComponent={<CircularProgress />}
                >
                    <Label text="Official Wells">
                        <>
                            <div>
                                <Button
                                    className="float-left m-2 text-xs py-0"
                                    variant="outlined"
                                    onClick={() => showAllWells(wellHeaderOptions)}
                                >
                                    Select all
                                </Button>
                                <Button className="m-2 text-xs py-0" variant="outlined" onClick={hideAllWells}>
                                    Select none
                                </Button>
                            </div>
                            <Select
                                options={wellHeaderOptions}
                                value={selectedWellUuids}
                                onChange={(selectedWellUuids: string[]) =>
                                    handleWellsChange(selectedWellUuids, wellHeaderOptions)
                                }
                                size={10}
                                multiple={true}
                            />
                        </>
                    </Label>
                </ApiStateWrapper>
            </CollapsibleGroup>
            <CollapsibleGroup expanded={false} title="View settings">
                <div>
                    <div className="p-2">
                        <Header text="Surface" />
                        <LabelledCheckbox
                            label="Contours"
                            checked={showContour}
                            onChange={(e: any) => setShowContour(e.target.checked)}
                        />
                        {showContour && (
                            <>
                                <Label
                                    wrapperClassName="  flex flex-row"
                                    labelClassName="text-xs"
                                    text={"Contour start/increment"}
                                >
                                    <>
                                        <div className=" float-right">
                                            <Input
                                                className="text-xs"
                                                type={"number"}
                                                value={contourStartValue}
                                                onChange={handleContourStartChange}
                                            />
                                        </div>
                                        <div className=" float-right">
                                            <Input
                                                className="text-xs"
                                                type={"number"}
                                                value={contourIncValue}
                                                onChange={handleContourIncChange}
                                            />
                                        </div>
                                    </>
                                </Label>
                            </>
                        )}
                        <LabelledCheckbox
                            label="Grid lines"
                            checked={showGrid}
                            onChange={(e: any) => setShowGrid(e.target.checked)}
                        />
                        <LabelledCheckbox
                            label="Smooth shading"
                            checked={showSmoothShading}
                            onChange={(e: any) => setShowSmoothShading(e.target.checked)}
                        />
                        <LabelledCheckbox
                            label="Material"
                            checked={showMaterial}
                            onChange={(e: any) => setShowMaterial(e.target.checked)}
                        />
                    </div>
                    <div className="p-2">
                        <Header text="View" />
                        <LabelledCheckbox
                            label="Show 3D"
                            checked={show3D}
                            onChange={(e: any) => setShow3D(e.target.checked)}
                        />
                    </div>
                </div>
            </CollapsibleGroup>
        </div>
    );
}

type PartialSurfSpec = {
    surfaceName: string | null;
    surfaceAttribute: string | null;
    timeOrInterval: string | null;
};

function fixupSurface(
    surfaceDirectory: SurfaceDirectory,
    selectedSurface: PartialSurfSpec,
    syncedSurface: PartialSurfSpec
): PartialSurfSpec {
    const surfaceNames = surfaceDirectory.getSurfaceNames(null);
    const finalSurfaceName = fixupSyncedOrSelectedOrFirstValue(
        syncedSurface.surfaceName,
        selectedSurface.surfaceName,
        surfaceNames
    );
    let finalSurfaceAttribute: string | null = null;
    let finalTimeOrInterval: string | null = null;
    if (finalSurfaceName) {
        const surfaceAttributes = surfaceDirectory.getAttributeNames(finalSurfaceName);
        finalSurfaceAttribute = fixupSyncedOrSelectedOrFirstValue(
            syncedSurface.surfaceAttribute,
            selectedSurface.surfaceAttribute,
            surfaceAttributes
        );
    }
    if (finalSurfaceName && finalSurfaceAttribute) {
        const selectedTimeOrIntervals = surfaceDirectory.getTimeOrIntervalStrings(
            finalSurfaceName,
            finalSurfaceAttribute
        );
        finalTimeOrInterval = fixupSyncedOrSelectedOrFirstValue(
            syncedSurface.timeOrInterval,
            selectedSurface.timeOrInterval,
            selectedTimeOrIntervals
        );
    }
    return {
        surfaceName: finalSurfaceName,
        surfaceAttribute: finalSurfaceAttribute,
        timeOrInterval: finalTimeOrInterval,
    };
}

function fixupSyncedOrSelectedOrFirstValue(
    syncedValue: string | null,
    selectedValue: string | null,
    values: string[]
): string | null {
    if (syncedValue && values.includes(syncedValue)) {
        return syncedValue;
    }
    if (selectedValue && values.includes(selectedValue)) {
        return selectedValue;
    }
    if (values.length) {
        return values[0];
    }
    return null;
}

function isoStringToDateLabel(input: string): string {
    const date = input.split("T")[0];
    return `${date}`;
}

function isoIntervalStringToDateLabel(input: string): string {
    const [start, end] = input.split("/");
    const startDate = start.split("T")[0];
    const endDate = end.split("T")[0];
    return `${startDate}/${endDate}`;
}