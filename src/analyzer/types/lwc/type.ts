// TS の型注釈の JSON (docs/lwc-implementation.md)。Apex の types/apex/type.ts と同じ形:
// 境界ノード (LwcTypeJson) は最上位の型だけで、型引数・要素型はキーのない中身 (LwcTypeContentJson) で持つ
import { isErrorNode } from '../apex/commons';
import { type ErrorJson, type JsonType } from '../commons/json';

import {
    containsErrorNode,
    nameOf,
    type LwcConvertNode,
    type LwcJsonContext,
    makeLwcErrorJson,
} from './commons';

const ERROR_KIND = 'lwcType';

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

/** 型注釈 (: T) なら中の型 */
const unwrapAnnotation = (node: LwcConvertNode): LwcConvertNode =>
    node.type === 'tSTypeAnnotation' || node.type === 'typeAnnotation' ? node.typeAnnotation : node;

const makeMemberContentJson = (
    member: LwcConvertNode,
    context: LwcJsonContext,
): LwcTypeMemberContentJson | null => {
    if (member.type !== 'tSPropertySignature' && member.type !== 'tSMethodSignature') {
        return null;
    }
    const annotation =
        member.type === 'tSPropertySignature' ? member.typeAnnotation : member.returnType;
    return {
        name: nameOf(member.key, context),
        ...(annotation ? { memberType: makeLwcTypeContentJson(annotation, context) } : {}),
        optional: member.optional === true,
        method: member.type === 'tSMethodSignature',
    };
};

/** 型のノード → 型の中身 (キーなし) */
export const makeLwcTypeContentJson = (
    target: LwcConvertNode,
    context: LwcJsonContext,
): LwcTypeContentJson => {
    const node = unwrapAnnotation(target);
    const primitive = PRIMITIVES[node.type];
    if (primitive) {
        return { type: 'primitive', primitiveType: primitive };
    }
    const content = (child: LwcConvertNode) => makeLwcTypeContentJson(child, context);

    switch (node.type) {
        case 'tSParenthesizedType':
        case 'tSOptionalType':
        case 'tSRestType':
            return content(node.typeAnnotation);
        case 'tSTypeReference': {
            const generic =
                node.typeArguments && !isErrorNode(node.typeArguments)
                    ? node.typeArguments.params.map(content)
                    : [];
            return {
                type: 'custom',
                customType: context.textOf(node.typeName),
                ...(generic.length > 0 ? { generic } : {}),
            };
        }
        case 'tSArrayType':
            return { type: 'array', elementType: content(node.elementType) };
        case 'tSUnionType':
        case 'tSIntersectionType':
            return {
                type: node.type === 'tSUnionType' ? 'union' : 'intersection',
                types: node.types.map(content),
            };
        case 'tSLiteralType':
            return { type: 'literal', value: context.textOf(node.literal) };
        case 'tSTypeLiteral':
            return {
                type: 'object',
                members: node.members.flatMap((m) => makeMemberContentJson(m, context) ?? []),
            };
        case 'tSFunctionType':
            return {
                type: 'function',
                params: node.params.map((param) => {
                    const annotation =
                        'typeAnnotation' in param
                            ? (param.typeAnnotation as LwcConvertNode | null)
                            : null;
                    return {
                        name: param.type === 'identifier' ? param.name : context.textOf(param),
                        ...(annotation ? { paramType: content(annotation) } : {}),
                    };
                }),
                ...(node.returnType ? { returnType: content(node.returnType) } : {}),
            };
        case 'tSTupleType':
            return {
                type: 'tuple',
                elementTypes: node.elementTypes.map((element) =>
                    element.type === 'tSNamedTupleMember'
                        ? content(element.elementType)
                        : content(element),
                ),
            };
        default:
            return { type: 'other' };
    }
};

/**
 * 型注釈 (TSTypeAnnotation) または型のノード → lwcType (境界ノード)。
 * 部分木に IR を作れなかったノードがあれば ErrorJson (Apex の makeTypeJson と同じ)
 */
export const makeLwcTypeJson = (
    target: LwcConvertNode,
    context: LwcJsonContext,
): LwcTypeJson | ErrorJson => {
    if (containsErrorNode(target)) {
        return makeLwcErrorJson(target, ERROR_KIND, context);
    }
    const node = unwrapAnnotation(target);
    // 中身は union なので、makeJsonType の properties の型に合わせず直接組み立てる
    return {
        kind: 'lwcType',
        sourceKeys: context.keysOf(node),
        text: context.textOf(node),
        ...makeLwcTypeContentJson(node, context),
    };
};
