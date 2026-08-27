/* Adapts this app's ASSESSMENTS shape ({ id, course, title, date, type, ... })
   into the generic { id, title, subtitle, dueAt } shape useReminderQueue
   expects. Swapping data sources later means writing a new adapter like this
   one, not touching the hook or the rendering component. */

export function adaptAssessments(assessments) {
  return assessments
    .filter((a) => a.date)
    .map((a) => ({
      id: a.id,
      title: reminderTitle(a),
      subtitle: a.course,
      dueAt: `${a.date}T09:00:00`,
    }));
}

function reminderTitle(assessment) {
  const label = TYPE_LABEL[assessment.type] || "is coming up";
  return `${assessment.title} ${label}`;
}

const TYPE_LABEL = {
  exam: "is coming up",
  quiz: "is coming up",
  project: "is due soon",
  paper: "is due soon",
  homework: "is due soon",
  presentation: "is coming up",
};
