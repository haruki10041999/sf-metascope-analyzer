import { isSwitchStatement, type SwitchStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { switchCaseTypePair, type SwitchCaseTypeClass } from '../standardizedVisitor/switchCase';

const switchStatementCasesPairs = lazyPairs(() => [switchCaseTypePair] as const);

export type SwitchStatementFields = {
    discriminant: ExpressionTypeClass | LwcErrorTypeClass;
    cases: (SwitchCaseTypeClass | LwcErrorTypeClass)[];
};

export class SwitchStatementTypeClass extends LwcCommonTypeClass<'switchStatement'> {
    private readonly value: SwitchStatementFields;

    private constructor(value: SwitchStatementFields) {
        super('switchStatement');
        this.value = value;
    }

    static create(target: SwitchStatement, originalSource: string): SwitchStatementTypeClass {
        return new SwitchStatementTypeClass({
            discriminant: visitNode(
                target.discriminant,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            cases: visitNodeList(
                target.cases,
                originalSource,
                switchStatementCasesPairs(),
                'SwitchStatement.cases',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): SwitchStatementFields {
        return this.value;
    }

    getDiscriminant(): SwitchStatementFields['discriminant'] {
        return this.value.discriminant;
    }

    getCases(): SwitchStatementFields['cases'] {
        return this.value.cases;
    }
}

export const switchStatementTypePair: EvaluatePair<SwitchStatement, SwitchStatementTypeClass> =
    makeEvaluatePair(isSwitchStatement, (target, originalSource) =>
        SwitchStatementTypeClass.create(target, originalSource),
    );

export const isSwitchStatementType = (
    target: LwcCommonTypeClass<string>,
): target is SwitchStatementTypeClass => target instanceof SwitchStatementTypeClass;
