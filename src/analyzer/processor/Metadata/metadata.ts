import fs from 'node:fs/promises';
import path from 'path';

import { MetadataParser } from '../../parser/index';

import {
    Status,
    MetadataObject,
    MetadataField,
    MetadataObjectDiff,
    MetadataFieldDiff,
} from '../../types/index';

export class MetadataProcessor {
    private savingRoot: string = '';
    private repositoryRoot: string = '';

    private metadataObjectDiffs: MetadataObjectDiff[] = [];

    constructor(
        savingRoot: string, //結果をセーブしている部分
        repositoryRoot: string,
    ) {
        this.savingRoot = savingRoot;
        this.repositoryRoot = path.join(repositoryRoot, 'force-app', 'main', 'default', 'objects');
    }

    static async create(savingRoot: string, repositoryRoot: string): Promise<MetadataProcessor> {
        const processor = new MetadataProcessor(savingRoot, repositoryRoot);
        await processor.reset();
        return processor;
    }

    getMetadataObjectDiffs(): MetadataObjectDiff[] {
        return this.metadataObjectDiffs;
    }

    getSingleMetadataObjectDiff(targetObjectApiName: string): MetadataObjectDiff | undefined {
        return this.metadataObjectDiffs.find((object) => object.apiName === targetObjectApiName);
    }

    getRelatedMetadataObjectsDiff(targetObjectApiNames: string[], depth = 1): MetadataObjectDiff[] {
        if (!Number.isInteger(depth) || depth <= 0) {
            return [];
        }
        const metadataDiffs: MetadataObjectDiff[] = [];
        let targetApiNames = new Set(targetObjectApiNames);
        const addedMetadataObjectDiffs = new Set<string>();
        let maxDepth = depth;
        while (targetApiNames.size > 0 && maxDepth > 0) {
            const nextTargetApiNames: Set<string> = new Set();
            this.metadataObjectDiffs.forEach((metadataDiff) => {
                const parentApiName = metadataDiff.apiName;
                if (
                    !addedMetadataObjectDiffs.has(parentApiName) &&
                    targetApiNames.has(parentApiName)
                ) {
                    metadataDiffs.push(metadataDiff);
                    addedMetadataObjectDiffs.add(parentApiName);
                    metadataDiff.fields.forEach((field) => {
                        if (field.type === 'Lookup' || field.type === 'MasterDetail') {
                            nextTargetApiNames.add(field.referenceObjectApiName);
                        }
                    });
                }
            });
            targetApiNames = nextTargetApiNames;
            maxDepth--;
        }

        return metadataDiffs;
    }

    getSingleMetadataObject(targetObjectApiName: string): MetadataObject | undefined {
        const objectDiff = this.getSingleMetadataObjectDiff(targetObjectApiName);
        if (!objectDiff) return undefined;
        return this.convertMetaDataObjects([objectDiff])[0];
    }

    getRelatedMetadataObjects(targetObjectApiNames: string[], depth = 1): MetadataObject[] {
        const objectDiffs = this.getRelatedMetadataObjectsDiff(targetObjectApiNames, depth);
        return this.convertMetaDataObjects(objectDiffs);
    }

    getNewMetadataObjects(): MetadataObject[] {
        return this.convertMetaDataObjects(
            this.metadataObjectDiffs
                .filter((object) => object.status === 'New')
                .map((object) => {
                    return {
                        ...object,
                        fields: object.fields.filter((field) => field.status === 'New'),
                    };
                }),
        );
    }

    getDeleteMetadataObjects(): MetadataObject[] {
        return this.convertMetaDataObjects(
            this.metadataObjectDiffs
                .filter((object) => object.status === 'Delete')
                .map((object) => {
                    return {
                        ...object,
                        fields: object.fields.filter((field) => field.status === 'Delete'),
                    };
                }),
        );
    }

    getUpdatedMetadataObjects(): MetadataObject[] {
        return this.convertMetaDataObjects(
            this.metadataObjectDiffs
                .filter((object) => object.status !== 'Delete')
                .map((object) => {
                    return {
                        ...object,
                        fields: object.fields.filter((field) => field.status !== 'Delete'),
                    };
                }),
        );
    }

    getPreMetadataObjects(): MetadataObject[] {
        return this.convertMetaDataObjects(
            this.metadataObjectDiffs
                .filter((object) => object.status !== 'New')
                .map((object) => {
                    return {
                        ...object,
                        fields: object.fields.filter((field) => field.status !== 'New'),
                    };
                }),
        );
    }

    convertMetaDataObjects(metadataObjectDiffs: MetadataObjectDiff[]): MetadataObject[] {
        return metadataObjectDiffs.map((metadata) => {
            return {
                ...metadata,
                fields: metadata.fields.map(({ status, ...field }) => field),
            };
        });
    }

    async reset(): Promise<void> {
        this.metadataObjectDiffs = await this.diffMetaDataObjects(
            this.savingRoot,
            this.repositoryRoot,
        );
    }

    async save(): Promise<void> {
        const objectDir = path.join(this.savingRoot, 'objects');
        await fs.mkdir(objectDir, { recursive: true });
        const metadataObjects: MetadataObject[] = this.getUpdatedMetadataObjects();
        for (const metadataObject of metadataObjects) {
            const objectFilePath = path.join(objectDir, `${metadataObject.apiName}.json`);
            await fs.writeFile(objectFilePath, JSON.stringify(metadataObject, null, 2));
        }
        await this.reset();
    }

