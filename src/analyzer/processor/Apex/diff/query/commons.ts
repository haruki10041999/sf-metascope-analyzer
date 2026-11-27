import {
    DateFormulaBody,
    FieldBody,
    SignedNumberBody,
    SingleConditionJson,
    SoqlFunctionBody,
    ValueJson,
} from '../../../../types';

import {
    ReplacementDiff,
    ValueDiff,
    getValueKey,
    makeReplacementDiff,
    pairAsSequence,
    pairAsSet,
} from '../../../commons/diff/commons';
import { TypedListDiff, TypedListItemDiff, makeTypedListDiff } from '../../../commons/diff/list';
import { FieldJsonDiff, makeFieldDiff } from './select';
import { SoqlFunctionJsonDiff, makeSoqlFunctionDiff } from './soqlFunction';

/**
 * B. 集合の要素の差分 (unchanged / added / removed だけ)。要素が JSON ノードなら kind / sourceKeys を中身から分ける
 */
export const makeUnorderedValueListDiff = <T>(before: T[], after: T[]): TypedListDiff<T, never> =>
    makeTypedListDiff(
        before,
        after,
        pairAsSet(before.map(getValueKey), after.map(getValueKey)),
        () => undefined as never,
    );

export type FieldTerm = FieldBody | SoqlFunctionBody;

/** 項目と SOQL 関数の差分。種類 (type) が違うものは ReplacementDiff */
/** 項目の項の差分。同じ種類 (項目どうし・関数どうし) なら fields に中の差分、違えば丸ごと */
export type FieldTermDiff =
    | { status: 'changed'; fields: FieldJsonDiff }
    | { status: 'changed'; fields: SoqlFunctionJsonDiff }
    | ReplacementDiff<FieldTerm>;

export const makeFieldTermDiff = (before: FieldTerm, after: FieldTerm): FieldTermDiff => {
    if (before.type === 'field' && after.type === 'field') {
        return { status: 'changed', fields: makeFieldDiff(before, after) };
    }
    if (before.type === 'soqlFunction' && after.type === 'soqlFunction') {
        return { status: 'changed', fields: makeSoqlFunctionDiff(before, after) };
    }
    return makeReplacementDiff(before, after);
};

/** GROUP BY の項目は C. 順序付き列 */
export const makeFieldTermSequenceDiff = (
    before: FieldTerm[],
    after: FieldTerm[],
): TypedListDiff<FieldTerm, FieldTermDiff> =>
    makeTypedListDiff(
        before,
        after,
        pairAsSequence(before.map(getValueKey), after.map(getValueKey)),
        makeFieldTermDiff,
    );

/** AND / OR の項は集合として比べるので、項の中の値は値として比べる */
export type SignedNumberJsonDiff = ValueDiff<SignedNumberBody>;
export type DateFormulaJsonDiff = ValueDiff<DateFormulaBody>;
export type ValueJsonDiff = ValueDiff<ValueJson>;
export type SingleConditionJsonDiff = TypedListItemDiff<SingleConditionJson, never>;
