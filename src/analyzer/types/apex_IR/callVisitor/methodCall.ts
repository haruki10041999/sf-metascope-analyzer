import { MethodCallContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { ListType, ListVisitor } from '../listVisitor';

export type MethodCallType = {
    type: 'methodCall';
    method: { name: IdType; params?: ListType; reference?: 'this' | 'super' };
};

export const makeMethodCallType = (ctx: MethodCallContext): MethodCallType => {
    if (!ctx.id()) {
        throw new Error('値が異常です。MethodCallContext: ' + ctx.getText());
    }

    const methodName = new IdVisitor().visit(ctx.id());

    const methodCallType: MethodCallType = {
        type: 'methodCall',
        method: { name: methodName },
    };

    if (ctx.expressionList()) {
        const params = new ListVisitor().visit(ctx.expressionList());
        methodCallType.method.params = params;
    }

    if (ctx.THIS()) {
        methodCallType.method.reference = 'this';
    }

    if (ctx.SUPER()) {
        methodCallType.method.reference = 'super';
    }

    return methodCallType;
};

