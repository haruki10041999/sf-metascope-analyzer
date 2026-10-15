import fs from 'node:fs/promises';
import path from 'path';

import { ApexParserFactory } from '@apexdevtools/apex-parser';

import { ApexSyntaxErrorCollector } from './apexSyntaxError';

import {
    UnitVisitor,
    isCompilationUnitType,
    CompilationUnitType,
    compilationUnitConvert,
    makeCompilationUnitType,
    ErrorTypeClass,
} from '../../types';

export type ClsDataType = {
    filePath: string;
    value?: CompilationUnitType;
    errorClasses?: ErrorTypeClass[];
};

const errorToJson = (error: ErrorTypeClass) => ({
    type: error.getType(),
    code: error.getCode(),
    contextType: error.getContextType(),
    context: error.getContext(),
    message: error.getParseErrorMessage(),
    span: error.getSpan(),
});

export class ApexClsParser {
    static async readApexClass(baseDir: string): Promise<CompilationUnitType[]> {
        const apexClasses: CompilationUnitType[] = [];
        const apexClassDir = path.join(baseDir, 'cls');
        const apexClassPathList = (await fs.readdir(apexClassDir, { withFileTypes: true }))
            .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
            .map((entry) => entry.name);
        for (const apexClassPath of apexClassPathList) {
            const apexClass = JSON.parse(
                await fs.readFile(path.join(apexClassDir, apexClassPath), 'utf-8'),
            ) as CompilationUnitType;
            apexClasses.push(apexClass);
        }

        return apexClasses;
    }

    static async parseApexClass(filePath: string): Promise<ClsDataType> {
        const clsData: ClsDataType = {
            filePath: filePath,
        };

        const source = await fs.readFile(filePath, 'utf-8');
        const syntaxErrors = new ApexSyntaxErrorCollector();
        const errorClass: ErrorTypeClass[] = [];

        const { parser } = ApexParserFactory.createLexerAndParser(source, syntaxErrors);
        const unitTypeClass = new UnitVisitor().visit(parser.compilationUnit());

        let unitType: CompilationUnitType | undefined;
        if (isCompilationUnitType(unitTypeClass)) {
            unitType = makeCompilationUnitType(compilationUnitConvert(unitTypeClass, errorClass));
        } else {
            errorClass.push(unitTypeClass);
        }

        if (unitType) {
            clsData.value = unitType;
        }

        if (errorClass.length > 0) {
            clsData.errorClasses = errorClass;
        }

        return clsData;
    }

    static async findClsFiles(repogitoryDir: string): Promise<string[]> {
        const clsDir = path.join(repogitoryDir, 'force-app', 'main', 'default', 'classes');

        const result: string[] = [];

        for (const entry of await fs.readdir(clsDir, { withFileTypes: true })) {
            const fullPath = path.join(clsDir, entry.name);

            if (entry.isDirectory()) {
                result.push(...(await this.findClsFiles(fullPath)));
            } else if (entry.isFile() && entry.name.endsWith('.cls')) {
                result.push(fullPath);
            }
        }

        return result;
    }

    static async parseAllApexClasses(repogitoryDir: string): Promise<ClsDataType[]> {
        const clsPath = await ApexClsParser.findClsFiles(repogitoryDir);
        const result: ClsDataType[] = [];

        for (const clsFilePath of clsPath) {
            const clsData = await this.parseApexClass(clsFilePath);
            result.push(clsData);
        }
        return result;
    }

    static async saveApexClass(clsData: ClsDataType, outputDir: string): Promise<void> {
        if (clsData.value) {
            const resultDir = path.join(outputDir, 'cls');
            await fs.mkdir(resultDir, { recursive: true });
            const resultPath = path.join(
                resultDir,
                path.basename(path.basename(clsData.filePath).replace('.cls', '.json')),
            );

            await fs.writeFile(resultPath, JSON.stringify(clsData.value, null, 2), 'utf-8');
        }

        if (clsData.errorClasses && clsData.errorClasses.length > 0) {
            const failedDir = path.join(outputDir, 'failed');
            await fs.mkdir(failedDir, { recursive: true });
            const failedPath = path.join(
                failedDir,
                path.basename(path.basename(clsData.filePath).replace('.cls', '.json')),
            );
            await fs.writeFile(
                failedPath,
                JSON.stringify(
                    clsData.errorClasses.map((error) => errorToJson(error)),
                    null,
                    2,
                ),
                'utf-8',
            );
        }
    }

    static async saveAllApexClasses(clsDataArray: ClsDataType[], outputDir: string): Promise<void> {
        for (const clsData of clsDataArray) {
            await this.saveApexClass(clsData, outputDir);
        }
    }
}
