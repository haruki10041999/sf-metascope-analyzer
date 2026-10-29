import {
    ErrorJson,
    JsonType,
    makeJsonType,
    convertValue,
    ConvertType,
    ConvertWithError,
    isErrorNode,
    makeErrorJson,
} from '../commons';

import {
    FieldSpecType,
    SoslFieldType,
    SoslIdType,
    SoslLiteralType,
    SoslLiteralAltType,
} from '../converter';
import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';
import { FieldOrderJson } from './orderBy';
import { LogicalConditionJson, makeLogicalConditionJson } from './commons';
import { makeFieldOrderJson } from './orderBy';
import { makeLimitJson, LimitJson } from './limit';
import { makeOffsetJson, OffsetJson } from './offset';
import { BaseExpressionJson, makeExpressionJsonConvert } from '../expression';
import { SoslWithJson, makeSoslWithJson } from './with';
import { UpdateListJson, makeUpdateListJson } from './updateList';

const ERROR_KIND = 'sosl';

type SoslFieldJson = JsonType<'soslField'> & {
    field: string[] | SoqlFunctionJson;
    func?: 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT';
};

const makeSoslFieldJson = (target: ConvertType<SoslFieldType>): SoslFieldJson | ErrorJson => {
    return convertValue<'soslField', SoslFieldType, SoslFieldJson>(
        target,
        'soslField',
        (target, targetRecords) => {
            const field =
                target.value.type === 'soslId'
                    ? target.value.value.map((v) => v.value)
                    : makeSoqlFunctionJson(target.value);

            if (Array.isArray(field)) {
                return makeJsonType('soslField', targetRecords.base, {
                    field: field,
                    ...(target.func ? { func: target.func } : {}),
                });
            } else {
                return makeJsonType('soslField', targetRecords.base, {
                    field: field,
                    ...(target.func ? { func: target.func } : {}),
                });
            }
        },
    );
};

type FieldSpecJson = {
    object: (string | ErrorJson)[] | ErrorJson;
    field?: (SoslFieldJson | ErrorJson)[] | ErrorJson;
    where?: LogicalConditionJson | ErrorJson;
    orderBy?: (FieldOrderJson | ErrorJson)[] | ErrorJson;
    listView?: (string | ErrorJson)[] | ErrorJson;
    limit?: LimitJson | ErrorJson;
    offset?: OffsetJson | ErrorJson;
};

const makeSoslIdJson = (target: ConvertType<SoslIdType>): (string | ErrorJson)[] | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, ERROR_KIND);
    }
    return target.value.map((v) => (isErrorNode(v) ? makeErrorJson(v, ERROR_KIND) : v.value));
};

const makeFieldSpecJson = (target: ConvertType<FieldSpecType>): FieldSpecJson | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, ERROR_KIND);
    }

    const fieldList = target.fieldList;
    const orderBy = target.orderBy;
    return {
        object: makeSoslIdJson(target.value),
        ...(fieldList
            ? {
                  field: isErrorNode(fieldList)
                      ? makeErrorJson(fieldList, ERROR_KIND)
                      : fieldList.value.map((f) => makeSoslFieldJson(f)),
              }
            : {}),
        ...(target.where ? { where: makeLogicalConditionJson(target.where) } : {}),
        ...(orderBy
            ? {
                  orderBy: isErrorNode(orderBy)
                      ? makeErrorJson(orderBy, ERROR_KIND)
                      : orderBy.value.map((v) => makeFieldOrderJson(v)),
              }
            : {}),
        ...(target.listView ? { listView: makeSoslIdJson(target.listView) } : {}),
        ...(target.limitClause ? { limit: makeLimitJson(target.limitClause) } : {}),
        ...(target.offsetClause ? { offset: makeOffsetJson(target.offsetClause) } : {}),
    };
};

// SOSL 全体の位置を持つ境界ノード。句は子の変換関数がエラーを処理する
export type SoslJson = JsonType<'sosl'> & {
    find: string | BaseExpressionJson | ErrorJson;
    group?: 'ALL' | 'EMAIL' | 'NAME' | 'PHONE' | 'SIDEBAR';
    fieldSpec?: (FieldSpecJson | ErrorJson)[] | ErrorJson;
    with?: (SoslWithJson | ErrorJson)[];
    limit?: LimitJson | ErrorJson;
    update?: UpdateListJson | ErrorJson;
};

export const makeSoslJson = (
    target: ConvertType<SoslLiteralType | SoslLiteralAltType>,
): SoslJson | ErrorJson => {
    return convertValue<
        'soslLiteral' | 'soslLiteralAlt',
        SoslLiteralType | SoslLiteralAltType,
        SoslJson | ErrorJson
    >(
        target,
        'sosl',
        (sosl: ConvertWithError<SoslLiteralType | SoslLiteralAltType>, targetRecords) => {
            const content = makeSoslContentJson(sosl);
            return 'kind' in content ? content : makeJsonType('sosl', targetRecords.base, content);
        },
        { exclude: 'children' },
    );
};

const makeSoslContentJson = (
    target: ConvertWithError<SoslLiteralType | SoslLiteralAltType>,
): Omit<SoslJson, 'kind' | 'sourceKeys'> | ErrorJson => {
    const clauses = target.soslClauses;
    if (isErrorNode(clauses)) {
        return makeErrorJson(clauses, ERROR_KIND);
    }

    // 検索語は converter で FIND リテラルから取り出し済み
    const value = target.value;
    let find: string | BaseExpressionJson | ErrorJson;
    if (typeof value === 'string') {
        find = value;
    } else if (isErrorNode(value)) {
        find = makeErrorJson(value, ERROR_KIND);
    } else {
        find = makeExpressionJsonConvert(value.value);
    }

    const group = clauses.value;
    const fieldSpecList = clauses.fieldSpecList;
    return {
        find: find,
        ...(group && !isErrorNode(group) ? { group: group.value } : {}),
        ...(fieldSpecList
            ? {
                  fieldSpec: isErrorNode(fieldSpecList)
                      ? makeErrorJson(fieldSpecList, ERROR_KIND)
                      : fieldSpecList.value.map((item) => makeFieldSpecJson(item)),
              }
            : {}),
        ...(clauses.withList
            ? {
                  with: clauses.withList.map((item) => makeSoslWithJson(item)),
              }
            : {}),
        ...(clauses.limitClause ? { limit: makeLimitJson(clauses.limitClause) } : {}),
        ...(clauses.updateList
            ? {
                  update: makeUpdateListJson(clauses.updateList),
              }
            : {}),
    };
};
