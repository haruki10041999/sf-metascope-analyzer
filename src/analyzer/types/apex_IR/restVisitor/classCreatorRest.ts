import { ClassCreatorRestContext } from '@apexdevtools/apex-parser';

import { RestTypeClass } from '.';

import {
    NormalArgumentsTypeClass,
    ArgumentsVisitor,
    isNormalArgumentsType,
} from '../argumentsVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ClassCreatorRestTypeClass extends RestTypeClass<NormalArgumentsTypeClass> {
    private constructor(value: NormalArgumentsTypeClass | ErrorTypeClass) {
        super('classCreatorRest', value);
    }

    static create(ctx: ClassCreatorRestContext): ClassCreatorRestTypeClass {
        if (!ctx.arguments()) {
            throw new Error('値が異常です。ClassCreatorRestContext: ' + ctx.getText());
        }

        return new ClassCreatorRestTypeClass(
            isValidClass(
                new ArgumentsVisitor().visit(ctx.arguments()),
                isNormalArgumentsType,
                'arguments',
            ),
        );
    }
}

export const isClassCreatorRestType = (
    target: CommonTypeClass,
): target is ClassCreatorRestTypeClass => {
    return target instanceof ClassCreatorRestTypeClass;
};

