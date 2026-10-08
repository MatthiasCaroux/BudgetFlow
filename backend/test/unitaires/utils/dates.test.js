import { isCivilDate } from '../../../src/utils/dates.js';

describe('isCivilDate', () => {
    test.each(['2026-10-05', '2024-02-29', '2026-12-31', '2026-01-01'])('accepte la date réelle %s', (value) => {
        expect(isCivilDate(value)).toBe(true);
    });

    test.each([
        ['30 février', '2026-02-30'],
        ['29 février hors année bissextile', '2025-02-29'],
        ['mois 13', '2026-13-01'],
        ['jour 0', '2026-10-00'],
        ['format JJ/MM/AAAA', '05/10/2026'],
        ['sans zéro devant', '2026-1-5'],
        ['date avec heure', '2026-10-05T10:00:00Z'],
        ['chaîne vide', ''],
        ['nombre', 20261005],
        ['null', null],
    ])('refuse : %s', (_label, value) => {
        expect(isCivilDate(value)).toBe(false);
    });
});
