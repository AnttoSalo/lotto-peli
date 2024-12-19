document.addEventListener('DOMContentLoaded', function() {
    // ...existing code...

    if (typeof hasResults !== 'undefined' && hasResults) {
        fetchPieChartData();
    }

    // Ensure 'results' variable is defined
    if (
        typeof results !== 'undefined' &&
        results.counts &&
        results.counts.some(item => item.correctCount === 7)
    ) {
        showFireworksAndConfetti();
    }

    // ...existing code...
});

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
    const confetti = new ConfettiGenerator(confettiContainer,{
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

// No changes needed in scripts.js for this feature.
