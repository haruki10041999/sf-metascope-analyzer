import type {
    AssignmentJson,
    BaseExpressionJson,
    BinaryJson,
    CallJson,
    CastJson,
    ClassLiteralJson,
    ConditionalJson,
    DotMethodCallJson,
    IdentifierJson,
    IndexJson,
    InstanceofJson,
    JsonType,
    LiteralJson,
    LogicalJson,
    NewEntryJson,
    NewJson,
    ParenthesizedJson,
    SoqlJson,
    SoslJson,
    SuperJson,
    ThisJson,
    TypeJson,
    UnaryJson,
    UnsupportedJson,
} from '../../../types';

import {
    NodeDiff,
    OptionalDiff,
    ReplacementDiff,
    Sources,
    ValueDiff,
    getValueKey,
    makeNodeDiff,
    makeOptionalDiff,
    makeReplacementDiff,
    makeValueDiff,
    pairAsSequence,
} from '../../commons/diff/commons';
import { TypeJsonDiff, makeTypeDiff } from './type';
import { SoqlJsonDiff, makeSoqlDiff } from './query/soql';
import { SoslJsonDiff, makeSoslDiff } from './query/sosl';
import {
    TypedListDiff,
    TypedObjectDiff,
    makeTypedListDiff,
    makeTypedObjectDiff,
} from '../../commons/diff/list';

// Apex の式の差分 (docs/apex-implementation.md 6.4)。式はどれも kind を持つ (docs/json-redesign-plan.md の段階 A2) ので、
// 形から種類を推定せず kind で分ける。kind が違えば置き換え (ReplacementDiff)、同じならプロパティごとに比べる

export type ExpressionListDiff = TypedListDiff<BaseExpressionJson, BaseExpressionJsonDiff>;

type ExpressionDiffField = OptionalDiff<BaseExpressionJson, BaseExpressionJsonDiff>;
type ExpressionListDiffField = OptionalDiff<BaseExpressionJson[], ExpressionListDiff>;

export type DotMethodCallJsonDiff = NodeDiff<
    'memberAccess',
    DotMethodCallJson,
    {
        type: ValueDiff<DotMethodCallJson['type']>;
        object: BaseExpressionJsonDiff;
        operator: ValueDiff<DotMethodCallJson['operator']>;
        member: ValueDiff<string>;
        memberArg: OptionalDiff<NonNullable<DotMethodCallJson['memberArg']>, ExpressionListDiff>;
    }
>;
export type IdentifierJsonDiff = NodeDiff<
    'identifier',
    IdentifierJson,
    { name: ValueDiff<string> }
>;
export type ThisJsonDiff = NodeDiff<'this', ThisJson, Record<string, never>>;
export type SuperJsonDiff = NodeDiff<'super', SuperJson, Record<string, never>>;
export type LiteralJsonDiff = NodeDiff<
    LiteralJson['kind'],
    LiteralJson,
    { value: OptionalDiff<string | boolean, ValueDiff<string | boolean>> }
>;
export type ClassLiteralJsonDiff = NodeDiff<
    'classLiteral',
    ClassLiteralJson,
    { classType: TypeJsonDiff | ValueDiff<'void'> | ReplacementDiff<TypeJson | 'void'> }
>;
export type UnsupportedJsonDiff = NodeDiff<
    'unsupported',
    UnsupportedJson,
    { nodeType: ValueDiff<string> }
>;
export type CallJsonDiff = NodeDiff<
    'call',
    CallJson,
    { callee: BaseExpressionJsonDiff; arg: ExpressionListDiff }
>;
export type NewEntryJsonDiff = TypedObjectDiff<
    NewEntryJson,
    { key: BaseExpressionJsonDiff; value: BaseExpressionJsonDiff }
>;
export type NewEntryListDiff = TypedListDiff<NewEntryJson, NewEntryJsonDiff>;
export type NewJsonDiff = NodeDiff<
    'new',
    NewJson,
    {
        newType: TypeJsonDiff;
        arg: ExpressionListDiffField;
        elements: ExpressionListDiffField;
        entries: OptionalDiff<NewEntryJson[], NewEntryListDiff>;
        size: ExpressionDiffField;
    }
>;
export type CastJsonDiff = NodeDiff<
    'cast',
    CastJson,
    { expression: BaseExpressionJsonDiff; convertType: TypeJsonDiff }
>;
export type ParenthesizedJsonDiff = NodeDiff<
    'parenthesized',
    ParenthesizedJson,
    { expression: BaseExpressionJsonDiff }
>;
export type IndexJsonDiff = NodeDiff<
    'index',
    IndexJson,
    { object: BaseExpressionJsonDiff; index: BaseExpressionJsonDiff }
>;
export type OperatorJsonDiff<T extends BinaryJson | LogicalJson | AssignmentJson> = NodeDiff<
    T['kind'],
    T,
    {
        left: BaseExpressionJsonDiff;
        operator: ValueDiff<T['operator']>;
        right: BaseExpressionJsonDiff;
    }
