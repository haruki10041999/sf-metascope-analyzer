import { isEnumStringMember, type EnumStringMember } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';

const enumStringMemberIdPairs = lazyPairs(() => [identifierTypePair] as const);
const enumStringMemberInitPairs = lazyPairs(() => [stringLiteralTypePair] as const);

export type EnumStringMemberFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
    init: StringLiteralTypeClass | LwcErrorTypeClass;
};

export class EnumStringMemberTypeClass extends LwcCommonTypeClass<'enumStringMember'> {
    private readonly value: EnumStringMemberFields;

    private constructor(value: EnumStringMemberFields) {
        super('enumStringMember');
        this.value = value;
    }

    static create(target: EnumStringMember, originalSource: string): EnumStringMemberTypeClass {
        return new EnumStringMemberTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                enumStringMemberIdPairs(),
                'EnumStringMember.id',
            ),
            init: visitNode(
                target.init,
                originalSource,
                enumStringMemberInitPairs(),
                'EnumStringMember.init',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): EnumStringMemberFields {
        return this.value;
    }

    getId(): EnumStringMemberFields['id'] {
        return this.value.id;
    }

    getInit(): EnumStringMemberFields['init'] {
        return this.value.init;
    }
}

export const enumStringMemberTypePair: EvaluatePair<EnumStringMember, EnumStringMemberTypeClass> =
    makeEvaluatePair(isEnumStringMember, (target, originalSource) =>
        EnumStringMemberTypeClass.create(target, originalSource),
    );

export const isEnumStringMemberType = (
    target: LwcCommonTypeClass<string>,
): target is EnumStringMemberTypeClass => target instanceof EnumStringMemberTypeClass;
