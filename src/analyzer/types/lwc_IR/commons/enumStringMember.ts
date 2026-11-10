import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isEnumStringMember, type EnumStringMember } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { IdentifierTypeClass } from './identifier';
import { StringLiteralTypeClass } from './stringLiteral';

export type EnumStringMemberFields = TypeField<'enumStringMember'> & {
    id: IdentifierTypeClass;
    init: StringLiteralTypeClass;
};

export class EnumStringMemberTypeClass extends LwcCommonTypeClass<
    'enumStringMember',
    EnumStringMemberFields
> {
    private constructor(value: FieldsOf<EnumStringMemberFields>, sourceSpan: SourceSpan) {
        super('enumStringMember', value, sourceSpan);
    }

    static create(target: EnumStringMember, originalSource: string): EnumStringMemberTypeClass {
        return new EnumStringMemberTypeClass(
            {
                id: IdentifierTypeClass.create(target.id, originalSource),
                init: StringLiteralTypeClass.create(target.init, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): EnumStringMemberFields['id'] {
        return this.getFields().id;
    }

    getInit(): EnumStringMemberFields['init'] {
        return this.getFields().init;
    }
}

export const enumStringMemberTypePair: EvaluatePair<EnumStringMember, EnumStringMemberTypeClass> =
    makeEvaluatePair(isEnumStringMember, (target, originalSource) =>
        EnumStringMemberTypeClass.create(target, originalSource),
    );

export const isEnumStringMemberType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is EnumStringMemberTypeClass => target instanceof EnumStringMemberTypeClass;
