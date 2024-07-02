import React from "react";

import { Ensemble } from "@framework/Ensemble";
import { EnsembleIdent } from "@framework/EnsembleIdent";
import { ModuleViewProps } from "@framework/Module";
import { useViewStatusWriter } from "@framework/StatusWriter";
import { useEnsembleSet } from "@framework/WorkbenchSession";
import { CircularProgress } from "@lib/components/CircularProgress";
import { useElementSize } from "@lib/hooks/useElementSize";
import { ContentMessage, ContentMessageType } from "@modules/_shared/components/ContentMessage/contentMessage";
import { makeDistinguishableEnsembleDisplayName } from "@modules/_shared/ensembleNameUtils";

import { Interface, State } from "./state";
// import { PvtDataAccessor } from "./utils/PvtDataAccessor";
// import { PvtPlotBuilder } from "./utils/PvtPlotBuilder";

export function View({ viewContext }: ModuleViewProps<State, Interface>) {
    return (
        <div className="w-full h-full">VFP </div>
    );
}