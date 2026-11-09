import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isSwitchCase, type SwitchCase } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNodeList,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

export type SwitchCaseFields = TypeField<'switchCase'> & {
    test: ExpressionTypeClass | null;
    consequent: StatementTypeClass[];
};

export class SwitchCaseTypeClass extends LwcCommonTypeClass<'switchCase', SwitchCaseFields> {
    private constructor(value: FieldsOf<SwitchCaseFields>, sourceSpan: SourceSpan) {
        super('switchCase', value, sourceSpan);
    }

    static create(target: SwitchCase, originalSource: string): SwitchCaseTypeClass {
        return new SwitchCaseTypeClass(
            {
                test: visitOptionalNode(
                    target.test,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
                consequent: visitNodeList(
                    target.consequent,
                    originalSource,
                    statementVisitorEvaluatePairs(),
                    'StatementVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTest(): SwitchCaseFields['test'] {
        return this.getFields().test;
    }

    getConsequent(): SwitchCaseFields['consequent'] {
        return this.getFields().consequent;
    }
}

export const switchCaseTypePair: EvaluatePair<SwitchCase, SwitchCaseTypeClass> = makeEvaluatePair(
    isSwitchCase,
    (target, originalSource) => SwitchCaseTypeClass.create(target, originalSource),
);

export const isSwitchCaseType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is SwitchCaseTypeClass => target instanceof SwitchCaseTypeClass;
