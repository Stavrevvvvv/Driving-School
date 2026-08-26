'use client';

import { useActionState } from 'react';

import {
  assignStudentToTeacher,
  removeStudentFromTeacher,
  type AssignmentActionState,
} from './actions';
import { formatProfileName } from '@/lib/people';
import type { ProfileSummary } from '@/types';

const initialAssignmentActionState: AssignmentActionState = {
  status: 'idle',
  message: '',
};

type AssignmentManagerProps = {
  teachers: ProfileSummary[];
  students: ProfileSummary[];
  assignmentsByTeacher: Record<string, ProfileSummary[]>;
};

function StateBanner({ state }: { state: AssignmentActionState }) {
  if (state.status === 'idle' || !state.message) {
    return null;
  }

  return (
    <p
      role="status"
      aria-live="polite"
      style={{
        margin: '0 0 16px',
        color: state.status === 'error' ? '#b91c1c' : '#166534',
      }}
    >
      {state.message}
    </p>
  );
}

export function AssignmentManager({ teachers, students, assignmentsByTeacher }: AssignmentManagerProps) {
  const [assignState, assignAction, assignPending] = useActionState(
    assignStudentToTeacher,
    initialAssignmentActionState
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeStudentFromTeacher,
    initialAssignmentActionState
  );

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section>
        <h2>Assign student to teacher</h2>
        <StateBanner state={assignState} />
        <form action={assignAction} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Teacher</span>
            <select name="teacher_id" required defaultValue="">
              <option value="" disabled>
                Select a teacher
              </option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {formatProfileName(teacher)} ({teacher.email})
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Student</span>
            <select name="student_id" required defaultValue="">
              <option value="" disabled>
                Select a student
              </option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {formatProfileName(student)} ({student.email})
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={assignPending} style={{ width: 'fit-content' }}>
            {assignPending ? 'Assigning...' : 'Assign student'}
          </button>
        </form>
      </section>

      <section>
        <h2>Current assignments</h2>
        <StateBanner state={removeState} />
        <div style={{ display: 'grid', gap: 16 }}>
          {teachers.map((teacher) => {
            const assignedStudents = assignmentsByTeacher[teacher.id] ?? [];

            return (
              <article
                key={teacher.id}
                style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}
              >
                <h3 style={{ marginTop: 0 }}>{formatProfileName(teacher)}</h3>
                <p style={{ marginTop: 0, color: '#555' }}>{teacher.email}</p>
                {assignedStudents.length === 0 ? (
                  <p>No students assigned.</p>
                ) : (
                  <ul style={{ display: 'grid', gap: 8, paddingLeft: 20 }}>
                    {assignedStudents.map((student) => (
                      <li key={student.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span>
                          {formatProfileName(student)} - {student.email}
                        </span>
                        <form action={removeAction}>
                          <input type="hidden" name="teacher_id" value={teacher.id} />
                          <input type="hidden" name="student_id" value={student.id} />
                          <button type="submit" disabled={removePending}>
                            {removePending ? 'Removing...' : 'Remove'}
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
