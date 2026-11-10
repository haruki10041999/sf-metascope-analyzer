import { AccessLevelContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type AccessLevelValueType = TypeField<'accessLevel'> & { level: 'SYSTEM' | 'USER' };
export type AccessLevelType = AccessLevelValueType;

export class AccessLevelTypeClass extends ApexCommonTypeClass<'accessLevel', AccessLevelValueType> {
    private constructor(fields: FieldsOf<AccessLevelValueType>, sourceSpan: SourceSpan) {
        super('accessLevel', fields, sourceSpan);
    }

    static create(ctx: AccessLevelContext): AccessLevelTypeClass {
        return new AccessLevelTypeClass(
            { level: ctx.SYSTEM() ? 'SYSTEM' : 'USER' },
            getSourceSpan(ctx),
        );
    }

    getLevel(): AccessLevelValueType['level'] {
        return this.getFields().level;
    }
}

export const isAccessLevelType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is AccessLevelTypeClass => {
    return isSpicifyApexCommonTypeClass('accessLevel', target);
};
