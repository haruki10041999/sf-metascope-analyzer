import { SetterContext } from '@apexdevtools/apex-parser';

import { NormalBlockTypeClass, BlockTypeClass, BlockVisitor, isNormalBlockType } from '.';

import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class SetterTypeClass extends BlockTypeClass<NormalBlockTypeClass> {
    private constructor(
        value: NormalBlockTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('setter', value, errorClasses);
    }

    static create(ctx: SetterContext): SetterTypeClass {
        if (!ctx.SET()) {
            throw new Error('値が異常です。GetterContext: ' + ctx.getText());
        }

        let value: NormalBlockTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        if (ctx.block()) {
            const blockTypeClass = new BlockVisitor().visit(ctx.block());
            if (isNormalBlockType(blockTypeClass)) {
                value = blockTypeClass;
            } else if (isErrorType(blockTypeClass)) {
                errorClasses['value'] = blockTypeClass;
            }
        }

        return new SetterTypeClass(value, errorClasses);
    }
}

export const isSetterType = (target: CommonTypeClass): target is SetterTypeClass => {
    return target instanceof SetterTypeClass;
};
