import { JsonType } from '../commons';
import type { AnnotationTypeClass, ElementValueTypeClass, ModifierTypeClass } from '../apex_IR';

import { type ApexNode, makeDerivedNodeJson, makeNodeJson } from './commons/node';
import { type LiteralJson, makeLiteralNodeJson } from './primary';

/**
 * アノテーションの引数 1 つ。値はリテラルの式 (string / integer / boolean など。引用符を持たない)。
 * @RestResource(urlMapping='/a') のような名前付きの引数は key を持つ
 */
export type AnnotationArgJson = JsonType<'annotationArg'> & {
    key?: string;
    value: LiteralJson;
};

/** アノテーション。名前は書いたまま (大文字・小文字は解析で区別しない) */
export type AnnotationJson = JsonType<'annotation'> & {
    name: string;
    /** 引数 (書いた順)。() がなければ持たない */
    arg?: AnnotationArgJson[];
};

export type ModifierJson = JsonType<'modifier'> & {
    name:
        | 'GLOBAL'
        | 'PUBLIC'
        | 'PROTECTED'
        | 'PRIVATE'
        | 'TRANSIENT'
        | 'STATIC'
        | 'ABSTRACT'
        | 'FINAL'
        | 'WEBSERVICE'
        | 'OVERRIDE'
        | 'VIRTUAL'
        | 'TESTMETHOD'
        | 'WITH_SHARING'
        | 'WITHOUT_SHARING'
        | 'INHERITED_SHARING';
};

/**
 * 修飾子 (キーワード) とアノテーション (それぞれ書いた順)。どちらもなければ keyword・annotation を持たない。
 * 一覧そのものは IR に対応するノードがないので、位置は修飾子を持つ宣言・引数・変数のもの。
 * 分類 (access・testAnnotation など) は名前で決まる派生の情報なので持たない
 * (processor/Apex/modifiers.ts。docs/json-redesign-plan.md の段階 A5、決めたこと 5)
 */
export type ModifiersJson = JsonType<'modifiers'> & {
    keyword?: ModifierJson[];
    annotation?: AnnotationJson[];
};

// 位置は、名前付きの引数 (key=value) はその組、名前のない引数は値のもの
const makeAnnotationArgJson = (
    owner: ApexNode,
    target: ElementValueTypeClass,
    key?: string,
): AnnotationArgJson =>
    makeNodeJson<AnnotationArgJson>('annotationArg', owner, {
        ...(key !== undefined ? { key: key } : {}),
        value: makeLiteralNodeJson(target.getFields().value),
    });

// アノテーションのキーは、それを持つ修飾子のノードのキーにする (v1 と同じ)
const makeAnnotationJson = (
    target: AnnotationTypeClass,
    modifier: ModifierTypeClass,
): AnnotationJson => {
    const { name, param } = target.getFields();
    return makeNodeJson<AnnotationJson>('annotation', modifier, {
        name: name.getFields().value,
        ...(param
            ? {
                  arg:
                      param.kind === 'elementValue'
                          ? [makeAnnotationArgJson(param, param)]
                          : param
                                .getFields()
                                .value.map((pair) =>
                                    makeAnnotationArgJson(
                                        pair,
                                        pair.getFields().right,
                                        pair.getFields().left.getFields().value,
                                    ),
                                ),
              }
            : {}),
    });
};

export const makeModifierJson = (target: ModifierTypeClass): ModifierJson | AnnotationJson => {
    const fields = target.getFields();
    switch (fields.kind) {
        case 'keyword':
            return makeNodeJson<ModifierJson>('modifier', target, { name: fields.keyword });
        case 'annotation':
            return makeAnnotationJson(fields.annotation, target);
    }
};

/** owner は修飾子を持つ宣言・引数・変数の IR のノード (位置を借りる) */
export const makeModifiersJson = (
    owner: ApexNode,
    targets: readonly ModifierTypeClass[],
): ModifiersJson => {
    const items = targets.map((target) => makeModifierJson(target));
    const keyword = items.filter((item): item is ModifierJson => item.kind === 'modifier');
    const annotation = items.filter((item): item is AnnotationJson => item.kind === 'annotation');
    return makeDerivedNodeJson<ModifiersJson>('modifiers', owner, {
        ...(keyword.length ? { keyword } : {}),
        ...(annotation.length ? { annotation } : {}),
    });
};
