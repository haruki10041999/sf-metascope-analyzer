import { InterfaceBodyContext } from '@apexdevtools/apex-parser';

import { BodyTypeClass } from '.';

import {
    InterfaceMethodDeclarationTypeClass,
    DeclarationVisitor,
    isInterfaceMethodDeclarationType,
} from '../declarationVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class InterfaceBodyTypeClass extends BodyTypeClass<
    'interfaceBody',
    InterfaceMethodDeclarationTypeClass
> {
    private constructor(value: (InterfaceMethodDeclarationTypeClass | ErrorTypeClass)[]) {
        super('interfaceBody', value);
    }

    static create(ctx: InterfaceBodyContext): InterfaceBodyTypeClass {
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

export const isInterfaceBodyType = (
    target: CommonTypeClass<string>,
): target is InterfaceBodyTypeClass => {
    return target instanceof InterfaceBodyTypeClass;
};
