import { isArrayPattern, ArrayPattern } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';
import { PatternLikeTypeClass } from '../patternLike';
import { DecoratorTypeClass } from './decorator';

export class ArrayPatternTypeClass extends LwcCommonTypeClass<'arrayPattern'> {
    private value: (null | PatternLikeTypeClass)[];
    private decorator: DecoratorTypeClass[];

    private constructor(originalSource: string) {
        super('arrayPattern', originalSource);
    }

    static create(target: ArrayPattern, originalSource: string): ArrayPatternTypeClass {
        throw new Error('ArrayPatternTypeClass.create is not implemented: ' + target.type);
    }
}

export const arrayPatternTypePair: EvaluatePair<ArrayPattern, ArrayPatternTypeClass> =
    makeEvaluatePair(isArrayPattern, (target, originalSource) =>
        ArrayPatternTypeClass.create(target, originalSource),
    );

export const isArrayPatternType = (
    target: LwcCommonTypeClass<string>,
): target is ArrayPatternTypeClass => target instanceof ArrayPatternTypeClass;
