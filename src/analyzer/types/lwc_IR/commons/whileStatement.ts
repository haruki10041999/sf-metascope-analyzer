import { isWhileStatement, type WhileStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class WhileStatementTypeClass extends LwcCommonTypeClass<'whileStatement'> {
    private constructor(originalSource: string) {
        super('whileStatement', originalSource);
    }

    static create(target: WhileStatement, originalSource: string): WhileStatementTypeClass {
        throw new Error('WhileStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const whileStatementTypePair: EvaluatePair<WhileStatement, WhileStatementTypeClass> =
    makeEvaluatePair(isWhileStatement, (target, originalSource) =>
        WhileStatementTypeClass.create(target, originalSource),
    );

export const isWhileStatementType = (
    target: LwcCommonTypeClass<string>,
): target is WhileStatementTypeClass => target instanceof WhileStatementTypeClass;
