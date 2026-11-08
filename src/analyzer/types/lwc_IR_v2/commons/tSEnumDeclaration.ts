import { isTSEnumDeclaration, type TSEnumDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { tSEnumBodyTypePair, type TSEnumBodyTypeClass } from '../typeScriptVisitor/tSEnumBody';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const tSEnumDeclarationIdPairs = lazyPairs(() => [identifierTypePair] as const);
const tSEnumDeclarationBodyPairs = lazyPairs(() => [tSEnumBodyTypePair] as const);

export type TSEnumDeclarationFields = {
    declare: NonNullable<TSEnumDeclaration['declare']> | null;
    const: NonNullable<TSEnumDeclaration['const']> | null;
    id: IdentifierTypeClass | LwcErrorTypeClass;
    body: TSEnumBodyTypeClass | LwcErrorTypeClass;
};

export class TSEnumDeclarationTypeClass extends LwcCommonTypeClass<'tSEnumDeclaration'> {
    private readonly value: TSEnumDeclarationFields;

    private constructor(value: TSEnumDeclarationFields) {
        super('tSEnumDeclaration');
        this.value = value;
    }

    static create(target: TSEnumDeclaration, originalSource: string): TSEnumDeclarationTypeClass {
        return new TSEnumDeclarationTypeClass({
            declare: target.declare ?? null,
            const: target.const ?? null,
            id: visitNode(
                target.id,
                originalSource,
                tSEnumDeclarationIdPairs(),
                'TSEnumDeclaration.id',
            ),
            body: visitNode(
                target.body,
                originalSource,
                tSEnumDeclarationBodyPairs(),
                'TSEnumDeclaration.body',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSEnumDeclarationFields {
        return this.value;
    }

    getDeclare(): TSEnumDeclarationFields['declare'] {
        return this.value.declare;
    }

    getConst(): TSEnumDeclarationFields['const'] {
        return this.value.const;
    }

    getId(): TSEnumDeclarationFields['id'] {
        return this.value.id;
    }

    getBody(): TSEnumDeclarationFields['body'] {
        return this.value.body;
    }
}

export const tSEnumDeclarationTypePair: EvaluatePair<
    TSEnumDeclaration,
    TSEnumDeclarationTypeClass
> = makeEvaluatePair(isTSEnumDeclaration, (target, originalSource) =>
    TSEnumDeclarationTypeClass.create(target, originalSource),
);

export const isTSEnumDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TSEnumDeclarationTypeClass => target instanceof TSEnumDeclarationTypeClass;
