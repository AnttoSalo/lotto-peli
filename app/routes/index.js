const express = require('express');
const router = express.Router();
const { checkNumbers, getStats, getHelp, getPieChartData } = require('../controllers/indexController');

router.get('/', (req, res) => {
    res.render('index', {
        title: 'Lotto-peli',
        results: null,
        selectedNumbers: []
    });
});

router.post('/check-numbers', checkNumbers);

router.get('/stats', getStats);

router.get('/help', getHelp);

router.post('/pie-chart-data', getPieChartData);

module.exports = router;
