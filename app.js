/**
 * 대입 지원 통계 분석기 - Application Logic
 * Admission Statistics Analyzer
 */

// ===== Chart Color Palette =====
const COLORS = {
    palette: [
        '#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981',
        '#3b82f6', '#f43f5e', '#8b5cf6', '#14b8a6', '#f97316',
        '#06b6d4', '#84cc16', '#e879f9', '#fb923c', '#22d3ee',
        '#a3e635', '#c084fc', '#fbbf24', '#4ade80', '#f472b6'
    ],
    getColor(index) {
        return this.palette[index % this.palette.length];
    },
    getAlpha(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
};

// ===== Vocational College Keywords =====
const VOCATIONAL_KEYWORDS = [
    '전문대', '폴리텍', '직업전문', '기술대학',
    '전문대학', '폴리텍대학', '한국폴리텍',
    // Common vocational college suffixes/patterns
    '보건대학', '과학기술대학', '정보대학',
];

// More specific vocational college names
const VOCATIONAL_NAMES = [
    '인하공업전문대학', '두원공과대학교', '수원여자대학교',
    '동양미래대학교', '한국폴리텍대학', '대림대학교',
    '부천대학교', '유한대학교', '청강문화산업대학교',
    '백석문화대학교', '명지전문대학', '서울예술대학교',
    '한양여자대학교', '삼육보건대학교', '서정대학교',
    '동서울대학교', '여주대학교', '안산대학교',
    '신구대학교', '오산대학교', '경인여자대학교',
    '서영대학교', '김포대학교', '장안대학교',
    '한국관광대학교', '동원대학교', '경복대학교',
    '국제대학교', '서일대학교', '배화여자대학교',
];

// ===== Daegu/Gyeongbuk Region Universities =====
const DAEGU_GYEONGBUK_UNIVERSITIES = [
    '경북대학교', '계명대학교', '대구대학교', '영남대학교',
    '대구가톨릭대학교', '대구한의대학교', '대구교육대학교',
    '경일대학교', '대구외국어대학교', '대구예술대학교',
    '금오공과대학교', '안동대학교', '경주대학교',
    '포항공과대학교', 'POSTECH', '한동대학교',
    '동국대학교(경주)', '위덕대학교', '경운대학교',
    '김천대학교', '구미대학교', '경북전문대학교',
    '대경대학교', '영진전문대학교', '계명문화대학교',
    '대구과학대학교', '대구보건대학교', '수성대학교',
    '영남이공대학교', '경산대학교', '동양대학교',
    '선린대학교', '성덕대학교', '문경대학교',
    '상주대학교', '경북과학대학교', '가야대학교',
    '대신대학교', '대구예술대학교', '대구공업대학교',
];

// ===== Data Parser =====
class DataParser {
    static parse(rawText) {
        const lines = rawText.trim().split('\n').filter(l => l.trim());
        const entries = [];
        const excluded = [];

        for (const line of lines) {
            const parsed = this.parseLine(line.trim());
            if (!parsed) continue;

            if (this.isVocational(parsed.university)) {
                excluded.push(parsed);
            } else {
                entries.push(parsed);
            }
        }

        return { entries, excluded };
    }

    static parseLine(line) {
        // Skip empty lines and comments
        if (!line || line.startsWith('#') || line.startsWith('//') || line.startsWith('※')) return null;

        let parts;

        // Try comma separation first
        if (line.includes(',')) {
            parts = line.split(',').map(p => p.trim());
        }
        // Try tab separation
        else if (line.includes('\t')) {
            parts = line.split('\t').map(p => p.trim());
        }
        // Try multiple spaces (2+)
        else {
            parts = line.split(/\s{2,}/).map(p => p.trim());
        }

        // Need exactly 3 parts
        if (parts.length < 3) return null;

        const university = parts[0].trim();
        const admissionType = parts[1].trim();
        const department = parts[2].trim();

        if (!university || !admissionType || !department) return null;

        return { university, admissionType, department };
    }

    static isVocational(name) {
        const normalized = name.replace(/\s+/g, '');

        // Check specific names
        if (VOCATIONAL_NAMES.some(n => normalized.includes(n.replace(/\s+/g, '')))) {
            return true;
        }

        // Check keywords
        if (VOCATIONAL_KEYWORDS.some(kw => normalized.includes(kw))) {
            return true;
        }

        return false;
    }
}

// ===== Statistics Analyzer =====
class StatsAnalyzer {
    constructor(entries) {
        this.entries = entries;
        this.analyze();
    }

    analyze() {
        this.universityStats = this.countBy('university');
        this.typeStats = this.countBy('admissionType');
        this.departmentStats = this.countBy('department');
        this.typeUniversityPrefs = this.groupPreferences('admissionType', 'university');
        this.typeDepartmentPrefs = this.groupPreferences('admissionType', 'department');
        this.uniDeptMatrix = this.buildMatrix('university', 'department');
    }

    countBy(field) {
        const counts = {};
        for (const entry of this.entries) {
            const key = entry[field];
            counts[key] = (counts[key] || 0) + 1;
        }
        // Sort by count descending
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});
    }

    groupPreferences(groupField, countField) {
        const groups = {};
        for (const entry of this.entries) {
            const group = entry[groupField];
            const item = entry[countField];
            if (!groups[group]) groups[group] = {};
            groups[group][item] = (groups[group][item] || 0) + 1;
        }

        // Sort within each group
        for (const group in groups) {
            groups[group] = Object.entries(groups[group])
                .sort((a, b) => b[1] - a[1])
                .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});
        }

        return groups;
    }

    buildMatrix(rowField, colField) {
        const rows = {};
        const cols = new Set();

        for (const entry of this.entries) {
            const row = entry[rowField];
            const col = entry[colField];
            cols.add(col);
            if (!rows[row]) rows[row] = {};
            rows[row][col] = (rows[row][col] || 0) + 1;
        }

        return { rows, cols: Array.from(cols) };
    }

    getTopUniversities(n = 15) {
        return Object.entries(this.universityStats).slice(0, n);
    }

    getTopDepartments(n = 15) {
        return Object.entries(this.departmentStats).slice(0, n);
    }

    getTypeUniversityTop(type, n = 10) {
        if (type === 'all') {
            return this.getTopUniversities(n);
        }
        const prefs = this.typeUniversityPrefs[type];
        if (!prefs) return [];
        return Object.entries(prefs).slice(0, n);
    }

    getTypeDepartmentTop(type, n = 10) {
        if (type === 'all') {
            return this.getTopDepartments(n);
        }
        const prefs = this.typeDepartmentPrefs[type];
        if (!prefs) return [];
        return Object.entries(prefs).slice(0, n);
    }

    getTopCombinations(n = 20) {
        const combos = {};
        for (const entry of this.entries) {
            const key = `${entry.university}|${entry.department}`;
            combos[key] = (combos[key] || 0) + 1;
        }
        return Object.entries(combos)
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([key, count]) => {
                const [uni, dept] = key.split('|');
                return { university: uni, department: dept, count };
            });
    }
}

