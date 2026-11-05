import { isTSModuleDeclaration, type TSModuleDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import {
    tSEntityNameVisitorEvaluatePairs,
    type TSEntityNameTypeClass,
} from '../tsEntityNameVisitor';
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';
import { tSModuleBlockTypePair, type TSModuleBlockTypeClass } from './tSModuleBlock';

const tSModuleDeclarationIdPairs = lazyPairs(
    () => [...tSEntityNameVisitorEvaluatePairs(), stringLiteralTypePair] as const,
);
const tSModuleDeclarationBodyPairs = lazyPairs(() => [tSModuleBlockTypePair] as const);

export type TSModuleDeclarationFields = {
    kind: TSModuleDeclaration['kind'];
    declare: NonNullable<TSModuleDeclaration['declare']> | null;
    id: TSEntityNameTypeClass | StringLiteralTypeClass | LwcErrorTypeClass;
    body: TSModuleBlockTypeClass | LwcErrorTypeClass;
};

export class TSModuleDeclarationTypeClass extends LwcCommonTypeClass<'tSModuleDeclaration'> {
    private readonly value: TSModuleDeclarationFields;

    private constructor(value: TSModuleDeclarationFields) {
        super('tSModuleDeclaration');
        this.value = value;
    }

    static create(
        target: TSModuleDeclaration,
        originalSource: string,
    ): TSModuleDeclarationTypeClass {
        return new TSModuleDeclarationTypeClass({
            kind: target.kind,
            declare: target.declare ?? null,
            id: visitNode(
                target.id,
                originalSource,
                tSModuleDeclarationIdPairs(),
                'TSModuleDeclaration.id',
            ),
            body: visitNode(
                target.body,
                originalSource,
                tSModuleDeclarationBodyPairs(),
                'TSModuleDeclaration.body',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSModuleDeclarationFields {
        return this.value;
    }

    getKind(): TSModuleDeclarationFields['kind'] {
        return this.value.kind;
    }

    getDeclare(): TSModuleDeclarationFields['declare'] {
        return this.value.declare;
    }

    getId(): TSModuleDeclarationFields['id'] {
        return this.value.id;
    }

    getBody(): TSModuleDeclarationFields['body'] {
        return this.value.body;
    }
}

export const tSModuleDeclarationTypePair: EvaluatePair<
    TSModuleDeclaration,
    TSModuleDeclarationTypeClass
> = makeEvaluatePair(isTSModuleDeclaration, (target, originalSource) =>
    TSModuleDeclarationTypeClass.create(target, originalSource),
);

export const isTSModuleDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TSModuleDeclarationTypeClass => target instanceof TSModuleDeclarationTypeClass;
