import typia from 'typia';

import {
    Convert,
    isConvert,
    ErrorJson,
    JsonType,
    SourceJson,
    searchConvertAll,
    isError,
    writeSourceKeys,
    removeSourceInfo,
    castExcludeErrorInfo,
    castExcludeErrorInfoArray,
    castConvert,
    castConvertArray,
    isErrorJson,
} from '../commons';

import {
    WithClauseType,
    FilteringExpressionType,
    DataCategorySelectionType,
    DataCategoryNameType,
    FilteringSelectorType,
} from '../converter';

import { makeLogicalConditionJson, LogicalConditionJson } from './commons';

const makeDataCategoryNameJson = (target: Convert<DataCategoryNameType>): string[] => {
    return castConvertArray(castExcludeErrorInfoArray(target.value)).map(
        (v) => castConvert(castExcludeErrorInfo(v.value)).value,
    );
};

export type DataCategorySelectionJson = {
    group: string;
    selector: string;
    field: string[];
};

export const isDataCategorySelectionJson = typia.createIs<DataCategorySelectionJson>();

const makeDataCategorySelectionJson = (
    target: Convert<DataCategorySelectionType>,
): DataCategorySelectionJson => {
    const group = castConvert(
        castExcludeErrorInfo(castConvert(castExcludeErrorInfo(target.value)).value),
    ).value;
    const selector = castExcludeErrorInfo(castConvert(castExcludeErrorInfo(target.selector)).value);
    const field = makeDataCategoryNameJson(castConvert(castExcludeErrorInfo(target.category)));

    return {
        group: group,
        selector: selector,
        field: field,
    };
};

export type WithJson = JsonType & {
    kind: 'with';
    mode: string | LogicalConditionJson;
    selection?: DataCategorySelectionJson[];
};
export const isWithJson = typia.createIs<WithJson>();

export const makeWithJson = (
    target: Convert<WithClauseType>,
    sourceObject: SourceJson[],
): WithJson => {
    const mode = castExcludeErrorInfo(castConvert(castExcludeErrorInfo(target.mode)).value);
    const selection = castConvert(castExcludeErrorInfo(target.selection)).value.map(
        makeDataCategorySelectionJson,
    );

    return {
        kind: 'with',
        mode: mode,
        selection: selection,
    };
};
