import typia from 'typia';

import {
    Convert,
    ConvertExcludeError,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    convertExcludeError,
    mergeRecord,
    convertValue,
    ConvertType,
} from '../commons';

import {
    SoslClausesType,
    FieldSpecType,
    SoslFieldType,
    SoslLiteralType,
    SoslLiteralAltType,
} from '../converter';
import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';
import { FieldJson } from './select';
import { LogicalConditionJson, makeLogicalConditionJson } from './commons';
import { makeFieldOrderJson } from './orderBy';
import { makeLimitJson, LimitJson } from './limit';
import { makeOffsetJson, OffsetJson } from './offset';
import { BaseExpressionJson, makeExpressionJsonConvert } from '../expression';
import { SoslWithJson, makeSoslWithJson } from './with';
import { UpdateListJson, makeUpdateListJson } from './updateList';

type SoslFieldJson = JsonType<'soslField'> & {
    field: string[] | Omit<SoqlFunctionJson, 'sourceKeys'> | ErrorJson;
    func?: 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT';
};

const makeSoslFieldJson = (
    target: ConvertType<SoslFieldType>,
    targetRecords?: Record<string, string[]>,
): SoslFieldJson | ErrorJson => {
    return convertValue<'soslField', SoslFieldType, SoslFieldJson>(
        ['soslField'],
        target,
        'soslField',
        (target, targetRecords) => {
            const field =
                target.value.type === 'soslId'
                    ? target.value.value.map((v) => v.value)
                    : makeSoqlFunctionJson(target.value);

            if (Array.isArray(field) || field.kind === 'error') {
                return makeJsonType('soslField', targetRecords, {
                    field: field,
                    ...(target.func ? { func: target.func } : {}),
                });
            } else {
                const { sourceKeys, ...rest } = field;
                return makeJsonType('soslField', targetRecords, {
                    field: rest,
                    ...(target.func ? { func: target.func } : {}),
                });
            }
        },
        targetRecords,
    );
};

type FieldSpecJson = {
    object: string[];
    field?: (SoslFieldJson | ErrorJson)[];
    where?: LogicalConditionJson;
    orderBy?: (
        | ((FieldJson | SoqlFunctionJson) & {
              direction?: 'ASC' | 'DESC';
              nulls?: 'FIRST' | 'LAST';
          })
        | ErrorJson
    )[];
    listView?: string[];
    limit?: LimitJson | ErrorJson;
    offset?: OffsetJson | ErrorJson;
};

const makeFieldSpecJson = (target: ConvertExcludeError<FieldSpecType>): FieldSpecJson => {
    return {
        object: target.value.value.map((v) => v.value),
        ...(target.fieldList
            ? {
                  field: target.fieldList.value.map((f) => makeSoslFieldJson(f)),
              }
            : {}),
        ...(target.where ? { where: makeLogicalConditionJson(target.where) } : {}),
        ...(target.orderBy
            ? { orderBy: target.orderBy.value.map((v) => makeFieldOrderJson(v)) }
            : {}),
        ...(target.listView ? { listView: target.listView.value.map((v) => v.value) } : {}),
        ...(target.limitClause ? { limit: makeLimitJson(target.limitClause) } : {}),
        ...(target.offsetClause ? { offset: makeOffsetJson(target.offsetClause) } : {}),
    };
};

export type SoslJson = {
    find: string | BaseExpressionJson | ErrorJson;
    group?: 'ALL' | 'EMAIL' | 'NAME' | 'PHONE' | 'SIDEBAR';
    fieldSpec?: Omit<FieldSpecJson | ErrorJson, 'sourceKeys'>[];
    with?: Omit<SoslWithJson | ErrorJson, 'sourceKeys'>[];
    limit?: Omit<LimitJson | ErrorJson, 'sourceKeys'>;
    update?: Omit<UpdateListJson | ErrorJson, 'sourceKeys'>;
};

export const makeSoslJson = (
    target: ConvertExcludeError<SoslLiteralType | SoslLiteralAltType>,
): SoslJson => {
    const find =
        typeof target.value === 'string'
            ? (target.value.match(/\[\s*FIND\s+(['"])(.*?)\1/i)?.[2] ?? target.value)
            : makeExpressionJsonConvert(target.value.value);

    return {
        find: find,
        ...(target.soslClauses.value ? { group: target.soslClauses.value.value } : {}),
        ...(target.soslClauses.fieldSpecList
            ? {
                  fieldSpec: target.soslClauses.fieldSpecList.value.map((item) =>
                      makeFieldSpecJson(item),
                  ),
              }
            : {}),
        ...(target.soslClauses.withList
            ? {
                  with: target.soslClauses.withList.map((item) => makeSoslWithJson(item)),
              }
            : {}),
        ...(target.soslClauses.limitClause
            ? { limit: makeLimitJson(target.soslClauses.limitClause) }
            : {}),
        ...(target.soslClauses.updateList
            ? {
                  update: makeUpdateListJson(target.soslClauses.updateList),
              }
            : {}),
    };
};
