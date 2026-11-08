import { VariableDeclaratorContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    visitOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { IdTypeClass } from '../idVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type VariableDeclaratorType = TypeField<'variableDeclarator'> & {
    variant: IdTypeClass;
    init: BasedExpressionTypeClass | null;
};

export class VariableDeclaratorTypeClass extends ApexCommonTypeClass<
    'variableDeclarator',
    VariableDeclaratorType
> {
    private constructor(
        variant: IdTypeClass,
        init: BasedExpressionTypeClass | null,
        sourceSpan: SourceSpan,
    ) {
        super('variableDeclarator', { variant: variant, init: init }, sourceSpan);
    }

    static create(ctx: VariableDeclaratorContext) {
        const variant = IdTypeClass.create(ctx.id());

        if (ctx.expression()) {
            return new VariableDeclaratorTypeClass(
                variant,
                new ExpressionVisitor().visit(ctx.expression()),
                getSourceSpan(ctx),
            );
        }
    }

    getVariant(): VariableDeclaratorType['variant'] {
        return this.getFields().variant;
    }

    getInit(): VariableDeclaratorType['init'] {
        return this.getFields().init;
    }
}

export const isVariableDeclaratorType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is VariableDeclaratorTypeClass => {
    return isSpicifyApexCommonTypeClass('variableDeclarator', target);
};
