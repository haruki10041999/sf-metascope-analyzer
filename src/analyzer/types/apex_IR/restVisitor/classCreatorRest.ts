import { ClassCreatorRestContext } from '@apexdevtools/apex-parser';

import { RestTypeClass } from '.';

import {
    NormalArgumentsTypeClass,
    ArgumentsVisitor,
    isNormalArgumentsType,
} from '../argumentsVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class ClassCreatorRestTypeClass extends RestTypeClass<NormalArgumentsTypeClass> {
    private constructor(
        value: NormalArgumentsTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('classCreatorRest', value, errorClasses);
    }

    static create(ctx: ClassCreatorRestContext): ClassCreatorRestTypeClass {
        if (!ctx.arguments()) {
            throw new Error('値が異常です。ClassCreatorRestContext: ' + ctx.getText());
        }

        let value: NormalArgumentsTypeClass | null = null;
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};

        const argumentTypeClass = new ArgumentsVisitor().visit(ctx.arguments());
        if (isNormalArgumentsType(argumentTypeClass)) {
            value = argumentTypeClass;
        } else if (isErrorType(argumentTypeClass)) {
            errorTypeClasses['value'] = argumentTypeClass;
        }

        return new ClassCreatorRestTypeClass(value, errorTypeClasses);
    }
}

export const isClassCreatorRestType = (
    target: CommonTypeClass,
): target is ClassCreatorRestTypeClass => {
    return target instanceof ClassCreatorRestTypeClass;
};

