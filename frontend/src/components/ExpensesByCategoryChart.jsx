import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { expensesByCategory } from '../utils/categories.js';
import { formatCents } from '../utils/money.js';

// Chart.js n'embarque que les éléments enregistrés : on garde le bundle léger
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const ROW_HEIGHT = 40;

// Bonus B4 : dépenses par catégorie, en barres horizontales triées.
// Chaque barre prend la couleur fixe de sa catégorie (utils/categories.js) ;
// le nom est écrit sur l'axe, la couleur n'est donc jamais la seule information.
export default function ExpensesByCategoryChart({ transactions }) {
    const rows = expensesByCategory(transactions);
    if (rows.length === 0) return null;

    const data = {
        labels: rows.map((row) => row.label),
        datasets: [{
            label: 'Dépenses',
            data: rows.map((row) => row.total),
            backgroundColor: rows.map((row) => row.color),
            borderRadius: 4,
            borderSkipped: 'start',
            maxBarThickness: 24,
        }],
    };

    const options = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: { label: (context) => formatCents(context.parsed.x) },
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: { color: '#e2e8f0' },
                border: { display: false },
                ticks: { color: '#64748b', callback: (value) => formatCents(value) },
            },
            y: {
                grid: { display: false },
                ticks: { color: '#1f2937' },
            },
        },
    };

    // Résumé lu par les lecteurs d'écran à la place du canvas
    const description = rows.map((row) => `${row.label} : ${formatCents(row.total)}`).join(', ');

    return (
        <section className="chart-card" aria-labelledby="expenses-chart-title">
            <h2 id="expenses-chart-title">Dépenses par catégorie</h2>
            <div className="chart-container" style={{ height: rows.length * ROW_HEIGHT + 40 }}>
                <Bar data={data} options={options} role="img" aria-label={`Dépenses par catégorie : ${description}`} />
            </div>
        </section>
    );
}