    private async diffMetaDataObjects(
        savingRoot: string,
        repositoryRoot: string,
    ): Promise<MetadataObjectDiff[]> {
        const metadataObjectDiffs: MetadataObjectDiff[] = [];
        const preMetadataObjects: MetadataObject[] = await this.getPreObjectList(savingRoot);
        const currentMetadataObjects: MetadataObject[] =
            await this.getCurrentObjectList(repositoryRoot);

        const { newApiNames, deleteApiNames } = this.splitApiNames(
            preMetadataObjects.map((object) => object.apiName),
            currentMetadataObjects.map((object) => object.apiName),
        );

        currentMetadataObjects.forEach((metadata) => {
            if (newApiNames.includes(metadata.apiName)) {
                metadataObjectDiffs.push({
                    ...metadata,
                    fields: metadata.fields.map((field) => {
                        const metadataFieldDiff: MetadataFieldDiff = {
                            ...field,
                            status: 'New',
                        };
                        return metadataFieldDiff;
                    }),
                    status: 'New',
                });
                return;
            }

            const preMetadataObject = preMetadataObjects.find(
                (object) => object.apiName === metadata.apiName,
            );
            if (preMetadataObject) {
                const metadataFieldDiffs: MetadataFieldDiff[] = this.makeMetadataFieldDiffs(
                    preMetadataObject.fields,
                    metadata.fields,
                    deleteApiNames,
                );
                metadataObjectDiffs.push({
                    ...metadata,
                    fields: metadataFieldDiffs,
                    status: 'Exist',
                });
            }
        });

        preMetadataObjects.forEach((metadata) => {
            if (deleteApiNames.includes(metadata.apiName)) {
                metadataObjectDiffs.push({
                    ...metadata,
                    fields: metadata.fields.map((field) => {
                        const metadataFieldDiff: MetadataFieldDiff = {
                            ...field,
                            status: 'Delete',
                        };
                        return metadataFieldDiff;
                    }),
                    status: 'Delete',
                });
            }
        });

        return metadataObjectDiffs.sort((a, b) => a.apiName.localeCompare(b.apiName));
    }

    private makeMetadataFieldDiffs(
        preMetadataFields: MetadataField[],
        currentMetadataFields: MetadataField[],
        deleteObjectApiNames: string[],
    ): MetadataFieldDiff[] {
        const metadataFieldDiffs: MetadataFieldDiff[] = [];

        const { newApiNames, deleteApiNames } = this.splitApiNames(
            preMetadataFields.map((object) => object.apiName),
            currentMetadataFields.map((object) => object.apiName),
        );

        currentMetadataFields.forEach((metadata) => {
            if (
                (metadata.type === 'Lookup' || metadata.type === 'MasterDetail') &&
                deleteObjectApiNames.includes(metadata.referenceObjectApiName)
            ) {
                metadataFieldDiffs.push({
                    ...metadata,
                    status: 'Delete',
                });
                return;
            }

            let status: Status = 'Exist';
            if (newApiNames.includes(metadata.apiName)) {
                status = 'New';
            }

            const metadataFieldDiff: MetadataFieldDiff = {
                ...metadata,
                status: status,
            };
            metadataFieldDiffs.push(metadataFieldDiff);
        });

        preMetadataFields.forEach((metadata) => {
            if (deleteApiNames.includes(metadata.apiName)) {
                const metadataFieldDiff: MetadataFieldDiff = {
                    ...metadata,
                    status: 'Delete',
                };
                metadataFieldDiffs.push(metadataFieldDiff);
                return;
            }
        });

        return metadataFieldDiffs.sort((a, b) => a.apiName.localeCompare(b.apiName));
    }

    private splitApiNames(
        preApiNames: string[],
        currentApiNames: string[],
    ): {
        newApiNames: string[];
        deleteApiNames: string[];
    } {
        return {
            newApiNames: currentApiNames.filter((apiName) => !preApiNames.includes(apiName)),
            deleteApiNames: preApiNames.filter((apiName) => !currentApiNames.includes(apiName)),
        };
    }

    private async getPreObjectList(baseDir: string): Promise<MetadataObject[]> {
        try {
            await fs.access(baseDir);
        } catch {
            return [];
        }
        return await MetadataParser.readMetadataObject(baseDir);
    }

    private async getCurrentObjectList(baseDir: string): Promise<MetadataObject[]> {
        try {
            await fs.access(baseDir);
        } catch {
            return [];
        }

        const metadataObjects: MetadataObject[] = [];

        const objectDirList = (await fs.readdir(baseDir, { withFileTypes: true }))
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name);

        for (const objectApiName of objectDirList) {
            const metadataObject: MetadataObject = MetadataParser.parseSingleObject(objectApiName);
            const fieldPath = path.join(baseDir, objectApiName, 'fields');
            const fieldApiNames = (await fs.readdir(fieldPath, { withFileTypes: true }))
                .filter((entry) => entry.isFile() && entry.name.endsWith('.field-meta.xml'))
                .map((entry) => entry.name.replace('.field-meta.xml', ''));
            const parsedFields = [];
            for (const fieldApiName of fieldApiNames) {
                parsedFields.push(
                    await MetadataParser.parseSingleField(baseDir, objectApiName, fieldApiName),
                );
            }
            metadataObject.fields = [...metadataObject.fields, ...parsedFields];
            metadataObjects.push(metadataObject);
        }

        return metadataObjects;
    }
}