>;
export type InstanceofJsonDiff = NodeDiff<
    'instanceof',
    InstanceofJson,
    { expression: BaseExpressionJsonDiff; checkType: TypeJsonDiff }
>;
export type UnaryJsonDiff = NodeDiff<
    'unary',
    UnaryJson,
    {
        operator: ValueDiff<UnaryJson['operator']>;
        operatorLocation: ValueDiff<UnaryJson['operatorLocation']>;
        argument: BaseExpressionJsonDiff;
    }
>;
export type ConditionalJsonDiff = NodeDiff<
    'conditional',
    ConditionalJson,
    {
        condition: BaseExpressionJsonDiff;
        trueValue: BaseExpressionJsonDiff;
        falseValue: BaseExpressionJsonDiff;
    }
>;

/**
 * 入力の式の型に対応する差分の型。
 * 形が変わった (kind が違う) ときは、kind / sourceKeys を分けて値を丸ごと持つ ReplacementDiff になる
 */
export type BaseExpressionJsonDiff<T extends BaseExpressionJson = BaseExpressionJson> =
    | (T extends IdentifierJson
          ? IdentifierJsonDiff
          : T extends ThisJson
            ? ThisJsonDiff
            : T extends SuperJson
              ? SuperJsonDiff
              : T extends LiteralJson
                ? LiteralJsonDiff
                : T extends ClassLiteralJson
                  ? ClassLiteralJsonDiff
                  : T extends UnsupportedJson
                    ? UnsupportedJsonDiff
                    : T extends SoqlJson
                      ? SoqlJsonDiff
                      : T extends SoslJson
                        ? SoslJsonDiff
                        : T extends DotMethodCallJson
                          ? DotMethodCallJsonDiff
                          : T extends CallJson
                            ? CallJsonDiff
                            : T extends NewJson
                              ? NewJsonDiff
                              : T extends CastJson
                                ? CastJsonDiff
                                : T extends ParenthesizedJson
                                  ? ParenthesizedJsonDiff
                                  : T extends IndexJson
                                    ? IndexJsonDiff
                                    : T extends BinaryJson | LogicalJson | AssignmentJson
                                      ? OperatorJsonDiff<T>
                                      : T extends InstanceofJson
                                        ? InstanceofJsonDiff
                                        : T extends UnaryJson
                                          ? UnaryJsonDiff
                                          : T extends ConditionalJson
                                            ? ConditionalJsonDiff
                                            : never)
    | ReplacementDiff<BaseExpressionJson>;

/** 式の中の配列は位置が意味を持つので C. 順序付き列 (gap の中は位置順に組にする) */
const makeValueListDiff = <T, D>(
    before: T[],
    after: T[],
    makeDiff: (before: T, after: T) => D,
): TypedListDiff<T, D> =>
    makeTypedListDiff(
        before,
        after,
        pairAsSequence(before.map(getValueKey), after.map(getValueKey), { canPair: () => true }),
        makeDiff,
    );

export const makeExpressionListDiff = (
    before: BaseExpressionJson[],
    after: BaseExpressionJson[],
    sources?: Sources,
): ExpressionListDiff =>
    makeValueListDiff(before, after, (b, a) => makeExpressionValueDiff(b, a, sources));

const optionalExpression = (
    before: BaseExpressionJson | undefined,
    after: BaseExpressionJson | undefined,
    sources?: Sources,
): ExpressionDiffField =>
    makeOptionalDiff(before, after, (b, a) => makeExpressionValueDiff(b, a, sources));

const optionalExpressionList = (
    before: BaseExpressionJson[] | undefined,
    after: BaseExpressionJson[] | undefined,
    sources?: Sources,
): ExpressionListDiffField =>
    makeOptionalDiff(before, after, (b, a) => makeExpressionListDiff(b, a, sources));

export const makeDotMethodCallDiff = (
    before: DotMethodCallJson,
    after: DotMethodCallJson,
    sources?: Sources,
): DotMethodCallJsonDiff =>
    makeNodeDiff('memberAccess', before, after, 'slot', (b, a) => {
        if (b.type !== a.type) return undefined;
        return {
            type: makeValueDiff(b.type, a.type),
            object: makeExpressionValueDiff(b.object, a.object, sources),
            operator: makeValueDiff(b.operator, a.operator),
            member: makeValueDiff(b.member, a.member),
            memberArg: makeOptionalDiff(b.memberArg, a.memberArg, (x, y) =>
                makeExpressionListDiff(x, y, sources),
            ),
        };
    });

const makeNewEntryDiff = (
    before: NewEntryJson,
    after: NewEntryJson,
    sources?: Sources,
): NewEntryJsonDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        key: makeExpressionValueDiff(b.key, a.key, sources),
        value: makeExpressionValueDiff(b.value, a.value, sources),
    }));

