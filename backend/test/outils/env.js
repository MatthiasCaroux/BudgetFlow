// Valeurs utilisées uniquement pendant les tests : jamais le vrai secret du .env.
// dotenv ne remplace pas une variable déjà définie, donc celles-ci sont prioritaires.
process.env.JWT_SECRET = 'secret-de-test-uniquement';
process.env.JWT_EXPIRES_IN = '1h';
