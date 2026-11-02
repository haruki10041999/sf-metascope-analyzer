import {
    ModifiersJson,
    ModifierJson,
    AnnotationArgJson,
    AnnotationJson,
    ErrorJson,
    ConvertKeys,
} from '../../../types';

import {
    Body,
    Match,
    OptionalDiff,
    ValueDiff,
    getObjectKey,
    makeOptionalDiff,
    makeValueDiff,
    pairByKey,
    toBody,
} from './commons';

type Modifier = {
    modifierType: string;
} & (ModifierJson | AnnotationJson | ErrorJson);

/** キーを持つ引数の差分 (`@RestResource(urlMapping='/a')` の urlMapping など) */
export type AnnotationArgDiff = { key: string } & OptionalDiff<
    AnnotationArgJson,
    ValueDiff<AnnotationArgJson>
>;

/** 引数がすべてキーを持てばキーで対応付け、そうでなければ値を丸ごと比べる */
export type AnnotationArgsDiff = AnnotationArgDiff[] | ValueDiff<AnnotationJson['arg'] | null>;

/**
 * 修飾子・アノテーションは B. 集合 (分類キーをまたいで 1 つの集合にする)。
 * ただしアノテーションは名前で対応付け (D)、引数だけが変わったものを changed にする。
 */
export type ModifierDiff = {
    kind: 'modifier';
} & (
    | {
          status: 'added' | 'removed';
          sourceKeys: ConvertKeys;
          value: Body<Modifier>;
      }
    | {
          status: 'unchanged';
          sourceKeys: { before: ConvertKeys; after: ConvertKeys };
          value: Body<Modifier>;
      }
    | {
          status: 'changed';
          match: Match;
          sourceKeys: { before: ConvertKeys; after: ConvertKeys };
          modifierType: string;
          name: string;
          fields: { arg: AnnotationArgsDiff };
      }
);

export const makeTypedModifierJsons = (target: ModifiersJson): Modifier[] => {
    const modifiers: ({ modifierType: string } & (ModifierJson | AnnotationJson | ErrorJson))[] =
        [];

    Object.entries(target).forEach(([key, value]) => {
        value.forEach((v) => {
            modifiers.push({
                modifierType: key,
                ...v,
            });
        });
    });

    return modifiers;
};

const toArgList = (arg: AnnotationJson['arg']): AnnotationArgJson[] =>
    arg === undefined ? [] : Array.isArray(arg) ? arg : [arg];

export const makeAnnotationArgsDiff = (
    before: AnnotationJson['arg'],
    after: AnnotationJson['arg'],
): AnnotationArgsDiff => {
    const beforeList = toArgList(before);
    const afterList = toArgList(after);
    const keyed = [...beforeList, ...afterList].every((a) => a.key !== undefined);

    if (!keyed || beforeList.length + afterList.length === 0) {
        return makeValueDiff<AnnotationJson['arg'] | null>(before ?? null, after ?? null);
    }

    // Apex の名前付き引数は大文字小文字を区別しない
    const keys = [...new Set([...beforeList, ...afterList].map((a) => a.key!.toLowerCase()))];
    const find = (list: AnnotationArgJson[], key: string) =>
        list.find((a) => a.key!.toLowerCase() === key);

    return keys.map((key) => {
        const b = find(beforeList, key);
        const a = find(afterList, key);
        return { key: (a ?? b)!.key!, ...makeOptionalDiff(b, a, makeValueDiff) };
    });
};

/** アノテーションは名前 (大文字小文字を区別しない) で対応付ける。修飾子・エラーはキーなし (集合) */
const getModifierId = (modifier: Modifier): string | undefined =>
    modifier.kind === 'annotation'
        ? `${modifier.modifierType}:${modifier.name.toLowerCase()}`
        : undefined;

export const makeModifierDiff = (before: ModifiersJson, after: ModifiersJson): ModifierDiff[] => {
    const _before = makeTypedModifierJsons(before);
    const _after = makeTypedModifierJsons(after);

    const pairings = pairByKey(
        _before.map(getModifierId),
        _after.map(getModifierId),
        _before.map(getObjectKey),
        _after.map(getObjectKey),
    );

    return pairings.map((p): ModifierDiff => {
        if (p.status === 'removed') {
            const b = _before[p.before]!;
            return {
                kind: 'modifier',
                status: 'removed',
                sourceKeys: b.sourceKeys,
                value: toBody(b),
            };
        }

        if (p.status === 'added') {
            const a = _after[p.after]!;
            return {
                kind: 'modifier',
                status: 'added',
                sourceKeys: a.sourceKeys,
                value: toBody(a),
            };
        }

        const b = _before[p.before]!;
        const a = _after[p.after]!;
        const sourceKeys = { before: b.sourceKeys, after: a.sourceKeys };

        // 名前で対応付いたアノテーションのうち、引数が変わったもの
        if (p.status === 'changed' && b.kind === 'annotation' && a.kind === 'annotation') {
            return {
                kind: 'modifier',
                status: 'changed',
                match: p.match,
                sourceKeys,
                modifierType: b.modifierType,
                name: a.name,
                fields: { arg: makeAnnotationArgsDiff(b.arg, a.arg) },
            };
        }

        return { kind: 'modifier', status: 'unchanged', sourceKeys, value: toBody(b) };
    });
};
