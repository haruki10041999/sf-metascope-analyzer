import { CreatorContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from '../nameVisitor';
import { RestType, RestVisitor } from '../restVisitor';

export type CreatorType = {
    type: 'creator';
    rest: {
        variant: NameType;
        rest: RestType;
    };
};

export const makeCreatorType = (ctx: CreatorContext): CreatorType => {
    const variant = new NameVisitor().visit(ctx.createdName());

    if (ctx.noRest()) {
        const noRest = new RestVisitor().visit(ctx.noRest());
        return {
            type: 'creator',
            rest: {
                variant: variant,
                rest: noRest,
            },
        };
    }

    if (ctx.classCreatorRest()) {
        const classCreatorRest = new RestVisitor().visit(ctx.classCreatorRest());
        return {
            type: 'creator',
            rest: {
                variant: variant,
                rest: classCreatorRest,
            },
        };
    }

    if (ctx.arrayCreatorRest()) {
        const arrayCreatorRest = new RestVisitor().visit(ctx.arrayCreatorRest());
        return {
            type: 'creator',
            rest: {
                variant: variant,
                rest: arrayCreatorRest,
            },
        };
    }

    if (ctx.mapCreatorRest()) {
        const mapCreatorRest = new RestVisitor().visit(ctx.mapCreatorRest());
        return {
            type: 'creator',
            rest: {
                variant: variant,
                rest: mapCreatorRest,
            },
        };
    }

    if (ctx.setCreatorRest()) {
        const setCreatorRest = new RestVisitor().visit(ctx.setCreatorRest());
        return {
            type: 'creator',
            rest: {
                variant: variant,
                rest: setCreatorRest,
            },
        };
    }

    throw new Error('値が異常です。CreatorContext: ' + ctx.getText());
};
