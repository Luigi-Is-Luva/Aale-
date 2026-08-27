import { Type } from "@google/genai";

// Structured output schema for the first Gemini pass: raw syllabus -> breakdown.
export const syllabusBreakdownSchema = {
  type: Type.OBJECT,
  properties: {
    course: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        code: { type: Type.STRING },
        instructor: { type: Type.STRING },
        term: { type: Type.STRING },
      },
      required: ["name"],
    },
    keyDates: {
      type: Type.ARRAY,
      description: "Every exam, assignment due date, project milestone, or holiday mentioned.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          date: { type: Type.STRING, description: "ISO 8601 date, e.g. 2026-10-14. Use best guess year if not stated." },
          type: {
            type: Type.STRING,
            enum: ["exam", "assignment", "project", "holiday", "quiz", "other"],
          },
          description: { type: Type.STRING },
        },
        required: ["title", "date", "type"],
      },
    },
    gradingPolicy: {
      type: Type.OBJECT,
      properties: {
        components: {
          type: Type.ARRAY,
          description: "Breakdown of how the final grade is composed.",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              weightPercent: { type: Type.NUMBER },
              description: { type: Type.STRING },
            },
            required: ["name", "weightPercent"],
          },
        },
        gradingScale: {
          type: Type.ARRAY,
          description: "Letter grade cutoffs if present, e.g. A = 93-100.",
          items: {
            type: Type.OBJECT,
            properties: {
              letter: { type: Type.STRING },
              minPercent: { type: Type.NUMBER },
            },
            required: ["letter", "minPercent"],
          },
        },
        notes: { type: Type.STRING, description: "Attendance, late-work, curve, or extra-credit policies in plain language." },
      },
    },
    topics: {
      type: Type.ARRAY,
      description: "Main units/topics covered in the course, in order, used later for flashcards.",
      items: { type: Type.STRING },
    },
  },
  required: ["course", "keyDates", "gradingPolicy", "topics"],
};

// Structured output schema for the multi-syllabus "Semester" pass used by the
// Course Canvas transit-map UI (see mta/parse-route.ts for the original contract).
export const semesterSchema = {
  type: Type.OBJECT,
  properties: {
    courses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING, description: "Normalized course code, e.g. 'CSCI 33500'." },
          title: { type: Type.STRING },
          instructor: { type: Type.STRING },
          meetingTimes: { type: Type.STRING, description: "As written, e.g. 'MW 10:00-11:50am'." },
          room: { type: Type.STRING },
          gradingPolicy: {
            type: Type.ARRAY,
            description: "Must sum to 100 across the array (per this course).",
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                weightPercent: { type: Type.NUMBER },
                dropsLowest: { type: Type.BOOLEAN },
              },
              required: ["category", "weightPercent"],
            },
          },
          latePolicy: { type: Type.STRING, description: "Rewritten in plain language, one or two sentences." },
          attendancePolicy: { type: Type.STRING, description: "Rewritten in plain language, one or two sentences." },
          topics: {
            type: Type.ARRAY,
            description: "6-12 concepts from the course schedule, for flashcard generation. Concepts, not week labels.",
            items: { type: Type.STRING },
          },
          topicDefinitions: {
            type: Type.ARRAY,
            description: "A one or two sentence, exam-useful definition for each entry in topics, same order.",
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                definition: { type: Type.STRING },
              },
              required: ["topic", "definition"],
            },
          },
        },
        required: ["code", "title", "gradingPolicy", "topics"],
      },
    },
    assessments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Stable slug, e.g. csci33500-midterm-1." },
          courseCode: { type: Type.STRING, description: "Must match a code in courses[]." },
          title: { type: Type.STRING },
          type: {
            type: Type.STRING,
            enum: ["exam", "quiz", "project", "paper", "homework", "presentation", "other"],
          },
          dueDate: { type: Type.STRING, description: "ISO YYYY-MM-DD, or omit if the syllabus never gives one." },
          dateConfidence: {
            type: Type.STRING,
            enum: ["explicit", "inferred", "unknown"],
            description: "explicit = printed date; inferred = resolved from 'week 7'; unknown = TBA.",
          },
          weightPercent: { type: Type.NUMBER, description: "Share of the FINAL COURSE GRADE, not of its category." },
          notes: { type: Type.STRING, description: "Short practical detail: open book, group work, page count." },
          estimatedHours: {
            type: Type.NUMBER,
            description: "Realistic total prep hours a student should budget for this item, given its type and weight.",
          },
        },
        required: ["id", "courseCode", "title", "type", "dateConfidence", "estimatedHours"],
      },
    },
  },
  required: ["courses", "assessments"],
};

// Structured output schema for the second Gemini pass: breakdown + free time -> study plan.
export const studyPlanSchema = {
  type: Type.OBJECT,
  properties: {
    flashcards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
          difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] },
        },
        required: ["topic", "question", "answer", "difficulty"],
      },
    },
    studySchedule: {
      type: Type.ARRAY,
      description: "Concrete study sessions placed inside the user's free time slots.",
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: "ISO 8601 date" },
          startTime: { type: Type.STRING, description: "24h HH:MM" },
          endTime: { type: Type.STRING, description: "24h HH:MM" },
          topic: { type: Type.STRING },
          activityType: {
            type: Type.STRING,
            enum: ["review", "practice", "flashcards", "reading", "project_work"],
          },
          relatedDeadline: { type: Type.STRING, description: "Title of the key date this session prepares for, if any." },
        },
        required: ["date", "startTime", "endTime", "topic", "activityType"],
      },
    },
  },
  required: ["flashcards", "studySchedule"],
};
