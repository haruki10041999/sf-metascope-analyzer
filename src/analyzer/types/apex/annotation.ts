import {
    AnnotationContext,
    ElementValuePairsContext,
    ElementValuePairContext,
    ElementValueContext,
} from '@apexdevtools/apex-parser';

export type AnnotationField = {
    annotation: string;
    value?:
        | string
        | {
              param: string;
              value: string;
          }[];
};

export const makeAnnotationField = (ctx: AnnotationContext): AnnotationField => {
    const annotation = ctx.id().getText();

    if (ctx.elementValue()) {
        return {
            annotation: annotation,
            value: ctx.elementValue().getText(),
        };
    }

    if (ctx.elementValuePairs()) {
        const values: {
            param: string;
            value: string;
        }[] = [];

        const elementValuePairCtxs = ctx.elementValuePairs();
        elementValuePairCtxs.elementValuePair_list().forEach((elementValuePairCtx) => {
            values.push({
                param: elementValuePairCtx.id().getText(),
                value: elementValuePairCtx.elementValue().getText(),
            });
        });
        return {
            annotation: annotation,
            value: values,
        };
    }

    return {
        annotation: annotation,
    };
};
