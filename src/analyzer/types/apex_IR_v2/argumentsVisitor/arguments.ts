import { ArgumentsContext } from '@apexdevtools/apex-parser';

import { TypeField } from '../../commons/ir';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { ExpressionListTypeClass } from '../listVisitor';
import { SourceSpan } from '../../commons';

export type ArgumentsType = TypeField<'arguments'> & {
    elements: ExpressionListTypeClass | null;
};

export class ArgumentsTypeClass extends ApexCommonTypeClass<'arguments', ArgumentsType> {
    private constructor(elements: ExpressionListTypeClass | null, sourceSpan: SourceSpan) {
        super('arguments', { elements: elements }, sourceSpan);
    }

    static create(ctx: ArgumentsContext): ArgumentsTypeClass {
        if (ctx.expressionList()) {
            return new ArgumentsTypeClass(
                ExpressionListTypeClass.create(ctx.expressionList()),
                getSourceSpan(ctx),
            );
        } else {
            return new ArgumentsTypeClass(null, getSourceSpan(ctx));
        }
    }

    getElements(): ArgumentsType['elements'] {
        return this.getFields().elements;
    }
}

export const isArgumentsType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ArgumentsTypeClass => {
    return isSpicifyApexCommonTypeClass('aruguments', target);
};
