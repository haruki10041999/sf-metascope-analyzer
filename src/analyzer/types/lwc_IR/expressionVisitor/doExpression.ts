import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isDoExpression, type DoExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { BlockStatementTypeClass } from '../commons/blockStatement';

export type DoExpressionFields = TypeField<'doExpression'> & {
    body: BlockStatementTypeClass;
    async: DoExpression['async'];
};

export class DoExpressionTypeClass extends LwcCommonTypeClass<'doExpression', DoExpressionFields> {
    private constructor(value: FieldsOf<DoExpressionFields>, sourceSpan: SourceSpan) {
        super('doExpression', value, sourceSpan);
    }

    static create(target: DoExpression, originalSource: string): DoExpressionTypeClass {
        return new DoExpressionTypeClass(
            {
                body: BlockStatementTypeClass.create(target.body, originalSource),
                async: target.async,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getBody(): DoExpressionFields['body'] {
        return this.getFields().body;
    }

    getAsync(): DoExpressionFields['async'] {
        return this.getFields().async;
    }
}

export const doExpressionTypePair: EvaluatePair<DoExpression, DoExpressionTypeClass> =
    makeEvaluatePair(isDoExpression, (target, originalSource) =>
        DoExpressionTypeClass.create(target, originalSource),
    );

export const isDoExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is DoExpressionTypeClass => target instanceof DoExpressionTypeClass;
