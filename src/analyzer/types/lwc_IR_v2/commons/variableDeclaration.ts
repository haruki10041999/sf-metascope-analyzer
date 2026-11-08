import { isVariableDeclaration, type VariableDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import {
    variableDeclaratorTypePair,
    type VariableDeclaratorTypeClass,
} from '../standardizedVisitor/variableDeclarator';

const variableDeclarationDeclarationsPairs = lazyPairs(() => [variableDeclaratorTypePair] as const);

export type VariableDeclarationFields = {
    declare: NonNullable<VariableDeclaration['declare']> | null;
    kind: VariableDeclaration['kind'];
    declarations: (VariableDeclaratorTypeClass | LwcErrorTypeClass)[];
};

export class VariableDeclarationTypeClass extends LwcCommonTypeClass<'variableDeclaration'> {
    private readonly value: VariableDeclarationFields;

    private constructor(value: VariableDeclarationFields) {
        super('variableDeclaration');
        this.value = value;
    }

    static create(
        target: VariableDeclaration,
        originalSource: string,
    ): VariableDeclarationTypeClass {
        return new VariableDeclarationTypeClass({
            declare: target.declare ?? null,
            kind: target.kind,
            declarations: visitNodeList(
                target.declarations,
                originalSource,
                variableDeclarationDeclarationsPairs(),
                'VariableDeclaration.declarations',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): VariableDeclarationFields {
        return this.value;
    }

    getDeclare(): VariableDeclarationFields['declare'] {
        return this.value.declare;
    }

    getKind(): VariableDeclarationFields['kind'] {
        return this.value.kind;
    }

    getDeclarations(): VariableDeclarationFields['declarations'] {
        return this.value.declarations;
    }
}

export const variableDeclarationTypePair: EvaluatePair<
    VariableDeclaration,
    VariableDeclarationTypeClass
> = makeEvaluatePair(isVariableDeclaration, (target, originalSource) =>
    VariableDeclarationTypeClass.create(target, originalSource),
);

export const isVariableDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is VariableDeclarationTypeClass => target instanceof VariableDeclarationTypeClass;
