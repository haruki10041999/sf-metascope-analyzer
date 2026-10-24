import { UpdateTypeContext } from '@apexdevtools/apex-parser';

import { ClauseValueTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class UpdateTypeTypeClass extends ClauseValueTypeClass<
    'updateType',
    'TRACKING' | 'VIEWSTAT'
> {
    private constructor(value: 'TRACKING' | 'VIEWSTAT') {
        super('updateType', value);
    }

    static create(ctx: UpdateTypeContext): UpdateTypeTypeClass {
        if (!ctx.TRACKING() && !ctx.VIEWSTAT()) {
            throw new Error('値が異常です UpdateTypeContext:' + ctx.getText());
        }

        return new UpdateTypeTypeClass(ctx.TRACKING() ? 'TRACKING' : 'VIEWSTAT');
    }
}

export const isUpdateTypeType = (
    target: CommonTypeClass<string>,
): target is UpdateTypeTypeClass => {
    return target instanceof UpdateTypeTypeClass;
};
