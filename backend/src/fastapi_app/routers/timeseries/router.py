import datetime
import logging
from typing import List, Optional, Sequence, Union

from fastapi import APIRouter, Depends, HTTPException, Query

from ....services.summary_vector_statistics import compute_vector_statistics
from ....services.sumo_access.summary_access import Frequency, SummaryAccess
from ....services.utils.authenticated_user import AuthenticatedUser
from ....services.utils.perf_timer import PerfTimer
from ...auth.auth_helper import AuthHelper
from . import converters
from . import schemas

LOGGER = logging.getLogger(__name__)

router = APIRouter()


@router.get("/vector_names_and_description/")
async def get_vector_names_and_descriptions(
    # fmt:off
    authenticated_user: AuthenticatedUser = Depends(AuthHelper.get_authenticated_user),
    case_uuid: str = Query(description="Sumo case uuid"),
    ensemble_name: str = Query(description="Ensemble name"),
    exclude_all_values_zero: bool = Query(False, description="Exclude all vectors where all values are zero"),
    exclude_all_values_constant: bool = Query(False, description="Exclude all vectors where all values are the same value"),
    # fmt:on
) -> List[schemas.VectorDescription]:
    """Get all vector names and descriptive names in a given Sumo ensemble"""

    access = SummaryAccess(authenticated_user.get_sumo_access_token(), case_uuid, ensemble_name)
    vector_names = access.get_vector_names()

    ret_arr: List[schemas.VectorDescription] = [
        schemas.VectorDescription(name=vector_name, descriptive_name=vector_name, has_historical=False) for vector_name in vector_names
    ]

    return ret_arr


@router.get("/realizations_vector_data/")
async def get_realizations_vector_data(
    # fmt:off
    authenticated_user: AuthenticatedUser = Depends(AuthHelper.get_authenticated_user),
    case_uuid: str = Query(description="Sumo case uuid"),
    ensemble_name: str = Query(description="Ensemble name"),
    vector_name: str = Query(description="Name of the vector"),
    resampling_frequency: Optional[schemas.Frequency] = Query(None, description="Resampling frequency. If not specified, raw data without resampling wil be returned."),
    realizations: Optional[Sequence[int]] = Query(None, description="Optional list of realizations to include. If not specified, all realizations will be returned."),
    relative_to_timestamp: Optional[datetime.datetime] = Query(None, description="Calculate relative to timestamp"),
    # fmt:on
) -> List[schemas.VectorRealizationData]:
    """Get vector data per realization"""

    access = SummaryAccess(authenticated_user.get_sumo_access_token(), case_uuid, ensemble_name)

    sumo_freq = Frequency.from_string_value(resampling_frequency.value if resampling_frequency else "dummy")
    sumo_vec_arr = access.get_vector(vector_name=vector_name, resampling_frequency=sumo_freq, realizations=realizations)

    ret_arr: List[schemas.VectorRealizationData] = []
    for vec in sumo_vec_arr:
        ret_arr.append(schemas.VectorRealizationData(realization=vec.realization, timestamps=vec.timestamps, values=vec.values, unit=vec.metadata.unit, is_rate=vec.metadata.is_rate))

    return ret_arr


@router.get("/vector_metadata/")
async def get_vector_metadata(
    authenticated_user: AuthenticatedUser = Depends(AuthHelper.get_authenticated_user),
    case_uuid: str = Query(description="Sumo case uuid"),
    ensemble_name: str = Query(description="Ensemble name"),
    vector_name: str = Query(description="Name of the vector"),
) -> schemas.VectorMetadata:
    """Get metadata for the specified vector. Returns None if no metadata
    exists or if any of the non-optional properties of `VectorMetadata` are missing."""

    ...


@router.get("/timestamps/")
async def get_timestamps(
    authenticated_user: AuthenticatedUser = Depends(AuthHelper.get_authenticated_user),
    case_uuid: str = Query(description="Sumo case uuid"),
    ensemble_name: str = Query(description="Ensemble name"),
    resampling_frequency: Optional[schemas.Frequency] = Query(None, description="Resampling frequency"),
    realizations: Union[Sequence[int], None] = Query(None, description="Optional list of realizations to include"),
) -> List[datetime.datetime]:
    """Get the intersection of available timestamps.
        Note that when resampling_frequency is None, the pure intersection of the
    stored raw dates will be returned. Thus the returned list of dates will not include
    dates from long running realizations.
    For other resampling frequencies, the date range will be expanded to cover the entire
    time range of all the requested realizations before computing the resampled dates."""

    ...


