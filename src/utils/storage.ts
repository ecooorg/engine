import { Decision, INITIAL_DECISION } from '../types/decision';

const DECISIONS_KEY = 'bifurcation_decisions_v5';
const ACTIVE_ID_KEY = 'bifurcation_active_id_v5';
const PRIVACY_KEY = 'bifurcation_privacy_accepted_v5';

export function getStoredDecisions(): Decision[] {
  try {
    const raw = localStorage.getItem(DECISIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Decision[];
    // Migrate older shapes if needed
    return parsed.map((d) => ({
      ...INITIAL_DECISION,
      ...d,
      phase: d.phase || (d.clarificationQuestions?.length ? 'RADAR' : 'INTAKE'),
      calibrationEntries: d.calibrationEntries || [],
      preMortem: d.preMortem ?? null,
    }));
  } catch {
    return [];
  }
}

export function saveDecisions(decisions: Decision[]): void {
  try {
    localStorage.setItem(DECISIONS_KEY, JSON.stringify(decisions));
  } catch (e) {
    console.warn('[storage] Failed to save decisions', e);
  }
}

export function getActiveDecisionId(): string {
  return localStorage.getItem(ACTIVE_ID_KEY) || '';
}

export function setActiveDecisionId(id: string): void {
  localStorage.setItem(ACTIVE_ID_KEY, id);
}

export function getPrivacyAccepted(): boolean {
  return localStorage.getItem(PRIVACY_KEY) === 'true';
}

export function setPrivacyAccepted(value: boolean): void {
  localStorage.setItem(PRIVACY_KEY, value ? 'true' : 'false');
}

export { INITIAL_DECISION };
