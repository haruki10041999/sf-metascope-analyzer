import { EnumDeclarationContext } from '@apexdevtools/apex-parser';

import {
    EnumConstantsTypeClass,
    DeclarationTypeClass,
    DeclarationVisitor,
    isEnumConstantsType,
} from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class EnumDeclarationTypeClass extends DeclarationTypeClass<NormalIdTypeClass> {
    private constant: EnumConstantsTypeClass | null = null;

    private constructor(
        value: NormalIdTypeClass | null,
        constant: EnumConstantsTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('enumDeclaration', value, errorClasses);
        this.constant = constant;
    }

    static create(ctx: EnumDeclarationContext): EnumDeclarationTypeClass {
        if (!ctx.id() || !ctx.enumConstants()) {
            throw new Error('値が異常です。EnumDeclarationContext: ' + ctx.getText());
        }

        let value: NormalIdTypeClass | null = null;
        let constant: EnumConstantsTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const idTypeClass = new IdVisitor().visit(ctx.id());
        if (isNormalIdType(idTypeClass)) {
            value = idTypeClass;
        } else if (isErrorType(idTypeClass)) {
            errorClasses['value'] = idTypeClass;
        }

        const declarationTypeClass = new DeclarationVisitor().visit(ctx.enumConstants());
        if (isEnumConstantsType(declarationTypeClass)) {
            constant = declarationTypeClass;
        } else if (isErrorType(declarationTypeClass)) {
            errorClasses['constant'] = declarationTypeClass;
        }

        return new EnumDeclarationTypeClass(value, constant, errorClasses);
    }

    getConstant(): EnumConstantsTypeClass | null {
        return this.constant;
    }

    isConstantNull(): boolean {
        return this.constant === null;
    }
}

export const isEnumDeclarationType = (
    target: CommonTypeClass,
): target is EnumDeclarationTypeClass => {
    return target instanceof EnumDeclarationTypeClass;
};
