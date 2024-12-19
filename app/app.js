const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const indexRouter = require('./routes/index');
const fs = require('fs');
const app = express();

// Set view engine to Pug
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware to serve static files
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/jquery/dist'), {maxAge: 31557600000}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/popper.js/dist/umd'), {maxAge: 31557600000}));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js'), {maxAge: 31557600000}));

// Serve Fireworks and Confetti libraries
app.use('/js/lib/fireworks', express.static(path.join(__dirname, 'node_modules/fireworks-js/dist')));
app.use('/js/lib/confetti', express.static(path.join(__dirname, 'node_modules/confetti-js/dist')));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Session middleware
app.use(
	session({
		secret: 'secret', // You should replace 'secret' with a strong secret string
		resave: true,
		saveUninitialized: true
	})
);

// Routes
// Regular user routes
app.use('/', indexRouter);

app.get('/', (req, res) => {
    res.render('index', {
        title: 'Lotto-peli',
        results: null,
        selectedNumbers: []
    });
});

app.post('/check-numbers', (req, res) => {
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
});

// Endpoint to serve pie chart data
app.post('/pie-chart-data', (req, res) => {
    const selectedNumbers = Array.isArray(req.body.numbers) ? req.body.numbers.map(Number) : [];
    const allResults = [...results2010to2024, ...results2000to2010, ...results1990to2000];
    const counts = {};

    allResults.forEach((result) => {
        const correctCount = result.primaryNumbers.filter((num) => selectedNumbers.includes(num)).length;
        counts[correctCount] = (counts[correctCount] || 0) + 1;
    });

    res.json(counts);
});

// Modify the /stats route
app.get('/stats', (req, res) => {
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
});

// Add this route for /help
app.get('/help', (req, res) => {
    res.render('help', {
        title: 'Lotto-peli Ohjeet'
    });
});

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

// 404 Error Handling
app.use((req, res, next) => {
	res.status(404).render('404', {title: 'Sivua ei löydy'});
});

// 500 Error Handling
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).render('error', {title: 'Virhe', error: err});
});

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

// Example usage
const results2010to2024 = readLottoFile(path.join(__dirname, 'results 2010-2024.txt'));
const results2000to2010 = readLottoFile(path.join(__dirname, 'results 2000-2010.txt'));
const results1990to2000 = readLottoFile(path.join(__dirname, 'results 1990-2000.txt'));


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
	console.log(`Server is running on port ${PORT}`);
});

module.exports = {app, LottoResult, parseLottoResults, readLottoFile};
