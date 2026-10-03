import JSZip from 'jszip';
import { Decision } from '../types/decision';

export async function generateFullZipBackup(decisions: Decision[]): Promise<Blob> {
  const zip = new JSZip();

  // 1. JSON Machine-readable backup
  const jsonContent = JSON.stringify(decisions, null, 2);
  zip.file('decisions_data.json', jsonContent);

  // 2. README instruction
  const readme = `=====================================================
BIFURCATION ENGINE — РЕЗЕРВНАЯ КОПИЯ РЕШЕНИЙ
Дата создания: ${new Date().toLocaleString('ru-RU')}
Количество решений в архиве: ${decisions.length}
=====================================================

СОСТАВ АРХИВА:
1. decisions_data.json — Полная база данных ваших решений для восстановления в приложении.
2. manifestos/ — Текстовые манифесты решений в формате Markdown (.md).
3. memos/ — Готовые к печати и показу презентационные меморандумы (.html).

КАК ВОССТАНОВИТЬ ДАННЫЕ В ПРИЛОЖЕНИИ:
1. Откройте Bifurcation Engine.
2. В верхнем меню выберите «Резервная копия» -> «Восстановить из файла».
3. Выберите файл decisions_data.json из этого архива.
=====================================================`;
  zip.file('README_BACKUP.txt', readme);

  const manifestosFolder = zip.folder('manifestos');
  const memosFolder = zip.folder('memos');

  for (const dec of decisions) {
    const safeTitle = dec.title.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 50);

    // Markdown Manifesto
    const md = generateMarkdownManifesto(dec);
    manifestosFolder?.file(`Manifesto_${safeTitle}.md`, md);

    // HTML Memo
    const html = generateHtmlMemo(dec);
    memosFolder?.file(`Decision_Memo_${safeTitle}.html`, html);
  }

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateMarkdownManifesto(dec: Decision): string {
  return `# МАНИФЕСТ РЕШЕНИЯ: ${dec.title}
**Дата анализа:** ${new Date(dec.createdAt).toLocaleDateString('ru-RU')}
**Контрольная точка ревизии:** ${dec.revisitDate}
**Модель вычислений:** ${dec.modelUsed}
**Статус:** ${dec.status}

---

## 1. ИСХОДНЫЙ КОНТЕКСТ И МОНОЛОГ
> "${dec.rawInput}"

### Выявленные активы и ресурсы:
${dec.identifiedAssets.map((a) => `- ${a}`).join('\n')}

### Доминирующие страхи и барьеры:
${dec.coreFears.map((f) => `- ${f}`).join('\n')}

---

## 2. АЛЬТЕРНАТИВЫ И КЛАССИФИКАЦИЯ ОБРАТИМОСТИ (BEZOS DOORS)
${dec.alternatives
  .map(
    (alt) => `### Вариант ${alt.letter}: ${alt.title}
*Тип обратимости:* **${alt.doorType === 'ONE_WAY' ? '🚪 Дверь в одну сторону (Необратимое)' : '🔄 Дверь в две стороны (Легко обратимое)'}**
*Суть:* ${alt.tagline}
${alt.description}
`
  )
  .join('\n\n')}

---

## 3. ТОЧКИ БИФУРКАЦИИ И РУБЕЖИ НЕВОЗВРАТА
${dec.bifurcationPoints
  .map(
    (b, i) => `### Точка ${i + 1}: ${b.timing}
- **Событие-триггер:** ${b.triggerEvent}
- **Следствие:** ${b.consequence}
- **Превентивное действие:** ${b.preemptiveAction}
- **Необратимость:** ${b.isIrreversible ? 'ДА (Точка невозврата)' : 'НЕТ (Управляемый порог)'}
`
  )
  .join('\n')}

---

## 4. СТРЕСС-ТЕСТ «PRE-MORTEM» (ВЗГЛЯД ИЗ КАТАСТРОФЫ)
**Дата моделируемого кризиса:** ${dec.preMortem.catastropheFutureDate}
**Сценарий крушения:** 
> ${dec.preMortem.worstCaseNarrative}

### Первопричины катастрофы:
${dec.preMortem.primaryFailurePoints.map((p) => `- ${p}`).join('\n')}

${dec.preMortem.sunkCostTrapAlert ? `### Ловушка невозвратных затрат:\n${dec.preMortem.sunkCostTrapAlert}\n` : ''}
### Цена бездействия за 1 год:
${dec.preMortem.costOfInactionAnnual}

---

## 5. ПРАВИЛО ВЫХОДА (KILL-CRITERIA)
${dec.killCriteria
  .map(
    (k, i) => `${i + 1}. **Условие:** ${k.thresholdCondition} (*Дедлайн/метрика: ${k.deadlineOrMetric}*)
   -> **Протокол действий:** ${k.actionProtocol}`
  )
  .join('\n\n')}
`;
}

function generateHtmlMemo(dec: Decision): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Decision Memo: ${escapeHtml(dec.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f1f5f9; padding: 40px 20px; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 36px; border: 1px solid #334155; }
    h1 { color: #38bdf8; font-size: 24px; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-top: 0; }
    h2 { color: #94a3b8; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; margin-top: 28px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; background: #0284c7; color: white; margin-right: 8px; }
    .quote-box { background: #0f172a; border-left: 4px solid #38bdf8; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; font-style: italic; color: #cbd5e1; }
    .card { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .danger { border-left: 4px solid #ef4444; }
    .success { border-left: 4px solid #10b981; }
    .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(dec.title)}</h1>
    <div class="meta">
      <span class="badge">${escapeHtml(dec.status)}</span>
      <span class="badge" style="background:#475569;">Модель: ${escapeHtml(dec.modelUsed)}</span>
      <span>Создано: ${new Date(dec.createdAt).toLocaleDateString('ru-RU')}</span> | 
      <span>Ревизия: ${escapeHtml(dec.revisitDate)}</span>
    </div>

    <h2>1. Исходный контекст</h2>
    <div class="quote-box">"${escapeHtml(dec.rawInput)}"</div>

    <h2>2. Альтернативы</h2>
    ${dec.alternatives
      .map(
        (a) => `
      <div class="card ${a.doorType === 'ONE_WAY' ? 'danger' : 'success'}">
        <h3 style="margin-top:0; color:#38bdf8;">Вариант ${a.letter}: ${escapeHtml(a.title)}</h3>
        <p><strong>Суть:</strong> ${escapeHtml(a.tagline)}</p>
        <p>${escapeHtml(a.description)}</p>
        <p><small>Тип: ${a.doorType === 'ONE_WAY' ? 'Дверь в одну сторону (необратимое)' : 'Дверь в две стороны (обратимое)'}</small></p>
      </div>
    `
      )
      .join('')}

    <h2>3. Стресс-тест Pre-Mortem</h2>
    <div class="card danger">
      <p><strong>Сценарий будущего сбоя (${escapeHtml(dec.preMortem.catastropheFutureDate)}):</strong></p>
      <p>${escapeHtml(dec.preMortem.worstCaseNarrative)}</p>
      <p><strong>Цена бездействия:</strong> ${escapeHtml(dec.preMortem.costOfInactionAnnual)}</p>
    </div>

    <h2>4. Правило выхода (Kill-Criteria)</h2>
    ${dec.killCriteria
      .map(
        (k) => `
      <div class="card">
        <p><strong>Условие:</strong> ${escapeHtml(k.thresholdCondition)} (${escapeHtml(k.deadlineOrMetric)})</p>
        <p><strong>Протокол:</strong> ${escapeHtml(k.actionProtocol)}</p>
      </div>
    `
      )
      .join('')}
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
