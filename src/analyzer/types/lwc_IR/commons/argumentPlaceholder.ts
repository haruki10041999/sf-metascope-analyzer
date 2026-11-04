import { isArgumentPlaceholder, ArgumentPlaceholder } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ArgumentPlaceholderTypeClass extends LwcCommonTypeClass<'argumentPlaceholder'> {
    private constructor(originalSource: string) {
        super('argumentPlaceholder', originalSource);
    }

    static create(
        target: ArgumentPlaceholder,
        originalSource: string,
    ): ArgumentPlaceholderTypeClass {
        return new ArgumentPlaceholderTypeClass(originalSource);
    }
}

export const argumentPlaceholderTypePair: EvaluatePair<
    ArgumentPlaceholder,
    ArgumentPlaceholderTypeClass
> = makeEvaluatePair(isArgumentPlaceholder, (target, originalSource) =>
    ArgumentPlaceholderTypeClass.create(target, originalSource),
);

export const isArgumentPlaceholderType = (
    target: LwcCommonTypeClass<string>,
): target is ArgumentPlaceholderTypeClass => target instanceof ArgumentPlaceholderTypeClass;
