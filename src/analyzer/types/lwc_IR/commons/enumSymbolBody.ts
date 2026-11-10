import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isEnumSymbolBody, type EnumSymbolBody } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { EnumDefaultedMemberTypeClass } from './enumDefaultedMember';

export type EnumSymbolBodyFields = TypeField<'enumSymbolBody'> & {
    members: EnumDefaultedMemberTypeClass[];
    hasUnknownMembers: EnumSymbolBody['hasUnknownMembers'];
};

export class EnumSymbolBodyTypeClass extends LwcCommonTypeClass<
    'enumSymbolBody',
    EnumSymbolBodyFields
> {
    private constructor(value: FieldsOf<EnumSymbolBodyFields>, sourceSpan: SourceSpan) {
        super('enumSymbolBody', value, sourceSpan);
    }

    static create(target: EnumSymbolBody, originalSource: string): EnumSymbolBodyTypeClass {
        return new EnumSymbolBodyTypeClass(
            {
                members: target.members.map((child) =>
                    EnumDefaultedMemberTypeClass.create(child, originalSource),
                ),
                hasUnknownMembers: target.hasUnknownMembers,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getMembers(): EnumSymbolBodyFields['members'] {
        return this.getFields().members;
    }

    getHasUnknownMembers(): EnumSymbolBodyFields['hasUnknownMembers'] {
        return this.getFields().hasUnknownMembers;
    }
}

export const enumSymbolBodyTypePair: EvaluatePair<EnumSymbolBody, EnumSymbolBodyTypeClass> =
    makeEvaluatePair(isEnumSymbolBody, (target, originalSource) =>
        EnumSymbolBodyTypeClass.create(target, originalSource),
    );

export const isEnumSymbolBodyType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is EnumSymbolBodyTypeClass => target instanceof EnumSymbolBodyTypeClass;
