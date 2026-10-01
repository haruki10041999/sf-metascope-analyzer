import { GetterContext } from '@apexdevtools/apex-parser';

import { NormalBlockTypeClass, BlockTypeClass, BlockVisitor, isNormalBlockType } from '.';

import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class GetterTypeClass extends BlockTypeClass<NormalBlockTypeClass> {
    private constructor(
        value: NormalBlockTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('getter', value, errorClasses);
    }

    static create(ctx: GetterContext): GetterTypeClass {
        if (!ctx.GET()) {
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

        return new GetterTypeClass(value, errorClasses);
    }
}

export const isGetterType = (target: CommonTypeClass): target is GetterTypeClass => {
    return target instanceof GetterTypeClass;
};
