// TS・Flow の型注釈の JSON (docs/lwc-implementation.md)。Apex の types/apex/type.ts と同じ形:
// 境界ノード (LwcTypeJson) は最上位の型だけで、型引数・要素型はキーのない中身 (LwcTypeContentJson) で持つ。
// Flow の型は、TS の同じ意味の型と同じ形にする (docs/lwc-json-types.md 7 章の 8)。
// 入力は IR v2 (lwc_IR) のノード。v2 の木にはエラーのノードがないので、部分木の検査はしない
import type { JsonType } from '../commons/json';
import type { commons, flowVisitor, typeScriptVisitor } from '../lwc_IR';

import { isLwcNode, nameOf, type LwcJsonContext, type LwcNode } from './commons';

export type LwcTypeMemberContentJson = {
    name: string;
    memberType?: LwcTypeContentJson;
    optional: boolean;
    /** メソッドのシグネチャ (foo(): void)。getter / setter も含む */
    method: boolean;
    /** Flow の variance (+x は plus、-x は minus)。TS にはない */
    variance?: 'plus' | 'minus';
};

/** インデックス (TS の [key: string]: T・Flow の [key: string]: T / [string]: T) */
export type LwcTypeIndexerContentJson = {
    /** キーの名前 (Flow の [string]: T は持たない) */
    name?: string;
    keyType?: LwcTypeContentJson;
    valueType?: LwcTypeContentJson;
    /** Flow の variance (+[key: string]: T) */
    variance?: 'plus' | 'minus';
};

export type LwcTypeContentJson =
    /** string / number / unknown など (Apex の primitive)。Flow の mixed・empty・存在型 (*) も */
    | { type: 'primitive'; primitiveType: string }
    /** Row / Promise<Row[]> / a.B (Apex の custom。generic は型引数)。Flow の $Keys<T> なども */
    | { type: 'custom'; customType: string; generic?: LwcTypeContentJson[] }
    | { type: 'array'; elementType: LwcTypeContentJson }
    /** Flow の ?T は T | null | void の union */
    | { type: 'union' | 'intersection'; types: LwcTypeContentJson[] }
    | { type: 'literal'; value: string }
    | {
          type: 'object';
          members: LwcTypeMemberContentJson[];
          indexers?: LwcTypeIndexerContentJson[];
          /** Flow の { ...A, b: T } の ...A (メンバーとの順番は持たない) */
          spreads?: LwcTypeContentJson[];
          /** Flow の {| |} は exact、{ ... } は inexact。どちらでもないときは持たない */
          exactness?: 'exact' | 'inexact';
      }
    | {
          type: 'function';
          /** 名前は Flow の名前のない引数 ((string) => void) では持たない。残りの引数は ...args */
          params: { name?: string; paramType?: LwcTypeContentJson }[];
          returnType?: LwcTypeContentJson;
      }
    | { type: 'tuple'; elementTypes: LwcTypeContentJson[] }
    /** typeof x / typeof a.b (target は名前) */
    | { type: 'typeof'; target: string }
    /** 上以外 (条件型・マップ型・インデックスアクセス型など)。境界ノードの text だけを持つ */
    | { type: 'other' };

export type LwcTypeJson = JsonType<'lwcType'> & {
    /** 書かれた型の文字列 (':' を含まない) */
    text: string;
} & LwcTypeContentJson;

const PRIMITIVES: Record<string, string> = {
    tSAnyKeyword: 'any',
    tSBooleanKeyword: 'boolean',
    tSBigIntKeyword: 'bigint',
    tSIntrinsicKeyword: 'intrinsic',
    tSNeverKeyword: 'never',
    tSNullKeyword: 'null',
    tSNumberKeyword: 'number',
    tSObjectKeyword: 'object',
    tSStringKeyword: 'string',
    tSSymbolKeyword: 'symbol',
    tSUndefinedKeyword: 'undefined',
    tSUnknownKeyword: 'unknown',
    tSVoidKeyword: 'void',
    tSThisType: 'this',
    // Flow のキーワードの型 (名前は書いたとおり。mixed は TS の unknown、empty は never に当たる)
    anyTypeAnnotation: 'any',
    booleanTypeAnnotation: 'boolean',
    nullLiteralTypeAnnotation: 'null',
    numberTypeAnnotation: 'number',
    stringTypeAnnotation: 'string',
    symbolTypeAnnotation: 'symbol',
    voidTypeAnnotation: 'void',
    thisTypeAnnotation: 'this',
    mixedTypeAnnotation: 'mixed',
    emptyTypeAnnotation: 'empty',
    // 存在型 (*)
    existsTypeAnnotation: '*',
};

