import { isSwitchCase, type SwitchCase } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNodeList,
    visitOptionalNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

export type SwitchCaseFields = {
    test: ExpressionTypeClass | LwcErrorTypeClass | null;
    consequent: (StatementTypeClass | LwcErrorTypeClass)[];
};

export class SwitchCaseTypeClass extends LwcCommonTypeClass<'switchCase'> {
    private readonly value: SwitchCaseFields;

    private constructor(value: SwitchCaseFields) {
        super('switchCase');
        this.value = value;
    }

    static create(target: SwitchCase, originalSource: string): SwitchCaseTypeClass {
        return new SwitchCaseTypeClass({
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
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): SwitchCaseFields {
        return this.value;
    }

    getTest(): SwitchCaseFields['test'] {
        return this.value.test;
    }

    getConsequent(): SwitchCaseFields['consequent'] {
        return this.value.consequent;
    }
}

export const switchCaseTypePair: EvaluatePair<SwitchCase, SwitchCaseTypeClass> = makeEvaluatePair(
    isSwitchCase,
    (target, originalSource) => SwitchCaseTypeClass.create(target, originalSource),
);

export const isSwitchCaseType = (
    target: LwcCommonTypeClass<string>,
): target is SwitchCaseTypeClass => target instanceof SwitchCaseTypeClass;
