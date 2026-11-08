import { isStaticBlock, type StaticBlock } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

export type StaticBlockFields = {
    body: (StatementTypeClass | LwcErrorTypeClass)[];
};

export class StaticBlockTypeClass extends LwcCommonTypeClass<'staticBlock'> {
    private readonly value: StaticBlockFields;

    private constructor(value: StaticBlockFields) {
        super('staticBlock');
        this.value = value;
    }

    static create(target: StaticBlock, originalSource: string): StaticBlockTypeClass {
        return new StaticBlockTypeClass({
            body: visitNodeList(
                target.body,
                originalSource,
                statementVisitorEvaluatePairs(),
                'StatementVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): StaticBlockFields {
        return this.value;
    }

    getBody(): StaticBlockFields['body'] {
        return this.value.body;
    }
}

export const staticBlockTypePair: EvaluatePair<StaticBlock, StaticBlockTypeClass> =
    makeEvaluatePair(isStaticBlock, (target, originalSource) =>
        StaticBlockTypeClass.create(target, originalSource),
    );

export const isStaticBlockType = (
    target: LwcCommonTypeClass<string>,
): target is StaticBlockTypeClass => target instanceof StaticBlockTypeClass;
