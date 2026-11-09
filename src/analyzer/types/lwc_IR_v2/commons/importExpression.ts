import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isImportExpression, type ImportExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type ImportExpressionFields = TypeField<'importExpression'> & {
    phase: NonNullable<ImportExpression['phase']> | null;
    source: ExpressionTypeClass;
    options: ExpressionTypeClass | null;
};

export class ImportExpressionTypeClass extends LwcCommonTypeClass<
    'importExpression',
    ImportExpressionFields
> {
    private constructor(value: FieldsOf<ImportExpressionFields>, sourceSpan: SourceSpan) {
        super('importExpression', value, sourceSpan);
    }

    static create(target: ImportExpression, originalSource: string): ImportExpressionTypeClass {
        return new ImportExpressionTypeClass(
            {
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
            },
            getSourceSpan(target, originalSource),
        );
    }

    getPhase(): ImportExpressionFields['phase'] {
        return this.getFields().phase;
    }

    getSource(): ImportExpressionFields['source'] {
        return this.getFields().source;
    }

    getOptions(): ImportExpressionFields['options'] {
        return this.getFields().options;
    }
}

export const importExpressionTypePair: EvaluatePair<ImportExpression, ImportExpressionTypeClass> =
    makeEvaluatePair(isImportExpression, (target, originalSource) =>
        ImportExpressionTypeClass.create(target, originalSource),
    );

export const isImportExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ImportExpressionTypeClass => target instanceof ImportExpressionTypeClass;
