import { one, run, transaction, lockUser } from './db';
import { check } from './auth';
export const STUDY_MS = 25 * 60 * 1000;
export const BREAK_MS = 5 * 60 * 1000;
export function normalizeFocus(row: Record<string, any>, now: number) {
    if (row.state === 'running' && row.deadline <= now) {
        if (row.phase === 'study') {
            row.phase = 'break';
            row.deadline += BREAK_MS;
            row.remaining_ms = BREAK_MS;
        }
        if (row.deadline <= now) {
            row.state = 'completed';
            row.finished_at = row.deadline;
            row.remaining_ms = 0;
            row.deadline = null;
        }
        row.heartbeat_active = 0;
    }
    return row;
}
async function persist(row: Record<string, any>, now: number) {
    (await run('UPDATE focus_sessions SET state=?,phase=?,deadline=?,remaining_ms=?,active_seconds=?,heartbeat_at=?,heartbeat_active=?,updated_at=?,finished_at=? WHERE id=?', row.state, row.phase, row.deadline, row.remaining_ms, row.active_seconds, row.heartbeat_at, row.heartbeat_active, now, row.finished_at, row.id));
}
export async function currentFocus(userId: number, now = Date.now()) {
    return transaction(async () => {
        await lockUser(userId);
    const row = (await one('SELECT * FROM focus_sessions WHERE user_id=? AND state IN (?,?)', userId, 'running', 'paused'));
    if (!row)
        return null;
    normalizeFocus(row, now);
    (await persist(row, now));
    return row;

    });
}
export async function startFocus(userId: number, lessonId: number, goal: string, now = Date.now()) {
    return (await transaction(async () => {
        const current = (await currentFocus(userId, now));
        check(!current || current.state === 'completed', 'Sizda faol Focus sessiyasi bor.', 409);
        check((await one('SELECT id FROM lessons WHERE id=?', lessonId)), 'Dars topilmadi.', 404);
        const res = (await run('INSERT INTO focus_sessions(user_id,lesson_id,goal,state,phase,deadline,remaining_ms,created_at,updated_at,heartbeat_at) VALUES(?,?,?,?,?,?,?,?,?,?)', userId, lessonId, goal, 'running', 'study', now + STUDY_MS, STUDY_MS, now, now, now));
        return (await one('SELECT * FROM focus_sessions WHERE id=?', Number(res.lastInsertRowid)));
    }));
}
export async function updateFocus(userId: number, action: string, active = false, now = Date.now()) {
    return (await transaction(async () => {
        const row = (await currentFocus(userId, now));
        check(row, 'Faol Focus sessiyasi topilmadi.', 404);
        if (action === 'heartbeat') {
            // Count only consecutive recent, visible, non-idle heartbeats during study.
            const elapsed = now - (row.heartbeat_at ?? now);
            if (row.state === 'running' && row.phase === 'study' && active && row.heartbeat_active && elapsed >= 0 && elapsed <= 15000)
                row.active_seconds += Math.floor(elapsed / 1000);
            row.heartbeat_at = now;
            row.heartbeat_active = active ? 1 : 0;
        }
        else if (action === 'pause') {
            check(row.state === 'running', 'Sessiya ishlayotgan bo‘lishi kerak.');
            row.remaining_ms = Math.max(0, row.deadline - now);
            row.deadline = null;
            row.state = 'paused';
            row.heartbeat_active = 0;
        }
        else if (action === 'resume') {
            check(row.state === 'paused', 'Sessiya pauzada bo‘lishi kerak.');
            row.deadline = now + row.remaining_ms;
            row.state = 'running';
            row.heartbeat_at = now;
            row.heartbeat_active = 0;
        }
        else if (action === 'finish') {
            row.state = 'completed';
            row.finished_at = now;
            row.deadline = null;
            row.remaining_ms = 0;
            row.heartbeat_active = 0;
        }
        else
            check(false, 'Noma’lum amal.');
        (await persist(row, now));
        return row;
    }));
}
