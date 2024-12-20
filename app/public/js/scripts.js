document.addEventListener('DOMContentLoaded', function() {
    //Number choosing, limit to 7
    const checkboxes = document.querySelectorAll('.number-box input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            limitSelection(cb);
        });
    });

    if (typeof hasResults !== 'undefined' && hasResults) {
        fetchPieChartData();
    }

    const datesList = document.getElementById('datesList');
    if (datesList) {
        datesList.style.display = 'none';
    }
    if (document.getElementById('toggleDatesButton')) {
    document.getElementById('toggleDatesButton').addEventListener('click', function() {
        if (datesList.style.display === 'none' || datesList.style.display === '') {
            datesList.style.display = 'block';
            this.textContent = 'Piilota päivämäärät';
        } else {
            datesList.style.display = 'none';
            this.textContent = 'Näytä päivämäärät';
        }
    });
    }
    // Win condition
    if ( results ){
        if (
            typeof results !== 'undefined' &&
            results.counts &&
            results.counts.some(item => item.correctCount === 7)
        ) {
            showFireworksAndConfetti();
        }

        // Check if the user won
        if (typeof win !== 'undefined' && win) {
            showFireworksAndConfetti();
        }
}});

function limitSelection(checkbox) {
    const selectedCheckboxes = document.querySelectorAll('.number-box input:checked');
    if (selectedCheckboxes.length > 7) {
        checkbox.checked = false;
    }
}

let pieChartInstance;

function fetchPieChartData() {
    const selectedNumbers = Array.from(document.querySelectorAll('.number-box input:checked')).map(cb => cb.value);
    fetch('/pie-chart-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ numbers: selectedNumbers })
    })
    .then(response => response.json())
    .then(data => {
        const pieChartElement = document.getElementById('pieChart');
        if (pieChartElement) {
            const ctx = pieChartElement.getContext('2d');
            if (pieChartInstance) {
                pieChartInstance.destroy();
            }
            pieChartInstance = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: Object.keys(data).map(key => `${key} oikein`),
                    datasets: [{
                        data: Object.values(data),
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0',
                            '#9966FF',
                            '#FF9F40',
                            '#8A2BE2',
                            '#FF7F50'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    });
}

function showFireworksAndConfetti() {
    const fireworksContainer = document.getElementById('fireworks-container');
    const confettiContainer = document.getElementById('confetti-container');

    // Initialize fireworks
    const fireworks = new Fireworks.Fireworks(fireworksContainer, {
        maxRockets: 3,
        rocketSpawnInterval: 150,
        numParticles: 100,
        explosionMinHeight: 0.2,
        explosionMaxHeight: 0.9,
        explosionChance: 0.08
    });
    fireworks.start();

    // Initialize confetti
    const confetti = new ConfettiGenerator(confettiContainer, {
        target: 'confetti-holder',
        max: 150,
        size: 1,
        animate: true,
        props: ['circle', 'square', 'triangle', 'line'],
        colors: [[165, 104, 246], [230, 61, 135], [0, 199, 228], [253, 214, 126]],
        clock: 25,
        rotate: true,
        start_from_edge: true,
        respawn: true
    });
    confetti.render();

    // Stop fireworks and confetti after 4 seconds
    setTimeout(() => {
        fireworks.stop();
        confetti.clear();
        $('#winningModal').modal('show');
        $('#modalCloseBtn').on('click', () => { $('#winningModal').modal('hide'); })
    }, 4000);
}
