// TS・Flow の型の宣言 (interface / type / enum。Flow の opaque type も) の JSON (docs/lwc-implementation.md)。
// Flow の宣言は TS の同じ意味の宣言と同じ形にする。declare の宣言 (declare type など) は LWC では使わないので対象外。
// 名前を持つ宣言なので、Apex の宣言と同じく StructureJsonType (sourceKeys: { base, name })。
// 入力は IR v2 (lwc_IR) のノード。v2 の木にはエラーのノードがないので、部分木の検査はしない
import { makeStructureJson, type ConvertKeys, type StructureJsonType } from '../commons/json';
import type { commons } from '../lwc_IR';

import { nameOf, type LwcJsonContext } from './commons';
import {
    makeLwcTypeJson,
    makeLwcTypeMemberContentJson,
    type LwcTypeContentJson,
    type LwcTypeJson,
} from './type';

export type LwcTypeMemberJson = {
    name: string;
    memberType?: LwcTypeContentJson;
    optional: boolean;
    /** メソッドのシグネチャ (foo(): void) */
    method: boolean;
    /** Flow の variance (+x は plus、-x は minus) */
    variance?: 'plus' | 'minus';
};

export type LwcTypeDeclarationJson = StructureJsonType<
    'lwcTypeDeclaration',
    { name: ConvertKeys }
> & {
    name: string;
    declarationType: 'interface' | 'type' | 'enum';
    exported: boolean;
    /** interface の extends (Apex の extend に当たる) */
    extend?: string[];
    /** interface のメンバー */
    members?: LwcTypeMemberJson[];
    /** type の右辺 (Flow の opaque type は = の右の型) */
    variantType?: LwcTypeJson;
    /** Flow の opaque type (opaque type T: S = U) */
    opaque?: true;
    /** Flow の opaque type の上限の型 (: S) */
    supertype?: LwcTypeJson;
    /** enum のメンバーの名前 */
    enumMembers?: string[];
};

export type LwcTypeDeclarationType =
    | commons.TSInterfaceDeclarationTypeClass
    | commons.TSTypeAliasDeclarationTypeClass
    | commons.TSEnumDeclarationTypeClass
    | commons.InterfaceDeclarationTypeClass
    | commons.TypeAliasTypeClass
    | commons.OpaqueTypeTypeClass
    | commons.EnumDeclarationTypeClass;

export const TYPE_DECLARATION_NODES: readonly string[] = [
    'tSInterfaceDeclaration',
    'tSTypeAliasDeclaration',
    'tSEnumDeclaration',
    // Flow
    'interfaceDeclaration',
    'typeAlias',
    'opaqueType',
    'enumDeclaration',
];

/** interface / type / enum の宣言 (TS・Flow) → lwcTypeDeclaration */
export const makeLwcTypeDeclarationJson = (
    node: LwcTypeDeclarationType,
    exported: boolean,
    context: LwcJsonContext,
): LwcTypeDeclarationJson => {
    const id = node.getFields().id;
    const sourceKeys = context.structureKeysOf(node, { name: id });
    const base = { name: id.getFields().name, exported };
    switch (node.kind) {
        case 'tSInterfaceDeclaration': {
            const fields = (node as commons.TSInterfaceDeclarationTypeClass).getFields();
            const extend = (fields.extends ?? []).map((e) => context.textOf(e));
            return makeStructureJson('lwcTypeDeclaration', sourceKeys, {
                ...base,
                declarationType: 'interface' as const,
                ...(extend.length > 0 ? { extend } : {}),
                members: fields.body
                    .getFields()
                    .body.flatMap((m) => makeLwcTypeMemberContentJson(m, context) ?? []),
            });
        }
        case 'interfaceDeclaration': {
            // Flow の interface。メンバーはオブジェクトの型 (body) のプロパティ
            const fields = (node as commons.InterfaceDeclarationTypeClass).getFields();
            const extend = (fields.extends ?? []).map((e) => context.textOf(e));
            return makeStructureJson('lwcTypeDeclaration', sourceKeys, {
                ...base,
                declarationType: 'interface' as const,
                ...(extend.length > 0 ? { extend } : {}),
                members: fields.body
                    .getFields()
                    .properties.flatMap((m) => makeLwcTypeMemberContentJson(m, context) ?? []),
            });
        }
        case 'enumDeclaration': {
            // Flow の enum (enum E {A, B} / enum E of string {A = 'a'})。メンバーの種類によらず名前だけ
            const members: { getFields(): { id: commons.IdentifierTypeClass } }[] = (
                node as commons.EnumDeclarationTypeClass
            )
                .getFields()
                .body.getFields().members;
            return makeStructureJson('lwcTypeDeclaration', sourceKeys, {
                ...base,
                declarationType: 'enum' as const,
                enumMembers: members.map((m) => m.getFields().id.getFields().name),
            });
        }
        case 'typeAlias':
            return makeStructureJson('lwcTypeDeclaration', sourceKeys, {
                ...base,
                declarationType: 'type' as const,
                variantType: makeLwcTypeJson(
                    (node as commons.TypeAliasTypeClass).getFields().right,
                    context,
                ),
            });
        case 'opaqueType': {
            const { impltype, supertype } = (node as commons.OpaqueTypeTypeClass).getFields();
            return makeStructureJson('lwcTypeDeclaration', sourceKeys, {
                ...base,
                declarationType: 'type' as const,
                variantType: makeLwcTypeJson(impltype, context),
                opaque: true as const,
                ...(supertype ? { supertype: makeLwcTypeJson(supertype, context) } : {}),
            });
        }
        case 'tSEnumDeclaration':
            return makeStructureJson('lwcTypeDeclaration', sourceKeys, {
                ...base,
                declarationType: 'enum' as const,
                enumMembers: (node as commons.TSEnumDeclarationTypeClass)
                    .getFields()
                    .body.getFields()
                    .members.map((m) => nameOf(m.getFields().id, context)),
            });
        default:
            return makeStructureJson('lwcTypeDeclaration', sourceKeys, {
                ...base,
                declarationType: 'type' as const,
                variantType: makeLwcTypeJson(
                    (node as commons.TSTypeAliasDeclarationTypeClass).getFields().typeAnnotation,
                    context,
                ),
            });
    }
};
