import { ClassBodyContext } from '@apexdevtools/apex-parser';

import { BodyTypeClass } from '.';

import {
    ClassBodyDeclarationTypeClass,
    DeclarationVisitor,
    isClassBodyDeclarationType,
} from '../declarationVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class ClassBodyTypeClass extends BodyTypeClass<ClassBodyDeclarationTypeClass> {
    private constructor(value: (ClassBodyDeclarationTypeClass | ErrorTypeClass)[]) {
        super('classBody', value);
    }

    static create(ctx: ClassBodyContext): ClassBodyTypeClass {
        if (!ctx.classBodyDeclaration_list() && ctx.classBodyDeclaration_list().length > 0) {
            throw new Error('値が異常です。ClassBodyContext: ' + ctx.getText());
        }

        return new ClassBodyTypeClass(
            isValidClassList(
                ctx.classBodyDeclaration_list(),
                (ctx) => new DeclarationVisitor().visit(ctx),
                isClassBodyDeclarationType,
                'classBodyDeclaration',
            ),
        );
    }
}

export const isClassBodyType = (target: CommonTypeClass): target is ClassBodyTypeClass => {
    return target instanceof ClassBodyTypeClass;
};
