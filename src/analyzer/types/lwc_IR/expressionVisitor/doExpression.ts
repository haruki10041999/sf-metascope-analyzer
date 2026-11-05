import { isDoExpression, type DoExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { blockStatementTypePair, type BlockStatementTypeClass } from '../commons/blockStatement';

const doExpressionBodyPairs = lazyPairs(() => [blockStatementTypePair] as const);

export type DoExpressionFields = {
    body: BlockStatementTypeClass | LwcErrorTypeClass;
    async: DoExpression['async'];
};

export class DoExpressionTypeClass extends LwcCommonTypeClass<'doExpression'> {
    private readonly value: DoExpressionFields;

    private constructor(value: DoExpressionFields) {
        super('doExpression');
        this.value = value;
    }

    static create(target: DoExpression, originalSource: string): DoExpressionTypeClass {
        return new DoExpressionTypeClass({
            body: visitNode(
                target.body,
                originalSource,
                doExpressionBodyPairs(),
                'DoExpression.body',
            ),
            async: target.async,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): DoExpressionFields {
        return this.value;
    }

    getBody(): DoExpressionFields['body'] {
        return this.value.body;
    }

    getAsync(): DoExpressionFields['async'] {
        return this.value.async;
    }
}

export const doExpressionTypePair: EvaluatePair<DoExpression, DoExpressionTypeClass> =
    makeEvaluatePair(isDoExpression, (target, originalSource) =>
        DoExpressionTypeClass.create(target, originalSource),
    );

export const isDoExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is DoExpressionTypeClass => target instanceof DoExpressionTypeClass;
