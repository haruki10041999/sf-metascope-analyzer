import { ClassBodyContext } from '@apexdevtools/apex-parser';

import { BodyTypeClass } from '.';

import {
    ClassBodyDeclarationTypeClass,
    DeclarationVisitor,
    isClassBodyDeclarationType,
} from '../declarationVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClassList } from '../commonVisitor';

export class ClassBodyTypeClass extends BodyTypeClass<'classBody', ClassBodyDeclarationTypeClass> {
    private constructor(value: (ClassBodyDeclarationTypeClass | ApexErrorTypeClass)[]) {
        super('classBody', value);
    }

    static create(ctx: ClassBodyContext): ClassBodyTypeClass {
        return new ClassBodyTypeClass(
            isApexValidClassList(
                ctx.classBodyDeclaration_list(),
                (ctx) => new DeclarationVisitor().visit(ctx),
                isClassBodyDeclarationType,
                'classBodyDeclaration',
            ),
        );
    }
}

export const isClassBodyType = (
    target: ApexCommonTypeClass<string>,
): target is ClassBodyTypeClass => {
    return target instanceof ClassBodyTypeClass;
};
