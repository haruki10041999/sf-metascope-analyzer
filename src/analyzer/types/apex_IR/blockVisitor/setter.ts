import { SetterContext } from '@apexdevtools/apex-parser';

import { NormalBlockTypeClass, BlockTypeClass, BlockVisitor, isNormalBlockType } from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class SetterTypeClass extends BlockTypeClass<NormalBlockTypeClass | null> {
    private constructor(value: NormalBlockTypeClass | ErrorTypeClass | null) {
        super('setter', value);
    }

    static create(ctx: SetterContext): SetterTypeClass {
        if (!ctx.SET()) {
            throw new Error('値が異常です。SetterContext: ' + ctx.getText());
        }

        return new SetterTypeClass(
            ctx.block()
                ? isValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block')
                : null,
        );
    }
}

export const isSetterType = (target: CommonTypeClass): target is SetterTypeClass => {
    return target instanceof SetterTypeClass;
};
