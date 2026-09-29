import { AccessLevelContext } from '@apexdevtools/apex-parser';

export type AccessLevelType = {
    type: 'accessLevel';
    statement: 'SYSTEM' | 'USER';
};

export const makeAccessLevelType = (ctx: AccessLevelContext): AccessLevelType => {
    if (ctx.SYSTEM()) {
        return {
            type: 'accessLevel',
            statement: 'SYSTEM',
        };
    }
    if (ctx.USER()) {
        return {
            type: 'accessLevel',
            statement: 'USER',
        };
    }

    throw new Error('値が異常です。AccessLevelContext: ' + ctx.getText());
};
