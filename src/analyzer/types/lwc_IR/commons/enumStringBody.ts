import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import {
    isEnumDefaultedMember,
    isEnumStringBody,
    isEnumStringMember,
    type EnumStringBody,
} from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { failIrBuild } from '../buildFailure';
import {
    enumDefaultedMemberTypePair,
    type EnumDefaultedMemberTypeClass,
} from './enumDefaultedMember';
import { enumStringMemberTypePair, type EnumStringMemberTypeClass } from './enumStringMember';

const enumStringBodyInitializedMembersPairs = lazyPairs(() => [enumStringMemberTypePair] as const);
const enumStringBodyDefaultedMembersPairs = lazyPairs(() => [enumDefaultedMemberTypePair] as const);

/**
 * 文字列の enum のメンバーは、すべて初期化子を持つ (`A = 'a'`) か、すべて持たない (`A`) かのどちらか
 */
export type EnumStringBodyFields = TypeField<'enumStringBody'> & {
    explicitType: EnumStringBody['explicitType'];
    hasUnknownMembers: EnumStringBody['hasUnknownMembers'];
} & (
        | { kind: 'initialized'; members: EnumStringMemberTypeClass[] }
        | { kind: 'defaulted'; members: EnumDefaultedMemberTypeClass[] }
    );

const createMembersFields = (
    target: EnumStringBody,
    originalSource: string,
):
    | { kind: 'initialized'; members: EnumStringMemberTypeClass[] }
    | { kind: 'defaulted'; members: EnumDefaultedMemberTypeClass[] } => {
    if (target.members.every((member) => isEnumDefaultedMember(member))) {
        return {
            kind: 'defaulted',
            members: visitNodeList(
                target.members,
                originalSource,
                enumStringBodyDefaultedMembersPairs(),
                'EnumStringBody.members',
            ),
        };
    }
    if (target.members.every((member) => isEnumStringMember(member))) {
        return {
            kind: 'initialized',
            members: visitNodeList(
                target.members,
                originalSource,
                enumStringBodyInitializedMembersPairs(),
                'EnumStringBody.members',
            ),
        };
    }
    return failIrBuild(
        'TYPE_MISMATCH',
        target,
        originalSource,
        '文字列の enum に、初期化子のあるメンバーとないメンバーは混ぜられません',
    );
};

export class EnumStringBodyTypeClass extends LwcCommonTypeClass<
    'enumStringBody',
    EnumStringBodyFields
> {
    private constructor(value: FieldsOf<EnumStringBodyFields>, sourceSpan: SourceSpan) {
        super('enumStringBody', value, sourceSpan);
    }

    static create(target: EnumStringBody, originalSource: string): EnumStringBodyTypeClass {
        return new EnumStringBodyTypeClass(
            {
                explicitType: target.explicitType,
                hasUnknownMembers: target.hasUnknownMembers,
                ...createMembersFields(target, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getExplicitType(): EnumStringBodyFields['explicitType'] {
        return this.getFields().explicitType;
    }

    getHasUnknownMembers(): EnumStringBodyFields['hasUnknownMembers'] {
        return this.getFields().hasUnknownMembers;
    }

    getKind(): EnumStringBodyFields['kind'] {
        return this.getFields().kind;
    }

    getMembers(): EnumStringBodyFields['members'] {
        return this.getFields().members;
    }
}

export const enumStringBodyTypePair: EvaluatePair<EnumStringBody, EnumStringBodyTypeClass> =
    makeEvaluatePair(isEnumStringBody, (target, originalSource) =>
        EnumStringBodyTypeClass.create(target, originalSource),
    );

export const isEnumStringBodyType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is EnumStringBodyTypeClass => target instanceof EnumStringBodyTypeClass;
