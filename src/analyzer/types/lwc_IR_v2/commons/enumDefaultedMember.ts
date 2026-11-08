import { isEnumDefaultedMember, type EnumDefaultedMember } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const enumDefaultedMemberIdPairs = lazyPairs(() => [identifierTypePair] as const);

export type EnumDefaultedMemberFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
};

export class EnumDefaultedMemberTypeClass extends LwcCommonTypeClass<'enumDefaultedMember'> {
    private readonly value: EnumDefaultedMemberFields;

    private constructor(value: EnumDefaultedMemberFields) {
        super('enumDefaultedMember');
        this.value = value;
    }

    static create(
        target: EnumDefaultedMember,
        originalSource: string,
    ): EnumDefaultedMemberTypeClass {
        return new EnumDefaultedMemberTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                enumDefaultedMemberIdPairs(),
                'EnumDefaultedMember.id',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): EnumDefaultedMemberFields {
        return this.value;
    }

    getId(): EnumDefaultedMemberFields['id'] {
        return this.value.id;
    }
}

export const enumDefaultedMemberTypePair: EvaluatePair<
    EnumDefaultedMember,
    EnumDefaultedMemberTypeClass
> = makeEvaluatePair(isEnumDefaultedMember, (target, originalSource) =>
    EnumDefaultedMemberTypeClass.create(target, originalSource),
);

export const isEnumDefaultedMemberType = (
    target: LwcCommonTypeClass<string>,
): target is EnumDefaultedMemberTypeClass => target instanceof EnumDefaultedMemberTypeClass;
