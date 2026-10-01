import { AccessLevelContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

type AccessLevelValueType = 'SYSTEM' | 'USER';

export class AccessLevelTypeClass extends StatementTypeClass<AccessLevelValueType> {
    private constructor(value: AccessLevelValueType | null) {
        super('accessLevel', value, {});
    }

    static create(ctx: AccessLevelContext) {
        if (!ctx.SYSTEM() && !ctx.USER()) {
            throw new Error('値が異常です。AccessLevelContext: ' + ctx.getText());
        }

        let value: AccessLevelValueType | null = null;

        if (ctx.SYSTEM()) {
            value = 'SYSTEM';
        }
        if (ctx.USER()) {
            value = 'USER';
        }

        return new AccessLevelTypeClass(value);
    }
}

export const isAccessLevelType = (target: CommonTypeClass): target is AccessLevelTypeClass => {
    return target instanceof AccessLevelTypeClass;
};
