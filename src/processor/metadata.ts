import fs from 'node:fs/promises';
import path from 'path';

import { MetadataParser } from '../parser/metadata';

import { Status } from '../types/commons';

import {
    MetadataObject,
    MetadataField,
    MetadataObjectDiff,
    MetadataFieldDiff,
} from '../types/metadata';

export class MetadataProcessor {
    private preDir: string = '';
    private objectDir: string = '';

    private metadataObjectDiffs: MetadataObjectDiff[] = [];

    constructor(
        preDir: string, //結果をセーブしている部分
        objectDir: string, //force-app/default/main/objects
    ) {
        this.preDir = preDir;
        this.objectDir = objectDir;
    }

    static async create(preDir: string, objectDir: string): Promise<MetadataProcessor> {
        const processor = new MetadataProcessor(preDir, objectDir);
        await processor.reset(preDir, objectDir);
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
                        if (field.referenceObjectApiName) {
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
                        apiName: object.apiName,
                        dataType: object.dataType,
                        fields: object.fields.filter((field) => field.status === 'New'),
                        status: object.status,
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
                        apiName: object.apiName,
                        dataType: object.dataType,
                        fields: object.fields.filter((field) => field.status === 'Delete'),
                        status: object.status,
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
                        apiName: object.apiName,
                        dataType: object.dataType,
                        fields: object.fields.filter((field) => field.status !== 'Delete'),
                        status: object.status,
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
                        apiName: object.apiName,
                        dataType: object.dataType,
                        fields: object.fields.filter((field) => field.status !== 'New'),
                        status: object.status,
                    };
                }),
        );
    }

    convertMetaDataObjects(metadataObjectDiffs: MetadataObjectDiff[]): MetadataObject[] {
        return metadataObjectDiffs.map((metadata) => {
            return {
                apiName: metadata.apiName,
                dataType: metadata.dataType,
                fields: metadata.fields.map(({ status, ...field }) => field),
            };
        });
    }

    async reset(preDir: string, objectDir: string): Promise<void> {
        this.preDir = preDir;
        this.objectDir = objectDir;
        this.metadataObjectDiffs = await this.diffMetaDataObjects(preDir, objectDir);
    }

    async save(): Promise<void> {
        const objectDir = path.join(this.preDir, 'objects');
        await fs.mkdir(objectDir, { recursive: true });
        const metadataObjects: MetadataObject[] = this.getUpdatedMetadataObjects();
        for (const metadataObject of metadataObjects) {
            const objectFilePath = path.join(objectDir, `${metadataObject.apiName}.json`);
            await fs.writeFile(objectFilePath, JSON.stringify(metadataObject, null, 2));
        }
        await this.reset(this.preDir, this.objectDir);
    }

    private async diffMetaDataObjects(
        basePreDir: string,
        baseCurrentDir: string,
    ): Promise<MetadataObjectDiff[]> {
        const metadataObjectDiffs: MetadataObjectDiff[] = [];
        const preMetadataObjects: MetadataObject[] = await this.getPreObjectList(basePreDir);
        const currentMetadataObjects: MetadataObject[] =
            await this.getCurrentObjectList(baseCurrentDir);

        const { newApiNames, deleteApiNames } = this.splitApiNames(
            preMetadataObjects.map((object) => object.apiName),
            currentMetadataObjects.map((object) => object.apiName),
        );

        currentMetadataObjects.forEach((metadata) => {
            if (newApiNames.includes(metadata.apiName)) {
                metadataObjectDiffs.push({
                    apiName: metadata.apiName,
                    dataType: metadata.dataType,
                    fields: metadata.fields.map((field) => {
                        const metadataFieldDiff: MetadataFieldDiff = {
                            apiName: field.apiName,
                            dataType: field.dataType,
                            type: field.type,
                            status: 'New',
                        };
                        if (field.referenceObjectApiName) {
                            metadataFieldDiff.referenceObjectApiName = field.referenceObjectApiName;
                        }
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
                    apiName: metadata.apiName,
                    dataType: metadata.dataType,
                    fields: metadataFieldDiffs,
                    status: 'Exist',
                });
            }
        });

        preMetadataObjects.forEach((metadata) => {
            if (deleteApiNames.includes(metadata.apiName)) {
                metadataObjectDiffs.push({
                    apiName: metadata.apiName,
                    dataType: metadata.dataType,
                    fields: metadata.fields.map((field) => {
                        const metadataFieldDiff: MetadataFieldDiff = {
                            apiName: field.apiName,
                            dataType: field.dataType,
                            type: field.type,
                            status: 'Delete',
                        };
                        if (field.referenceObjectApiName) {
                            metadataFieldDiff.referenceObjectApiName = field.referenceObjectApiName;
                        }
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
                metadata.referenceObjectApiName &&
                deleteObjectApiNames.includes(metadata.referenceObjectApiName)
            ) {
                metadataFieldDiffs.push({
                    apiName: metadata.apiName,
                    dataType: metadata.dataType,
                    type: metadata.type,
                    referenceObjectApiName: metadata.referenceObjectApiName,
                    status: 'Delete',
                });
                return;
            }

            let status: Status = 'Exist';
            if (newApiNames.includes(metadata.apiName)) {
                status = 'New';
            }

            const metadataFieldDiff: MetadataFieldDiff = {
                apiName: metadata.apiName,
                dataType: metadata.dataType,
                type: metadata.type,
                status: status,
            };
            if (metadata.referenceObjectApiName) {
                metadataFieldDiff.referenceObjectApiName = metadata.referenceObjectApiName;
            }

            metadataFieldDiffs.push(metadataFieldDiff);
        });

        preMetadataFields.forEach((metadata) => {
            if (deleteApiNames.includes(metadata.apiName)) {
                const metadataFieldDiff: MetadataFieldDiff = {
                    apiName: metadata.apiName,
                    dataType: metadata.dataType,
                    type: metadata.type,
                    status: 'Delete',
                };
                if (metadata.referenceObjectApiName) {
                    metadataFieldDiff.referenceObjectApiName = metadata.referenceObjectApiName;
                }
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
        return MetadataParser.readMetadataObject(baseDir);
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
                    await MetadataParser.parseSingleField(
                        this.objectDir,
                        objectApiName,
                        fieldApiName,
                    ),
                );
            }
            metadataObject.fields = [...metadataObject.fields, ...parsedFields];
            metadataObjects.push(metadataObject);
        }

        return metadataObjects;
    }
}
