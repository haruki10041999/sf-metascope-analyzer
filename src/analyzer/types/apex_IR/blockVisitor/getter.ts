import { GetterContext } from '@apexdevtools/apex-parser';

import { NormalBlockTypeClass, BlockTypeClass, BlockVisitor, isNormalBlockType } from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class GetterTypeClass extends BlockTypeClass<NormalBlockTypeClass | null> {
    private constructor(value: NormalBlockTypeClass | ErrorTypeClass | null) {
        super('getter', value);
    }

    static create(ctx: GetterContext): GetterTypeClass {
        if (!ctx.GET()) {
            throw new Error('値が異常です。GetterContext: ' + ctx.getText());
        }

        return new GetterTypeClass(
            ctx.block()
                ? isValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block')
                : null,
        );
    }
}

export const isGetterType = (target: CommonTypeClass): target is GetterTypeClass => {
    return target instanceof GetterTypeClass;
};
