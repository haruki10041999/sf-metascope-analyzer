import { AccessLevelContext } from '@apexdevtools/apex-parser';

export type AccessLevelType = {
    type: 'accessLevel';
    value: 'SYSTEM' | 'USER';
};

export const makeAccessLevelType = (ctx: AccessLevelContext): AccessLevelType => {
    if (ctx.SYSTEM()) {
        return {
            type: 'accessLevel',
            value: 'SYSTEM',
        };
    }
    if (ctx.USER()) {
        return {
            type: 'accessLevel',
            value: 'USER',
        };
    }

    throw new Error('値が異常です。AccessLevelContext: ' + ctx.getText());
};