@router.get("/historical_vector_data/")
async def get_historical_vector_data(
    authenticated_user: AuthenticatedUser = Depends(AuthHelper.get_authenticated_user),
    case_uuid: str = Query(description="Sumo case uuid"),
    non_historical_vector_name: str = Query(description="Name of the non-historical vector"),
    resampling_frequency: Optional[schemas.Frequency] = Query(None, description="Resampling frequency"),
    relative_to_timestamp: Optional[datetime.datetime] = Query(None, description="Calculate relative to timestamp"),
) -> schemas.VectorHistoricalData:
    ...


@router.get("/statistical_vector_data/")
async def get_statistical_vector_data(
    # fmt:off
    authenticated_user: AuthenticatedUser = Depends(AuthHelper.get_authenticated_user),
    case_uuid: str = Query(description="Sumo case uuid"),
    ensemble_name: str = Query(description="Ensemble name"),
    vector_name: str = Query(description="Name of the vector"),
    resampling_frequency: schemas.Frequency = Query(description="Resampling frequency"),
    statistic_functions: Optional[Sequence[schemas.StatisticFunction]] = Query(None, description="Optional list of statistics to calculate. If not specified, all statistics will be calculated."),
    realizations: Optional[Sequence[int]] = Query(None, description="Optional list of realizations to include. If not specified, all realizations will be included."),
    relative_to_timestamp: Optional[datetime.datetime] = Query(None, description="Calculate relative to timestamp"),
    # fmt:on
) -> schemas.VectorStatisticData:
    """Get statistical vector data for an ensemble"""

    access = SummaryAccess(authenticated_user.get_sumo_access_token(), case_uuid, ensemble_name)

    service_freq = Frequency.from_string_value(resampling_frequency.value)
    service_stat_funcs_to_compute = converters.to_service_statistic_functions(statistic_functions)

    vector_table, vector_metadata = access.get_vector_table(vector_name=vector_name, resampling_frequency=service_freq, realizations=realizations)

    statistics = compute_vector_statistics(vector_table, vector_name, service_stat_funcs_to_compute)
    if not statistics:
        raise HTTPException(status_code=404, detail="Could not compute statistics")

    ret_data: schemas.VectorStatisticData = converters.to_api_vector_statistic_data(statistics, vector_metadata)

    return ret_data


@router.get("/realizations_calculated_vector_data/")
async def get_realizations_calculated_vector_data(
    authenticated_user: AuthenticatedUser = Depends(AuthHelper.get_authenticated_user),
    case_uuid: str = Query(description="Sumo case uuid"),
    ensemble_name: str = Query(description="Ensemble name"),
    expression: schemas.VectorExpressionInfo = Depends(),
    resampling_frequency: Optional[schemas.Frequency] = Query(None, description="Resampling frequency"),
    relative_to_timestamp: Optional[datetime.datetime] = Query(None, description="Calculate relative to timestamp"),
) -> str:
    """Get calculated vector data per realization"""
    print(expression)
    print(type(expression))
    return "hei"


# @router.get("/statistical_calculated_vector_data/")
# async def get_statistical_calculated_vector_data(
#     authenticated_user: AuthenticatedUser = Depends(AuthHelper.get_authenticated_user),
#     sumo_case_id: str = Query(None, description="Sumo case id"),
#     sumo_iteration_id: str = Query(None, description="Sumo iteration id"),
#     statistic: List[schemas.timeseries.StatisticsOptions] = Query(
#         None, description="Statistical calculations to apply"
#     ),
#     vector_name: str = Query(None, description="Name of the vector"),
#     resampling_frequency: Optional[schemas.timeseries.Frequency] = Query(None, description="Resampling frequency"),
#     realizations: Union[Sequence[int], None] = Query(None, description="Optional list of realizations to include"),
#     relative_to_timestamp: Optional[datetime.datetime] = Query(None, description="Calculate relative to timestamp"),
#     expressions: Optional[List[schemas.timeseries.VectorExpressionInfo]] = None,
# ) -> List[schemas.timeseries.VectorRealizationData]:
#     """Get calculated vector data for an ensemble"""
#     ...