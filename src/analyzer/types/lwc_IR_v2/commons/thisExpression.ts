import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isThisExpression, type ThisExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type ThisExpressionFields = TypeField<'thisExpression'>;

export class ThisExpressionTypeClass extends LwcCommonTypeClass<
    'thisExpression',
    ThisExpressionFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('thisExpression', {}, sourceSpan);
    }

    static create(target: ThisExpression, originalSource: string): ThisExpressionTypeClass {
        return new ThisExpressionTypeClass(getSourceSpan(target, originalSource));
    }
}

export const thisExpressionTypePair: EvaluatePair<ThisExpression, ThisExpressionTypeClass> =
    makeEvaluatePair(isThisExpression, (target, originalSource) =>
        ThisExpressionTypeClass.create(target, originalSource),
    );

export const isThisExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ThisExpressionTypeClass => target instanceof ThisExpressionTypeClass;
