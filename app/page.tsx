"use client"

import React, { ChangeEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CalendarClock,
  Check,
  Clipboard,
  Copy,
  FileText,
  HeartHandshake,
  Users,
  Mic,
  PenLine,
  ShieldCheck,
  Sparkles,
  Square,
  Upload,
  Wind,
} from "lucide-react"
import useWebRTCAudioSession from "@/hooks/use-webrtc"
import { tools } from "@/lib/tools"
import {
  buildAdaptiveTasksFromChip,
  buildAdaptiveTasksFromCustomPlanNote,
  CARE_TEAM_ALIGNED_INTRO,
  DEMO_INFO_UPDATE_CHIPS,
  GENERIC_CARE_TEAM_CONTEXT_BULLETS,
  GENERIC_NIGHT_NOTE,
  PLAN_CHANGE_FACTORS_BULLETS,
  PLAN_CHANGE_URGENT_SAFETY,
  SARAH_CARE_TEAM_CONTEXT_BULLETS,
  SARAH_DEMO_ACTION_PREFIXES,
  SARAH_DEMO_ACTION_SCRIPTS,
  SARAH_DEMO_CONCERN,
  SARAH_DEMO_MIRROR_RESULT,
  SARAH_DEMO_ORIENTATION_LINES,
  SARAH_FALLBACK_PLAN_RESULT,
  MEMORY_ANCHOR_ORGANIZED_LINE,
  MEMORY_CARE_TIMELINE_INTRO,
  MEMORY_EMPTY_QUESTIONS_ASKED,
  MEMORY_EMPTY_CASE_UPDATES,
  MEMORY_EMPTY_TASKS_DONE,
  MEMORY_EMPTY_TIMELINE_ARTIFACTS,
  MEMORY_PROTO_BADGE,
  buildMemoryHoldingNarrative,
  SARAH_KNOW_NOW_BULLETS,
  SARAH_NEEDS_CONFIRMATION_BULLETS,
  SARAH_NOT_TONIGHT_BULLETS,
  SARAH_NIGHT_NOTE,
  ASK_ANCHOR_SUBTITLE,
  FOLLOW_UP_CHIP_DEFS,
  RECORDS_DOCUMENT_STACK_DEFS,
  RECORDS_MISSING_CHECKLIST_DEFS,
  RECORDS_PROTO_BADGE,
  RECORDS_QUICK_ADD_TASK_DEFS,
  RECORDS_SECOND_OPINION_CHECKLIST_LINES,
  RECORDS_SECOND_OPINION_INTRO,
  RECORDS_TAB_SUBTITLE,
  RECORDS_THREE_THINGS_INTRO,
  RECORDS_TRANSFER_CHECKLIST_BULLETS,
  recordsDocStackStatusLabel,
  SAMPLE_PATHOLOGY_QUESTIONS,
  SAMPLE_PATHOLOGY_RECORD_LINES,
  buildRecordsChecklistAdaptiveTask,
  buildRecordsQuickAdaptiveTask,
  buildFamilySupportAdaptiveTask,
  buildGuidedVisitPrepTask,
  buildVisitGuideClipboardBlock,
  createDefaultFamilyCoordBoard,
  FAMILY_AVOID_PRESSURE_LINES,
  FAMILY_EXPLAIN_CARDS,
  FAMILY_HELPS_LINES,
  FAMILY_MORE_HELP_ROLE_CARDS,
  FAMILY_PRIMARY_ASK_CARDS,
  FAMILY_PROTO_BADGE,
  FAMILY_SAFETY_FOOTER,
  FAMILY_TAB_SUBTITLE,
  FAMILY_UPDATE_DRAFT_CALM,
  FAMILY_UPDATE_DRAFT_DETAIL,
  FAMILY_UPDATE_DRAFT_HELP,
  COCKPIT_LOCAL_CONSENT_LINE,
  COCKPIT_WHY_NOT_CHATBOT_BODY,
  COCKPIT_WHY_NOT_CHATBOT_TITLE,
  GUIDED_VISIT_PREP_TASK_ID,
  VISIT_GUIDE_AFTER_VISIT,
  VISIT_GUIDE_END_LINE,
  VISIT_GUIDE_IF_CONFUSED,
  VISIT_GUIDE_LISTEN_FOR,
  VISIT_GUIDE_OPEN_LINE,
  VISIT_GUIDE_PURPOSE,
  VISIT_GUIDE_TITLE,
  VISIT_GUIDE_VISIT_NOTES_HINT,
  getDemoCaseDeltaFromChip,
  getDemoCaseDeltaFromCustomNote,
  normalizeFollowUpChipKind,
  type AdaptivePlanTaskInitialStatus,
  type FollowUpChipId,
  type NightNoteContent,
  type FamilyCoordBoardRow,
  type FamilySupportRoleCardDef,
  type RecordsChecklistItemDef,
  type StoredAdaptivePlanTask,
} from "@/lib/demo/sarah-case"
import { getAccount, getDatabases, ID, Query, DB_ID, COLLECTIONS } from "@/lib/appwrite"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

type CancerType = "colon" | "breast" | "lymphoma"
type AppPhase = "idle" | "recording" | "processing" | "results"
type WorkspaceTab = "today" | "tools" | "saved"
type ToolPanelId = "ask" | "updates" | "plan" | "actions" | "records" | "family"

type ResultCopyKind =
  | "note"
  | "handoff"
  | "followup"
  | "appointment"
  | "recordsPathology"
  | "recordsSecondOpinion"
  | "recordsTransfer"
  | "recordsOnePager"
  | "familyClip"
  | "visitPrep"

interface CopyTimelineMeta {
  taskTitle: string
  badge: string
  taskId: string
}
type OnboardingStep = "name" | "relationship"
type CompanionScreen = "breathe" | "control" | "say" | "oneThing" | null
type AuthStatus = "checking" | "auth" | "authenticated" | "guest"
type RelationshipValue = (typeof RELATIONSHIPS)[number]["value"]

interface MirrorResult {
  mirror: string
  ground: string
  actions: string[]
  fearSummary: string
  fearQuote: string
}

function isValidMirrorResult(value: unknown): value is MirrorResult {
  if (!value || typeof value !== "object") return false
  const o = value as Record<string, unknown>
  if (typeof o.mirror !== "string" || o.mirror.trim().length < 3) return false
  if (typeof o.ground !== "string" || o.ground.trim().length < 3) return false
  if (typeof o.fearSummary !== "string" || o.fearSummary.trim().length < 2) return false
  if (typeof o.fearQuote !== "string" || o.fearQuote.trim().length < 2) return false
  if (!Array.isArray(o.actions) || o.actions.length === 0) return false
  return o.actions.every((a) => typeof a === "string" && (a as string).trim().length > 0)
}

interface PlanAction {
  text: string
  regretQuote: string
}

interface PlanResult {
  tonight: PlanAction[]
  tomorrow: PlanAction[]
  next48: PlanAction[]
}

const ANCHOR_DEMO_CASE_KEY = "anchor-demo-case-v1"

interface DemoCaseUpdate {
  id: string
  sourceLabel: string
  newInformation: string
  mayAffect: string
  needsConfirmation: string
  askNext: string
  revisedStep: string
}

interface ActionGuideDemoTimelineEntry {
  id: string
  taskId: string
  taskTitle: string
  badge: string
  savedAt: string
}

type FollowUpResponseKind = FollowUpChipId | "custom"

interface FollowUpResponseItem {
  id: string
  timestamp: string
  kind: FollowUpResponseKind
  questionLabel: string
  title: string
  answer: string
  caregiverMeaning?: string
  confirmWithTeam?: string[]
  exactWords?: string
  safetyFooter: string
  bullets?: string[]
}

interface AnchorDemoCaseV1 {
  v: 1
  phase: AppPhase
  caregiverName: string
  relationship: RelationshipValue | null
  cancerType: CancerType
  mirrorResult: MirrorResult
  planResult: PlanResult | null
  isBackupDemoMirror: boolean
  showExampleOutput: boolean
  lastTranscriptSnippet?: string
  caseUpdates: DemoCaseUpdate[]
  completedPlanTaskIds: string[]
  adaptivePlanTasks: StoredAdaptivePlanTask[]
  actionGuideDemoTimeline?: ActionGuideDemoTimelineEntry[]
  workspaceTab?: WorkspaceTab
  toolPanel?: ToolPanelId | null
  /** Legacy workspace routing (Prompt 8.6C migration). */
  activeResultTab?: string
  followUpResponses?: FollowUpResponseItem[]
  familyCoordBoard?: FamilyCoordBoardRow[]
}

function isValidPlanResult(value: unknown): value is PlanResult {
  if (!value || typeof value !== "object") return false
  const o = value as Record<string, unknown>
  if (!Array.isArray(o.tonight) || !Array.isArray(o.tomorrow) || !Array.isArray(o.next48)) return false
  const ok = (arr: unknown[]) =>
    arr.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as PlanAction).text === "string" &&
        typeof (item as PlanAction).regretQuote === "string",
    )
  return ok(o.tonight as unknown[]) && ok(o.tomorrow as unknown[]) && ok(o.next48 as unknown[])
}

function isDemoCaseUpdate(value: unknown): value is DemoCaseUpdate {
  if (!value || typeof value !== "object") return false
  const o = value as Record<string, unknown>
  return (
    typeof o.id === "string" &&
    typeof o.sourceLabel === "string" &&
    typeof o.newInformation === "string" &&
    typeof o.mayAffect === "string" &&
    typeof o.needsConfirmation === "string" &&
    typeof o.askNext === "string" &&
    typeof o.revisedStep === "string"
  )
}

function isActionGuideDemoTimelineEntry(value: unknown): value is ActionGuideDemoTimelineEntry {
  if (!value || typeof value !== "object") return false
  const o = value as Record<string, unknown>
  return (
    typeof o.id === "string" &&
    typeof o.taskId === "string" &&
    typeof o.taskTitle === "string" &&
    typeof o.badge === "string" &&
    typeof o.savedAt === "string"
  )
}

function isWorkspaceTab(value: unknown): value is WorkspaceTab {
  return value === "today" || value === "tools" || value === "saved"
}

function isToolPanelId(value: unknown): value is ToolPanelId {
  return (
    value === "ask" ||
    value === "updates" ||
    value === "plan" ||
    value === "actions" ||
    value === "records" ||
    value === "family"
  )
}

function migrateWorkspaceFromSnapshot(o: Record<string, unknown>): { tab: WorkspaceTab; panel: ToolPanelId | null } {
  const ws = o.workspaceTab
  if (isWorkspaceTab(ws)) {
    const rawPanel = o.toolPanel
    const panel = rawPanel === null || rawPanel === undefined ? null : isToolPanelId(rawPanel) ? rawPanel : null
    return { tab: ws, panel: ws === "tools" ? panel : null }
  }
  const legacy = o.activeResultTab
  if (legacy === "memory") return { tab: "saved", panel: null }
  if (legacy === "plan") return { tab: "tools", panel: "plan" }
  if (legacy === "ask") return { tab: "tools", panel: "ask" }
  if (legacy === "actions") return { tab: "tools", panel: "actions" }
  if (legacy === "updates") return { tab: "tools", panel: "updates" }
  if (legacy === "records") return { tab: "tools", panel: "records" }
  if (legacy === "family") return { tab: "tools", panel: "family" }
  return { tab: "today", panel: null }
}

function isFollowUpResponseKind(value: unknown): value is FollowUpResponseKind {
  if (typeof value !== "string") return false
  return normalizeFollowUpChipKind(value) !== null
}

function isFollowUpResponseItem(value: unknown): value is FollowUpResponseItem {
  if (!value || typeof value !== "object") return false
  const o = value as Record<string, unknown>
  if (typeof o.id !== "string" || typeof o.timestamp !== "string") return false
  const normalizedKind = typeof o.kind === "string" ? normalizeFollowUpChipKind(o.kind) : null
  if (!normalizedKind) return false
  if (typeof o.questionLabel !== "string" || typeof o.title !== "string" || typeof o.answer !== "string") return false
  if (typeof o.safetyFooter !== "string") return false
  if (o.caregiverMeaning != null && typeof o.caregiverMeaning !== "string") return false
  if (o.exactWords != null && typeof o.exactWords !== "string") return false
  if (o.confirmWithTeam != null) {
    if (!Array.isArray(o.confirmWithTeam)) return false
    if (!o.confirmWithTeam.every((x) => typeof x === "string")) return false
  }
  if (o.bullets != null) {
    if (!Array.isArray(o.bullets)) return false
    if (!o.bullets.every((x) => typeof x === "string")) return false
  }
  return true
}

function isStoredAdaptivePlanTask(value: unknown): value is StoredAdaptivePlanTask {
  if (!value || typeof value !== "object") return false
  const o = value as Record<string, unknown>
  if (typeof o.id !== "string" || typeof o.title !== "string" || typeof o.fromUpdate !== "boolean") return false
  if (o.initialStatus !== "active" && o.initialStatus !== "waiting" && o.initialStatus !== "urgent") return false
  if (o.detail != null && typeof o.detail !== "string") return false
  if (o.regretQuote != null && typeof o.regretQuote !== "string") return false
  if (o.fromRecords !== undefined && typeof o.fromRecords !== "boolean") return false
  if (o.recordsChecklistId != null && typeof o.recordsChecklistId !== "string") return false
  if (o.fromFamily !== undefined && typeof o.fromFamily !== "boolean") return false
  if (o.familySupportRoleId != null && typeof o.familySupportRoleId !== "string") return false
  return true
}

function isFamilyCoordBoardRow(value: unknown): value is FamilyCoordBoardRow {
  if (!value || typeof value !== "object") return false
  const o = value as Record<string, unknown>
  if (typeof o.id !== "string" || typeof o.title !== "string" || typeof o.done !== "boolean") return false
  if (o.owner !== "none" && o.owner !== "sibling" && o.owner !== "family-member") return false
  return true
}

function normalizeFamilyCoordBoard(raw: unknown): FamilyCoordBoardRow[] {
  const defaults = createDefaultFamilyCoordBoard()
  if (!Array.isArray(raw)) return defaults
  const incoming = raw.filter(isFamilyCoordBoardRow)
  const byId = new Map(incoming.map((r) => [r.id, r]))
  return defaults.map((row) => {
    const hit = byId.get(row.id)
    if (!hit) return row
    return { ...row, owner: hit.owner, done: hit.done }
  })
}

interface FearMemory {
  id: string
  quote: string
  summary: string
  date: string
}

interface JournalEntry {
  id: string
  text: string
  date: string
}

const STORAGE_KEYS = {
  name: "anchor_name",
  relationship: "anchor_relationship",
  cancerType: "anchor_cancerType",
  onboarded: "anchor_onboarded",
  fears: "anchor_fears",
  journal: "anchor_journal",
  oneThingCount: "anchor_one_thing_count",
  oneThingUsed: "anchor_one_thing_used",
}

const CANCER_TYPES: { value: CancerType; label: string; detail: string }[] = [
  { value: "colon", label: "Colon", detail: "GI oncology path" },
  { value: "breast", label: "Breast", detail: "Imaging, markers, staging" },
  { value: "lymphoma", label: "Lymphoma", detail: "Heme-onc next steps" },
]

const RELATIONSHIPS = [
  { value: "mom", label: "Mom", note: "The person who made the world feel knowable." },
  { value: "dad", label: "Dad", note: "The person you still want to call first." },
  { value: "partner", label: "Partner", note: "The person beside you in the dark." },
  { value: "spouse", label: "Spouse", note: "The life you built is suddenly asking more." },
  { value: "sibling", label: "Sibling", note: "The person who shares your first language." },
  { value: "child", label: "Child", note: "The future you would trade anything to protect." },
  { value: "grandparent", label: "Grandparent", note: "The keeper of stories you are not ready to lose." },
  { value: "aunt-or-uncle", label: "Aunt or Uncle", note: "The person who made family feel larger." },
  { value: "cousin", label: "Cousin", note: "The person who grew beside you." },
  { value: "friend", label: "Friend", note: "The family you chose." },
  { value: "other", label: "Other", note: "Someone you love enough to be here for." },
] as const

const PROCESSING_PHRASES = [
  "Anchor is turning the concern into next steps…",
  "Preparing a caregiver plan…",
  "Sorting what matters for the visit ahead…",
  "Holding the worry next to practical next steps…",
  "Almost ready — gathering what to ask and what to confirm…",
]

const SARAH_MIRROR_RESULT: MirrorResult = { ...SARAH_DEMO_MIRROR_RESULT }

const BREATHE_PHASES = [
  { label: "Inhale", scale: 1.28 },
  { label: "Hold", scale: 1.28 },
  { label: "Exhale", scale: 0.82 },
  { label: "Hold", scale: 0.82 },
]

const PHILOSOPHICAL_INSIGHTS = [
  "The obstacle is the way. What blocks you contains the path through it. - Marcus Aurelius",
  "Between stimulus and response there is a space. In that space is your power. - Viktor Frankl",
  "You suffer more in imagination than in reality. - Seneca",
  "Name it to tame it. The act of labeling a feeling reduces its intensity by 50%. - Dr. Dan Siegel, UCLA",
  "Anxiety is not a sign that something is wrong. It is a sign that something matters. - unknown",
  "The mind that is anxious about future events is miserable. - Seneca",
]

const SAY_PROMPTS = [
  "Write the sentence you keep swallowing.",
  "Name the thing you are afraid will change forever.",
  "What would you say if nobody needed you to be steady?",
  "Write one truth, without making it smaller.",
]

const CAREGIVER_QUOTES = [
  "I did not need to be brave every minute. I needed somewhere honest to put the fear.",
  "The smallest list made the day survivable.",
  "I could love them and still admit I was exhausted.",
]

const EXAMPLE_INPUT = SARAH_DEMO_CONCERN

const EXAMPLE_MIRROR_RESULT = SARAH_MIRROR_RESULT
const EXAMPLE_ACTION_SCRIPTS = SARAH_DEMO_ACTION_SCRIPTS
const EXAMPLE_ACTION_PREFIXES = SARAH_DEMO_ACTION_PREFIXES

const ACTION_SCRIPTS = [
  {
    match: "pathology report",
    script:
      "Hi, I'm calling about my [mom's] recent diagnosis. Could you send us the complete pathology report including staging and lymph node involvement? We want to share it with our oncologist.",
  },
  {
    match: "oncologist consult",
    script:
      "Hi, my [mom] was recently diagnosed with colon cancer and we need to schedule an urgent oncologist consultation. What's the earliest available appointment?",
  },
  {
    match: "CEA tumor marker baseline",
    script:
      "Before treatment begins, should we establish a CEA tumor marker baseline? Our oncologist mentioned this tracks recurrence — can we order that test now?",
  },
  {
    match: "write down the exact questions",
    script:
      "Tonight, open one note and write three headings: \"Confirmed,\" \"Still unclear,\" and \"Questions for tomorrow.\" Add bullets as you remember — then confirm details with your care team.",
  },
  {
    match: "gather reports",
    script:
      "Hi, I'm calling for my mom. We were told she may have possible stage III colon cancer, and we have an appointment tomorrow. Before we come in, can you help us confirm what records we should bring, whether the full pathology report is finalized, and whether any imaging or biomarker testing is still pending?",
  },
  {
    match: "ask your care team what is confirmed",
    script: [
      "What is confirmed right now, and what is still uncertain?",
      "Is the stage confirmed or still being worked up?",
      "Are imaging and pathology complete?",
      "Are any biomarkers or MMR/MSI tests pending?",
      "What decisions are expected at this appointment?",
      "What should we watch for or call about before the next visit?",
    ].join(" "),
  },
]

const ONE_THING_ITEMS = [
  "Put the oncology phone number somewhere obvious.",
  "Write the top three questions in one note.",
  "Drink a full glass of water.",
  "Set one alarm for the next appointment task.",
  "Put the pathology report in one folder.",
  "Text one person the specific help you need.",
  "Take ten slow breaths before searching again.",
  "Write down the exact diagnosis words you have.",
  "Find the insurance card and photograph both sides.",
  "Choose who will sit with you at the next call.",
  "Put tomorrow's first call on the calendar.",
  "Make a medication and allergy list.",
  "Save the clinic portal login.",
  "Step outside for two minutes of air.",
  "Put your phone down for one song.",
]

const GLASS_PANEL =
  "border border-white/70 bg-white/60 shadow-[0_24px_80px_rgba(116,100,91,0.12)] backdrop-blur-[20px]"
const GLASS_BUTTON =
  "border border-white/80 bg-white/60 shadow-[0_14px_44px_rgba(116,100,91,0.1)] backdrop-blur-[20px] transition duration-300 hover:-translate-y-0.5 hover:border-[#c9b8d8]/80 hover:shadow-[0_22px_64px_rgba(178,150,176,0.18)]"
const SOFT_GRADIENT_TEXT =
  "bg-gradient-to-r from-[#6f6280] via-[#a487a5] to-[#b77f93] bg-clip-text text-transparent"

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] } },
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function currentDateLabel() {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date())
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function isCancerType(value: string | null): value is CancerType {
  return value === "colon" || value === "breast" || value === "lymphoma"
}

function isRelationship(value: string | null): value is RelationshipValue {
  return RELATIONSHIPS.some((item) => item.value === value)
}

function getActionScript(action: string, index: number) {
  const normalizedAction = action.toLowerCase()
  const matchedScript = ACTION_SCRIPTS.find(({ match }) => normalizedAction.includes(match.toLowerCase()))
  return (matchedScript ?? ACTION_SCRIPTS[index % ACTION_SCRIPTS.length]).script
}

function renderActionText(action: string, emphasizedPrefix?: string) {
  if (!emphasizedPrefix || !action.startsWith(emphasizedPrefix)) return action

  return (
    <>
      <strong className="font-bold">{emphasizedPrefix}</strong>
      {action.slice(emphasizedPrefix.length)}
    </>
  )
}

function pickOneThing(used: number[]) {
  const available = ONE_THING_ITEMS.map((_, index) => index).filter((index) => !used.includes(index))
  const pool = available.length > 0 ? available : ONE_THING_ITEMS.map((_, index) => index)
  return pool[Math.floor(Math.random() * pool.length)]
}

function AmbientOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#fffdf9_0%,#fbf7f0_52%,#f7efe7_78%,#f7f1ec_100%)]" />
      <div className="ambient-orb cloud-orb-a absolute h-72 w-72 rounded-full bg-[#d7cbe8]/28 blur-3xl" />
      <div className="ambient-orb cloud-orb-b absolute h-80 w-80 rounded-full bg-[#ead2dc]/26 blur-3xl" />
      <div className="ambient-orb cloud-orb-c absolute h-64 w-64 rounded-full bg-white/70 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.5),rgba(251,247,240,0.25),rgba(255,255,255,0.44))]" />
    </div>
  )
}

