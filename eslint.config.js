import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  // Fichiers générés ou installés : jamais analysés
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**'] },

  // Règles de base recommandées par ESLint, pour tout le projet
  js.configs.recommended,
  {
    rules: {
      // Les paramètres préfixés par _ sont volontairement inutilisés (ex. _request)
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // Back-end : code exécuté par Node.js (process, console…)
  {
    files: ['backend/**/*.js'],
    languageOptions: { globals: globals.node },
  },

  // Tests : Node.js + fonctions globales de Jest (describe, test, expect…)
  {
    files: ['backend/test/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
  },

  // Front-end : code exécuté par le navigateur, avec du JSX et les règles des hooks React
  {
    files: ['frontend/**/*.{js,jsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      ...reactRefresh.configs.vite.rules,
      // Sans plugin React, ESLint ne voit pas qu'un import utilisé en JSX (<Link />) sert :
      // on ignore donc les noms en majuscule, comme le modèle officiel de Vite
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
    },
  },

  // Fichiers de configuration du front (vite.config.js) : exécutés par Node
  {
    files: ['frontend/*.config.js'],
    languageOptions: { globals: globals.node },
  },
];
