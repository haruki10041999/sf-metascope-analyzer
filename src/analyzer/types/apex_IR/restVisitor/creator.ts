import { CreatorContext } from '@apexdevtools/apex-parser';

import { RestTypeClass, RestVisitor, isRestTypeAll } from '.';

import { CreatedNameTypeClass, NameVisitor, isCreatedNameType } from '../nameVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class CreatorTypeClass extends RestTypeClass<CreatedNameTypeClass> {
    content: RestTypeClass<unknown> | null = null;

    private constructor(
        value: CreatedNameTypeClass | null,
        content: RestTypeClass<unknown> | null,
        errorTypeClasses: Record<string, ErrorTypeClass>,
    ) {
        super('creator', value, errorTypeClasses);
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

        let value: CreatedNameTypeClass | null = null;
        let content: RestTypeClass<unknown> | null = null;
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};

        const nameTypeClass = new NameVisitor().visit(ctx.createdName());
        if (isCreatedNameType(nameTypeClass)) {
            value = nameTypeClass;
        } else if (isErrorType(nameTypeClass)) {
            errorTypeClasses['value'] = nameTypeClass;
        }

        let restTypeClass: RestTypeClass<unknown> | ErrorTypeClass | null = null;
        if (ctx.noRest()) {
            restTypeClass = new RestVisitor().visit(ctx.noRest());
        }

        if (ctx.classCreatorRest()) {
            restTypeClass = new RestVisitor().visit(ctx.classCreatorRest());
        }

        if (ctx.arrayCreatorRest()) {
            restTypeClass = new RestVisitor().visit(ctx.arrayCreatorRest());
        }

        if (ctx.mapCreatorRest()) {
            restTypeClass = new RestVisitor().visit(ctx.mapCreatorRest());
        }

        if (ctx.setCreatorRest()) {
            restTypeClass = new RestVisitor().visit(ctx.setCreatorRest());
        }

        if (restTypeClass) {
            if (isRestTypeAll(restTypeClass)) {
                content = restTypeClass;
            } else {
                errorTypeClasses['content'] = restTypeClass;
            }
        }

        return new CreatorTypeClass(value, content, errorTypeClasses);
    }
}

export const isCreatorType = (target: CommonTypeClass): target is CreatorTypeClass => {
    return target instanceof CreatorTypeClass;
};