// ===== Chart Manager =====
class ChartManager {
    constructor() {
        this.charts = {};
        this.setupDefaults();
    }

    setupDefaults() {
        Chart.register(ChartDataLabels);
        Chart.defaults.color = '#4a4a6a';
        Chart.defaults.font.family = "'Noto Sans KR', 'Inter', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.plugins.legend.labels.padding = 16;
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
    }

    destroyAll() {
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};
    }

    createUniversityChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (this.charts[canvasId]) this.charts[canvasId].destroy();

        const labels = data.map(([name]) => this.truncateLabel(name, 8));
        const values = data.map(([, count]) => count);
        const colors = data.map((_, i) => COLORS.getColor(i));
        const bgColors = colors.map(c => COLORS.getAlpha(c, 0.75));
        const borderColors = colors;

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: '지원 건수',
                    data: values,
                    backgroundColor: bgColors,
                    borderColor: borderColors,
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { top: 30 }
                },
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        color: '#1a1a2e',
                        font: { size: 11, weight: '600' },
                        formatter: (value) => value,
                        offset: 2,
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#1a1a2e',
                        bodyColor: '#4a4a6a',
                        borderColor: 'rgba(99, 102, 241, 0.2)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            title: (items) => data[items[0].dataIndex][0],
                            label: (item) => `  지원: ${item.raw}건`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grace: '15%',
                        ticks: {
                            stepSize: 1,
                            color: '#8888a8',
                        },
                        grid: {
                            color: 'rgba(99, 102, 241, 0.06)',
                        }
                    },
                    x: {
                        ticks: {
                            color: '#4a4a6a',
                            maxRotation: 45,
                            minRotation: 0,
                        },
                        grid: { display: false }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    createTypeChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (this.charts[canvasId]) this.charts[canvasId].destroy();

        const entries = Object.entries(data);
        const labels = entries.map(([name]) => name);
        const values = entries.map(([, count]) => count);
        const colors = entries.map((_, i) => COLORS.getColor(i));

        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.map(c => COLORS.getAlpha(c, 0.8)),
                    borderColor: colors,
                    borderWidth: 2,
                    hoverOffset: 12,
                    spacing: 3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '55%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: { size: 13, weight: '500' }
                        }
                    },
                    datalabels: {
                        color: '#1a1a2e',
                        font: { size: 12, weight: '700' },
                        formatter: (value, ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((value / total) * 100).toFixed(1);
                            if (pct < 5) return '';
                            return `${value}건\n(${pct}%)`;
                        },
                        textAlign: 'center',
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#1a1a2e',
                        bodyColor: '#4a4a6a',
                        borderColor: 'rgba(99, 102, 241, 0.2)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: (item) => {
                                const total = values.reduce((a, b) => a + b, 0);
                                const pct = ((item.raw / total) * 100).toFixed(1);
                                return `  ${item.label}: ${item.raw}건 (${pct}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1200,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    createPreferenceChart(canvasId, data, label = '지원 건수') {
        const ctx = document.getElementById(canvasId);
        if (this.charts[canvasId]) this.charts[canvasId].destroy();

        const labels = data.map(([name]) => this.truncateLabel(name, 10));
        const values = data.map(([, count]) => count);
        const colors = data.map((_, i) => COLORS.getColor(i));

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label,
                    data: values,
                    backgroundColor: colors.map(c => COLORS.getAlpha(c, 0.7)),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { right: 55 }
                },
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        color: '#1a1a2e',
                        font: { size: 11, weight: '600' },
                        formatter: (value) => `${value}건`,
                        offset: 4,
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#1a1a2e',
                        bodyColor: '#4a4a6a',
                        borderColor: 'rgba(99, 102, 241, 0.2)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            title: (items) => data[items[0].dataIndex][0],
                            label: (item) => `  지원: ${item.raw}건`
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grace: '15%',
                        ticks: { stepSize: 1, color: '#8888a8' },
                        grid: { color: 'rgba(99, 102, 241, 0.06)' }
                    },
                    y: {
                        ticks: { color: '#4a4a6a', font: { size: 12 } },
                        grid: { display: false }
                    }
                },
                animation: {
                    duration: 800,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    truncateLabel(text, maxLen) {
        if (text.length <= maxLen) return text;
        return text.substring(0, maxLen) + '…';
    }
}

// ===== Heatmap Renderer =====
class HeatmapRenderer {
    static render(container, topCombos) {
        if (!topCombos.length) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px;">데이터가 부족합니다.</p>';
            return;
        }

        // Get unique universities and departments from top combos
        const universities = [...new Set(topCombos.map(c => c.university))];
        const departments = [...new Set(topCombos.map(c => c.department))];

        // Build lookup
        const lookup = {};
        let maxVal = 0;
        for (const combo of topCombos) {
            const key = `${combo.university}|${combo.department}`;
            lookup[key] = combo.count;
            if (combo.count > maxVal) maxVal = combo.count;
        }

        // Check if any Daegu/Gyeongbuk universities exist
        const hasDGUniversities = universities.some(u => DAEGU_GYEONGBUK_UNIVERSITIES.includes(u));

        // Build HTML table
        let html = '<table class="heatmap-table"><thead><tr><th></th>';
        departments.forEach(d => {
            html += `<th>${d.length > 8 ? d.substring(0, 8) + '…' : d}</th>`;
        });
        html += '</tr></thead><tbody>';

        universities.forEach(uni => {
            const isDG = DAEGU_GYEONGBUK_UNIVERSITIES.includes(uni);
            const rowClass = isDG ? ' class="heatmap-row-dg"' : '';
            const uniLabel = isDG ? `★ ${uni}` : uni;
            const displayLabel = uniLabel.length > 14 ? uniLabel.substring(0, 14) + '…' : uniLabel;

            html += `<tr${rowClass}><td class="heatmap-label${isDG ? ' heatmap-label-dg' : ''}" title="${uni}">${displayLabel}</td>`;
            departments.forEach(dept => {
                const key = `${uni}|${dept}`;
                const val = lookup[key] || 0;
                const intensity = val ? Math.max(0.15, val / maxVal) : 0;

                let bgColor, textColor;
                if (isDG && val) {
                    // Daegu/Gyeongbuk: warm orange/amber color
                    bgColor = `rgba(245, 158, 11, ${Math.max(0.2, intensity)})`;
                    textColor = intensity > 0.5 ? '#ffffff' : '#7c2d12';
                } else {
                    bgColor = val
                        ? `rgba(99, 102, 241, ${intensity})`
                        : 'rgba(99, 102, 241, 0.02)';
                    textColor = intensity > 0.5 ? '#ffffff' : (val ? '#1a1a2e' : '#c8c8d8');
                }

                html += `<td class="heatmap-cell${isDG && val ? ' heatmap-cell-dg' : ''}" style="background: ${bgColor}; color: ${textColor};" title="${uni} - ${dept}: ${val}건">${val || ''}</td>`;
            });
            html += '</tr>';
        });

        // Add legend if DG universities exist
        if (hasDGUniversities) {
            html += '</tbody></table>';
            html += '<div class="heatmap-legend"><span class="heatmap-legend-dg">★</span> 대구·경북 소재 대학교</div>';
        } else {
            html += '</tbody></table>';
        }

        container.innerHTML = html;
    }
}

// ===== Toast Notification =====
class Toast {
    static show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// ===== Sample Data =====
const SAMPLE_DATA = `서울대학교, 수시, 컴퓨터공학부
서울대학교, 수시, 전기정보공학부
서울대학교, 정시, 경영학과
서울대학교, 정시, 경제학부
서울대학교, 수시, 의예과
연세대학교, 수시, 컴퓨터과학과
연세대학교, 정시, 경영학과
연세대학교, 수시, 전기전자공학부
연세대학교, 정시, 의예과
연세대학교, 수시, 경제학부
고려대학교, 수시, 컴퓨터학과
고려대학교, 정시, 경영학과
고려대학교, 수시, 전기전자공학부
고려대학교, 정시, 미디어학부
고려대학교, 수시, 의과대학
성균관대학교, 수시, 소프트웨어학과
성균관대학교, 정시, 경영학과
성균관대학교, 수시, 반도체시스템공학과
성균관대학교, 수시, 글로벌경영학과
한양대학교, 수시, 컴퓨터소프트웨어학부
한양대학교, 정시, 기계공학부
한양대학교, 수시, 에너지공학과
한양대학교, 정시, 경영학부
서강대학교, 수시, 컴퓨터공학과
서강대학교, 정시, 경영학부
서강대학교, 수시, 전자공학과
중앙대학교, 수시, 소프트웨어학부
중앙대학교, 정시, 경영학부
중앙대학교, 수시, 미디어커뮤니케이션학부
경희대학교, 수시, 컴퓨터공학과
경희대학교, 정시, 경영학과
경희대학교, 수시, 한의예과
이화여자대학교, 수시, 컴퓨터공학과
이화여자대학교, 정시, 경영학부
이화여자대학교, 수시, 의예과
건국대학교, 수시, 컴퓨터공학부
건국대학교, 정시, 경영학과
동국대학교, 수시, 컴퓨터공학전공
동국대학교, 정시, 경영학과
숙명여자대학교, 수시, 소프트웨어학부
숙명여자대학교, 수시, 경영학부
홍익대학교, 수시, 컴퓨터공학과
홍익대학교, 수시, 시각디자인과
국민대학교, 수시, 소프트웨어학부
국민대학교, 정시, 경영학부
세종대학교, 수시, 컴퓨터공학과
세종대학교, 정시, 경영학부
숭실대학교, 수시, 컴퓨터학부
숭실대학교, 수시, AI융합학부
광운대학교, 수시, 소프트웨어학부
광운대학교, 정시, 전자공학과
서울시립대학교, 수시, 컴퓨터과학부
서울시립대학교, 정시, 경영학부
아주대학교, 수시, 소프트웨어학과
아주대학교, 정시, 경영학과
인하대학교, 수시, 컴퓨터공학과
인하대학교, 정시, 경영학과
서울대학교, 수시, 자유전공학부
연세대학교, 수시, 언더우드학부
고려대학교, 수시, 자유전공학부
성균관대학교, 정시, 의예과
한양대학교, 수시, 미래자동차공학과
서울대학교, 정시, 컴퓨터공학부
연세대학교, 정시, 전기전자공학부
고려대학교, 정시, 컴퓨터학과
성균관대학교, 정시, 컴퓨터교육과
한양대학교, 정시, 컴퓨터소프트웨어학부
서강대학교, 정시, 컴퓨터공학과
중앙대학교, 정시, 소프트웨어학부
경희대학교, 정시, 컴퓨터공학과
인하공업전문대학, 수시, 컴퓨터정보과
동양미래대학교, 수시, 컴퓨터공학과
서울예술대학교, 수시, 디지털아트과
한국폴리텍대학, 수시, 컴퓨터공학과
명지전문대학, 수시, 정보통신과
경북대학교, 수시, 컴퓨터학부
경북대학교, 정시, 전자공학부
경북대학교, 수시, 경영학부
계명대학교, 수시, 컴퓨터공학과
계명대학교, 정시, 경영학과
영남대학교, 수시, 컴퓨터공학과
영남대학교, 정시, 의예과
대구대학교, 수시, 소프트웨어학과
대구대학교, 정시, 경영학과
금오공과대학교, 수시, 컴퓨터공학과
금오공과대학교, 정시, 전자공학부
포항공과대학교, 수시, 컴퓨터공학과
포항공과대학교, 수시, 전자전기공학과`;

// ===== Background Particles =====
function createParticles() {
    const container = document.getElementById('bgParticles');
    const particleCount = 15;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 4 + 2;
        const left = Math.random() * 100;
        const delay = Math.random() * 20;
        const duration = Math.random() * 15 + 15;
        const opacity = Math.random() * 0.3 + 0.1;

        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${left}%;
            background: ${COLORS.getColor(Math.floor(Math.random() * COLORS.palette.length))};
            animation-delay: ${delay}s;
            animation-duration: ${duration}s;
            opacity: ${opacity};
        `;

        container.appendChild(particle);
    }
}

