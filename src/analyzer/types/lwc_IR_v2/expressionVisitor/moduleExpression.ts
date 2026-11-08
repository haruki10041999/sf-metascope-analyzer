import { isModuleExpression, type ModuleExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { programTypePair, type ProgramTypeClass } from '../commons/program';

const moduleExpressionBodyPairs = lazyPairs(() => [programTypePair] as const);

export type ModuleExpressionFields = {
    body: ProgramTypeClass | LwcErrorTypeClass;
};

export class ModuleExpressionTypeClass extends LwcCommonTypeClass<'moduleExpression'> {
    private readonly value: ModuleExpressionFields;

    private constructor(value: ModuleExpressionFields) {
        super('moduleExpression');
        this.value = value;
    }

    static create(target: ModuleExpression, originalSource: string): ModuleExpressionTypeClass {
        return new ModuleExpressionTypeClass({
            body: visitNode(
                target.body,
                originalSource,
                moduleExpressionBodyPairs(),
                'ModuleExpression.body',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ModuleExpressionFields {
        return this.value;
    }

    getBody(): ModuleExpressionFields['body'] {
        return this.value.body;
    }
}

export const moduleExpressionTypePair: EvaluatePair<ModuleExpression, ModuleExpressionTypeClass> =
    makeEvaluatePair(isModuleExpression, (target, originalSource) =>
        ModuleExpressionTypeClass.create(target, originalSource),
    );

export const isModuleExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ModuleExpressionTypeClass => target instanceof ModuleExpressionTypeClass;
