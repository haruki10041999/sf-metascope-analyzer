import { isEnumNumberMember, type EnumNumberMember } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { numericLiteralTypePair, type NumericLiteralTypeClass } from './numericLiteral';

const enumNumberMemberIdPairs = lazyPairs(() => [identifierTypePair] as const);
const enumNumberMemberInitPairs = lazyPairs(() => [numericLiteralTypePair] as const);

export type EnumNumberMemberFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
    init: NumericLiteralTypeClass | LwcErrorTypeClass;
};

export class EnumNumberMemberTypeClass extends LwcCommonTypeClass<'enumNumberMember'> {
    private readonly value: EnumNumberMemberFields;

    private constructor(value: EnumNumberMemberFields) {
        super('enumNumberMember');
        this.value = value;
    }

    static create(target: EnumNumberMember, originalSource: string): EnumNumberMemberTypeClass {
        return new EnumNumberMemberTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                enumNumberMemberIdPairs(),
                'EnumNumberMember.id',
            ),
            init: visitNode(
                target.init,
                originalSource,
                enumNumberMemberInitPairs(),
                'EnumNumberMember.init',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): EnumNumberMemberFields {
        return this.value;
    }

    getId(): EnumNumberMemberFields['id'] {
        return this.value.id;
    }

    getInit(): EnumNumberMemberFields['init'] {
        return this.value.init;
    }
}

export const enumNumberMemberTypePair: EvaluatePair<EnumNumberMember, EnumNumberMemberTypeClass> =
    makeEvaluatePair(isEnumNumberMember, (target, originalSource) =>
        EnumNumberMemberTypeClass.create(target, originalSource),
    );

export const isEnumNumberMemberType = (
    target: LwcCommonTypeClass<string>,
): target is EnumNumberMemberTypeClass => target instanceof EnumNumberMemberTypeClass;
