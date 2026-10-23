import { EnumDeclarationContext } from '@apexdevtools/apex-parser';

import {
    EnumConstantsTypeClass,
    DeclarationTypeClass,
    DeclarationVisitor,
    isEnumConstantsType,
} from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class EnumDeclarationTypeClass extends DeclarationTypeClass<
    'enumDeclaration',
    NormalIdTypeClass
> {
    private constant: EnumConstantsTypeClass | ErrorTypeClass | null = null;

    private constructor(
        value: NormalIdTypeClass | ErrorTypeClass,
        constant: EnumConstantsTypeClass | ErrorTypeClass | null,
    ) {
        super('enumDeclaration', value);
        this.constant = constant;
    }

    static create(ctx: EnumDeclarationContext): EnumDeclarationTypeClass {
        if (!ctx.id()) {
            throw new Error('値が異常です。EnumDeclarationContext: ' + ctx.getText());
        }

        return new EnumDeclarationTypeClass(
            isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            ctx.enumConstants()
                ? isValidClass(
                      new DeclarationVisitor().visit(ctx.enumConstants()),
                      isEnumConstantsType,
                      'enumConstants',
                  )
                : null,
        );
    }

    getConstant(): EnumConstantsTypeClass | ErrorTypeClass | null {
        return this.constant;
    }
}

export const isEnumDeclarationType = (
    target: CommonTypeClass<string>,
): target is EnumDeclarationTypeClass => {
    return target instanceof EnumDeclarationTypeClass;
};
