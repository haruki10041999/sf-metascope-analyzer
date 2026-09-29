import { QualifiedNameContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';

export type QualifiedNameType = {
    type: 'qualifiedName';
    name: IdType[];
};

export const makeQualifiedNameType = (ctx: QualifiedNameContext): QualifiedNameType => {
    if (!ctx.id_list() || ctx.id_list().length === 0) {
        throw new Error('値が異常です。QualifiedNameContext: ' + ctx.getText());
    }

    const names: IdType[] = [];
    ctx.id_list().forEach((idCtx) => {
        const value = new IdVisitor().visit(idCtx);
        names.push(value);
    });

    return {
        type: 'qualifiedName',
        name: names,
    };
};
