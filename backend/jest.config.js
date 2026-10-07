export default {
    testEnvironment: 'node',
    transform: {},
    testMatch: ['**/test/**/*.test.js'],
    // Variables d'environnement de test, chargées avant chaque fichier
    setupFiles: ['./test/helpers/env.js'],
    // Le premier lancement télécharge le binaire MongoDB de test (~140 Mo)
    testTimeout: 60000,
};
