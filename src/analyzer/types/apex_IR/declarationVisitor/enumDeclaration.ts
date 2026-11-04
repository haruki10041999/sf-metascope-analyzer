import { EnumDeclarationContext } from '@apexdevtools/apex-parser';

import {
    EnumConstantsTypeClass,
    DeclarationTypeClass,
    DeclarationVisitor,
    isEnumConstantsType,
} from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class EnumDeclarationTypeClass extends DeclarationTypeClass<
    'enumDeclaration',
    NormalIdTypeClass
> {
    private constant: EnumConstantsTypeClass | ApexErrorTypeClass | null = null;

    private constructor(
        value: NormalIdTypeClass | ApexErrorTypeClass,
        constant: EnumConstantsTypeClass | ApexErrorTypeClass | null,
    ) {
        super('enumDeclaration', value);
        this.constant = constant;
    }

    static create(ctx: EnumDeclarationContext): EnumDeclarationTypeClass {
        if (!ctx.id()) {
            throw new Error('値が異常です。EnumDeclarationContext: ' + ctx.getText());
        }

        return new EnumDeclarationTypeClass(
            isApexValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            ctx.enumConstants()
                ? isApexValidClass(
                      new DeclarationVisitor().visit(ctx.enumConstants()),
                      isEnumConstantsType,
                      'enumConstants',
                  )
                : null,
        );
    }

    getConstant(): EnumConstantsTypeClass | ApexErrorTypeClass | null {
        return this.constant;
    }
}

export const isEnumDeclarationType = (
    target: ApexCommonTypeClass<string>,
): target is EnumDeclarationTypeClass => {
    return target instanceof EnumDeclarationTypeClass;
};
