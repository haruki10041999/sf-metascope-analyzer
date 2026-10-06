import { InterfaceBodyContext } from '@apexdevtools/apex-parser';

import { BodyTypeClass } from '.';

import {
    InterfaceMethodDeclarationTypeClass,
    DeclarationVisitor,
    isInterfaceMethodDeclarationType,
} from '../declarationVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class InterfaceBodyTypeClass extends BodyTypeClass<InterfaceMethodDeclarationTypeClass> {
    private constructor(value: (InterfaceMethodDeclarationTypeClass | ErrorTypeClass)[]) {
        super('interfaceBody', value);
    }

    static create(ctx: InterfaceBodyContext): InterfaceBodyTypeClass {
        if (
            !ctx.interfaceMethodDeclaration_list() &&
            ctx.interfaceMethodDeclaration_list().length > 0
        ) {
            throw new Error('値が異常です。InterfaceBodyContext: ' + ctx.getText());
        }

        return new InterfaceBodyTypeClass(
            isValidClassList(
                ctx.interfaceMethodDeclaration_list(),
                (ctx) => new DeclarationVisitor().visit(ctx),
                isInterfaceMethodDeclarationType,
                'interfaceMethodDeclaration',
            ),
        );
    }
}

export const isInterfaceBodyType = (target: CommonTypeClass): target is InterfaceBodyTypeClass => {
    return target instanceof InterfaceBodyTypeClass;
};
