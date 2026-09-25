import { MethodCallContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { ListType, ListVisitor } from '../listVisitor';

export type MethodCallType = {
    type: 'methodCall';
    methodName: Omit<IdType, 'type'>;
    params?: Omit<ListType, 'type'>;
    reference?: 'this' | 'super';
};

export const makeMethodCallType = (ctx: MethodCallContext): MethodCallType => {
    const { type: _, ...methodName } = new IdVisitor().visit(ctx.id());

    const methodCallType: MethodCallType = {
        type: 'methodCall',
        methodName: methodName,
    };

    if (ctx.expressionList()) {
        const { type: __, ...params } = new ListVisitor().visit(ctx.expressionList());
        methodCallType.params = params;
    }

    if (ctx.THIS()) {
        methodCallType.reference = 'this';
    }

    if (ctx.SUPER()) {
        methodCallType.reference = 'super';
    }

    return methodCallType;
};
