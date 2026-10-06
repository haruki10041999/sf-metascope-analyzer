import { WhenControlContext } from '@apexdevtools/apex-parser';

import { ControlTypeClass } from '.';

import { WhenValueTypeClass, ValueVisitor, isWhenValueType } from '../valueVisitor';
import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class WhenControlTypeClass extends ControlTypeClass<WhenValueTypeClass> {
    private block: NormalBlockTypeClass | ErrorTypeClass;
    private constructor(
        value: WhenValueTypeClass | ErrorTypeClass,
        block: NormalBlockTypeClass | ErrorTypeClass,
    ) {
        super('whenControl', value);
        this.block = block;
    }

    static create(ctx: WhenControlContext): WhenControlTypeClass {
        if (!ctx.whenValue() || !ctx.block()) {
            throw new Error('値が異常です。WhenControlContext: ' + ctx.getText());
        }

        return new WhenControlTypeClass(
            isValidClass(new ValueVisitor().visit(ctx.whenValue()), isWhenValueType, 'whenValue'),
            isValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block'),
        );
    }

    getBlock(): NormalBlockTypeClass | ErrorTypeClass {
        return this.block;
    }
}

export const isWhenControlType = (target: CommonTypeClass): target is WhenControlTypeClass => {
    return target instanceof WhenControlTypeClass;
};
