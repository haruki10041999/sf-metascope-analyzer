import { isLabeledStatement, type LabeledStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class LabeledStatementTypeClass extends LwcCommonTypeClass<'labeledStatement'> {
    private constructor(originalSource: string) {
        super('labeledStatement', originalSource);
    }

    static create(target: LabeledStatement, originalSource: string): LabeledStatementTypeClass {
        throw new Error('LabeledStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const labeledStatementTypePair: EvaluatePair<LabeledStatement, LabeledStatementTypeClass> =
    makeEvaluatePair(isLabeledStatement, (target, originalSource) =>
        LabeledStatementTypeClass.create(target, originalSource),
    );

export const isLabeledStatementType = (
    target: LwcCommonTypeClass<string>,
): target is LabeledStatementTypeClass => target instanceof LabeledStatementTypeClass;
