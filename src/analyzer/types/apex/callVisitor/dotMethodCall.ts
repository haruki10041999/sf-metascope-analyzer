import { DotMethodCallContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { ListType, ListVisitor } from '../listVisitor';

export type DotMethodCallType = {
    type: 'dotMethodCall';
    method: { name: IdType; params?: ListType };
};

export const makeDotMethodCallType = (ctx: DotMethodCallContext): DotMethodCallType => {
    const methodName = new IdVisitor().visit(ctx.anyId());

    const dotMethodCallType: DotMethodCallType = {
        type: 'dotMethodCall',
        method: { name: methodName },
    };

    if (ctx.expressionList()) {
        const params = new ListVisitor().visit(ctx.expressionList());
        dotMethodCallType.method.params = params;
    }

    return dotMethodCallType;
};
