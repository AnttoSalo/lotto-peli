const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const indexRouter = require('./routes/index');
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

// 404 Error Handling
app.use((req, res, next) => {
	res.status(404).render('404', {title: 'Sivua ei löydy'});
});

// 500 Error Handling
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).render('error', {title: 'Virhe', error: err});
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
	console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
