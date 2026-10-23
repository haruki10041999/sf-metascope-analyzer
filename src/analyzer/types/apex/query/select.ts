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
    SelectListType,
    SelectEntryType,
    ErrorType,
    isFieldNameType,
    isSoqlFunctionType,
    isTypeOfType,
    isSubQueryType,
} from '../converter';

import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';
import { TypeOfJson, makeTypeOfJson } from './typeof';
import { SubQueryJson, makeSubQueryJson } from './subQuery';

export type SelectEntryJson = JsonType &
    (
        | { kind: 'selectEntry'; type: 'field'; field: string[] }
        | ({ kind: 'selectEntry' } & SoqlFunctionJson)
        | ({ kind: 'selectEntry' } & TypeOfJson)
        | ({ kind: 'selectEntry' } & SubQueryJson)
    ) & {
        alias?: string;
    };
export const isSelectEntryJson = typia.createIs<SelectEntryJson>();

const makeSelectEntryJson = (
    target: Convert<SelectEntryType | ErrorType>,
    sourceObject: SourceJson[],
): SelectEntryJson | ErrorJson => {
    const targetObjectKey = target.objectKey;
    const targetSourceKey = target.sourceKey;
    const convertJsons = searchConvertAll(target);

    removeSourceInfo(sourceObject, convertJsons, [targetSourceKey]);
    const error: ErrorJson = {
        kind: 'error',
        kindType: 'selectEntry',
        sourceKeys: {},
    };
    writeSourceKeys(error, targetObjectKey, targetSourceKey);
    if (isError(convertJsons)) {
        return error;
    }

    const _target = target as Convert<SelectEntryType>;
    const entry = castConvert(castExcludeErrorInfo(_target.value));
    const alias = _target.alias
        ? castConvert(
              castExcludeErrorInfo(
                  castExcludeErrorInfo(castConvert(castExcludeErrorInfo(_target.alias))).value,
              ),
          ).value
        : null;

    let field:
        | { type: 'field'; field: string[] }
        | SoqlFunctionJson
        | TypeOfJson
        | SubQueryJson
        | undefined = undefined;
    if (isConvert(entry, isFieldNameType)) {
        field = {
            type: 'field',
            field: castConvertArray(castExcludeErrorInfoArray(entry.value)).map(
                (v) => castConvert(castExcludeErrorInfo(v.value)).value,
            ),
        };
    }

    if (isConvert(entry, isSoqlFunctionType)) {
        field = makeSoqlFunctionJson(entry);
    }
    if (isConvert(entry, isTypeOfType)) {
        field = makeTypeOfJson(entry);
    }
    if (isConvert(entry, isSubQueryType)) {
        field = makeSubQueryJson(entry);
    }

    if (field) {
        const selectEntryJson: SelectEntryJson = {
            kind: 'selectEntry',
            sourceKeys: {},
            ...field,
        };
        writeSourceKeys(selectEntryJson, targetObjectKey, targetSourceKey);

        if (alias) {
            selectEntryJson.alias = alias;
        }

        return selectEntryJson;
    }

    return error;
};

export type SelectJson = {
    field?: SelectEntryJson[];
    soqlFunction?: SelectEntryJson[];
    typeOf?: SelectEntryJson[];
    subQuery?: SelectEntryJson[];
    error?: ErrorJson[];
};
export const isSelectJson = typia.createIs<SelectJson>();

export const makeSelectJson = (target: Convert<SelectListType>, sourceObject: SourceJson[]) => {
    const values = castConvertArray(castExcludeErrorInfoArray(target.value));

    const selectJson: SelectJson = {};

    values.forEach((value) => {
        const selectEntry = makeSelectEntryJson(value, sourceObject);

        if (isErrorJson(selectEntry)) {
            if (!selectJson.error) {
                selectJson.error = [];
            }
            selectJson.error.push(selectEntry);
        } else {
            if (selectEntry.kind === 'selectEntry') {
                if (selectEntry.type === 'field') {
                    if (!selectJson.field) {
                        selectJson.field = [];
                    }
                    selectJson.field.push(selectEntry);
                } else if (selectEntry.type === 'soqlFunction') {
                    if (!selectJson.soqlFunction) {
                        selectJson.soqlFunction = [];
                    }
                    selectJson.soqlFunction.push(selectEntry);
                } else if (selectEntry.type === 'typeOf') {
                    if (!selectJson.typeOf) {
                        selectJson.typeOf = [];
                    }
                    selectJson.typeOf.push(selectEntry);
                } else if (selectEntry.type === 'subQuery') {
                    if (!selectJson.subQuery) {
                        selectJson.subQuery = [];
                    }
                    selectJson.subQuery.push(selectEntry);
                }
            }
        }
    });

    return selectJson;
};
