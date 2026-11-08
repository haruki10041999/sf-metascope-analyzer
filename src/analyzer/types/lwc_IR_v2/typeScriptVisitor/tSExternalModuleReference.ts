import { isTSExternalModuleReference, type TSExternalModuleReference } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { stringLiteralTypePair, type StringLiteralTypeClass } from '../commons/stringLiteral';

const tSExternalModuleReferenceExpressionPairs = lazyPairs(() => [stringLiteralTypePair] as const);

export type TSExternalModuleReferenceFields = {
    expression: StringLiteralTypeClass | LwcErrorTypeClass;
};

export class TSExternalModuleReferenceTypeClass extends LwcCommonTypeClass<'tSExternalModuleReference'> {
    private readonly value: TSExternalModuleReferenceFields;

    private constructor(value: TSExternalModuleReferenceFields) {
        super('tSExternalModuleReference');
        this.value = value;
    }

    static create(
        target: TSExternalModuleReference,
        originalSource: string,
    ): TSExternalModuleReferenceTypeClass {
        return new TSExternalModuleReferenceTypeClass({
            expression: visitNode(
                target.expression,
                originalSource,
                tSExternalModuleReferenceExpressionPairs(),
                'TSExternalModuleReference.expression',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSExternalModuleReferenceFields {
        return this.value;
    }

    getExpression(): TSExternalModuleReferenceFields['expression'] {
        return this.value.expression;
    }
}

export const tSExternalModuleReferenceTypePair: EvaluatePair<
    TSExternalModuleReference,
    TSExternalModuleReferenceTypeClass
> = makeEvaluatePair(isTSExternalModuleReference, (target, originalSource) =>
    TSExternalModuleReferenceTypeClass.create(target, originalSource),
);

export const isTSExternalModuleReferenceType = (
    target: LwcCommonTypeClass<string>,
): target is TSExternalModuleReferenceTypeClass =>
    target instanceof TSExternalModuleReferenceTypeClass;
