const { results2010to2024, results2000to2010, results1990to2000 } = require('../data/lottoResults');

exports.checkNumbers = (req, res) => {
    let win = false;
    const selectedNumbers = req.body.numbers ? req.body.numbers.map(Number) : [];

    const allResults = [...results2010to2024, ...results2000to2010, ...results1990to2000];
    const matches = allResults
        .map((result) => {
            const correctCount = result.primaryNumbers.filter((num) => selectedNumbers.includes(num)).length;
            return { ...result, correctCount };
        })
        .filter((result) => result.correctCount > 0);

    const counts = {};
    const datesByCorrectCount = {};

    matches.forEach((match) => {
        const cc = match.correctCount;
        counts[cc] = (counts[cc] || 0) + 1;
        datesByCorrectCount[cc] = datesByCorrectCount[cc] || [];
        datesByCorrectCount[cc].push(match.date);
    });

    const countsArray = Object.keys(counts).map((correctCount) => ({
        correctCount: Number(correctCount),
        count: counts[correctCount],
        dates: datesByCorrectCount[correctCount]
    }));

    countsArray.sort((a, b) => b.correctCount - a.correctCount);

    const message = matches.length > 0 ? 'Löytyi osumia!' : 'Ei osumia.';
    if (countsArray.some(item => item.correctCount === 7)) {
        win = true;
    }
    res.render('index', {
        title: 'Lotto-peli',
        win: win,
        results: { message, counts: countsArray },
        selectedNumbers // Pass selectedNumbers to the template
    });
};

exports.getStats = (req, res) => {
    const allResults = [...results2010to2024, ...results2000to2010, ...results1990to2000];

    // Calculate frequency of each number
    const numberFrequency = {};
    allResults.forEach(result => {
        result.primaryNumbers.forEach(num => {
            numberFrequency[num] = (numberFrequency[num] || 0) + 1;
        });
    });

    // Calculate total number of draws
    const totalDraws = allResults.length;

    // Calculate percentage for each number
    const numberFrequencyWithPercentage = {};
    Object.keys(numberFrequency).forEach(num => {
        const frequency = numberFrequency[num];
        const percentage = ((frequency / (totalDraws * 7)) * 100).toFixed(2); // Assuming 7 numbers per draw
        numberFrequencyWithPercentage[num] = {
            num,
            frequency,
            percentage
        };
    });

    // Calculate theoretical chances of winning
    const totalCombinations = combination(40, 7); // Total possible combinations of 7 numbers out of 39
    const chancesOfWinning = calculateChances();

    // Calculate the most probable set of numbers (top 7 by frequency)
    const sortedNumbers = Object.values(numberFrequencyWithPercentage).sort((a, b) => b.frequency - a.frequency);
    const mostProbableSet = sortedNumbers.slice(0, 7).map(num => num.num);

    // Check and collect all duplicate 7-number sets with their counts
    const setCounts = {};
    allResults.forEach(result => {
        const sortedSet = result.primaryNumbers.slice().sort((a, b) => a - b).join(',');
        setCounts[sortedSet] = (setCounts[sortedSet] || 0) + 1;
    });

    const duplicateSets = Object.entries(setCounts)
        .filter(([set, count]) => count > 1)
        .map(([set, count]) => ({
            set: set.split(',').map(Number),
            count
        }));

    // Pass data to the template
    res.render('stats', {
        title: 'Lotto-peli Tilastot',
        numberFrequency: numberFrequencyWithPercentage,
        totalDraws,
        totalCombinations,
        chancesOfWinning,
        mostProbableSet,
        hasDuplicateSets: duplicateSets.length > 0,
        duplicateSets // Pass duplicateSets with counts to the template
    });
};

exports.getHelp = (req, res) => {
    res.render('help', {
        title: 'Lotto-peli Ohjeet'
    });
};

exports.getPieChartData = (req, res) => {
    const selectedNumbers = Array.isArray(req.body.numbers) ? req.body.numbers.map(Number) : [];
    const allResults = [...results2010to2024, ...results2000to2010, ...results1990to2000];
    const counts = {};

    allResults.forEach((result) => {
        const correctCount = result.primaryNumbers.filter((num) => selectedNumbers.includes(num)).length;
        counts[correctCount] = (counts[correctCount] || 0) + 1;
    });

    res.json(counts);
};

// Function to calculate combinations
function combination(n, k) {
    let result = 1;
    for(let i = 1; i <= k; i++) {
        result = result * (n - i + 1) / i;
    }
    return result;
}

// Function to calculate chances of winning for different match counts
function calculateChances() {
    const chances = {};
    for(let correct = 7; correct >= 1; correct--) {
        chances[correct] = combination(7, correct) * combination(33, 7 - correct) / combination(40, 7);
    }
    return chances;
}
