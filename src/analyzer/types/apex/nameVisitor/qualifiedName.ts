import { QualifiedNameContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';

export type QualifiedNameType = {
    type: 'qualifiedName';
    name: string[];
};

export const makeQualifiedNameType = (ctx: QualifiedNameContext): QualifiedNameType => {
    const names: string[] = [];
    if (ctx.id_list() && ctx.id_list().length > 0) {
        ctx.id_list().forEach((idCtx) => {
            const { type, value } = new IdVisitor().visit(idCtx);
            if (type === 'id') {
                names.push(value);
            }
        });
    }

    return {
        type: 'qualifiedName',
        name: names,
    };
};
