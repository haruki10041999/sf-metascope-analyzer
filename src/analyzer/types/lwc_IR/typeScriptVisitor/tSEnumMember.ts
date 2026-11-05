import { isTSEnumMember, type TSEnumMember } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from '../commons/identifier';
import { stringLiteralTypePair, type StringLiteralTypeClass } from '../commons/stringLiteral';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

const tSEnumMemberIdPairs = lazyPairs(() => [identifierTypePair, stringLiteralTypePair] as const);

export type TSEnumMemberFields = {
    id: IdentifierTypeClass | StringLiteralTypeClass | LwcErrorTypeClass;
    initializer: ExpressionTypeClass | LwcErrorTypeClass | null;
};

export class TSEnumMemberTypeClass extends LwcCommonTypeClass<'tSEnumMember'> {
    private readonly value: TSEnumMemberFields;

    private constructor(value: TSEnumMemberFields) {
        super('tSEnumMember');
        this.value = value;
    }

    static create(target: TSEnumMember, originalSource: string): TSEnumMemberTypeClass {
        return new TSEnumMemberTypeClass({
            id: visitNode(target.id, originalSource, tSEnumMemberIdPairs(), 'TSEnumMember.id'),
            initializer: visitOptionalNode(
                target.initializer,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSEnumMemberFields {
        return this.value;
    }

    getId(): TSEnumMemberFields['id'] {
        return this.value.id;
    }

    getInitializer(): TSEnumMemberFields['initializer'] {
        return this.value.initializer;
    }
}

export const tSEnumMemberTypePair: EvaluatePair<TSEnumMember, TSEnumMemberTypeClass> =
    makeEvaluatePair(isTSEnumMember, (target, originalSource) =>
        TSEnumMemberTypeClass.create(target, originalSource),
    );

export const isTSEnumMemberType = (
    target: LwcCommonTypeClass<string>,
): target is TSEnumMemberTypeClass => target instanceof TSEnumMemberTypeClass;
