import { isImportExpression, type ImportExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type ImportExpressionFields = {
    phase: NonNullable<ImportExpression['phase']> | null;
    source: ExpressionTypeClass | LwcErrorTypeClass;
    options: ExpressionTypeClass | LwcErrorTypeClass | null;
};

export class ImportExpressionTypeClass extends LwcCommonTypeClass<'importExpression'> {
    private readonly value: ImportExpressionFields;

    private constructor(value: ImportExpressionFields) {
        super('importExpression');
        this.value = value;
    }

    static create(target: ImportExpression, originalSource: string): ImportExpressionTypeClass {
        return new ImportExpressionTypeClass({
            phase: target.phase ?? null,
            source: visitNode(
                target.source,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            options: visitOptionalNode(
                target.options,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ImportExpressionFields {
        return this.value;
    }

    getPhase(): ImportExpressionFields['phase'] {
        return this.value.phase;
    }

    getSource(): ImportExpressionFields['source'] {
        return this.value.source;
    }

    getOptions(): ImportExpressionFields['options'] {
        return this.value.options;
    }
}

export const importExpressionTypePair: EvaluatePair<ImportExpression, ImportExpressionTypeClass> =
    makeEvaluatePair(isImportExpression, (target, originalSource) =>
        ImportExpressionTypeClass.create(target, originalSource),
    );

export const isImportExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ImportExpressionTypeClass => target instanceof ImportExpressionTypeClass;
