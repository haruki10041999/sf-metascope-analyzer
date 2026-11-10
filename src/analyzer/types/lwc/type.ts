// TS の型注釈の JSON (docs/lwc-implementation.md)。Apex の types/apex/type.ts と同じ形:
// 境界ノード (LwcTypeJson) は最上位の型だけで、型引数・要素型はキーのない中身 (LwcTypeContentJson) で持つ。
// 入力は IR v2 (lwc_IR) のノード。v2 の木にはエラーのノードがないので、部分木の検査はしない
import type { JsonType } from '../commons/json';
import type { commons, flowVisitor, typeScriptVisitor } from '../lwc_IR';

import { isLwcNode, nameOf, type LwcJsonContext, type LwcNode } from './commons';

export type LwcTypeMemberContentJson = {
    name: string;
    memberType?: LwcTypeContentJson;
    optional: boolean;
    /** メソッドのシグネチャ (foo(): void) */
    method: boolean;
};

export type LwcTypeContentJson =
    /** string / number / unknown など (Apex の primitive) */
    | { type: 'primitive'; primitiveType: string }
    /** Row / Promise<Row[]> / a.B (Apex の custom。generic は型引数) */
    | { type: 'custom'; customType: string; generic?: LwcTypeContentJson[] }
    | { type: 'array'; elementType: LwcTypeContentJson }
    | { type: 'union' | 'intersection'; types: LwcTypeContentJson[] }
    | { type: 'literal'; value: string }
    | { type: 'object'; members: LwcTypeMemberContentJson[] }
    | {
          type: 'function';
          params: { name: string; paramType?: LwcTypeContentJson }[];
          returnType?: LwcTypeContentJson;
      }
    | { type: 'tuple'; elementTypes: LwcTypeContentJson[] }
    /** 上以外 (条件型・マップ型・Flow の型など)。text だけを持つ */
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
};

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

/** interface・型リテラルのメンバー (プロパティ・メソッドのシグネチャ)。それ以外 (インデックスなど) は null */
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

/** 関数の型の引数 (x: T / ...rest: T[] / { a }: T) */
const makeFunctionParamContentJson = (
    param: commons.TSFunctionTypeFields['params'][number],
    context: LwcJsonContext,
): { name: string; paramType?: LwcTypeContentJson } => {
    const annotation = param.getFields().typeAnnotation;
    return {
        name: param.kind === 'identifier' ? param.getFields().name : context.textOf(param),
        ...(annotation ? { paramType: makeLwcTypeContentJson(annotation, context) } : {}),
    };
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
            const generic = typeArguments ? typeArguments.getFields().params.map(content) : [];
            return {
                type: 'custom',
                customType: context.textOf(typeName),
                ...(generic.length > 0 ? { generic } : {}),
            };
        }
        case 'tSArrayType':
            return {
                type: 'array',
                elementType: content(
                    (node as commons.TSArrayTypeTypeClass).getFields().elementType,
                ),
            };
        case 'tSUnionType':
        case 'tSIntersectionType':
            return {
                type: node.kind === 'tSUnionType' ? 'union' : 'intersection',
                types: (node as commons.TSUnionTypeTypeClass | commons.TSIntersectionTypeTypeClass)
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
        case 'tSTypeLiteral':
            return {
                type: 'object',
                members: (node as commons.TSTypeLiteralTypeClass)
                    .getFields()
                    .members.flatMap((m) => makeLwcTypeMemberContentJson(m, context) ?? []),
            };
        case 'tSFunctionType': {
            const { params, returnType } = (node as commons.TSFunctionTypeTypeClass).getFields();
            return {
                type: 'function',
                params: params.map((param) => makeFunctionParamContentJson(param, context)),
                ...(returnType ? { returnType: content(returnType) } : {}),
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