/** classLiteral の型 (Type か 'void') */
const makeClassTypeDiff = (before: TypeJson | 'void', after: TypeJson | 'void') =>
    typeof before === 'object' && typeof after === 'object'
        ? makeTypeDiff(before, after)
        : before === after
          ? makeValueDiff(before, after)
          : makeReplacementDiff(before, after);

/** 中身を持たない式の kind */
const CONTENTLESS_KINDS = new Set(['this', 'super', 'null']);

/** kind ごとのプロパティの差分 (kind が同じときだけ呼ぶ) */
const makeFieldsOf = (
    before: BaseExpressionJson,
    after: BaseExpressionJson,
    sources?: Sources,
): Record<string, unknown> | undefined => {
    const expr = (key: string) =>
        optionalExpression(
            (before as Record<string, unknown>)[key] as BaseExpressionJson | undefined,
            (after as Record<string, unknown>)[key] as BaseExpressionJson | undefined,
            sources,
        );
    const value = (key: string) =>
        makeOptionalDiff(
            (before as Record<string, unknown>)[key],
            (after as Record<string, unknown>)[key],
            makeValueDiff,
        );
    switch (before.kind) {
        case 'identifier':
            return { name: makeValueDiff(before.name, (after as IdentifierJson).name) };
        case 'this':
        case 'super':
        case 'null':
            return {};
        case 'string':
        case 'integer':
        case 'long':
        case 'decimal':
        case 'boolean':
            return { value: value('value') };
        case 'classLiteral':
            return {
                classType: makeClassTypeDiff(
                    before.classType,
                    (after as ClassLiteralJson).classType,
                ),
            };
        case 'unsupported':
            return { nodeType: value('nodeType') };
        case 'call': {
            const a = after as CallJson;
            return {
                callee: makeExpressionValueDiff(before.callee, a.callee, sources),
                arg: makeExpressionListDiff(before.arg, a.arg, sources),
            };
        }
        case 'new': {
            const a = after as NewJson;
            return {
                newType: makeTypeDiff(before.newType, a.newType),
                arg: optionalExpressionList(before.arg, a.arg, sources),
                elements: optionalExpressionList(before.elements, a.elements, sources),
                entries: makeOptionalDiff(before.entries, a.entries, (x, y) =>
                    makeValueListDiff(x, y, (b, e) => makeNewEntryDiff(b, e, sources)),
                ),
                size: expr('size'),
            };
        }
        case 'cast':
            return {
                expression: expr('expression'),
                convertType: makeTypeDiff(before.convertType, (after as CastJson).convertType),
            };
        case 'parenthesized':
            return { expression: expr('expression') };
        case 'index':
            return { object: expr('object'), index: expr('index') };
        case 'binary':
        case 'logical':
        case 'assignment':
            return { left: expr('left'), operator: value('operator'), right: expr('right') };
        case 'instanceof':
            return {
                expression: expr('expression'),
                checkType: makeTypeDiff(before.checkType, (after as InstanceofJson).checkType),
            };
        case 'unary':
            return {
                operator: value('operator'),
                operatorLocation: value('operatorLocation'),
                argument: expr('argument'),
            };
        case 'conditional':
            return {
                condition: expr('condition'),
                trueValue: expr('trueValue'),
                falseValue: expr('falseValue'),
            };
        default:
            return undefined;
    }
};

export const makeExpressionValueDiff = (
    before: BaseExpressionJson,
    after: BaseExpressionJson,
    sources?: Sources,
): BaseExpressionJsonDiff => {
    if (before.kind !== after.kind) return makeReplacementDiff<BaseExpressionJson>(before, after);
    switch (before.kind) {
        case 'memberAccess':
            return makeDotMethodCallDiff(before, after as DotMethodCallJson, sources);
        case 'soql':
            return makeSoqlDiff(before, after as SoqlJson, sources);
        case 'sosl':
            return makeSoslDiff(before, after as SoslJson, sources);
        default: {
            type Node = JsonType<string>;
            return makeNodeDiff<string, Node, Record<string, unknown>>(
                before.kind,
                before as Node,
                after as Node,
                'slot',
                (b, a) => makeFieldsOf(b as BaseExpressionJson, a as BaseExpressionJson, sources),
                // this / super / null は中身を持たない (this(...) の this は呼び出し全体の位置を持つので、
                // objectKey は引数で変わる)。kind が同じなら同じ
                CONTENTLESS_KINDS.has(before.kind) ? (node) => node.kind : undefined,
            ) as unknown as BaseExpressionJsonDiff;
        }
    }
};

/**
 * 式 1 つの差分。配列 (引数など) は順序付き列 (C) として位置で対応付ける。
 * GumTree は文の並び (makeBlockDiff) の対応付けにだけ使う (docs/apex-implementation.md 6.4)
 */
export const makeExpressionDiff = <
    Before extends BaseExpressionJson,
    After extends BaseExpressionJson,
>(
    before: Before,
    after: After,
    sources?: Sources,
): BaseExpressionJsonDiff<Before | After> =>
    makeExpressionValueDiff(before, after, sources) as BaseExpressionJsonDiff<Before | After>;
