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
app.post('/check-numbers', (req, res) => {
	const selectedNumbers = req.body.numbers.map(Number);

	const allResults = [...results2010to2024, ...results2000to2010, ...results1990to2000];
	const matches = allResults
		.map((result) => {
			const correctCount = result.primaryNumbers.filter((num) => selectedNumbers.includes(num)).length;
			return {...result, correctCount};
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
	res.render('index', {results: {message, counts: countsArray}});
});

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
console.log(results2010to2024);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
	console.log(`Server is running on port ${PORT}`);
});

module.exports = {app, LottoResult, parseLottoResults, readLottoFile};
