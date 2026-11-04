import { isClassExpression, type ClassExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ClassExpressionTypeClass extends LwcCommonTypeClass<'classExpression'> {
    private constructor(originalSource: string) {
        super('classExpression', originalSource);
    }

    static create(target: ClassExpression, originalSource: string): ClassExpressionTypeClass {
        throw new Error('ClassExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const classExpressionTypePair: EvaluatePair<ClassExpression, ClassExpressionTypeClass> =
    makeEvaluatePair(isClassExpression, (target, originalSource) =>
        ClassExpressionTypeClass.create(target, originalSource),
    );

export const isClassExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ClassExpressionTypeClass => target instanceof ClassExpressionTypeClass;
