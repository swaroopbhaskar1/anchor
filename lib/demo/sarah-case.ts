export interface SarahMirrorResult {
  mirror: string
  ground: string
  actions: string[]
  fearSummary: string
  fearQuote: string
}

export const SARAH_DEMO_CONCERN =
  "I feel like I'm missing everything. My mom may have stage III colon cancer, and I don't even know what questions to ask tomorrow."

/** Intro paragraph for the NCCN-aware care preparation card (all result paths). */
export const CARE_TEAM_ALIGNED_INTRO =
  "Anchor organizes this around common oncology guideline workflows: confirming what is known, identifying what is pending, preparing questions, and helping you bring the right records to your care team. This is preparation for your care team, not a diagnosis or treatment recommendation."

/** Bullets for NCCN-aware care preparation (Sarah demo / backup mirror). */
export const SARAH_CARE_TEAM_CONTEXT_BULLETS = [
  "Confirm what diagnosis and stage are actually documented.",
  "Ask which reports are final and which are still pending.",
  "Bring pathology, imaging summaries, medication list, and portal messages.",
  "Ask what decisions, if any, are expected at the next appointment.",
  "Use NCCN-aware questions to clarify what the care team already knows and what still needs confirmation.",
]

/** Generic NCCN-aware prep bullets when the mirror is not the Sarah demo shape. */
export const GENERIC_CARE_TEAM_CONTEXT_BULLETS = [
  "Confirm with your care team what is documented versus still in workup.",
  "Ask which reports are final and which are still pending.",
  "Bring or list pathology, imaging summaries, medications, and portal messages your team requests.",
  "Ask what decisions, if any, are expected at the next visit — and what is still needed before those decisions.",
  "Use NCCN-aware question prep to organize what to ask — your care team decides what applies.",
]

/** Factors that should prompt updating the 72-hour plan (UI copy only). */
export const PLAN_CHANGE_FACTORS_BULLETS = [
  "Final pathology details",
  "Imaging results",
  "Biomarker/MMR/MSI status",
  "Appointment timing",
  "Care-team instructions",
  "New symptoms or urgent concerns",
]

export const PLAN_CHANGE_URGENT_SAFETY =
  "If something urgent or severe is happening, contact the care team or emergency services instead of relying on Anchor."

/** Bullets for structured results UI (Sarah demo / backup mirror). */
export const SARAH_KNOW_NOW_BULLETS = [
  "The sample concern mentions possible stage III colon cancer — that wording is not confirmed by Anchor and must be verified with pathology and your care team.",
  "There may be a recent colon cancer diagnosis or active workup — ask what is documented versus still being finalized.",
  "Tomorrow's appointment is the next practical place to clarify what is confirmed, what is pending, and what decisions are actually on the table.",
  "In demo or backup mode, this is a sample, de-identified case — not a real medical record.",
]

export const SARAH_NEEDS_CONFIRMATION_BULLETS = [
  "Whether stage III is confirmed versus still in workup — ask your team what is settled.",
  "Whether imaging is complete and what it may suggest (interpretation belongs to your clinicians).",
  "Whether pathology is finalized and matches what you were told in plain language.",
  "Whether biomarker or MMR/MSI testing is pending or already done.",
  "What decisions, if any, are expected at tomorrow's visit.",
]

export const SARAH_NOT_TONIGHT_BULLETS = [
  "You do not need to finalize a treatment plan before your next conversation with the care team.",
  "You do not need to memorize every medical term tonight — a short, plain-language question list is enough prep.",
  "You do not need to solve every portal or scheduling task tonight — focus on what makes the next visit clearer.",
  "The goal is enough rest and organization to ask good questions and hear the answers — not to solve cancer care alone.",
]

export interface NightNoteContent {
  subtitle: string
  body: string
  tinyActions: string[]
}

/** Night Note for Sarah-structured caregiver packet. */
export const SARAH_NIGHT_NOTE: NightNoteContent = {
  subtitle: "Use this anytime the situation feels too big.",
  body: "Your job is not to solve the entire cancer plan alone. Your job is to make the next conversation clearer: gather the records you have, write the questions you are afraid you will forget, and decide who will be in the room or on the call. It is still okay to breathe — preparation and rest both belong in the same night.",
  tinyActions: [
    "Save or screenshot the records you have.",
    "Write the top 3 questions for the care team.",
    "Choose who is going to the appointment or call.",
    "Put the appointment time, location, and portal login somewhere easy to find.",
  ],
}

/** Night Note when mirror content is not the Sarah demo shape. */
export const GENERIC_NIGHT_NOTE: NightNoteContent = {
  subtitle: "Use this anytime the situation feels too big.",
  body: "You cannot resolve the whole care path in one sitting. You can make the next touchpoint with your care team clearer: gather what you know, name what is still uncertain, and line up who should attend or follow up. A short pause before the next search is allowed — the point is to land ready for the conversation, not to disappear the fear in one try.",
  tinyActions: [
    "Save or screenshot the records you have so far.",
    "Write three questions you do not want to forget to ask.",
    "Choose who will join the visit or help with follow-up notes.",
    "Put appointment or call details where you will see them.",
  ],
}

