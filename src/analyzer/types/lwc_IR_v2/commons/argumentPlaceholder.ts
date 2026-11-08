import { isArgumentPlaceholder, type ArgumentPlaceholder } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ArgumentPlaceholderTypeClass extends LwcCommonTypeClass<'argumentPlaceholder'> {
    private constructor() {
        super('argumentPlaceholder');
    }

    static create(
        _target: ArgumentPlaceholder,
        _originalSource: string,
    ): ArgumentPlaceholderTypeClass {
        return new ArgumentPlaceholderTypeClass();
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
