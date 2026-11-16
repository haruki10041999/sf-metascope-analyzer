import typia from 'typia';

import { JsonType } from '../commons';
import type { TypeNameTypeClass, TypeRefTypeClass } from '../apex_IR';

import { makeNodeJson } from './commons/node';

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

// 型の中身。境界ノード（TypeJson）は最上位の型だけで、ジェネリクス・要素型はこの形（キーなし）で持つ
export type PrimitiveTypeContentJson = {
    type: 'primitive';
    primitiveType: string;
};

export type CustomTypeContentJson = {
    type: 'custom';
    /** 名前の並び (`a.b.C` は ['a', 'b', 'C']、`Account` は ['Account'])。いつも配列 */
    customType: string[];
    generic?: TypeContentJson[];
};

export type ArrayTypeContentJson = {
    type: 'array';
    elementType: TypeContentJson;
    dimension: number;
};

export type ListTypeContentJson = {
    type: 'list';
    elementType: TypeContentJson;
};

export type SetTypeContentJson = {
    type: 'set';
    elementType: TypeContentJson;
};

export type MapTypeContentJson = {
    type: 'map';
    keyType: TypeContentJson;
    valueType: TypeContentJson;
};

export type TypeContentJson =
    | PrimitiveTypeContentJson
    | CustomTypeContentJson
    | ArrayTypeContentJson
    | ListTypeContentJson
    | SetTypeContentJson
    | MapTypeContentJson;

type PrimitiveTypeJson = JsonType<'type'> & PrimitiveTypeContentJson;
export const isPrimitiveTypeJson = typia.createIs<PrimitiveTypeJson>();

type CustomTypeJson = JsonType<'type'> & CustomTypeContentJson;
export const isCustomTypeJson = typia.createIs<CustomTypeJson>();

type ArrayTypeJson = JsonType<'type'> & ArrayTypeContentJson;
export const isArrayTypeJson = typia.createIs<ArrayTypeJson>();

type ListTypeJson = JsonType<'type'> & ListTypeContentJson;
export const isListTypeJson = typia.createIs<ListTypeJson>();

type SetTypeJson = JsonType<'type'> & SetTypeContentJson;
export const isSetTypeJson = typia.createIs<SetTypeJson>();

type MapTypeJson = JsonType<'type'> & MapTypeContentJson;
export const isMapTypeJson = typia.createIs<MapTypeJson>();

export type TypeJson =
    PrimitiveTypeJson | CustomTypeJson | ArrayTypeJson | ListTypeJson | SetTypeJson | MapTypeJson;
export const isTypeJson = typia.createIs<TypeJson>();

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
                ? { generic: generic.map((item) => makeTypeContentJson(item)) }
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
            elementType: makeTypeContentJson(generic[0]!),
        };
    }

    if (isMapType(elementName) && generic?.length === 2) {
        return {
            type: 'map',
            keyType: makeTypeContentJson(generic[0]!),
            valueType: makeTypeContentJson(generic[1]!),
        };
    }

    return {
        type: 'custom',
        customType: [elementName],
        ...(generic && generic.length > 0
            ? { generic: generic.map((item) => makeTypeContentJson(item)) }
            : {}),
    };
};

// dimension は配列の次元 (`[]` の数)。配列でなければ null
const makeTypeContentJsonOf = (
    elements: readonly TypeNameTypeClass[],
    dimension: number | null,
): TypeContentJson => {
    if (dimension) {
        return {
            type: 'array',
            elementType: makeTypeContentJsonOf(elements, null),
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
    return makeTypeContentJsonOf(element, dimention.getFields().dimention);
};

export const makeTypeJson = (target: TypeRefTypeClass): TypeJson =>
    makeNodeJson<TypeJson>('type', target, makeTypeContentJson(target));