/** Flow のリテラルの型。値は TS の tSLiteralType と同じく書いた文字列 ('a' / -1 / true / 1n) */
const FLOW_LITERALS = new Set([
    'stringLiteralTypeAnnotation',
    'numberLiteralTypeAnnotation',
    'booleanLiteralTypeAnnotation',
    'bigIntLiteralTypeAnnotation',
]);

/** 型注釈 (: T。TS の TSTypeAnnotation・Flow の TypeAnnotation) なら中の型 */
const unwrapAnnotation = (node: LwcNode): LwcNode => {
    switch (node.kind) {
        case 'tSTypeAnnotation':
            return (node as typeScriptVisitor.TSTypeAnnotationTypeClass).getFields().typeAnnotation;
        case 'typeAnnotation':
            return (node as flowVisitor.TypeAnnotationTypeClass).getFields().typeAnnotation;
        default:
            return node;
    }
};

const varianceOf = (
    variance: flowVisitor.VarianceTypeClass | null,
): { variance?: 'plus' | 'minus' } => (variance ? { variance: variance.getFields().kind } : {});

/** Flow のオブジェクトの型のプロパティ (a: T / +a: T / foo(): T / get a(): T) */
const makeFlowPropertyContentJson = (
    property: commons.ObjectTypePropertyTypeClass,
    context: LwcJsonContext,
): LwcTypeMemberContentJson => {
    const fields = property.getFields();
    const value: LwcNode = fields.value;
    // メソッド・getter・setter の値は関数の型。TS のシグネチャと同じく、memberType は戻り値の型 (setter は持たない)
    const memberType: LwcNode | null = !fields.method
        ? value
        : fields.kind === 'set'
          ? null
          : value.kind === 'functionTypeAnnotation'
            ? (value as commons.FunctionTypeAnnotationTypeClass).getFields().returnType
            : value;
    return {
        name: nameOf(fields.key, context),
        ...(memberType ? { memberType: makeLwcTypeContentJson(memberType, context) } : {}),
        optional: fields.optional,
        method: fields.method,
        ...varianceOf(fields.variance),
    };
};

/**
 * interface・型リテラル・Flow のオブジェクトの型のメンバー (プロパティ・メソッドのシグネチャ)。
 * それ以外 (インデックス・Flow のスプレッドなど) は null
 */
export const makeLwcTypeMemberContentJson = (
    member: LwcNode,
    context: LwcJsonContext,
): LwcTypeMemberContentJson | null => {
    let annotation: LwcNode | null;
    let fields: commons.TSPropertySignatureFields | commons.TSMethodSignatureFields;
    switch (member.kind) {
        case 'tSPropertySignature':
            fields = (member as commons.TSPropertySignatureTypeClass).getFields();
            annotation = fields.typeAnnotation;
            break;
        case 'tSMethodSignature':
            fields = (member as commons.TSMethodSignatureTypeClass).getFields();
            // set のシグネチャは戻り値の型を持たない
            annotation = 'returnType' in fields ? fields.returnType : null;
            break;
        case 'objectTypeProperty':
            return makeFlowPropertyContentJson(
                member as commons.ObjectTypePropertyTypeClass,
                context,
            );
        default:
            return null;
    }
    return {
        name: nameOf(fields.key, context),
        ...(annotation ? { memberType: makeLwcTypeContentJson(annotation, context) } : {}),
        optional: fields.optional,
        method: member.kind === 'tSMethodSignature',
    };
};

