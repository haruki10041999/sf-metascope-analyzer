import { JsonType } from '../commons';
import type { TypeNameTypeClass, TypeRefTypeClass } from '../apex_IR';

import { type ApexNode, makeDerivedNodeJson, makeNodeJson } from './commons/node';

const isPrimitiveType = (type: string): boolean => {
    return [
        'BOOLEAN',
        'BLOB',
        'DATE',
        'DATETIME',
        'DECIMAL',
        'DOUBLE',
        'ID',
        'INTEGER',
        'LONG',
        'OBJECT',
        'STRING',
        'TIME',
    ].includes(type.toUpperCase());
};

const isListType = (type: string): boolean => {
    return 'LIST' === type.toUpperCase();
};

const isSetType = (type: string): boolean => {
    return 'SET' === type.toUpperCase();
};

const isMapType = (type: string): boolean => {
    return 'MAP' === type.toUpperCase();
};

// 型の中身 (kind・sourceKeys を除いた部分)。入れ子の型 (要素・キー・値・型引数) も TypeJson のノード
// (apex 8 から。docs/plan.md 4.3 の 2)
export type PrimitiveTypeContentJson = {
    type: 'primitive';
    primitiveType: string;
};

export type CustomTypeContentJson = {
    type: 'custom';
    /** 名前の並び (`a.b.C` は ['a', 'b', 'C']、`Account` は ['Account'])。いつも配列 */
    customType: string[];
    generic?: TypeJson[];
};

export type ArrayTypeContentJson = {
    type: 'array';
    elementType: TypeJson;
    dimension: number;
};

export type ListTypeContentJson = {
    type: 'list';
    elementType: TypeJson;
};

export type SetTypeContentJson = {
    type: 'set';
    elementType: TypeJson;
};

export type MapTypeContentJson = {
    type: 'map';
    keyType: TypeJson;
    valueType: TypeJson;
};

export type TypeContentJson =
    | PrimitiveTypeContentJson
    | CustomTypeContentJson
    | ArrayTypeContentJson
    | ListTypeContentJson
    | SetTypeContentJson
    | MapTypeContentJson;

type PrimitiveTypeJson = JsonType<'type'> & PrimitiveTypeContentJson;

type CustomTypeJson = JsonType<'type'> & CustomTypeContentJson;

type ArrayTypeJson = JsonType<'type'> & ArrayTypeContentJson;

type ListTypeJson = JsonType<'type'> & ListTypeContentJson;

type SetTypeJson = JsonType<'type'> & SetTypeContentJson;

type MapTypeJson = JsonType<'type'> & MapTypeContentJson;

export type TypeJson =
    PrimitiveTypeJson | CustomTypeJson | ArrayTypeJson | ListTypeJson | SetTypeJson | MapTypeJson;

// 型の名前 (`a.b.C` の各部分)。List・Set・Map は小文字の 'list'・'set'・'map'
const nameOf = (item: TypeNameTypeClass): string => {
    const fields = item.getFields();
    return fields.kind === 'collection' ? fields.collection : fields.name.getFields().value;
};

// 型引数 (`<A, B>` の各型)。型引数がなければ null
const genericOf = (item: TypeNameTypeClass | undefined): readonly TypeRefTypeClass[] | null =>
    item?.getFields().generic?.getFields().elements.getFields().value ?? null;

/**
 * 名前の並び (`a.b.C`) と、最後の名前の型引数から、型の中身。型引数のない型は generic が null。
 * new の型 (createdName) も同じ形で作る (docs/json-redesign-plan.md の段階 A2)
 */
export const makeTypeContentJsonOfNames = (
    names: readonly string[],
    generic: readonly TypeRefTypeClass[] | null,
): TypeContentJson => {
    if (names.length !== 1) {
        return {
            type: 'custom',
            customType: [...names],
            ...(generic && generic.length > 0
                ? { generic: generic.map((item) => makeTypeJson(item)) }
                : {}),
        };
    }

    const elementName = names[0]!;

    if (isPrimitiveType(elementName) && !generic) {
        return {
            type: 'primitive',
            primitiveType: elementName,
        };
    }

    if ((isListType(elementName) || isSetType(elementName)) && generic?.length === 1) {
        return {
            type: isListType(elementName) ? 'list' : 'set',
            elementType: makeTypeJson(generic[0]!),
        };
    }

    if (isMapType(elementName) && generic?.length === 2) {
        return {
            type: 'map',
            keyType: makeTypeJson(generic[0]!),
            valueType: makeTypeJson(generic[1]!),
        };
    }

    return {
        type: 'custom',
        customType: [elementName],
        ...(generic && generic.length > 0
            ? { generic: generic.map((item) => makeTypeJson(item)) }
            : {}),
    };
};

// dimension は配列の次元 (`[]` の数)。配列でなければ null。
// 配列の要素の型は IR に対応するノードがないので、位置は配列の型 (owner) のもの
const makeTypeContentJsonOf = (
    owner: ApexNode,
    elements: readonly TypeNameTypeClass[],
    dimension: number | null,
): TypeContentJson => {
    if (dimension) {
        return {
            type: 'array',
            elementType: makeArrayElementTypeJson(
                owner,
                makeTypeContentJsonOf(owner, elements, null),
            ),
            dimension: dimension,
        };
    }
    // 型引数の有無は最後の名前で見る (名前が 1 つのときは、その名前に < > があるか)
    const last = elements.at(-1);
    const generic = last?.getFields().generic ? (genericOf(last) ?? []) : null;
    return makeTypeContentJsonOfNames(elements.map(nameOf), generic);
};

const makeTypeContentJson = (target: TypeRefTypeClass): TypeContentJson => {
    const { element, dimention } = target.getFields();
    return makeTypeContentJsonOf(target, element, dimention.getFields().dimention);
};

/** 配列の要素の型 (X[] の X)。IR に対応するノードがないので、位置は配列の型 (owner) のもの */
export const makeArrayElementTypeJson = (owner: ApexNode, content: TypeContentJson): TypeJson =>
    makeDerivedNodeJson<TypeJson>('type', owner, content);

export const makeTypeJson = (target: TypeRefTypeClass): TypeJson =>
    makeNodeJson<TypeJson>('type', target, makeTypeContentJson(target));
