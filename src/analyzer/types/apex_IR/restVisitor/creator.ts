import { CreatorContext } from '@apexdevtools/apex-parser';

import {
    RestAllTypeClass,
    RestTypeClass,
    RestVisitor,
    isArrayCreatorRestType,
    isClassCreatorRestType,
    isMapCreatorRestType,
    isNoRestType,
    isSetCreatorRestType,
} from '.';

import { CreatedNameTypeClass, NameVisitor, isCreatedNameType } from '../nameVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class CreatorTypeClass extends RestTypeClass<CreatedNameTypeClass> {
    content: RestAllTypeClass | ErrorTypeClass;

    private constructor(
        value: CreatedNameTypeClass | ErrorTypeClass,
        content: RestAllTypeClass | ErrorTypeClass,
    ) {
        super('creator', value);
        this.content = content;
    }

    static create(ctx: CreatorContext): CreatorTypeClass {
        if (
            !ctx.createdName() ||
            (!ctx.noRest() &&
                !ctx.classCreatorRest() &&
                !ctx.arrayCreatorRest() &&
                !ctx.mapCreatorRest() &&
                !ctx.setCreatorRest())
        ) {
            throw new Error('値が異常です。CreatorContext: ' + ctx.getText());
        }

        const value = isValidClass(
            new NameVisitor().visit(ctx.createdName()),
            isCreatedNameType,
            'createdName',
        );

        let content: RestAllTypeClass | ErrorTypeClass;
        if (ctx.noRest()) {
            content = isValidClass(new RestVisitor().visit(ctx.noRest()), isNoRestType, 'noRest');
        } else if (ctx.classCreatorRest()) {
            content = isValidClass(
                new RestVisitor().visit(ctx.classCreatorRest()),
                isClassCreatorRestType,
                'classCreatorRest',
            );
        } else if (ctx.arrayCreatorRest()) {
            content = isValidClass(
                new RestVisitor().visit(ctx.arrayCreatorRest()),
                isArrayCreatorRestType,
                'arrayCreatorRest',
            );
        } else if (ctx.mapCreatorRest()) {
            content = isValidClass(
                new RestVisitor().visit(ctx.mapCreatorRest()),
                isMapCreatorRestType,
                'mapCreatorRest',
            );
        } else {
            content = isValidClass(
                new RestVisitor().visit(ctx.setCreatorRest()),
                isSetCreatorRestType,
                'setCreatorRest',
            );
        }

        return new CreatorTypeClass(value, content);
    }
}

export const isCreatorType = (target: CommonTypeClass): target is CreatorTypeClass => {
    return target instanceof CreatorTypeClass;
};

