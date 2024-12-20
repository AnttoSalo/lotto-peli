// This module reads the lotto results from the files and parses them into an array of LottoResult objects.

const fs = require('fs');
const path = require('path');

class LottoResult {
    constructor(date, primaryNumbers, secondaryNumbers) {
        this.date = date;
        this.primaryNumbers = primaryNumbers;
        this.secondaryNumbers = secondaryNumbers;
    }
}

function parseLottoResults(fileContent) {
    const results = [];
    const lines = fileContent.split('\n');
    let currentResult = null;

    lines.forEach((line) => {
        if (line.startsWith('Date:')) {
            if (currentResult) {
                results.push(currentResult);
            }
            const date = line.split(' ')[2].slice(0, -1);
            currentResult = new LottoResult(date, [], []);
        } else if (line.startsWith('Primary Numbers:')) {
            currentResult.primaryNumbers = line.split(': ')[1].split(', ').map(Number);
        } else if (line.startsWith('Secondary Number:')) {
            currentResult.secondaryNumbers.push(Number(line.split(': ')[1]));
        } else if (line.trim()) {
            currentResult.secondaryNumbers.push(Number(line.trim()));
        }
    });

    if (currentResult) {
        results.push(currentResult);
    }

    return results;
}


function readLottoFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return parseLottoResults(fileContent);
    } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return [];
    }
}
const results2010to2024 = readLottoFile(path.join(__dirname, 'results 2010-2024.txt'));
const results2000to2010 = readLottoFile(path.join(__dirname, 'results 2000-2010.txt'));
const results1990to2000 = readLottoFile(path.join(__dirname, 'results 1990-2000.txt'));

module.exports = { LottoResult, results2010to2024, results2000to2010, results1990to2000 };