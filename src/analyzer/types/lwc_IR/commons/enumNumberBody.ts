import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isEnumNumberBody, type EnumNumberBody } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { EnumNumberMemberTypeClass } from './enumNumberMember';

export type EnumNumberBodyFields = TypeField<'enumNumberBody'> & {
    explicitType: EnumNumberBody['explicitType'];
    hasUnknownMembers: EnumNumberBody['hasUnknownMembers'];
    members: EnumNumberMemberTypeClass[];
};

export class EnumNumberBodyTypeClass extends LwcCommonTypeClass<
    'enumNumberBody',
    EnumNumberBodyFields
> {
    private constructor(value: FieldsOf<EnumNumberBodyFields>, sourceSpan: SourceSpan) {
        super('enumNumberBody', value, sourceSpan);
    }

    static create(target: EnumNumberBody, originalSource: string): EnumNumberBodyTypeClass {
        return new EnumNumberBodyTypeClass(
            {
                explicitType: target.explicitType,
                hasUnknownMembers: target.hasUnknownMembers,
                members: target.members.map((child) =>
                    EnumNumberMemberTypeClass.create(child, originalSource),
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getExplicitType(): EnumNumberBodyFields['explicitType'] {
        return this.getFields().explicitType;
    }

    getHasUnknownMembers(): EnumNumberBodyFields['hasUnknownMembers'] {
        return this.getFields().hasUnknownMembers;
    }

    getMembers(): EnumNumberBodyFields['members'] {
        return this.getFields().members;
    }
}

export const enumNumberBodyTypePair: EvaluatePair<EnumNumberBody, EnumNumberBodyTypeClass> =
    makeEvaluatePair(isEnumNumberBody, (target, originalSource) =>
        EnumNumberBodyTypeClass.create(target, originalSource),
    );

export const isEnumNumberBodyType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is EnumNumberBodyTypeClass => target instanceof EnumNumberBodyTypeClass;