export const SARAH_DEMO_MIRROR_RESULT: SarahMirrorResult = {
  fearQuote: SARAH_DEMO_CONCERN,
  fearSummary:
    "Worried about missing something important before tomorrow's appointment while supporting mom during a possible stage III colon cancer workup",
  mirror:
    "You are worried you may miss something important before tomorrow's appointment, and you are trying to support your mom while feeling overwhelmed.",
  ground: [
    `What we know right now: ${SARAH_KNOW_NOW_BULLETS.slice(0, 3).join(" ")} ${SARAH_KNOW_NOW_BULLETS[3]}`,
    "",
    `What still needs confirmation with your doctor: ${SARAH_NEEDS_CONFIRMATION_BULLETS.join(" ")}`,
    "",
    `What does not need to be solved tonight: ${SARAH_NOT_TONIGHT_BULLETS.join(" ")}`,
    "",
    "Anchor helps families prepare questions and organize next steps. It does not diagnose, prescribe, choose treatment, or replace your care team.",
  ].join("\n"),
  actions: [
    "Write down the exact questions you want to ask tomorrow — keep the list short and plain language so you can read it under stress.",
    "Gather reports, portal messages, pathology notes, imaging summaries, and your mom's medication list in one place to bring or reference tomorrow.",
    "Ask your care team what is confirmed, what is still pending, and what decisions are actually needed next — then confirm follow-up contacts.",
  ],
}

export const SARAH_DEMO_ACTION_PREFIXES = [
  "Write down the exact questions",
  "Gather reports, portal messages",
  "Ask your care team what is confirmed",
]

export const SARAH_DEMO_ACTION_SCRIPTS = [
  "Open one note and write three headings: \"Confirmed,\" \"Still unclear,\" and \"Questions for the next visit.\" Under each, add bullets as you remember them — you can fix details after you speak with your care team.",
  "Hi, I'm calling for my mom. We were told she may have possible stage III colon cancer, and we have an appointment tomorrow. Before we come in, can you help us confirm what records we should bring, whether the full pathology report is finalized, and whether any imaging or biomarker testing is still pending?",
  [
    "What is confirmed right now, and what is still uncertain?",
    "Is the stage confirmed or still being worked up?",
    "Are imaging and pathology complete?",
    "Are any biomarkers or MMR/MSI tests pending?",
    "What decisions are expected at this appointment?",
    "What should we watch for or call about before the next visit?",
  ].join(" "),
]

export const SARAH_DEMO_ORIENTATION_LINES = [
  "Sample demo only — confirm every detail with your care team.",
  "Anchor does not replace your care team or your hospital records.",
  "No real patient data is used in this walkthrough.",
]

export interface PlanActionShape {
  text: string
  regretQuote: string
}

export interface SarahPlanResultShape {
  tonight: PlanActionShape[]
  tomorrow: PlanActionShape[]
  next48: PlanActionShape[]
}

export const SARAH_FALLBACK_PLAN_RESULT: SarahPlanResultShape = {
  tonight: [
    {
      text: "Save documents in one folder, decide who will attend tomorrow's visit, and keep login details handy.",
      regretQuote: "Looking back, I wish we had not scrambled in the waiting room over who was supposed to speak for Mom.",
    },
    {
      text: "Write your top questions in plain language — three is enough for tonight.",
      regretQuote: "I walked out realizing I never asked the one thing that kept me awake.",
    },
    {
      text: "Note symptoms or concerns your mom wants mentioned, without diagnosing.",
      regretQuote: "She told me later she felt unheard because I forgot the detail she cared about most.",
    },
  ],
  tomorrow: [
    {
      text: "Bring records, lists, and portal printouts your team asked for.",
      regretQuote: "We lost a half hour of the visit hunting for paperwork instead of getting answers.",
    },
    {
      text: "Ask what stage and key results are confirmed versus still pending.",
      regretQuote: "We assumed staging was final when pathology was still being finalized.",
    },
    {
      text: "Ask what tests or reports are still needed before next decisions.",
      regretQuote: "We scheduled another trip because we did not know a scan was still outstanding.",
    },
  ],
  next48: [
    {
      text: "Request missing records through the portal or records office after your visit.",
      regretQuote: "I spent days on the phone because I did not start the records request early enough.",
    },
    {
      text: "Clarify follow-up appointments and who to contact with new questions.",
      regretQuote: "We sat on a symptom longer than we should have because we did not know the right line to call.",
    },
    {
      text: "Consider second-opinion or navigation support only after you discuss options with the care team.",
      regretQuote: "We rushed into extra opinions before we understood what our own team was recommending.",
    },
  ],
}
