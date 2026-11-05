// TS の型の宣言 (interface / type / enum) の JSON (docs/lwc-parse-plan.md 3.1.4・3.1.6 の lwcTypeDeclaration)。
// 名前を持つ宣言なので、Apex の宣言と同じく StructureJsonType (sourceKeys: { base, name })。
// 型の宣言は部分木全体を検査する (Apex の field と同じ)
import {
    makeStructureJson,
    type ConvertKeys,
    type ErrorJson,
    type StructureJsonType,
} from '../commons/json';

import { nameOf, type LwcConvertNode, type LwcJsonContext, convertLwcValue } from './commons';
import type {
    LwcTSEnumDeclarationType,
    LwcTSInterfaceDeclarationType,
    LwcTSTypeAliasDeclarationType,
} from './converter';
import {
    makeLwcTypeContentJson,
    makeLwcTypeJson,
    type LwcTypeContentJson,
    type LwcTypeJson,
} from './type';

export type LwcTypeMemberJson = {
    name: string;
    memberType?: LwcTypeContentJson;
    optional: boolean;
    /** メソッドのシグネチャ (foo(): void) */
    method: boolean;
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
    /** type の右辺 */
    variantType?: LwcTypeJson | ErrorJson;
    /** enum のメンバーの名前 */
    enumMembers?: string[];
};

export type LwcTypeDeclarationType =
    LwcTSInterfaceDeclarationType | LwcTSTypeAliasDeclarationType | LwcTSEnumDeclarationType;

export const TYPE_DECLARATION_NODES: readonly string[] = [
    'tSInterfaceDeclaration',
    'tSTypeAliasDeclaration',
    'tSEnumDeclaration',
];

const makeMemberJson = (member: LwcConvertNode, context: LwcJsonContext): LwcTypeMemberJson[] => {
    if (member.type !== 'tSPropertySignature' && member.type !== 'tSMethodSignature') {
        return [];
    }
    const annotation =
        member.type === 'tSPropertySignature' ? member.typeAnnotation : member.returnType;
    return [
        {
            name: nameOf(member.key, context),
            ...(annotation ? { memberType: makeLwcTypeContentJson(annotation, context) } : {}),
            optional: member.optional === true,
            method: member.type === 'tSMethodSignature',
        },
    ];
};

/** interface / type / enum の宣言 → lwcTypeDeclaration。部分木に IR を作れなかったノードがあれば ErrorJson */
export const makeLwcTypeDeclarationJson = (
    target: LwcTypeDeclarationType,
    exported: boolean,
    context: LwcJsonContext,
): LwcTypeDeclarationJson | ErrorJson =>
    convertLwcValue(
        target,
        'lwcTypeDeclaration',
        context,
        (declaration: LwcTypeDeclarationType, targetRecords) => {
            const node = declaration as LwcTypeDeclarationType;
            const name = node.id.type === 'identifier' ? node.id.name : '';
            const base = { name, exported };
            switch (node.type) {
                case 'tSInterfaceDeclaration': {
                    const extend = (node.extends ?? []).map((e) => context.textOf(e));
                    return makeStructureJson('lwcTypeDeclaration', targetRecords, {
                        ...base,
                        declarationType: 'interface' as const,
                        ...(extend.length > 0 ? { extend } : {}),
                        members:
                            node.body.type === 'tSInterfaceBody'
                                ? node.body.body.flatMap((m) => makeMemberJson(m, context))
                                : [],
                    });
                }
                case 'tSEnumDeclaration':
                    return makeStructureJson('lwcTypeDeclaration', targetRecords, {
                        ...base,
                        declarationType: 'enum' as const,
                        enumMembers:
                            node.body.type === 'tSEnumBody'
                                ? node.body.members.map((m) =>
                                      m.type === 'tSEnumMember' ? nameOf(m.id, context) : '',
                                  )
                                : [],
                    });
                default:
                    return makeStructureJson('lwcTypeDeclaration', targetRecords, {
                        ...base,
                        declarationType: 'type' as const,
                        variantType: makeLwcTypeJson(node.typeAnnotation, context),
                    });
            }
        },
        { record: { name: 'id' } },
    );
