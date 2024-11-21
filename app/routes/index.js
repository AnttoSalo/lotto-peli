const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
	res.render('index.pug', {title: 'Home'});
});

router.post('/numbers', (req, res) => {
	const numbers = req.body;
	console.log(numbers);
	let n_array = [numbers['n1'], numbers['n2'], numbers['n3'], numbers['n4'], numbers['n5'], numbers['n6'], numbers['n7']];
	console.log(n_array);
	res.redirect('/');
});

router.get('/numbers', (req, res) => {
	res.render('index.pug', {title: 'Home'});
});
// Registration form route
// Initial registration form route
router.get('/register', (req, res) => {
	res.render('register', {title: 'Rekisteröidy'});
});

// Handle initial registration form submission
router.post('/register-step1', async (req, res) => {
	const {email, password} = req.body;
	try {
		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Store email, password, and role in session
		req.session.email = email;
		req.session.password = hashedPassword;

		// Redirect to the profile completion page
		res.redirect('/register-step2');
	} catch (error) {
		res.status(400).json({error: error.message});
	}
});

module.exports = router;
