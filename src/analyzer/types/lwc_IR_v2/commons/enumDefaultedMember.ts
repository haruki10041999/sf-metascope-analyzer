import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isEnumDefaultedMember, type EnumDefaultedMember } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { IdentifierTypeClass } from './identifier';

export type EnumDefaultedMemberFields = TypeField<'enumDefaultedMember'> & {
    id: IdentifierTypeClass;
};

export class EnumDefaultedMemberTypeClass extends LwcCommonTypeClass<
    'enumDefaultedMember',
    EnumDefaultedMemberFields
> {
    private constructor(value: FieldsOf<EnumDefaultedMemberFields>, sourceSpan: SourceSpan) {
        super('enumDefaultedMember', value, sourceSpan);
    }

    static create(
        target: EnumDefaultedMember,
        originalSource: string,
    ): EnumDefaultedMemberTypeClass {
        return new EnumDefaultedMemberTypeClass(
            {
                id: IdentifierTypeClass.create(target.id, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): EnumDefaultedMemberFields['id'] {
        return this.getFields().id;
    }
}

export const enumDefaultedMemberTypePair: EvaluatePair<
    EnumDefaultedMember,
    EnumDefaultedMemberTypeClass
> = makeEvaluatePair(isEnumDefaultedMember, (target, originalSource) =>
    EnumDefaultedMemberTypeClass.create(target, originalSource),
);

export const isEnumDefaultedMemberType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is EnumDefaultedMemberTypeClass => target instanceof EnumDefaultedMemberTypeClass;
