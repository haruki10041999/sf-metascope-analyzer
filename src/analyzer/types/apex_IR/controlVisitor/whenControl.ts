import { WhenControlContext } from '@apexdevtools/apex-parser';

import { ControlTypeClass } from '.';

import { WhenValueTypeClass, ValueVisitor, isWhenValueType } from '../valueVisitor';
import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class WhenControlTypeClass extends ControlTypeClass<'whenControl', WhenValueTypeClass> {
    private block: NormalBlockTypeClass | ApexErrorTypeClass;
    private constructor(
        value: WhenValueTypeClass | ApexErrorTypeClass,
        block: NormalBlockTypeClass | ApexErrorTypeClass,
    ) {
        super('whenControl', value);
        this.block = block;
    }

    static create(ctx: WhenControlContext): WhenControlTypeClass {
        if (!ctx.whenValue() || !ctx.block()) {
            throw new Error('値が異常です。WhenControlContext: ' + ctx.getText());
        }

        return new WhenControlTypeClass(
            isApexValidClass(
                new ValueVisitor().visit(ctx.whenValue()),
                isWhenValueType,
                'whenValue',
            ),
            isApexValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block'),
        );
    }

    getBlock(): NormalBlockTypeClass | ApexErrorTypeClass {
        return this.block;
    }
}

export const isWhenControlType = (
    target: ApexCommonTypeClass<string>,
): target is WhenControlTypeClass => {
    return target instanceof WhenControlTypeClass;
};
