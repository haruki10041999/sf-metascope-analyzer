import { DotMethodCallContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { ListType, ListVisitor } from '../listVisitor';

export type DotMethodCallType = {
    type: 'dotMethodCall';
    methodName: Omit<IdType, 'type'>;
    params?: Omit<ListType, 'type'>;
};

export const makeDotMethodCallType = (ctx: DotMethodCallContext): DotMethodCallType => {
    const { type: _, ...methodName } = new IdVisitor().visit(ctx.id());

    const dotMethodCallType: DotMethodCallType = {
        type: 'dotMethodCall',
        methodName: methodName,
    };

    if (ctx.expressionList()) {
        const { type: __, ...params } = new ListVisitor().visit(ctx.expressionList());
        dotMethodCallType.params = params;
    }

    return dotMethodCallType;
};
