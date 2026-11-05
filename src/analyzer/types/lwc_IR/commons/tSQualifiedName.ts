import { isTSQualifiedName, type TSQualifiedName } from '@babel/types';
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
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const tSQualifiedNameRightPairs = lazyPairs(() => [identifierTypePair] as const);

export type TSQualifiedNameFields = {
    left: TSEntityNameTypeClass | LwcErrorTypeClass;
    right: IdentifierTypeClass | LwcErrorTypeClass;
};

export class TSQualifiedNameTypeClass extends LwcCommonTypeClass<'tSQualifiedName'> {
    private readonly value: TSQualifiedNameFields;

    private constructor(value: TSQualifiedNameFields) {
        super('tSQualifiedName');
        this.value = value;
    }

    static create(target: TSQualifiedName, originalSource: string): TSQualifiedNameTypeClass {
        return new TSQualifiedNameTypeClass({
            left: visitNode(
                target.left,
                originalSource,
                tSEntityNameVisitorEvaluatePairs(),
                'TSEntityNameVisitor',
            ),
            right: visitNode(
                target.right,
                originalSource,
                tSQualifiedNameRightPairs(),
                'TSQualifiedName.right',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSQualifiedNameFields {
        return this.value;
    }

    getLeft(): TSQualifiedNameFields['left'] {
        return this.value.left;
    }

    getRight(): TSQualifiedNameFields['right'] {
        return this.value.right;
    }
}

export const tSQualifiedNameTypePair: EvaluatePair<TSQualifiedName, TSQualifiedNameTypeClass> =
    makeEvaluatePair(isTSQualifiedName, (target, originalSource) =>
        TSQualifiedNameTypeClass.create(target, originalSource),
    );

export const isTSQualifiedNameType = (
    target: LwcCommonTypeClass<string>,
): target is TSQualifiedNameTypeClass => target instanceof TSQualifiedNameTypeClass;