/** インデックス (TS の tSIndexSignature・Flow の objectTypeIndexer)。それ以外は null */
const makeIndexerContentJson = (
    member: LwcNode,
    context: LwcJsonContext,
): LwcTypeIndexerContentJson | null => {
    switch (member.kind) {
        case 'tSIndexSignature': {
            const { parameter, typeAnnotation } = (
                member as commons.TSIndexSignatureTypeClass
            ).getFields();
            const keyAnnotation = parameter.getFields().typeAnnotation;
            return {
                name: parameter.getFields().name,
                ...(keyAnnotation
                    ? { keyType: makeLwcTypeContentJson(keyAnnotation, context) }
                    : {}),
                ...(typeAnnotation
                    ? { valueType: makeLwcTypeContentJson(typeAnnotation, context) }
                    : {}),
            };
        }
        case 'objectTypeIndexer': {
            const { id, key, value, variance } = (
                member as commons.ObjectTypeIndexerTypeClass
            ).getFields();
            return {
                ...(id ? { name: id.getFields().name } : {}),
                keyType: makeLwcTypeContentJson(key, context),
                valueType: makeLwcTypeContentJson(value, context),
                ...varianceOf(variance),
            };
        }
        default:
            return null;
    }
};

/** Flow のオブジェクトの型 ({ a: T } / {| a: T |} / { ...A, [k: K]: V }) */
const makeFlowObjectContentJson = (
    node: commons.ObjectTypeAnnotationTypeClass,
    context: LwcJsonContext,
): LwcTypeContentJson => {
    // 呼び出し ({ (x: T): U }) と内部スロット ([[foo]]: T) は、TS の呼び出しのシグネチャと同じく持たない
    const { properties, indexers, exactness } = node.getFields();
    const members: LwcTypeMemberContentJson[] = [];
    const spreads: LwcTypeContentJson[] = [];
    for (const property of properties) {
        if (property.kind === 'objectTypeProperty') {
            members.push(makeFlowPropertyContentJson(property, context));
        } else {
            spreads.push(makeLwcTypeContentJson(property.getFields().argument, context));
        }
    }
    const indexerJson = indexers.flatMap((i) => makeIndexerContentJson(i, context) ?? []);
    return {
        type: 'object',
        members,
        ...(indexerJson.length > 0 ? { indexers: indexerJson } : {}),
        ...(spreads.length > 0 ? { spreads } : {}),
        ...(exactness !== 'default' ? { exactness } : {}),
    };
};

/** 関数の型の引数 (x: T / ...rest: T[] / { a }: T) */
const makeFunctionParamContentJson = (
    param: commons.TSFunctionTypeFields['params'][number],
    context: LwcJsonContext,
): { name?: string; paramType?: LwcTypeContentJson } => {
    const annotation = param.getFields().typeAnnotation;
    let name: string;
    if (param.kind === 'identifier') {
        name = param.getFields().name;
    } else if (
        param.kind === 'restElement' &&
        (param.getFields().argument as LwcNode).kind === 'identifier'
    ) {
        // 残りの引数は Flow と同じく ...名前 (型注釈の文字列を含めない)
        name = `...${(param.getFields().argument as commons.IdentifierTypeClass).getFields().name}`;
    } else {
        name = context.textOf(param);
    }
    return {
        name,
        ...(annotation ? { paramType: makeLwcTypeContentJson(annotation, context) } : {}),
    };
};

/** Flow の関数の型の引数 (x: T / T / ...rest: T)。this の引数は名前を this にする (TS の this: T と同じ) */
const makeFlowFunctionParamContentJson = (
    param: flowVisitor.FunctionTypeParamTypeClass,
    as: 'param' | 'rest' | 'this',
    context: LwcJsonContext,
): { name?: string; paramType: LwcTypeContentJson } => {
    const { name, typeAnnotation } = param.getFields();
    const paramName =
        as === 'this'
            ? 'this'
            : as === 'rest'
              ? `...${name ? name.getFields().name : ''}`
              : name?.getFields().name;
    return {
        ...(paramName !== undefined ? { name: paramName } : {}),
        paramType: makeLwcTypeContentJson(typeAnnotation, context),
    };
};

/** 型引数のある名前の型 (TS の型参照・implements、Flow の generic・implements) */
const makeCustomContentJson = (
    customType: string,
    typeArguments: readonly LwcNode[] | undefined,
    context: LwcJsonContext,
): LwcTypeContentJson => {
    const generic = (typeArguments ?? []).map((a) => makeLwcTypeContentJson(a, context));
    return { type: 'custom', customType, ...(generic.length > 0 ? { generic } : {}) };
};

