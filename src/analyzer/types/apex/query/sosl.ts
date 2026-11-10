import { JsonType } from '../../commons';
import type {
    FieldSpecTypeClass,
    SoslClausesTypeClass,
    SoslFieldTypeClass,
    SoslIdTypeClass,
    SoslLiteralAltTypeClass,
    SoslLiteralTypeClass,
} from '../../apex_IR';

import { makeNodeJson } from '../commons/node';
import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';
import { FieldOrderJson } from './orderBy';
import { LogicalConditionJson, makeLogicalConditionJson } from './commons';
import { makeFieldOrderJson } from './orderBy';
import { makeLimitJson, LimitJson } from './limit';
import { makeOffsetJson, OffsetJson } from './offset';
import { BaseExpressionJson, makeExpressionJsonConvert } from '../expression';
import { SoslWithJson, makeSoslWithJson } from './with';
import { UpdateListJson, makeUpdateListJson } from './updateList';

// FindLiteral（[FIND '...'）/ FindLiteralAlt（[FIND {...}）のトークンから検索語だけを取り出す。
// 形式が想定外のときはトークンの文字列をそのまま返す (v1 の converter の extractFindSearchTerm と同じ)。
// converter (generic.ts) が同じ名前を export しているあいだは、types/apex の export * とぶつかるので export しない
const FIND_LITERAL_PATTERN = /^\[\s*FIND\s*(?:'((?:\\.|[^\\'])*)'|\{((?:\\.|[^\\}])*)\})\s*$/i;

const extractFindSearchTerm = (token: string): string => {
    const match = token.match(FIND_LITERAL_PATTERN);
    return match ? (match[1] ?? match[2] ?? token) : token;
};

export type SoslFieldJson = JsonType<'soslField'> & {
    field: string[] | SoqlFunctionJson;
    func?: 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT';
};

const makeSoslIdJson = (target: SoslIdTypeClass): string[] => {
    return target.getFields().value.map((v) => v.getFields().value);
};

// 関数のあとの別名 (TOLABEL(x) alias など) は、v1 と同じく JSON に出さない
const makeSoslFieldJson = (target: SoslFieldTypeClass): SoslFieldJson => {
    const fields = target.getFields();
    const value = fields.value;
    const field = value.kind === 'soslId' ? makeSoslIdJson(value) : makeSoqlFunctionJson(value);

    return makeNodeJson<SoslFieldJson>('soslField', target, {
        field: field,
        ...(fields.kind !== 'field' ? { func: fields.kind } : {}),
    });
};

export type FieldSpecJson = {
    object: string[];
    field?: SoslFieldJson[];
    where?: LogicalConditionJson;
    orderBy?: FieldOrderJson[];
    listView?: string[];
    limit?: LimitJson;
    offset?: OffsetJson;
};

const makeFieldSpecJson = (target: FieldSpecTypeClass): FieldSpecJson => {
    const { value, spec } = target.getFields();
    // 括弧の部分 (spec) がなければ、object だけを持つ
    if (!spec) {
        return { object: makeSoslIdJson(value) };
    }
    return {
        object: makeSoslIdJson(value),
        field: spec.fieldList.getFields().value.map((f) => makeSoslFieldJson(f)),
        ...(spec.where ? { where: makeLogicalConditionJson(spec.where) } : {}),
        ...(spec.orderBy
            ? {
                  orderBy: spec.orderBy.getFields().value.map((v) => makeFieldOrderJson(v)),
              }
            : {}),
        ...(spec.listView ? { listView: makeSoslIdJson(spec.listView) } : {}),
        ...(spec.limitClause ? { limit: makeLimitJson(spec.limitClause) } : {}),
        ...(spec.offsetClause ? { offset: makeOffsetJson(spec.offsetClause) } : {}),
    };
};

// SOSL 全体の位置を持つノード
export type SoslJson = JsonType<'sosl'> & {
    find: string | BaseExpressionJson;
    group?: 'ALL' | 'EMAIL' | 'NAME' | 'PHONE' | 'SIDEBAR';
    fieldSpec?: FieldSpecJson[];
    with?: SoslWithJson[];
    limit?: LimitJson;
    update?: UpdateListJson;
};

// soslPrimary から来るのは soslLiteral だけ (soslLiteralAlt は v1 と同じく、文法にはあるが今は通らない)
export const makeSoslJson = (target: SoslLiteralTypeClass | SoslLiteralAltTypeClass): SoslJson => {
    let find: string | BaseExpressionJson;
    let clauses: SoslClausesTypeClass;
    switch (target.kind) {
        case 'soslLiteral': {
            const { search, soslClauses } = target.getFields();
            // 検索語は FIND リテラルのトークンから取り出す。バインド式 (:var) は中の式を出す
            find =
                search.kind === 'literal'
                    ? extractFindSearchTerm(search.text)
                    : makeExpressionJsonConvert(search.expr.getFields().value);
            clauses = soslClauses;
            break;
        }
        case 'soslLiteralAlt': {
            const { value, soslClauses } = target.getFields();
            find = extractFindSearchTerm(value);
            clauses = soslClauses;
            break;
        }
    }

    const { value: group, fieldSpecList, withList, limitClause, updateList } = clauses.getFields();
    return makeNodeJson<SoslJson>('sosl', target, {
        find: find,
        ...(group ? { group: group.getFields().value } : {}),
        ...(fieldSpecList
            ? {
                  fieldSpec: fieldSpecList.getFields().value.map((item) => makeFieldSpecJson(item)),
              }
            : {}),
        ...(withList
            ? {
                  with: withList.map((item) => makeSoslWithJson(item)),
              }
            : {}),
        ...(limitClause ? { limit: makeLimitJson(limitClause) } : {}),
        ...(updateList
            ? {
                  update: makeUpdateListJson(updateList),
              }
            : {}),
    });
};
