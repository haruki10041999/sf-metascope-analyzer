import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSEnumMember, type TSEnumMember } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from '../commons/identifier';
import { stringLiteralTypePair, type StringLiteralTypeClass } from '../commons/stringLiteral';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

const tSEnumMemberIdPairs = lazyPairs(() => [identifierTypePair, stringLiteralTypePair] as const);

export type TSEnumMemberFields = TypeField<'tSEnumMember'> & {
    id: IdentifierTypeClass | StringLiteralTypeClass;
    initializer: ExpressionTypeClass | null;
};

export class TSEnumMemberTypeClass extends LwcCommonTypeClass<'tSEnumMember', TSEnumMemberFields> {
    private constructor(value: FieldsOf<TSEnumMemberFields>, sourceSpan: SourceSpan) {
        super('tSEnumMember', value, sourceSpan);
    }

    static create(target: TSEnumMember, originalSource: string): TSEnumMemberTypeClass {
        return new TSEnumMemberTypeClass(
            {
                id: visitNode(target.id, originalSource, tSEnumMemberIdPairs(), 'TSEnumMember.id'),
                initializer: visitOptionalNode(
                    target.initializer,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): TSEnumMemberFields['id'] {
        return this.getFields().id;
    }

    getInitializer(): TSEnumMemberFields['initializer'] {
        return this.getFields().initializer;
    }
}

export const tSEnumMemberTypePair: EvaluatePair<TSEnumMember, TSEnumMemberTypeClass> =
    makeEvaluatePair(isTSEnumMember, (target, originalSource) =>
        TSEnumMemberTypeClass.create(target, originalSource),
    );

export const isTSEnumMemberType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSEnumMemberTypeClass => target instanceof TSEnumMemberTypeClass;
