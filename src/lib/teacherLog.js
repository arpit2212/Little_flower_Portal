import { supabase } from './supabase';

export async function logTeacherAction(user, payload) {
  try {
    if (!user || !payload || !payload.action || !payload.entityType) {
      return;
    }

    const clerkUserId = user.id;
    const teacherName = user.fullName || user.firstName || null;
    const teacherEmail = user.primaryEmailAddress?.emailAddress || null;

    const logEntry = {
      clerk_user_id: clerkUserId,
      teacher_id: payload.teacherId || null,
      teacher_name: teacherName,
      teacher_email: teacherEmail,
      action: payload.action,
      entity_type: payload.entityType,
      entity_id: payload.entityId || null,
      description: payload.description || null
    };

    await supabase.from('teacher_activity_logs').insert(logEntry);
  } catch (error) {
    console.error('Failed to log teacher action', error);
  }
}
