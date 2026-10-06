import { AccessLevelContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

type AccessLevelValueType = 'SYSTEM' | 'USER';

export class AccessLevelTypeClass extends StatementTypeClass<AccessLevelValueType> {
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

export const isAccessLevelType = (target: CommonTypeClass): target is AccessLevelTypeClass => {
    return target instanceof AccessLevelTypeClass;
};
