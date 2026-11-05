import { ClassCreatorRestContext } from '@apexdevtools/apex-parser';

import { RestTypeClass } from '.';

import {
    NormalArgumentsTypeClass,
    ArgumentsVisitor,
    isNormalArgumentsType,
} from '../argumentsVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class ClassCreatorRestTypeClass extends RestTypeClass<
    'classCreatorRest',
    NormalArgumentsTypeClass
> {
    private constructor(value: NormalArgumentsTypeClass | ApexErrorTypeClass) {
        super('classCreatorRest', value);
    }

    static create(ctx: ClassCreatorRestContext): ClassCreatorRestTypeClass {
        if (!ctx.arguments()) {
            throw new Error('値が異常です。ClassCreatorRestContext: ' + ctx.getText());
        }

        return new ClassCreatorRestTypeClass(
            visitNode(new ArgumentsVisitor(), ctx.arguments(), isNormalArgumentsType, 'arguments'),
        );
    }
}

export const isClassCreatorRestType = (
    target: ApexCommonTypeClass<string>,
): target is ClassCreatorRestTypeClass => {
    return target instanceof ClassCreatorRestTypeClass;
};
