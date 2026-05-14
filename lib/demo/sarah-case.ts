export interface SarahMirrorResult {
  mirror: string
  ground: string
  actions: string[]
  fearSummary: string
  fearQuote: string
}

export const SARAH_DEMO_CONCERN =
  "I feel like I'm missing everything. My mom may have stage III colon cancer, and I don't even know what questions to ask at the next visit."

/** Memory tab — soft demo framing (Prompt 8.5). */
export const MEMORY_PROTO_BADGE = "Demo case · sample only"

export const MEMORY_ANCHOR_ORGANIZED_LINE =
  "Anchor keeps a light thread so you do not restart from zero when the next call or visit arrives."

export const MEMORY_SUBTITLE_LINES = [
  "Saved only in this browser for the walkthrough — Start over clears it.",
  "Not a medical record and not HIPAA-grade storage.",
] as const

export const MEMORY_EMPTY_QUESTIONS_ASKED =
  "Nothing here yet — open Tools → Ask Anchor when you want to capture brief prep frames for your care team."

export const MEMORY_EMPTY_CASE_UPDATES =
  "No structured updates yet — open Tools → Update the plan to add a detail; Anchor will reflect it on the plan board."

export const MEMORY_EMPTY_TASKS_DONE =
  "No checklist items marked done yet — open Tools → 72-hour plan when you are ready."

export const MEMORY_EMPTY_TIMELINE_ARTIFACTS =
  "Nothing saved from Guide me yet — open Tools → 72-hour plan, tap Guide me on a task, then save to the demo timeline if you want a record here."

export const MEMORY_CARE_TIMELINE_INTRO =
  "Only the key moments from this session — not a full medical timeline."

/** Short narrative for the Memory tab “holding” card (Prompt 8.5). */
export function buildMemoryHoldingNarrative(input: {
  caregiverName: string
  lovedOneLabel: string
  cancerLine: string
  isSarahDemo: boolean
}): string {
  const { caregiverName, lovedOneLabel, cancerLine, isSarahDemo } = input
  if (isSarahDemo) {
    return `${caregiverName}, Anchor is holding onto the worry you voiced about the next visit or call and supporting ${lovedOneLabel} through possible ${cancerLine} workup — not as a diagnosis, but as a place to park questions, tasks, and what still needs confirmation until your care team explains the plan.`
  }
  return `${caregiverName}, Anchor is holding onto who ${lovedOneLabel} is to you, the concern you shared, and ${cancerLine} — so you can listen for what is confirmed, what is pending, and what to ask next without re-explaining the whole story each time you open this tab.`
}

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
  "In this sample, the next visit is the most useful place to clarify what is confirmed and pending — your real schedule may differ; confirm dates with your care team.",
  "In demo or backup mode, this is a sample, de-identified case — not a real medical record.",
]

