export default {
    testEnvironment: 'node',
    transform: {},
    testMatch: ['**/test/**/*.test.js'],
    // Variables d'environnement de test, chargées avant chaque fichier
    setupFiles: ['./test/outils/env.js'],
    // Le premier lancement télécharge le binaire MongoDB de test (~140 Mo)
    testTimeout: 60000,
    // Couverture (npm run test:coverage) : mesurée par V8, compatible avec les modules ES sans Babel
    coverageProvider: 'v8',
    collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
};
