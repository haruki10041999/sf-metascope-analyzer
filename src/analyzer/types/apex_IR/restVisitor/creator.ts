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
import { ErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class CreatorTypeClass extends RestTypeClass<'creator', CreatedNameTypeClass> {
    private content: RestAllTypeClass | ErrorTypeClass;

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

        const value = visitNode(
            new NameVisitor(),
            ctx.createdName(),
            isCreatedNameType,
            'createdName',
        );

        let content: RestAllTypeClass | ErrorTypeClass;
        if (ctx.noRest()) {
            content = visitNode(new RestVisitor(), ctx.noRest(), isNoRestType, 'noRest');
        } else if (ctx.classCreatorRest()) {
            content = visitNode(
                new RestVisitor(),
                ctx.classCreatorRest(),
                isClassCreatorRestType,
                'classCreatorRest',
            );
        } else if (ctx.arrayCreatorRest()) {
            content = visitNode(
                new RestVisitor(),
                ctx.arrayCreatorRest(),
                isArrayCreatorRestType,
                'arrayCreatorRest',
            );
        } else if (ctx.mapCreatorRest()) {
            content = visitNode(
                new RestVisitor(),
                ctx.mapCreatorRest(),
                isMapCreatorRestType,
                'mapCreatorRest',
            );
        } else {
            content = visitNode(
                new RestVisitor(),
                ctx.setCreatorRest(),
                isSetCreatorRestType,
                'setCreatorRest',
            );
        }

        return new CreatorTypeClass(value, content);
    }

    getContent(): RestAllTypeClass | ErrorTypeClass {
        return this.content;
    }
}

export const isCreatorType = (target: ApexCommonTypeClass<string>): target is CreatorTypeClass => {
    return target instanceof CreatorTypeClass;
};