export const SARAH_NEEDS_CONFIRMATION_BULLETS = [
  "Whether stage III is confirmed versus still in workup — ask your team what is settled.",
  "Whether imaging is complete and what it may suggest (interpretation belongs to your clinicians).",
  "Whether pathology is finalized and matches what you were told in plain language.",
  "Whether biomarker or MMR/MSI testing is pending or already done.",
  "What decisions, if any, are expected at the next visit or call.",
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
    "Worried about missing something important before the next visit or call while supporting mom during a possible stage III colon cancer workup",
  mirror:
    "You are worried you may miss something important before the next visit or call, and you are trying to support your mom while feeling overwhelmed.",
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
    "Write down the exact questions you want for the next visit — keep the list short and plain language so you can read it under stress.",
    "Gather reports, portal messages, pathology notes, imaging summaries, and your mom's medication list in one place to bring or reference.",
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
  "Hi, I'm calling for my mom. We were told she may have possible stage III colon cancer, and we have a visit coming up. Before we come in, can you help us confirm what records we should bring, whether the full pathology report is finalized, and whether any imaging or biomarker testing is still pending?",
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
      text: "Save documents in one folder, decide who will attend the next visit, and keep login details handy.",
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

/** Quick-add chips for the local “I have new information” demo panel (no API). */
export const DEMO_INFO_UPDATE_CHIPS = [
  { id: "appt-moved", label: "Appointment moved to tomorrow at 9" },
  { id: "mmr-pending", label: "MMR/MSI pending" },
  { id: "imaging-incomplete", label: "Imaging not complete yet" },
  { id: "path-final", label: "Pathology report is final" },
  { id: "chemo-mentioned", label: "Care team mentioned possible chemo" },
  { id: "sibling-arrival", label: "Sibling is flying in tomorrow" },
  { id: "severe-symptoms", label: "Patient has new severe symptoms" },
  { id: "insurance-records", label: "Insurance asked for records" },
] as const

export type DemoInfoChipId = (typeof DEMO_INFO_UPDATE_CHIPS)[number]["id"]

export interface DemoCaseDeltaCopy {
  newInformation: string
  mayAffect: string
  needsConfirmation: string
  askNext: string
  revisedStep: string
}

const DEMO_CHIP_NARRATIVES: Record<string, DemoCaseDeltaCopy> = {
  "appt-moved": {
    newInformation: "The next visit or appointment timing may have shifted — confirm the exact date and time with your care team.",
    mayAffect: "Which records to bring and whether tests can finish before that visit.",
    needsConfirmation: "The official schedule in the portal or scheduler, any prep instructions, and whether the visit should move if results are not back yet.",
    askNext: "What is the confirmed appointment time, location, and check-in process?",
    revisedStep: "Save the updated time in one place and refresh your top three NCCN-aware questions for that visit.",
  },
  "mmr-pending": {
    newInformation: "MMR/MSI testing may still be pending — Anchor does not see your chart; confirm with your care team.",
    mayAffect: "The care team may need this result before explaining some options — wording and timing belong to your clinicians.",
    needsConfirmation: "Whether the test was ordered, when results are expected, and who will review them with you.",
    askNext: "Has MMR/MSI testing been ordered, and will the result change what we discuss next?",
    revisedStep: "Add this question to your visit list — still NCCN-aware prep; your care team decides what applies.",
  },
  "imaging-incomplete": {
    newInformation: "Imaging may still be incomplete — confirm what is scheduled and what is back.",
    mayAffect: "Stage and next-step discussions may stay limited until imaging is finished — interpretation belongs to your care team.",
    needsConfirmation: "Which scans are needed, when they are scheduled, and whether the appointment should still happen before results return.",
    askNext: "Which imaging results are still needed before the care team can explain the full plan?",
    revisedStep: "Bring current records and ask what is pending — not set in stone; update again when imaging lands.",
  },
  "path-final": {
    newInformation: "You heard the pathology report may be final — confirm completeness with your care team rather than assuming every addendum is in.",
    mayAffect: "How specific the team can be about staging and next discussion topics at the next touchpoint.",
    needsConfirmation: "Whether all pathology components and any addendum reports are done and reviewed.",
    askNext: "Is the pathology report complete, and does the team agree on what it means for next steps?",
    revisedStep: "Bring portal or printed copies of the final report to the visit and keep questions in plain language.",
  },
  "chemo-mentioned": {
    newInformation: "Chemotherapy was mentioned as a possible topic — not a confirmed plan from Anchor and not a treatment recommendation.",
    mayAffect: "It may help to ask what information your care team still needs before any treatment path is discussed.",
    needsConfirmation: "Whether chemo is on the table, why it was raised, and what alternatives or timing questions your oncologist wants you to understand.",
    askNext: "What information are you using to decide whether chemo is needed, and what is still pending?",
    revisedStep: "Write this as a neutral question for the oncologist — NCCN-aware prep; the care team chooses the path.",
  },
  "sibling-arrival": {
    newInformation: "Another family member may join soon — that can help with notes and questions.",
    mayAffect: "Who speaks for the patient and how updates are shared with the rest of the family.",
    needsConfirmation: "Visitor policies and who can attend in person or on the call.",
    askNext: "How can we add a family member to the portal or appointment communications?",
    revisedStep: "Decide who takes notes and who asks the top three questions — still based on what Anchor knows right now; confirm details with the team.",
  },
  "severe-symptoms": {
    newInformation: "There may be a new urgent symptom — this may need immediate medical guidance, not routine 72-hour planning.",
    mayAffect: "Whether to use the clinic after-hours line, on-call instructions, or emergency services instead of waiting on Anchor.",
    needsConfirmation: "Severity, timing, and whether the care team or emergency services should be contacted now.",
    askNext: "Given this symptom, should we call the clinic after-hours line or seek urgent or emergency care?",
    revisedStep: "If symptoms are severe or rapidly worsening, contact the care team’s urgent line or emergency services — Anchor does not triage.",
  },
  "insurance-records": {
    newInformation: "Your insurer may be asking for records — this is administrative and not a treatment decision from Anchor.",
    mayAffect: "Timing of authorizations or referrals your care team may need to support.",
    needsConfirmation: "Which documents the insurer listed, the deadline to submit them, and whether your clinic has a preferred process.",
    askNext: "Which records should we upload, and can your office help with the insurer’s checklist?",
    revisedStep: "Gather the requested documents, keep a copy of what you send, and loop your care team in if anything is unclear.",
  },
}

export function getDemoCaseDeltaFromChip(chipId: string): DemoCaseDeltaCopy | null {
  return DEMO_CHIP_NARRATIVES[chipId] ?? null
}

export function getDemoCaseDeltaFromCustomNote(note: string): DemoCaseDeltaCopy {
  const safe = note.trim().slice(0, 400)
  return {
    newInformation: safe.length > 0 ? safe : "You added a short note for this case.",
    mayAffect:
      "This may shift which questions matter most at the next visit — NCCN-aware prep still stays with your care team, not set in stone.",
    needsConfirmation: "How this detail fits what is already documented and what your doctor considers still pending.",
    askNext: "Given this update, what should we confirm at the next visit and what records do you need from us?",
    revisedStep: "Add this language to your question list and verify it with your care team — Anchor does not confirm stage or treatment.",
  }
}

/** Local-only adaptive plan rows (demo; persisted under anchor-demo-case-v1). */
export type AdaptivePlanTaskInitialStatus = "active" | "waiting" | "urgent"

export interface StoredAdaptivePlanTask {
  id: string
  title: string
  detail?: string
  initialStatus: AdaptivePlanTaskInitialStatus
  fromUpdate: boolean
  regretQuote?: string
  /** True when the row was added from the Records tab checklist or quick-add. */
  fromRecords?: boolean
  /** Stable key for dedupe (checklist id or quick-add id). */
  recordsChecklistId?: string
  /** True when the row was added from the Family coordination tab. */
  fromFamily?: boolean
  /** Stable key for dedupe (e.g. role:appointment-buddy). */
  familySupportRoleId?: string
}

/** Records tab (Prompt 8.5) — first-72-hour framing. */
export const RECORDS_PROTO_BADGE = "First 72 hours · prep only"

export const RECORDS_TAB_SUBTITLE =
  "In the first days after worrisome news, Anchor helps you see what you already have, what is still missing, and what to ask next — without treating this like a full patient portal."

export const RECORDS_THREE_THINGS_INTRO =
  "Start here. Three short checks keep the next visit from feeling like a scavenger hunt."

export const RECORDS_WHAT_CAN_CLARIFY_BULLETS = [
  "Records can help you list dates, test names, and what you were told — so you do not rely on memory alone in the visit.",
  "They can highlight gaps (missing imaging, pending biomarkers) you want the scheduler or nurse line to clarify.",
  "They support plain-language question prep — not a private interpretation of your chart.",
  "Only your care team diagnoses, stages, and recommends treatment; Anchor stays in the preparation lane.",
] as const

export interface RecordsChecklistItemDef {
  id: string
  title: string
  detail?: string
}

/** “What is missing” — each row can become an adaptive plan task with dedupe by id. */
export const RECORDS_MISSING_CHECKLIST_DEFS: RecordsChecklistItemDef[] = [
  {
    id: "path-final-copy",
    title: "Bring or upload the final pathology report (all pages, including addenda if any).",
    detail: "Ask the team which version is considered final — Anchor does not verify documents.",
  },
  {
    id: "imaging-summary",
    title: "Gather imaging summaries or discs your team requested (CT/MRI/PET as applicable).",
  },
  {
    id: "med-list",
    title: "Update a one-page medication list (name, dose, schedule, prescribers).",
  },
  {
    id: "labs-biomarkers",
    title: "Collect recent labs or biomarker/MMR/MSI reports if they were mentioned.",
    detail: "Confirm which tests are done versus pending with your clinicians.",
  },
  {
    id: "portal-thread",
    title: "Export or screenshot key portal messages about scheduling, instructions, or results.",
  },
  {
    id: "visit-synopsis",
    title: "Write a short visit synopsis: what you were told last time and what still feels unclear.",
  },
  {
    id: "insurance-packet",
    title: "Keep copies of insurance letters, authorization forms, or records requests your team mentioned.",
    detail: "Administrative only — confirm medical details with your clinicians.",
  },
]

export type RecordsDocStackStatus = "sample" | "missing" | "optional"

export interface RecordsDocumentStackDef {
  id: string
  label: string
  status: RecordsDocStackStatus
  body: string
  /** When set, “Add to checklist” creates this checklist task by id. */
  checklistId?: string
}

/** UI labels for document stack statuses (Prompt 8.5). */
export function recordsDocStackStatusLabel(status: RecordsDocStackStatus): string {
  switch (status) {
    case "sample":
      return "Have sample"
    case "missing":
      return "Need to find"
    case "optional":
      return "Optional later"
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

export const RECORDS_DOCUMENT_STACK_DEFS: RecordsDocumentStackDef[] = [
  {
    id: "pathology",
    label: "Pathology report",
    status: "sample",
    body: "The biopsy write-up your oncologist leans on — bring the full report, including addenda, when you have it.",
    checklistId: "path-final-copy",
  },
  {
    id: "imaging",
    label: "Imaging summaries or disc",
    status: "missing",
    body: "Radiology summaries (or disc instructions) your team names — ask which scans matter for the next conversation.",
    checklistId: "imaging-summary",
  },
  {
    id: "visit-summary",
    label: "Visit note or after-visit summary",
    status: "missing",
    body: "A short note of what you were told last time — not to replace the chart, but so you remember the wording you heard.",
    checklistId: "visit-synopsis",
  },
  {
    id: "portal-message",
    label: "Portal thread",
    status: "optional",
    body: "Screenshots or exports about timing, prep, or follow-up — handy if instructions lived only in the portal.",
    checklistId: "portal-thread",
  },
  {
    id: "insurance-letter",
    label: "Insurance packet",
    status: "optional",
    body: "Letters or authorization checklists if billing is already asking for paperwork — administrative, not medical advice.",
    checklistId: "insurance-packet",
  },
]

export const SAMPLE_PATHOLOGY_RECORD_LINES: { label: string; value: string }[] = [
  { label: "Specimen (sample)", value: "De-identified biopsy sample — not linked to a real person in this demo." },
  { label: "Procedure (sample)", value: "Excisional biopsy — wording is illustrative only." },
  { label: "Diagnosis line (sample)", value: "Malignant neoplasm, morphology and grade per report — exact wording belongs to your pathologist." },
  { label: "Key descriptors (sample)", value: "Margins, lymphovascular invasion, perineural invasion — ask what each line means for your case." },
  { label: "Addendum status (sample)", value: "Ask whether any addendum is expected or already on file — do not assume completeness from a screenshot." },
]

export const SAMPLE_PATHOLOGY_QUESTIONS: string[] = [
  "Is this pathology report considered final, including any addenda?",
  "Which parts of the report are still pending or awaiting outside review?",
  "How should we reconcile this wording with what we were told in plain language?",
  "What records or tests are still needed before staging or treatment discussions?",
  "Who should we contact if we receive updated pages after this visit?",
  "What symptoms or changes should we report before the next appointment?",
]

export const RECORDS_SECOND_OPINION_INTRO =
  "Second opinions can be useful when you want another center to review the same records. Anchor only helps you pack what to send — it does not choose where to go or what treatment fits."

export const RECORDS_SECOND_OPINION_CHECKLIST_LINES: string[] = [
  "Final pathology (full report, all pages)",
  "Imaging reports or disc instructions from radiology",
  "Operative or procedure notes if applicable",
  "Tumor board or multidisciplinary summary if available",
  "Medication list and allergy list",
  "Visit summaries that explain the current plan in plain language",
  "Contact information for records release at your current facility",
]

export const RECORDS_TRANSFER_CHECKLIST_BULLETS: string[] = [
  "Confirm the correct legal name and date of birth on every request form.",
  "Ask how long records release usually takes at your facility.",
  "Request both PDF and disc if your destination center specifies a format.",
  "Keep a dated list of what you requested and what you received.",
  "Follow up on missing pages (addenda, amended reports) before shipping.",
  "Never send Anchor screenshots as if they were official records — use your portal or records office.",
]

export const RECORDS_QUICK_ADD_TASK_DEFS: {
  id: string
  title: string
  detail?: string
  initialStatus: AdaptivePlanTaskInitialStatus
}[] = [
  {
    id: "call-records-desk",
    title: "Call the hospital records desk to confirm how to request a complete pathology packet.",
    initialStatus: "active",
  },
  {
    id: "portal-export",
    title: "Export or print portal visit summaries and key messages for the next appointment folder.",
    initialStatus: "active",
  },
  {
    id: "insurance-docs",
    title: "List what insurance asked for and confirm deadlines with the clinic if anything is unclear.",
    detail: "Administrative only — your care team confirms medical details.",
    initialStatus: "waiting",
  },
]

export function buildRecordsChecklistAdaptiveTask(item: RecordsChecklistItemDef): StoredAdaptivePlanTask {
  return {
    id: `records-checklist:${item.id}:${Date.now()}`,
    title: item.title,
    detail: item.detail,
    initialStatus: "active",
    fromUpdate: false,
    fromRecords: true,
    recordsChecklistId: `checklist:${item.id}`,
  }
}

export function buildRecordsQuickAdaptiveTask(
  def: (typeof RECORDS_QUICK_ADD_TASK_DEFS)[number],
): StoredAdaptivePlanTask {
  return {
    id: `records-quick:${def.id}:${Date.now()}`,
    title: def.title,
    detail: def.detail,
    initialStatus: def.initialStatus,
    fromUpdate: false,
    fromRecords: true,
    recordsChecklistId: `quick:${def.id}`,
  }
}

function adaptiveId(chipId: string, stamp: number, slot: string) {
  return `local:${chipId}:${stamp}:${slot}`
}

/** Deterministic tasks appended when the user applies a chip update (no API). */
export function buildAdaptiveTasksFromChip(chipId: string): StoredAdaptivePlanTask[] {
  const stamp = Date.now()
  const id = (slot: string) => adaptiveId(chipId, stamp, slot)
  switch (chipId) {
    case "appt-moved":
      return [
        {
          id: id("a"),
          title: "Confirm appointment time, location, portal check-in, and any prep instructions with your care team.",
          detail: "NCCN-aware prep — not set in stone until your team confirms.",
          initialStatus: "active",
          fromUpdate: true,
        },
      ]
    case "mmr-pending":
      return [
        {
          id: id("a"),
          title:
            "Ask whether MMR/MSI testing was ordered, when results are expected, and who will review them with you.",
          detail: "Biomarker status may affect what the care team can explain next — confirm with your team, not Anchor.",
          initialStatus: "active",
          fromUpdate: true,
        },
      ]
    case "imaging-incomplete":
      return [
        {
          id: id("w"),
          title: "Confirm which imaging results are still pending and whether the visit should still happen before they return.",
          detail: "Waiting on care team — interpretation belongs to your clinicians.",
          initialStatus: "waiting",
          fromUpdate: true,
        },
        {
          id: id("a"),
          title: "Bring the records you already have and ask what is still missing before the next touchpoint.",
          initialStatus: "active",
          fromUpdate: true,
        },
      ]
    case "path-final":
      return [
        {
          id: id("a1"),
          title: "Ask the care team to walk through the final pathology report in plain language.",
          initialStatus: "active",
          fromUpdate: true,
        },
        {
          id: id("a2"),
          title: "Ask what the report confirms today and what it still does not answer — confirm with your doctor.",
          initialStatus: "active",
          fromUpdate: true,
        },
      ]
    case "chemo-mentioned":
      return [
        {
          id: id("a"),
          title: "Ask what information the care team would use to decide whether chemo is needed — not a treatment recommendation from Anchor.",
          detail: "Chemo may be a discussion topic only; your oncologist decides.",
          initialStatus: "active",
          fromUpdate: true,
        },
        {
          id: id("w"),
          title: "Confirm whether chemo is only being discussed as a possibility or as part of a proposed plan you have not agreed to yet.",
          initialStatus: "waiting",
          fromUpdate: true,
        },
      ]
    case "sibling-arrival":
      return [
        {
          id: id("a"),
          title: "Decide what the sibling should handle next: driving, notes, records, food, or family updates.",
          initialStatus: "active",
          fromUpdate: true,
        },
      ]
    case "insurance-records":
      return [
        {
          id: id("a"),
          title: "Ask which exact records insurance needs, the deadline, and where they should be sent — confirm with your care team if unsure.",
          initialStatus: "active",
          fromUpdate: true,
        },
      ]
    case "severe-symptoms":
      return [
        {
          id: id("u"),
          title:
            "If symptoms are severe or rapidly worsening, contact the care team’s urgent line or emergency services — Anchor does not triage.",
          detail: "This is escalation guidance only, not a diagnosis.",
          initialStatus: "urgent",
          fromUpdate: true,
        },
      ]
    default:
      return []
  }
}

export function buildAdaptiveTasksFromCustomPlanNote(note: string): StoredAdaptivePlanTask[] {
  const stamp = Date.now()
  const safe = note.trim().slice(0, 400)
  return [
    {
      id: adaptiveId("custom", stamp, "0"),
      title: "Add this detail to your next-visit question list and ask the care team what it changes for timing, tests, or follow-up.",
      detail: safe ? `You noted: ${safe.slice(0, 140)}${safe.length > 140 ? "…" : ""}` : undefined,
      initialStatus: "active",
      fromUpdate: true,
    },
  ]
}

/** Ask tab — subtitle shown under “Ask Anchor” (local prep only, no outbound send). */
export const ASK_ANCHOR_SUBTITLE =
  "Case-aware follow-up prep on this device — questions and plain-language explanations to take to your care team. Nothing is sent from Anchor."

/** Ask tab quick chips (stable id + label). Clicks must key off `id`, not label text. */
export const FOLLOW_UP_CHIP_DEFS = [
  { id: "explain_simple", label: "Explain this simply" },
  { id: "ask_tomorrow", label: "What should I ask tomorrow?" },
  { id: "term_meaning", label: "What does this term mean?" },
  { id: "phone_script", label: "What should I say on the phone?" },
  { id: "what_changed", label: "What changed after the new information?" },
  { id: "urgent_vs_wait", label: "What is urgent and what can wait?" },
  { id: "family_summary", label: "Summarize this for my family" },
  { id: "write_down", label: "What should I write down?" },
  { id: "not_decide_yet", label: "What should I not decide yet?" },
] as const

export type FollowUpChipId = (typeof FOLLOW_UP_CHIP_DEFS)[number]["id"]

/** Persisted snapshots before Prompt 5.1 used hyphen ids — map when restoring. */
export const LEGACY_FOLLOW_UP_CHIP_ID_MAP: Record<string, FollowUpChipId> = {
  "explain-simply": "explain_simple",
  "ask-tomorrow": "ask_tomorrow",
  "term-mean": "term_meaning",
  "phone-words": "phone_script",
  "what-changed": "what_changed",
  "urgent-vs-wait": "urgent_vs_wait",
  "summarize-family": "family_summary",
  "write-down": "write_down",
  "not-decide-yet": "not_decide_yet",
}

export function normalizeFollowUpChipKind(kind: string): FollowUpChipId | "custom" | null {
  if (kind === "custom") return "custom"
  if (FOLLOW_UP_CHIP_DEFS.some((c) => c.id === kind)) return kind as FollowUpChipId
  const mapped = LEGACY_FOLLOW_UP_CHIP_ID_MAP[kind]
  return mapped ?? null
}

/** Family tab (Prompt 8.5). */
export const FAMILY_PROTO_BADGE = "Caregiver approves · nothing sent"

export const FAMILY_TAB_SUBTITLE =
  "Get help without explaining the whole medical story twice — ask for one concrete thing, copy language if it helps, and keep tasks local until you choose what to send."

export const FAMILY_SAFETY_FOOTER =
  "Anchor prepares family drafts and support tasks. It does not send messages, make decisions, or replace the care team. Use what fits your family and confirm medical details with clinicians."

export interface FamilySupportRoleCardDef {
  id: string
  roleTitle: string
  taskSummary: string
  askDraft: string
  /** One sentence: why this ask lowers overwhelm (Prompt 8.5). */
  whyThisHelps: string
}

/** Four primary “one concrete thing” cards (Prompt 8.5). */
export const FAMILY_PRIMARY_ASK_CARDS: FamilySupportRoleCardDef[] = [
  {
    id: "appointment-buddy",
    roleTitle: "Appointment buddy",
    taskSummary: "Listen for confirmed, pending, and next questions — capture key answers.",
    whyThisHelps:
      "You stay present in the room while someone else writes down what was confirmed, what is still pending, and what to ask next — not to replace doctor notes, but so nothing disappears on the drive home.",
    askDraft:
      "Can you help tomorrow by being the appointment note-taker? The most helpful thing would be writing down what is confirmed, what is still pending, and what we need to ask next.",
  },
  {
    id: "records-helper",
    roleTitle: "Records helper",
    taskSummary: "One pass to gather pathology, imaging summaries, portal threads, and meds in one folder.",
    whyThisHelps:
      "One person gathers papers once so the rest of the family is not duplicating calls or screenshots the night before.",
    askDraft:
      "Could you take one records pass — pathology, imaging summaries, key portal messages, and a medication list — so we have one folder before the visit? Nothing needs to be perfect, just collected.",
  },
  {
    id: "driver-logistics",
    roleTitle: "Driver / logistics",
    taskSummary: "Parking, timing, snacks, and getting there — so the caregiver can focus on listening.",
    whyThisHelps:
      "Removing parking and timing stress is a real form of care; it keeps bandwidth free for the conversation inside.",
    askDraft:
      "Can you own tomorrow’s logistics — drive or rideshare, parking, timing, and making sure we have water/snacks? That frees us to focus on the conversation in the room.",
  },
  {
    id: "patient-comfort",
    roleTitle: "Comfort support",
    taskSummary: "Meals, rest, small errands, and steady check-ins — no medical decisions needed.",
    whyThisHelps:
      "Concrete comfort tasks prevent everyone from hovering with the same anxious question — one person owns warmth and basics.",
    askDraft:
      "Can you help with comfort support — meals, rest, small errands, and checking in emotionally? No medical decisions needed; just steady presence.",
  },
]

/** Collapsible “more ways” — insurance, meals, relatives, portal, transport (Prompt 8.5). */
export const FAMILY_MORE_HELP_ROLE_CARDS: FamilySupportRoleCardDef[] = [
  {
    id: "insurance-caller",
    roleTitle: "Insurance caller",
    taskSummary: "One call to clarify which records go where and any deadline.",
    whyThisHelps:
      "Insurance questions are repetitive; one focused caller keeps the rest of the family out of hold music.",
    askDraft:
      "Would you be willing to call insurance once and ask exactly which records they need, where to send them, any deadline, and a reference number? We’ll loop the care team if anything is unclear.",
  },
  {
    id: "meals-organizer",
    roleTitle: "Meals organizer",
    taskSummary: "Coordinate a few meals or groceries without turning it into a group project.",
    whyThisHelps:
      "Food is practical love — a single coordinator avoids five casseroles on the same day.",
    askDraft:
      "Could you own meals for a few days — simple groceries or a meal train link — so we are not managing a dozen offers at once?",
  },
  {
    id: "family-updater",
    roleTitle: "Relatives update",
    taskSummary: "One calm message after facts are confirmed — edit in your own words.",
    whyThisHelps:
      "One updater stops the group chat from becoming a second triage line while results are still pending.",
    askDraft:
      "When we’re ready, could you send one short update to relatives — calm, factual, and only after we’ve heard from the care team? We’ll share a draft you can edit in your own words.",
  },
  {
    id: "portal-helper",
    roleTitle: "Portal / paperwork buddy",
    taskSummary: "Logins, downloads, and printing the few pages we actually need.",
    whyThisHelps:
      "Portals are fiddly; a second pair of eyes reduces last-minute password panic.",
    askDraft:
      "Can you be the portal buddy for a bit — logins, downloading visit summaries, and printing the few pages we need for the appointment?",
  },
  {
    id: "transport-liaison",
    roleTitle: "Transport for follow-up",
    taskSummary: "Rides for scans, labs, or return visits after the first appointment.",
    whyThisHelps:
      "Follow-up rides are easy to forget until the day-of; naming one person prevents missed appointments later.",
    askDraft:
      "Would you own rides for the next couple of visits — scans, labs, or treatment days — and text us the night before to confirm timing?",
  },
]

export function buildFamilySupportAdaptiveTask(card: FamilySupportRoleCardDef): StoredAdaptivePlanTask {
  return {
    id: `family-role:${card.id}`,
    title: `${card.roleTitle}: ${card.taskSummary}`,
    detail: "Prototype coordination — your care team confirms medical details. Nothing sent from Anchor.",
    initialStatus: "active",
    fromUpdate: false,
    fromFamily: true,
    familySupportRoleId: `role:${card.id}`,
  }
}

export interface FamilyCoordBoardRow {
  id: string
  title: string
  owner: "none" | "sibling" | "family-member"
  done: boolean
}

export const FAMILY_BOARD_ROW_DEFS: { id: string; title: string }[] = [
  { id: "appt-notes", title: "Appointment notes" },
  { id: "records-gather", title: "Records gathering" },
  { id: "driving", title: "Driving / logistics" },
  { id: "insurance-call", title: "Insurance call" },
  { id: "family-update", title: "Family update" },
  { id: "meals-support", title: "Meals / support" },
  { id: "portal-access", title: "Portal login / records access" },
]

export function createDefaultFamilyCoordBoard(): FamilyCoordBoardRow[] {
  return FAMILY_BOARD_ROW_DEFS.map((d) => ({ ...d, owner: "none", done: false }))
}

export const FAMILY_UPDATE_DRAFT_CALM =
  "Quick update: we are still confirming details with the care team. Some reports or results may still be pending. The most helpful thing right now is preparing for the appointment, gathering records, and not assuming a treatment plan until the doctors explain it."

export const FAMILY_UPDATE_DRAFT_DETAIL =
  "We have an appointment coming up and are organizing the key questions. Right now, we are trying to clarify what is confirmed, what is still pending, which records are needed, and what decisions, if any, will be discussed next. We will share more once the care team explains the plan."

export const FAMILY_UPDATE_DRAFT_HELP =
  "If you want to help, the best thing is to take one concrete task: notes during the appointment, driving, gathering records, food, insurance calls, or updating relatives after we know more."

export interface FamilyExplainCardDef {
  id: string
  label: string
  body: string
}

export const FAMILY_EXPLAIN_CARDS: FamilyExplainCardDef[] = [
  {
    id: "adult-child",
    label: "Adult child",
    body: "You may feel like you have to become the operator overnight. Focus on what can be confirmed, what is pending, and who can help with one concrete job.",
  },
  {
    id: "spouse",
    label: "Spouse / partner",
    body: "Your role may be emotional support and decision support. Write questions down and make space for the patient’s preferences.",
  },
  {
    id: "sibling",
    label: "Sibling",
    body: "The most helpful thing is not asking for constant updates. Take one job: notes, records, driving, food, or insurance.",
  },
  {
    id: "distant",
    label: "Distant relative",
    body: "Keep updates simple. Do not pressure the family for details before facts are confirmed.",
  },
  {
    id: "younger",
    label: "Younger family member",
    body: "The doctors are helping, and the grown-ups are making a plan. You can help by being kind and patient.",
  },
]

export const FAMILY_HELPS_LINES: string[] = [
  "What is one thing I can take off your plate?",
  "Do you want me to take notes tomorrow?",
  "I can gather records or drive.",
  "I can update relatives after the appointment.",
  "I’m here, and I’ll wait for confirmed information.",
]

export const FAMILY_AVOID_PRESSURE_LINES: string[] = [
  "“I read online that…”",
  "“You need to go to this hospital immediately.”",
  "“Are you sure the doctors are right?”",
  "Asking “What stage is it?” before the family knows",
  "“Everything happens for a reason.”",
  "Pressuring for constant updates",
]

/** Guided cockpit (Prompt 8.6C) — consent line near Today / Saved. */
export const COCKPIT_LOCAL_CONSENT_LINE =
  "Add details only if you want Anchor to keep them in this local demo case. Start over clears it."

/** Stable id for “visit prep” task from Today guided prep (dedupe in UI). */
export const GUIDED_VISIT_PREP_TASK_ID = "local:guided-visit-prep"

export function buildGuidedVisitPrepTask(): StoredAdaptivePlanTask {
  return {
    id: GUIDED_VISIT_PREP_TASK_ID,
    title: "Visit prep: confirm what is known, what is pending, and what decisions are next",
    detail: "Added from Today guided prep — not sent from Anchor.",
    initialStatus: "active",
    fromUpdate: false,
  }
}

export const COCKPIT_WHY_NOT_CHATBOT_TITLE = "Why Anchor is not just another answer box"

export const COCKPIT_WHY_NOT_CHATBOT_BODY =
  "Chatbots answer a question. Anchor keeps the caregiving thread: concern → what is known → what is pending → exact words → living plan → saved updates."

export const VISIT_PREP_PANEL_TITLE = "Prepare for the next visit or call"

export const VISIT_PREP_PANEL_SUBTITLE = "Use this to get clear answers, not perfect notes."

/** @deprecated Use VISIT_PREP_PANEL_TITLE — kept for gradual migration */
export const VISIT_GUIDE_TITLE = VISIT_PREP_PANEL_TITLE

/** @deprecated Use VISIT_PREP_PANEL_SUBTITLE */
export const VISIT_GUIDE_PURPOSE = VISIT_PREP_PANEL_SUBTITLE

export const VISIT_GUIDE_OPEN_LINE =
  "Can we begin by confirming what is known, what is still pending, and what decisions actually need to be made next?"

export const VISIT_PREP_TOP_QUESTIONS: string[] = [
  "What is confirmed right now?",
  "What is still pending?",
  "Which records or results should we bring or upload?",
  "What decision, if any, is expected next?",
  "Who should we contact after the visit?",
]

export const VISIT_PREP_WHAT_TO_BRING: string[] = [
  "Pathology or report notes if available",
  "Imaging summaries if available",
  "Medication list",
  "Portal messages or appointment details",
  "Top 3 family questions",
]

export const VISIT_GUIDE_LISTEN_FOR: string[] = [...VISIT_PREP_TOP_QUESTIONS]

export const VISIT_GUIDE_IF_CONFUSED: string[] = [
  "Can you say that in plain language?",
  "Is this confirmed, or are we waiting on another result?",
  "What should we do before the next appointment?",
]

export const VISIT_GUIDE_END_LINE = "Can we repeat back what we heard to make sure we understood correctly?"

export const VISIT_GUIDE_AFTER_VISIT: string[] = [
  "Add what changed into Anchor",
  "Update the 72-hour plan",
  "Save the top 3 answers",
]

export const VISIT_GUIDE_VISIT_NOTES_HINT =
  "Visit notes may come later from the clinic. This is about not missing the key answers in the moment."

export function buildVisitGuideClipboardBlock(): string {
  return [
    "ANCHOR — VISIT PREP SCRIPT (LOCAL DEMO)",
    "NCCN-aware preparation only. Your care team decides what applies. Not diagnosis, treatment recommendation, stage confirmation, or emergency assessment. Nothing sent automatically.",
    "",
    "START WITH THIS",
    VISIT_GUIDE_OPEN_LINE,
    "",
    "TOP QUESTIONS",
    ...VISIT_PREP_TOP_QUESTIONS.map((l) => `• ${l}`),
    "",
    "WHAT TO BRING",
    ...VISIT_PREP_WHAT_TO_BRING.map((l) => `• ${l}`),
    "",
    "IF CONFUSED, SAY",
    ...VISIT_GUIDE_IF_CONFUSED.map((l) => `• ${l}`),
    "",
    "END WITH",
    VISIT_GUIDE_END_LINE,
    "",
    "AFTER THE VISIT",
    ...VISIT_GUIDE_AFTER_VISIT.map((l) => `• ${l}`),
    "",
    "— Copied from Anchor prototype. Nothing was sent by Anchor.",
  ].join("\n")
}

export type LastHeroFlowUsed = "visit" | "document" | "insurance"

export const HERO_VISIT_PLAN_IDS = {
  opener: "local:hero-visit-opener",
  records: "local:hero-visit-bring-records",
  after: "local:hero-visit-after-update",
} as const

export function buildHeroVisitPrepPlanTasks(): StoredAdaptivePlanTask[] {
  return [
    {
      id: HERO_VISIT_PLAN_IDS.opener,
      title: "Use visit opener",
      detail: "From Today visit prep — say it in your own words; not sent from Anchor.",
      initialStatus: "active",
      fromUpdate: false,
    },
    {
      id: HERO_VISIT_PLAN_IDS.records,
      title: "Bring current records",
      detail: "Pathology notes, imaging summaries, med list, portal threads — your team confirms what they need.",
      initialStatus: "active",
      fromUpdate: false,
    },
    {
      id: HERO_VISIT_PLAN_IDS.after,
      title: "After visit: add what changed",
      detail: "Update Anchor and the 72-hour plan when you know more — local demo memory only.",
      initialStatus: "active",
      fromUpdate: false,
    },
  ]
}

export const HERO_DOCUMENT_PLAN_IDS = {
  confirm: "local:hero-doc-confirm",
  pending: "local:hero-doc-pending",
  bring: "local:hero-doc-bring",
  imaging: "local:hero-doc-imaging-decisions",
} as const

export const DOCUMENT_GUIDE_PLAN_BADGE = "Added from document guide"

export const DOCUMENT_AGENT_BOUNDARY_LINE =
  "Anchor turns documents into questions. It does not diagnose, confirm stage, choose treatment, or interpret the report as medical advice."

export const DOCUMENT_SAMPLE_DISCLAIMER = "Sample only · de-identified · not a real patient record."

export const DOCUMENT_PASTE_DISCLAIMER = "Use de-identified text in this prototype."

/** Sample “Document Agent” — what the record may help you organize (not medical facts). */
export const DOCUMENT_AGENT_SAMPLE_CLARIFY_BULLETS: string[] = [
  "Diagnosis wording",
  "What is final vs pending",
  "Whether addenda or tests are missing",
  "Whether staging depends on pathology, imaging, or both",
  "What records to bring or upload",
]

export const DOCUMENT_AGENT_SAMPLE_CANNOT_CONFIRM_BULLETS: string[] = [
  "Stage",
  "Treatment choice",
  "Whether chemo is needed",
  "Whether the report is complete",
  "Medical meaning without the care team",
]

export const DOCUMENT_AGENT_SAMPLE_CARE_TEAM_QUESTIONS: string[] = [
  "Can you walk us through this report in plain language?",
  "What does this report confirm?",
  "What does it not answer yet?",
  "Are any addenda, biomarkers, MMR/MSI, or other tests pending?",
  "Does staging depend on imaging, pathology, or both?",
  "What should we bring or upload before the next visit?",
]

export const DOCUMENT_AGENT_SAMPLE_MISSING_CHECKLIST: string[] = [
  "Full pathology report",
  "Addenda",
  "Imaging summaries",
  "Visit note",
  "Medication list",
  "Portal instructions",
  "Care-team contact",
]

export type DocumentPasteKind = "pathology" | "imaging" | "biomarker" | "insurance" | "front_desk" | "generic"

export type DocumentReportChipId =
  | "pathology"
  | "imaging"
  | "biomarker"
  | "portal"
  | "referral_auth"
  | "insurance_letter"

export interface DocumentReportChipDef {
  id: DocumentReportChipId
  label: string
  questions: string[]
}

export const DOCUMENT_REPORT_CHIP_DEFS: DocumentReportChipDef[] = [
  {
    id: "pathology",
    label: "Pathology report",
    questions: [
      "What does this report confirm?",
      "What is still pending?",
      "Are there addenda?",
      "Does this affect staging, or do we need imaging too?",
      "Who reviews this with us?",
    ],
  },
  {
    id: "imaging",
    label: "Imaging summary",
    questions: [
      "Which scans are complete?",
      "Which results are still pending?",
      "Does the next visit depend on these results?",
      "Do we need image files or only summaries?",
    ],
  },
  {
    id: "biomarker",
    label: "Biomarker / MMR / MSI",
    questions: [
      "Was this testing ordered?",
      "Is it pending or final?",
      "Who reviews it with us?",
      "Does it affect what the care team can explain next?",
    ],
  },
  {
    id: "portal",
    label: "Portal message",
    questions: [
      "What action is being requested?",
      "Is this informational or urgent?",
      "Who should we reply to?",
      "What should we bring or upload?",
    ],
  },
  {
    id: "referral_auth",
    label: "Referral / authorization",
    questions: [
      "Is a referral required?",
      "Who submits it?",
      "What information is missing?",
      "What is the reference number?",
    ],
  },
  {
    id: "insurance_letter",
    label: "Insurance letter",
    questions: [
      "What exactly is being requested or denied?",
      "What documents are needed?",
      "Where should they be sent?",
      "What is the deadline?",
      "Who can confirm receipt?",
    ],
  },
]

export interface DocumentPasteOutput {
  kind: DocumentPasteKind
  about: string
  ask: string[]
  notAssume: string[]
  nextTask: string
}

const RX_INSURANCE = /\b(denied|denial|precert|pre-?cert|prior\s*auth|authorization|coverage|insurer|insurance)\b/i
const RX_BIOMARKER = /\b(mmr|msi|biomarker|cea|kras|braf|her2|pd-?l1)\b/i
const RX_PATH = /\b(pathology|biopsy|specimen|margin|lymph\s*nodes?|lymph\s*node|tumor\s*board)\b/i
const RX_IMAGING = /\b(ct\b|mri|pet\b|pet-?ct|scan|imaging|radiology|ultrasound)\b/i
const RX_FRONT = /\b(appointment|scheduler|scheduling|referral|front\s*desk|check-?in)\b/i

export function classifyDocumentPasteText(raw: string): DocumentPasteKind {
  const t = raw.trim().toLowerCase()
  if (!t) return "generic"
  if (RX_INSURANCE.test(t)) return "insurance"
  if (RX_BIOMARKER.test(t)) return "biomarker"
  if (RX_PATH.test(t)) return "pathology"
  if (RX_IMAGING.test(t)) return "imaging"
  if (RX_FRONT.test(t)) return "front_desk"
  return "generic"
}

export function buildDocumentPasteOutput(kind: DocumentPasteKind): DocumentPasteOutput {
  const baseNot = [
    "Anchor is not confirming stage, treatment, or completeness from this snippet.",
    "Your care team interprets the record.",
  ]
  switch (kind) {
    case "pathology":
      return {
        kind,
        about: "This may be about a pathology or biopsy report — wording and completeness still belong to your pathologist and oncology team.",
        ask: [
          "Is this report considered final, including any addenda?",
          "What does this wording confirm today, and what is still pending?",
          "Are biomarker or MMR/MSI results still outstanding?",
          "Does staging depend on pathology alone, or imaging too?",
        ],
        notAssume: [...baseNot, "Do not assume margins, nodes, or grade tell the whole plan without your team’s review."],
        nextTask: "Bring or upload the full pathology packet (all pages) and ask which version is on file.",
      }
    case "imaging":
      return {
        kind,
        about: "This may be about imaging or scan results — radiology interpretation belongs to your care team.",
        ask: [
          "Which scans are done vs still scheduled?",
          "Which reports are final vs preliminary?",
          "Does the next visit depend on these results?",
        ],
        notAssume: [...baseNot, "Do not assume stage or treatment from a partial imaging line without clinician review."],
        nextTask: "Gather imaging summaries (or follow your team’s instructions for discs/links) and confirm what they want before the visit.",
      }
    case "biomarker":
      return {
        kind,
        about: "This may be about biomarker, MMR/MSI, or related testing — what is ordered and what is back is a chart question.",
        ask: [
          "Was this testing ordered, and is it pending or final?",
          "Who reviews the result with us, and when?",
          "What decisions, if any, wait on this result?",
        ],
        notAssume: [...baseNot, "Do not assume a biomarker line implies a specific treatment path."],
        nextTask: "Ask for the official result location (portal vs letter) and add a reminder to your visit question list.",
      }
    case "insurance":
      return {
        kind,
        about: "This may be about insurance, authorization, coverage, or a denial letter — administrative, not a medical interpretation.",
        ask: [
          "What exactly is being requested or denied?",
          "What documents are needed, where should they go, and what is the deadline?",
          "Is a referral or authorization required before care can move forward?",
          "What reference or case number should we write down?",
        ],
        notAssume: [...baseNot, "Do not assume the denial wording means the medical plan is final — confirm with your team."],
        nextTask: "Start the insurer’s checklist and loop your clinic if any requested item is unclear.",
      }
    case "front_desk":
      return {
        kind,
        about: "This may be about scheduling, referrals, or front-desk logistics — confirm names, times, and requirements with the clinic.",
        ask: [
          "What appointment or referral action is needed next?",
          "What records should we bring or upload before check-in?",
          "Who should we contact if instructions change?",
        ],
        notAssume: [...baseNot, "Do not assume a scheduler message replaces medical instructions from your clinician."],
        nextTask: "Save portal or call details in one place and confirm the time and location before you travel.",
      }
    default:
      return {
        kind: "generic",
        about: "This snippet may mix topics — use it as a reminder to ask what is confirmed vs still pending.",
        ask: [
          "What is confirmed right now from your perspective?",
          "What is still pending or awaiting another report?",
          "What should we bring or upload before the next touchpoint?",
        ],
        notAssume: [...baseNot, "Do not assume a single phrase captures the full plan."],
        nextTask: "Add one plain-language question to your visit list and verify it with your care team.",
      }
  }
}

export function buildDocumentPasteClipboardBlock(out: DocumentPasteOutput): string {
  return [
    "ANCHOR — DOCUMENT AGENT (PASTED TEXT · LOCAL DEMO)",
    DOCUMENT_PASTE_DISCLAIMER,
    DOCUMENT_AGENT_BOUNDARY_LINE,
    "",
    "WHAT THIS MAY BE ABOUT",
    out.about,
    "",
    "WHAT TO ASK",
    ...out.ask.map((l) => `• ${l}`),
    "",
    "WHAT NOT TO ASSUME",
    ...out.notAssume.map((l) => `• ${l}`),
    "",
    "SUGGESTED NEXT TASK",
    out.nextTask,
    "",
    "— Copied from Anchor prototype. Nothing was sent by Anchor.",
  ].join("\n")
}

export function buildDocumentChipClipboardBlock(chip: DocumentReportChipDef): string {
  return [
    "ANCHOR — REPORT-TYPE QUESTIONS (LOCAL DEMO)",
    DOCUMENT_AGENT_BOUNDARY_LINE,
    "",
    chip.label.toUpperCase(),
    ...chip.questions.map((l) => `• ${l}`),
    "",
    "— Copied from Anchor prototype. Nothing was sent by Anchor.",
  ].join("\n")
}

export function buildDocumentAgentMissingChecklistBlock(): string {
  return [
    "ANCHOR — MISSING PIECES CHECKLIST (LOCAL DEMO)",
    DOCUMENT_SAMPLE_DISCLAIMER,
    DOCUMENT_AGENT_BOUNDARY_LINE,
    "",
    "MISSING PIECES TO ASK ABOUT / GATHER",
    ...DOCUMENT_AGENT_SAMPLE_MISSING_CHECKLIST.map((l) => `• ${l}`),
    "",
    "— Copied from Anchor prototype. Nothing was sent by Anchor.",
  ].join("\n")
}

export function buildHeroDocumentGuidePlanTasks(): StoredAdaptivePlanTask[] {
  const badge = DOCUMENT_GUIDE_PLAN_BADGE
  return [
    {
      id: HERO_DOCUMENT_PLAN_IDS.confirm,
      title: "Ask what this document confirms.",
      detail: `${badge} — care team interprets; not a diagnosis from Anchor.`,
      initialStatus: "active",
      fromUpdate: false,
    },
    {
      id: HERO_DOCUMENT_PLAN_IDS.pending,
      title: "Ask what is still pending.",
      detail: `${badge} — addenda, tests, or staging inputs may still be in progress.`,
      initialStatus: "active",
      fromUpdate: false,
    },
    {
      id: HERO_DOCUMENT_PLAN_IDS.bring,
      title: "Bring the full report/addenda.",
      detail: `${badge} — ask which version is considered final; Anchor does not verify documents.`,
      initialStatus: "active",
      fromUpdate: false,
    },
    {
      id: HERO_DOCUMENT_PLAN_IDS.imaging,
      title: "Ask whether imaging or other results are needed before decisions.",
      detail: `${badge} — staging and next steps belong to your clinicians.`,
      initialStatus: "active",
      fromUpdate: false,
    },
  ]
}

export const HERO_INSURANCE_PLAN_IDS = {
  call: "local:hero-ins-call",
  ref: "local:hero-ins-reference",
  records: "local:hero-ins-records",
  follow: "local:hero-ins-followup",
  careTeam: "local:hero-ins-careteam",
} as const

export const INSURANCE_AGENT_PLAN_BADGE = "Added from insurance agent"

/** Shown on every Insurance / Denial / Records Agent output. */
export const INSURANCE_AGENT_BOUNDARY_PRIMARY =
  "Anchor prepares questions, scripts, and drafts. It does not file appeals, contact insurance, send messages, make calls, or guarantee approval."

export const INSURANCE_AGENT_BOUNDARY_CONFIRM =
  "Confirm insurance and medical decisions with the insurer, care team, or appropriate office."

export const INSURANCE_AGENT_PASTE_DISCLAIMER = "Use de-identified text in this prototype."

export type InsuranceDenialClass =
  | "denial_prior_auth"
  | "missing_documentation"
  | "coverage_network"
  | "referral_auth_requirement"
  | "generic"

export function classifyInsuranceDenialPaste(raw: string): InsuranceDenialClass {
  const t = raw.trim().toLowerCase()
  if (!t) return "generic"
  if (
    /\b(denied|denial|not\s+approved|not approved|prior\s*auth|pre-?authorization|preauthorization|precert|pre-?cert)\b/i.test(t)
  ) {
    return "denial_prior_auth"
  }
  if (/\b(out of network|in-?network|benefit|coverage)\b/i.test(t)) return "coverage_network"
  if (/\b(missing information|missing\s+documentation|records needed|documentation needed|documentation|information needed)\b/i.test(t)) {
    return "missing_documentation"
  }
  if (/\breferral required\b|\bauthorization required\b/i.test(t)) return "referral_auth_requirement"
  if (/\b(insurance|insurer|authorization|appeal|claim|portal)\b/i.test(t)) return "generic"
  return "generic"
}

export const INSURANCE_DENIAL_WHAT_TO_ASK_BULLETS: string[] = [
  "What exactly is missing?",
  "Is this a denial, a pending authorization, or a request for more documentation?",
  "What records are needed?",
  "Is there a reference or case number?",
  "Is there a deadline?",
  "Who can submit the missing information?",
  "Who should we follow up with?",
]

export const INSURANCE_DENIAL_PHONE_SCRIPT_COMBINED = [
  "Hi, I'm calling about a cancer-care insurance or authorization issue for my family member. Can you help me understand whether this is a denial, a pending authorization, or a request for more documentation?",
  "Can you tell me exactly what is missing, where it should be sent, the deadline, and the reference number?",
].join("\n\n")

export const INSURANCE_DENIAL_APPEAL_DRAFT_TITLE = "Draft appeal / portal message"

export const INSURANCE_DENIAL_APPEAL_DRAFT_BODY =
  "Hello, I'm writing about the recent insurance or authorization issue. We are trying to understand what information is missing and what is needed for review. Could you please confirm the reason for the denial or delay, the records required, the deadline, and where the care team or family should send supporting documentation?"

export const INSURANCE_DENIAL_WRITE_DOWN_BULLETS: string[] = [
  "Person spoken to",
  "Reference/case number",
  "Denial or authorization status",
  "Exact records needed",
  "Deadline",
  "Where to send documents",
  "Who follows up next",
]

export interface InsuranceDenialAgentOutput {
  kind: InsuranceDenialClass
  probablyMeans: string[]
}

export function buildInsuranceDenialAgentOutput(kind: InsuranceDenialClass): InsuranceDenialAgentOutput {
  const intro =
    "This looks like an insurance or authorization issue, not a medical decision from Anchor."
  const base: Record<InsuranceDenialClass, string[]> = {
    denial_prior_auth: [
      intro,
      "The request may not be approved yet, or the insurer may be asking for clarification before they continue review.",
      "There may be a prior authorization or documentation step before the next covered step.",
    ],
    missing_documentation: [
      intro,
      "Insurance may be asking for more documentation before they can process the request.",
      "The next action may be gathering and sending specific records by a stated channel.",
    ],
    coverage_network: [
      intro,
      "There may be a coverage, benefit, or network question that needs clarification with the insurer.",
      "This does not tell you the final medical plan — your care team and insurer both play a role.",
    ],
    referral_auth_requirement: [
      intro,
      "There may be a referral, authorization, or coverage step blocking the next scheduling or treatment action.",
      "Ask who submits each piece and what the clinic expects on file before moving forward.",
    ],
    generic: [
      intro,
      "The excerpt may point to an administrative hold — denial, pending authorization, missing records, or a combination.",
      "Treat the next step as a fact-finding call or message you draft and send yourself after review.",
    ],
  }
  return { kind, probablyMeans: base[kind] }
}

export function buildInsuranceDenialPhoneScriptClipboard(): string {
  return [
    "ANCHOR — INSURANCE / DENIAL PHONE SCRIPT (LOCAL DEMO)",
    INSURANCE_AGENT_PASTE_DISCLAIMER,
    INSURANCE_AGENT_BOUNDARY_PRIMARY,
    INSURANCE_AGENT_BOUNDARY_CONFIRM,
    "",
    "PHONE SCRIPT",
    INSURANCE_DENIAL_PHONE_SCRIPT_COMBINED,
    "",
    "— Copied from Anchor prototype. Nothing was sent by Anchor.",
  ].join("\n")
}

export function buildInsuranceDenialAppealDraftClipboard(): string {
  return [
    "ANCHOR — DRAFT APPEAL / PORTAL MESSAGE (LOCAL DEMO)",
    INSURANCE_AGENT_PASTE_DISCLAIMER,
    INSURANCE_AGENT_BOUNDARY_PRIMARY,
    INSURANCE_AGENT_BOUNDARY_CONFIRM,
    "",
    INSURANCE_DENIAL_APPEAL_DRAFT_TITLE.toUpperCase(),
    INSURANCE_DENIAL_APPEAL_DRAFT_BODY,
    "",
    "Review before sending. Anchor does not send this.",
    "This is a draft, not a filed appeal.",
    "",
    "— Copied from Anchor prototype. Nothing was sent by Anchor.",
  ].join("\n")
}

export const INSURANCE_RECORDS_REQUEST_PURPOSE =
  "Find out exactly which records are needed and where they should go."

export const INSURANCE_RECORDS_REQUEST_SCRIPT =
  "Can you tell me which exact records are needed, where they should be sent, whether there is a deadline, and how we confirm they were received?"

export const INSURANCE_RECORDS_REQUEST_WHAT_TO_ASK: string[] = [
  "Which exact documents are on the checklist?",
  "Should we upload, fax, mail, or hand-deliver?",
  "Is there a deadline tied to authorization or scheduling?",
  "How do we confirm receipt?",
]

export const INSURANCE_RECORDS_CHECKLIST_AGENT: string[] = [
  "Pathology report",
  "Imaging summaries",
  "Image files, discs, or links if needed",
  "Visit notes",
  "Medication list",
  "Referral or authorization information",
  "Insurance letter or case number",
]

export function buildInsuranceRecordsRequestClipboardBlock(): string {
  return [
    "ANCHOR — RECORDS REQUEST (INSURANCE AGENT · LOCAL DEMO)",
    INSURANCE_AGENT_BOUNDARY_PRIMARY,
    INSURANCE_AGENT_BOUNDARY_CONFIRM,
    "",
    "PURPOSE",
    INSURANCE_RECORDS_REQUEST_PURPOSE,
    "",
    "WHAT TO ASK",
    ...INSURANCE_RECORDS_REQUEST_WHAT_TO_ASK.map((l) => `• ${l}`),
    "",
    "SCRIPT",
    INSURANCE_RECORDS_REQUEST_SCRIPT,
    "",
    "RECORDS CHECKLIST",
    ...INSURANCE_RECORDS_CHECKLIST_AGENT.map((l) => `• ${l}`),
    "",
    "— Copied from Anchor prototype. Nothing was sent by Anchor.",
  ].join("\n")
}

export const INSURANCE_SCHEDULING_BLOCKER_MAY_BE: string[] = [
  "Referral required",
  "Authorization required",
  "Missing records",
  "Pending review",
  "Wrong department",
  "Appointment type unclear",
]

export const INSURANCE_SCHEDULING_BLOCKER_SCRIPT =
  "Can you help me understand what is blocking scheduling right now: referral, authorization, missing records, or something else?"

export const INSURANCE_SCHEDULING_WHAT_TO_GET: string[] = [
  "Blocker type",
  "Who owns it",
  "What is needed",
  "Deadline",
  "Next follow-up step",
]

export function buildInsuranceSchedulingBlockerClipboardBlock(): string {
  return [
    "ANCHOR — REFERRAL / SCHEDULING BLOCKER (LOCAL DEMO)",
    INSURANCE_AGENT_BOUNDARY_PRIMARY,
    INSURANCE_AGENT_BOUNDARY_CONFIRM,
    "",
    "A · WHAT MIGHT BE BLOCKING THIS",
    ...INSURANCE_SCHEDULING_BLOCKER_MAY_BE.map((l) => `• ${l}`),
    "",
    "B · WHAT TO SAY",
    INSURANCE_SCHEDULING_BLOCKER_SCRIPT,
    "",
    "C · WHAT TO GET",
    ...INSURANCE_SCHEDULING_WHAT_TO_GET.map((l) => `• ${l}`),
    "",
    "— Copied from Anchor prototype. Nothing was sent by Anchor.",
  ].join("\n")
}

export const INSURANCE_AGENT_FRONT_DESK_PURPOSE =
  "Sound organized when calling a scheduler, front desk, records office, or insurer."

export function buildInsuranceAgentFrontDeskClipboardBlock(): string {
  return [
    "ANCHOR — FRONT-DESK BRIEF (INSURANCE AGENT · LOCAL DEMO)",
    INSURANCE_AGENT_BOUNDARY_PRIMARY,
    INSURANCE_AGENT_BOUNDARY_CONFIRM,
    "",
    "PURPOSE",
    INSURANCE_AGENT_FRONT_DESK_PURPOSE,
    "",
    "BRIEF",
    FRONT_DESK_BRIEF_SCRIPT,
    "",
    "FIELDS TO CAPTURE AFTER THE CALL",
    ...FRONT_DESK_BRIEF_FIELD_LIST.map((l) => `• ${l}`),
    "",
    "— Copied from Anchor prototype. Anchor did not place a call or send a message.",
  ].join("\n")
}

export function buildHeroInsuranceIssuePlanTasks(): StoredAdaptivePlanTask[] {
  const b = INSURANCE_AGENT_PLAN_BADGE
  return [
    {
      id: HERO_INSURANCE_PLAN_IDS.call,
      title: "Call insurer or records office about status",
      detail: `${b} — you place the call; Anchor does not dial or send anything.`,
      initialStatus: "active",
      fromUpdate: false,
    },
    {
      id: HERO_INSURANCE_PLAN_IDS.ref,
      title: "Write down reference number and deadline",
      detail: `${b} — capture numbers, dates, and who to call back.`,
      initialStatus: "active",
      fromUpdate: false,
    },
    {
      id: HERO_INSURANCE_PLAN_IDS.records,
      title: "Send or request missing records",
      detail: `${b} — administrative only; your care team confirms medical content.`,
      initialStatus: "active",
      fromUpdate: false,
    },
    {
      id: HERO_INSURANCE_PLAN_IDS.follow,
      title: "Follow up on authorization or referral status",
      detail: `${b} — confirm next steps with the insurer or clinic, not Anchor.`,
      initialStatus: "waiting",
      fromUpdate: false,
    },
    {
      id: HERO_INSURANCE_PLAN_IDS.careTeam,
      title: "Ask care team who submits supporting documentation",
      detail: `${b} — clarify roles so the right office sends each item.`,
      initialStatus: "active",
      fromUpdate: false,
    },
  ]
}

export const DOCUMENT_GUIDE_PANEL_TITLE = "Understand a document"

export const DOCUMENT_GUIDE_PANEL_SUBTITLE =
  "Anchor helps you turn a record into questions. It does not diagnose from documents."

export const DOCUMENT_GUIDE_CLARIFY_BULLETS: string[] = [
  "Diagnosis wording",
  "Final vs pending results",
  "Imaging or pathology status",
  "Tests to ask about",
  "Records to bring",
]

export const HERO_DOCUMENT_PATHOLOGY_QUESTIONS: string[] = [
  "Can you walk us through this in plain language?",
  "What does this confirm?",
  "What does it not answer yet?",
  "Are any addenda or tests still pending?",
  "Does staging depend on imaging, pathology, or both?",
  "Is MMR/MSI or biomarker testing ordered, pending, or final?",
]

export const DOCUMENT_GUIDE_WHAT_TO_BRING: string[] = [
  "Full report",
  "Addenda",
  "Imaging summaries",
  "Visit notes",
  "Medication list",
]

export function buildDocumentGuideClipboardBlock(): string {
  return [
    "ANCHOR — DOCUMENT AGENT OUTPUT (SAMPLE · LOCAL DEMO)",
    DOCUMENT_SAMPLE_DISCLAIMER,
    DOCUMENT_AGENT_BOUNDARY_LINE,
    "Nothing sent automatically.",
    "",
    "A · WHAT THIS DOCUMENT MAY HELP CLARIFY",
    ...DOCUMENT_AGENT_SAMPLE_CLARIFY_BULLETS.map((l) => `• ${l}`),
    "",
    "B · WHAT ANCHOR CANNOT CONFIRM",
    ...DOCUMENT_AGENT_SAMPLE_CANNOT_CONFIRM_BULLETS.map((l) => `• ${l}`),
    "",
    "C · WHAT TO ASK THE CARE TEAM",
    ...DOCUMENT_AGENT_SAMPLE_CARE_TEAM_QUESTIONS.map((l) => `• ${l}`),
    "",
    "D · MISSING PIECES CHECKLIST",
    ...DOCUMENT_AGENT_SAMPLE_MISSING_CHECKLIST.map((l) => `• ${l}`),
    "",
    "— Copied from Anchor prototype. Nothing was sent by Anchor.",
  ].join("\n")
}

export const INSURANCE_ISSUE_PANEL_TITLE = "Handle an insurance or records issue"

export const INSURANCE_ISSUE_PANEL_SUBTITLE =
  "Insurance / Denial / Records Agent — scripts and drafts only. Nothing is filed, sent, or called from Anchor."

export const INSURANCE_ISSUE_CALL_SCRIPT =
  "Hi, I'm calling about records or authorization for my family member's cancer care. Can you tell me exactly what documents are needed, where they should be sent, whether there is a deadline, and whether there is a reference number?"

export const INSURANCE_ISSUE_WHAT_TO_GET: string[] = [
  "Exact record names",
  "Where to send them",
  "Deadline",
  "Reference or case number",
  "Who to follow up with",
  "Whether referral or authorization is required",
]

export const INSURANCE_ISSUE_IF_UNKNOWN_LINE =
  "Who would know, when should I call back, and what can I do today to keep the appointment or review from being delayed?"

export const INSURANCE_ISSUE_FOLLOW_UP_TASK_TITLE = "Follow up on authorization or referral status"

export function buildInsuranceIssueClipboardBlock(): string {
  return [
    "ANCHOR — INSURANCE / RECORDS CALL SCRIPT (LOCAL DEMO)",
    "Administrative prep only. Not treatment advice. You place any calls — Anchor does not dial, email, or text. Nothing sent automatically.",
    "",
    "CALL SCRIPT",
    INSURANCE_ISSUE_CALL_SCRIPT,
    "",
    "WHAT TO GET",
    ...INSURANCE_ISSUE_WHAT_TO_GET.map((l) => `• ${l}`),
    "",
    "IF THEY SAY THEY DO NOT KNOW",
    INSURANCE_ISSUE_IF_UNKNOWN_LINE,
    "",
    "FOLLOW-UP TASK (FOR YOUR OWN CHECKLIST)",
    INSURANCE_ISSUE_FOLLOW_UP_TASK_TITLE,
    "",
    "— Copied from Anchor prototype. Nothing was sent by Anchor.",
  ].join("\n")
}

export interface WordsToSayScriptDef {
  id: "visit_opener" | "clinic_call" | "portal_message" | "family_update" | "insurance_call"
  label: string
  script: string
  /** Stable id for optional plan row linkage */
  guideRowId?: string
}

export const WORDS_TO_SAY_SCRIPT_DEFS: WordsToSayScriptDef[] = [
  {
    id: "visit_opener",
    label: "Visit opener",
    script: VISIT_GUIDE_OPEN_LINE,
  },
  {
    id: "clinic_call",
    label: "Clinic call",
    script:
      "Hi, I'm calling about an upcoming oncology visit. Can you help us confirm the appointment time, what records to bring or upload, and any prep instructions in the portal?",
    guideRowId: "demo-quick-clinic",
  },
  {
    id: "portal_message",
    label: "Portal message",
    script:
      "Hello — we are preparing for the next visit. Can you confirm what is already on file, what results are still pending, and whether we should upload any documents before we arrive? We are not asking for medical advice in the portal — just clarity on what is complete vs pending.",
  },
  {
    id: "family_update",
    label: "Family update",
    script:
      "Quick update: we are still confirming details with the care team. Some results may still be pending. We will share more after we hear from the doctors — no need to assume a treatment plan yet.",
    guideRowId: "demo-quick-family",
  },
  {
    id: "insurance_call",
    label: "Insurance/records call",
    script: INSURANCE_ISSUE_CALL_SCRIPT,
    guideRowId: "demo-quick-insurance",
  },
]

/** Prototype “future agents” — copy and plan helpers only; no live automation. */
export const FUTURE_PREVIEW_BOUNDARY =
  "Prototype preview only. Nothing is sent, scheduled, called, or shared."

export const FUTURE_PREVIEW_TOOLS_TITLE = "Future agent previews"

export const FUTURE_PREVIEW_TOOLS_SUBTITLE =
  "Prototype-only previews for where Anchor goes next. Nothing is sent, called, scheduled, or shared."

export const SENTINEL_PREVIEW_TITLE = "Sentinel preview"

export const SENTINEL_PREVIEW_INTRO =
  "Sentinel only watches what happens inside Anchor in this prototype. It does not read other apps, record your screen, or monitor your phone."

export const SENTINEL_SIGNAL_ROWS: { signal: string; response: string }[] = [
  {
    signal: "“denied”",
    response: "Offer the Insurance / records issue hero flow — administrative prep only.",
  },
  {
    signal: "“appointment delayed”",
    response: "Suggest a follow-up task to confirm timing with the care team or scheduler.",
  },
  {
    signal: "“symptoms worse”",
    response: "Show urgent safety language — Anchor is not emergency monitoring.",
  },
  {
    signal: "“overwhelmed” / “lost”",
    response: "Collapse to one next action so the thread stays workable.",
  },
]

export const SENTINEL_DEMO_OUTPUT_LINE =
  "Anchor noticed this may change the next action. Open the right flow?"

export const SENTINEL_NOT_EMERGENCY_LINE =
  "Sentinel is a prototype support layer, not emergency monitoring."

export const SYSTEM_MAPPER_PREVIEW_TITLE = "System Mapper preview"

export const SYSTEM_MAPPER_PREVIEW_INTRO =
  "Anchor does not rank doctors or choose care. It helps you understand what type of place or specialist to ask about."

export const SYSTEM_MAPPER_FACTORS: string[] = [
  "Current care team",
  "Local oncology clinic",
  "Academic cancer center",
  "Second-opinion clinic",
  "Insurance / referral requirements",
  "Records required",
  "Travel / logistics",
]

export const SYSTEM_MAPPER_COMPARISON_QUESTIONS: string[] = [
  "What type of specialist should we be seeing next?",
  "Is a referral required?",
  "What records are needed before scheduling?",
  "Can this be a second opinion?",
  "Should pending results come back first?",
]

export const SYSTEM_MAPPER_NOT_RANKING_LINE =
  "Not doctor ranking. Not medical quality scoring."

export function buildSystemMapperComparisonQuestionsBlock(): string {
  return [
    "ANCHOR — SYSTEM MAPPER (PROTOTYPE PREVIEW)",
    FUTURE_PREVIEW_BOUNDARY,
    "",
    SYSTEM_MAPPER_NOT_RANKING_LINE,
    "",
    "QUESTIONS TO ASK BEFORE COMPARING OPTIONS",
    ...SYSTEM_MAPPER_COMPARISON_QUESTIONS.map((l) => `• ${l}`),
    "",
    "— Copied from Anchor prototype. No search, no rankings, no care decisions by Anchor.",
  ].join("\n")
}

export const FRONT_DESK_BRIEF_PREVIEW_TITLE = "Front-Desk Brief"

export const FRONT_DESK_BRIEF_PREVIEW_INTRO =
  "Use this when calling a scheduler, records office, insurer, or clinic front desk."

export const FRONT_DESK_BRIEF_SCRIPT =
  "Hi, I'm calling for my mom. We are trying to prepare for a cancer-care appointment or records review. Can you help us confirm what records are needed, where they should be sent, whether a referral or authorization is required, and who we should follow up with?"

export const FRONT_DESK_BRIEF_FIELD_LIST: string[] = [
  "Name of person spoken to",
  "Records needed",
  "Where to send records",
  "Referral / authorization requirement",
  "Deadline",
  "Reference number",
  "Follow-up contact",
]

export function buildFrontDeskBriefClipboardBlock(): string {
  return [
    "ANCHOR — FRONT-DESK BRIEF (PROTOTYPE PREVIEW)",
    FUTURE_PREVIEW_BOUNDARY,
    "",
    "OPENING SCRIPT",
    FRONT_DESK_BRIEF_SCRIPT,
    "",
    "FIELDS TO CAPTURE AFTER THE CALL",
    ...FRONT_DESK_BRIEF_FIELD_LIST.map((l) => `• ${l}`),
    "",
    "— Copied from Anchor prototype. Anchor did not place a call or send a message.",
  ].join("\n")
}

export const HUMAN_OUTREACH_PREVIEW_TITLE = "Human-approved outreach preview"

export const HUMAN_OUTREACH_PREVIEW_INTRO =
  "Future Anchor could prepare calls, messages, or logistics steps. The caregiver stays in control."

export const HUMAN_OUTREACH_STEPS: string[] = [
  "Anchor drafts the action.",
  "Caregiver reviews.",
  "Caregiver edits.",
  "Caregiver approves.",
  "Anchor logs the outcome.",
]

export const HUMAN_OUTREACH_PROTOTYPE_NOTE =
  "No call is made. No message is sent. No appointment is scheduled."

export const HUMAN_OUTREACH_NO_AUTONOMOUS_LINE =
  "Human approval required. No autonomous action in this demo."

export function buildHumanOutreachApprovalChecklistBlock(): string {
  return [
    "ANCHOR — HUMAN-APPROVED OUTREACH (PROTOTYPE PREVIEW)",
    FUTURE_PREVIEW_BOUNDARY,
    "",
    HUMAN_OUTREACH_NO_AUTONOMOUS_LINE,
    "",
    "INTENDED FLOW",
    ...HUMAN_OUTREACH_STEPS.map((l, i) => `${i + 1}. ${l}`),
    "",
    "CURRENT PROTOTYPE",
    HUMAN_OUTREACH_PROTOTYPE_NOTE,
    "",
    "— Copied from Anchor prototype. Anchor does not send external messages or place calls.",
  ].join("\n")
}

export const FUTURE_PREVIEW_PLAN_IDS = {
  sentinelDelayed: "local:fp-sentinel-delayed",
  sentinelOneNext: "local:fp-sentinel-one-next",
  frontDeskFollowup: "local:fp-frontdesk-followup",
} as const

export function buildSentinelDelayedFollowupTask(): StoredAdaptivePlanTask {
  return {
    id: FUTURE_PREVIEW_PLAN_IDS.sentinelDelayed,
    title: "Follow up on delayed appointment or scheduling window",
    detail:
      "From Sentinel preview — confirm dates and instructions with your care team. Prototype cue only; not monitoring.",
    initialStatus: "waiting",
    fromUpdate: false,
  }
}

export function buildSentinelOneNextActionTask(): StoredAdaptivePlanTask {
  return {
    id: FUTURE_PREVIEW_PLAN_IDS.sentinelOneNext,
    title: "One next action: add a short update in Anchor",
    detail:
      "From Sentinel preview — capture what feels most stuck in Tools → Updates. Local demo only; nothing sent automatically.",
    initialStatus: "active",
    fromUpdate: false,
  }
}

export function buildFrontDeskBriefFollowupTask(): StoredAdaptivePlanTask {
  return {
    id: FUTURE_PREVIEW_PLAN_IDS.frontDeskFollowup,
    title: "Follow up on front-desk / records call details",
    detail:
      "From Front-Desk Brief preview — you placed any call yourself; Anchor only held a checklist locally.",
    initialStatus: "waiting",
    fromUpdate: false,
  }
}

/** Phone Mode / Script Reader — one line at a time; local-only; no calls from Anchor. */
export type PhoneModeFollowUpProfile = "visit" | "document" | "insurance" | "frontDesk" | "family" | "none"

export interface PhoneModeScript {
  id: string
  typeLabel: string
  goal: string
  lines: string[]
  writeDown: string[]
  safetyNote: string
  linkedTaskId?: string
  phoneFollowUpProfile?: PhoneModeFollowUpProfile
}

export const PHONE_MODE_SAFETY_CORE =
  "Anchor prepares words. You choose what to say. Your care team confirms medical decisions."

export const PHONE_MODE_NOTHING_SENT = "Nothing is sent or called from Anchor."

export const PHONE_MODE_URGENT_REMINDER =
  "If symptoms feel severe or rapidly worsening, call your care team urgent line or local emergency services. Anchor does not triage."

export const PHONE_SCRIPT_VISIT_PREP: PhoneModeScript = {
  id: "anchor-phone-visit-prep",
  typeLabel: "Visit prep",
  goal: "Get clear answers from the next visit or call.",
  lines: [
    "Before we get into details, can we start by confirming what is known and what is still pending?",
    "Is the stage confirmed, or are we waiting on pathology, imaging, or another result?",
    "Which records should we bring, upload, or request before the next conversation?",
    "What decision, if any, actually needs to be made next?",
    "Who should we contact after this visit if we remember more questions?",
  ],
  writeDown: [
    "Confirmed facts",
    "Pending results",
    "Next decision",
    "Next appointment/contact",
    "Instructions before the next visit",
  ],
  safetyNote: PHONE_MODE_SAFETY_CORE,
  phoneFollowUpProfile: "visit",
}

export const PHONE_SCRIPT_DOCUMENT: PhoneModeScript = {
  id: "anchor-phone-document",
  typeLabel: "Document questions",
  goal: "Turn a report into questions, not a self-diagnosis.",
  lines: [
    "Can you walk us through this report in plain language?",
    "What does this report confirm?",
    "What does it not answer yet?",
    "Are any addenda, tests, imaging results, or biomarkers still pending?",
    "Does staging depend on this document, imaging, pathology, or a combination?",
    "What should we bring or upload before the next visit?",
  ],
  writeDown: ["Final vs pending", "Report name/date", "Missing pages/addenda", "Who will review it", "Next action"],
  safetyNote: PHONE_MODE_SAFETY_CORE,
  phoneFollowUpProfile: "document",
}

export const PHONE_SCRIPT_INSURANCE_RECORDS: PhoneModeScript = {
  id: "anchor-phone-insurance-records",
  typeLabel: "Insurance / records",
  goal: "Find out exactly what is needed so the case does not stall.",
  lines: [
    "Hi, I'm calling for my mom's cancer-care records or authorization.",
    "Can you tell me exactly what documents are needed?",
    "Where should they be sent?",
    "Is there a deadline, referral requirement, authorization number, or case number?",
    "Who should I follow up with if the records are not received?",
    "Can you repeat the reference number and best callback contact?",
  ],
  writeDown: [
    "Person spoken to",
    "Records needed",
    "Destination",
    "Deadline",
    "Reference/case number",
    "Follow-up contact",
  ],
  safetyNote: `${PHONE_MODE_SAFETY_CORE} ${PHONE_MODE_NOTHING_SENT}`,
  phoneFollowUpProfile: "insurance",
}

export const PHONE_SCRIPT_INSURANCE_DENIAL: PhoneModeScript = {
  id: "anchor-phone-insurance-denial",
  typeLabel: "Denial / prior authorization",
  goal: "Learn whether this is a denial, pending authorization, or request for more documentation.",
  lines: INSURANCE_DENIAL_PHONE_SCRIPT_COMBINED.split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean),
  writeDown: INSURANCE_DENIAL_WRITE_DOWN_BULLETS,
  safetyNote: `${PHONE_MODE_SAFETY_CORE} ${PHONE_MODE_NOTHING_SENT}`,
  phoneFollowUpProfile: "insurance",
}

export const PHONE_SCRIPT_RECORDS_REQUEST: PhoneModeScript = {
  id: "anchor-phone-records-request",
  typeLabel: "Records request",
  goal: "Learn exactly which records are needed and where to send them.",
  lines: [INSURANCE_RECORDS_REQUEST_SCRIPT],
  writeDown: ["Exact record names", "Destination", "Deadline", "Confirmation of receipt", "Reference number"],
  safetyNote: `${PHONE_MODE_SAFETY_CORE} ${PHONE_MODE_NOTHING_SENT}`,
  phoneFollowUpProfile: "insurance",
}

export const PHONE_SCRIPT_SCHEDULING_BLOCKER: PhoneModeScript = {
  id: "anchor-phone-scheduling-blocker",
  typeLabel: "Scheduling blocker",
  goal: "Identify what is blocking the appointment and who owns the next step.",
  lines: [
    INSURANCE_SCHEDULING_BLOCKER_SCRIPT,
    "What is the deadline, and who should we contact next if this is still stuck?",
  ],
  writeDown: INSURANCE_SCHEDULING_WHAT_TO_GET,
  safetyNote: `${PHONE_MODE_SAFETY_CORE} ${PHONE_MODE_NOTHING_SENT}`,
  phoneFollowUpProfile: "insurance",
}

export const PHONE_SCRIPT_INSURANCE_FRONT_BRIEF: PhoneModeScript = {
  id: "anchor-phone-insurance-front-brief",
  typeLabel: "Front-Desk Brief",
  goal: "Sound organized when calling a scheduler, front desk, records office, or insurer.",
  lines: [
    "Hi, I'm calling for my mom. We are trying to prepare for a cancer-care appointment or records review.",
    "Can you help us confirm what records are needed, where they should be sent, whether a referral or authorization is required, and who we should follow up with?",
  ],
  writeDown: FRONT_DESK_BRIEF_FIELD_LIST,
  safetyNote: `${PHONE_MODE_SAFETY_CORE} ${PHONE_MODE_NOTHING_SENT}`,
  phoneFollowUpProfile: "frontDesk",
}

export const PHONE_SCRIPT_FRONT_DESK: PhoneModeScript = {
  id: "anchor-phone-front-desk",
  typeLabel: "Records office",
  goal: "Sound organized when calling a front desk, scheduler, or records office.",
  lines: [
    "Hi, I'm calling for my mom. We are trying to prepare for a cancer-care appointment or records review.",
    "Can you help us confirm what records are needed before scheduling or review?",
    "Do you need pathology, imaging summaries, image files, visit notes, or referral information?",
    "Is authorization or a referral required before the appointment?",
    "Who should we contact if something is missing?",
  ],
  writeDown: [
    "Required records",
    "Scheduling requirements",
    "Referral/auth requirement",
    "Upload/fax instructions",
    "Follow-up contact",
  ],
  safetyNote: `${PHONE_MODE_SAFETY_CORE} ${PHONE_MODE_NOTHING_SENT}`,
  phoneFollowUpProfile: "frontDesk",
}

export const PHONE_SCRIPT_FAMILY_UPDATE: PhoneModeScript = {
  id: "anchor-phone-family-update",
  typeLabel: "Family update",
  goal: "Give a calm update without guessing a treatment plan.",
  lines: [
    "Quick update: we are still confirming details with the care team.",
    "Some reports or results may still be pending.",
    "The most helpful thing right now is preparing for the next conversation and gathering records.",
    "Please do not assume a treatment plan until the doctors explain what is confirmed.",
    "If you want to help, please take one concrete task.",
  ],
  writeDown: ["Who can help", "What task they can take", "Who needs future updates"],
  safetyNote: PHONE_MODE_SAFETY_CORE,
  phoneFollowUpProfile: "family",
}

export const PHONE_DOC_FOLLOWUP_ID = "local:phone-doc-followup"

export function buildPhoneDocumentFollowupTask(): StoredAdaptivePlanTask {
  return {
    id: PHONE_DOC_FOLLOWUP_ID,
    title: "Ask care team what this document confirms and what is still pending",
    detail: "From Phone Mode — your clinicians interpret the record; Anchor does not diagnose from documents.",
    initialStatus: "active",
    fromUpdate: false,
  }
}

export const PHONE_FAMILY_FOLLOWUP_ID = "local:phone-family-followup"

export function buildPhoneFamilyFollowupTask(): StoredAdaptivePlanTask {
  return {
    id: PHONE_FAMILY_FOLLOWUP_ID,
    title: "After the next touchpoint, share one concrete family update",
    detail: "From Phone Mode — keep updates accurate and bounded; not sent from Anchor.",
    initialStatus: "waiting",
    fromUpdate: false,
  }
}

export function buildPhoneVisitAfterTask(): StoredAdaptivePlanTask {
  return {
    id: HERO_VISIT_PLAN_IDS.after,
    title: "After the visit, add what changed into Anchor",
    detail: "From Phone Mode visit prep — update the 72-hour plan when you know more; local demo memory only.",
    initialStatus: "active",
    fromUpdate: false,
  }
}

export function buildPhoneInsuranceRecordsFollowupTask(): StoredAdaptivePlanTask {
  return {
    id: HERO_INSURANCE_PLAN_IDS.follow,
    title: INSURANCE_ISSUE_FOLLOW_UP_TASK_TITLE,
    detail: "From Phone Mode — you follow up; Anchor does not place calls or send messages.",
    initialStatus: "waiting",
    fromUpdate: false,
  }
}

export function buildPhoneModeFullScriptBlock(script: PhoneModeScript): string {
  return [
    `ANCHOR — PHONE MODE · ${script.typeLabel}`,
    script.goal,
    "",
    ...script.lines.map((l, i) => `${i + 1}. ${l}`),
    "",
    "WHAT TO WRITE DOWN",
    ...script.writeDown.map((w) => `• ${w}`),
    "",
    script.safetyNote,
    "",
    "— Copied from Anchor prototype. Nothing was sent by Anchor.",
  ].join("\n")
}

/** Split multi-sentence scripts into readable Phone Mode lines. */
export function splitScriptTextToPhoneLines(text: string): string[] {
  const t = text.trim()
  if (!t) return []
  const byNl = t.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  if (byNl.length > 1) return byNl
  const bySentence = t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 6)
  return bySentence.length ? bySentence : [t]
}
