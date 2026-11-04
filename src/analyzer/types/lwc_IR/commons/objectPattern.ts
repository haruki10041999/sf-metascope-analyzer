import { isObjectPattern, type ObjectPattern } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ObjectPatternTypeClass extends LwcCommonTypeClass<'objectPattern'> {
    private constructor(originalSource: string) {
        super('objectPattern', originalSource);
    }

    static create(target: ObjectPattern, originalSource: string): ObjectPatternTypeClass {
        throw new Error('ObjectPatternTypeClass.create is not implemented: ' + target.type);
    }
}

export const objectPatternTypePair: EvaluatePair<ObjectPattern, ObjectPatternTypeClass> =
    makeEvaluatePair(isObjectPattern, (target, originalSource) =>
        ObjectPatternTypeClass.create(target, originalSource),
    );

export const isObjectPatternType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectPatternTypeClass => target instanceof ObjectPatternTypeClass;