// ===== Counter Animation =====
function animateCounter(element, target) {
    const duration = 1000;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);
        element.textContent = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ===== Main App =====
class App {
    constructor() {
        this.chartManager = new ChartManager();
        this.analyzer = null;
        this.bindEvents();
        createParticles();
    }

    bindEvents() {
        // Analyze button
        document.getElementById('btnAnalyze').addEventListener('click', () => this.analyze());

        // Sample data button
        document.getElementById('btnSampleData').addEventListener('click', () => this.loadSampleData());

        // Reset button
        document.getElementById('btnReset').addEventListener('click', () => this.reset());

        // Line count
        const textarea = document.getElementById('dataInput');
        textarea.addEventListener('input', () => this.updateLineCount());

        // Table toggle
        document.getElementById('btnToggleTable').addEventListener('click', () => this.toggleTable());

        // Type filter for university preference
        document.getElementById('typeFilter').addEventListener('change', (e) => {
            this.updateTypePreferenceChart(e.target.value);
        });

        // Type filter for department preference
        document.getElementById('deptTypeFilter').addEventListener('change', (e) => {
            this.updateDeptPreferenceChart(e.target.value);
        });

        // Keyboard shortcut
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.analyze();
            }
        });

        // Print button
        document.getElementById('btnPrint').addEventListener('click', () => this.printReport());

        // Download all button
        document.getElementById('btnDownloadAll').addEventListener('click', () => this.downloadAll());

        // PDF export button
        document.getElementById('btnExportPDF').addEventListener('click', () => this.exportPDF());

        // Chart action buttons (copy & download)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;

            const action = btn.dataset.action;
            const chartId = btn.dataset.chart;
            const cardId = btn.dataset.card;
            const name = btn.dataset.name;

            switch (action) {
                case 'copy':
                    this.copyChartToClipboard(chartId, btn);
                    break;
                case 'download':
                    this.downloadChart(chartId, name);
                    break;
                case 'copy-card':
                    this.copyCardToClipboard(cardId, btn);
                    break;
                case 'download-card':
                    this.downloadCard(cardId, name);
                    break;
            }
        });
    }

    updateLineCount() {
        const text = document.getElementById('dataInput').value.trim();
        const lines = text ? text.split('\n').filter(l => l.trim()).length : 0;
        document.getElementById('lineCount').textContent = `${lines}줄 입력됨`;
    }

    loadSampleData() {
        document.getElementById('dataInput').value = SAMPLE_DATA;
        this.updateLineCount();
        Toast.show('샘플 데이터가 로드되었습니다.', 'success');
    }

    reset() {
        document.getElementById('dataInput').value = '';
        document.getElementById('resultsSection').classList.add('hidden');
        this.chartManager.destroyAll();
        this.analyzer = null;
        this.updateLineCount();
        Toast.show('초기화되었습니다.', 'info');
    }

    analyze() {
        const text = document.getElementById('dataInput').value.trim();
        if (!text) {
            Toast.show('데이터를 입력해주세요.', 'warning');
            return;
        }

        const { entries, excluded } = DataParser.parse(text);

        if (entries.length === 0) {
            Toast.show('유효한 데이터가 없습니다. 형식을 확인해주세요.', 'error');
            return;
        }

        this.analyzer = new StatsAnalyzer(entries);
        this.allEntries = entries;

        // Show results
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.classList.remove('hidden');

        // Scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        // Update summary
        this.updateSummary(entries, excluded);

        // Update filters
        this.updateFilters();

        // Render charts
        this.renderCharts();

        // Render table
        this.renderTable(entries);

        // Render heatmap
        this.renderHeatmap();

        Toast.show(`${entries.length}건의 데이터가 분석되었습니다.${excluded.length ? ` (전문대 ${excluded.length}건 제외)` : ''}`, 'success');
    }

    updateSummary(entries, excluded) {
        const stats = this.analyzer;

        animateCounter(document.getElementById('totalApps'), entries.length);
        animateCounter(document.getElementById('totalUnis'), Object.keys(stats.universityStats).length);
        animateCounter(document.getElementById('totalTypes'), Object.keys(stats.typeStats).length);
        animateCounter(document.getElementById('excludedCount'), excluded.length);
    }

    updateFilters() {
        const types = Object.keys(this.analyzer.typeStats);

        // University preference filter
        const typeFilter = document.getElementById('typeFilter');
        typeFilter.innerHTML = '<option value="all">전체 전형</option>';
        types.forEach(type => {
            typeFilter.innerHTML += `<option value="${type}">${type}</option>`;
        });

        // Department preference filter
        const deptTypeFilter = document.getElementById('deptTypeFilter');
        deptTypeFilter.innerHTML = '<option value="all">전체 전형</option>';
        types.forEach(type => {
            deptTypeFilter.innerHTML += `<option value="${type}">${type}</option>`;
        });
    }

    renderCharts() {
        // University chart
        const uniData = this.analyzer.getTopUniversities(15);
        this.chartManager.createUniversityChart('chartUniversity', uniData);

        // Type chart
        this.chartManager.createTypeChart('chartType', this.analyzer.typeStats);

        // Type university preference (default: all)
        this.updateTypePreferenceChart('all');

        // Type department preference (default: all)
        this.updateDeptPreferenceChart('all');
    }

    updateTypePreferenceChart(type) {
        const data = this.analyzer.getTypeUniversityTop(type, 10);
        const label = type === 'all' ? '전체 전형 - 선호 대학' : `${type} - 선호 대학`;
        this.chartManager.createPreferenceChart('chartTypePreference', data, label);
    }

    updateDeptPreferenceChart(type) {
        const data = this.analyzer.getTypeDepartmentTop(type, 10);
        const label = type === 'all' ? '전체 전형 - 선호 학과' : `${type} - 선호 학과`;
        this.chartManager.createPreferenceChart('chartDepartment', data, label);
    }

    renderHeatmap() {
        // Get top combos + ensure ALL Daegu/Gyeongbuk university combos are included
        // Also explicitly filter out any vocational colleges
        const filterVocational = (combos) => combos.filter(c => !DataParser.isVocational(c.university));
        const topCombos = filterVocational(this.analyzer.getTopCombinations(30));
        const allCombos = filterVocational(this.analyzer.getTopCombinations(9999));

        // Add any DG university combos that aren't already in topCombos
        const topKeys = new Set(topCombos.map(c => `${c.university}|${c.department}`));
        const dgCombos = allCombos.filter(c =>
            DAEGU_GYEONGBUK_UNIVERSITIES.includes(c.university) && !topKeys.has(`${c.university}|${c.department}`)
        );
        const mergedCombos = [...topCombos, ...dgCombos];

        HeatmapRenderer.render(document.getElementById('heatmapContainer'), mergedCombos);
    }

    renderTable(entries) {
        const tbody = document.getElementById('dataTableBody');
        tbody.innerHTML = '';

        entries.forEach((entry, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.university}</td>
                <td>${entry.admissionType}</td>
                <td>${entry.department}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    toggleTable() {
        const wrapper = document.getElementById('tableWrapper');
        const btn = document.getElementById('btnToggleTable');
        const isCollapsed = wrapper.classList.contains('collapsed');

        if (isCollapsed) {
            wrapper.classList.remove('collapsed');
            wrapper.classList.add('expanded');
            btn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="18 15 12 9 6 15"/>
                </svg>
                접기
            `;
        } else {
            wrapper.classList.remove('expanded');
            wrapper.classList.add('collapsed');
            btn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
                펼치기
            `;
        }
    }

    // ===== Export Methods =====

    /**
     * Creates a high-resolution canvas with white background.
     * Uses 3x scale multiplier for print-quality output.
     */
    getWhiteBackgroundCanvas(srcCanvas) {
        const scale = 3;
        const c = document.createElement('canvas');
        c.width = srcCanvas.width * scale;
        c.height = srcCanvas.height * scale;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(srcCanvas, 0, 0, c.width, c.height);
        return c;
    }

    copyChartToClipboard(chartId, btn) {
        const canvas = document.getElementById(chartId);
        if (!canvas) {
            Toast.show('차트를 찾을 수 없습니다.', 'error');
            return;
        }

        const whiteCanvas = this.getWhiteBackgroundCanvas(canvas);

        whiteCanvas.toBlob(async (blob) => {
            try {
                const item = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([item]);

                btn.classList.add('copied');
                setTimeout(() => btn.classList.remove('copied'), 1500);

                Toast.show('차트가 클립보드에 복사되었습니다.', 'success');
            } catch (err) {
                const url = whiteCanvas.toDataURL('image/png');
                const w = window.open();
                w.document.write(`<img src="${url}" alt="chart" />`);
                Toast.show('새 탭에서 이미지를 확인하세요. (우클릭 → 복사)', 'info');
            }
        }, 'image/png');
    }

    downloadChart(chartId, name) {
        const canvas = document.getElementById(chartId);
        if (!canvas) {
            Toast.show('차트를 찾을 수 없습니다.', 'error');
            return;
        }

        const whiteCanvas = this.getWhiteBackgroundCanvas(canvas);

        const link = document.createElement('a');
        link.download = `${name || 'chart'}.png`;
        link.href = whiteCanvas.toDataURL('image/png', 1.0);
        link.click();

        Toast.show(`${name || '차트'}.png 다운로드 완료`, 'success');
    }

    async copyCardToClipboard(cardId, btn) {
        const card = document.getElementById(cardId);
        if (!card) return;

        try {
            const canvas = await html2canvas(card, {
                backgroundColor: '#ffffff',
                scale: 4,
                logging: false,
                useCORS: true,
                allowTaint: true,
            });

            canvas.toBlob(async (blob) => {
                try {
                    const item = new ClipboardItem({ 'image/png': blob });
                    await navigator.clipboard.write([item]);
                    btn.classList.add('copied');
                    setTimeout(() => btn.classList.remove('copied'), 1500);
                    Toast.show('클립보드에 복사되었습니다.', 'success');
                } catch {
                    const url = canvas.toDataURL('image/png');
                    const w = window.open();
                    w.document.write(`<img src="${url}" alt="card" />`);
                    Toast.show('새 탭에서 이미지를 확인하세요.', 'info');
                }
            }, 'image/png');
        } catch (err) {
            Toast.show('이미지 생성에 실패했습니다.', 'error');
        }
    }

    async downloadCard(cardId, name) {
        const card = document.getElementById(cardId);
        if (!card) return;

        try {
            Toast.show('이미지 생성 중...', 'info', 1500);
            const canvas = await html2canvas(card, {
                backgroundColor: '#ffffff',
                scale: 4,
                logging: false,
                useCORS: true,
                allowTaint: true,
            });

            const link = document.createElement('a');
            link.download = `${name || 'card'}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();

            Toast.show(`${name || '카드'}.png 다운로드 완료`, 'success');
        } catch (err) {
            Toast.show('이미지 생성에 실패했습니다.', 'error');
        }
    }

    printReport() {
        if (!this.analyzer) {
            Toast.show('먼저 데이터를 분석해주세요.', 'warning');
            return;
        }
        window.print();
    }

    async downloadAll() {
        if (!this.analyzer) {
            Toast.show('먼저 데이터를 분석해주세요.', 'warning');
            return;
        }

        Toast.show('전체 대시보드 이미지 생성 중...', 'info', 2000);

        try {
            const resultsSection = document.getElementById('resultsSection');

            if (typeof html2canvas === 'undefined') {
                Toast.show('html2canvas 라이브러리가 로드되지 않았습니다. 인터넷 연결을 확인하세요.', 'error');
                return;
            }

            // Wait for layout
            await new Promise(r => setTimeout(r, 300));

            const canvas = await html2canvas(resultsSection, {
                backgroundColor: '#f5f6fa',
                scale: 4,
                logging: false,
                windowWidth: 1400,
                useCORS: true,
                allowTaint: true,
                onclone: (doc) => {
                    // Hide action buttons and data table in clone
                    doc.querySelectorAll('.btn-icon, .chart-filter').forEach(el => {
                        el.style.display = 'none';
                    });
                    const tableCard = doc.querySelector('.data-table-card');
                    if (tableCard) tableCard.style.display = 'none';
                }
            });

            const link = document.createElement('a');
            link.download = '대입지원_통계분석_전체.png';
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();

            Toast.show('전체 분석 결과가 다운로드되었습니다.', 'success');
        } catch (err) {
            Toast.show('이미지 생성에 실패했습니다.', 'error');
            console.error(err);
        }
    }

    // ===== PDF Report Export =====

    async exportPDF() {
        if (!this.analyzer) {
            Toast.show('먼저 데이터를 분석해주세요.', 'warning');
            return;
        }
        if (!window.jspdf) {
            Toast.show('jsPDF 라이브러리가 로드되지 않았습니다. 인터넷 연결을 확인하세요.', 'error');
            return;
        }

        Toast.show('PDF 보고서 생성 중... 잠시 기다려주세요.', 'info', 15000);

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('portrait', 'mm', 'a4');
            const year = new Date().getFullYear() + 1;

            // Data
            const totalApps = this.allEntries.length;
            const totalUnis = Object.keys(this.analyzer.universityStats).length;
            const totalTypes = Object.keys(this.analyzer.typeStats).length;
            const excludedCount = document.getElementById('excludedCount').textContent;
            const types = Object.keys(this.analyzer.typeStats);

            // Base style for off-screen rendering
            const baseStyle = `
                position: absolute; left: -9999px; top: 0;
                background: white;
                font-family: 'Noto Sans KR', 'Inter', sans-serif;
                color: #1a1a2e; line-height: 1.5; box-sizing: border-box;
            `;

            // ===== Helper: get existing chart canvas as data URL =====
            const getChartDataUrl = (chartId) => {
                const canvas = document.getElementById(chartId);
                if (!canvas) return '';
                const wc = this.getWhiteBackgroundCanvas(canvas);
                return wc.toDataURL('image/png', 1.0);
            };

            // ===== Helper: create compact bar chart image =====
            const createBarChartImg = async (data, label) => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = 700;
                tempCanvas.height = Math.max(160, data.length * 22);
                tempCanvas.style.cssText = 'position:absolute;left:-9999px;';
                document.body.appendChild(tempCanvas);
                const chart = new Chart(tempCanvas, {
                    type: 'bar',
                    data: {
                        labels: data.map(([name]) => this.chartManager.truncateLabel(name, 15)),
                        datasets: [{
                            label,
                            data: data.map(([, count]) => count),
                            backgroundColor: data.map((_, i) => COLORS.getAlpha(COLORS.getColor(i), 0.7)),
                            borderColor: data.map((_, i) => COLORS.getColor(i)),
                            borderWidth: 2, borderRadius: 4,
                        }]
                    },
                    options: {
                        responsive: false, animation: false, indexAxis: 'y',
                        plugins: {
                            legend: { display: false },
                            datalabels: { anchor: 'end', align: 'end', font: { size: 11, weight: '600' }, formatter: v => `${v}건` }
                        },
                        scales: {
                            x: { beginAtZero: true, grace: '15%' },
                            y: { ticks: { font: { size: 10 } } }
                        }
                    },
                    plugins: [ChartDataLabels]
                });
                await new Promise(r => setTimeout(r, 300));
                const wc = document.createElement('canvas');
                wc.width = tempCanvas.width * 2;
                wc.height = tempCanvas.height * 2;
                const ctx = wc.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, wc.width, wc.height);
                ctx.drawImage(tempCanvas, 0, 0, wc.width, wc.height);
                const imgData = wc.toDataURL('image/png', 1.0);
                chart.destroy();
                tempCanvas.remove();
                return imgData;
            };

            // ===== Helper: capture a single section as an image =====
            const captureSection = async (htmlContent, containerWidth = 694) => {
                const div = document.createElement('div');
                div.style.cssText = baseStyle + ` width: ${containerWidth}px; padding: 8px 0;`;
                div.innerHTML = htmlContent;
                document.body.appendChild(div);
                await new Promise(r => setTimeout(r, 150));
                const canvas = await html2canvas(div, {
                    backgroundColor: '#ffffff', scale: 2, logging: false,
                    useCORS: true, allowTaint: true,
                });
                div.remove();
                return {
                    imgData: canvas.toDataURL('image/png', 1.0),
                    widthPx: canvas.width,
                    heightPx: canvas.height,
                };
            };

            // ===== Helper: capture full HTML block as pages (for matrix) =====
            const captureAsPages = async (htmlContent, containerWidth = 794, pageHeightPx = 1123) => {
                const div = document.createElement('div');
                div.style.cssText = baseStyle + ` width: ${containerWidth}px; padding: 50px;`;
                div.innerHTML = htmlContent;
                document.body.appendChild(div);
                await new Promise(r => setTimeout(r, 300));
                const fullCanvas = await html2canvas(div, {
                    backgroundColor: '#ffffff', scale: 2, logging: false,
                    useCORS: true, allowTaint: true,
                });
                div.remove();
                const pages = [];
                const scale = 2;
                const sW = containerWidth * scale;
                const sH = pageHeightPx * scale;
                let offset = 0;
                while (offset < fullCanvas.height) {
                    const sliceH = Math.min(sH, fullCanvas.height - offset);
                    const pc = document.createElement('canvas');
                    pc.width = sW; pc.height = sH;
                    const ctx = pc.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, sW, sH);
                    ctx.drawImage(fullCanvas, 0, offset, sW, sliceH, 0, 0, sW, sliceH);
                    pages.push(pc.toDataURL('image/png', 1.0));
                    offset += sH;
                }
                return pages;
            };

            let pageNum = 1;

            // ===== Helper: add page number to current page =====
            const addPageNum = (orientation = 'portrait') => {
                const pW = orientation === 'portrait' ? 210 : 297;
                const pH = orientation === 'portrait' ? 297 : 210;
                pdf.setFontSize(9);
                pdf.setTextColor(150, 150, 150);
                pdf.text(`- ${pageNum} -`, pW / 2, pH - 8, { align: 'center' });
                pageNum++;
            };

            // ===== Helper: compose sections onto pages (NEVER splits a section) =====
            const composeSectionsToPdf = (sectionImages, orientation = 'portrait') => {
                const pW = orientation === 'portrait' ? 210 : 297;
                const pH = orientation === 'portrait' ? 297 : 210;
                const margin = 15;
                const contentW = pW - margin * 2;
                let curY = margin;

                // Start new page
                pdf.addPage('a4', orientation);

                for (const section of sectionImages) {
                    const aspect = section.heightPx / section.widthPx;
                    const imgH = contentW * aspect;

                    // If this section won't fit, start a new page first
                    if (curY + imgH > pH - 12) {
                        addPageNum(orientation);
                        pdf.addPage('a4', orientation);
                        curY = margin;
                    }

                    pdf.addImage(section.imgData, 'PNG', margin, curY, contentW, imgH);
                    curY += imgH + 2;
                }

                // Page number on last page
                addPageNum(orientation);
            };

            // ===== Common HTML snippets =====
            const tableStyle = 'width:100%; border-collapse:collapse; font-size:13px;';
            const thStyle = 'border:1px solid #bbb; padding:8px 12px; background:#f0f0f5; text-align:center; font-weight:600;';
            const tdStyle = 'border:1px solid #bbb; padding:8px 12px; text-align:center;';

            // ========================================
            // PAGE 1: Title + Overview + Charts
            // ========================================
            const uniChartImg = getChartDataUrl('chartUniversity');
            const typeChartImg = getChartDataUrl('chartType');

            const page1Sections = [];
            page1Sections.push(await captureSection(`
                <h1 style="text-align:center; font-size:22px; margin:0 0 20px; font-weight:700;">
                    ${year}학년도 수시 모집 지원 통계 분석
                </h1>
                <h2 style="font-size:15px; font-weight:700; margin:0 0 8px;">1. 개요</h2>
                <table style="${tableStyle} margin-bottom:15px;">
                    <thead><tr>
                        <th style="${thStyle}">구분</th>
                        <th style="${thStyle}">총 지원자</th>
                        <th style="${thStyle}">지원 대학</th>
                        <th style="${thStyle}">전형 유형</th>
                        <th style="${thStyle}">전문대 제외</th>
                    </tr></thead>
                    <tbody><tr>
                        <td style="${tdStyle}">건 수</td>
                        <td style="${tdStyle}">${totalApps}</td>
                        <td style="${tdStyle}">${totalUnis}</td>
                        <td style="${tdStyle}">${totalTypes}</td>
                        <td style="${tdStyle}">${excludedCount}</td>
                    </tr></tbody>
                </table>
            `));

            page1Sections.push(await captureSection(`
                <h2 style="font-size:15px; font-weight:700; margin:0 0 5px;">2. 대학별 지원 현황</h2>
                ${uniChartImg ? `<img src="${uniChartImg}" style="width:100%;" />` : ''}
            `));

            page1Sections.push(await captureSection(`
                <h2 style="font-size:15px; font-weight:700; margin:0 0 5px;">3. 전형별 지원 비율</h2>
                ${typeChartImg ? `<div style="text-align:center;"><img src="${typeChartImg}" style="width:55%;" /></div>` : ''}
            `));

            // Page 1: compose (first page = true, so we use the initial PDF page)
            {
                const pW = 210, pH = 297, margin = 15;
                const contentW = pW - margin * 2;
                let curY = margin;
                for (const section of page1Sections) {
                    const aspect = section.heightPx / section.widthPx;
                    const imgH = contentW * aspect;
                    if (curY + imgH > pH - 12) {
                        addPageNum();
                        pdf.addPage();
                        curY = margin;
                    }
                    pdf.addImage(section.imgData, 'PNG', margin, curY, contentW, imgH);
                    curY += imgH + 2;
                }
                addPageNum();
            }

            // ========================================
            // PAGES: 전형별 선호 대학
            // ========================================
            const subLabels = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카'];
            const uniSections = [];

            uniSections.push(await captureSection(
                '<h2 style="font-size:15px; font-weight:700; margin:0 0 5px;">4. 전형별 선호 대학</h2>'
            ));

            // 가. 전체 전형
            const allUniPref = this.analyzer.getTypeUniversityTop('all', 10);
            const allUniImg = await createBarChartImg(allUniPref, '전체 전형');
            uniSections.push(await captureSection(`
                <h3 style="font-size:12px; font-weight:700; margin:0 0 3px;">가. 전체 전형</h3>
                <img src="${allUniImg}" style="width:100%;" />
            `));

            // 개별 전형
            for (let i = 0; i < types.length; i++) {
                const data = this.analyzer.getTypeUniversityTop(types[i], 10);
                if (data.length === 0) continue;
                const img = await createBarChartImg(data, types[i]);
                uniSections.push(await captureSection(`
                    <h3 style="font-size:12px; font-weight:700; margin:0 0 3px;">${subLabels[i + 1] || ''}. ${types[i]}</h3>
                    <img src="${img}" style="width:100%;" />
                `));
            }

            // 종합
            const topUnis = this.analyzer.getTopUniversities(10);
            const uniSummImg = await createBarChartImg(topUnis, '종합');
            uniSections.push(await captureSection(`
                <h3 style="font-size:12px; font-weight:700; margin:0 0 3px;">${subLabels[types.length + 1] || '다'}. 종합</h3>
                <img src="${uniSummImg}" style="width:100%;" />
            `));

            composeSectionsToPdf(uniSections);

            // ========================================
            // PAGES: 전형별 선호 학과
            // ========================================
            const deptSections = [];

            deptSections.push(await captureSection(
                '<h2 style="font-size:15px; font-weight:700; margin:0 0 5px;">5. 전형별 선호 학과</h2>'
            ));

            const allDeptPref = this.analyzer.getTypeDepartmentTop('all', 10);
            const allDeptImg = await createBarChartImg(allDeptPref, '전체 전형');
            deptSections.push(await captureSection(`
                <h3 style="font-size:12px; font-weight:700; margin:0 0 3px;">가. 전체 전형</h3>
                <img src="${allDeptImg}" style="width:100%;" />
            `));

            for (let i = 0; i < types.length; i++) {
                const data = this.analyzer.getTypeDepartmentTop(types[i], 10);
                if (data.length === 0) continue;
                const img = await createBarChartImg(data, types[i]);
                deptSections.push(await captureSection(`
                    <h3 style="font-size:12px; font-weight:700; margin:0 0 3px;">${subLabels[i + 1] || ''}. ${types[i]}</h3>
                    <img src="${img}" style="width:100%;" />
                `));
            }

            const topDepts = this.analyzer.getTopDepartments(10);
            const deptSummImg = await createBarChartImg(topDepts, '종합');
            deptSections.push(await captureSection(`
                <h3 style="font-size:12px; font-weight:700; margin:0 0 3px;">${subLabels[types.length + 1] || '다'}. 종합</h3>
                <img src="${deptSummImg}" style="width:100%;" />
            `));

            composeSectionsToPdf(deptSections);

            // ========================================
            // PAGES: 대학-학과 지원 매트릭스 (Landscape)
            // ========================================
            const filterVoc = (combos) => combos.filter(c => !DataParser.isVocational(c.university));
            const topCombos = filterVoc(this.analyzer.getTopCombinations(30));
            const allCombos = filterVoc(this.analyzer.getTopCombinations(9999));
            const topKeys = new Set(topCombos.map(c => `${c.university}|${c.department}`));
            const dgCombos = allCombos.filter(c =>
                DAEGU_GYEONGBUK_UNIVERSITIES.includes(c.university) && !topKeys.has(`${c.university}|${c.department}`)
            );
            const mergedCombos = [...topCombos, ...dgCombos];
            const matrixUnis = [...new Set(mergedCombos.map(c => c.university))];
            const matrixDepts = [...new Set(mergedCombos.map(c => c.department))];
            const matrixLookup = {};
            for (const combo of mergedCombos) {
                matrixLookup[`${combo.university}|${combo.department}`] = combo.count;
            }

            let matrixHtml = '<h2 style="font-size:15px; font-weight:700; margin-bottom:15px;">6. 대학-학과 지원 매트릭스</h2>';
            matrixHtml += `<table style="${tableStyle} font-size:10px;">`;
            matrixHtml += '<thead><tr>';
            matrixHtml += `<th style="border:1px solid #bbb; padding:6px 8px; background:#e6e8fa; text-align:center; white-space:nowrap; font-size:10px; font-weight:600;">구분</th>`;
            matrixDepts.forEach(d => {
                const label = d.length > 8 ? d.substring(0, 8) + '…' : d;
                matrixHtml += `<th style="border:1px solid #bbb; padding:5px 3px; background:#e6e8fa; text-align:center; font-size:8px; font-weight:500;">${label}</th>`;
            });
            matrixHtml += '</tr></thead><tbody>';

            matrixUnis.forEach((uni, idx) => {
                const isDG = DAEGU_GYEONGBUK_UNIVERSITIES.includes(uni);
                const bgRow = isDG ? 'background:rgba(245,158,11,0.06);' : (idx % 2 === 0 ? 'background:#fcfcff;' : '');
                const uniLabel = uni.length > 16 ? uni.substring(0, 16) + '…' : uni;
                matrixHtml += `<tr style="${bgRow}">`;
                matrixHtml += `<td style="border:1px solid #ddd; padding:5px 8px; white-space:nowrap; font-weight:500; font-size:10px; ${isDG ? 'color:#b45309;font-weight:700;' : ''}">${isDG ? '★ ' : ''}${uniLabel}</td>`;
                matrixDepts.forEach(dept => {
                    const val = matrixLookup[`${uni}|${dept}`];
                    let cellBg = '';
                    if (val) {
                        cellBg = isDG ? 'background:rgba(245,158,11,0.25);' : 'background:rgba(99,102,241,0.18);';
                    }
                    matrixHtml += `<td style="border:1px solid #ddd; padding:4px 3px; text-align:center; font-weight:600; font-size:10px; ${cellBg}">${val || ''}</td>`;
                });
                matrixHtml += '</tr>';
            });
            matrixHtml += '</tbody></table>';

            // Landscape pages
            const page4Images = await captureAsPages(matrixHtml, 1123, 794);
            {
                const pW = 297, pH = 210;
                page4Images.forEach((imgData, idx) => {
                    pdf.addPage('a4', 'landscape');
                    pdf.addImage(imgData, 'PNG', 0, 0, pW, pH);
                    addPageNum('landscape');
                });
            }

            // Save
            const fileName = `${year}학년도_수시모집_지원통계분석.pdf`;
            pdf.save(fileName);
            Toast.show(`PDF 보고서가 다운로드되었습니다: ${fileName}`, 'success');
        } catch (err) {
            console.error('PDF export error:', err);
            Toast.show('PDF 생성 중 오류가 발생했습니다: ' + err.message, 'error');
        }
    }
}

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
