import { UsingScopeContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { SoqlIdTypeClass, IdVisitor, isSoqlIdType } from '../idVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class UsingScopeTypeClass extends ClauseTypeClass<SoqlIdTypeClass> {
    private constructor(value: SoqlIdTypeClass | ErrorTypeClass) {
        super('usingScope', value);
    }

    static create(ctx: UsingScopeContext): UsingScopeTypeClass {
        if (!ctx.soqlId()) {
            throw new Error('値が異常です。UsingScopeContext: ' + ctx.getText());
        }

        return new UsingScopeTypeClass(
            isValidClass(new IdVisitor().visit(ctx.soqlId()), isSoqlIdType, 'soqlId'),
        );
    }
}

export const isUsingScopeType = (target: CommonTypeClass): target is UsingScopeTypeClass => {
    return target instanceof UsingScopeTypeClass;
};