/** typeof の対象 (名前)。名前でなければ (typeof import('x') など) null */
const typeofTargetOf = (target: LwcNode, context: LwcJsonContext): string | null => {
    switch (target.kind) {
        case 'identifier':
            return (target as commons.IdentifierTypeClass).getFields().name;
        case 'tSQualifiedName':
        case 'qualifiedTypeIdentifier':
            return context.textOf(target);
        case 'genericTypeAnnotation':
            return typeofTargetOf(
                (target as commons.GenericTypeAnnotationTypeClass).getFields().id,
                context,
            );
        default:
            return null;
    }
};

/** 型のノード → 型の中身 (キーなし) */
export const makeLwcTypeContentJson = (
    target: LwcNode,
    context: LwcJsonContext,
): LwcTypeContentJson => {
    const node = unwrapAnnotation(target);
    const primitive = PRIMITIVES[node.kind];
    if (primitive) {
        return { type: 'primitive', primitiveType: primitive };
    }
    if (FLOW_LITERALS.has(node.kind)) {
        return { type: 'literal', value: context.textOf(node) };
    }
    const content = (child: LwcNode) => makeLwcTypeContentJson(child, context);

    switch (node.kind) {
        case 'tSParenthesizedType':
        case 'tSOptionalType':
        case 'tSRestType':
            // tSRestType の中は tSNamedTupleMember (...rest: T[]) のこともある (v1 と同じく other になる)
            return content(
                (
                    node as
                        | commons.TSParenthesizedTypeTypeClass
                        | commons.TSOptionalTypeTypeClass
                        | commons.TSRestTypeTypeClass
                ).getFields().typeAnnotation,
            );
        case 'tSTypeReference': {
            const { typeName, typeArguments } = (
                node as commons.TSTypeReferenceTypeClass
            ).getFields();
            return makeCustomContentJson(
                context.textOf(typeName),
                typeArguments?.getFields().params,
                context,
            );
        }
        case 'genericTypeAnnotation': {
            // Flow の名前の型 (Row / Array<T> / $Keys<T> / a.B)
            const { id, typeParameters } = (
                node as commons.GenericTypeAnnotationTypeClass
            ).getFields();
            return makeCustomContentJson(
                context.textOf(id),
                typeParameters?.getFields().params,
                context,
            );
        }
        case 'tSClassImplements': {
            const { expression, typeArguments } = (
                node as commons.TSClassImplementsTypeClass
            ).getFields();
            return makeCustomContentJson(
                context.textOf(expression),
                typeArguments?.getFields().params,
                context,
            );
        }
        case 'classImplements': {
            const { id, typeParameters } = (
                node as flowVisitor.ClassImplementsTypeClass
            ).getFields();
            return makeCustomContentJson(
                id.getFields().name,
                typeParameters?.getFields().params,
                context,
            );
        }
        case 'identifier':
            // Flow の型注釈の中が名前だけのとき
            return {
                type: 'custom',
                customType: (node as commons.IdentifierTypeClass).getFields().name,
            };
        case 'tSArrayType':
        case 'arrayTypeAnnotation':
            return {
                type: 'array',
                elementType: content(
                    (
                        node as commons.TSArrayTypeTypeClass | commons.ArrayTypeAnnotationTypeClass
                    ).getFields().elementType,
                ),
            };
        case 'nullableTypeAnnotation':
            // ?T は T | null | void
            return {
                type: 'union',
                types: [
                    content(
                        (node as commons.NullableTypeAnnotationTypeClass).getFields()
                            .typeAnnotation,
                    ),
                    { type: 'primitive', primitiveType: 'null' },
                    { type: 'primitive', primitiveType: 'void' },
                ],
            };
        case 'tSUnionType':
        case 'tSIntersectionType':
        case 'unionTypeAnnotation':
        case 'intersectionTypeAnnotation':
            return {
                type:
                    node.kind === 'tSUnionType' || node.kind === 'unionTypeAnnotation'
                        ? 'union'
                        : 'intersection',
                types: (
                    node as
                        | commons.TSUnionTypeTypeClass
                        | commons.TSIntersectionTypeTypeClass
                        | commons.UnionTypeAnnotationTypeClass
                        | commons.IntersectionTypeAnnotationTypeClass
                )
                    .getFields()
                    .types.map(content),
            };
        case 'tSLiteralType': {
            const literal = (node as commons.TSLiteralTypeTypeClass).getFields().literal;
            // 負の数 (-1) はノードでないので、型全体の文字列 (同じ位置) にする
            return {
                type: 'literal',
                value: isLwcNode(literal) ? context.textOf(literal) : context.textOf(node),
            };
        }
        case 'tSTypeLiteral': {
            const members: LwcNode[] = (node as commons.TSTypeLiteralTypeClass).getFields().members;
            const indexers = members.flatMap((m) => makeIndexerContentJson(m, context) ?? []);
            return {
                type: 'object',
                members: members.flatMap((m) => makeLwcTypeMemberContentJson(m, context) ?? []),
                ...(indexers.length > 0 ? { indexers } : {}),
            };
        }
        case 'objectTypeAnnotation':
            return makeFlowObjectContentJson(
                node as commons.ObjectTypeAnnotationTypeClass,
                context,
            );
        case 'interfaceTypeAnnotation':
            // interface { a: T } (式の位置の interface)。extends は持たない
            return makeFlowObjectContentJson(
                (node as commons.InterfaceTypeAnnotationTypeClass).getFields().body,
                context,
            );
        case 'tSFunctionType': {
            const { params, returnType } = (node as commons.TSFunctionTypeTypeClass).getFields();
            return {
                type: 'function',
                params: params.map((param) => makeFunctionParamContentJson(param, context)),
                ...(returnType ? { returnType: content(returnType) } : {}),
            };
        }
        case 'functionTypeAnnotation': {
            // 型引数 (<T>(x: T) => T の <T>) は TS と同じく持たない
            const fields = (node as commons.FunctionTypeAnnotationTypeClass).getFields();
            return {
                type: 'function',
                params: [
                    ...(fields.this
                        ? [makeFlowFunctionParamContentJson(fields.this, 'this', context)]
                        : []),
                    ...fields.params.map((param) =>
                        makeFlowFunctionParamContentJson(param, 'param', context),
                    ),
                    ...(fields.rest
                        ? [makeFlowFunctionParamContentJson(fields.rest, 'rest', context)]
                        : []),
                ],
                returnType: content(fields.returnType),
            };
        }
        case 'tSTupleType':
            return {
                type: 'tuple',
                elementTypes: (node as commons.TSTupleTypeTypeClass)
                    .getFields()
                    .elements.map((element: LwcNode) =>
                        element.kind === 'tSNamedTupleMember'
                            ? content(
                                  (element as commons.TSNamedTupleMemberTypeClass).getFields()
                                      .elementType,
                              )
                            : content(element),
                    ),
            };
        case 'tupleTypeAnnotation':
            return {
                type: 'tuple',
                elementTypes: (node as commons.TupleTypeAnnotationTypeClass)
                    .getFields()
                    .types.map(content),
            };
        case 'tSTypeQuery':
        case 'typeofTypeAnnotation': {
            const typeofTarget = typeofTargetOf(
                node.kind === 'tSTypeQuery'
                    ? (node as commons.TSTypeQueryTypeClass).getFields().exprName
                    : (node as commons.TypeofTypeAnnotationTypeClass).getFields().argument,
                context,
            );
            return typeofTarget === null
                ? { type: 'other' }
                : { type: 'typeof', target: typeofTarget };
        }
        default:
            return { type: 'other' };
    }
};

/**
 * 型注釈 (TSTypeAnnotation・Flow の TypeAnnotation) または型のノード → lwcType (境界ノード)。
 * キー・文字列は、型注釈を外した中の型のもの
 */
export const makeLwcTypeJson = (target: LwcNode, context: LwcJsonContext): LwcTypeJson => {
    const node = unwrapAnnotation(target);
    // 中身は union なので、makeJsonType の properties の型に合わせず直接組み立てる
    return {
        kind: 'lwcType',
        sourceKeys: context.keysOf(node),
        text: context.textOf(node),
        ...makeLwcTypeContentJson(node, context),
    };
};
