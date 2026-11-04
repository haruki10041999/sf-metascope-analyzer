import { UsingScopeContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { SoqlIdTypeClass, IdVisitor, isSoqlIdType } from '../idVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class UsingScopeTypeClass extends ClauseTypeClass<'usingScope', SoqlIdTypeClass> {
    private constructor(value: SoqlIdTypeClass | ApexErrorTypeClass) {
        super('usingScope', value);
    }

    static create(ctx: UsingScopeContext): UsingScopeTypeClass {
        if (!ctx.soqlId()) {
            throw new Error('値が異常です。UsingScopeContext: ' + ctx.getText());
        }

        return new UsingScopeTypeClass(
            isApexValidClass(new IdVisitor().visit(ctx.soqlId()), isSoqlIdType, 'soqlId'),
        );
    }
}

export const isUsingScopeType = (
    target: ApexCommonTypeClass<string>,
): target is UsingScopeTypeClass => {
    return target instanceof UsingScopeTypeClass;
};

