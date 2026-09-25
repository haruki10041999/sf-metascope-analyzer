import { CreatorContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from './nameVisitor';
import { RestType, RestVisitor } from './restVisitor';

export type CreatorType = {
    type: 'creator';
    variant: Omit<NameType, 'type'>;
    noRest?: Omit<RestType, 'type'>;
    classCreatorRest?: Omit<RestType, 'type'>;
    arrayCreatorRest?: Omit<RestType, 'type'>;
    mapCreatorRest?: Omit<RestType, 'type'>;
    setCreatorRest?: Omit<RestType, 'type'>;
};

export const makeCreatorType = (ctx: CreatorContext): CreatorType => {
    const { type, ...variant } = new NameVisitor().visit(ctx.createdName());

    if (ctx.noRest()) {
        const { type: _, ...noRest } = new RestVisitor().visit(ctx.noRest());
        return {
            type: 'creator',
            variant: variant,
            noRest: noRest,
        };
    }

    if (ctx.classCreatorRest()) {
        const { type: _, ...classCreatorRest } = new RestVisitor().visit(ctx.classCreatorRest());
        return {
            type: 'creator',
            variant: variant,
            classCreatorRest: classCreatorRest,
        };
    }

    if (ctx.arrayCreatorRest()) {
        const { type: _, ...arrayCreatorRest } = new RestVisitor().visit(ctx.arrayCreatorRest());
        return {
            type: 'creator',
            variant: variant,
            arrayCreatorRest: arrayCreatorRest,
        };
    }

    if (ctx.mapCreatorRest()) {
        const { type: _, ...mapCreatorRest } = new RestVisitor().visit(ctx.mapCreatorRest());
        return {
            type: 'creator',
            variant: variant,
            mapCreatorRest: mapCreatorRest,
        };
    }

    if (ctx.setCreatorRest()) {
        const { type: _, ...setCreatorRest } = new RestVisitor().visit(ctx.setCreatorRest());
        return {
            type: 'creator',
            variant: variant,
            setCreatorRest: setCreatorRest,
        };
    }

    throw new Error('値が異常です。CreatorContext: ' + ctx.getText());
};
