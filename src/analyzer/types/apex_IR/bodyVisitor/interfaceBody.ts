import { InterfaceBodyContext } from '@apexdevtools/apex-parser';

import { BodyTypeClass } from '.';

import {
    InterfaceMethodDeclarationTypeClass,
    DeclarationVisitor,
    isInterfaceMethodDeclarationType,
} from '../declarationVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClassList } from '../commonVisitor';

export class InterfaceBodyTypeClass extends BodyTypeClass<
    'interfaceBody',
    InterfaceMethodDeclarationTypeClass
> {
    private constructor(value: (InterfaceMethodDeclarationTypeClass | ApexErrorTypeClass)[]) {
        super('interfaceBody', value);
    }

    static create(ctx: InterfaceBodyContext): InterfaceBodyTypeClass {
        return new InterfaceBodyTypeClass(
            isApexValidClassList(
                ctx.interfaceMethodDeclaration_list(),
                (ctx) => new DeclarationVisitor().visit(ctx),
                isInterfaceMethodDeclarationType,
                'interfaceMethodDeclaration',
            ),
        );
    }
}

export const isInterfaceBodyType = (
    target: ApexCommonTypeClass<string>,
): target is InterfaceBodyTypeClass => {
    return target instanceof InterfaceBodyTypeClass;
};
