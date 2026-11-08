import { AccessLevelContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type AccessLevelValueType = TypeField<'accessLevel'> & { level: 'SYSTEM' | 'USER' };

export class AccessLevelTypeClass extends ApexCommonTypeClass<'accessLevel', AccessLevelValueType> {
    private constructor(level: AccessLevelValueType['level'], sourceSpan: SourceSpan) {
        super('accessLevel', { level: level }, sourceSpan);
    }

    static create(ctx: AccessLevelContext) {
        return new AccessLevelTypeClass(ctx.SYSTEM() ? 'SYSTEM' : 'USER', getSourceSpan(ctx));
    }
}

export const isAccessLevelType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is AccessLevelTypeClass => {
    return isSpicifyApexCommonTypeClass('accessLevel', target);
};
