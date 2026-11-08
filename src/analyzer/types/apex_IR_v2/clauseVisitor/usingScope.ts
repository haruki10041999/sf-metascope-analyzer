import { UsingScopeContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { SoqlIdTypeClass, IdVisitor, isSoqlIdType } from '../idVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class UsingScopeTypeClass extends ClauseTypeClass<'usingScope', SoqlIdTypeClass> {
    private constructor(value: SoqlIdTypeClass | ApexErrorTypeClass) {
        super('usingScope', value);
    }

    static create(ctx: UsingScopeContext): UsingScopeTypeClass {
        if (!ctx.soqlId()) {
            throw new Error('値が異常です。UsingScopeContext: ' + ctx.getText());
        }

        return new UsingScopeTypeClass(
            visitNode(new IdVisitor(), ctx.soqlId(), isSoqlIdType, 'soqlId'),
        );
    }
}

export const isUsingScopeType = (
    target: ApexCommonTypeClass<string>,
): target is UsingScopeTypeClass => {
    return target instanceof UsingScopeTypeClass;
};
