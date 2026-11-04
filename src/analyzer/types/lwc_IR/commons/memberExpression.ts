import { isMemberExpression, type MemberExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class MemberExpressionTypeClass extends LwcCommonTypeClass<'memberExpression'> {
    private constructor(originalSource: string) {
        super('memberExpression', originalSource);
    }

    static create(target: MemberExpression, originalSource: string): MemberExpressionTypeClass {
        throw new Error('MemberExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const memberExpressionTypePair: EvaluatePair<MemberExpression, MemberExpressionTypeClass> =
    makeEvaluatePair(isMemberExpression, (target, originalSource) =>
        MemberExpressionTypeClass.create(target, originalSource),
    );

export const isMemberExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is MemberExpressionTypeClass => target instanceof MemberExpressionTypeClass;
