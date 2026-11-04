import { isPlaceholder, type Placeholder } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class PlaceholderTypeClass extends LwcCommonTypeClass<'placeholder'> {
    private constructor(originalSource: string) {
        super('placeholder', originalSource);
    }

    static create(target: Placeholder, originalSource: string): PlaceholderTypeClass {
        throw new Error('PlaceholderTypeClass.create is not implemented: ' + target.type);
    }
}

export const placeholderTypePair: EvaluatePair<Placeholder, PlaceholderTypeClass> =
    makeEvaluatePair(isPlaceholder, (target, originalSource) =>
        PlaceholderTypeClass.create(target, originalSource),
    );

export const isPlaceholderType = (
    target: LwcCommonTypeClass<string>,
): target is PlaceholderTypeClass => target instanceof PlaceholderTypeClass;
