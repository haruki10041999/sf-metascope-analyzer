import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isEnumBooleanMember, type EnumBooleanMember } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { BooleanLiteralTypeClass } from './booleanLiteral';
import { IdentifierTypeClass } from './identifier';

export type EnumBooleanMemberFields = TypeField<'enumBooleanMember'> & {
    id: IdentifierTypeClass;
    init: BooleanLiteralTypeClass;
};

export class EnumBooleanMemberTypeClass extends LwcCommonTypeClass<
    'enumBooleanMember',
    EnumBooleanMemberFields
> {
    private constructor(value: FieldsOf<EnumBooleanMemberFields>, sourceSpan: SourceSpan) {
        super('enumBooleanMember', value, sourceSpan);
    }

    static create(target: EnumBooleanMember, originalSource: string): EnumBooleanMemberTypeClass {
        return new EnumBooleanMemberTypeClass(
            {
                id: IdentifierTypeClass.create(target.id, originalSource),
                init: BooleanLiteralTypeClass.create(target.init, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): EnumBooleanMemberFields['id'] {
        return this.getFields().id;
    }

    getInit(): EnumBooleanMemberFields['init'] {
        return this.getFields().init;
    }
}

export const enumBooleanMemberTypePair: EvaluatePair<
    EnumBooleanMember,
    EnumBooleanMemberTypeClass
> = makeEvaluatePair(isEnumBooleanMember, (target, originalSource) =>
    EnumBooleanMemberTypeClass.create(target, originalSource),
);

export const isEnumBooleanMemberType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is EnumBooleanMemberTypeClass => target instanceof EnumBooleanMemberTypeClass;
