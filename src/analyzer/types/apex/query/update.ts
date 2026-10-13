export const makeUpdateField = (update: string[]): string[] | undefined => {
    if (update.length > 0) {
        return update;
    }

    return undefined;
};
