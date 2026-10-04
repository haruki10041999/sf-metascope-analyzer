import { InterfaceBodyContext } from '@apexdevtools/apex-parser';

import { BodyTypeClass } from '.';

import {
    InterfaceMethodDeclarationTypeClass,
    DeclarationVisitor,
    isInterfaceMethodDeclarationType,
} from '../declarationVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class InterfaceBodyTypeClass extends BodyTypeClass<InterfaceMethodDeclarationTypeClass[]> {
    private constructor(
        value: InterfaceMethodDeclarationTypeClass[],
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('interfaceBody', value, errorClasses);
    }

    static create(ctx: InterfaceBodyContext): InterfaceBodyTypeClass {
        if (
            !ctx.interfaceMethodDeclaration_list() &&
            ctx.interfaceMethodDeclaration_list().length > 0
        ) {
            throw new Error('値が異常です。InterfaceBodyContext: ' + ctx.getText());
        }

        const value: InterfaceMethodDeclarationTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.interfaceMethodDeclaration_list().forEach((interfaceBodyCtx, index) => {
            const declarationTypeClass = new DeclarationVisitor().visit(interfaceBodyCtx);
            if (isInterfaceMethodDeclarationType(declarationTypeClass)) {
                value.push(declarationTypeClass);
            } else if (isErrorType(declarationTypeClass)) {
                errorClasses[`value_${index}`] = declarationTypeClass;
            }
        });

        return new InterfaceBodyTypeClass(value, errorClasses);
    }
}

export const isInterfaceBodyType = (target: CommonTypeClass): target is InterfaceBodyTypeClass => {
    return target instanceof InterfaceBodyTypeClass;
};
