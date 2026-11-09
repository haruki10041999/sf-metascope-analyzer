import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isSwitchStatement, type SwitchStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { SwitchCaseTypeClass } from '../standardizedVisitor/switchCase';

export type SwitchStatementFields = TypeField<'switchStatement'> & {
    discriminant: ExpressionTypeClass;
    cases: SwitchCaseTypeClass[];
};

export class SwitchStatementTypeClass extends LwcCommonTypeClass<
    'switchStatement',
    SwitchStatementFields
> {
    private constructor(value: FieldsOf<SwitchStatementFields>, sourceSpan: SourceSpan) {
        super('switchStatement', value, sourceSpan);
    }

    static create(target: SwitchStatement, originalSource: string): SwitchStatementTypeClass {
        return new SwitchStatementTypeClass(
            {
                discriminant: visitNode(
                    target.discriminant,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
                cases: target.cases.map((child) =>
                    SwitchCaseTypeClass.create(child, originalSource),
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getDiscriminant(): SwitchStatementFields['discriminant'] {
        return this.getFields().discriminant;
    }

    getCases(): SwitchStatementFields['cases'] {
        return this.getFields().cases;
    }
}

export const switchStatementTypePair: EvaluatePair<SwitchStatement, SwitchStatementTypeClass> =
    makeEvaluatePair(isSwitchStatement, (target, originalSource) =>
        SwitchStatementTypeClass.create(target, originalSource),
    );

export const isSwitchStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is SwitchStatementTypeClass => target instanceof SwitchStatementTypeClass;
