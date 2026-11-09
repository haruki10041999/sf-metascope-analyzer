import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isModuleExpression, type ModuleExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { ProgramTypeClass } from '../commons/program';

export type ModuleExpressionFields = TypeField<'moduleExpression'> & {
    body: ProgramTypeClass;
};

export class ModuleExpressionTypeClass extends LwcCommonTypeClass<
    'moduleExpression',
    ModuleExpressionFields
> {
    private constructor(value: FieldsOf<ModuleExpressionFields>, sourceSpan: SourceSpan) {
        super('moduleExpression', value, sourceSpan);
    }

    static create(target: ModuleExpression, originalSource: string): ModuleExpressionTypeClass {
        return new ModuleExpressionTypeClass(
            {
                body: ProgramTypeClass.create(target.body, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getBody(): ModuleExpressionFields['body'] {
        return this.getFields().body;
    }
}

export const moduleExpressionTypePair: EvaluatePair<ModuleExpression, ModuleExpressionTypeClass> =
    makeEvaluatePair(isModuleExpression, (target, originalSource) =>
        ModuleExpressionTypeClass.create(target, originalSource),
    );

export const isModuleExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ModuleExpressionTypeClass => target instanceof ModuleExpressionTypeClass;
