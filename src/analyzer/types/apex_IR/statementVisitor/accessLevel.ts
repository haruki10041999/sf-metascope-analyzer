import { AccessLevelContext } from '@apexdevtools/apex-parser';

import { StatementValueTypeClass } from '.';

import { ApexCommonTypeClass } from '../commonVisitor';

type AccessLevelValueType = 'SYSTEM' | 'USER';

export class AccessLevelTypeClass extends StatementValueTypeClass<
    'accessLevel',
    AccessLevelValueType
> {
    private constructor(value: AccessLevelValueType) {
        super('accessLevel', value);
    }

    static create(ctx: AccessLevelContext) {
        if (!ctx.SYSTEM() && !ctx.USER()) {
            throw new Error('値が異常です。AccessLevelContext: ' + ctx.getText());
        }

        return new AccessLevelTypeClass(ctx.SYSTEM() ? 'SYSTEM' : 'USER');
    }
}

export const isAccessLevelType = (
    target: ApexCommonTypeClass<string>,
): target is AccessLevelTypeClass => {
    return target instanceof AccessLevelTypeClass;
};
