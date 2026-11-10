import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isEnumBooleanBody, type EnumBooleanBody } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { EnumBooleanMemberTypeClass } from './enumBooleanMember';

export type EnumBooleanBodyFields = TypeField<'enumBooleanBody'> & {
    explicitType: EnumBooleanBody['explicitType'];
    hasUnknownMembers: EnumBooleanBody['hasUnknownMembers'];
    members: EnumBooleanMemberTypeClass[];
};

export class EnumBooleanBodyTypeClass extends LwcCommonTypeClass<
    'enumBooleanBody',
    EnumBooleanBodyFields
> {
    private constructor(value: FieldsOf<EnumBooleanBodyFields>, sourceSpan: SourceSpan) {
        super('enumBooleanBody', value, sourceSpan);
    }

    static create(target: EnumBooleanBody, originalSource: string): EnumBooleanBodyTypeClass {
        return new EnumBooleanBodyTypeClass(
            {
                explicitType: target.explicitType,
                hasUnknownMembers: target.hasUnknownMembers,
                members: target.members.map((child) =>
                    EnumBooleanMemberTypeClass.create(child, originalSource),
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getExplicitType(): EnumBooleanBodyFields['explicitType'] {
        return this.getFields().explicitType;
    }

    getHasUnknownMembers(): EnumBooleanBodyFields['hasUnknownMembers'] {
        return this.getFields().hasUnknownMembers;
    }

    getMembers(): EnumBooleanBodyFields['members'] {
        return this.getFields().members;
    }
}

export const enumBooleanBodyTypePair: EvaluatePair<EnumBooleanBody, EnumBooleanBodyTypeClass> =
    makeEvaluatePair(isEnumBooleanBody, (target, originalSource) =>
        EnumBooleanBodyTypeClass.create(target, originalSource),
    );

export const isEnumBooleanBodyType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is EnumBooleanBodyTypeClass => target instanceof EnumBooleanBodyTypeClass;
