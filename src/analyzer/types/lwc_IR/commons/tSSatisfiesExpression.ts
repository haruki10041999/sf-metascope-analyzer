import { isTSSatisfiesExpression, type TSSatisfiesExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSSatisfiesExpressionTypeClass extends LwcCommonTypeClass<'tSSatisfiesExpression'> {
    private constructor(originalSource: string) {
        super('tSSatisfiesExpression', originalSource);
    }

    static create(
        target: TSSatisfiesExpression,
        originalSource: string,
    ): TSSatisfiesExpressionTypeClass {
        throw new Error('TSSatisfiesExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSSatisfiesExpressionTypePair: EvaluatePair<
    TSSatisfiesExpression,
    TSSatisfiesExpressionTypeClass
> = makeEvaluatePair(isTSSatisfiesExpression, (target, originalSource) =>
    TSSatisfiesExpressionTypeClass.create(target, originalSource),
);

export const isTSSatisfiesExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is TSSatisfiesExpressionTypeClass => target instanceof TSSatisfiesExpressionTypeClass;
