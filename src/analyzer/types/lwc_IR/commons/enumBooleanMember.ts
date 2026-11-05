import { isEnumBooleanMember, type EnumBooleanMember } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { booleanLiteralTypePair, type BooleanLiteralTypeClass } from './booleanLiteral';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const enumBooleanMemberIdPairs = lazyPairs(() => [identifierTypePair] as const);
const enumBooleanMemberInitPairs = lazyPairs(() => [booleanLiteralTypePair] as const);

export type EnumBooleanMemberFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
    init: BooleanLiteralTypeClass | LwcErrorTypeClass;
};

export class EnumBooleanMemberTypeClass extends LwcCommonTypeClass<'enumBooleanMember'> {
    private readonly value: EnumBooleanMemberFields;

    private constructor(value: EnumBooleanMemberFields) {
        super('enumBooleanMember');
        this.value = value;
    }

    static create(target: EnumBooleanMember, originalSource: string): EnumBooleanMemberTypeClass {
        return new EnumBooleanMemberTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                enumBooleanMemberIdPairs(),
                'EnumBooleanMember.id',
            ),
            init: visitNode(
                target.init,
                originalSource,
                enumBooleanMemberInitPairs(),
                'EnumBooleanMember.init',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): EnumBooleanMemberFields {
        return this.value;
    }

    getId(): EnumBooleanMemberFields['id'] {
        return this.value.id;
    }

    getInit(): EnumBooleanMemberFields['init'] {
        return this.value.init;
    }
}

export const enumBooleanMemberTypePair: EvaluatePair<
    EnumBooleanMember,
    EnumBooleanMemberTypeClass
> = makeEvaluatePair(isEnumBooleanMember, (target, originalSource) =>
    EnumBooleanMemberTypeClass.create(target, originalSource),
);

export const isEnumBooleanMemberType = (
    target: LwcCommonTypeClass<string>,
): target is EnumBooleanMemberTypeClass => target instanceof EnumBooleanMemberTypeClass;