export default function App() {
  const [hydrated, setHydrated] = useState(false)
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking")
  const [userId, setUserId] = useState<string | null>(null)
  const [authEmail, setAuthEmail] = useState("")
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [emailOtpUserId, setEmailOtpUserId] = useState<string | null>(null)
  const [emailOtpCode, setEmailOtpCode] = useState("")
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false)
  const [authSending, setAuthSending] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [welcomeBack, setWelcomeBack] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("name")
  const [onboarded, setOnboarded] = useState(false)
  const [caregiverName, setCaregiverName] = useState("")
  const [relationship, setRelationship] = useState<RelationshipValue | null>(null)
  const [cancerType, setCancerType] = useState<CancerType>("colon")
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const [mirrorResult, setMirrorResult] = useState<MirrorResult | null>(null)
  const [planResult, setPlanResult] = useState<PlanResult | null>(null)
  const [isPlanning, setIsPlanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<AppPhase>("idle")
  const [processingPhraseIndex, setProcessingPhraseIndex] = useState(0)
  const [pathologyText, setPathologyText] = useState("")
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle")
  const [uploadLabel, setUploadLabel] = useState("")
  const [copied, setCopied] = useState<ResultCopyKind | null>(null)
  const [showExampleOutput, setShowExampleOutput] = useState(false)
  const [isBackupDemoMirror, setIsBackupDemoMirror] = useState(false)
  const [fearTimeline, setFearTimeline] = useState<FearMemory[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [oneThingCount, setOneThingCount] = useState(0)
  const [oneThingUsed, setOneThingUsed] = useState<number[]>([])
  const [currentOneThing, setCurrentOneThing] = useState(0)
  const [activeScreen, setActiveScreen] = useState<CompanionScreen>(null)
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("today")
  const [toolPanel, setToolPanel] = useState<ToolPanelId | null>(null)
  const [breathStep, setBreathStep] = useState(0)
  const [breathCycles, setBreathCycles] = useState(0)
  const wasActiveRef = useRef(false)
  const voiceFollowUpRef = useRef(false)
  const breathStepRef = useRef(0)

  const [caseInformationUpdates, setCaseInformationUpdates] = useState<DemoCaseUpdate[]>([])
  const [completedPlanTaskIds, setCompletedPlanTaskIds] = useState<string[]>([])
  const [adaptivePlanTasks, setAdaptivePlanTasks] = useState<StoredAdaptivePlanTask[]>([])
  const [actionGuideDemoTimeline, setActionGuideDemoTimeline] = useState<ActionGuideDemoTimelineEntry[]>([])
  const [followUpResponses, setFollowUpResponses] = useState<FollowUpResponseItem[]>([])
  const [familyCoordBoard, setFamilyCoordBoard] = useState<FamilyCoordBoardRow[]>(() => createDefaultFamilyCoordBoard())
  const [resultsTranscriptEcho, setResultsTranscriptEcho] = useState("")

  const {
    isSessionActive,
    handleStartStopClick,
    conversation,
    currentVolume,
    transcriptRef,
  } = useWebRTCAudioSession("ash", tools)

  const selectedRelationship = RELATIONSHIPS.find((item) => item.value === relationship)
  const displayName = caregiverName.trim() || "there"
  const lovedOne = selectedRelationship?.value ?? "person"
  const lovedOneLabel = selectedRelationship?.label ?? "Your person"
  const voiceEnergy = Math.min(1, Math.max(0.03, currentVolume || 0.03))
  const latestUserLine = conversation
    .filter((message) => message.role === "user" && message.text && message.text !== "Processing speech...")
    .slice(-1)[0]?.text

  const noteText = useMemo(() => {
    if (!mirrorResult) return ""

    const actions = mirrorResult.actions
      .slice(0, 3)
      .map((action, index) => `${index + 1}. ${action}`)
      .join("\n")

    const plan = planResult
      ? [
          "\n72-hour plan",
          ...formatPlanSection("First steps", planResult.tonight),
          ...formatPlanSection("Tomorrow", planResult.tomorrow),
          ...formatPlanSection("Next 48 hours", planResult.next48),
        ].join("\n")
      : ""

    return [
      `Anchor note for ${displayName}`,
      `Loved one: ${lovedOneLabel}`,
      `Cancer type: ${titleCase(cancerType)}`,
      `Fear quote: "${mirrorResult.fearQuote}"`,
      "",
      `Mirror: ${mirrorResult.mirror}`,
      `Ground: ${mirrorResult.ground}`,
      "",
      "Next moves",
      actions,
      plan,
    ].join("\n")
  }, [cancerType, displayName, lovedOneLabel, mirrorResult, planResult])

  const handoffText = useMemo(() => {
    if (!mirrorResult) return ""
    return [
      `Quick Anchor update: ${displayName} is worried about ${lovedOneLabel.toLowerCase()}'s ${cancerType} cancer.`,
      `The fear underneath it: ${mirrorResult.fearSummary}.`,
      `Helpful next steps: ${mirrorResult.actions.slice(0, 2).join(" Also, ")}.`,
    ].join(" ")
  }, [cancerType, displayName, lovedOneLabel, mirrorResult])

  useEffect(() => {
    async function init() {
      // Always load misc localStorage items
      setOneThingCount(Number(window.localStorage.getItem(STORAGE_KEYS.oneThingCount) || "0"))
      const storedUsed = parseJson<number[]>(window.localStorage.getItem(STORAGE_KEYS.oneThingUsed), [])
      setOneThingUsed(storedUsed)
      setCurrentOneThing(pickOneThing(storedUsed))

      // Handle magic link return (?userId=...&secret=...)
      const params = new URLSearchParams(window.location.search)
      const magicUserId = params.get("userId")
      const secret = params.get("secret")
      if (magicUserId && secret) {
        window.history.replaceState({}, "", window.location.pathname)
        try {
          await getAccount().createSession(magicUserId, secret)
        } catch (e) {
          console.error("[auth] Magic link completion failed:", e)
        }
      }

      // Check Appwrite session
      try {
        const user = await getAccount().get()
        setUserId(user.$id)

        // Try to load profile
        try {
          const profile = await getDatabases().getDocument(DB_ID, COLLECTIONS.profiles, user.$id)
          const pName = profile.name as string
          const pRelationship = profile.relationship as string
          const pCancerType = profile.cancerType as string

          if (pName) setCaregiverName(pName)
          if (isRelationship(pRelationship)) setRelationship(pRelationship)
          if (isCancerType(pCancerType)) setCancerType(pCancerType)

          // Load journal from Appwrite
          try {
            const journalDocs = await getDatabases().listDocuments(DB_ID, COLLECTIONS.journal, [
              Query.equal("userId", user.$id),
              Query.orderDesc("timestamp"),
              Query.limit(10),
            ])
            setJournalEntries(
              journalDocs.documents.map((doc: Record<string, unknown>) => ({
                id: doc.$id as string,
                text: doc.content as string,
                date: doc.timestamp as string,
              }))
            )
          } catch {
            setJournalEntries(parseJson<JournalEntry[]>(window.localStorage.getItem(STORAGE_KEYS.journal), []))
          }

          // Load fears from Appwrite
          try {
            const fearDocs = await getDatabases().listDocuments(DB_ID, COLLECTIONS.fears, [
              Query.equal("userId", user.$id),
              Query.orderDesc("timestamp"),
              Query.limit(6),
            ])
            setFearTimeline(
              fearDocs.documents.map((doc: Record<string, unknown>) => ({
                id: doc.$id as string,
                quote: doc.fearQuote as string,
                summary: doc.fearSummary as string,
                date: doc.timestamp as string,
              }))
            )
          } catch {
            setFearTimeline(parseJson<FearMemory[]>(window.localStorage.getItem(STORAGE_KEYS.fears), []))
          }

          setOnboarded(true)
          setWelcomeBack(true)
          window.setTimeout(() => setWelcomeBack(false), 2000)
        } catch {
          // No profile yet — show onboarding
          setFearTimeline(parseJson<FearMemory[]>(window.localStorage.getItem(STORAGE_KEYS.fears), []))
          setJournalEntries(parseJson<JournalEntry[]>(window.localStorage.getItem(STORAGE_KEYS.journal), []))
          setOnboarded(false)
          setOnboardingStep("name")
        }

        setAuthStatus("authenticated")
      } catch {
        // No Appwrite session — check localStorage
        const storedName = window.localStorage.getItem(STORAGE_KEYS.name) || ""
        const storedRelationship = window.localStorage.getItem(STORAGE_KEYS.relationship)
        const storedCancerType = window.localStorage.getItem(STORAGE_KEYS.cancerType)
        const storedOnboarded = window.localStorage.getItem(STORAGE_KEYS.onboarded) === "true"

        if (storedName) setCaregiverName(storedName)
        if (isRelationship(storedRelationship)) setRelationship(storedRelationship)
        if (isCancerType(storedCancerType)) setCancerType(storedCancerType)

        setFearTimeline(parseJson<FearMemory[]>(window.localStorage.getItem(STORAGE_KEYS.fears), []))
        setJournalEntries(parseJson<JournalEntry[]>(window.localStorage.getItem(STORAGE_KEYS.journal), []))

        const canSkip = storedOnboarded && storedName && isRelationship(storedRelationship) && isCancerType(storedCancerType)
        setOnboarded(Boolean(canSkip))
        setOnboardingStep(canSkip ? "relationship" : "name")

        // Returning guests skip the auth screen; new visitors see it
        setAuthStatus(storedOnboarded ? "guest" : "auth")
      }

      setHydrated(true)
    }

    void init()
  }, [])

  useLayoutEffect(() => {
    if (!hydrated) return
    const raw = window.localStorage.getItem(ANCHOR_DEMO_CASE_KEY)
    if (!raw) return
    try {
      const data = JSON.parse(raw) as unknown
      if (!data || typeof data !== "object") return
      const o = data as Record<string, unknown>
      if (o.v !== 1 || o.phase !== "results" || !isValidMirrorResult(o.mirrorResult)) return
      const planRaw = o.planResult
      const planResultParsed = planRaw == null ? null : isValidPlanResult(planRaw) ? planRaw : null
      const cancerRaw = o.cancerType
      const relRaw = o.relationship
      const nameRaw = o.caregiverName
      const cancerStr = typeof cancerRaw === "string" ? cancerRaw : null
      if (!isCancerType(cancerStr)) return
      const relStr = typeof relRaw === "string" ? relRaw : null
      if (relStr != null && relStr !== "" && !isRelationship(relStr)) return

      const rec = o as Record<string, unknown>
      const updatesRaw = rec.caseUpdates ?? rec.caseInformationUpdates
      const caseUpdates = Array.isArray(updatesRaw) ? updatesRaw.filter(isDemoCaseUpdate) : []

      setCaregiverName(typeof nameRaw === "string" ? nameRaw : "")
      if (isRelationship(relStr)) setRelationship(relStr)
      else setRelationship(null)
      setCancerType(cancerStr)
      setMirrorResult(o.mirrorResult as MirrorResult)
      setPlanResult(planResultParsed)
      setIsBackupDemoMirror(Boolean(o.isBackupDemoMirror))
      setShowExampleOutput(Boolean(o.showExampleOutput))
      setCaseInformationUpdates(caseUpdates)
      const doneRaw = o.completedPlanTaskIds
      const doneIds = Array.isArray(doneRaw) ? doneRaw.filter((x): x is string => typeof x === "string") : []
      setCompletedPlanTaskIds(doneIds)
      const adaptRaw = o.adaptivePlanTasks
      const adaptTasks = Array.isArray(adaptRaw) ? adaptRaw.filter(isStoredAdaptivePlanTask) : []
      setAdaptivePlanTasks(adaptTasks)
      const tlRaw = o.actionGuideDemoTimeline
      const tl = Array.isArray(tlRaw) ? tlRaw.filter(isActionGuideDemoTimelineEntry) : []
      setActionGuideDemoTimeline(tl)
      const migrated = migrateWorkspaceFromSnapshot(rec)
      setWorkspaceTab(migrated.tab)
      setToolPanel(migrated.panel)
      const fuRaw = o.followUpResponses
      const followUpsRaw = Array.isArray(fuRaw) ? fuRaw.filter(isFollowUpResponseItem) : []
      const followUps: FollowUpResponseItem[] = followUpsRaw
        .map((it) => {
          const nk = normalizeFollowUpChipKind(it.kind)
          if (!nk) return null
          return nk === it.kind ? it : { ...it, kind: nk }
        })
        .filter((x): x is FollowUpResponseItem => x != null)
      setFollowUpResponses(followUps)
      const famRaw = o.familyCoordBoard
      setFamilyCoordBoard(normalizeFamilyCoordBoard(famRaw))
      const snip = o.lastTranscriptSnippet
      setResultsTranscriptEcho(typeof snip === "string" ? snip.slice(0, 500) : "")
      setOnboarded(true)
      setPhase("results")
      setError(null)
    } catch {
      /* ignore corrupt demo snapshot */
    }
  }, [hydrated])

  useEffect(() => {
    if (!hydrated) return
    if (phase !== "results" || !mirrorResult) return
    try {
      const payload: AnchorDemoCaseV1 = {
        v: 1,
        phase,
        caregiverName: caregiverName.trim(),
        relationship,
        cancerType,
        mirrorResult,
        planResult,
        isBackupDemoMirror,
        showExampleOutput,
        lastTranscriptSnippet: (() => {
          const line = latestUserLine?.trim()
          if (line) return line.slice(0, 500)
          const echo = resultsTranscriptEcho.trim()
          if (echo) return echo.slice(0, 500)
          if (isBackupDemoMirror || mirrorResult.fearQuote.trim() === SARAH_DEMO_CONCERN.trim()) {
            return SARAH_DEMO_CONCERN
          }
          return mirrorResult.fearQuote.trim().slice(0, 500)
        })(),
        caseUpdates: caseInformationUpdates,
        completedPlanTaskIds,
        adaptivePlanTasks,
        actionGuideDemoTimeline,
        workspaceTab,
        toolPanel: workspaceTab === "tools" ? toolPanel : null,
        followUpResponses,
        familyCoordBoard,
      }
      window.localStorage.setItem(ANCHOR_DEMO_CASE_KEY, JSON.stringify(payload))
    } catch {
      /* ignore quota / serialization issues */
    }
  }, [
    actionGuideDemoTimeline,
    workspaceTab,
    toolPanel,
    adaptivePlanTasks,
    cancerType,
    caregiverName,
    caseInformationUpdates,
    completedPlanTaskIds,
    familyCoordBoard,
    followUpResponses,
    hydrated,
    isBackupDemoMirror,
    latestUserLine,
    mirrorResult,
    phase,
    planResult,
    relationship,
    resultsTranscriptEcho,
    showExampleOutput,
  ])

  useEffect(() => {
    if (phase !== "results") return
    const line = latestUserLine?.trim()
    if (!line) return
    setResultsTranscriptEcho(line.slice(0, 500))
  }, [latestUserLine, phase])

  useEffect(() => {
    if (!hydrated || !onboarded) return
    window.localStorage.setItem(STORAGE_KEYS.cancerType, cancerType)
  }, [cancerType, hydrated, onboarded])

  useEffect(() => {
    if (phase !== "processing") return

    const id = window.setInterval(() => {
      setProcessingPhraseIndex((index) => (index + 1) % PROCESSING_PHRASES.length)
    }, 2100)

    return () => window.clearInterval(id)
  }, [phase])

  useEffect(() => {
    if (activeScreen !== "breathe") return

    const id = window.setInterval(() => {
      const next = (breathStepRef.current + 1) % BREATHE_PHASES.length
      breathStepRef.current = next
      setBreathStep(next)
      if (next === 0) setBreathCycles((cycles) => cycles + 1)
    }, 4000)

    return () => window.clearInterval(id)
  }, [activeScreen])

  const rememberFear = useCallback((mirror: MirrorResult) => {
    const nextMemory: FearMemory = {
      id: `${Date.now()}`,
      quote: mirror.fearQuote,
      summary: mirror.fearSummary,
      date: new Date().toISOString(),
    }

    setFearTimeline((current) => {
      const next = [nextMemory, ...current].slice(0, 6)
      window.localStorage.setItem(STORAGE_KEYS.fears, JSON.stringify(next))
      return next
    })
  }, [])

  const appendDemoCaseUpdate = useCallback((update: DemoCaseUpdate) => {
    setCaseInformationUpdates((prev) => [...prev, update])
  }, [])

  const appendAdaptivePlanTasks = useCallback((tasks: StoredAdaptivePlanTask[]) => {
    if (!tasks.length) return
    setAdaptivePlanTasks((prev) => [...prev, ...tasks])
  }, [])

  const appendActionGuideDemoTimeline = useCallback((entry: ActionGuideDemoTimelineEntry) => {
    setActionGuideDemoTimeline((prev) => [...prev, entry].slice(-48))
  }, [])

  const submitAskFollowUp = useCallback(
    (chipId: FollowUpChipId | null, customText: string) => {
      if (!mirrorResult) return { ok: false as const, message: "No case loaded." }
      const packet = buildCaregiverResultPacket(mirrorResult, isBackupDemoMirror)
      const res = createFollowUpResponseItem({
        chipId,
        customText,
        packet,
        mirrorResult,
        cancerType,
        lovedOneLabel,
        caseInformationUpdates,
        planResult,
        adaptivePlanTasks,
        completedPlanTaskIds,
      })
      if (res.ok) setFollowUpResponses((prev) => [res.item, ...prev])
      return res
    },
    [
      adaptivePlanTasks,
      cancerType,
      caseInformationUpdates,
      completedPlanTaskIds,
      isBackupDemoMirror,
      lovedOneLabel,
      mirrorResult,
      planResult,
    ],
  )

  const markPlanTaskDone = useCallback((taskId: string) => {
    if (taskId.startsWith("demo-quick-")) return
    setCompletedPlanTaskIds((prev) => (prev.includes(taskId) ? prev : [...prev, taskId]))
  }, [])

  const beginVoiceFollowUp = useCallback(() => {
    voiceFollowUpRef.current = true
    setCopied(null)
    if (!isSessionActive) {
      handleStartStopClick()
    } else {
      setPhase("recording")
    }
  }, [handleStartStopClick, isSessionActive])

  const processRant = useCallback(async (transcript: string) => {
    setPhase("processing")
    setError(null)
    setWorkspaceTab("today")
    setToolPanel(null)
    setResultsTranscriptEcho("")
    setPlanResult(null)
    setIsBackupDemoMirror(false)
    setCaseInformationUpdates([])
    setCompletedPlanTaskIds([])
    setAdaptivePlanTasks([])
    setActionGuideDemoTimeline([])
    setFollowUpResponses([])

    const useSarahFallbackMirror = (echoFromUser?: string) => {
      setMirrorResult(SARAH_MIRROR_RESULT)
      setIsBackupDemoMirror(true)
      const echo = (echoFromUser?.trim() || SARAH_DEMO_CONCERN).slice(0, 500)
      setResultsTranscriptEcho(echo)
      setPhase("results")
    }

    try {
      let mirrorRes: Response
      try {
        ;[mirrorRes] = await Promise.all([
          fetch("/api/mirror", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript, cancerType, pathologyText }),
          }),
          fetch("/api/fear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transcript,
              sessionId,
              contextTag: `${lovedOne}-${cancerType}-night-note`,
              ...(userId ? { userId } : {}),
            }),
          }),
        ])
      } catch (networkErr) {
        console.error(networkErr)
        useSarahFallbackMirror(transcript)
        return
      }

      if (!mirrorRes.ok) {
        useSarahFallbackMirror(transcript)
        return
      }

      let parsed: unknown
      try {
        parsed = JSON.parse(await mirrorRes.text()) as unknown
      } catch {
        useSarahFallbackMirror(transcript)
        return
      }

      if (!isValidMirrorResult(parsed)) {
        useSarahFallbackMirror(transcript)
        return
      }

      setMirrorResult(parsed)
      setIsBackupDemoMirror(false)
      rememberFear(parsed)
      setResultsTranscriptEcho(transcript.trim().slice(0, 500))
      setPhase("results")
    } catch (err) {
      console.error(err)
      useSarahFallbackMirror(transcript)
    }
  }, [cancerType, lovedOne, pathologyText, rememberFear, sessionId, userId])

  const showSarahBackupDemo = useCallback(() => {
    setMirrorResult(SARAH_MIRROR_RESULT)
    setIsBackupDemoMirror(true)
    setPlanResult(null)
    setError(null)
    setCaseInformationUpdates([])
    setCompletedPlanTaskIds([])
    setAdaptivePlanTasks([])
    setActionGuideDemoTimeline([])
    setFollowUpResponses([])
    setWorkspaceTab("today")
    setToolPanel(null)
    setResultsTranscriptEcho(SARAH_DEMO_CONCERN)
    setPhase("results")
  }, [])

  useEffect(() => {
    if (wasActiveRef.current && !isSessionActive) {
      const transcript = transcriptRef.current
      transcriptRef.current = ""

      if (voiceFollowUpRef.current) {
        voiceFollowUpRef.current = false
        const trimmed = transcript.trim()
        if (trimmed.length > 5) {
          const delta = getDemoCaseDeltaFromCustomNote(trimmed)
          const id =
            typeof globalThis.crypto !== "undefined" && globalThis.crypto.randomUUID
              ? globalThis.crypto.randomUUID()
              : `voice-${Date.now()}`
          appendDemoCaseUpdate({
            id,
            sourceLabel: "Voice note",
            ...delta,
          })
          appendAdaptivePlanTasks(buildAdaptiveTasksFromCustomPlanNote(trimmed))
        }
        setPhase("results")
        return
      }

      if (transcript.length > 20) {
        processRant(transcript)
      } else {
        setPhase("idle")
      }
    }

    wasActiveRef.current = isSessionActive
    if (isSessionActive) setPhase("recording")
  }, [appendAdaptivePlanTasks, appendDemoCaseUpdate, isSessionActive, processRant, transcriptRef])

  async function requestPlan() {
    if (!mirrorResult) return

    setIsPlanning(true)
    setError(null)

    const applySarahPlanFallback = () => {
      setPlanResult(SARAH_FALLBACK_PLAN_RESULT as PlanResult)
    }

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fearSummary: mirrorResult.fearSummary,
          cancerType,
          pathologyText,
          sessionId,
        }),
      })

      if (!response.ok) {
        if (isBackupDemoMirror) {
          applySarahPlanFallback()
        } else {
          throw new Error("Plan API failed")
        }
        return
      }

      let parsed: unknown
      try {
        parsed = JSON.parse(await response.text()) as unknown
      } catch {
        if (isBackupDemoMirror) {
          applySarahPlanFallback()
        } else {
          throw new Error("Plan JSON invalid")
        }
        return
      }

      setPlanResult(parsed as PlanResult)
    } catch (err) {
      console.error(err)
      if (isBackupDemoMirror) {
        applySarahPlanFallback()
      } else {
        setError("The 72-hour plan did not land. Try once more when you are ready.")
      }
    } finally {
      setIsPlanning(false)
    }
  }

  async function uploadPathology(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadState("uploading")
    setUploadLabel(file.name)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("sessionId", sessionId)
    formData.append("cancerType", cancerType)

    try {
      const response = await fetch("/api/ingest", { method: "POST", body: formData })
      if (!response.ok) throw new Error("Ingest failed")
      setUploadState("done")
    } catch (err) {
      console.error(err)
      setUploadState("error")
      setError("The pathology upload could not be read yet. You can still speak, or paste a few lines below.")
    } finally {
      event.target.value = ""
    }
  }

  async function copyText(
    kind: ResultCopyKind,
    value: string,
    timelineTitle?: string,
    timelineMeta?: CopyTimelineMeta,
  ) {
    if (!value) return

    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 1800)
      if (timelineTitle) {
        const id =
          typeof globalThis.crypto !== "undefined" && globalThis.crypto.randomUUID
            ? globalThis.crypto.randomUUID()
            : `tl-${Date.now()}`
        const badge = timelineMeta?.badge ?? "Records"
        const taskId = timelineMeta?.taskId ?? "records-activity"
        appendActionGuideDemoTimeline({
          id,
          taskId,
          taskTitle: timelineTitle,
          badge,
          savedAt: new Date().toISOString(),
        })
      }
    } catch {
      setError("Clipboard permission was blocked. The note is still visible here.")
    }
  }

  function handleCancerTypeChange(value: CancerType) {
    setCancerType(value)
    if (onboarded) window.localStorage.setItem(STORAGE_KEYS.cancerType, value)
  }

  function finishOnboarding() {
    const name = caregiverName.trim()
    if (!name || !relationship) return

    window.localStorage.setItem(STORAGE_KEYS.name, name)
    window.localStorage.setItem(STORAGE_KEYS.relationship, relationship)
    window.localStorage.setItem(STORAGE_KEYS.cancerType, cancerType)
    window.localStorage.setItem(STORAGE_KEYS.onboarded, "true")
    setCaregiverName(name)
    setOnboarded(true)

    if (userId) {
      getDatabases()
        .createDocument(DB_ID, COLLECTIONS.profiles, userId, {
          userId,
          name,
          relationship,
          cancerType,
        })
        .catch((e: unknown) => console.error("[profile] Appwrite save failed:", e))
    }
  }

  function startOver() {
    Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
    window.localStorage.removeItem(ANCHOR_DEMO_CASE_KEY)
    setCaregiverName("")
    setRelationship(null)
    setCancerType("colon")
    setOnboarded(false)
    setOnboardingStep("name")
    setMirrorResult(null)
    setPlanResult(null)
    setError(null)
    setShowExampleOutput(false)
    setIsBackupDemoMirror(false)
    setCaseInformationUpdates([])
    setCompletedPlanTaskIds([])
    setAdaptivePlanTasks([])
    setActionGuideDemoTimeline([])
    setFollowUpResponses([])
    setFamilyCoordBoard(createDefaultFamilyCoordBoard())
    setWorkspaceTab("today")
    setToolPanel(null)
    setResultsTranscriptEcho("")
    setFearTimeline([])
    setJournalEntries([])
    setOneThingCount(0)
    setOneThingUsed([])
    setCurrentOneThing(pickOneThing([]))
    setActiveScreen(null)
    setPhase("idle")

    if (userId) {
      getAccount().deleteSession("current").catch(() => {})
    }
    setUserId(null)
    setAuthStatus("auth")
    setAuthEmail("")
    setMagicLinkSent(false)
    setEmailOtpUserId(null)
    setEmailOtpCode("")
    setEmailOtpVerifying(false)
    setWelcomeBack(false)
  }

  function resetVoice() {
    setMirrorResult(null)
    setPlanResult(null)
    setError(null)
    setCopied(null)
    setShowExampleOutput(false)
    setIsBackupDemoMirror(false)
    setCaseInformationUpdates([])
    setCompletedPlanTaskIds([])
    setAdaptivePlanTasks([])
    setActionGuideDemoTimeline([])
    setFollowUpResponses([])
    setFamilyCoordBoard(createDefaultFamilyCoordBoard())
    setWorkspaceTab("today")
    setToolPanel(null)
    setResultsTranscriptEcho("")
    setPhase("idle")
  }

  async function loadAuthenticatedUserData(currentUserId: string) {
    try {
      const profile = await getDatabases().getDocument(DB_ID, COLLECTIONS.profiles, currentUserId)
      const pName = profile.name as string
      const pRelationship = profile.relationship as string
      const pCancerType = profile.cancerType as string

      if (pName) setCaregiverName(pName)
      if (isRelationship(pRelationship)) setRelationship(pRelationship)
      if (isCancerType(pCancerType)) setCancerType(pCancerType)

      try {
        const journalDocs = await getDatabases().listDocuments(DB_ID, COLLECTIONS.journal, [
          Query.equal("userId", currentUserId),
          Query.orderDesc("timestamp"),
          Query.limit(10),
        ])
        setJournalEntries(
          journalDocs.documents.map((doc: Record<string, unknown>) => ({
            id: doc.$id as string,
            text: doc.content as string,
            date: doc.timestamp as string,
          }))
        )
      } catch {
        setJournalEntries(parseJson<JournalEntry[]>(window.localStorage.getItem(STORAGE_KEYS.journal), []))
      }

      try {
        const fearDocs = await getDatabases().listDocuments(DB_ID, COLLECTIONS.fears, [
          Query.equal("userId", currentUserId),
          Query.orderDesc("timestamp"),
          Query.limit(6),
        ])
        setFearTimeline(
          fearDocs.documents.map((doc: Record<string, unknown>) => ({
            id: doc.$id as string,
            quote: doc.fearQuote as string,
            summary: doc.fearSummary as string,
            date: doc.timestamp as string,
          }))
        )
      } catch {
        setFearTimeline(parseJson<FearMemory[]>(window.localStorage.getItem(STORAGE_KEYS.fears), []))
      }

      setOnboarded(true)
      setWelcomeBack(true)
      window.setTimeout(() => setWelcomeBack(false), 2000)
    } catch {
      setFearTimeline(parseJson<FearMemory[]>(window.localStorage.getItem(STORAGE_KEYS.fears), []))
      setJournalEntries(parseJson<JournalEntry[]>(window.localStorage.getItem(STORAGE_KEYS.journal), []))
      setOnboarded(false)
      setOnboardingStep("name")
    }
  }

  async function sendMagicLink() {
    if (!authEmail.trim()) return
    setAuthSending(true)
    setAuthError(null)
    try {
      const redirectUrl = window.location.origin + window.location.pathname
      const email = authEmail.trim()
      await getAccount().createMagicURLToken(ID.unique(), email, redirectUrl)
      const token = await getAccount().createEmailToken(ID.unique(), email)
      setEmailOtpUserId(token.userId)
      setEmailOtpCode("")
      setMagicLinkSent(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not send magic link. Try again."
      setAuthError(msg)
    } finally {
      setAuthSending(false)
    }
  }

  async function verifyEmailOtp(code = emailOtpCode) {
    if (!emailOtpUserId || code.length !== 6) return
    setEmailOtpVerifying(true)
    setAuthError(null)
    try {
      await getAccount().createSession(emailOtpUserId, code)
      const user = await getAccount().get()
      setUserId(user.$id)
      await loadAuthenticatedUserData(user.$id)
      setShowAuthModal(false)
      setAuthStatus("authenticated")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "That code did not work. Check it and try again."
      setAuthError(msg)
    } finally {
      setEmailOtpVerifying(false)
    }
  }

  function updateEmailOtpCode(value: string) {
    const next = value.replace(/\D/g, "").slice(0, 6)
    setEmailOtpCode(next)
    if (next.length === 6) void verifyEmailOtp(next)
  }

  function continueAsGuest() {
    setAuthStatus("guest")
  }

  function showAnchorExample() {
    setCaregiverName("Sarah")
    setRelationship("mom")
    setCancerType("colon")
    setOnboarded(true)
    setAuthStatus("guest")
    setOnboardingStep("relationship")
    setMirrorResult(null)
    setPlanResult(null)
    setError(null)
    setCopied(null)
    setPhase("idle")
    setShowExampleOutput(true)
    setIsBackupDemoMirror(false)
    setCaseInformationUpdates([])
    setCompletedPlanTaskIds([])
    setAdaptivePlanTasks([])
    setActionGuideDemoTimeline([])
    setFollowUpResponses([])
    setWorkspaceTab("today")
    setToolPanel(null)
    setResultsTranscriptEcho("")
  }

  function resetMagicLink() {
    setMagicLinkSent(false)
    setAuthEmail("")
    setEmailOtpUserId(null)
    setEmailOtpCode("")
    setEmailOtpVerifying(false)
    setAuthError(null)
  }

  function saveJournalEntry(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    const entry: JournalEntry = {
      id: `${Date.now()}`,
      text: trimmed,
      date: new Date().toISOString(),
    }

    setJournalEntries((current) => {
      const next = [entry, ...current].slice(0, 10)
      window.localStorage.setItem(STORAGE_KEYS.journal, JSON.stringify(next))
      return next
    })

    if (userId) {
      getDatabases()
        .createDocument(DB_ID, COLLECTIONS.journal, ID.unique(), {
          userId,
          content: trimmed,
          prompt: SAY_PROMPTS[new Date().getMinutes() % SAY_PROMPTS.length],
          timestamp: entry.date,
          kept: true,
        })
        .catch((e: unknown) => console.error("[journal] Appwrite save failed:", e))
    }
  }

  function completeOneThing() {
    const nextCount = oneThingCount + 1
    const nextUsedRaw = [...oneThingUsed, currentOneThing]
    const nextUsed = nextUsedRaw.length >= ONE_THING_ITEMS.length ? [] : nextUsedRaw
    const nextThing = pickOneThing(nextUsed)

    setOneThingCount(nextCount)
    setOneThingUsed(nextUsed)
    setCurrentOneThing(nextThing)
    window.localStorage.setItem(STORAGE_KEYS.oneThingCount, String(nextCount))
    window.localStorage.setItem(STORAGE_KEYS.oneThingUsed, JSON.stringify(nextUsed))
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-[#fbf7f0]">
        <AmbientOrbs />
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf7f0] text-[#242230]">
      <AmbientOrbs />

      <AnimatePresence mode="wait">
        {authStatus === "auth" ? (
          <AuthScreen
            key="auth"
            email={authEmail}
            error={authError}
            isOtpVerifying={emailOtpVerifying}
            isSending={authSending}
            magicLinkSent={magicLinkSent}
            onContinueAsGuest={continueAsGuest}
            onEmailChange={setAuthEmail}
            onOtpChange={updateEmailOtpCode}
            onResetMagicLink={resetMagicLink}
            onSendMagicLink={sendMagicLink}
            onSeeExample={showAnchorExample}
            onVerifyOtp={() => void verifyEmailOtp()}
            otpCode={emailOtpCode}
          />
        ) : welcomeBack ? (
          <WelcomeBackScreen key="welcome-back" name={displayName} />
        ) : !onboarded ? (
          <Onboarding
            key="onboarding"
            caregiverName={caregiverName}
            cancerType={cancerType}
            onCancerTypeChange={handleCancerTypeChange}
            onContinueName={() => {
              if (caregiverName.trim()) setOnboardingStep("relationship")
            }}
            onFinish={finishOnboarding}
            onNameChange={setCaregiverName}
            onboardingStep={onboardingStep}
            relationship={relationship}
            setRelationship={setRelationship}
          />
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-8 sm:py-6 lg:px-10"
          >
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div>
                <p className="m-0 font-mono text-xs tracking-[0.18em] text-[#8f7e9b]">ANCHOR</p>
                <p className="m-0 mt-0.5 text-xs text-[#756f68] sm:mt-1 sm:text-sm">{currentDateLabel()}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {authStatus === "guest" && (
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="text-left text-xs text-[#8f7e9b] underline decoration-[#c9b8d8]/60 underline-offset-4 transition hover:text-[#6f6280] sm:text-sm"
                  >
                    Save across devices →
                  </button>
                )}
                <div className="flex flex-col items-end gap-0.5">
                  <button
                    type="button"
                    onClick={startOver}
                    className="text-left text-xs text-[#756f68] underline decoration-[#c9b8d8]/60 underline-offset-4 transition hover:text-[#242230] sm:text-sm"
                  >
                    {showExampleOutput ? "Exit demo · Start over →" : `Not ${displayName}? Start over`}
                  </button>
                  <span className="max-w-[14rem] text-right text-[10px] leading-snug text-[#a09a93] sm:max-w-xs sm:text-[11px]">
                    Start over clears this demo case.
                  </span>
                </div>
              </div>
            </header>

            <div className="grid flex-1 gap-5 py-5 sm:gap-8 sm:py-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:py-12">
              <section className="min-w-0">
                <AnimatePresence mode="wait">
                  {phase === "idle" && (
                    <IdleView
                      cancerType={cancerType}
                      displayName={displayName}
                      handleStartStopClick={handleStartStopClick}
                      lovedOne={lovedOne}
                      lovedOneLabel={lovedOneLabel}
                      onCancerTypeChange={handleCancerTypeChange}
                      error={error}
                      onSarahBackupDemo={showSarahBackupDemo}
                      showExampleOutput={showExampleOutput}
                    />
                  )}

                  {phase === "recording" && (
                    <RecordingView
                      displayName={displayName}
                      lovedOne={lovedOne}
                      cancerType={cancerType}
                      latestUserLine={latestUserLine}
                      onStop={handleStartStopClick}
                      voiceEnergy={voiceEnergy}
                    />
                  )}

                  {phase === "processing" && <ProcessingView phrase={PROCESSING_PHRASES[processingPhraseIndex]} />}

                  {phase === "results" && mirrorResult && (
                    <ResultsView
                      actionGuideDemoTimeline={actionGuideDemoTimeline}
                      adaptivePlanTasks={adaptivePlanTasks}
                      appendActionGuideDemoTimeline={appendActionGuideDemoTimeline}
                      appendAdaptivePlanTasks={appendAdaptivePlanTasks}
                      appendDemoCaseUpdate={appendDemoCaseUpdate}
                      cancerType={cancerType}
                      caseInformationUpdates={caseInformationUpdates}
                      completedPlanTaskIds={completedPlanTaskIds}
                      copied={copied}
                      displayName={displayName}
                      error={error}
                      familyCoordBoard={familyCoordBoard}
                      followUpResponses={followUpResponses}
                      handoffText={handoffText}
                      isBackupDemoMirror={isBackupDemoMirror}
                      isPlanning={isPlanning}
                      lovedOne={lovedOne}
                      markPlanTaskDone={markPlanTaskDone}
                      mirrorResult={mirrorResult}
                      noteText={noteText}
                      onAddByVoice={beginVoiceFollowUp}
                      onAskFollowUpSubmit={submitAskFollowUp}
                      onCopy={copyText}
                      onOpenToolPanel={(panel) => {
                        setWorkspaceTab("tools")
                        setToolPanel(panel)
                      }}
                      onPlan={requestPlan}
                      onSarahBackupDemo={showSarahBackupDemo}
                      onStartOver={startOver}
                      onWorkspaceTabChange={(tab) => {
                        setWorkspaceTab(tab)
                        if (tab !== "tools") setToolPanel(null)
                      }}
                      planResult={planResult}
                      resultsTranscriptEcho={resultsTranscriptEcho}
                      setFamilyCoordBoard={setFamilyCoordBoard}
                      toolPanel={toolPanel}
                      workspaceTab={workspaceTab}
                    />
                  )}
                </AnimatePresence>
              </section>

              <SidePanel
                fearTimeline={fearTimeline}
                onUpload={uploadPathology}
                pathologyText={pathologyText}
                setPathologyText={setPathologyText}
                uploadLabel={uploadLabel}
                uploadState={uploadState}
              />
            </div>

            <CompanionNav onOpen={setActiveScreen} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeScreen && (
          <CompanionOverlay
            activeScreen={activeScreen}
            breathCycles={breathCycles}
            breathStep={breathStep}
            cancerType={cancerType}
            currentOneThing={currentOneThing}
            journalEntries={journalEntries}
            onClose={() => setActiveScreen(null)}
            onCompleteOneThing={completeOneThing}
            onSaveJournal={saveJournalEntry}
            oneThingCount={oneThingCount}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#fbf7f0]/90 p-4 backdrop-blur-[12px] sm:p-5"
          >
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute right-3 top-3 rounded-full p-2 text-[#756f68] transition hover:text-[#242230] sm:right-5 sm:top-5"
              aria-label="Close"
            >
              ✕
            </button>
            <AuthScreen
              email={authEmail}
              error={authError}
              isOtpVerifying={emailOtpVerifying}
              isSending={authSending}
              magicLinkSent={magicLinkSent}
              onContinueAsGuest={() => setShowAuthModal(false)}
              onEmailChange={setAuthEmail}
              onOtpChange={updateEmailOtpCode}
              onResetMagicLink={resetMagicLink}
              onSendMagicLink={sendMagicLink}
              onVerifyOtp={() => void verifyEmailOtp()}
              otpCode={emailOtpCode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes cloud-drift-a {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(4vw, 3vh, 0) scale(1.08); }
        }
        @keyframes cloud-drift-b {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-4vw, 4vh, 0) scale(1.06); }
        }
        @keyframes cloud-drift-c {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(3vw, -3vh, 0) scale(1.1); }
        }
        .ambient-orb {
          will-change: transform;
        }
        .cloud-orb-a {
          left: -7rem;
          top: 12vh;
          animation: cloud-drift-a 24s ease-in-out infinite;
        }
        .cloud-orb-b {
          right: -8rem;
          top: 22vh;
          animation: cloud-drift-b 28s ease-in-out infinite;
        }
        .cloud-orb-c {
          left: 38vw;
          bottom: -7rem;
          animation: cloud-drift-c 26s ease-in-out infinite;
        }
      `}</style>
    </main>
  )
}

function Onboarding({
  caregiverName,
  cancerType,
  onCancerTypeChange,
  onContinueName,
  onFinish,
  onNameChange,
  onboardingStep,
  relationship,
  setRelationship,
}: {
  caregiverName: string
  cancerType: CancerType
  onCancerTypeChange: (value: CancerType) => void
  onContinueName: () => void
  onFinish: () => void
  onNameChange: (value: string) => void
  onboardingStep: OnboardingStep
  relationship: RelationshipValue | null
  setRelationship: (value: RelationshipValue) => void
}) {
  return (
    <motion.section
      key="onboarding"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.65 }}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:py-16"
    >
      <AnimatePresence mode="wait">
        {onboardingStep === "name" ? (
          <motion.div
            key="name"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
            className={`${GLASS_PANEL} w-full max-w-lg rounded-[32px] p-7 sm:max-w-4xl sm:rounded-[40px] sm:p-12`}
          >
            <p className="mb-4 font-mono text-xs tracking-[0.18em] text-[#8f7e9b] sm:mb-6">FIRST, THE PERSON HOLDING IT TOGETHER</p>
            <h1 className={`max-w-3xl text-3xl font-normal leading-tight sm:text-5xl lg:text-7xl ${SOFT_GRADIENT_TEXT}`}>
              What should Anchor call you?
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#5f5a55] sm:mt-6 sm:text-lg sm:leading-8">
              Anchor is an AI companion for the family member navigating a loved one&apos;s cancer diagnosis.
              Speak your fear, get clinically grounded, and leave with the next moves to take.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:mt-12 sm:flex-row sm:gap-5">
              <input
                autoFocus
                value={caregiverName}
                onChange={(event) => onNameChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onContinueName()
                }}
                placeholder="Sarah"
                className="min-h-[64px] flex-1 border-b border-[#c9b8d8]/70 bg-transparent text-4xl text-[#242230] outline-none placeholder:text-[#b9afa7] focus:border-[#b98da0] sm:min-h-20 sm:text-5xl lg:text-6xl"
              />
              <button
                type="button"
                onClick={onContinueName}
                disabled={!caregiverName.trim()}
                className="flex w-full items-center justify-center gap-3 rounded-[26px] border border-white/80 bg-[#b7a6c9] px-7 py-4 text-base text-white shadow-[0_20px_58px_rgba(151,128,163,0.24)] transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-5 sm:text-lg"
              >
                Continue
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="relationship"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg sm:max-w-6xl"
          >
            <p className="mb-3 font-mono text-xs tracking-[0.18em] text-[#8f7e9b] sm:mb-5">NOW NAME THE CARE CONTEXT</p>
            <h1 className={`overflow-visible px-0.5 pb-1 text-3xl font-normal leading-tight sm:text-5xl lg:text-7xl ${SOFT_GRADIENT_TEXT}`}>Who was diagnosed?</h1>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:mt-9 sm:gap-3 lg:grid-cols-4">
              {RELATIONSHIPS.map((item, index) => (
                <motion.button
                  type="button"
                  key={item.value}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.5 }}
                  onClick={() => setRelationship(item.value)}
                  whileHover={{ scale: 1.03, y: -6 }}
                  className={`min-h-[100px] rounded-[22px] p-4 text-left backdrop-blur-[20px] transition duration-300 sm:min-h-40 sm:rounded-[30px] sm:p-5 ${
                    relationship === item.value
                      ? "border border-[#c9b8d8] bg-white/75 shadow-[0_24px_76px_rgba(178,150,176,0.22)]"
                      : "border border-white/70 bg-white/60 shadow-[0_16px_50px_rgba(116,100,91,0.1)] hover:border-[#c9b8d8]/80"
                  }`}
                >
                  <span className="block text-lg text-[#242230] sm:text-2xl">{item.label}</span>
                  <span className="mt-2 block text-xs leading-5 text-[#756f68] sm:mt-4 sm:text-sm sm:leading-6">{item.note}</span>
                </motion.button>
              ))}
            </div>

            <div className={`${GLASS_PANEL} mt-4 rounded-[26px] p-5 sm:mt-6 sm:rounded-[32px]`}>
              <p className="mb-3 font-mono text-xs tracking-[0.16em] text-[#8f7e9b]">CANCER TYPE</p>
              <CancerTypeSelector cancerType={cancerType} onChange={onCancerTypeChange} />
              <button
                type="button"
                onClick={onFinish}
                disabled={!relationship}
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-[26px] border border-white/80 bg-[#b7a6c9] px-6 py-4 text-white shadow-[0_20px_58px_rgba(151,128,163,0.24)] transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:mt-5 sm:w-auto"
              >
                Enter Anchor
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

function IdleView({
  cancerType,
  displayName,
  error,
  handleStartStopClick,
  lovedOne,
  lovedOneLabel,
  onCancerTypeChange,
  onSarahBackupDemo,
  showExampleOutput,
}: {
  cancerType: CancerType
  displayName: string
  error: string | null
  handleStartStopClick: () => void
  lovedOne: string
  lovedOneLabel: string
  onCancerTypeChange: (value: CancerType) => void
  onSarahBackupDemo: () => void
  showExampleOutput: boolean
}) {
  return (
    <motion.div
      key="idle"
      variants={sectionVariants}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -16, transition: { duration: 0.3 } }}
      className="max-w-4xl"
    >
      <motion.p variants={itemVariants} className="mb-4 font-mono text-xs tracking-[0.18em] text-[#8f7e9b] sm:mb-5">
        FOR {displayName.toUpperCase()} AND YOUR {lovedOne.toUpperCase()}
      </motion.p>
      <motion.h1
        variants={itemVariants}
        className={`max-w-4xl overflow-visible px-0.5 pb-1 text-3xl font-normal leading-tight sm:text-5xl lg:text-7xl xl:text-8xl ${SOFT_GRADIENT_TEXT}`}
      >
        What are you carrying right now, {displayName}?
      </motion.h1>
      <motion.p variants={itemVariants} className="mt-4 max-w-2xl text-base leading-7 text-[#5f5a55] sm:mt-7 sm:text-lg sm:leading-8">
        Anchor will listen, reflect the fear, ground it in the clinical path, and give you the next move for your {lovedOneLabel.toLowerCase()}.
      </motion.p>

      <motion.div variants={itemVariants} className={`${GLASS_PANEL} mt-5 rounded-[28px] p-4 sm:mt-9 sm:rounded-[34px] sm:p-5`}>
        <p className="mb-3 font-mono text-xs tracking-[0.16em] text-[#8f7e9b]">DIAGNOSIS CONTEXT</p>
        <CancerTypeSelector cancerType={cancerType} onChange={onCancerTypeChange} />
      </motion.div>

      {showExampleOutput && <ExampleOutputPanel />}

      <motion.div variants={itemVariants} className="mt-5 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-4">
        <button
          type="button"
          onClick={handleStartStopClick}
          className="group flex w-full items-center justify-between rounded-[28px] border border-white/80 bg-[#b7a6c9] px-6 py-5 text-left text-white shadow-[0_24px_72px_rgba(151,128,163,0.26)] transition duration-300 hover:-translate-y-0.5 active:scale-[0.98] hover:shadow-[0_30px_86px_rgba(151,128,163,0.3)] sm:w-auto sm:min-w-80 sm:rounded-[32px] sm:px-7 sm:py-6"
        >
          <span>
            <span className="block text-lg sm:text-xl">Start speaking</span>
            <span className="mt-1 block text-sm text-white/80">Anchor listens until you tap stop.</span>
          </span>
          <Mic className="h-6 w-6 shrink-0 transition group-hover:scale-110" />
        </button>
        <p className="max-w-sm text-xs leading-5 text-[#756f68] sm:text-sm sm:leading-6">
          Keep it messy. The transcript becomes your grounded note.
        </p>
      </motion.div>
      {showExampleOutput && (
        <p className="mt-3 text-xs leading-6 text-[#756f68] sm:text-sm">
          This is a live demo — speak your own concern to try it yourself, or Start over to enter your own details. Sarah is an adult child supporting her mom before a tomorrow-morning visit (sample colon scenario).
        </p>
      )}

      {(showExampleOutput || error) && (
        <motion.div variants={itemVariants} className="mt-5 sm:mt-6">
          <button
            type="button"
            onClick={onSarahBackupDemo}
            className={`${GLASS_BUTTON} w-full rounded-[26px] px-6 py-3.5 text-sm text-[#3f3a36] sm:w-auto sm:py-3`}
          >
            {showExampleOutput ? "Show Sarah demo result" : "Use backup demo"}
          </button>
        </motion.div>
      )}

      {error && <ErrorText message={error} />}
    </motion.div>
  )
}

function ExampleOutputPanel() {
  return (
    <motion.div variants={itemVariants} className={`${GLASS_PANEL} mt-5 rounded-[28px] p-4 sm:mt-8 sm:rounded-[34px] sm:p-5`}>
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="m-0 font-mono text-[0.65rem] leading-relaxed tracking-[0.12em] text-[#8f7e9b] sm:text-xs sm:tracking-[0.16em]">
          SAMPLE INPUT (SARAH · ADULT CHILD · MOM · COLON · TOMORROW MORNING)
        </p>
        <span className="w-fit rounded-full border border-[#c9b8d8]/60 bg-white/60 px-3 py-1 font-mono text-[0.65rem] tracking-[0.12em] text-[#8f7e9b] sm:text-[0.68rem] sm:tracking-[0.14em]">
          EXAMPLE · Try it yourself below
        </span>
      </div>
      <blockquote
        className={`m-0 max-w-3xl px-0.5 pb-1 text-xl font-normal leading-tight sm:text-3xl lg:text-4xl ${SOFT_GRADIENT_TEXT}`}
      >
        &quot;{EXAMPLE_INPUT}&quot;
      </blockquote>

      <div className="mt-7 grid gap-4">
        <ResultBand label="WHAT ANCHOR HEARS" icon={<HeartHandshake className="h-5 w-5" />}>
          {EXAMPLE_MIRROR_RESULT.mirror}
        </ResultBand>
        <ResultBand label="WHAT WE KNOW AND WHAT STILL NEEDS CONFIRMATION" icon={<ShieldCheck className="h-5 w-5" />}>
          {EXAMPLE_MIRROR_RESULT.ground}
        </ResultBand>
      </div>

      <div className="mt-7">
        <p className="mb-4 font-mono text-xs tracking-[0.16em] text-[#8f7e9b]">NEXT MOVES FOR TOMORROW&apos;S VISIT</p>
        <div className="grid gap-3">
          {EXAMPLE_MIRROR_RESULT.actions.map((action, index) => (
            <ExpandableActionItem
              action={action}
              emphasizedPrefix={EXAMPLE_ACTION_PREFIXES[index]}
              index={index}
              key={action}
              script={EXAMPLE_ACTION_SCRIPTS[index]}
              variant="example"
            />
          ))}
        </div>
      </div>

      <div className="mt-7">
        <p className="mb-3 font-mono text-xs tracking-[0.16em] text-[#8f7e9b]">ORIENTATION</p>
        <div className="space-y-1 text-sm leading-6 text-[#756f68]">
          {SARAH_DEMO_ORIENTATION_LINES.map((source) => (
            <p className="m-0" key={source}>· {source}</p>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-[#756f68]">
          Anchor helps families prepare for doctors. This is support for orientation and preparation, not emergency care or a substitute for your oncology team.
        </p>
      </div>
    </motion.div>
  )
}

function CancerTypeSelector({ cancerType, onChange }: { cancerType: CancerType; onChange: (value: CancerType) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {CANCER_TYPES.map((item) => (
        <button
          type="button"
          key={item.value}
          onClick={() => onChange(item.value)}
          className={`rounded-[18px] p-3 text-left transition duration-300 hover:-translate-y-0.5 active:scale-[0.97] sm:rounded-[24px] sm:p-4 ${
            cancerType === item.value
              ? "border border-[#c9b8d8] bg-white/78 text-[#242230] shadow-[0_16px_48px_rgba(178,150,176,0.18)]"
              : "border border-white/70 bg-white/50 text-[#3f3a36] shadow-[0_10px_30px_rgba(116,100,91,0.08)]"
          }`}
        >
          <span className="block text-sm font-medium sm:text-lg">{item.label}</span>
          <span className="mt-1 block text-[11px] leading-4 text-[#756f68] sm:mt-2 sm:text-sm sm:leading-5">{item.detail}</span>
        </button>
      ))}
    </div>
  )
}

function RecordingView({
  cancerType,
  displayName,
  latestUserLine,
  lovedOne,
  onStop,
  voiceEnergy,
}: {
  cancerType: CancerType
  displayName: string
  latestUserLine?: string
  lovedOne: string
  onStop: () => void
  voiceEnergy: number
}) {
  return (
    <motion.div
      key="recording"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.65 }}
      className="max-w-4xl"
    >
      <p className="mb-4 font-mono text-xs tracking-[0.18em] text-[#8f7e9b] sm:mb-5">LISTENING</p>
      <h1 className={`text-3xl font-normal leading-tight sm:text-5xl lg:text-7xl ${SOFT_GRADIENT_TEXT}`}>
        Say the unedited version, {displayName}.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#5f5a55] sm:mt-6 sm:text-lg sm:leading-8">
        Anchor is listening for the fear under the fear, then grounding it for your {lovedOne}&apos;s {cancerType} cancer.
      </p>

      <div className={`${GLASS_PANEL} relative mt-6 grid h-[300px] place-items-center overflow-hidden rounded-[36px] sm:mt-10 sm:h-[390px] sm:rounded-[48px]`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9),rgba(217,203,232,0.2)_54%,rgba(234,210,220,0.18)_78%,rgba(255,255,255,0.42)_100%)]" />
        <motion.div
          animate={{
            scale: 1.04 + voiceEnergy * 0.48,
            opacity: 0.28 + voiceEnergy * 0.32,
          }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute h-52 w-52 rounded-full bg-[#d7cbe8]/60 blur-3xl sm:h-72 sm:w-72"
        />
        <motion.div
          animate={{
            scale: 0.96 + voiceEnergy * 0.4,
            opacity: 0.22 + voiceEnergy * 0.32,
          }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute h-60 w-60 rounded-full bg-[#ead2dc]/52 blur-3xl sm:h-80 sm:w-80"
        />
        <motion.div
          animate={{
            scale: 1 + voiceEnergy * 0.32,
            boxShadow: `0 0 ${48 + voiceEnergy * 90}px rgba(183,166,201,${0.18 + voiceEnergy * 0.18}), 0 0 ${30 + voiceEnergy * 60}px rgba(184,141,160,${0.14 + voiceEnergy * 0.16})`,
          }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative grid h-44 w-44 place-items-center rounded-full border border-white/80 bg-white/70 backdrop-blur-[20px] sm:h-56 sm:w-56"
        >
          <motion.div
            animate={{
              scale: [1, 1.05 + voiceEnergy * 0.16, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-32 w-32 rounded-full bg-[radial-gradient(circle,#fffdf9_0%,#fffdf9_34%,rgba(215,203,232,0.48)_66%,rgba(234,210,220,0.34)_100%)] sm:h-40 sm:w-40"
          />
          <button
            type="button"
            onClick={onStop}
            className="relative z-10 grid h-16 w-16 place-items-center rounded-full border border-white bg-[#242230] text-white shadow-[0_16px_42px_rgba(36,34,48,0.2)] transition hover:scale-105 sm:h-20 sm:w-20"
            aria-label="Stop recording"
          >
            <Square className="h-6 w-6 fill-current sm:h-7 sm:w-7" />
          </button>
        </motion.div>
      </div>

      <div className={`${GLASS_PANEL} mt-4 min-h-16 rounded-[24px] p-4 sm:mt-7 sm:min-h-20 sm:rounded-[30px] sm:p-5`}>
        <p className="m-0 font-mono text-xs tracking-[0.16em] text-[#8f7e9b]">LAST WORDS ANCHOR CAUGHT</p>
        <p className="mt-2 max-w-2xl text-base italic leading-7 text-[#5f5a55] sm:mt-3 sm:text-lg sm:leading-8">
          {latestUserLine || "No need to make it coherent yet. Just start where it hurts."}
        </p>
      </div>
    </motion.div>
  )
}

function ProcessingView({ phrase }: { phrase: string }) {
  return (
    <motion.div
      key="processing"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.7 }}
      className="flex min-h-[380px] max-w-3xl flex-col justify-center sm:min-h-[520px]"
    >
      <div className={`${GLASS_PANEL} mb-6 flex h-20 w-fit items-center gap-2 rounded-[28px] px-5 sm:mb-10 sm:h-28 sm:rounded-[32px] sm:px-8`}>
        {[0, 1, 2, 3, 4].map((index) => (
          <motion.div
            key={index}
            animate={{ height: [30, 104, 42, 76, 30], opacity: [0.35, 0.95, 0.58, 0.8, 0.35] }}
            transition={{ duration: 2.6, repeat: Infinity, delay: index * 0.18, ease: "easeInOut" }}
            className="w-3 rounded-full bg-gradient-to-b from-[#d7cbe8] to-[#d9b8c6] sm:w-4"
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.h1
          key={phrase}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.55 }}
          className={`text-3xl font-normal leading-tight sm:text-5xl lg:text-7xl ${SOFT_GRADIENT_TEXT}`}
        >
          {phrase}
        </motion.h1>
      </AnimatePresence>
      <p className="mt-5 max-w-xl text-base leading-7 text-[#5f5a55] sm:mt-7 sm:text-lg sm:leading-8">
        Anchor is turning what you said into plain-language next steps you can verify with your care team.
      </p>
    </motion.div>
  )
}

const DEFAULT_NEEDS_CONFIRMATION_BULLETS = [
  "What your care team considers confirmed versus still in workup — ask in plain language.",
  "Whether imaging discussed with you is complete and how results will be reviewed.",
  "Whether pathology or biopsy documentation is finalized.",
  "Whether biomarker, MMR, or MSI testing is pending or done, if it applies to your situation.",
  "What decisions are expected at the next visit — and what can reasonably wait.",
]

function isSarahStructuredMirror(m: MirrorResult): boolean {
  return m.fearQuote === SARAH_DEMO_CONCERN || m.mirror === SARAH_DEMO_MIRROR_RESULT.mirror
}

interface CaregiverResultPacket {
  careTeamIntro: string
  careTeamBullets: string[]
  knowNow: string[]
  needsConfirmation: string[]
  planChangeFactors: string[]
  planChangeUrgentNote: string
  notTonight: string[]
  nightNote: NightNoteContent
}

function extractGroundSections(ground: string): { know: string; confirm: string; notTonight: string } {
  const out = { know: "", confirm: "", notTonight: "" }
  const parts = ground.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  for (const p of parts) {
    if (/^what we know right now:/i.test(p)) out.know = p.replace(/^what we know right now:\s*/i, "").trim()
    else if (/^what still needs confirmation/i.test(p)) out.confirm = p.replace(/^what still needs confirmation[^:]*:\s*/i, "").trim()
    else if (/^what does not need/i.test(p)) out.notTonight = p.replace(/^what does not need[^:]*:\s*/i, "").trim()
  }
  return out
}

function sentencesToBullets(text: string, max: number): string[] {
  if (!text) return []
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10)
    .slice(0, max)
}

function splitConfirmBullets(text: string): string[] {
  if (!text) return []
  const byWhether = text.split(/\s+(?=Whether\s)/i).map((s) => s.trim()).filter(Boolean)
  if (byWhether.length > 1) return byWhether.map((s) => (s.endsWith(".") ? s : `${s}.`))
  const byWhat = text.split(/\s+(?=What\s)/i).map((s) => s.trim()).filter(Boolean)
  if (byWhat.length > 1) return byWhat.map((s) => (s.endsWith(".") ? s : `${s}.`))
  return sentencesToBullets(text, 8)
}

function splitNotTonightFromGround(text: string): string[] {
  if (!text) return []
  return text
    .split(/\.\s+(?=(?:You do not need|The goal))/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)
    .map((s) => (s.endsWith(".") ? s : `${s}.`))
}

function fallbackKnowBullets(ground: string): string[] {
  const t = ground.trim()
  if (!t) return ["Confirm the details you have with your care team — Anchor only reflects what you shared."]
  const lines = t.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 8 && l.length < 280)
  if (lines.length >= 2) return lines.slice(0, 5)
  return sentencesToBullets(t, 4).length ? sentencesToBullets(t, 4) : [t.slice(0, 280) + (t.length > 280 ? "…" : "")]
}

function buildCaregiverResultPacket(mirrorResult: MirrorResult, isBackupDemoMirror: boolean): CaregiverResultPacket {
  const sharedAdaptive = {
    careTeamIntro: CARE_TEAM_ALIGNED_INTRO,
    planChangeFactors: PLAN_CHANGE_FACTORS_BULLETS,
    planChangeUrgentNote: PLAN_CHANGE_URGENT_SAFETY,
  }
  if (isBackupDemoMirror || isSarahStructuredMirror(mirrorResult)) {
    return {
      ...sharedAdaptive,
      careTeamBullets: SARAH_CARE_TEAM_CONTEXT_BULLETS,
      knowNow: SARAH_KNOW_NOW_BULLETS,
      needsConfirmation: SARAH_NEEDS_CONFIRMATION_BULLETS,
      notTonight: SARAH_NOT_TONIGHT_BULLETS,
      nightNote: SARAH_NIGHT_NOTE,
    }
  }
  const { know, confirm, notTonight } = extractGroundSections(mirrorResult.ground)
  if (know || confirm || notTonight) {
    const knowBullets = know ? sentencesToBullets(know, 6) : []
    const confBullets = confirm ? splitConfirmBullets(confirm) : []
    const notBullets = notTonight ? splitNotTonightFromGround(notTonight) : []
    return {
      ...sharedAdaptive,
      careTeamBullets: GENERIC_CARE_TEAM_CONTEXT_BULLETS,
      knowNow: knowBullets.length ? knowBullets : fallbackKnowBullets(mirrorResult.ground),
      needsConfirmation: confBullets.length ? confBullets : DEFAULT_NEEDS_CONFIRMATION_BULLETS,
      notTonight: notBullets.length ? notBullets : SARAH_NOT_TONIGHT_BULLETS,
      nightNote: GENERIC_NIGHT_NOTE,
    }
  }
  return {
    ...sharedAdaptive,
    careTeamBullets: GENERIC_CARE_TEAM_CONTEXT_BULLETS,
    knowNow: fallbackKnowBullets(mirrorResult.ground),
    needsConfirmation: DEFAULT_NEEDS_CONFIRMATION_BULLETS,
    notTonight: SARAH_NOT_TONIGHT_BULLETS,
    nightNote: GENERIC_NIGHT_NOTE,
  }
}

const FOLLOW_UP_SAFETY_STANDARD =
  "Anchor helps you prepare questions and organize caregiving information on this device. It does not diagnose, prescribe, recommend treatment, confirm staging, assess emergencies, or replace your clinician."

const FOLLOW_UP_SAFETY_URGENT =
  "If something urgent or severe is happening, use your clinic’s urgent line or emergency services instead of relying on Anchor. Anchor does not triage emergencies."

interface CreateFollowUpInput {
  chipId: FollowUpChipId | null
  customText: string
  packet: CaregiverResultPacket
  mirrorResult: MirrorResult
  cancerType: CancerType
  lovedOneLabel: string
  caseInformationUpdates: DemoCaseUpdate[]
  planResult: PlanResult | null
  adaptivePlanTasks: StoredAdaptivePlanTask[]
  completedPlanTaskIds: string[]
}

type CreateFollowUpResult = { ok: true; item: FollowUpResponseItem } | { ok: false; message: string }

function newFollowUpItemId(): string {
  return typeof globalThis.crypto !== "undefined" && globalThis.crypto.randomUUID
    ? globalThis.crypto.randomUUID()
    : `fu-${Date.now()}`
}

function formatFollowUpClipboard(item: FollowUpResponseItem): string {
  const lines = [
    item.title,
    "",
    item.answer,
    "",
    item.caregiverMeaning ? `What this means for you\n${item.caregiverMeaning}` : "",
    "",
    item.confirmWithTeam?.length
      ? `Confirm with your care team\n${item.confirmWithTeam.map((b) => `• ${b}`).join("\n")}`
      : "",
    "",
    item.exactWords ? `Exact words you could use\n${item.exactWords}` : "",
    "",
    item.bullets?.length ? item.bullets.map((b) => `• ${b}`).join("\n") : "",
    "",
    item.safetyFooter,
  ]
  return lines.filter((l) => l !== "").join("\n").trim()
}

const TERM_GLOSSARY: { test: RegExp; title: string; def: string }[] = [
  {
    test: /\bpatholog(y|ical|ist|ists)?\b/i,
    title: "Pathology",
    def: "Pathology is the lab study of tissue or cells. A pathology report describes what the sample looks like under the microscope in medical language — your care team translates that into what it means for treatment options.",
  },
  {
    test: /\bstag(e|es|ing)\b/i,
    title: "Staging",
    def: "Staging is a structured way clinicians summarize how far a cancer may have spread, based on tests and definitions they use. The exact stage is not something Anchor can confirm — only your care team can, using finalized reports.",
  },
  {
    test: /\bmmr\b/i,
    title: "MMR (mismatch repair)",
    def: "MMR refers to a DNA-repair pathway some tumors are tested for. Results can matter for treatment planning, but the implication is specific to your case — ask your oncologist what your result means for you.",
  },
  {
    test: /\bmsi\b/i,
    title: "MSI (microsatellite instability)",
    def: "MSI is a lab pattern related to how stable certain DNA repeats are in tumor cells. It is often discussed alongside MMR testing. Your team explains whether it is high or stable and what that means for options.",
  },
  {
    test: /\bbioma(rker|arkers)?\b/i,
    title: "Biomarker",
    def: "A biomarker is a measurable signal from labs or tissue (for example proteins or gene patterns) that can help your team choose or sequence treatments. Names and cutoffs vary — confirm interpretation with your oncologist.",
  },
  {
    test: /\bimag(e|ing)|\bscan(s)?\b|\bct\b|\bmri\b|\bpet\b/i,
    title: "Imaging / scans",
    def: "Imaging studies create pictures of the inside of the body. They help your team look for spread or measure response, but reading them belongs to radiology and your treating clinicians — not a caregiver app.",
  },
  {
    test: /\bmargin(s)?\b/i,
    title: "Surgical margin",
    def: "Margins describe whether tumor cells were seen at the edge of removed tissue. “Clear” versus “positive” margins affects next steps, but only your surgeon/pathology team can state what was found in your case.",
  },
  {
    test: /\blymph nodes?\b|\bnode involvement\b/i,
    title: "Lymph nodes",
    def: "Lymph nodes are small immune filters. Cancer findings in nodes can change staging and treatment discussions. Whether nodes are involved is read from pathology and imaging by your care team.",
  },
  {
    test: /\boncolog(y|ist|ists)\b/i,
    title: "Oncology",
    def: "Oncology is the medical specialty focused on cancer treatment planning (such as surgery, systemic therapy, or radiation). Your oncologist coordinates tests and options based on your records.",
  },
  {
    test: /\bsecond opinion\b/i,
    title: "Second opinion",
    def: "A second opinion means another qualified team reviews your records and may suggest the same plan, alternatives, or extra tests. It is a normal part of serious care — ask your primary team how to arrange records.",
  },
  {
    test: /\bcea\b/i,
    title: "CEA (blood marker)",
    def: "CEA is a blood test sometimes tracked in certain colon cancer follow-ups. A single number rarely tells the whole story; trends and context belong to your clinician.",
  },
]

function collectTermDefinitions(text: string): { title: string; def: string }[] {
  const out: { title: string; def: string }[] = []
  for (const g of TERM_GLOSSARY) {
    if (g.test.test(text) && !out.some((o) => o.title === g.title)) out.push({ title: g.title, def: g.def })
  }
  return out.slice(0, 4)
}

function createFollowUpResponseItem(input: CreateFollowUpInput): CreateFollowUpResult {
  const custom = input.customText.trim()
  const stamp = new Date().toISOString()
  const baseConfirm = input.packet.needsConfirmation.slice(0, 5)
  const safeFooter = FOLLOW_UP_SAFETY_STANDARD

  const make = (partial: Omit<FollowUpResponseItem, "id" | "timestamp">): CreateFollowUpResult => ({
    ok: true,
    item: { id: newFollowUpItemId(), timestamp: stamp, ...partial },
  })

  if (custom && !input.chipId) {
    const low = custom.toLowerCase()

    if (/\burgent\b|\bsevere\b|\bworse\b|\bemergency\b|\b911\b|\ber\b|\bpain\b|\bfever\b|\bbleeding\b/.test(low)) {
      return make({
        kind: "custom",
        questionLabel: custom.slice(0, 200),
        title: "Urgent or severe symptoms",
        answer:
          "If symptoms are severe, sudden, or rapidly worsening, your local emergency resources or clinic urgent line is the right path. Anchor cannot assess acuity or tell you to wait.",
        caregiverMeaning:
          "It is reasonable to pause app planning and use the phone tree your team gave you — that is not overreacting.",
        confirmWithTeam: [
          "Given what is happening now, should we use the after-hours line, go to urgent care, or call emergency services?",
        ],
        exactWords:
          "Given these symptoms, what should we do in the next few minutes to hours — and what signs would mean we should call emergency services?",
        safetyFooter: `${FOLLOW_UP_SAFETY_STANDARD} ${FOLLOW_UP_SAFETY_URGENT}`,
      })
    }

    if (/\bchemo\b|\bchemotherapy\b|\bfolfox\b|\bcapox\b/.test(low)) {
      return make({
        kind: "custom",
        questionLabel: custom.slice(0, 200),
        title: "Chemotherapy questions belong to your oncologist",
        answer:
          "Chemotherapy plans depend on pathology, staging workup, overall health, and team judgment. Anchor cannot say whether chemo is needed, which regimen is right, or how many cycles apply.",
        caregiverMeaning:
          "Your role is often to ask what information is still missing, what side effects to watch for if chemo is discussed, and who to call with urgent symptoms — not to decide the regimen yourself tonight.",
        confirmWithTeam: [
          "What information you are using to decide whether systemic therapy is recommended.",
          "What alternatives or clinical trials, if any, are on the table and how much time you have to decide.",
          "What urgent symptoms should trigger a call or emergency visit.",
        ],
        exactWords:
          "What information are you using to decide whether chemotherapy is part of the plan, and what is still pending before we can understand the recommendation?",
        safetyFooter: safeFooter,
      })
    }

    if (/\bstage\b|\bstaging\b|\bstage\s*i{1,3}\b|\bstage\s*3\b/.test(low)) {
      return make({
        kind: "custom",
        questionLabel: custom.slice(0, 200),
        title: "Staging is confirmed only by your care team",
        answer:
          "Staging labels summarize findings from pathology, imaging, and exam. Until your team states a stage using finalized reports, treat any number you heard as uncertain.",
        caregiverMeaning:
          "You can still prepare: bring reports, write questions, and ask what is confirmed versus still in workup — without needing to “lock in” a stage yourself.",
        confirmWithTeam: baseConfirm.slice(0, 4),
        safetyFooter: safeFooter,
      })
    }

    if (/\bmmr\b|\bmsi\b/.test(low)) {
      return make({
        kind: "custom",
        questionLabel: custom.slice(0, 200),
        title: "MMR / MSI testing",
        answer:
          "MMR and MSI tests look at DNA repair patterns in tumor cells. They can matter for treatment pathways, but results must be interpreted in your chart.",
        caregiverMeaning:
          "Ask whether testing was completed, what the result was in plain language, and whether it changes the next discussion — rather than guessing from online examples.",
        confirmWithTeam: [
          "Has MMR/MSI testing been completed, and who will review the result with us?",
          "Does this result change surveillance, treatment options, or family screening conversations for us?",
        ],
        safetyFooter: safeFooter,
      })
    }

    if (/\bimaging\b|\bscan(s)?\b|\bct\b|\bmri\b|\bpet\b/.test(low)) {
      return make({
        kind: "custom",
        questionLabel: custom.slice(0, 200),
        title: "Imaging and scans",
        answer:
          "Imaging helps your team see structures and spread, but each report is read in context of the full story. Anchor cannot read films or confirm findings.",
        caregiverMeaning:
          "You can request a plain-language summary of what is confirmed, what is pending, and what decisions wait on imaging.",
        confirmWithTeam: [
          "Which imaging studies are complete, and are any still scheduled?",
          "Do current images change the plan discussed with us so far?",
        ],
        safetyFooter: safeFooter,
      })
    }

    if (/\bpathology\b|\bbiopsy\b|\breport\b/.test(low)) {
      return make({
        kind: "custom",
        questionLabel: custom.slice(0, 200),
        title: "Pathology and biopsy reports",
        answer:
          "Pathology reports describe tissue in medical language. Your care team connects those words to staging, biomarkers, and next steps. Anchor does not read your slides or confirm pathology findings.",
        caregiverMeaning:
          "Your practical job is often to confirm the report is finalized, ask for a plain-language summary, and note any pending addenda.",
        confirmWithTeam: [
          "Is the pathology report complete and reviewed, including any addenda?",
          "What does the team conclude from pathology today, and what is still pending?",
        ],
        safetyFooter: safeFooter,
      })
    }

    if (/\binsurance\b|\bcoverage\b|\bauthorization\b|\bprior auth\b/.test(low)) {
      return make({
        kind: "custom",
        questionLabel: custom.slice(0, 200),
        title: "Insurance and records",
        answer:
          "Insurance questions are administrative: which documents, deadlines, and portals apply. They do not replace medical judgment from your team.",
        caregiverMeaning:
          "Keep copies of what you submit, note deadlines, and ask your clinic which office handles medical records requests.",
        confirmWithTeam: [
          "Which exact documents does our insurer need, and can your office help with the checklist?",
          "Will any delay in authorization affect scheduled tests or visits?",
        ],
        exactWords:
          "Our insurer asked for records — which documents should we upload, what is the deadline, and is there a preferred submission path from your office?",
        safetyFooter: safeFooter,
      })
    }

    if (/\bfamily\b|\bsibling\b|\bdad\b|\bmom\b|\brelative\b|\bbrother\b|\bsister\b|\bchildren\b|\bkids\b/.test(low)) {
      return make({
        kind: "custom",
        questionLabel: custom.slice(0, 200),
        title: "Family conversations",
        answer:
          "Sharing updates with family is emotional work. Anchor can help you separate confirmed facts from pending items so you do not over-promise details still being finalized.",
        caregiverMeaning:
          "Name one spokesperson, decide what level of detail feels fair, and schedule a short check-in after visits when you have written notes.",
        confirmWithTeam: [
          "What we are allowed to share from today’s visit while we wait for finalized results.",
          "Who should be listed for portal access or appointment updates.",
        ],
        exactWords: `Quick update about ${input.lovedOneLabel}: we’re still confirming some details with the care team. I’ll share what’s settled after we speak with them — please don’t treat texts as medical facts.`,
        safetyFooter: safeFooter,
      })
    }

    return make({
      kind: "custom",
      questionLabel: custom.slice(0, 200),
      title: "Neutral prep template",
      answer:
        "Anchor can’t infer a precise medical answer from that free-text question on-device. You can still walk into the next touchpoint with a clean structure: what is confirmed, what is pending, and what you need clarified.",
      caregiverMeaning:
        "Short lists reduce panic. Three questions on paper often beat an hour of searching alone.",
      confirmWithTeam: [
        "What is confirmed in the record today versus still pending?",
        "What decisions, if any, are expected at the next visit?",
        "What should we watch for and who do we call if something changes before then?",
      ],
      safetyFooter: safeFooter,
    })
  }

  if (!input.chipId) {
    return { ok: false, message: "Choose a quick chip or type a follow-up in the box." }
  }

  const chip = input.chipId

  if (chip === "term_meaning") {
    const termInput = input.customText.trim()
    if (!termInput) {
      return make({
        kind: "term_meaning",
        questionLabel: "What does this term mean?",
        title: "Type the term you're asking about",
        answer:
          "Type the exact word or phrase from your paperwork or visit in the text box above (for example: MMR, MSI, margin, lymph node, CEA, PET scan), then tap Ask again.",
        caregiverMeaning:
          "Medical language is easiest to learn in short pieces — write the word exactly as printed, then ask your team to confirm what it means for your chart.",
        confirmWithTeam: [
          "Please define this term in plain language for our situation.",
          "Does this result or label change anything about timing, tests, or next decisions for us?",
        ],
        safetyFooter: safeFooter,
      })
    }
    const defs = collectTermDefinitions(termInput)
    if (defs.length > 0) {
      const body = defs.map((d) => `${d.title}: ${d.def}`).join("\n\n")
      return make({
        kind: "term_meaning",
        questionLabel: termInput.slice(0, 200),
        title: "Plain-language meaning (prep only)",
        answer: body,
        caregiverMeaning:
          "These are general definitions so you can follow the conversation — they are not a verdict about your loved one’s situation.",
        confirmWithTeam: [
          "Which of these topics actually applies on your chart today.",
          "How your team uses this term in your specific plan — your care team confirms.",
        ],
        safetyFooter: safeFooter,
      })
    }
    return make({
      kind: "term_meaning",
      questionLabel: termInput.slice(0, 200),
      title: "Bring the exact phrase to your visit",
      answer:
        "Anchor could not match that text to a built-in glossary entry on-device. You can still ask your team to define it against your records — that is the safest source of truth.",
      caregiverMeaning:
        "A photo of the line on paper, or the portal PDF name and page, often saves time in clinic.",
      confirmWithTeam: [
        "What does this phrase mean in my loved one’s chart today?",
        "Does it change timing, staging discussion, or treatment planning for us?",
      ],
      safetyFooter: safeFooter,
    })
  }

  if (chip === "explain_simple") {
    const done = new Set(input.completedPlanTaskIds)
    const openAdaptive = input.adaptivePlanTasks.filter((t) => !done.has(t.id)).length
    const planLine = input.planResult
      ? "A 72-hour plan is already generated for this demo case."
      : "The 72-hour plan is not generated yet — you can add it from the Plan tab when you are ready."
    const adaptLine = openAdaptive
      ? `${openAdaptive} adaptive checklist item(s) from updates are still open on the Plan tab.`
      : "No open adaptive tasks from updates right now — or they are all marked done."
    return make({
      kind: "explain_simple",
      questionLabel: "Explain this simply",
      title: "Simple read of what Anchor is holding",
      answer: [
        `Mirror in plain words: ${input.mirrorResult.mirror}`,
        `What feels scary underneath: ${input.mirrorResult.fearSummary}`,
        `Known themes from the packet: ${input.packet.knowNow.slice(0, 2).join(" ")}`,
        planLine,
        adaptLine,
      ].join(" "),
      caregiverMeaning:
        "You are not failing if this feels huge — you are doing the part where you translate fear into a short list for the care team.",
      confirmWithTeam: baseConfirm.slice(0, 4),
      safetyFooter: safeFooter,
    })
  }

  if (chip === "ask_tomorrow") {
    return make({
      kind: "ask_tomorrow",
      questionLabel: "What should I ask tomorrow?",
      title: "Short question list for the next touchpoint",
      answer:
        "Bring three headings on paper or phone notes: Confirmed, Still unclear, Questions for the team. Under each, add bullets as you remember — you can fix wording after you hear answers.",
      caregiverMeaning:
        "Tomorrow’s win is clarity, not perfection. Reading questions aloud is allowed.",
      confirmWithTeam: [
        "What is confirmed today versus still pending in pathology, imaging, or biomarkers?",
        "What decisions, if any, are expected at this visit?",
        "What should we watch for or call about before the next touchpoint?",
      ],
      exactWords: input.packet.careTeamBullets.slice(0, 3).join(" "),
      bullets: input.mirrorResult.actions.slice(0, 3),
      safetyFooter: safeFooter,
    })
  }

  if (chip === "phone_script") {
    return make({
      kind: "phone_script",
      questionLabel: "What should I say on the phone?",
      title: "Phone script starter (edit with real names)",
      answer:
        "Use a calm opener, say who you are calling for, name the concern, and ask for three things: what is confirmed, what is pending, and what to bring next.",
      caregiverMeaning:
        "You are allowed to read from a screen. You are allowed to ask them to slow down.",
      confirmWithTeam: [
        "Spell back dates and instructions.",
        "Ask where portal results will appear.",
      ],
      exactWords: `Hi, I'm calling for ${input.lovedOneLabel}. We're trying to prepare for our next oncology touchpoint. What is confirmed in the chart today, what is still pending, and what records should we bring or upload next?`,
      safetyFooter: safeFooter,
    })
  }

  if (chip === "what_changed") {
    if (!input.caseInformationUpdates.length) {
      return make({
        kind: "what_changed",
        questionLabel: "What changed after the new information?",
        title: "Use the Updates tab first",
        answer:
          "Anchor does not see a structured “new information” entry yet for this demo case. When you add an update there, this tab can summarize how it may shift questions and timing.",
        caregiverMeaning:
          "If something changed verbally but is not written down yet, your next step is often to confirm it in the portal or with the scheduler.",
        confirmWithTeam: ["Ask the team to confirm any verbal update against the official chart."],
        safetyFooter: safeFooter,
      })
    }
    const latest = input.caseInformationUpdates[input.caseInformationUpdates.length - 1]
    return make({
      kind: "what_changed",
      questionLabel: "What changed after the new information?",
      title: "Most recent update snapshot",
      answer: [
        `Source: ${latest.sourceLabel}`,
        `New information: ${latest.newInformation}`,
        `What this may affect: ${latest.mayAffect}`,
        `Revised next step (prep): ${latest.revisedStep}`,
      ].join("\n\n"),
      caregiverMeaning:
        "Treat each update as a prompt to refresh your question list — not as a final medical decision from Anchor.",
      confirmWithTeam: [latest.needsConfirmation, latest.askNext],
      safetyFooter: safeFooter,
    })
  }

  if (chip === "urgent_vs_wait") {
    return make({
      kind: "urgent_vs_wait",
      questionLabel: "What is urgent and what can wait?",
      title: "Sorting urgency without triage",
      answer: [
        "Often urgent: new severe pain, trouble breathing, black stools or vomiting blood, sudden confusion, fever with chemotherapy instructions that say to call, inability to keep fluids down, or symptoms your team told you to escalate immediately.",
        "Often can wait until routine hours: portal paperwork, printing lists, scheduling non-emergency follow-ups, and reading general education — as long as nothing above is present.",
      ].join("\n\n"),
      caregiverMeaning:
        "When unsure, the after-hours line exists for exactly that gray zone — Anchor will not tell you to wait out a red flag.",
      confirmWithTeam: [
        "Given what we are seeing now, should we use the after-hours line, urgent care, or emergency services?",
      ],
      safetyFooter: `${FOLLOW_UP_SAFETY_STANDARD} ${FOLLOW_UP_SAFETY_URGENT}`,
    })
  }

  if (chip === "family_summary") {
    return make({
      kind: "family_summary",
      questionLabel: "Summarize this for my family",
      title: "Family-safe summary (facts + humility)",
      answer: [
        `We are supporting ${input.lovedOneLabel} with ${titleCase(input.cancerType)} care planning.`,
        `What we heard them feeling: ${input.mirrorResult.fearSummary}`,
        `What we are doing next: preparing questions, gathering records, and confirming pending tests with the team.`,
      ].join(" "),
      caregiverMeaning:
        "You can be honest about uncertainty. Families often need fewer medical details and more clarity about who is owning which task.",
      confirmWithTeam: ["What we are allowed to share before results are final.", "Who is the point person for updates after visits."],
      exactWords: `Update (not medical advice): we’re organizing questions and records for ${input.lovedOneLabel}’s care team. Some details are still pending — we’ll share what’s confirmed after the next visit.`,
      safetyFooter: safeFooter,
    })
  }

  if (chip === "write_down") {
    return make({
      kind: "write_down",
      questionLabel: "What should I write down?",
      title: "A small paper trail that helps",
      answer:
        "Write the appointment time and location, the names of who you spoke with, the exact diagnosis or staging language they used (quoted), pending tests, and the follow-up phone numbers.",
      caregiverMeaning:
        "Photos of paperwork and one shared note reduce duplicate calls between family members.",
      confirmWithTeam: ["Ask the team to spell any word you cannot repeat back.", "Ask where updated results will appear in the portal."],
      bullets: ["Confirmed", "Still unclear", "Questions for next visit", "Who to call if symptoms change"],
      safetyFooter: safeFooter,
    })
  }

  if (chip === "not_decide_yet") {
    return make({
      kind: "not_decide_yet",
      questionLabel: "What should I not decide yet?",
      title: "Decisions to hold loosely until your team weighs in",
      answer:
        "Avoid locking in a stage number, a chemo yes/no, a surgery choice, or a prognosis story based on partial information or forums. Also avoid negotiating timelines with family as if they are guaranteed.",
      caregiverMeaning:
        "It is still wise to arrange logistics — rides, childcare, work coverage — without pretending you know the medical outcome.",
      confirmWithTeam: [
        "What is premature to decide before pathology/imaging/biomarkers are complete?",
        "What decisions are truly on the table at the next visit?",
      ],
      safetyFooter: safeFooter,
    })
  }

  return {
    ok: false,
    message: "Could not build that follow-up — try a chip or shorter custom question.",
  }
}

type TaskArtifactCode = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I"

interface TaskArtifactMeta {
  code: TaskArtifactCode
  badge: string
}

interface TaskActionGuideContent {
  artifact: TaskArtifactMeta
  taskTitle: string
  whatFor: string
  whyMatters: string
  whenToUse: string
  exactWords: string
  tryingToGet: string[]
  writeDown: string[]
  ifUnknown: string
  standardFooter: string
  urgentExtraFooter: string | null
  copyBlock: string
  isUrgentPanel: boolean
}

const TASK_GUIDE_STANDARD_FOOTER =
  "Anchor can help prepare NCCN-aware questions and organize next steps. It does not diagnose, prescribe, choose treatment, confirm stage, replace your care team, or send messages for you."

function inferTaskArtifact(row: PlanBoardDisplayRow): TaskArtifactMeta {
  const blob = `${row.title} ${row.detail ?? ""}`.toLowerCase()
  const urgent =
    row.initialStatus === "urgent" ||
    /\b(severe|rapidly worsening|emergency services|urgent line|911|triage|anchor does not triage)\b/.test(blob)
  if (urgent) return { code: "G", badge: "Urgent guidance" }
  if (/\binsurance\b|\binsurer\b|\bauthorization\b|\breferrals?\b/.test(blob)) return { code: "F", badge: "Insurance script" }
  if (/\bsecond opinion\b|\bextra opinions\b|\banother opinion\b/.test(blob)) return { code: "H", badge: "Second opinion prep" }
  if (
    /\bsibling\b|\bfamily update\b|\bshare updates\b|\bfamily members?\b/.test(blob) ||
    (/\bfamily\b/.test(blob) && /\b(update|text|group chat|coordinate)\b/.test(blob))
  ) {
    return { code: "D", badge: "Family update" }
  }
  if (
    /\brecords office\b|\bmissing records\b|\brequest(ing)?\s+records\b|\brecords request\b/.test(blob) ||
    (/\brecords\b/.test(blob) && /\b(request|gather|bring|missing)\b/.test(blob))
  ) {
    return { code: "E", badge: "Records checklist" }
  }
  if (/\bportal\b|\bcheck-in\b|\blog ?in\b|portal messages/.test(blob)) return { code: "C", badge: "Portal draft" }
  if (
    /\bmmr\b|\bmsi\b|\bbioma(rker)?s?\b|\bpathology\b|\bpath report\b|\bimaging\b|\bchemo\b|\boncologist\b|\bdoctor\b|\bcare team\b.*\b(ask|confirm|whether)\b|\bquestion\b/.test(
      blob,
    )
  ) {
    return { code: "B", badge: "Doctor question" }
  }
  if (/\bcall(ing)?\b|\bphone\b|\bclinic line\b|\bafter-hours\b|\bhi, i'?m calling\b/.test(blob)) return { code: "A", badge: "Call script" }
  return { code: "I", badge: "Visit prep" }
}

function planRowGuideTriggerLabel(done: boolean, code: TaskArtifactCode): string {
  if (!done) return "Guide me"
  if (code === "A" || code === "C" || code === "F") return "View script"
  return "View details"
}

function buildTaskActionGuide(row: PlanBoardDisplayRow, lovedOneLabel: string): TaskActionGuideContent {
  const artifact = inferTaskArtifact(row)
  const blob = `${row.title} ${row.detail ?? ""}`.toLowerCase()
  const title = row.title
  const isUrgentPanel = artifact.code === "G"

  const exampleCallScript =
    "Hi, I'm calling for my mom. We were told she may have possible stage III colon cancer, and we have an appointment tomorrow. Before we come in, can you help us confirm what records we should bring, whether the full pathology report is finalized, and whether any imaging or biomarker testing is still pending?"
  const exampleMmMsi = "Has MMR/MSI testing been ordered, and will the result change what we discuss next?"
  const exampleImaging = "Which imaging results are still needed before the care team can explain the full plan?"
  const examplePath = "Is the pathology report complete, and does the team agree on what it means for next steps?"
  const exampleChemoNeutral =
    "What information are you using to decide whether chemo is needed, and what is still pending? This is a question for your oncologist — not treatment advice from Anchor."
  const exampleInsurance =
    "Our insurer asked for records. Which documents should we upload, the deadline, and can your office help with the checklist?"
  const exampleSibling = `Quick family update: I'm with ${lovedOneLabel}. Here's what we know from the visit today — still confirm anything time-sensitive with the care team. Who can hop on the group thread tonight?`
  const exampleRecordsRequest =
    "Please send the pathology summary and imaging reports we listed to the address on the form. I'll keep a copy of what I submit and follow up if anything is rejected."
  const exampleUrgent =
    "Given what's happening right now, should we call your clinic after-hours line, or seek urgent or emergency care? Anchor does not triage."
  const exampleFamilySms = `Update (not medical advice): We met with the team about ${lovedOneLabel}. Key dates or tasks may shift — I'll text again when we have something confirmed.`

  let whatFor = `This step lines up with: ${title}`
  let whyMatters =
    "Clear language lowers panic in the room, keeps the visit focused, and helps your loved one feel represented — without you having to memorize textbook oncology."
  let whenToUse = "Use this the day before or morning of a touchpoint, or right after new results land."
  let exactWords = exampleCallScript
  let tryingToGet: string[] = [
    "What is confirmed on paper today, and what is still officially pending.",
    "What records or portal items the clinic still needs from you.",
    "Who will review results with you and how to reach them with follow-up questions.",
  ]
  let writeDown: string[] = [
    "Today's date and who you spoke with (first name is fine).",
    "Any dates the scheduler gave you — read them back to confirm.",
    "A short list of what you were told to bring next time.",
  ]

  if (artifact.code === "G") {
    whatFor = `Escalation check for: ${title}`
    whyMatters =
      "Severe or rapidly changing symptoms can need same-day medical judgment. A short script keeps you from underplaying it on the phone."
    whenToUse = "Use immediately when symptoms are severe, sudden, or quickly worsening — not for routine scheduling questions."
    exactWords = exampleUrgent
    tryingToGet = [
      "Whether to use the after-hours clinic line or emergency services.",
      "Which symptoms to name plainly (what started when, how fast it changed).",
      "What instructions you received if you are sent to the ER.",
    ]
    writeDown = [
      "Symptom words your loved one used, in plain language.",
      "Time the symptom started or worsened.",
      "Any new medicines or doses since the last visit.",
    ]
  } else if (artifact.code === "F") {
    whatFor = `Insurance or authorization follow-up tied to: ${title}`
    whyMatters = "Insurance questions are administrative but time-sensitive — a clean request reduces back-and-forth."
    whenToUse = "When billing, authorization, or referral paperwork is blocking tests or appointments."
    exactWords = exampleInsurance
    tryingToGet = [
      "Exact document names the insurer listed.",
      "Deadlines and submission channel (portal vs fax vs mail).",
      "Whether the clinic can upload on your behalf.",
    ]
    writeDown = ["Confirmation numbers.", "Screenshots or PDF filenames you uploaded.", "Name of the representative and call time."]
  } else if (artifact.code === "D") {
    whatFor = `Family coordination for: ${title}`
    whyMatters = "Aligned updates reduce conflicting stories, especially when a sibling joins midstream."
    whenToUse = "Same day as a visit, when travel plans change, or before you split note-taking roles."
    exactWords = /\bsibling\b/.test(blob) ? exampleSibling : exampleFamilySms
    tryingToGet = [
      "Who owns texting the wider family versus staying in the exam room.",
      "What is okay to repeat versus what must wait for clinician wording.",
      "How notes will be shared after the visit.",
    ]
    writeDown = ["Who is the point person for the next 48 hours.", "One-paragraph factual update only — no guessing at diagnosis."]
  } else if (artifact.code === "E") {
    whatFor = `Records you may need to request or gather for: ${title}`
    whyMatters = "Missing records burn visit time; a polite checklist keeps requests traceable."
    whenToUse = "After a visit, when insurance asks for paperwork, or when imaging or pathology are referenced but you do not have copies."
    exactWords = exampleRecordsRequest
    tryingToGet = [
      "Which documents exist versus which are still incomplete.",
      "The correct fax or portal path your hospital prefers.",
      "Whether any addendum pages are missing.",
    ]
    writeDown = ["Dates on each report header.", "Your internal tracking ID or receipt for the request."]
  } else if (artifact.code === "C") {
    whatFor = `Portal or prep language around: ${title}`
    whyMatters = "Portal messages become part of the chart — neutral, specific notes help everyone."
    whenToUse = "Before you send a message, request records, or ask about prep instructions."
    exactWords = `Portal draft (edit in your own words): "We are preparing for the upcoming visit and want to confirm prep instructions and which uploaded documents you can see on our side. We are not asking for a diagnosis over the portal — only which items still look missing from your view."`
    tryingToGet = [
      "Confirmation the team can see your uploads.",
      "Prep requirements and check-in time.",
      "Whether labs must finish before the visit.",
    ]
    writeDown = ["Screenshot the sent message.", "Portal timestamp.", "Any auto-reply timing expectations."]
  } else if (artifact.code === "H") {
    whatFor = `Second-opinion preparation related to: ${title}`
    whyMatters = "Second opinions are common — framing them calmly protects trust with your primary team."
    whenToUse = "After you understand your team's recommendation, not as a panicked midnight shortcut."
    exactWords = `"We are considering a second opinion to feel thorough. What records should we collect so another center can review without duplicating tests? We want to stay coordinated with you."`
    tryingToGet = [
      "Which disc images or pathology slides to request.",
      "How to avoid redundant radiation or biopsies.",
      "How to loop results back to your main oncologist.",
    ]
    writeDown = ["Names of centers contacted.", "Which records you already released.", "Questions you still want your home team to answer first."]
  } else if (artifact.code === "B") {
    whatFor = `Questions to raise with the doctor or nurse about: ${title}`
    whyMatters =
      "NCCN-aware preparation means asking what is confirmed, pending, and on the table — wording belongs to your clinicians."
    whenToUse = "During the in-person or telehealth visit, or on a nurse line when results post."
    if (/\bmmr\b|\bmsi\b|\bbioma/.test(blob)) {
      exactWords = exampleMmMsi
    } else if (/\bimaging\b/.test(blob)) {
      exactWords = exampleImaging
    } else if (/\bpath/.test(blob)) {
      exactWords = examplePath
    } else if (/\bchemo\b/.test(blob)) {
      exactWords = exampleChemoNeutral
    } else {
      exactWords = [exampleMmMsi, `For imaging: ${exampleImaging}`, `For pathology: ${examplePath}`, `If chemo is only being discussed as a possibility: ${exampleChemoNeutral}`].join(
        "\n\n",
      )
    }
    tryingToGet = [
      "Whether MMR/MSI or other biomarker work is still pending and who explains it.",
      "Whether imaging is complete enough for staging discussions.",
      "Whether pathology is finalized and what it does or does not establish yet.",
      "If chemo was raised only as a possibility: what information the team still needs — not a yes or no from Anchor.",
    ]
    writeDown = [
      "Each answer in one short phrase — do not trust your stressed memory.",
      "Names of pending tests or expected result dates if offered.",
      "Plain-language wording your loved one wants clarified.",
    ]
  } else if (artifact.code === "A") {
    whatFor = `Phone script for scheduling or prep tied to: ${title}`
    whyMatters = "Front desk calls go faster if you sound calm, specific, and respectful."
    whenToUse = "Calling to confirm time, records, or prep — not for brand-new symptom triage."
    exactWords = exampleCallScript
    tryingToGet = ["Confirmed appointment time and location.", "Parking or portal check-in steps.", "Who can attend or join by phone."]
    writeDown = ["Write each answer on one line.", "Read time back: \"So that is 9 a.m. on ___?\""]
  } else {
    whatFor = `General visit prep for: ${title}`
    whyMatters = "A single calm paragraph keeps you from improvising under stress."
    whenToUse = "Night before or waiting-room review."
    exactWords = exampleCallScript
    tryingToGet = [
      "Clarity on what is still pending versus documented.",
      "What to bring and who will take notes.",
      "One worry your loved one asked you not to forget.",
    ]
    writeDown = ["Three questions max, large handwriting or large font on your phone."]
  }

  const ifUnknown =
    "If they say \"we do not know yet,\" thank them, write who will follow up, and ask when a reasonable next check-in is. Uncertainty is information — it means do not force a plan in the parking lot."

  const copyBlock = [
    `${artifact.badge} · type ${artifact.code}`,
    "",
    `Task: ${title}`,
    "",
    "What this is for",
    whatFor,
    "",
    "Why it matters",
    whyMatters,
    "",
    "When to use it",
    whenToUse,
    "",
    "Exact words to say",
    exactWords,
    "",
    "What you are trying to get",
    ...tryingToGet.map((b) => `• ${b}`),
    "",
    "What to write down",
    ...writeDown.map((b) => `• ${b}`),
    "",
    'If they say "we do not know yet"',
    ifUnknown,
  ].join("\n")

  return {
    artifact,
    taskTitle: title,
    whatFor,
    whyMatters,
    whenToUse,
    exactWords,
    tryingToGet,
    writeDown,
    ifUnknown,
    standardFooter: TASK_GUIDE_STANDARD_FOOTER,
    urgentExtraFooter: isUrgentPanel ? PLAN_CHANGE_URGENT_SAFETY : null,
    copyBlock,
    isUrgentPanel,
  }
}

function TaskActionGuideSheet({
  done,
  lovedOneLabel,
  onAppendTimeline,
  onClose,
  onMarkDone,
  openRow,
}: {
  done: boolean
  lovedOneLabel: string
  onAppendTimeline: (entry: ActionGuideDemoTimelineEntry) => void
  onClose: () => void
  onMarkDone: (taskId: string) => void
  openRow: PlanBoardDisplayRow | null
}) {
  const [copyNote, setCopyNote] = useState<string | null>(null)
  const [saveNote, setSaveNote] = useState<string | null>(null)

  useEffect(() => {
    if (!openRow) {
      setCopyNote(null)
      setSaveNote(null)
    }
  }, [openRow])

  if (!openRow) return null

  const row = openRow
  const guide = buildTaskActionGuide(row, lovedOneLabel)

  async function handleCopyWords() {
    try {
      await navigator.clipboard.writeText(guide.copyBlock)
      setCopyNote("Copied. Anchor did not send anything.")
    } catch {
      setCopyNote("Could not access the clipboard from this browser.")
    }
    window.setTimeout(() => setCopyNote(null), 4500)
  }

  function handleSaveTimeline() {
    const id =
      typeof globalThis.crypto !== "undefined" && globalThis.crypto.randomUUID
        ? globalThis.crypto.randomUUID()
        : `tl-${Date.now()}`
    onAppendTimeline({
      id,
      taskId: row.id,
      taskTitle: row.title.slice(0, 220),
      badge: guide.artifact.badge,
      savedAt: new Date().toISOString(),
    })
    setSaveNote("Saved to demo timeline")
    window.setTimeout(() => setSaveNote(null), 3200)
  }

  function handleMarkDoneAndClose() {
    onMarkDone(row.id)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.button
        key="guide-overlay"
        type="button"
        aria-label="Close guide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-[#1c1816]/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        key="guide-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-guide-title"
        initial={{ y: "104%" }}
        animate={{ y: 0 }}
        exit={{ y: "104%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="fixed inset-x-0 bottom-0 z-[71] max-h-[min(82dvh,540px)] w-full max-w-full overflow-x-hidden overflow-y-auto rounded-t-[20px] border border-[#5c534d]/90 bg-gradient-to-b from-[#3f3935] via-[#35302c] to-[#2b2724] px-3 pb-6 pt-3 shadow-[0_-16px_48px_rgba(12,10,9,0.55)] sm:px-4 sm:pb-7 sm:pt-4"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#c4a89d]">
              {guide.artifact.badge} · {guide.artifact.code}
            </p>
            <h2 id="task-guide-title" className="mt-1 break-words text-[15px] font-semibold leading-snug text-[#fdf6f0] sm:text-base">
              {guide.taskTitle}
            </h2>
            {done && (
              <p className="mt-1.5 m-0 inline-block rounded-full border border-[#d8e8d8]/50 bg-[#2d3830]/90 px-2 py-0.5 text-[10px] font-medium text-[#c9e8c5]">
                Done on your board
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-[#f0e4dc] transition hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="mt-2.5 space-y-2.5 text-[11px] leading-snug text-[#e8d8cf] sm:text-xs sm:leading-relaxed">
          <section className="rounded-[12px] border border-white/10 bg-black/15 px-2.5 py-2 sm:px-3 sm:py-2.5">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#d4b8a8]">What this is for</p>
            <p className="mt-1 m-0 break-words text-[#f5ebe3]">{guide.whatFor}</p>
          </section>
          <section className="rounded-[12px] border border-white/10 bg-black/15 px-2.5 py-2 sm:px-3 sm:py-2.5">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#d4b8a8]">Why it matters</p>
            <p className="mt-1 m-0 break-words text-[#f5ebe3]">{guide.whyMatters}</p>
          </section>
          <section className="rounded-[12px] border border-white/10 bg-black/15 px-2.5 py-2 sm:px-3 sm:py-2.5">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#d4b8a8]">When to use it</p>
            <p className="mt-1 m-0 break-words text-[#f5ebe3]">{guide.whenToUse}</p>
          </section>
          <section className="rounded-[12px] border border-[#8f6a5c]/35 bg-[#2a2426]/90 px-2.5 py-2 sm:px-3 sm:py-2.5">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#e8c4b2]">Exact words to say</p>
            <p className="mt-1 m-0 whitespace-pre-wrap break-words text-[#fdf6f0]">{guide.exactWords}</p>
          </section>
          <section className="rounded-[12px] border border-white/10 bg-black/15 px-2.5 py-2 sm:px-3 sm:py-2.5">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#d4b8a8]">What you are trying to get</p>
            <ul className="mt-1.5 m-0 list-none space-y-1 p-0">
              {guide.tryingToGet.map((line, i) => (
                <li key={i} className="relative break-words pl-3.5 before:absolute before:left-0 before:top-[0.4em] before:h-1 before:w-1 before:rounded-full before:bg-[#c9a089]">
                  {line}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-[12px] border border-white/10 bg-black/15 px-2.5 py-2 sm:px-3 sm:py-2.5">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#d4b8a8]">What to write down</p>
            <ul className="mt-1.5 m-0 list-none space-y-1 p-0">
              {guide.writeDown.map((line, i) => (
                <li key={i} className="relative break-words pl-3.5 before:absolute before:left-0 before:top-[0.4em] before:h-1 before:w-1 before:rounded-full before:bg-[#c9a089]">
                  {line}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-[12px] border border-white/10 bg-black/15 px-2.5 py-2 sm:px-3 sm:py-2.5">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#d4b8a8]">If they say &quot;we do not know yet&quot;</p>
            <p className="mt-1 m-0 break-words text-[#f5ebe3]">{guide.ifUnknown}</p>
          </section>
        </div>

        <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void handleCopyWords()}
            className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] border border-[#c9a089]/50 bg-[#4a3f3a]/90 px-3 py-2.5 text-[12px] font-medium text-[#fdf6f0] transition hover:bg-[#5a4d46] sm:flex-none sm:px-4"
          >
            <Clipboard className="h-4 w-4 shrink-0 opacity-90" />
            Copy words
          </button>
          {!done && (
            <button
              type="button"
              onClick={handleMarkDoneAndClose}
              className="inline-flex min-w-0 flex-1 items-center justify-center rounded-[14px] border border-[#b98da0]/55 bg-[#f5eef8]/15 px-3 py-2.5 text-[12px] font-medium text-[#f5e9f8] transition hover:bg-[#f5eef8]/25 sm:flex-none sm:px-4"
            >
              Mark done
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveTimeline}
            className="inline-flex min-w-0 flex-1 items-center justify-center rounded-[14px] border border-white/15 bg-white/5 px-3 py-2.5 text-[11px] font-medium text-[#e8d8cf] transition hover:bg-white/10 sm:flex-none sm:px-4"
          >
            Save to case timeline (demo)
          </button>
        </div>
        {copyNote && <p className="mt-2 break-words text-center text-[11px] text-[#c9e8c5]">{copyNote}</p>}
        {saveNote && <p className="mt-1 break-words text-center text-[11px] text-[#c9d4e8]">{saveNote}</p>}

        {guide.urgentExtraFooter && (
          <p className="mt-3 rounded-[12px] border border-[#c45a4a]/45 bg-[#3d2420]/95 px-2.5 py-2 text-[10px] leading-snug text-[#ffc8bc] sm:text-[11px]">
            {guide.urgentExtraFooter}
          </p>
        )}
        <p className="mt-2.5 text-[10px] leading-snug text-[#c9beb6] sm:text-[11px] sm:leading-relaxed">{guide.standardFooter}</p>
      </motion.div>
    </AnimatePresence>
  )
}

interface PlanBoardDisplayRow {
  id: string
  title: string
  detail?: string
  regretQuote?: string
  source: "baseline" | "adaptive"
  fromUpdate?: boolean
  fromRecords?: boolean
  fromFamily?: boolean
  recordsChecklistId?: string
  familySupportRoleId?: string
  initialStatus?: AdaptivePlanTaskInitialStatus
}

function baselineRowsFromPlan(planResult: PlanResult): PlanBoardDisplayRow[] {
  const segments: { key: keyof PlanResult; slug: string }[] = [
    { key: "tonight", slug: "tonight" },
    { key: "tomorrow", slug: "tomorrow" },
    { key: "next48", slug: "next48" },
  ]
  const out: PlanBoardDisplayRow[] = []
  for (const { key, slug } of segments) {
    planResult[key].forEach((action, index) => {
      out.push({
        id: `base:${slug}:${index}`,
        title: action.text,
        regretQuote: action.regretQuote,
        source: "baseline",
      })
    })
  }
  return out
}

function adaptiveToDisplayRow(task: StoredAdaptivePlanTask): PlanBoardDisplayRow {
  return {
    id: task.id,
    title: task.title,
    detail: task.detail,
    regretQuote: task.regretQuote,
    source: "adaptive",
    fromUpdate: task.fromUpdate,
    fromRecords: task.fromRecords,
    fromFamily: task.fromFamily,
    recordsChecklistId: task.recordsChecklistId,
    familySupportRoleId: task.familySupportRoleId,
    initialStatus: task.initialStatus,
  }
}

function partitionAdaptiveRows(
  tasks: StoredAdaptivePlanTask[],
  isDone: (id: string) => boolean,
): {
  urgent: PlanBoardDisplayRow[]
  waiting: PlanBoardDisplayRow[]
  changed: PlanBoardDisplayRow[]
  otherActive: PlanBoardDisplayRow[]
  doneAdaptive: PlanBoardDisplayRow[]
} {
  const urgent: PlanBoardDisplayRow[] = []
  const waiting: PlanBoardDisplayRow[] = []
  const changed: PlanBoardDisplayRow[] = []
  const otherActive: PlanBoardDisplayRow[] = []
  const doneAdaptive: PlanBoardDisplayRow[] = []
  for (const t of tasks) {
    if (isDone(t.id)) {
      doneAdaptive.push(adaptiveToDisplayRow(t))
      continue
    }
    const row = adaptiveToDisplayRow(t)
    if (t.initialStatus === "urgent") urgent.push(row)
    else if (t.initialStatus === "waiting") waiting.push(row)
    else if (t.fromUpdate && t.initialStatus === "active") changed.push(row)
    else otherActive.push(row)
  }
  return { urgent, waiting, changed, otherActive, doneAdaptive }
}

const DEMO_QUICK_GUIDE_ROW_PREFIX = "demo-quick-"

const DEMO_QUICK_GUIDE_ROWS: PlanBoardDisplayRow[] = [
  {
    id: `${DEMO_QUICK_GUIDE_ROW_PREFIX}doctor`,
    title: "Questions for the oncologist or nurse about pathology, imaging, and what happens next",
    detail: "Ask what is confirmed versus still pending — NCCN-aware prep, not treatment advice.",
    source: "adaptive",
    initialStatus: "active",
  },
  {
    id: `${DEMO_QUICK_GUIDE_ROW_PREFIX}clinic`,
    title: "Call the clinic line to confirm appointment time, records, and check-in",
    detail: "Front desk or nurse line — keep it calm and specific.",
    source: "adaptive",
    initialStatus: "active",
  },
  {
    id: `${DEMO_QUICK_GUIDE_ROW_PREFIX}family`,
    title: "Family update — text or call siblings with a factual, calm summary",
    detail: "Share what you know without guessing at diagnosis.",
    source: "adaptive",
    initialStatus: "active",
  },
  {
    id: `${DEMO_QUICK_GUIDE_ROW_PREFIX}records`,
    title: "Request missing records from the hospital records office",
    detail: "Ask for pathology summaries, imaging discs, or addendum pages you do not have yet.",
    source: "adaptive",
    initialStatus: "active",
  },
  {
    id: `${DEMO_QUICK_GUIDE_ROW_PREFIX}insurance`,
    title: "Insurance authorization or referral follow-up",
    detail: "Clarify what the insurer still needs and the deadline — administrative, but time-sensitive.",
    source: "adaptive",
    initialStatus: "active",
  },
]

function resolveOpenGuideRow(
  guideOpenId: string | null,
  adaptivePlanTasks: StoredAdaptivePlanTask[],
  completedPlanTaskIds: string[],
  planResult: PlanResult | null,
): PlanBoardDisplayRow | null {
  if (!guideOpenId) return null
  const quick = DEMO_QUICK_GUIDE_ROWS.find((r) => r.id === guideOpenId)
  if (quick) return quick
  const doneSet = new Set(completedPlanTaskIds)
  const baselineRows = planResult ? baselineRowsFromPlan(planResult) : []
  const activeBaseline: PlanBoardDisplayRow[] = []
  const doneBaseline: PlanBoardDisplayRow[] = []
  for (const row of baselineRows) {
    if (doneSet.has(row.id)) doneBaseline.push(row)
    else activeBaseline.push(row)
  }
  const part = partitionAdaptiveRows(adaptivePlanTasks, (id) => doneSet.has(id))
  const activeCombined = [...part.otherActive, ...activeBaseline]
  const doneCombined = [...doneBaseline, ...part.doneAdaptive]
  const pool = [...part.urgent, ...activeCombined, ...part.waiting, ...part.changed, ...doneCombined]
  return pool.find((r) => r.id === guideOpenId) ?? null
}

function PlanBoardTaskRow({
  done,
  onMarkDone,
  onOpenGuide,
  row,
}: {
  done: boolean
  onMarkDone?: (taskId: string) => void
  onOpenGuide: (taskId: string) => void
  row: PlanBoardDisplayRow
}) {
  const { detail, fromFamily, fromRecords, fromUpdate, id, title } = row
  const artifact = inferTaskArtifact(row)
  const guideLabel = planRowGuideTriggerLabel(done, artifact.code)
  const borderClass = done ? "border-[#d8e8d8]/90 bg-white/50" : "border-[#e5ddd4] bg-white/70"
  return (
    <div className={`rounded-[14px] border px-2.5 py-2 sm:rounded-[16px] sm:px-3 sm:py-2.5 ${borderClass}`}>
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p className="m-0 min-w-0 flex-1 text-[12px] font-medium leading-snug text-[#3f3a36] sm:text-sm">{title}</p>
        <div className="flex max-w-[11rem] shrink-0 flex-wrap items-center justify-end gap-1 sm:max-w-none">
          <button
            type="button"
            onClick={() => onOpenGuide(id)}
            className="rounded-full border border-[#8f7e9b]/40 bg-[#faf7f4]/95 px-2 py-1 text-[10px] font-medium text-[#5c4a62] transition hover:bg-white sm:text-[11px]"
          >
            {guideLabel}
          </button>
          {!done && onMarkDone && (
            <button
              type="button"
              onClick={() => onMarkDone(id)}
              className="rounded-full border border-[#b98da0]/45 bg-[#f5eef8]/90 px-2 py-1 text-[10px] font-medium text-[#5c4a62] transition hover:bg-white sm:text-[11px]"
            >
              Mark done
            </button>
          )}
        </div>
      </div>
      {detail && <p className="mt-1.5 text-[11px] leading-snug text-[#756f68] sm:text-xs">{detail}</p>}
      {fromRecords && !done && (
        <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-[#9b829c] sm:text-[11px]">
          Added from records
        </p>
      )}
      {fromFamily && !fromRecords && !done && (
        <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-[#9b829c] sm:text-[11px]">
          Added from family support
        </p>
      )}
      {fromUpdate && !fromRecords && !fromFamily && !done && (
        <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-[#9b829c] sm:text-[11px]">
          Added from new information
        </p>
      )}
    </div>
  )
}

function PlanBoardSubsection({
  emptyHint,
  onMarkDone,
  onOpenGuide,
  rows,
  title,
}: {
  emptyHint?: string
  onMarkDone: (taskId: string) => void
  onOpenGuide: (taskId: string) => void
  rows: PlanBoardDisplayRow[]
  title: string
}) {
  if (!rows.length) return null
  return (
    <div className="mt-3 sm:mt-3.5">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-xs">{title}</p>
      <div className="grid gap-1.5 sm:gap-2">
        {rows.map((row) => (
          <PlanBoardTaskRow
            key={row.id}
            done={false}
            onMarkDone={onMarkDone}
            onOpenGuide={onOpenGuide}
            row={row}
          />
        ))}
      </div>
      {emptyHint && <p className="mt-1.5 text-[10px] leading-snug text-[#756f68] sm:text-[11px]">{emptyHint}</p>}
    </div>
  )
}

function PlanBoardDoneSubsection({
  onOpenGuide,
  rows,
}: {
  onOpenGuide: (taskId: string) => void
  rows: PlanBoardDisplayRow[]
}) {
  if (!rows.length) return null
  return (
    <div className="mt-3 sm:mt-3.5">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-xs">Done</p>
      <div className="grid gap-1.5 sm:gap-2">
        {rows.map((row) => (
          <PlanBoardTaskRow key={row.id} done onOpenGuide={onOpenGuide} row={row} />
        ))}
      </div>
    </div>
  )
}

function AdaptivePlanBoard({
  adaptivePlanTasks,
  completedPlanTaskIds,
  guideOpenId,
  isBackupDemoMirror,
  lovedOneLabel,
  onGuideOpenChange,
  onMarkDone,
  planResult,
}: {
  adaptivePlanTasks: StoredAdaptivePlanTask[]
  completedPlanTaskIds: string[]
  guideOpenId: string | null
  isBackupDemoMirror: boolean
  lovedOneLabel: string
  onGuideOpenChange: (taskId: string | null) => void
  onMarkDone: (taskId: string) => void
  planResult: PlanResult | null
}) {
  const doneSet = useMemo(() => new Set(completedPlanTaskIds), [completedPlanTaskIds])
  const [expandActiveTasks, setExpandActiveTasks] = useState(false)

  const baselineRows = useMemo(
    () => (planResult ? baselineRowsFromPlan(planResult) : []),
    [planResult],
  )

  const { activeBaseline, urgent, waiting, changed, otherActive, doneBaseline, doneAdaptive } = useMemo(() => {
    const activeBaseline: PlanBoardDisplayRow[] = []
    const doneBaseline: PlanBoardDisplayRow[] = []
    for (const row of baselineRows) {
      if (doneSet.has(row.id)) doneBaseline.push(row)
      else activeBaseline.push(row)
    }
    const part = partitionAdaptiveRows(adaptivePlanTasks, (id) => doneSet.has(id))
    return {
      activeBaseline,
      urgent: part.urgent,
      waiting: part.waiting,
      changed: part.changed,
      otherActive: part.otherActive,
      doneBaseline,
      doneAdaptive: part.doneAdaptive,
    }
  }, [adaptivePlanTasks, baselineRows, doneSet])

  const activeCombined = useMemo(() => [...otherActive, ...activeBaseline], [activeBaseline, otherActive])
  const doneCombined = useMemo(() => [...doneBaseline, ...doneAdaptive], [doneAdaptive, doneBaseline])
  const activeRowsForBoard = useMemo(() => {
    if (expandActiveTasks || activeCombined.length <= 3) return activeCombined
    return activeCombined.slice(0, 3)
  }, [activeCombined, expandActiveTasks])

  const showBoard = Boolean(planResult) || adaptivePlanTasks.length > 0
  if (!showBoard) return null

  return (
    <div className="mt-1">
      {!planResult && adaptivePlanTasks.length > 0 && (
        <p className="mb-2 text-[11px] leading-snug text-[#756f68] sm:text-xs">
          Your generated 72-hour checklist will appear here after you tap &quot;Get your 72-hour plan&quot;. Tasks you add
          from new information stay on this board until you start over.
        </p>
      )}
      <PlanBoardSubsection
        onMarkDone={onMarkDone}
        onOpenGuide={(id) => onGuideOpenChange(id)}
        rows={urgent}
        title="Urgent"
      />
      <PlanBoardSubsection
        emptyHint="Baseline steps from your plan; mark done as you go."
        onMarkDone={onMarkDone}
        onOpenGuide={(id) => onGuideOpenChange(id)}
        rows={activeRowsForBoard}
        title="Active next steps"
      />
      {activeCombined.length > 3 && (
        <button
          type="button"
          onClick={() => setExpandActiveTasks((v) => !v)}
          className="mt-2 w-full rounded-full border border-[#8f7e9b]/40 bg-[#faf7f4]/95 py-1.5 text-[10px] font-medium text-[#5c4a62] transition hover:bg-white sm:text-[11px]"
        >
          {expandActiveTasks ? "Show fewer active tasks" : `Show all active tasks (${activeCombined.length})`}
        </button>
      )}
      <PlanBoardSubsection
        onMarkDone={onMarkDone}
        onOpenGuide={(id) => onGuideOpenChange(id)}
        rows={waiting}
        title="Waiting on care team"
      />
      <PlanBoardSubsection
        onMarkDone={onMarkDone}
        onOpenGuide={(id) => onGuideOpenChange(id)}
        rows={changed}
        title="Changed because of new information"
      />
      <PlanBoardDoneSubsection onOpenGuide={(id) => onGuideOpenChange(id)} rows={doneCombined} />
      <p className="mt-3 text-[12px] leading-snug text-[#756f68] sm:mt-4 sm:text-sm sm:leading-6">
        {isBackupDemoMirror
          ? "Sample NCCN-aware checklist based on what Anchor knows right now — not set in stone, not a treatment recommendation. Confirm timing and details with your care team."
          : "NCCN-aware question prep structured around common oncology guideline workflows, based on what Anchor knows right now — not set in stone, not a treatment recommendation. Confirm with your doctor or care team."}
      </p>
    </div>
  )
}

function formatDemoTimelineLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
      new Date(iso),
    )
  } catch {
    return iso
  }
}

function computeAdaptiveBoardCounts(
  adaptivePlanTasks: StoredAdaptivePlanTask[],
  completedPlanTaskIds: string[],
  planResult: PlanResult | null,
): { active: number; waiting: number; changed: number; done: number } {
  const doneSet = new Set(completedPlanTaskIds)
  const baselineRows = planResult ? baselineRowsFromPlan(planResult) : []
  let activeBaseline = 0
  let doneBaseline = 0
  for (const row of baselineRows) {
    if (doneSet.has(row.id)) doneBaseline += 1
    else activeBaseline += 1
  }
  const part = partitionAdaptiveRows(adaptivePlanTasks, (id) => doneSet.has(id))
  return {
    active: part.urgent.length + part.otherActive.length + activeBaseline,
    waiting: part.waiting.length,
    changed: part.changed.length,
    done: doneBaseline + part.doneAdaptive.length,
  }
}

function formatAdaptiveBoardCountsLine(c: { active: number; waiting: number; changed: number; done: number }): string {
  return `${c.active} active · ${c.waiting} waiting · ${c.done} done · ${c.changed} changed`
}

function mergeNeedsConfirmationForMemory(base: string[], updates: DemoCaseUpdate[]): string[] {
  const out = [...base]
  const seen = new Set(base.map((s) => s.trim().toLowerCase()))
  for (const u of updates) {
    const chunk = u.needsConfirmation.trim()
    if (!chunk) continue
    const sig = chunk.toLowerCase()
    if (seen.has(sig)) continue
    seen.add(sig)
    out.push(`From “${u.sourceLabel}”: ${chunk}`)
  }
  return out
}

function buildMemoryLastUpdatedLine(
  followUpResponses: FollowUpResponseItem[],
  actionGuideDemoTimeline: ActionGuideDemoTimelineEntry[],
): string {
  const times: number[] = []
  for (const f of followUpResponses) {
    const ms = Date.parse(f.timestamp)
    if (!Number.isNaN(ms)) times.push(ms)
  }
  for (const e of actionGuideDemoTimeline) {
    const ms = Date.parse(e.savedAt)
    if (!Number.isNaN(ms)) times.push(ms)
  }
  if (!times.length) return "This session"
  const latest = Math.max(...times)
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(latest))
  } catch {
    return "This session"
  }
}

interface CareTimelineRow {
  id: string
  title: string
  description: string
  timeLabel: string
}

function buildCareTimelineRows(input: {
  voiceConcernLine: string
  planResult: PlanResult | null
  caseInformationUpdates: DemoCaseUpdate[]
  followUpResponses: FollowUpResponseItem[]
  actionGuideDemoTimeline: ActionGuideDemoTimelineEntry[]
  completedPlanTaskIds: string[]
  completedTitlesSample: string[]
}): CareTimelineRow[] {
  const rows: CareTimelineRow[] = []
  let seq = 0
  const push = (title: string, description: string, timeLabel: string) => {
    seq += 1
    rows.push({ id: `tl-${seq}`, title, description, timeLabel })
  }
  const concern = input.voiceConcernLine.trim() || "No voice/text concern captured yet."
  push("Original concern (voice/text)", concern.length > 180 ? `${concern.slice(0, 180)}…` : concern, "Demo session")
  if (input.planResult) {
    push("72-hour plan generated", "Checklist created from this case snapshot.", "Demo session")
  }
  for (const u of input.caseInformationUpdates) {
    const d = u.newInformation.trim()
    push(`Case update · ${u.sourceLabel}`, d.length > 160 ? `${d.slice(0, 160)}…` : d || "Update recorded.", "Demo session")
  }
  const fuAscending = [...input.followUpResponses].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
  for (const f of fuAscending) {
    const tlab = Number.isNaN(Date.parse(f.timestamp)) ? "Demo session" : formatDemoTimelineLabel(f.timestamp)
    push(`Ask · ${f.questionLabel}`, f.title, tlab)
  }
  const tlAscending = [...input.actionGuideDemoTimeline].sort((a, b) => Date.parse(a.savedAt) - Date.parse(b.savedAt))
  for (const e of tlAscending) {
    const tlab = Number.isNaN(Date.parse(e.savedAt)) ? "Demo session" : formatDemoTimelineLabel(e.savedAt)
    if (e.taskId === "records-activity") {
      push(`Records · ${e.taskTitle}`, "Saved locally in this demo timeline — not sent from Anchor.", tlab)
      continue
    }
    if (e.taskId === "family-activity") {
      push(`Family · ${e.taskTitle}`, "Saved locally in this demo timeline — not sent from Anchor.", tlab)
      continue
    }
    push(`Guide me · ${e.badge}`, e.taskTitle, tlab)
  }
  if (input.completedPlanTaskIds.length) {
    const tail = input.completedTitlesSample.slice(0, 3).join("; ")
    push(
      `${input.completedPlanTaskIds.length} checklist item(s) marked done`,
      tail ? `Includes: ${tail}.` : "Completed in this demo session.",
      "Demo session",
    )
  }
  return rows
}

function buildAppointmentHandoffBlocks(input: {
  careTeamConfirmsLine: string
  concernLine: string
  knowFacts: string[]
  stillConfirm: string[]
  topQuestions: { label: string; title: string }[]
  activeSteps: string[]
  recordsLine: string
  whoGoingLine: string
}): string {
  const qs = input.topQuestions.map((q, i) => `${i + 1}. [${q.label}] ${q.title}`).join("\n")
  const facts = input.knowFacts.map((l, i) => `${i + 1}. ${l}`).join("\n")
  const conf = input.stillConfirm.map((l, i) => `${i + 1}. ${l}`).join("\n")
  const steps = input.activeSteps.length ? input.activeSteps.map((l, i) => `${i + 1}. ${l}`).join("\n") : "(none listed yet)"
  return [
    "ANCHOR — APPOINTMENT HANDOFF (LOCAL DEMO CLIPBOARD)",
    "Orientation prep only. Your care team confirms decisions. Not diagnosis or treatment recommendation.",
    "",
    input.careTeamConfirmsLine,
    "",
    "CONCERN (AS CAPTURED)",
    input.concernLine,
    "",
    "KNOWN FACTS (ANCHOR SUMMARY — VERIFY WITH TEAM)",
    facts || "(none yet)",
    "",
    "STILL NEEDS CONFIRMATION",
    conf || "(none listed yet)",
    "",
    "TOP QUESTIONS YOU ASKED IN ASK",
    qs || "(none yet)",
    "",
    "ACTIVE NEXT STEPS (FROM PLAN BOARD)",
    steps,
    "",
    "RECORDS TO BRING / HAVE READY",
    input.recordsLine,
    "",
    "WHO IS GOING / ON THE CALL",
    input.whoGoingLine,
    "",
    "— Copied from Anchor prototype. Nothing was sent by Anchor.",
  ].join("\n")
}

function buildPathologyQuestionsCopyBlock(): string {
  return [
    "ANCHOR — SAMPLE PATHOLOGY QUESTIONS (LOCAL DEMO)",
    "De-identified sample only. Anchor does not diagnose, stage, or interpret your real documents.",
    "",
    ...SAMPLE_PATHOLOGY_QUESTIONS.map((q, i) => `${i + 1}. ${q}`),
    "",
    "Bring these as prompts for conversation — your pathologist and oncology team interpret findings.",
    "",
    "— Copied from Anchor prototype. Nothing was sent by Anchor.",
  ].join("\n")
}

function buildSecondOpinionChecklistCopyBlock(): string {
  return [
    "ANCHOR — SECOND-OPINION PACKET CHECKLIST (LOCAL DEMO)",
    RECORDS_SECOND_OPINION_INTRO,
    "",
    ...RECORDS_SECOND_OPINION_CHECKLIST_LINES.map((l, i) => `${i + 1}. ${l}`),
    "",
    "— Copied from Anchor prototype. Nothing was sent by Anchor.",
  ].join("\n")
}

function buildRecordTransferChecklistCopyBlock(): string {
  return [
    "ANCHOR — RECORD TRANSFER CHECKLIST (LOCAL DEMO)",
    "Use when coordinating copies between facilities — verify requirements with each office.",
    "",
    ...RECORDS_TRANSFER_CHECKLIST_BULLETS.map((l) => `• ${l}`),
    "",
    "— Copied from Anchor prototype. Nothing was sent by Anchor.",
  ].join("\n")
}

function normalizeRecordsDedupeKey(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ")
}

function resolvedVoiceConcernForMemory(
  resultsTranscriptEcho: string,
  isBackupDemoMirror: boolean,
  mirrorResult: MirrorResult,
): string {
  const echo = resultsTranscriptEcho.trim()
  if (echo) return echo
  const sarah =
    isBackupDemoMirror ||
    mirrorResult.fearQuote.trim() === SARAH_DEMO_CONCERN.trim() ||
    mirrorResult.mirror === SARAH_DEMO_MIRROR_RESULT.mirror
  if (sarah) return SARAH_DEMO_CONCERN
  return ""
}

function collectActiveNextStepTitles(
  adaptivePlanTasks: StoredAdaptivePlanTask[],
  completedPlanTaskIds: string[],
  planResult: PlanResult | null,
  limit = 8,
): string[] {
  const doneSet = new Set(completedPlanTaskIds)
  const baselineRows = planResult ? baselineRowsFromPlan(planResult) : []
  const activeBaseline: PlanBoardDisplayRow[] = []
  for (const row of baselineRows) {
    if (!doneSet.has(row.id)) activeBaseline.push(row)
  }
  const part = partitionAdaptiveRows(adaptivePlanTasks, (id) => doneSet.has(id))
  const pool = [...part.urgent, ...part.otherActive, ...activeBaseline]
  return pool.map((r) => r.title).slice(0, limit)
}

function titleForCompletedTaskId(
  id: string,
  adaptivePlanTasks: StoredAdaptivePlanTask[],
  planResult: PlanResult | null,
): string {
  const fromAdaptive = adaptivePlanTasks.find((t) => t.id === id)
  if (fromAdaptive) return fromAdaptive.title
  if (planResult) {
    const baseline = baselineRowsFromPlan(planResult).find((r) => r.id === id)
    if (baseline) return baseline.title
  }
  return id
}

function inferCompletedTaskSourceLabel(id: string, adaptivePlanTasks: StoredAdaptivePlanTask[]): string {
  if (id.startsWith("base:")) return "Baseline plan"
  const t = adaptivePlanTasks.find((x) => x.id === id)
  if (!t) return "Plan board"
  if (t.fromRecords) return "Added from records"
  if (t.fromFamily) return "Added from family support"
  if (t.fromUpdate) return "Added after case update"
  if (t.initialStatus === "waiting") return "Waiting-on-team track"
  return "Adaptive checklist"
}

function pickRecordsLineFromPacket(careTeamBullets: string[]): string {
  const hit = careTeamBullets.find((b) => /bring|records|portal|medicat/i.test(b))
  return hit ?? careTeamBullets.slice(0, 3).join(" ")
}

function pickWhoGoingLine(nightNote: NightNoteContent, lovedOneLabel: string): string {
  const tiny = nightNote.tinyActions.find((t) => /who|join|going|call/i.test(t))
  if (tiny) return tiny
  return `Confirm who will attend with ${lovedOneLabel} and who will take notes.`
}

function CockpitToolsBackRow({ onBack }: { onBack: () => void }) {
  return (
    <div className="mb-3 min-w-0">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#d8cec5] bg-white/80 px-3 py-1.5 text-[11px] font-medium text-[#5f5a55] transition hover:bg-white sm:text-xs"
      >
        <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-[#9b829c] sm:h-4 sm:w-4" aria-hidden />
        Back to tools
      </button>
    </div>
  )
}

const COCKPIT_TAB_DEFS: { id: WorkspaceTab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "tools", label: "Tools" },
  { id: "saved", label: "Saved" },
]

function ResultsView({
  actionGuideDemoTimeline,
  adaptivePlanTasks,
  appendActionGuideDemoTimeline,
  appendAdaptivePlanTasks,
  appendDemoCaseUpdate,
  cancerType,
  caseInformationUpdates,
  completedPlanTaskIds,
  copied,
  displayName,
  error,
  familyCoordBoard,
  followUpResponses,
  handoffText,
  isBackupDemoMirror,
  isPlanning,
  lovedOne,
  markPlanTaskDone,
  mirrorResult,
  noteText,
  onAddByVoice,
  onAskFollowUpSubmit,
  onCopy,
  onOpenToolPanel,
  onPlan,
  onSarahBackupDemo,
  onStartOver,
  onWorkspaceTabChange,
  planResult,
  resultsTranscriptEcho,
  setFamilyCoordBoard,
  toolPanel,
  workspaceTab,
}: {
  actionGuideDemoTimeline: ActionGuideDemoTimelineEntry[]
  adaptivePlanTasks: StoredAdaptivePlanTask[]
  appendActionGuideDemoTimeline: (entry: ActionGuideDemoTimelineEntry) => void
  appendAdaptivePlanTasks: (tasks: StoredAdaptivePlanTask[]) => void
  appendDemoCaseUpdate: (update: DemoCaseUpdate) => void
  cancerType: CancerType
  caseInformationUpdates: DemoCaseUpdate[]
  completedPlanTaskIds: string[]
  copied: ResultCopyKind | null
  displayName: string
  error: string | null
  familyCoordBoard: FamilyCoordBoardRow[]
  followUpResponses: FollowUpResponseItem[]
  handoffText: string
  isBackupDemoMirror: boolean
  isPlanning: boolean
  lovedOne: string
  markPlanTaskDone: (taskId: string) => void
  mirrorResult: MirrorResult
  noteText: string
  onAddByVoice: () => void
  onAskFollowUpSubmit: (chipId: FollowUpChipId | null, customText: string) => CreateFollowUpResult
  onCopy: (kind: ResultCopyKind, value: string, timelineTitle?: string, timelineMeta?: CopyTimelineMeta) => void
  onOpenToolPanel: (panel: ToolPanelId | null) => void
  onPlan: () => void
  onSarahBackupDemo: () => void
  onStartOver: () => void
  onWorkspaceTabChange: (tab: WorkspaceTab) => void
  planResult: PlanResult | null
  resultsTranscriptEcho: string
  setFamilyCoordBoard: React.Dispatch<React.SetStateAction<FamilyCoordBoardRow[]>>
  toolPanel: ToolPanelId | null
  workspaceTab: WorkspaceTab
}) {
  const [guideOpenId, setGuideOpenId] = useState<string | null>(null)
  const [infoPanelOpen, setInfoPanelOpen] = useState(false)
  const [infoDraft, setInfoDraft] = useState("")
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null)
  const [selectedFollowUpPrompt, setSelectedFollowUpPrompt] = useState<FollowUpChipId | null>(null)
  const [customFollowUpQuestion, setCustomFollowUpQuestion] = useState("")
  const [askFollowUpError, setAskFollowUpError] = useState<string | null>(null)
  const [recordsInlineNote, setRecordsInlineNote] = useState<string | null>(null)
  const [familyInlineNote, setFamilyInlineNote] = useState<string | null>(null)
  const [pathologyQuestionsOpen, setPathologyQuestionsOpen] = useState(false)
  const pathologyBlockRef = useRef<HTMLDivElement | null>(null)
  const recordsDocStackRef = useRef<HTMLDivElement | null>(null)
  const recordsMissingRef = useRef<HTMLDivElement | null>(null)
  const [memoryTimelineExpanded, setMemoryTimelineExpanded] = useState(false)
  const [guidedPrepOpen, setGuidedPrepOpen] = useState(false)
  const [askShowAll, setAskShowAll] = useState(false)
  const [visitPrepInlineNote, setVisitPrepInlineNote] = useState<string | null>(null)

  function scrollToRecordsSection(ref: React.RefObject<HTMLDivElement | null>) {
    window.requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }

  function appendFamilyActivityEntry(taskTitle: string) {
    const id =
      typeof globalThis.crypto !== "undefined" && globalThis.crypto.randomUUID
        ? globalThis.crypto.randomUUID()
        : `tl-${Date.now()}`
    appendActionGuideDemoTimeline({
      id,
      taskId: "family-activity",
      taskTitle,
      badge: "Family",
      savedAt: new Date().toISOString(),
    })
  }

  function handleAddGuidedVisitPrepTask() {
    if (adaptivePlanTasks.some((t) => t.id === GUIDED_VISIT_PREP_TASK_ID)) {
      setVisitPrepInlineNote("Visit prep is already on your plan.")
      window.setTimeout(() => setVisitPrepInlineNote(null), 2800)
      return
    }
    appendAdaptivePlanTasks([buildGuidedVisitPrepTask()])
    setVisitPrepInlineNote("Added to your 72-hour plan (Tools).")
    window.setTimeout(() => setVisitPrepInlineNote(null), 2800)
  }

  function familyRoleTaskAlreadyPresent(roleKey: string): boolean {
    return adaptivePlanTasks.some((t) => t.familySupportRoleId === roleKey)
  }

  function handleAddFamilySupportTask(card: FamilySupportRoleCardDef) {
    const key = `role:${card.id}`
    if (familyRoleTaskAlreadyPresent(key)) {
      setFamilyInlineNote("Already added")
      window.setTimeout(() => setFamilyInlineNote(null), 3200)
      return
    }
    appendAdaptivePlanTasks([buildFamilySupportAdaptiveTask(card)])
    appendFamilyActivityEntry(`Added family task: ${card.roleTitle}`)
  }

  function patchFamilyCoordRow(id: string, patch: Partial<Pick<FamilyCoordBoardRow, "owner" | "done">>) {
    let titleForLog = ""
    setFamilyCoordBoard((rows) => {
      const hit = rows.find((r) => r.id === id)
      if (hit) titleForLog = hit.title
      return rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
    })
    if (!titleForLog) return
    if ("done" in patch && patch.done) {
      appendFamilyActivityEntry(`Family board: marked done · ${titleForLog}`)
    } else if ("owner" in patch && patch.owner && patch.owner !== "none") {
      appendFamilyActivityEntry(
        `Support tasks: ${patch.owner === "sibling" ? "Marked as taken (sibling lane)" : "Someone can take this"} · ${titleForLog}`,
      )
    }
  }

  const familyTimelineMeta: CopyTimelineMeta = {
    taskTitle: "Copied from family support (Tools)",
    badge: "Family",
    taskId: "family-activity",
  }

  const familyNeedsOwnerRows = useMemo(
    () => familyCoordBoard.filter((r) => !r.done && r.owner === "none"),
    [familyCoordBoard],
  )
  const familyAssignedRows = useMemo(
    () => familyCoordBoard.filter((r) => !r.done && r.owner !== "none"),
    [familyCoordBoard],
  )
  const familyDoneRows = useMemo(() => familyCoordBoard.filter((r) => r.done), [familyCoordBoard])

  const lovedOneLabel = useMemo(
    () => RELATIONSHIPS.find((item) => item.value === lovedOne)?.label ?? "Your person",
    [lovedOne],
  )

  const packet = useMemo(
    () => buildCaregiverResultPacket(mirrorResult, isBackupDemoMirror),
    [mirrorResult, isBackupDemoMirror],
  )

  const openGuideRow = useMemo(
    () => resolveOpenGuideRow(guideOpenId, adaptivePlanTasks, completedPlanTaskIds, planResult),
    [adaptivePlanTasks, completedPlanTaskIds, guideOpenId, planResult],
  )

  const openGuideDone = useMemo(() => {
    if (!openGuideRow) return false
    return completedPlanTaskIds.includes(openGuideRow.id)
  }, [completedPlanTaskIds, openGuideRow])

  const completedTaskTitles = useMemo(() => {
    const titles: string[] = []
    const done = new Set(completedPlanTaskIds)
    for (const t of adaptivePlanTasks) {
      if (done.has(t.id)) titles.push(t.title)
    }
    if (planResult) {
      for (const row of baselineRowsFromPlan(planResult)) {
        if (done.has(row.id)) titles.push(row.title)
      }
    }
    return titles
  }, [adaptivePlanTasks, completedPlanTaskIds, planResult])

  const isSarahVoiceCase = useMemo(
    () =>
      isBackupDemoMirror ||
      mirrorResult.fearQuote.trim() === SARAH_DEMO_CONCERN.trim() ||
      mirrorResult.mirror === SARAH_DEMO_MIRROR_RESULT.mirror,
    [isBackupDemoMirror, mirrorResult.fearQuote, mirrorResult.mirror],
  )

  const caregiverCardName = useMemo(() => {
    if (displayName !== "there") return displayName
    if (isSarahVoiceCase) return "Sarah (demo)"
    return "Not added yet"
  }, [displayName, isSarahVoiceCase])

  const memoryHoldingNarrative = useMemo(
    () =>
      buildMemoryHoldingNarrative({
        caregiverName: caregiverCardName,
        lovedOneLabel,
        cancerLine: cancerType ? `${titleCase(cancerType)} cancer` : "the cancer context you add next",
        isSarahDemo: isSarahVoiceCase,
      }),
    [cancerType, caregiverCardName, isSarahVoiceCase, lovedOneLabel],
  )

  const voiceConcernResolved = useMemo(
    () => resolvedVoiceConcernForMemory(resultsTranscriptEcho, isBackupDemoMirror, mirrorResult),
    [isBackupDemoMirror, mirrorResult, resultsTranscriptEcho],
  )

  const boardCounts = useMemo(
    () => computeAdaptiveBoardCounts(adaptivePlanTasks, completedPlanTaskIds, planResult),
    [adaptivePlanTasks, completedPlanTaskIds, planResult],
  )

  const boardCountsLine = useMemo(() => formatAdaptiveBoardCountsLine(boardCounts), [boardCounts])

  const askResponsesNewestFirst = useMemo(() => [...followUpResponses].reverse(), [followUpResponses])

  useEffect(() => {
    if (workspaceTab !== "tools" || toolPanel !== "ask") setAskShowAll(false)
  }, [toolPanel, workspaceTab])

  const mergedNeedsConfirmation = useMemo(
    () => mergeNeedsConfirmationForMemory(packet.needsConfirmation, caseInformationUpdates),
    [caseInformationUpdates, packet.needsConfirmation],
  )

  const memoryLastUpdated = useMemo(
    () => buildMemoryLastUpdatedLine(followUpResponses, actionGuideDemoTimeline),
    [actionGuideDemoTimeline, followUpResponses],
  )

  const careTimelineRows = useMemo(
    () =>
      buildCareTimelineRows({
        voiceConcernLine: voiceConcernResolved,
        planResult,
        caseInformationUpdates,
        followUpResponses,
        actionGuideDemoTimeline,
        completedPlanTaskIds,
        completedTitlesSample: completedTaskTitles,
      }),
    [
      actionGuideDemoTimeline,
      caseInformationUpdates,
      completedPlanTaskIds,
      completedTaskTitles,
      followUpResponses,
      planResult,
      voiceConcernResolved,
    ],
  )

  const memoryTimelineLowRisk = useMemo(
    () =>
      !adaptivePlanTasks.some(
        (t) => t.initialStatus === "urgent" && !completedPlanTaskIds.includes(t.id),
      ),
    [adaptivePlanTasks, completedPlanTaskIds],
  )

  const visibleCareTimelineRows = useMemo(() => {
    if (!memoryTimelineLowRisk || careTimelineRows.length <= 5) return careTimelineRows
    if (memoryTimelineExpanded) return careTimelineRows
    return careTimelineRows.slice(0, 5)
  }, [careTimelineRows, memoryTimelineExpanded, memoryTimelineLowRisk])

  const appointmentHandoffText = useMemo(() => {
    const concern =
      voiceConcernResolved.trim() ||
      mirrorResult.fearQuote.trim() ||
      "No voice/text concern captured yet."
    const topQ = followUpResponses.slice(0, 3).map((r) => ({ label: r.questionLabel, title: r.title }))
    const steps = collectActiveNextStepTitles(adaptivePlanTasks, completedPlanTaskIds, planResult)
    return buildAppointmentHandoffBlocks({
      careTeamConfirmsLine:
        "Your oncology team confirms what is true for your situation. Anchor only organizes questions and next steps for this local demo.",
      concernLine: concern,
      knowFacts: packet.knowNow,
      stillConfirm: mergedNeedsConfirmation,
      topQuestions: topQ,
      activeSteps: steps,
      recordsLine: pickRecordsLineFromPacket(packet.careTeamBullets),
      whoGoingLine: pickWhoGoingLine(packet.nightNote, lovedOneLabel),
    })
  }, [
    adaptivePlanTasks,
    completedPlanTaskIds,
    followUpResponses,
    lovedOneLabel,
    mergedNeedsConfirmation,
    mirrorResult.fearQuote,
    packet.careTeamBullets,
    packet.knowNow,
    packet.nightNote,
    planResult,
    voiceConcernResolved,
  ])

  const pathologyQuestionsCopyText = useMemo(() => buildPathologyQuestionsCopyBlock(), [])

  const secondOpinionChecklistCopyText = useMemo(() => buildSecondOpinionChecklistCopyBlock(), [])

  const recordTransferChecklistCopyText = useMemo(() => buildRecordTransferChecklistCopyBlock(), [])

  const recordsOnePagerText = useMemo(() => {
    const addon = [
      "",
      "RECORDS ORGANIZER ADD-ON (LOCAL DEMO)",
      RECORDS_SECOND_OPINION_INTRO,
      "",
      "Second-opinion packet checklist (short version):",
      ...RECORDS_SECOND_OPINION_CHECKLIST_LINES.map((l, i) => `${i + 1}. ${l}`),
      "",
      "Record transfer hygiene:",
      ...RECORDS_TRANSFER_CHECKLIST_BULLETS.map((l) => `• ${l}`),
      "",
      "— End of add-on. Nothing was sent by Anchor.",
    ].join("\n")
    return `${appointmentHandoffText}${addon}`
  }, [appointmentHandoffText])

  const recordsOnePagerPreview = useMemo(() => {
    const t = recordsOnePagerText
    if (t.length <= 560) return t
    return `${t.slice(0, 560)}…`
  }, [recordsOnePagerText])

  function appendRecordsActivityEntry(taskTitle: string) {
    const id =
      typeof globalThis.crypto !== "undefined" && globalThis.crypto.randomUUID
        ? globalThis.crypto.randomUUID()
        : `tl-${Date.now()}`
    appendActionGuideDemoTimeline({
      id,
      taskId: "records-activity",
      taskTitle,
      badge: "Records",
      savedAt: new Date().toISOString(),
    })
  }

  function recordsTaskAlreadyPresent(checklistKey: string, title: string): boolean {
    const norm = normalizeRecordsDedupeKey(title)
    return adaptivePlanTasks.some(
      (t) =>
        t.recordsChecklistId === checklistKey ||
        (Boolean(t.fromRecords) && normalizeRecordsDedupeKey(t.title) === norm),
    )
  }

  function handleAddRecordsChecklistItem(def: RecordsChecklistItemDef) {
    const key = `checklist:${def.id}`
    if (recordsTaskAlreadyPresent(key, def.title)) {
      setRecordsInlineNote("Already added")
      window.setTimeout(() => setRecordsInlineNote(null), 3200)
      return
    }
    appendAdaptivePlanTasks([buildRecordsChecklistAdaptiveTask(def)])
    appendRecordsActivityEntry(`Added records task: ${def.title}`)
  }

  function handleDocumentStackAdd(checklistId: string | undefined) {
    if (!checklistId) return
    const def = RECORDS_MISSING_CHECKLIST_DEFS.find((d) => d.id === checklistId)
    if (!def) return
    handleAddRecordsChecklistItem(def)
  }

  function handleAddRecordsQuick(def: (typeof RECORDS_QUICK_ADD_TASK_DEFS)[number]) {
    const key = `quick:${def.id}`
    if (recordsTaskAlreadyPresent(key, def.title)) {
      setRecordsInlineNote("Already added")
      window.setTimeout(() => setRecordsInlineNote(null), 3200)
      return
    }
    appendAdaptivePlanTasks([buildRecordsQuickAdaptiveTask(def)])
    appendRecordsActivityEntry(`Added records task: ${def.title}`)
  }

  function handlePathologyFromStack() {
    setPathologyQuestionsOpen(true)
    window.requestAnimationFrame(() => {
      pathologyBlockRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  function handleTogglePathologyQuestions() {
    setPathologyQuestionsOpen((o) => !o)
  }

  function newDemoUpdateId() {
    return typeof globalThis.crypto !== "undefined" && globalThis.crypto.randomUUID
      ? globalThis.crypto.randomUUID()
      : `upd-${Date.now()}`
  }

  function applyInfoUpdate() {
    const trimmed = infoDraft.trim()
    if (!selectedChipId && !trimmed) return
    const chip = DEMO_INFO_UPDATE_CHIPS.find((c) => c.id === selectedChipId)
    let delta =
      selectedChipId && getDemoCaseDeltaFromChip(selectedChipId)
        ? getDemoCaseDeltaFromChip(selectedChipId)!
        : getDemoCaseDeltaFromCustomNote(trimmed || "Detail added")
    if (selectedChipId && trimmed) {
      delta = {
        ...delta,
        newInformation: `${delta.newInformation} You also noted: ${trimmed.slice(0, 200)}`,
      }
    }
    appendDemoCaseUpdate({
      id: newDemoUpdateId(),
      sourceLabel: chip?.label ?? "Your note",
      ...delta,
    })
    let planTasks = selectedChipId ? buildAdaptiveTasksFromChip(selectedChipId) : []
    if (!planTasks.length) planTasks = buildAdaptiveTasksFromCustomPlanNote(trimmed || "Detail added")
    appendAdaptivePlanTasks(planTasks)
    setInfoDraft("")
    setSelectedChipId(null)
    setInfoPanelOpen(false)
  }

  return (
    <motion.div
      key="results"
      variants={sectionVariants}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -16 }}
      className="max-w-4xl min-w-0 overflow-x-hidden"
    >
      {isBackupDemoMirror && (
        <motion.div
          variants={itemVariants}
          className="mb-3 rounded-[18px] border border-[#c9b8d8]/70 bg-[#f5eef8]/90 px-3 py-2 text-[0.7rem] leading-snug text-[#6f6280] sm:mb-4 sm:rounded-[22px] sm:px-3.5 sm:py-2.5 sm:text-sm sm:leading-6"
          role="status"
        >
          Showing backup demo response — sample only; confirm everything with your care team.
        </motion.div>
      )}

      <div className="mx-auto w-full min-w-0 max-w-3xl">
        <motion.div
          variants={itemVariants}
          className="mb-3 rounded-[16px] border border-[#e5ddd4]/90 bg-white/55 px-3 py-2.5 sm:rounded-[20px] sm:px-4 sm:py-3"
        >
          <p className="m-0 text-[13px] font-medium leading-snug text-[#3f3a36] sm:text-sm">Anchor has your case open</p>
          <p className="mt-1.5 m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs">
            You are not alone in holding this — Anchor is here to organize calm next steps.
          </p>
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="inline-flex max-w-full shrink-0 items-center rounded-full border border-[#c9b8d8]/80 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-[#6f6280] sm:text-[11px]">
              NCCN-aware prep · care team decides
            </span>
            <span className="inline-flex max-w-full shrink-0 items-center rounded-full border border-[#d8cec5] bg-[#faf7f4]/90 px-2.5 py-1 text-[10px] font-medium text-[#756f68] sm:text-[11px]">
              Case stays active locally for this demo
            </span>
          </div>
          <button
            type="button"
            onClick={onStartOver}
            className="mt-2.5 w-fit text-left text-[11px] font-medium text-[#756f68] underline decoration-[#c9b8d8]/60 underline-offset-4 hover:text-[#242230] sm:text-xs"
          >
            Start over
          </button>
        </motion.div>

        <div className="sticky top-0 z-[24] mb-3 border-b border-[#e8dfd8] bg-[#fdfbf8]/96 py-2 backdrop-blur-md sm:mb-4">
          <div className="flex min-w-0 max-w-full gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {COCKPIT_TAB_DEFS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onWorkspaceTabChange(tab.id)}
                className={`shrink-0 rounded-full border px-3 py-2 text-[12px] font-medium transition sm:px-3.5 sm:py-2 sm:text-sm ${
                  workspaceTab === tab.id
                    ? "border-[#b98da0] bg-[#f0e6f4] text-[#4a3548] shadow-sm"
                    : "border-transparent bg-white/60 text-[#5f5a55] hover:border-[#d8cec5] hover:bg-white/90"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0 max-w-full overflow-x-hidden pb-2">
          {workspaceTab === "today" && (
            <motion.div variants={itemVariants} className="grid min-w-0 gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="m-0 text-[17px] font-semibold leading-snug text-[#3f3a35] sm:text-xl">
                  {isSarahVoiceCase
                    ? "Sarah's next 72 hours"
                    : `${displayName !== "there" ? displayName : lovedOneLabel}'s next 72 hours`}
                </p>
                <p className="mt-1.5 m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">
                  NCCN-aware prep · care team decides · stored locally for this demo
                </p>
              </div>

              <p className="m-0 text-[11px] leading-snug text-[#5f5a55] sm:text-xs sm:leading-relaxed">{COCKPIT_LOCAL_CONSENT_LINE}</p>

              <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] border border-[#e5ddd4]/90 p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">Recommended now</p>
                <p className="mt-2 m-0 text-[15px] font-semibold leading-snug text-[#3f3a35] sm:text-base">Prepare for tomorrow&apos;s appointment</p>
                <p className="mt-2 m-0 text-[12px] leading-snug text-[#5f5a55] sm:text-sm sm:leading-relaxed">
                  Start with the next conversation: what is confirmed, what is pending, what records to bring, and what questions
                  you are afraid you will forget.
                </p>
                <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setGuidedPrepOpen(true)}
                    className="w-full rounded-[16px] border border-[#b98da0]/80 bg-[#b7a6c9] px-4 py-2.5 text-[12px] font-semibold text-white shadow-sm transition hover:opacity-95 sm:flex-1 sm:rounded-[18px] sm:text-sm"
                  >
                    Start guided prep
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenToolPanel("updates")
                    }}
                    className={`${GLASS_BUTTON} w-full rounded-[16px] px-4 py-2.5 text-[12px] font-medium text-[#3f3a36] sm:flex-1 sm:rounded-[18px] sm:text-sm`}
                  >
                    Add new information
                  </button>
                </div>
              </div>

              <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">What matters now</p>
                <ul className="mt-2 m-0 list-none space-y-1.5 p-0 text-[12px] leading-snug text-[#3f3a36] sm:text-sm">
                  <li className="relative pl-3.5 before:absolute before:left-0 before:top-[0.42em] before:h-1 before:w-1 before:rounded-full before:bg-[#b98da0]/90">
                    Confirm what is known versus still pending with your care team.
                  </li>
                  <li className="relative pl-3.5 before:absolute before:left-0 before:top-[0.42em] before:h-1 before:w-1 before:rounded-full before:bg-[#b98da0]/90">
                    Bring the records you already have so the visit stays concrete.
                  </li>
                  <li className="relative pl-3.5 before:absolute before:left-0 before:top-[0.42em] before:h-1 before:w-1 before:rounded-full before:bg-[#b98da0]/90">
                    Ask what decisions, if any, are expected next — not diagnosis or treatment choice from Anchor.
                  </li>
                </ul>
              </div>

              <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">Next best action</p>
                <p className="mt-2 m-0 text-[12px] leading-snug text-[#3f3a36] sm:text-sm sm:leading-relaxed">
                  Open guided prep, then add anything new under Tools → Update the plan so the checklist stays honest.
                </p>
              </div>

              <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">Top 3 questions</p>
                <ul className="mt-2 m-0 list-none space-y-1.5 p-0 text-[12px] leading-snug text-[#3f3a36] sm:text-sm">
                  <li>What is confirmed right now?</li>
                  <li>What is still pending?</li>
                  <li>What decision actually needs to be made next?</li>
                </ul>
              </div>

              <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">What to bring</p>
                <ul className="mt-2 m-0 list-none space-y-1.5 p-0 text-[12px] leading-snug text-[#3f3a36] sm:text-sm">
                  <li>Pathology or report notes you already have</li>
                  <li>Imaging summaries if available</li>
                  <li>Medication list</li>
                  <li>Portal messages or appointment details</li>
                </ul>
              </div>

              <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">Mini plan status</p>
                <p className="mt-1.5 m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">
                  Tap a count to open the full 72-hour plan in Tools. Nothing is sent automatically.
                </p>
                <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => onOpenToolPanel("plan")}
                    className="rounded-[14px] border border-[#e5ddd4] bg-white/80 px-2 py-2 text-left transition hover:bg-white sm:rounded-[16px]"
                  >
                    <p className="m-0 text-[20px] font-semibold tabular-nums text-[#3f3a35]">{boardCounts.active}</p>
                    <p className="mt-0.5 m-0 text-[10px] font-medium leading-snug text-[#756f68] sm:text-[11px]">Active tasks</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenToolPanel("plan")}
                    className="rounded-[14px] border border-[#e5ddd4] bg-white/80 px-2 py-2 text-left transition hover:bg-white sm:rounded-[16px]"
                  >
                    <p className="m-0 text-[20px] font-semibold tabular-nums text-[#3f3a35]">{boardCounts.waiting}</p>
                    <p className="mt-0.5 m-0 text-[10px] font-medium leading-snug text-[#756f68] sm:text-[11px]">Waiting on care team</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenToolPanel("plan")}
                    className="rounded-[14px] border border-[#e5ddd4] bg-white/80 px-2 py-2 text-left transition hover:bg-white sm:rounded-[16px]"
                  >
                    <p className="m-0 text-[20px] font-semibold tabular-nums text-[#3f3a35]">{boardCounts.done}</p>
                    <p className="mt-0.5 m-0 text-[10px] font-medium leading-snug text-[#756f68] sm:text-[11px]">Done</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenToolPanel("updates")}
                    className="rounded-[14px] border border-[#e5ddd4] bg-white/80 px-2 py-2 text-left transition hover:bg-white sm:rounded-[16px]"
                  >
                    <p className="m-0 text-[20px] font-semibold tabular-nums text-[#3f3a35]">{caseInformationUpdates.length}</p>
                    <p className="mt-0.5 m-0 text-[10px] font-medium leading-snug text-[#756f68] sm:text-[11px]">Updates added</p>
                  </button>
                </div>
                {boardCounts.changed > 0 && (
                  <p className="mt-2 m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs">
                    {boardCounts.changed} task{boardCounts.changed === 1 ? "" : "s"} changed after new information — see Plan.
                  </p>
                )}
              </div>

              <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">Night note · compact</p>
                <p className="mt-2 m-0 text-[12px] font-medium text-[#3f3a35] sm:text-sm">{packet.nightNote.subtitle}</p>
                <p className="mt-1.5 m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">{packet.nightNote.body}</p>
                <ul className="mt-2 m-0 list-none space-y-1 p-0 text-[11px] leading-snug text-[#5f5a55] sm:text-xs">
                  {packet.nightNote.tinyActions.slice(0, 3).map((line) => (
                    <li key={line} className="relative pl-3 before:absolute before:left-0 before:top-[0.4em] before:h-1 before:w-1 before:rounded-full before:bg-[#c9b8d8]/80">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="m-0 text-[12px] font-semibold text-[#3f3a35] sm:text-sm">{COCKPIT_WHY_NOT_CHATBOT_TITLE}</p>
                <p className="mt-2 m-0 text-[11px] leading-snug text-[#5f5a55] sm:text-xs sm:leading-relaxed">{COCKPIT_WHY_NOT_CHATBOT_BODY}</p>
              </div>
            </motion.div>
          )}

          {workspaceTab === "tools" && toolPanel === null && (
            <motion.div variants={itemVariants} className="grid min-w-0 gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="m-0 text-[16px] font-semibold text-[#3f3a35] sm:text-lg">Anchor tools</p>
                <p className="mt-1 m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">
                  Use these when you need more than the recommended next step.
                </p>
              </div>
              <div className="grid min-w-0 gap-2 sm:grid-cols-2 sm:gap-3">
                {(
                  [
                    {
                      title: "Ask Anchor",
                      body: "Ask a case-aware follow-up in plain language.",
                      panel: "ask" as const,
                    },
                    {
                      title: "Update the plan",
                      body: "Add new information and see what changed.",
                      panel: "updates" as const,
                    },
                    {
                      title: "72-hour plan",
                      body: "Track active, waiting, changed, and done tasks.",
                      panel: "plan" as const,
                    },
                    {
                      title: "Get exact words",
                      body: "Open call scripts, doctor questions, portal drafts, and family updates.",
                      panel: "actions" as const,
                    },
                    {
                      title: "Records",
                      body: "Know what to bring, what is missing, and what to ask.",
                      panel: "records" as const,
                    },
                    {
                      title: "Family support",
                      body: "Ask for one concrete thing without explaining everything again.",
                      panel: "family" as const,
                    },
                    {
                      title: "Memory",
                      body: "Review what Anchor saved locally for this demo.",
                      panel: null,
                    },
                  ] as const
                ).map((card) => (
                  <button
                    key={card.title}
                    type="button"
                    onClick={() => {
                      if (card.panel === null) {
                        onWorkspaceTabChange("saved")
                        return
                      }
                      onOpenToolPanel(card.panel)
                    }}
                    className={`${GLASS_PANEL} min-w-0 rounded-[16px] border border-[#e8dfd8]/90 p-3 text-left transition hover:border-[#b98da0]/45 hover:bg-white/90 sm:rounded-[20px] sm:p-4`}
                  >
                    <p className="m-0 text-[13px] font-semibold text-[#3f3a35] sm:text-sm">{card.title}</p>
                    <p className="mt-1.5 m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">{card.body}</p>
                  </button>
                ))}
              </div>
              <p className="m-0 text-[11px] leading-snug text-[#5f5a55] sm:text-xs sm:leading-relaxed">{COCKPIT_LOCAL_CONSENT_LINE}</p>
              <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="m-0 text-[12px] font-semibold text-[#3f3a35] sm:text-sm">{COCKPIT_WHY_NOT_CHATBOT_TITLE}</p>
                <p className="mt-2 m-0 text-[11px] leading-snug text-[#5f5a55] sm:text-xs sm:leading-relaxed">{COCKPIT_WHY_NOT_CHATBOT_BODY}</p>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {guidedPrepOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setGuidedPrepOpen(false)}
                className="fixed inset-0 z-[60] flex items-end justify-center bg-[#242230]/35 p-3 pb-6 sm:items-center sm:p-6"
                role="presentation"
              >
                <motion.div
                  initial={{ y: 48, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 32, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  onClick={(e) => e.stopPropagation()}
                  className={`${GLASS_PANEL} max-h-[min(92vh,640px)] w-full max-w-lg overflow-y-auto rounded-[20px] p-4 shadow-[0_24px_80px_rgba(36,34,48,0.18)] sm:rounded-[24px] sm:p-5`}
                  role="dialog"
                  aria-modal="true"
                  aria-label={VISIT_GUIDE_TITLE}
                >
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="m-0 text-[15px] font-semibold text-[#3f3a35] sm:text-base">{VISIT_GUIDE_TITLE}</p>
                      <p className="mt-1 m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">{VISIT_GUIDE_PURPOSE}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGuidedPrepOpen(false)}
                      className="shrink-0 rounded-full border border-[#e5ddd4] bg-white/90 px-2.5 py-1 text-[10px] font-medium text-[#5f5a55] sm:text-[11px]"
                    >
                      Close
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div>
                      <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">1 · Open with this</p>
                      <p className="mt-1.5 m-0 text-[12px] leading-snug text-[#3f3a36] sm:text-sm">{VISIT_GUIDE_OPEN_LINE}</p>
                    </div>
                    <div>
                      <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">2 · Listen for</p>
                      <ul className="mt-1.5 m-0 list-none space-y-1 p-0 text-[12px] leading-snug text-[#3f3a36] sm:text-sm">
                        {VISIT_GUIDE_LISTEN_FOR.map((line) => (
                          <li key={line} className="relative pl-3 before:absolute before:left-0 before:top-[0.42em] before:h-1 before:w-1 before:rounded-full before:bg-[#b98da0]/90">
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">3 · Ask if confused</p>
                      <ul className="mt-1.5 m-0 list-none space-y-1 p-0 text-[12px] leading-snug text-[#3f3a36] sm:text-sm">
                        {VISIT_GUIDE_IF_CONFUSED.map((line) => (
                          <li key={line} className="relative pl-3 before:absolute before:left-0 before:top-[0.42em] before:h-1 before:w-1 before:rounded-full before:bg-[#b98da0]/90">
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">4 · End with</p>
                      <p className="mt-1.5 m-0 text-[12px] leading-snug text-[#3f3a36] sm:text-sm">{VISIT_GUIDE_END_LINE}</p>
                    </div>
                    <div>
                      <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">5 · After the visit</p>
                      <ul className="mt-1.5 m-0 list-none space-y-1 p-0 text-[12px] leading-snug text-[#3f3a36] sm:text-sm">
                        {VISIT_GUIDE_AFTER_VISIT.map((line) => (
                          <li key={line} className="relative pl-3 before:absolute before:left-0 before:top-[0.42em] before:h-1 before:w-1 before:rounded-full before:bg-[#b98da0]/90">
                            {line}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs">{VISIT_GUIDE_VISIT_NOTES_HINT}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => void onCopy("visitPrep", buildVisitGuideClipboardBlock())}
                      className={`${GLASS_BUTTON} flex w-full items-center justify-center gap-2 rounded-[16px] px-3 py-2.5 text-[12px] font-medium text-[#3f3a36] sm:flex-1 sm:rounded-[18px] sm:text-sm`}
                    >
                      <Copy className="h-4 w-4 shrink-0 text-[#9b829c]" />
                      Copy visit questions
                    </button>
                    <button
                      type="button"
                      onClick={handleAddGuidedVisitPrepTask}
                      className="w-full rounded-[16px] border border-[#b98da0]/80 bg-[#f5eef8]/95 px-3 py-2.5 text-[12px] font-semibold text-[#4a3548] transition hover:bg-white sm:flex-1 sm:rounded-[18px] sm:text-sm"
                    >
                      Add visit-prep task to plan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGuidedPrepOpen(false)
                        onOpenToolPanel("plan")
                      }}
                      className={`${GLASS_BUTTON} w-full rounded-[16px] px-3 py-2.5 text-[12px] font-medium text-[#3f3a36] sm:flex-1 sm:rounded-[18px] sm:text-sm`}
                    >
                      Open full plan
                    </button>
                  </div>
                  {copied === "visitPrep" && (
                    <p className="mt-3 m-0 text-center text-[11px] text-[#4a7c59] sm:text-xs" role="status">
                      Copied. Anchor did not send anything.
                    </p>
                  )}
                  {visitPrepInlineNote && (
                    <p className="mt-2 m-0 text-center text-[11px] text-[#8b6914] sm:text-xs" role="status">
                      {visitPrepInlineNote}
                    </p>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {workspaceTab === "tools" && toolPanel === "plan" && (
            <motion.div variants={itemVariants} className="grid min-w-0 gap-3 sm:gap-4">
              <CockpitToolsBackRow onBack={() => onOpenToolPanel(null)} />
              {!planResult && (
                <p className="m-0 rounded-[14px] border border-[#e5ddd4] bg-white/70 px-3 py-2.5 text-[12px] leading-snug text-[#5f5a55] sm:rounded-[16px] sm:text-sm">
                  Generate the 72-hour plan to expand this checklist. New information you add will stay attached to this case.
                </p>
              )}
              <ResultPacketCard icon={<Sparkles className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />} label="What could change this plan">
                <ResultBulletList items={packet.planChangeFactors} />
                <p className="mt-2 text-[11px] leading-snug text-[#5f5a55] sm:mt-2.5 sm:text-xs sm:leading-relaxed">{packet.planChangeUrgentNote}</p>
              </ResultPacketCard>
              <ResultPacketCard icon={<CalendarClock className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />} label="72-hour plan">
                <p className="mb-1.5 text-[12px] leading-snug text-[#3f3a36] sm:mb-2 sm:text-sm sm:leading-relaxed">
                  Built as NCCN-aware preparation around what Anchor knows right now — not set in stone, and not a treatment
                  recommendation.
                </p>
                <p className="mb-2 text-[11px] leading-snug text-[#756f68] sm:mb-2.5 sm:text-xs sm:leading-relaxed">
                  If new information comes in, Anchor should update the plan. Update this when pathology, imaging, appointment
                  timing, or care-team instructions change.
                </p>
                <p className="mb-1.5 text-[11px] leading-snug text-[#8f7e9b] sm:mb-2 sm:text-xs sm:leading-relaxed">
                  Anchor keeps this case active locally for the demo — you do not need to restart after every new detail.
                </p>
                <p className="mb-2 text-[11px] leading-snug text-[#756f68] sm:mb-2.5 sm:text-xs sm:leading-relaxed">
                  A compact checklist you can verify with your care team — generate it here when you are ready.
                </p>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-2.5">
                  <button
                    type="button"
                    onClick={onPlan}
                    disabled={isPlanning}
                    className="flex w-full shrink-0 items-center justify-center gap-2 rounded-[20px] border border-white/80 bg-[#b7a6c9] px-4 py-2.5 text-sm font-medium text-white shadow-[0_14px_40px_rgba(151,128,163,0.22)] outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#b98da0]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfbf8] active:scale-[0.98] disabled:opacity-55 sm:rounded-[22px] sm:py-3"
                  >
                    {isPlanning ? "Building your 72-hour plan..." : "Get your 72-hour plan"}
                    <CalendarClock className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onCopy("note", noteText)}
                    className={`${GLASS_BUTTON} flex w-full items-center justify-center gap-2 rounded-[20px] px-4 py-2.5 text-sm text-[#3f3a36] outline-none focus-visible:ring-2 focus-visible:ring-[#b98da0]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfbf8] sm:rounded-[22px] sm:py-3`}
                  >
                    {copied === "note" ? "Saved to clipboard" : "Save this note"}
                    {copied === "note" ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : <Clipboard className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </button>
                </div>
              </ResultPacketCard>
              <AnimatePresence>
                {(planResult || adaptivePlanTasks.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-1 sm:mt-2"
                  >
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:mb-3 sm:text-xs">
                      72 HOURS, MADE SMALL ENOUGH TO HOLD
                    </p>
                    <AdaptivePlanBoard
                      adaptivePlanTasks={adaptivePlanTasks}
                      completedPlanTaskIds={completedPlanTaskIds}
                      guideOpenId={guideOpenId}
                      isBackupDemoMirror={isBackupDemoMirror}
                      lovedOneLabel={lovedOneLabel}
                      onGuideOpenChange={setGuideOpenId}
                      onMarkDone={markPlanTaskDone}
                      planResult={planResult}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {workspaceTab === "tools" && toolPanel === "ask" && (
            <motion.div variants={itemVariants} className="grid min-w-0 gap-3 sm:gap-4">
              <CockpitToolsBackRow onBack={() => onOpenToolPanel(null)} />
              <div className="min-w-0">
                <p className="m-0 text-[13px] font-semibold text-[#3f3a35] sm:text-base">Ask Anchor</p>
                <p className="mt-1 m-0 text-[11px] leading-snug text-[#6f665f] sm:text-xs sm:leading-relaxed">{ASK_ANCHOR_SUBTITLE}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FOLLOW_UP_CHIP_DEFS.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setSelectedFollowUpPrompt(chip.id)
                      setAskFollowUpError(null)
                      const res = onAskFollowUpSubmit(chip.id, customFollowUpQuestion)
                      if (!res.ok) {
                        setAskFollowUpError(res.message)
                        return
                      }
                    }}
                    className={`max-w-full rounded-full border px-2.5 py-1 text-left text-[10px] font-medium leading-tight transition sm:text-[11px] ${
                      selectedFollowUpPrompt === chip.id
                        ? "border-[#b98da0] bg-[#f0e6f4] text-[#3f3a35] shadow-sm"
                        : "border-[#cbc4be] bg-white text-[#3f3a35] hover:border-[#b98da0]/70 hover:bg-[#faf7f4]"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <div className="grid min-w-0 gap-2 sm:flex sm:flex-row sm:gap-2">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Follow-up question</span>
                  <input
                    type="text"
                    value={customFollowUpQuestion}
                    onChange={(e) => {
                      setCustomFollowUpQuestion(e.target.value)
                      setAskFollowUpError(null)
                    }}
                    placeholder="Ask a follow-up about this case…"
                    className="w-full min-w-0 rounded-[14px] border border-[#cbc4be] bg-white px-3 py-2.5 text-[12px] text-[#3f3a35] outline-none placeholder:text-[#6f665f] focus:border-[#b98da0] sm:rounded-[16px] sm:text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAskFollowUpError(null)
                    const res = onAskFollowUpSubmit(selectedFollowUpPrompt, customFollowUpQuestion)
                    if (!res.ok) {
                      setAskFollowUpError(res.message)
                      return
                    }
                    setCustomFollowUpQuestion("")
                  }}
                  className="shrink-0 rounded-[14px] border border-[#b98da0]/80 bg-[#b7a6c9] px-4 py-2.5 text-[12px] font-semibold text-white shadow-sm transition hover:opacity-95 sm:rounded-[16px] sm:text-sm"
                >
                  Ask
                </button>
              </div>
              {askFollowUpError && (
                <p className="m-0 text-[11px] leading-snug text-[#9b4d60] sm:text-xs" role="status">
                  {askFollowUpError}
                </p>
              )}
              <p className="m-0 text-[10px] leading-snug text-[#6f665f] sm:text-[11px]">
                Preparing questions for your care team only — not diagnosis, not treatment recommendation, not stage confirmation,
                not emergency assessment.
              </p>
              <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#6f665f] sm:text-xs">Questions asked</p>
              <div className="grid min-w-0 gap-2.5 sm:gap-3">
                {(askShowAll ? askResponsesNewestFirst : askResponsesNewestFirst.slice(0, 3)).map((item) => (
                  <div
                    key={item.id}
                    className="min-w-0 max-w-full rounded-[16px] border border-[#cbc4be] bg-white p-3 text-[#3f3a35] shadow-[0_8px_28px_rgba(63,58,53,0.06)] sm:rounded-[20px] sm:p-4"
                  >
                    <p className="m-0 text-[10px] font-medium uppercase tracking-wide text-[#6f665f]">
                      {formatDemoTimelineLabel(item.timestamp)} · {item.questionLabel}
                    </p>
                    <p className="mt-1.5 m-0 text-[13px] font-semibold leading-snug text-[#3f3a35] sm:text-sm">{item.title}</p>
                    <p className="mt-2 m-0 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-[#3f3a35] sm:text-sm">
                      {item.answer}
                    </p>
                    {item.bullets && item.bullets.length > 0 && (
                      <ul className="mt-2 m-0 list-disc space-y-1 pl-4 text-[11px] leading-snug text-[#3f3a35] sm:text-xs">
                        {item.bullets.map((b, idx) => (
                          <li key={`${item.id}-b-${idx}`} className="break-words">
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.caregiverMeaning && (
                      <div className="mt-3 border-t border-[#e8dfd8] pt-3">
                        <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#6f665f]">What this means for you</p>
                        <p className="mt-1 m-0 text-[12px] leading-relaxed text-[#3f3a35] sm:text-sm">{item.caregiverMeaning}</p>
                      </div>
                    )}
                    {item.confirmWithTeam && item.confirmWithTeam.length > 0 && (
                      <div className="mt-3 border-t border-[#e8dfd8] pt-3">
                        <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#6f665f]">
                          Confirm with your care team
                        </p>
                        <ul className="mt-1.5 m-0 list-disc space-y-1 pl-4 text-[12px] leading-snug text-[#3f3a35] sm:text-sm">
                          {item.confirmWithTeam.map((c, idx) => (
                            <li key={`${item.id}-c-${idx}`} className="break-words">
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.exactWords && (
                      <div className="mt-3 rounded-[12px] border border-[#e8dfd8] bg-[#faf7f4] p-2.5 sm:p-3">
                        <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#6f665f]">Exact words</p>
                        <p className="mt-1 m-0 text-[12px] leading-relaxed text-[#3f3a35] sm:text-sm">{item.exactWords}</p>
                      </div>
                    )}
                    <p className="mt-3 border-t border-[#e8dfd8] pt-3 text-[10px] leading-snug text-[#6f665f] sm:text-[11px]">{item.safetyFooter}</p>
                    <button
                      type="button"
                      onClick={() => void onCopy("followup", formatFollowUpClipboard(item))}
                      className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#cbc4be] bg-[#faf7f4] py-2 text-[11px] font-medium text-[#3f3a35] transition hover:bg-white sm:rounded-[14px] sm:text-xs"
                    >
                      <Copy className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                      Copy answer
                    </button>
                  </div>
                ))}
              </div>
              {askResponsesNewestFirst.length > 3 && (
                <button
                  type="button"
                  onClick={() => setAskShowAll((v) => !v)}
                  className="w-full rounded-full border border-[#8f7e9b]/40 bg-[#faf7f4]/95 py-1.5 text-[10px] font-medium text-[#5c4a62] transition hover:bg-white sm:text-[11px]"
                >
                  {askShowAll ? "Show fewer answers" : `Show all answers (${askResponsesNewestFirst.length})`}
                </button>
              )}
              {copied === "followup" && (
                <p className="m-0 text-center text-[11px] text-[#4a7c59] sm:text-xs" role="status">
                  Copied. Anchor did not send anything.
                </p>
              )}
              {followUpResponses.length === 0 && (
                <p className="m-0 text-[12px] leading-snug text-[#6f665f] sm:text-sm">
                  Tap a chip or write your own — answers stay on this device and reload with your saved case.
                </p>
              )}
            </motion.div>
          )}

          {workspaceTab === "tools" && toolPanel === "actions" && (
            <motion.div variants={itemVariants} className="grid min-w-0 gap-3 sm:gap-4">
              <CockpitToolsBackRow onBack={() => onOpenToolPanel(null)} />
              <p className="m-0 text-[12px] leading-snug text-[#3f3a36] sm:text-sm sm:leading-relaxed">
                Open any task in Tools → 72-hour plan and tap Guide me for exact words. These quick cards open the same guided sheet.
              </p>
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-xs">THREE NEXT STEPS</p>
                <div className="grid min-w-0 gap-1.5 sm:gap-2">
                  {mirrorResult.actions.slice(0, 3).map((action, index) => (
                    <motion.div
                      key={`${action}-${index}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + index * 0.08, duration: 0.45 }}
                    >
                      <ExpandableActionItem action={action} index={index} variant="compact" />
                    </motion.div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-xs">Quick scripts (demo)</p>
                <div className="grid min-w-0 gap-2 sm:grid-cols-2 sm:gap-2.5">
                  {DEMO_QUICK_GUIDE_ROWS.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => setGuideOpenId(row.id)}
                      className={`${GLASS_BUTTON} rounded-[16px] p-3 text-left text-[#3f3a36] sm:rounded-[20px] sm:p-3.5`}
                    >
                      <span className="block text-[12px] font-medium leading-snug sm:text-sm">{row.title}</span>
                      <span className="mt-1 block text-[10px] font-medium text-[#9b829c] sm:text-[11px]">Guide me · same sheet as Plan</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onCopy("handoff", handoffText)}
                className={`${GLASS_BUTTON} flex items-center justify-between gap-2 rounded-[20px] p-3 text-left text-[#3f3a36] outline-none focus-visible:ring-2 focus-visible:ring-[#b98da0]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfbf8] sm:rounded-[22px] sm:p-3.5`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[#242230]">Copy update for support person</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-[#756f68] sm:text-xs sm:text-sm">
                    {copied === "handoff"
                      ? "Copied. You can paste this into a text to your support person."
                      : "Copies a short update to your clipboard — nothing is sent from Anchor."}
                  </span>
                </span>
                <Copy className="h-4 w-4 shrink-0 text-[#9b829c] sm:h-5 sm:w-5" />
              </button>
            </motion.div>
          )}

          {workspaceTab === "tools" && toolPanel === "updates" && (
            <motion.div variants={itemVariants} className="grid min-w-0 gap-3 sm:gap-4">
              <CockpitToolsBackRow onBack={() => onOpenToolPanel(null)} />
              <p className="m-0 text-[12px] leading-snug text-[#3f3a36] sm:text-sm sm:leading-relaxed">
                Add one detail. Anchor will show what changed and update the plan board. Updates you save here also feed the
                adaptive checklist in Tools → 72-hour plan — NCCN-aware prep, not set in stone.
              </p>
              <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <div className="mb-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <p className="m-0 text-[12px] font-medium text-[#3f3a36] sm:text-sm">I have new information</p>
                  <button
                    type="button"
                    onClick={() => setInfoPanelOpen((o) => !o)}
                    className="w-fit rounded-full border border-[#b98da0]/50 bg-white/75 px-3 py-1.5 text-left text-[11px] font-medium text-[#5c4a62] shadow-sm transition hover:border-[#b98da0] hover:bg-white sm:text-xs"
                  >
                    {infoPanelOpen ? "Close update panel" : "Open update panel"}
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {infoPanelOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden rounded-[14px] border border-[#d8cec5]/90 bg-[#fdfaf7] p-2.5 sm:rounded-[16px] sm:p-3"
                    >
                      <p className="m-0 text-[12px] font-medium text-[#3f3a36] sm:text-sm">I have new information</p>
                      <p className="mt-1 text-[11px] leading-snug text-[#756f68] sm:text-xs">
                        Add one detail. Anchor will show what changed and update the plan board.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {DEMO_INFO_UPDATE_CHIPS.map((chip) => (
                          <button
                            key={chip.id}
                            type="button"
                            onClick={() => setSelectedChipId((cur) => (cur === chip.id ? null : chip.id))}
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-medium leading-tight transition sm:text-[11px] ${
                              selectedChipId === chip.id
                                ? "border-[#b98da0] bg-[#f0e6f4] text-[#4a3548]"
                                : "border-[#e5ddd4] bg-white/90 text-[#5f5a55] hover:border-[#c9b8d8]"
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                      <label className="mt-2 block">
                        <span className="sr-only">Additional detail</span>
                        <input
                          type="text"
                          value={infoDraft}
                          onChange={(e) => setInfoDraft(e.target.value)}
                          placeholder="Example: The oncologist said imaging is still pending."
                          className="w-full rounded-[12px] border border-[#e5ddd4] bg-white px-2.5 py-2 text-[12px] text-[#3f3a36] outline-none placeholder:text-[#a09a93] focus:border-[#b98da0]/70 sm:rounded-[14px] sm:py-2.5 sm:text-sm"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={applyInfoUpdate}
                        className="mt-2 w-full rounded-[14px] border border-white/80 bg-[#b7a6c9] py-2 text-[12px] font-medium text-white shadow-sm transition hover:opacity-95 sm:mt-2.5 sm:rounded-[16px] sm:text-sm"
                      >
                        Update this plan
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {caseInformationUpdates.length > 0 && (
                <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-xs">What changed</p>
                  <div className="grid gap-2.5 sm:gap-3">
                    {caseInformationUpdates.map((u) => (
                      <div key={u.id} className="rounded-[12px] border border-[#e8dfd8] bg-white/65 p-2.5 sm:rounded-[14px] sm:p-3">
                        <p className="text-[10px] font-medium text-[#9b829c] sm:text-[11px]">{u.sourceLabel}</p>
                        <ul className="mt-1.5 list-none space-y-1.5 p-0 text-[12px] leading-snug text-[#3f3a36] sm:text-sm sm:leading-relaxed">
                          <li>
                            <span className="font-medium text-[#5f5a55]">1. New information added · </span>
                            {u.newInformation}
                          </li>
                          <li>
                            <span className="font-medium text-[#5f5a55]">2. What this may affect · </span>
                            {u.mayAffect}
                          </li>
                          <li>
                            <span className="font-medium text-[#5f5a55]">3. What still needs confirmation · </span>
                            {u.needsConfirmation}
                          </li>
                          <li>
                            <span className="font-medium text-[#5f5a55]">4. What to ask next · </span>
                            {u.askNext}
                          </li>
                          <li>
                            <span className="font-medium text-[#5f5a55]">5. Revised next step · </span>
                            {u.revisedStep}
                          </li>
                        </ul>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2.5 border-t border-[#ece4dc] pt-2 text-[10px] leading-snug text-[#756f68] sm:text-[11px] sm:leading-relaxed">
                    Based on what Anchor knows right now — not set in stone. Anchor can help prepare NCCN-aware questions and
                    organize next steps. It does not diagnose, prescribe, choose treatment, confirm stage, or replace your care
                    team.
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={onAddByVoice}
                className={`${GLASS_BUTTON} flex items-center justify-between gap-2 rounded-[20px] p-3 text-left text-[#3f3a36] outline-none focus-visible:ring-2 focus-visible:ring-[#b98da0]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfbf8] sm:rounded-[22px] sm:p-3.5`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[#242230]">Add by voice</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-[#756f68] sm:text-xs sm:text-sm">
                    Add another detail to this same case — your last result stays until you start over.
                  </span>
                </span>
                <Mic className="h-4 w-4 shrink-0 text-[#b98da0] sm:h-5 sm:w-5" />
              </button>
            </motion.div>
          )}

          {workspaceTab === "tools" && toolPanel === "records" && (
            <motion.div variants={itemVariants} className="grid min-w-0 gap-3 sm:gap-4">
              <CockpitToolsBackRow onBack={() => onOpenToolPanel(null)} />
              <div className="min-w-0">
                <p className="m-0 text-[13px] font-semibold text-[#3f3a35] sm:text-base">Records</p>
                <p className="mt-1 m-0 text-[11px] leading-snug text-[#6f665f] sm:text-xs sm:leading-relaxed">{RECORDS_TAB_SUBTITLE}</p>
                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="inline-flex max-w-full shrink-0 items-center rounded-full border border-[#c9b8d8]/80 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-[#6f6280] sm:text-[11px]">
                    {RECORDS_PROTO_BADGE}
                  </span>
                </div>
              </div>

              <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-xs">Today · Start with three things</p>
                <p className="m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">{RECORDS_THREE_THINGS_INTRO}</p>
                <ul className="mt-2 m-0 list-none space-y-1.5 p-0 text-[11px] leading-snug text-[#3f3a36] sm:text-xs">
                  <li className="relative break-words pl-3 before:absolute before:left-0 before:top-[0.35em] before:text-[#b98da0] before:content-['•']">
                    <span className="font-semibold text-[#5f5a55]">What do we have? </span>
                    Real copies you can lay out before the visit — not perfect, just gathered.
                  </li>
                  <li className="relative break-words pl-3 before:absolute before:left-0 before:top-[0.35em] before:text-[#b98da0] before:content-['•']">
                    <span className="font-semibold text-[#5f5a55]">What is missing? </span>
                    Tests, summaries, or instructions still only in voicemail or the portal.
                  </li>
                  <li className="relative break-words pl-3 before:absolute before:left-0 before:top-[0.35em] before:text-[#b98da0] before:content-['•']">
                    <span className="font-semibold text-[#5f5a55]">What should we ask? </span>
                    A few plain questions about what is confirmed, what is pending, and what happens next.
                  </li>
                </ul>
                <div className="mt-2.5 flex min-w-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => scrollToRecordsSection(recordsDocStackRef)}
                    className="rounded-full border border-[#8f7e9b]/45 bg-[#faf7f4]/95 px-3 py-1.5 text-[10px] font-medium text-[#5c4a62] transition hover:bg-white sm:text-[11px]"
                  >
                    Jump to what we have
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToRecordsSection(recordsMissingRef)}
                    className="rounded-full border border-[#8f7e9b]/45 bg-[#faf7f4]/95 px-3 py-1.5 text-[10px] font-medium text-[#5c4a62] transition hover:bg-white sm:text-[11px]"
                  >
                    Jump to what is missing
                  </button>
                  <button
                    type="button"
                    onClick={handlePathologyFromStack}
                    className="rounded-full border border-[#b98da0]/45 bg-[#f5eef8]/90 px-3 py-1.5 text-[10px] font-medium text-[#5c4a62] transition hover:bg-white sm:text-[11px]"
                  >
                    Jump to what to ask
                  </button>
                </div>
              </div>

              <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-3.5`}>
                <div className="mb-2 flex min-w-0 items-start gap-2">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-[#9b829c] sm:h-5 sm:w-5" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[12px] font-semibold text-[#3f3a35] sm:text-sm">Bring these to the appointment</p>
                    <p className="mt-1 m-0 text-[10px] leading-snug text-[#6f665f] sm:text-[11px] sm:leading-relaxed">
                      First-72-hour visit packet — same thread as Memory, plus a records add-on. Copy into your own notes; nothing
                      is sent.
                    </p>
                  </div>
                </div>
                <pre className="m-0 max-h-36 min-w-0 overflow-x-auto whitespace-pre-wrap break-words rounded-[12px] border border-[#ece4dc] bg-white/70 p-2 font-sans text-[10px] leading-snug text-[#3f3a36] sm:max-h-40 sm:text-[11px]">
                  {recordsOnePagerPreview}
                </pre>
                <button
                  type="button"
                  onClick={() => void onCopy("recordsOnePager", recordsOnePagerText, "Copied appointment one-pager")}
                  className={`${GLASS_BUTTON} mt-2 flex w-full items-center justify-center gap-2 rounded-[14px] px-3 py-2 text-[11px] font-medium sm:rounded-[16px] sm:text-sm`}
                >
                  <Copy className="h-4 w-4 shrink-0 text-[#9b829c]" aria-hidden />
                  Copy visit packet
                </button>
              </div>

              <div ref={recordsDocStackRef} className={`${GLASS_PANEL} min-w-0 scroll-mt-24 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-xs">What you have vs. what to find</p>
                <div className="grid min-w-0 gap-2 sm:gap-2.5">
                  {RECORDS_DOCUMENT_STACK_DEFS.map((doc) => {
                    const statusLabel = recordsDocStackStatusLabel(doc.status)
                    const statusClass =
                      doc.status === "sample"
                        ? "border-[#b8d4c4]/80 bg-[#f4faf6]/95 text-[#3d5c4f]"
                        : doc.status === "missing"
                          ? "border-[#e0c9a8]/90 bg-[#fff9f0]/95 text-[#6b4f2f]"
                          : "border-[#d8cec5]/90 bg-white/80 text-[#5f5a55]"
                    return (
                      <div
                        key={doc.id}
                        className="flex min-w-0 flex-col gap-2 rounded-[14px] border border-[#e8dfd8] bg-white/70 p-2.5 sm:flex-row sm:items-start sm:justify-between sm:rounded-[16px] sm:p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 shrink-0 text-[#9b829c] sm:h-4 sm:w-4" aria-hidden />
                            <p className="m-0 text-[12px] font-semibold text-[#3f3a36] sm:text-sm">{doc.label}</p>
                            <span className={`inline-flex max-w-full shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide sm:text-[10px] ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </div>
                          <p className="mt-1 m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs">{doc.body}</p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-1.5 sm:items-end">
                          {doc.id === "pathology" ? (
                            <button
                              type="button"
                              onClick={handlePathologyFromStack}
                              className="w-full rounded-full border border-[#8f7e9b]/45 bg-[#faf7f4]/95 px-3 py-1.5 text-left text-[10px] font-medium text-[#5c4a62] transition hover:bg-white sm:w-auto sm:text-[11px]"
                            >
                              Prep sample questions
                            </button>
                          ) : doc.checklistId ? (
                            <button
                              type="button"
                              onClick={() => handleDocumentStackAdd(doc.checklistId)}
                              className="w-full rounded-full border border-[#b98da0]/45 bg-[#f5eef8]/90 px-3 py-1.5 text-left text-[10px] font-medium text-[#5c4a62] transition hover:bg-white sm:w-auto sm:text-[11px]"
                            >
                              Add plan task
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#9b829c] sm:text-[11px]">No auto task</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div ref={recordsMissingRef} className={`${GLASS_PANEL} min-w-0 scroll-mt-24 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-xs">Today · What is missing</p>
                <p className="m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">
                  Tap Add as task to place a row on your Plan board — deduped so the same checklist line does not stack twice.
                </p>
                <ul className="mt-2 m-0 grid list-none gap-2 p-0">
                  {RECORDS_MISSING_CHECKLIST_DEFS.map((item) => (
                    <li
                      key={item.id}
                      className="flex min-w-0 flex-col gap-2 rounded-[12px] border border-[#e8dfd8] bg-white/65 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:rounded-[14px] sm:p-3"
                    >
                      <p className="m-0 min-w-0 flex-1 text-[12px] leading-snug text-[#3f3a36] sm:text-sm">{item.title}</p>
                      <button
                        type="button"
                        onClick={() => handleAddRecordsChecklistItem(item)}
                        className="shrink-0 rounded-full border border-[#8f7e9b]/45 bg-[#faf7f4]/95 px-3 py-1.5 text-[10px] font-medium text-[#5c4a62] transition hover:bg-white sm:text-[11px]"
                      >
                        Add as task
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div ref={pathologyBlockRef} className={`${GLASS_PANEL} min-w-0 scroll-mt-28 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-xs">Sample pathology record</p>
                <p className="m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">
                  Illustrative wording only — de-identified demo. Anchor does not read your files in this prototype and does not
                  interpret pathology.
                </p>
                <dl className="mt-2 m-0 grid gap-2 text-[11px] leading-snug text-[#3f3a36] sm:text-xs sm:leading-relaxed">
                  {SAMPLE_PATHOLOGY_RECORD_LINES.map((row) => (
                    <div key={row.label} className="min-w-0 rounded-[12px] border border-[#ece4dc] bg-white/60 p-2 sm:p-2.5">
                      <dt className="font-semibold text-[#5f5a55]">{row.label}</dt>
                      <dd className="m-0 mt-0.5 break-words">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-2.5 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={handleTogglePathologyQuestions}
                    className="inline-flex min-w-0 flex-1 items-center justify-center rounded-[14px] border border-[#b98da0]/80 bg-[#b7a6c9] px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:opacity-95 sm:flex-none sm:px-4 sm:text-xs"
                  >
                    {pathologyQuestionsOpen ? "Hide sample questions" : "Generate questions from this sample"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void onCopy("recordsPathology", pathologyQuestionsCopyText, "Copied pathology questions")
                    }
                    className={`${GLASS_BUTTON} inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] px-3 py-2 text-[11px] font-medium sm:flex-none sm:px-4 sm:text-xs`}
                  >
                    <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Copy pathology questions
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {pathologyQuestionsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <ul className="mt-2 m-0 list-none space-y-1.5 border-t border-[#ece4dc] p-0 pt-2 text-[11px] leading-snug text-[#3f3a36] sm:text-xs sm:leading-relaxed">
                        {SAMPLE_PATHOLOGY_QUESTIONS.map((q, i) => (
                          <li key={i} className="relative break-words pl-3.5 before:absolute before:left-0 before:top-[0.4em] before:h-1 before:w-1 before:rounded-full before:bg-[#b98da0]/90">
                            {q}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <details className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <summary className="cursor-pointer list-none text-[12px] font-semibold text-[#3f3a35] sm:text-sm [&::-webkit-details-marker]:hidden">
                  Later · if needed
                  <span className="mt-1 block text-[10px] font-normal leading-snug text-[#756f68] sm:text-[11px]">
                    Second opinion packet, record transfer hygiene, and quick-add plan rows — open when you are past the first
                    touchpoint.
                  </span>
                </summary>
                <div className="mt-3 grid min-w-0 gap-3 border-t border-[#ece4dc]/90 pt-3">
                  <div className="rounded-[14px] border border-[#e8dfd8] bg-white/65 p-3 sm:rounded-[16px]">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-xs">Second-opinion packet checklist</p>
                    <p className="m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">{RECORDS_SECOND_OPINION_INTRO}</p>
                    <ul className="mt-2 m-0 list-none space-y-1 p-0 text-[11px] leading-snug text-[#3f3a36] sm:text-xs sm:leading-relaxed">
                      {RECORDS_SECOND_OPINION_CHECKLIST_LINES.map((line) => (
                        <li key={line} className="relative break-words pl-3.5 before:absolute before:left-0 before:top-[0.4em] before:h-1 before:w-1 before:rounded-full before:bg-[#b98da0]/90">
                          {line}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() =>
                        void onCopy("recordsSecondOpinion", secondOpinionChecklistCopyText, "Copied second-opinion checklist")
                      }
                      className={`${GLASS_BUTTON} mt-2 flex w-full items-center justify-center gap-2 rounded-[14px] px-3 py-2.5 text-[12px] font-medium sm:rounded-[16px] sm:text-sm`}
                    >
                      <Copy className="h-4 w-4 shrink-0 text-[#9b829c]" aria-hidden />
                      Copy second-opinion checklist
                    </button>
                  </div>

                  <ResultPacketCard icon={<ShieldCheck className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />} label="Record transfer checklist">
                    <ResultBulletList items={[...RECORDS_TRANSFER_CHECKLIST_BULLETS]} />
                    <button
                      type="button"
                      onClick={() =>
                        void onCopy("recordsTransfer", recordTransferChecklistCopyText, "Copied record transfer checklist")
                      }
                      className={`${GLASS_BUTTON} mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] px-3 py-2.5 text-[12px] font-medium sm:rounded-[16px] sm:text-sm`}
                    >
                      <Copy className="h-4 w-4 shrink-0 text-[#9b829c]" aria-hidden />
                      Copy record transfer checklist
                    </button>
                  </ResultPacketCard>

                  <div className="rounded-[14px] border border-[#e8dfd8] bg-white/65 p-3 sm:rounded-[16px]">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-xs">Records quick-add tasks</p>
                    <p className="m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">
                      These land on your Plan board with the same persistence as other adaptive tasks — demo only, not sent to your
                      clinic.
                    </p>
                    <div className="mt-2 grid min-w-0 gap-2">
                      {RECORDS_QUICK_ADD_TASK_DEFS.map((def) => (
                        <div
                          key={def.id}
                          className="flex min-w-0 flex-col gap-2 rounded-[12px] border border-[#e8dfd8] bg-white/65 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:rounded-[14px] sm:p-3"
                        >
                          <p className="m-0 min-w-0 flex-1 text-[12px] leading-snug text-[#3f3a36] sm:text-sm">{def.title}</p>
                          <button
                            type="button"
                            onClick={() => handleAddRecordsQuick(def)}
                            className="shrink-0 rounded-full border border-[#b98da0]/45 bg-[#f5eef8]/90 px-3 py-1.5 text-[10px] font-medium text-[#5c4a62] transition hover:bg-white sm:text-[11px]"
                          >
                            Add to plan
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </details>

              {(copied === "recordsPathology" ||
                copied === "recordsSecondOpinion" ||
                copied === "recordsTransfer" ||
                copied === "recordsOnePager") && (
                <p className="m-0 text-center text-[11px] text-[#4a7c59] sm:text-xs" role="status">
                  Copied. Anchor did not send anything.
                </p>
              )}
              {recordsInlineNote && (
                <p className="m-0 text-center text-[11px] text-[#8b6914] sm:text-xs" role="status">
                  {recordsInlineNote}
                </p>
              )}

              <div className="rounded-[14px] border border-[#e5ddd4] bg-[#faf7f4]/90 px-3 py-2.5 text-[10px] leading-snug text-[#5f5a55] sm:rounded-[16px] sm:px-3.5 sm:py-3 sm:text-[11px] sm:leading-relaxed">
                <p className="m-0 font-semibold text-[#3f3a36]">Safety</p>
                <p className="mt-1 m-0">
                  Anchor organizes materials for preparation and visit clarity. It does not diagnose from documents, interpret
                  findings as medical advice, confirm cancer stage, or choose treatment. Ask your care team to interpret every
                  report. This demo is not HIPAA-grade storage and not a substitute for your hospital record system.
                </p>
              </div>
            </motion.div>
          )}

          {workspaceTab === "tools" && toolPanel === "family" && (
            <motion.div variants={itemVariants} className="grid min-w-0 gap-3 sm:gap-4">
              <CockpitToolsBackRow onBack={() => onOpenToolPanel(null)} />
              <div className="min-w-0">
                <p className="m-0 text-[13px] font-semibold text-[#3f3a35] sm:text-base">Family support</p>
                <p className="mt-1 m-0 text-[11px] leading-snug text-[#6f665f] sm:text-xs sm:leading-relaxed">{FAMILY_TAB_SUBTITLE}</p>
                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="inline-flex max-w-full shrink-0 items-center rounded-full border border-[#c9b8d8]/80 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-[#6f6280] sm:text-[11px]">
                    {FAMILY_PROTO_BADGE}
                  </span>
                </div>
              </div>

              <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <div className="mb-2 flex min-w-0 items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#9b829c] sm:h-5 sm:w-5" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[12px] font-semibold text-[#3f3a35] sm:text-sm">Ask for one concrete thing</p>
                    <p className="mt-1 m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">
                      Pick a single job someone can own — Anchor drafts language and can add a Plan reminder. Nothing sends until
                      you copy it yourself. Listen for confirmed, pending, and next questions; capture key answers here — not to
                      replace your care team&apos;s visit note, which may arrive later.
                    </p>
                  </div>
                </div>
                <div className="grid min-w-0 gap-2.5">
                  {FAMILY_PRIMARY_ASK_CARDS.map((card) => (
                    <div
                      key={card.id}
                      className="flex min-w-0 flex-col gap-2 rounded-[14px] border border-[#e8dfd8] bg-white/70 p-2.5 sm:rounded-[16px] sm:p-3"
                    >
                      <div className="min-w-0">
                        <p className="m-0 text-[12px] font-semibold text-[#3f3a36] sm:text-sm">{card.roleTitle}</p>
                        <p className="mt-1 m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs">{card.taskSummary}</p>
                        <p className="mt-1.5 m-0 text-[10px] leading-snug text-[#5f5a55] sm:text-[11px] sm:leading-relaxed">
                          <span className="font-semibold text-[#6f6280]">Why this helps · </span>
                          {card.whyThisHelps}
                        </p>
                      </div>
                      <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleAddFamilySupportTask(card)}
                          className="inline-flex min-w-0 flex-1 items-center justify-center rounded-full border border-[#b98da0]/45 bg-[#f5eef8]/90 px-3 py-1.5 text-[10px] font-medium text-[#5c4a62] transition hover:bg-white sm:flex-none sm:text-[11px]"
                        >
                          Add to plan
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void onCopy("familyClip", card.askDraft, "Copied family ask draft", {
                              taskTitle: "Copied family ask draft",
                              badge: "Family",
                              taskId: "family-activity",
                            })
                          }
                          className={`${GLASS_BUTTON} inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-medium sm:flex-none sm:text-[11px]`}
                        >
                          <Copy className="h-3 w-3 shrink-0" aria-hidden />
                          Copy ask
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <details className="mt-3 rounded-[12px] border border-[#ece4dc] bg-[#faf7f4]/80 p-2.5 sm:p-3">
                  <summary className="cursor-pointer list-none text-[11px] font-semibold text-[#3f3a36] sm:text-xs [&::-webkit-details-marker]:hidden">
                    More ways people can help
                    <span className="mt-0.5 block text-[10px] font-normal leading-snug text-[#756f68]">
                      Insurance, meals, relative updates, portal help, follow-up rides — still one task at a time.
                    </span>
                  </summary>
                  <div className="mt-2.5 grid min-w-0 gap-2 border-t border-[#ece4dc]/90 pt-2.5">
                    {FAMILY_MORE_HELP_ROLE_CARDS.map((card) => (
                      <div
                        key={card.id}
                        className="flex min-w-0 flex-col gap-2 rounded-[12px] border border-[#e8dfd8] bg-white/80 p-2.5 sm:p-3"
                      >
                        <div className="min-w-0">
                          <p className="m-0 text-[11px] font-semibold text-[#3f3a36] sm:text-xs">{card.roleTitle}</p>
                          <p className="mt-1 m-0 text-[10px] leading-snug text-[#756f68] sm:text-[11px]">{card.whyThisHelps}</p>
                        </div>
                        <div className="flex min-w-0 flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddFamilySupportTask(card)}
                            className="rounded-full border border-[#b98da0]/45 bg-[#f5eef8]/90 px-2.5 py-1 text-[9px] font-medium text-[#5c4a62] transition hover:bg-white sm:text-[10px]"
                          >
                            Add to plan
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void onCopy("familyClip", card.askDraft, "Copied family ask draft", {
                                taskTitle: "Copied family ask draft",
                                badge: "Family",
                                taskId: "family-activity",
                              })
                            }
                            className={`${GLASS_BUTTON} inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-medium sm:text-[10px]`}
                          >
                            <Copy className="h-3 w-3 shrink-0" aria-hidden />
                            Copy ask
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>

              <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-xs">Later · texts to relatives</p>
                <p className="m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">
                  Listen for confirmed versus pending before you text the group chat. Nothing is sent from Anchor — copy and edit
                  in your own words.
                </p>
                <div className="mt-2.5 grid min-w-0 gap-3">
                  {[
                    { label: "Calm short update", body: FAMILY_UPDATE_DRAFT_CALM, slug: "Calm short update" },
                    { label: "More detailed update", body: FAMILY_UPDATE_DRAFT_DETAIL, slug: "More detailed update" },
                    { label: "Help request", body: FAMILY_UPDATE_DRAFT_HELP, slug: "Help request" },
                  ].map((d) => (
                    <div key={d.label} className="rounded-[12px] border border-[#ece4dc] bg-white/65 p-2.5 sm:p-3">
                      <p className="m-0 text-[11px] font-semibold text-[#5f5a55] sm:text-xs">{d.label}</p>
                      <p className="mt-1.5 m-0 text-[11px] leading-snug text-[#3f3a36] sm:text-xs sm:leading-relaxed">{d.body}</p>
                      <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            void onCopy("familyClip", d.body, `Copied family draft: ${d.slug}`, {
                              taskTitle: `Copied family draft: ${d.slug}`,
                              badge: "Family",
                              taskId: "family-activity",
                            })
                          }
                          className={`${GLASS_BUTTON} inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium sm:text-[11px]`}
                        >
                          <Copy className="h-3 w-3 shrink-0" aria-hidden />
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => appendFamilyActivityEntry(`Saved family draft: ${d.slug}`)}
                          className="rounded-full border border-[#8f7e9b]/40 bg-[#faf7f4]/95 px-2.5 py-1 text-[10px] font-medium text-[#5c4a62] transition hover:bg-white sm:text-[11px]"
                        >
                          Save to memory preview
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-xs">Explain this to…</p>
                <div className="grid min-w-0 gap-2">
                  {FAMILY_EXPLAIN_CARDS.map((c) => (
                    <div key={c.id} className="rounded-[12px] border border-[#e8dfd8] bg-white/65 p-2.5 sm:p-3">
                      <p className="m-0 text-[11px] font-semibold text-[#3f3a36] sm:text-xs">{c.label}</p>
                      <p className="mt-1 m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">{c.body}</p>
                      <button
                        type="button"
                        onClick={() =>
                          void onCopy("familyClip", `${c.label}\n\n${c.body}`, `Copied explain: ${c.label}`, {
                            taskTitle: `Copied explain: ${c.label}`,
                            badge: "Family",
                            taskId: "family-activity",
                          })
                        }
                        className={`${GLASS_BUTTON} mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium sm:text-[11px]`}
                      >
                        <Copy className="h-3 w-3 shrink-0" aria-hidden />
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-xs">What helps vs. what adds pressure</p>
                <p className="m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">
                  Gentle framing — everyone is scared. The goal is practical support, not judgment.
                </p>
                <div className="mt-2 grid min-w-0 gap-3 md:grid-cols-2">
                  <div className="min-w-0 rounded-[12px] border border-[#d8e8d8]/90 bg-[#f6faf6]/90 p-2.5 sm:p-3">
                    <p className="m-0 text-[11px] font-semibold text-[#3d5c4f] sm:text-xs">Helpful</p>
                    <ul className="mt-1.5 m-0 list-none space-y-1 p-0 text-[11px] leading-snug text-[#3f3a36] sm:text-xs">
                      {FAMILY_HELPS_LINES.map((line) => (
                        <li key={line} className="relative break-words pl-3 before:absolute before:left-0 before:top-[0.35em] before:text-[#7aab7f] before:content-['•']">
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="min-w-0 rounded-[12px] border border-[#e8dfd8] bg-white/70 p-2.5 sm:p-3">
                    <p className="m-0 text-[11px] font-semibold text-[#6f5a55] sm:text-xs">Often adds pressure</p>
                    <ul className="mt-1.5 m-0 list-none space-y-1 p-0 text-[11px] leading-snug text-[#3f3a36] sm:text-xs">
                      {FAMILY_AVOID_PRESSURE_LINES.map((line) => (
                        <li key={line} className="relative break-words pl-3 before:absolute before:left-0 before:top-[0.35em] before:text-[#c9a8a8] before:content-['•']">
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-xs">Support tasks</p>
                <p className="m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">
                  Three gentle columns — you still choose who does what in real life. Persists with this local case.
                </p>
                <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-3">
                  <div className="min-w-0 rounded-[12px] border border-[#e8dfd8] bg-white/65 p-2.5 sm:p-3">
                    <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">Needs help</p>
                    <ul className="mt-2 m-0 list-none space-y-2 p-0">
                      {familyNeedsOwnerRows.map((r) => (
                        <li key={r.id} className="rounded-[10px] border border-[#ece4dc] bg-[#faf7f4]/90 p-2">
                          <p className="m-0 text-[11px] font-medium text-[#3f3a36] sm:text-xs">{r.title}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => patchFamilyCoordRow(r.id, { owner: "sibling" })}
                              className="rounded-full border border-[#8f7e9b]/40 bg-white/90 px-2 py-0.5 text-[9px] font-medium text-[#5c4a62] sm:text-[10px]"
                            >
                              Someone can take this · sibling
                            </button>
                            <button
                              type="button"
                              onClick={() => patchFamilyCoordRow(r.id, { owner: "family-member" })}
                              className="rounded-full border border-[#8f7e9b]/40 bg-white/90 px-2 py-0.5 text-[9px] font-medium text-[#5c4a62] sm:text-[10px]"
                            >
                              Someone can take this · family
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="min-w-0 rounded-[12px] border border-[#e8dfd8] bg-white/65 p-2.5 sm:p-3">
                    <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">Someone can take this</p>
                    <ul className="mt-2 m-0 list-none space-y-2 p-0">
                      {familyAssignedRows.map((r) => (
                        <li key={r.id} className="rounded-[10px] border border-[#ece4dc] bg-[#faf7f4]/90 p-2">
                          <p className="m-0 text-[11px] font-medium text-[#3f3a36] sm:text-xs">{r.title}</p>
                          <p className="mt-0.5 m-0 text-[10px] text-[#9b829c] sm:text-[11px]">
                            {r.owner === "sibling" ? "Taken · sibling lane" : "Taken · family lane"}
                          </p>
                          <button
                            type="button"
                            onClick={() => patchFamilyCoordRow(r.id, { done: true, owner: "none" })}
                            className="mt-1.5 rounded-full border border-[#b98da0]/45 bg-[#f5eef8]/90 px-2 py-0.5 text-[9px] font-medium text-[#5c4a62] sm:text-[10px]"
                          >
                            Mark done
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="min-w-0 rounded-[12px] border border-[#e8dfd8] bg-white/65 p-2.5 sm:p-3">
                    <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">Done</p>
                    <ul className="mt-2 m-0 list-none space-y-1.5 p-0">
                      {familyDoneRows.map((r) => (
                        <li key={r.id} className="text-[11px] leading-snug text-[#3f3a36] sm:text-xs">
                          <span className="text-[#7aab7f]">✓ </span>
                          {r.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-[14px] border border-[#e5ddd4] bg-[#faf7f4]/90 px-3 py-2.5 text-[10px] leading-snug text-[#5f5a55] sm:rounded-[16px] sm:px-3.5 sm:py-3 sm:text-[11px] sm:leading-relaxed">
                <p className="m-0 font-semibold text-[#3f3a36]">Boundaries</p>
                <p className="mt-1 m-0">{FAMILY_SAFETY_FOOTER}</p>
                <p className="mt-1.5 m-0 text-[#756f68]">To erase this demo memory, use Start over in the header above.</p>
              </div>

              {copied === "familyClip" && (
                <p className="m-0 text-center text-[11px] text-[#4a7c59] sm:text-xs" role="status">
                  Copied. Anchor did not send anything.
                </p>
              )}
              {familyInlineNote && (
                <p className="m-0 text-center text-[11px] text-[#8b6914] sm:text-xs" role="status">
                  {familyInlineNote}
                </p>
              )}
            </motion.div>
          )}

          {workspaceTab === "saved" && (
            <motion.div variants={itemVariants} className="grid min-w-0 max-w-full gap-3 overflow-x-hidden sm:gap-4">
              <div className="min-w-0 max-w-full">
                <p className="m-0 text-[16px] font-semibold leading-snug text-[#3f3a35] sm:text-lg">Saved case</p>
                <p className="mt-1 m-0 text-[11px] leading-snug text-[#6f665f] sm:text-xs sm:leading-relaxed">
                  Anchor keeps the important parts locally for this demo so you do not have to restart from zero.
                </p>
                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="inline-flex max-w-full shrink-0 items-center rounded-full border border-[#c9b8d8]/80 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-[#6f6280] sm:text-[11px]">
                    {MEMORY_PROTO_BADGE}
                  </span>
                </div>
                <p className="mt-2 m-0 text-[11px] leading-snug text-[#5f5a55] sm:text-xs sm:leading-relaxed">{MEMORY_ANCHOR_ORGANIZED_LINE}</p>
                <p className="mt-2 m-0 text-[11px] leading-snug text-[#5f5a55] sm:text-xs sm:leading-relaxed">{COCKPIT_LOCAL_CONSENT_LINE}</p>
              </div>

              <div className={`${GLASS_PANEL} min-w-0 max-w-full rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">What Anchor is holding onto</p>
                <p className="m-0 text-[12px] leading-snug text-[#3f3a36] sm:text-sm sm:leading-relaxed">{memoryHoldingNarrative}</p>
                <ul className="mt-2 m-0 list-none space-y-1 p-0 text-[10px] leading-snug text-[#5f5a55] sm:text-[11px] sm:leading-relaxed">
                  <li>
                    <span className="font-medium text-[#6f6280]">Caregiver · </span>
                    {caregiverCardName}
                  </li>
                  <li>
                    <span className="font-medium text-[#6f6280]">Loved one · </span>
                    {lovedOneLabel}
                  </li>
                  <li>
                    <span className="font-medium text-[#6f6280]">Cancer context · </span>
                    {cancerType ? `${titleCase(cancerType)} cancer` : "Not added yet"}
                  </li>
                  <li>
                    <span className="font-medium text-[#6f6280]">Last touched · </span>
                    {memoryLastUpdated}
                  </li>
                </ul>
                <p className="mt-2 border-t border-[#ece4dc] pt-2 text-[10px] leading-snug text-[#756f68] sm:text-[11px] sm:leading-relaxed">
                  Your care team confirms what is true for your situation. This card is a local demo summary only — not a
                  diagnosis, staging statement, or treatment plan.
                </p>
              </div>

              <div className={`${GLASS_PANEL} min-w-0 max-w-full rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">Original concern</p>
                <p className="m-0 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-[#3f3a35] sm:text-sm">
                  {voiceConcernResolved.trim() || "No voice/text concern captured yet."}
                </p>
              </div>

              <ResultPacketCard icon={<ShieldCheck className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />} label="Known facts (careful summary)">
                <p className="mb-2 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">
                  What Anchor can reflect from this session — de-identified where this is a sample walkthrough. Verify every
                  clinical detail with your care team.
                </p>
                <ResultBulletList items={packet.knowNow} />
              </ResultPacketCard>

              <ResultPacketCard icon={<Clipboard className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />} label="Still needs confirmation">
                <p className="mb-2 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">
                  Includes implications noted when you added case updates — your clinicians still decide what applies.
                </p>
                <ResultBulletList items={mergedNeedsConfirmation} />
              </ResultPacketCard>

              <div className={`${GLASS_PANEL} min-w-0 max-w-full rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">Questions asked</p>
                {followUpResponses.length === 0 ? (
                  <p className="m-0 text-[12px] leading-snug text-[#756f68] sm:text-sm">{MEMORY_EMPTY_QUESTIONS_ASKED}</p>
                ) : (
                  <ul className="m-0 grid list-none gap-2 p-0">
                    {followUpResponses.map((item) => (
                      <li
                        key={item.id}
                        className="flex min-w-0 flex-col gap-2 rounded-[12px] border border-[#e8dfd8] bg-white/65 p-2.5 sm:flex-row sm:items-start sm:justify-between sm:rounded-[14px] sm:p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="inline-flex max-w-full rounded-full border border-[#cbc4be] bg-[#faf7f4] px-2 py-0.5 text-[10px] font-medium text-[#3f3a35] sm:text-[11px]">
                            {item.questionLabel}
                          </span>
                          <p className="mt-1.5 m-0 text-[12px] font-semibold leading-snug text-[#3f3a35] sm:text-sm">{item.title}</p>
                          <p className="mt-1 m-0 text-[10px] text-[#9b829c] sm:text-[11px]">{formatDemoTimelineLabel(item.timestamp)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenToolPanel("ask")}
                          className="shrink-0 self-start rounded-full border border-[#b98da0]/50 bg-white/90 px-2.5 py-1 text-[10px] font-medium text-[#5c4a62] transition hover:bg-white sm:text-[11px]"
                        >
                          View in Ask
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={`${GLASS_PANEL} min-w-0 max-w-full rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">New information added</p>
                {caseInformationUpdates.length === 0 ? (
                  <p className="m-0 text-[12px] leading-snug text-[#756f68] sm:text-sm">{MEMORY_EMPTY_CASE_UPDATES}</p>
                ) : (
                  <ul className="m-0 grid list-none gap-2.5 p-0">
                    {[...caseInformationUpdates].reverse().map((u) => (
                      <li key={u.id} className="rounded-[12px] border border-[#e8dfd8] bg-white/65 p-2.5 sm:rounded-[14px] sm:p-3">
                        <p className="m-0 text-[10px] font-medium text-[#9b829c] sm:text-[11px]">{u.sourceLabel}</p>
                        <ul className="mt-1.5 m-0 list-none space-y-1.5 p-0 text-[11px] leading-snug text-[#3f3a36] sm:text-xs sm:leading-relaxed">
                          <li>
                            <span className="font-medium text-[#5f5a55]">New · </span>
                            {u.newInformation}
                          </li>
                          <li>
                            <span className="font-medium text-[#5f5a55]">May affect · </span>
                            {u.mayAffect}
                          </li>
                          <li>
                            <span className="font-medium text-[#5f5a55]">Still confirm · </span>
                            {u.needsConfirmation}
                          </li>
                          <li>
                            <span className="font-medium text-[#5f5a55]">Ask next · </span>
                            {u.askNext}
                          </li>
                          <li>
                            <span className="font-medium text-[#5f5a55]">Revised step · </span>
                            {u.revisedStep}
                          </li>
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={`${GLASS_PANEL} min-w-0 max-w-full rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">Tasks completed</p>
                {completedPlanTaskIds.length === 0 ? (
                  <p className="m-0 text-[12px] leading-snug text-[#756f68] sm:text-sm">{MEMORY_EMPTY_TASKS_DONE}</p>
                ) : (
                  <ul className="m-0 list-none space-y-2 p-0">
                    {completedPlanTaskIds.map((id) => (
                      <li key={id} className="text-[12px] leading-snug text-[#3f3a36] sm:text-sm">
                        <span className="font-medium text-[#5f5a55]">{inferCompletedTaskSourceLabel(id, adaptivePlanTasks)} · </span>
                        {titleForCompletedTaskId(id, adaptivePlanTasks, planResult)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={`${GLASS_PANEL} min-w-0 max-w-full rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">Plan at a glance</p>
                <p className="m-0 text-[12px] font-medium leading-snug text-[#3f3a36] sm:text-sm">{boardCountsLine}</p>
                <p className="mt-1.5 m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">
                  Counts match the same buckets as your 72-hour plan in Tools.{" "}
                  <span className="font-medium text-[#5f5a55]">
                    {planResult
                      ? "Your checklist is in Tools → 72-hour plan."
                      : "When you are ready, generate the checklist under Tools → 72-hour plan."}
                  </span>
                </p>
              </div>

              <div className={`${GLASS_PANEL} min-w-0 max-w-full rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">Scripts and artifacts</p>
                {actionGuideDemoTimeline.length === 0 ? (
                  <p className="m-0 text-[12px] leading-snug text-[#756f68] sm:text-sm">{MEMORY_EMPTY_TIMELINE_ARTIFACTS}</p>
                ) : (
                  <ul className="m-0 list-none space-y-2 p-0">
                    {actionGuideDemoTimeline.map((e) => (
                      <li key={e.id} className="rounded-[12px] border border-[#e8dfd8] bg-white/65 p-2.5 sm:rounded-[14px] sm:p-3">
                        <p className="m-0 text-[10px] font-medium uppercase tracking-wide text-[#9b829c] sm:text-[11px]">
                          {e.badge} · {formatDemoTimelineLabel(e.savedAt)}
                        </p>
                        <p className="mt-1 m-0 text-[12px] leading-snug text-[#3f3a36] sm:text-sm">{e.taskTitle}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={`${GLASS_PANEL} min-w-0 max-w-full rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">Appointment handoff</p>
                <p className="m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">
                  Compact bullets you can paste for a family member or clinic admin — not sent by Anchor. Your care team still
                  confirms decisions. Not diagnosis or treatment recommendation language.
                </p>
                <ul className="mt-2 m-0 list-none space-y-1.5 p-0 text-[11px] leading-snug text-[#3f3a36] sm:text-xs sm:leading-relaxed">
                  <li>
                    <span className="font-medium text-[#5f5a55]">Concern · </span>
                    {(() => {
                      const c = voiceConcernResolved.trim() || "Not captured yet"
                      return c.length > 160 ? `${c.slice(0, 160)}…` : c
                    })()}
                  </li>
                  <li>
                    <span className="font-medium text-[#5f5a55]">Known facts · </span>
                    {(() => {
                      const k = packet.knowNow[0] ?? "—"
                      return k.length > 140 ? `${k.slice(0, 140)}…` : k
                    })()}
                  </li>
                  <li>
                    <span className="font-medium text-[#5f5a55]">Still confirm · </span>
                    {(() => {
                      const s = mergedNeedsConfirmation[0] ?? "—"
                      return s.length > 140 ? `${s.slice(0, 140)}…` : s
                    })()}
                  </li>
                  <li>
                    <span className="font-medium text-[#5f5a55]">Top questions · </span>
                    {followUpResponses.length
                      ? followUpResponses
                          .slice(0, 3)
                          .map((r) => r.title)
                          .join(" · ")
                      : "None yet"}
                  </li>
                  <li>
                    <span className="font-medium text-[#5f5a55]">Active next steps · </span>
                    {collectActiveNextStepTitles(adaptivePlanTasks, completedPlanTaskIds, planResult, 4).join(" · ") || "Generate the plan when ready."}
                  </li>
                  <li>
                    <span className="font-medium text-[#5f5a55]">Records to bring · </span>
                    {pickRecordsLineFromPacket(packet.careTeamBullets)}
                  </li>
                  <li>
                    <span className="font-medium text-[#5f5a55]">Who is going · </span>
                    {pickWhoGoingLine(packet.nightNote, lovedOneLabel)}
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => void onCopy("appointment", appointmentHandoffText)}
                  className={`${GLASS_BUTTON} mt-3 flex w-full items-center justify-center gap-2 rounded-[16px] px-3 py-2.5 text-[12px] font-medium text-[#3f3a36] sm:rounded-[18px] sm:text-sm`}
                >
                  <Copy className="h-4 w-4 shrink-0 text-[#9b829c] sm:h-4 sm:w-4" />
                  Copy appointment handoff
                </button>
                {copied === "appointment" && (
                  <p className="mt-2 m-0 text-center text-[11px] text-[#4a7c59] sm:text-xs" role="status">
                    Copied. Anchor did not send anything.
                  </p>
                )}
              </div>

              <div className={`${GLASS_PANEL} min-w-0 max-w-full rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <div className="mb-2 flex min-w-0 items-start gap-2">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-[#9b829c] sm:h-5 sm:w-5" />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[12px] font-semibold text-[#3f3a35] sm:text-sm">Care timeline</p>
                    <p className="mt-1 m-0 text-[11px] leading-snug text-[#6f665f] sm:text-xs sm:leading-relaxed">{MEMORY_CARE_TIMELINE_INTRO}</p>
                  </div>
                </div>
                <div className={`grid max-w-full ${memoryTimelineLowRisk ? "gap-3" : "gap-1.5"}`}>
                  {visibleCareTimelineRows.map((row, idx) => (
                    <div key={row.id} className="flex min-w-0 max-w-full gap-3">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#b98da0]/90" aria-hidden />
                      <div
                        className={`min-w-0 flex-1 pb-3 ${idx < visibleCareTimelineRows.length - 1 ? "border-b border-[#ece4dc]/90" : ""}`}
                      >
                        <p className="m-0 text-[12px] font-semibold leading-snug text-[#3f3a36] sm:text-sm">{row.title}</p>
                        <p className="mt-0.5 m-0 break-words text-[11px] leading-snug text-[#756f68] sm:text-xs">{row.description}</p>
                        <p className="mt-1 m-0 text-[10px] text-[#9b829c] sm:text-[11px]">{row.timeLabel}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {memoryTimelineLowRisk && careTimelineRows.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setMemoryTimelineExpanded((v) => !v)}
                    className="mt-2 w-full rounded-full border border-[#8f7e9b]/40 bg-[#faf7f4]/95 py-1.5 text-[10px] font-medium text-[#5c4a62] transition hover:bg-white sm:text-[11px]"
                  >
                    {memoryTimelineExpanded ? "Show fewer moments" : "Show more moments"}
                  </button>
                )}
              </div>

              <div className={`${GLASS_PANEL} min-w-0 max-w-full rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f7e9b] sm:text-[11px]">Later · Support snapshot</p>
                <p className="m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">
                  From family support in Tools — local only, not sent. Open there to move cards or copy drafts.
                </p>
                <ul className="mt-2 m-0 list-none space-y-1.5 p-0 text-[11px] leading-snug text-[#3f3a36] sm:text-xs sm:leading-relaxed">
                  <li>
                    <span className="font-medium text-[#5f5a55]">Needs help · </span>
                    {familyNeedsOwnerRows.length
                      ? familyNeedsOwnerRows.map((r) => r.title).join(" · ")
                      : "Everything is claimed or done for now."}
                  </li>
                  <li>
                    <span className="font-medium text-[#5f5a55]">Someone can take this · </span>
                    {familyAssignedRows.length
                      ? familyAssignedRows.map((r) => `${r.title} (${r.owner === "sibling" ? "sibling lane" : "family lane"})`).join(" · ")
                      : "None yet."}
                  </li>
                  <li>
                    <span className="font-medium text-[#5f5a55]">Done · </span>
                    {familyDoneRows.length ? familyDoneRows.map((r) => r.title).join(" · ") : "None yet."}
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => onOpenToolPanel("family")}
                  className="mt-2 rounded-full border border-[#b98da0]/50 bg-white/90 px-2.5 py-1 text-[10px] font-medium text-[#5c4a62] transition hover:bg-white sm:text-[11px]"
                >
                  Open family support
                </button>
              </div>

              <ResultPacketCard icon={<HeartHandshake className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />} label="What Anchor heard (mirror)">
                <p className="m-0 text-[12px] leading-snug text-[#3f3a36] sm:text-sm sm:leading-relaxed">{mirrorResult.mirror}</p>
              </ResultPacketCard>

              <p className="m-0 text-[11px] leading-snug text-[#756f68] sm:text-xs sm:leading-relaxed">
                Start over (above) clears this local demo case in your browser. Nothing here is HIPAA-grade storage, a medical
                record, or a substitute for your care team.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {openGuideRow && (
        <TaskActionGuideSheet
          done={openGuideDone}
          lovedOneLabel={lovedOneLabel}
          onAppendTimeline={appendActionGuideDemoTimeline}
          onClose={() => setGuideOpenId(null)}
          onMarkDone={markPlanTaskDone}
          openRow={openGuideRow}
        />
      )}

      {error && (
        <div className="mt-3 sm:mt-5">
          <ErrorText message={error} />
          {!isBackupDemoMirror && (
            <button
              type="button"
              onClick={onSarahBackupDemo}
              className={`${GLASS_BUTTON} mt-2 w-full rounded-[20px] px-4 py-2.5 text-sm text-[#3f3a36] sm:mt-3 sm:w-auto sm:rounded-[22px]`}
            >
              Show Sarah demo result
            </button>
          )}
        </div>
      )}

      <motion.div
        variants={itemVariants}
        className="mt-3 rounded-[16px] border border-[#d8cec5]/80 bg-[#faf7f4]/90 px-3 py-2.5 text-[11px] leading-snug text-[#5f5a55] sm:mt-4 sm:rounded-[20px] sm:px-4 sm:py-3 sm:text-xs sm:leading-relaxed"
      >
        Anchor can help prepare NCCN-aware questions and organize next steps. It does not diagnose, prescribe, choose
        treatment, confirm stage, or replace your care team.
      </motion.div>

      <p className="mt-3 text-[11px] leading-snug text-[#756f68] sm:mt-4 sm:text-sm sm:leading-6">
        Hi {displayName}. This is support for orientation and preparation, not emergency care or a substitute for your
        oncology team.
      </p>
    </motion.div>
  )
}

function ResultPacketCard({
  children,
  icon,
  label,
}: {
  children: React.ReactNode
  icon: React.ReactNode
  label: string
}) {
  return (
      <div className={`${GLASS_PANEL} min-w-0 rounded-[16px] p-3 sm:rounded-[20px] sm:p-4`}>
      <div className="mb-1.5 flex min-w-0 items-center gap-2 text-[10px] font-semibold uppercase leading-tight tracking-wide text-[#8f7e9b] sm:text-[11px]">
        <span className="shrink-0 text-[#9b829c]">{icon}</span>
        <span className="min-w-0">{label}</span>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function ResultBulletList({ items }: { items: string[] }) {
  return (
    <ul className="m-0 list-none space-y-1.5 p-0 sm:space-y-2">
      {items.map((item, index) => (
        <li
          key={`${index}-${item.slice(0, 24)}`}
          className="relative pl-3.5 text-[13px] leading-snug text-[#3f3a36] before:absolute before:left-0 before:top-[0.42em] before:h-1 before:w-1 before:rounded-full before:bg-[#b98da0]/90 sm:text-sm sm:leading-relaxed"
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

function NightNoteCard({ note }: { note: NightNoteContent }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[16px] border border-[#8f6a5c]/35 bg-gradient-to-br from-[#2a2426] via-[#342d30] to-[#3d3538] p-3.5 shadow-[0_14px_36px_rgba(24,18,20,0.38)] sm:rounded-[20px] sm:p-4">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#d4b8a8] sm:text-[11px]">Night note</p>
      <h3 className="mt-1.5 text-base font-medium tracking-tight text-[#fdf6f0] sm:text-lg">Night Note</h3>
      <p className="mt-1 text-[11px] leading-snug text-[#e8c4b2]/95 sm:text-xs sm:leading-relaxed">{note.subtitle}</p>
      <p className="mt-2.5 text-[13px] leading-relaxed text-[#f2e6dc]/95 sm:mt-3 sm:text-sm">{note.body}</p>
      <ul className="mt-2.5 space-y-1 border-t border-white/10 pt-2.5 sm:mt-3 sm:space-y-1.5 sm:pt-3">
        {note.tinyActions.map((line, i) => (
          <li key={i} className="text-[10px] leading-relaxed text-[#e8d5cc]/90 sm:text-[11px]">
            <span className="mr-1.5 text-[#c9a089]">→</span>
            {line}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ResultBand({ children, icon, label }: { children: React.ReactNode; icon: React.ReactNode; label: string }) {
  return (
    <div className={`${GLASS_PANEL} rounded-[24px] p-4 sm:rounded-[30px] sm:p-5`}>
      <div className="mb-2 flex items-center gap-2 font-mono text-xs tracking-[0.16em] text-[#8f7e9b] sm:mb-3 sm:gap-3">
        {icon}
        {label}
      </div>
      <p className="m-0 text-sm leading-7 whitespace-pre-line text-[#3f3a36] sm:text-base sm:leading-7 lg:text-lg lg:leading-8">{children}</p>
    </div>
  )
}

function ExpandableActionItem({
  action,
  emphasizedPrefix,
  index,
  variant = "default",
  onBlur,
  onFocus,
  onMouseEnter,
  onMouseLeave,
  script: providedScript,
}: {
  action: string
  emphasizedPrefix?: string
  index: number
  variant?: "default" | "compact" | "example" | "plan"
  onBlur?: () => void
  onFocus?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  script?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const script = providedScript ?? getActionScript(action, index)
  const isPlan = variant === "plan"
  const isExample = variant === "example"
  const stepLabel = String(index + 1).padStart(2, "0")

  const containerClass =
    variant === "default" || variant === "example"
      ? `${GLASS_PANEL} min-w-0 rounded-[22px] p-3 sm:rounded-[28px] sm:p-4`
      : variant === "compact"
        ? "min-w-0 rounded-[16px] border border-white/70 bg-white/56 p-2.5 text-[#3f3a36] sm:rounded-[20px] sm:p-3"
        : "min-w-0 w-full rounded-[18px] border border-white/75 bg-white/60 p-2.5 text-left shadow-[0_10px_30px_rgba(116,100,91,0.08)] backdrop-blur-[20px] transition hover:-translate-y-0.5 hover:border-[#c9b8d8]/80 sm:rounded-[22px] sm:p-3"

  const badgeClass =
    "flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-lg border border-[#c9b8d8]/55 bg-white/85 px-1.5 text-[11px] font-semibold tabular-nums text-[#8b5f72] shadow-sm sm:h-8 sm:min-w-[2rem] sm:px-2 sm:text-xs"

  const titleClass = isPlan
    ? "text-[13px] font-medium leading-snug text-[#3f3a36] sm:text-sm sm:leading-relaxed"
    : isExample
      ? "text-[15px] font-medium leading-snug text-[#3f3a36] sm:text-base sm:leading-relaxed"
      : variant === "compact"
        ? "text-[13px] font-medium leading-snug text-[#3f3a36] sm:text-sm sm:leading-snug"
        : "text-[15px] font-medium leading-snug text-[#3f3a36] sm:text-base sm:leading-relaxed"

  const focusRing =
    "outline-none focus-visible:ring-2 focus-visible:ring-[#b98da0]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf9]"

  return (
    <div className={containerClass} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-expanded={isOpen}
        className={`${focusRing} w-full rounded-[12px] text-left sm:rounded-[14px]`}
      >
        <div className="flex min-w-0 items-start gap-3 sm:gap-3.5">
          <span className={badgeClass} aria-hidden>
            {stepLabel}
          </span>
          <div className="min-w-0 flex-1">
            <p className={`m-0 ${titleClass}`}>{renderActionText(action, emphasizedPrefix)}</p>
            <p className="mt-1.5 text-xs font-medium leading-snug text-[#756f68]">
              {isOpen ? "Hide script" : "Show what to say"}
            </p>
          </div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border border-[#c9b8a8]/45 bg-[#e8dfd6] px-2.5 py-2 sm:mt-2.5 sm:px-3 sm:py-2.5">
              <p className="m-0 text-[10px] font-medium leading-normal text-[#5c5360] sm:text-[11px]">
                Use this if you need words for the call.
              </p>
              <p className="m-0 mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-[#322e2b] sm:text-[13px]">
                {script}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SidePanel({
  fearTimeline,
  onUpload,
  pathologyText,
  setPathologyText,
  uploadLabel,
  uploadState,
}: {
  fearTimeline: FearMemory[]
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void
  pathologyText: string
  setPathologyText: (value: string) => void
  uploadLabel: string
  uploadState: "idle" | "uploading" | "done" | "error"
}) {
  return (
    <aside className={`${GLASS_PANEL} order-2 rounded-[28px] p-4 sm:rounded-[32px] sm:p-5 lg:order-none lg:sticky lg:top-6 lg:rounded-[36px] lg:p-5`}>
      <PathologyPanel
        onUpload={onUpload}
        pathologyText={pathologyText}
        setPathologyText={setPathologyText}
        uploadLabel={uploadLabel}
        uploadState={uploadState}
      />
      <div className="my-5 h-px bg-[#d8cec5]/70" />
      <FearTimeline memories={fearTimeline} />
    </aside>
  )
}

function PathologyPanel({
  onUpload,
  pathologyText,
  setPathologyText,
  uploadLabel,
  uploadState,
}: {
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void
  pathologyText: string
  setPathologyText: (value: string) => void
  uploadLabel: string
  uploadState: "idle" | "uploading" | "done" | "error"
}) {
  const uploadText = {
    idle: "Upload pathology PDF",
    uploading: "Reading report...",
    done: uploadLabel ? `Added ${uploadLabel}` : "Pathology added",
    error: "Upload needs another try",
  }[uploadState]

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <FileText className="h-5 w-5 text-[#8f7e9b]" />
        <div>
          <p className="m-0 text-lg text-[#242230]">Clinical anchor</p>
          <p className="m-0 text-sm text-[#756f68]">Add report context before or after speaking.</p>
        </div>
      </div>
      <label className={`${GLASS_BUTTON} flex cursor-pointer items-center justify-between rounded-[22px] p-3 text-sm text-[#3f3a36] active:scale-[0.98] sm:rounded-[24px] sm:p-4`}>
        <span>{uploadText}</span>
        {uploadState === "done" ? <Check className="h-5 w-5 text-[#8f7e9b]" /> : <Upload className="h-5 w-5 text-[#b98da0]" />}
        <input type="file" accept="application/pdf" className="sr-only" onChange={onUpload} />
      </label>
      <textarea
        value={pathologyText}
        onChange={(event) => setPathologyText(event.target.value)}
        placeholder="Optional: paste stage, biomarkers, impression, or a confusing line."
        className="mt-3 min-h-20 w-full resize-none rounded-[20px] border border-white/70 bg-white/60 p-3 text-sm leading-6 text-[#3f3a36] shadow-inner outline-none placeholder:text-[#a09a93] backdrop-blur-[20px] focus:border-[#c9b8d8]/80 sm:min-h-24 sm:rounded-[22px]"
      />
    </section>
  )
}

function FearTimeline({ memories }: { memories: FearMemory[] }) {
  return (
    <section>
      <p className="m-0 text-lg text-[#242230]">Fear timeline</p>
      <p className="mt-1 text-sm text-[#756f68]">Past entries, kept quietly.</p>
      <div className="mt-4 space-y-3">
        {memories.length === 0 ? (
          <p className="text-sm leading-6 text-[#756f68]">Your first Anchor note will appear here after you speak.</p>
        ) : (
          memories.map((memory) => (
            <div key={memory.id} className="rounded-[22px] border border-white/70 bg-white/50 p-4 shadow-[0_10px_28px_rgba(116,100,91,0.08)] backdrop-blur-[20px]">
              <p className="m-0 text-sm italic leading-6 text-[#3f3a36]">&quot;{memory.quote}&quot;</p>
              <p className="mt-1 font-mono text-xs text-[#756f68]">
                {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric" }).format(
                  new Date(memory.date),
                )}{" "}
                - {memory.summary}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function CompanionNav({ onOpen }: { onOpen: (screen: CompanionScreen) => void }) {
  const items = [
    { id: "breathe" as const, label: "Calm Down", subtitle: "Stop the spiral right now", icon: Wind },
    { id: "control" as const, label: "Clear My Head", subtitle: "Separate what's mine to carry", icon: Brain },
    { id: "say" as const, label: "Get It Out", subtitle: "Write what you can't say out loud", icon: PenLine },
    { id: "oneThing" as const, label: "Just Do This", subtitle: "One small move, right now", icon: Sparkles },
  ]

  return (
    <nav className="relative z-10 pb-4 pt-2 sm:pb-5">
      <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto pb-1 sm:hidden">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onOpen(item.id)}
              className="flex shrink-0 items-center gap-2 rounded-full border border-white/70 bg-white/55 px-4 py-2.5 text-sm text-[#5f5a55] shadow-[0_8px_24px_rgba(116,100,91,0.08)] backdrop-blur-[20px] active:scale-[0.97]"
            >
              <Icon className="h-4 w-4 shrink-0 text-[#9b829c]" />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          )
        })}
      </div>
      <div className="mx-auto hidden w-fit max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-white/70 bg-white/46 p-2 shadow-[0_18px_58px_rgba(116,100,91,0.1)] backdrop-blur-[20px] sm:flex">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onOpen(item.id)}
              className="group flex items-center gap-3 rounded-full px-4 py-2 text-left text-[#5f5a55] transition hover:bg-white/70 hover:text-[#242230]"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>
                <span className="block text-sm">{item.label}</span>
                <span className="block max-w-32 text-[11px] leading-4 text-[#8a827a] opacity-0 transition group-hover:opacity-100">
                  {item.subtitle}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function CompanionOverlay({
  activeScreen,
  breathCycles,
  breathStep,
  cancerType,
  currentOneThing,
  journalEntries,
  onClose,
  onCompleteOneThing,
  onSaveJournal,
  oneThingCount,
}: {
  activeScreen: Exclude<CompanionScreen, null>
  breathCycles: number
  breathStep: number
  cancerType: CancerType
  currentOneThing: number
  journalEntries: JournalEntry[]
  onClose: () => void
  onCompleteOneThing: () => void
  onSaveJournal: (text: string) => void
  oneThingCount: number
}) {
  return (
    <motion.div
      key={activeScreen}
      initial={{ x: "100%", opacity: 0.88 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0.88 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#fbf7f0]/94 px-4 py-5 text-[#242230] backdrop-blur-[18px] sm:px-8 sm:py-6"
    >
      <AmbientOrbs />
      <div className="relative z-10 mx-auto max-w-5xl pb-6 sm:pb-8">
        <button
          type="button"
          onClick={onClose}
          className={`${GLASS_BUTTON} mb-6 flex items-center gap-2 rounded-full px-4 py-2 text-sm text-[#3f3a36] sm:mb-8`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {activeScreen === "breathe" && <BreatheScreen breathCycles={breathCycles} breathStep={breathStep} />}
        {activeScreen === "control" && <ClearMyHeadScreen cancerType={cancerType} />}
        {activeScreen === "say" && <SayItScreen entries={journalEntries} onSave={onSaveJournal} />}
        {activeScreen === "oneThing" && (
          <OneThingScreen
            currentOneThing={currentOneThing}
            onComplete={onCompleteOneThing}
            oneThingCount={oneThingCount}
          />
        )}
      </div>
    </motion.div>
  )
}

function BreatheScreen({ breathCycles, breathStep }: { breathCycles: number; breathStep: number }) {
  const phase = BREATHE_PHASES[breathStep]

  return (
    <section className="grid min-h-[60vh] place-items-center py-6 sm:min-h-[70vh] sm:py-0">
      <div className="text-center">
        <p className="mb-3 font-mono text-xs tracking-[0.18em] text-[#8f7e9b] sm:mb-4">BREATHE</p>
        <h2 className={`text-3xl font-normal leading-tight sm:text-5xl lg:text-7xl ${SOFT_GRADIENT_TEXT}`}>For when the mind will not stop.</h2>
        <div className="mt-8 grid place-items-center sm:mt-12">
          <motion.div
            animate={{ scale: phase.scale }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className={`${GLASS_PANEL} grid h-48 w-48 place-items-center rounded-full bg-[#f7efe7]/70 sm:h-56 sm:w-56`}
          >
            <div className="text-center">
              <p className="text-3xl text-[#242230] sm:text-4xl">{phase.label}</p>
              <p className="mt-2 text-xs text-[#756f68] sm:text-sm">4 seconds</p>
            </div>
          </motion.div>
        </div>
        <p className="mt-6 text-xs text-[#756f68] sm:mt-8 sm:text-sm">Cycles completed: {breathCycles}</p>
        <AnimatePresence>
          {breathCycles >= 3 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto mt-4 max-w-md text-base leading-7 text-[#5f5a55] sm:mt-5 sm:text-lg sm:leading-8"
            >
              You made a little room inside the moment. That counts.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

function ClearMyHeadScreen({ cancerType }: { cancerType: CancerType }) {
  const [thought, setThought] = useState("")
  const [submittedThought, setSubmittedThought] = useState("")
  const [result, setResult] = useState<MirrorResult | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [insightIndex] = useState(() => {
    const stored = Number(window.localStorage.getItem("anchor_clear_head_insight_index") || "-1")
    const next = (Number.isFinite(stored) ? stored + 1 : 0) % PHILOSOPHICAL_INSIGHTS.length
    window.localStorage.setItem("anchor_clear_head_insight_index", String(next))
    return next
  })

  async function submitThought() {
    const trimmed = thought.trim()
    if (!trimmed) return

    setIsThinking(true)
    setError(null)
    setSubmittedThought(trimmed)

    try {
      const response = await fetch("/api/mirror", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: trimmed,
          cancerType,
          pathologyText: "",
        }),
      })

      if (!response.ok) throw new Error("Mirror API failed")
      setResult((await response.json()) as MirrorResult)
    } catch (err) {
      console.error(err)
      setError("Anchor could not untangle that thought yet. Try again in a moment.")
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <section>
      <p className="mb-3 font-mono text-xs tracking-[0.18em] text-[#8f7e9b] sm:mb-4">CLEAR MY HEAD</p>
      <h2 className={`text-3xl font-normal leading-tight sm:text-5xl lg:text-7xl ${SOFT_GRADIENT_TEXT}`}>What thought keeps coming back?</h2>

      <div className="mt-6 flex flex-col gap-3 sm:mt-10 sm:flex-row">
        <input
          value={thought}
          onChange={(event) => setThought(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submitThought()
          }}
          placeholder="Type it exactly as it sounds in your head."
          className={`${GLASS_PANEL} min-h-14 flex-1 rounded-[22px] px-4 text-base text-[#242230] outline-none placeholder:text-[#a09a93] sm:min-h-16 sm:rounded-[26px] sm:px-5 sm:text-xl`}
        />
        <button
          type="button"
          onClick={submitThought}
          disabled={isThinking || !thought.trim()}
          className="rounded-[26px] border border-white/80 bg-[#b7a6c9] px-7 py-4 text-white shadow-[0_18px_52px_rgba(151,128,163,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isThinking ? "Listening underneath..." : "Untangle it"}
        </button>
      </div>

      {error && <ErrorText message={error} />}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.55 }}
            className="mt-10 space-y-4"
          >
            <div className={`${GLASS_PANEL} rounded-[32px] p-6`}>
              <p className="mb-3 font-mono text-xs tracking-[0.16em] text-[#8f7e9b]">THE THOUGHT</p>
              <p className="text-3xl leading-tight text-[#242230]">&quot;{submittedThought}&quot;</p>
            </div>
            <ResultBand label="What's underneath this" icon={<HeartHandshake className="h-5 w-5" />}>
              {result.mirror}
            </ResultBand>
            <ResultBand label="NCCN-aware questions to confirm with your care team" icon={<ShieldCheck className="h-5 w-5" />}>
              {result.ground}
            </ResultBand>
            <div className={`${GLASS_PANEL} rounded-[30px] p-5`}>
              <p className="mb-4 font-mono text-xs tracking-[0.16em] text-[#8f7e9b]">THREE WAYS TO LOOSEN ITS GRIP</p>
              <div className="space-y-3">
                {result.actions.slice(0, 3).map((action, index) => (
                  <ExpandableActionItem action={action} index={index} key={`${action}-${index}`} variant="compact" />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className={`${GLASS_PANEL} mt-8 rounded-[28px] p-5 text-sm italic leading-7 text-[#5f5a55]`}>
        {PHILOSOPHICAL_INSIGHTS[insightIndex]}
      </p>
    </section>
  )
}

function SayItScreen({ entries, onSave }: { entries: JournalEntry[]; onSave: (text: string) => void }) {
  const [text, setText] = useState("")
  const [released, setReleased] = useState(false)
  const prompt = SAY_PROMPTS[new Date().getMinutes() % SAY_PROMPTS.length]
  const quote = CAREGIVER_QUOTES[new Date().getHours() % CAREGIVER_QUOTES.length]

  function release() {
    setText("")
    setReleased(true)
    window.setTimeout(() => setReleased(false), 1800)
  }

  function keep() {
    onSave(text)
    setText("")
  }

  return (
    <section>
      <p className="mb-3 font-mono text-xs tracking-[0.18em] text-[#8f7e9b] sm:mb-4">SAY IT</p>
      <h2 className={`text-3xl font-normal leading-tight sm:text-5xl lg:text-7xl ${SOFT_GRADIENT_TEXT}`}>A private place for the unpolished sentence.</h2>
      <p className="mt-4 text-base leading-7 text-[#5f5a55] sm:mt-6 sm:text-lg sm:leading-8">{prompt}</p>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Write without making it useful yet."
        className={`${GLASS_PANEL} mt-6 min-h-52 w-full resize-none rounded-[28px] p-4 text-base leading-8 text-[#242230] outline-none placeholder:text-[#aaa199] sm:mt-8 sm:min-h-72 sm:rounded-[34px] sm:p-6 sm:text-xl sm:leading-9`}
      />
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={release} className={`${GLASS_BUTTON} rounded-[24px] px-6 py-3 text-[#3f3a36]`}>
          Release
        </button>
        <button type="button" onClick={keep} className="rounded-[24px] border border-white/80 bg-[#b7a6c9] px-6 py-3 text-white shadow-[0_18px_52px_rgba(151,128,163,0.22)]">
          Keep
        </button>
      </div>
      <AnimatePresence>
        {released && (
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 text-[#756f68]">
            Released.
          </motion.p>
        )}
      </AnimatePresence>
      <p className="mt-8 text-sm italic leading-7 text-[#756f68]">{quote}</p>
      <div className="mt-8 grid gap-3">
        {entries.map((entry) => (
          <div key={entry.id} className={`${GLASS_PANEL} rounded-[24px] p-4`}>
            <p className="font-mono text-xs text-[#8f7e9b]">
              {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric" }).format(new Date(entry.date))}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#3f3a36]">{entry.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function OneThingScreen({
  currentOneThing,
  onComplete,
  oneThingCount,
}: {
  currentOneThing: number
  onComplete: () => void
  oneThingCount: number
}) {
  return (
    <section className="grid min-h-[70vh] place-items-center text-center">
      <div className="max-w-3xl">
        <p className="mb-4 font-mono text-xs tracking-[0.18em] text-[#8f7e9b]">ONE THING</p>
        <div className={`${GLASS_PANEL} rounded-[44px] p-8 sm:p-12`}>
          <Sparkles className="mx-auto h-9 w-9 text-[#9b829c]" />
          <h2 className="mt-8 text-4xl font-normal leading-tight text-[#242230] sm:text-6xl">
            {ONE_THING_ITEMS[currentOneThing]}
          </h2>
          <button
            type="button"
            onClick={onComplete}
            className="mt-10 rounded-[26px] border border-white/80 bg-[#b7a6c9] px-7 py-4 text-white shadow-[0_20px_58px_rgba(151,128,163,0.24)] transition hover:-translate-y-0.5"
          >
            Done. Give me another.
          </button>
        </div>
        <p className="mt-6 text-sm text-[#756f68]">Completed: {oneThingCount}</p>
        <AnimatePresence>
          {oneThingCount >= 5 && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 text-lg text-[#5f5a55]"
            >
              You showed up. That matters.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

function AuthScreen({
  email,
  error,
  isOtpVerifying,
  isSending,
  magicLinkSent,
  onContinueAsGuest,
  onEmailChange,
  onOtpChange,
  onResetMagicLink,
  onSendMagicLink,
  onSeeExample,
  onVerifyOtp,
  otpCode,
}: {
  email: string
  error: string | null
  isOtpVerifying: boolean
  isSending: boolean
  magicLinkSent: boolean
  onContinueAsGuest: () => void
  onEmailChange: (value: string) => void
  onOtpChange: (value: string) => void
  onResetMagicLink: () => void
  onSendMagicLink: () => void
  onSeeExample?: () => void
  onVerifyOtp: () => void
  otpCode: string
}) {
  const primaryButtonClass =
    "flex min-h-14 w-full items-center justify-center gap-3 rounded-[26px] border border-white/80 bg-[#b7a6c9] px-7 py-4 text-base text-white shadow-[0_20px_58px_rgba(151,128,163,0.24)] transition hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-40 sm:w-auto sm:flex-1 sm:text-base"

  const guestButtonClass = `${GLASS_BUTTON} flex min-h-14 w-full items-center justify-center gap-3 rounded-[26px] px-7 py-4 text-base text-[#3f3a36] transition active:scale-[0.98] sm:w-auto sm:flex-1`

  return (
    <motion.section
      key="auth"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.65 }}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-5 sm:py-16"
    >
      <div className={`${GLASS_PANEL} w-full max-w-lg rounded-[32px] p-7 sm:max-w-2xl sm:rounded-[40px] sm:p-12`}>
        <p className="mb-4 font-mono text-xs tracking-[0.18em] text-[#8f7e9b] sm:mb-6">ANCHOR</p>
        <h1 className={`text-3xl font-normal leading-tight sm:text-4xl md:text-5xl ${SOFT_GRADIENT_TEXT}`}>
          Your space. Private to you.
        </h1>
        <p className="mt-3 text-base leading-7 text-[#5f5a55] sm:mt-4 sm:text-lg sm:leading-8">
          When everything feels like too much, Anchor shows you what to do next.
        </p>

        {magicLinkSent ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 sm:mt-10">
            <p className="text-lg text-[#242230] sm:text-xl">Check your inbox.</p>
            <p className="mt-2 text-sm leading-7 text-[#5f5a55] sm:mt-3 sm:text-base">
              We sent a sign-in link to <strong>{email}</strong>. Click it to continue.
            </p>
            <div className="mt-6 sm:mt-8">
              <p className="text-sm leading-7 text-[#5f5a55] sm:text-base">
                We also sent a code — enter it here to verify instantly without leaving this tab.
              </p>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={onOtpChange}
                  disabled={isOtpVerifying}
                  containerClassName="justify-center sm:justify-start"
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="h-12 w-11 border-[#c9b8d8]/70 bg-white/45 text-lg text-[#242230]"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <button
                  type="button"
                  onClick={onVerifyOtp}
                  disabled={isOtpVerifying || otpCode.length !== 6}
                  className={`${primaryButtonClass} sm:flex-none`}
                >
                  {isOtpVerifying ? "Verifying..." : "Verify code"}
                </button>
              </div>
              {error && <div className="mt-4"><ErrorText message={error} /></div>}
            </div>
            <p className="mt-6 text-sm text-[#756f68]">
              Wrong address?{" "}
              <button type="button" onClick={onResetMagicLink} className="underline underline-offset-2 hover:text-[#242230]">
                Try again
              </button>
            </p>
          </motion.div>
        ) : (
          <div className="mt-8 flex flex-col gap-4 sm:mt-10">
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSendMagicLink() }}
              placeholder="your@email.com"
              className="min-h-14 border-b border-[#c9b8d8]/70 bg-transparent text-xl text-[#242230] outline-none placeholder:text-[#b9afa7] focus:border-[#b98da0] sm:min-h-16 sm:text-2xl"
            />
            {error && <ErrorText message={error} />}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <button
                type="button"
                onClick={onSendMagicLink}
                disabled={isSending || !email.trim()}
                className={primaryButtonClass}
              >
                {isSending ? "Sending..." : "Send magic link"}
              </button>
              <button
                type="button"
                onClick={onContinueAsGuest}
                className={guestButtonClass}
              >
                Continue as guest
              </button>
            </div>
            {onSeeExample && (
              <div className="flex flex-col gap-2 border-t border-white/50 pt-5 sm:pt-6">
                <button
                  type="button"
                  onClick={onSeeExample}
                  className="w-full rounded-[22px] border border-[#c9b8d8]/80 bg-white/50 px-5 py-3.5 text-center text-sm font-medium text-[#6f6280] shadow-[0_10px_28px_rgba(116,100,91,0.08)] transition hover:border-[#b98da0]/90 hover:bg-white/70 active:scale-[0.98] sm:py-3"
                >
                  Try a live demo first
                </button>
                <p className="text-center text-xs leading-5 text-[#756f68] sm:text-sm sm:leading-6">
                  See exactly what Anchor does before you sign in — sample Sarah scenario.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.section>
  )
}

function WelcomeBackScreen({ name }: { name: string }) {
  return (
    <motion.div
      key="welcome-back"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.7 }}
      className="relative z-10 grid min-h-screen place-items-center px-4 py-10 sm:px-5"
    >
      <div className="text-center">
        <p className="mb-4 font-mono text-xs tracking-[0.18em] text-[#8f7e9b]">WELCOME BACK</p>
        <h1 className={`text-5xl font-normal leading-none sm:text-7xl ${SOFT_GRADIENT_TEXT}`}>{name}.</h1>
      </div>
    </motion.div>
  )
}

function ErrorText({ message }: { message: string }) {
  return (
    <p className="mt-6 rounded-[24px] border border-[#d9b8c6]/60 bg-white/70 p-4 text-sm leading-6 text-[#8f4158] shadow-[0_16px_45px_rgba(184,141,160,0.14)] backdrop-blur-[20px]">
      {message}
    </p>
  )
}

function formatPlanSection(label: string, actions: PlanAction[]) {
  return [
    `\n${label}`,
    ...actions.map((action, index) => `${index + 1}. ${action.text}\n   Regret to avoid: ${action.regretQuote}`),
  ]
}
