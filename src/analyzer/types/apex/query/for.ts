export const makeForField = (forClause: string[]): string | undefined => {
    if (forClause.length !== 1) {
        return undefined;
    }

    return forClause.at(0)!;
};
