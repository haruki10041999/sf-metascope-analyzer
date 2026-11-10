import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isEnumNumberMember, type EnumNumberMember } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { IdentifierTypeClass } from './identifier';
import { NumericLiteralTypeClass } from './numericLiteral';

export type EnumNumberMemberFields = TypeField<'enumNumberMember'> & {
    id: IdentifierTypeClass;
    init: NumericLiteralTypeClass;
};

export class EnumNumberMemberTypeClass extends LwcCommonTypeClass<
    'enumNumberMember',
    EnumNumberMemberFields
> {
    private constructor(value: FieldsOf<EnumNumberMemberFields>, sourceSpan: SourceSpan) {
        super('enumNumberMember', value, sourceSpan);
    }

    static create(target: EnumNumberMember, originalSource: string): EnumNumberMemberTypeClass {
        return new EnumNumberMemberTypeClass(
            {
                id: IdentifierTypeClass.create(target.id, originalSource),
                init: NumericLiteralTypeClass.create(target.init, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): EnumNumberMemberFields['id'] {
        return this.getFields().id;
    }

    getInit(): EnumNumberMemberFields['init'] {
        return this.getFields().init;
    }
}

export const enumNumberMemberTypePair: EvaluatePair<EnumNumberMember, EnumNumberMemberTypeClass> =
    makeEvaluatePair(isEnumNumberMember, (target, originalSource) =>
        EnumNumberMemberTypeClass.create(target, originalSource),
    );

export const isEnumNumberMemberType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is EnumNumberMemberTypeClass => target instanceof EnumNumberMemberTypeClass;
