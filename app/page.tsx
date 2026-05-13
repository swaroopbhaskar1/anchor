"use client"

import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CalendarClock,
  Check,
  Clipboard,
  FileText,
  HeartHandshake,
  Mic,
  PenLine,
  Phone,
  ShieldCheck,
  Sparkles,
  Square,
  Upload,
  Wind,
} from "lucide-react"
import useWebRTCAudioSession from "@/hooks/use-webrtc"
import { tools } from "@/lib/tools"
import {
  SARAH_DEMO_ACTION_PREFIXES,
  SARAH_DEMO_ACTION_SCRIPTS,
  SARAH_DEMO_CONCERN,
  SARAH_DEMO_MIRROR_RESULT,
  SARAH_DEMO_ORIENTATION_LINES,
  SARAH_FALLBACK_PLAN_RESULT,
} from "@/lib/demo/sarah-case"
import { getAccount, getDatabases, ID, Query, DB_ID, COLLECTIONS } from "@/lib/appwrite"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

type CancerType = "colon" | "breast" | "lymphoma"
type AppPhase = "idle" | "recording" | "processing" | "results"
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
  const [copied, setCopied] = useState<"note" | "handoff" | null>(null)
  const [showExampleOutput, setShowExampleOutput] = useState(false)
  const [isBackupDemoMirror, setIsBackupDemoMirror] = useState(false)
  const [fearTimeline, setFearTimeline] = useState<FearMemory[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [oneThingCount, setOneThingCount] = useState(0)
  const [oneThingUsed, setOneThingUsed] = useState<number[]>([])
  const [currentOneThing, setCurrentOneThing] = useState(0)
  const [activeScreen, setActiveScreen] = useState<CompanionScreen>(null)
  const [hoveredRegret, setHoveredRegret] = useState<string | null>(null)
  const [breathStep, setBreathStep] = useState(0)
  const [breathCycles, setBreathCycles] = useState(0)
  const wasActiveRef = useRef(false)
  const breathStepRef = useRef(0)

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

  const processRant = useCallback(async (transcript: string) => {
    setPhase("processing")
    setError(null)
    setPlanResult(null)
    setIsBackupDemoMirror(false)

    const useSarahFallbackMirror = () => {
      setMirrorResult(SARAH_MIRROR_RESULT)
      setIsBackupDemoMirror(true)
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
        useSarahFallbackMirror()
        return
      }

      if (!mirrorRes.ok) {
        useSarahFallbackMirror()
        return
      }

      let parsed: unknown
      try {
        parsed = JSON.parse(await mirrorRes.text()) as unknown
      } catch {
        useSarahFallbackMirror()
        return
      }

      if (!isValidMirrorResult(parsed)) {
        useSarahFallbackMirror()
        return
      }

      setMirrorResult(parsed)
      setIsBackupDemoMirror(false)
      rememberFear(parsed)
      setPhase("results")
    } catch (err) {
      console.error(err)
      useSarahFallbackMirror()
    }
  }, [cancerType, lovedOne, pathologyText, rememberFear, sessionId, userId])

  const showSarahBackupDemo = useCallback(() => {
    setMirrorResult(SARAH_MIRROR_RESULT)
    setIsBackupDemoMirror(true)
    setPlanResult(null)
    setError(null)
    setPhase("results")
  }, [])

  useEffect(() => {
    if (wasActiveRef.current && !isSessionActive) {
      const transcript = transcriptRef.current
      transcriptRef.current = ""

      if (transcript.length > 20) {
        processRant(transcript)
      } else {
        setPhase("idle")
      }
    }

    wasActiveRef.current = isSessionActive
    if (isSessionActive) setPhase("recording")
  }, [isSessionActive, processRant, transcriptRef])

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

  async function copyText(kind: "note" | "handoff", value: string) {
    if (!value) return

    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 1800)
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
                <button
                  type="button"
                  onClick={startOver}
                  className="text-left text-xs text-[#756f68] underline decoration-[#c9b8d8]/60 underline-offset-4 transition hover:text-[#242230] sm:text-sm"
                >
                  {showExampleOutput ? "Exit demo · Start over →" : `Not ${displayName}? Start over`}
                </button>
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
                      cancerType={cancerType}
                      copied={copied}
                      displayName={displayName}
                      error={error}
                      handoffText={handoffText}
                      hoveredRegret={hoveredRegret}
                      isBackupDemoMirror={isBackupDemoMirror}
                      isPlanning={isPlanning}
                      lovedOne={lovedOne}
                      mirrorResult={mirrorResult}
                      noteText={noteText}
                      onCopy={copyText}
                      onHoverRegret={setHoveredRegret}
                      onPlan={requestPlan}
                      onReset={resetVoice}
                      onSarahBackupDemo={showSarahBackupDemo}
                      planResult={planResult}
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
        Anchor is turning what you said into clear next steps you can bring to your care team.
      </p>
    </motion.div>
  )
}

function ResultsView({
  cancerType,
  copied,
  displayName,
  error,
  handoffText,
  hoveredRegret,
  isBackupDemoMirror,
  isPlanning,
  lovedOne,
  mirrorResult,
  noteText,
  onCopy,
  onHoverRegret,
  onPlan,
  onReset,
  onSarahBackupDemo,
  planResult,
}: {
  cancerType: CancerType
  copied: "note" | "handoff" | null
  displayName: string
  error: string | null
  handoffText: string
  hoveredRegret: string | null
  isBackupDemoMirror: boolean
  isPlanning: boolean
  lovedOne: string
  mirrorResult: MirrorResult
  noteText: string
  onCopy: (kind: "note" | "handoff", value: string) => void
  onHoverRegret: (value: string | null) => void
  onPlan: () => void
  onReset: () => void
  onSarahBackupDemo: () => void
  planResult: PlanResult | null
}) {
  return (
    <motion.div
      key="results"
      variants={sectionVariants}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -16 }}
      className="max-w-4xl"
    >
      {isBackupDemoMirror && (
        <motion.div
          variants={itemVariants}
          className="mb-4 rounded-[22px] border border-[#c9b8d8]/70 bg-[#f5eef8]/90 px-3 py-2.5 text-xs leading-snug text-[#6f6280] sm:mb-6 sm:rounded-[24px] sm:px-4 sm:py-3 sm:text-sm sm:leading-6"
          role="status"
        >
          Showing backup demo response — sample only; confirm everything with your care team.
        </motion.div>
      )}

      <motion.p variants={itemVariants} className="mb-4 font-mono text-xs tracking-[0.18em] text-[#8f7e9b] sm:mb-5">
        YOUR NEXT MOVES FOR YOUR {lovedOne.toUpperCase()}&apos;S {cancerType.toUpperCase()} CANCER
      </motion.p>
      <motion.blockquote
        variants={itemVariants}
        className={`m-0 max-w-4xl text-2xl font-normal leading-tight sm:text-4xl lg:text-6xl xl:text-7xl ${SOFT_GRADIENT_TEXT}`}
      >
        &quot;{mirrorResult.fearQuote}&quot;
      </motion.blockquote>

      <motion.div variants={itemVariants} className="mt-6 grid gap-3 sm:mt-12 sm:gap-4">
        <ResultBand label="What Anchor hears" icon={<HeartHandshake className="h-5 w-5" />}>
          {mirrorResult.mirror}
        </ResultBand>
        <ResultBand
          label={
            isBackupDemoMirror
              ? "What we know and what still needs confirmation"
              : "What is clinically true right now"
          }
          icon={<ShieldCheck className="h-5 w-5" />}
        >
          {mirrorResult.ground}
        </ResultBand>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-6 sm:mt-10">
        {isBackupDemoMirror ? (
          <p className="mb-3 font-mono text-xs tracking-[0.16em] text-[#8f7e9b] sm:mb-4">NEXT MOVES</p>
        ) : (
          <>
            <p className="mb-2 font-mono text-xs tracking-[0.16em] text-[#8f7e9b]">NCCN-ALIGNED NEXT STEPS</p>
            <p className="mb-3 font-mono text-xs tracking-[0.16em] text-[#8f7e9b] sm:mb-4">NEXT MOVES</p>
          </>
        )}
        <div className="grid gap-2 sm:gap-3">
          {mirrorResult.actions.slice(0, 3).map((action, index) => (
            <motion.div
              key={`${action}-${index}`}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + index * 0.12, duration: 0.55 }}
            >
              <ExpandableActionItem action={action} index={index} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-6 flex flex-col gap-3 sm:mt-10 sm:flex-row">
        <button
          type="button"
          onClick={onPlan}
          disabled={isPlanning}
          className="flex w-full items-center justify-center gap-3 rounded-[26px] border border-white/80 bg-[#b7a6c9] px-6 py-4 text-white shadow-[0_20px_58px_rgba(151,128,163,0.24)] transition hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-55"
        >
          {isPlanning ? "Building your 72-hour plan..." : "Get your 72-hour plan"}
          <CalendarClock className="h-5 w-5 shrink-0" />
        </button>
        <button
          type="button"
          onClick={() => onCopy("note", noteText)}
          className={`${GLASS_BUTTON} flex w-full items-center justify-center gap-3 rounded-[26px] px-6 py-4 text-[#3f3a36]`}
        >
          {copied === "note" ? "Saved to clipboard" : "Save this note"}
          {copied === "note" ? <Check className="h-5 w-5" /> : <Clipboard className="h-5 w-5" />}
        </button>
      </motion.div>

      <AnimatePresence>
        {planResult && (
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 sm:mt-12"
          >
            <p className="mb-4 font-mono text-xs tracking-[0.16em] text-[#8f7e9b] sm:mb-5">72 HOURS, MADE SMALL ENOUGH TO HOLD</p>
            <div className="grid gap-3 sm:gap-4 xl:grid-cols-3">
              <PlanColumn actions={planResult.tonight} label="First steps" onHoverRegret={onHoverRegret} />
              <PlanColumn actions={planResult.tomorrow} label="Tomorrow" onHoverRegret={onHoverRegret} />
              <PlanColumn actions={planResult.next48} label="Next 48" onHoverRegret={onHoverRegret} />
            </div>
            <p className="mt-5 text-sm leading-6 text-[#756f68]">
              {isBackupDemoMirror
                ? "Sample caregiver checklist — confirm timing and details with your care team."
                : "Steps grounded in NCCN oncology guidelines · Always verify with your care team"}
            </p>
            <AnimatePresence>
              {hoveredRegret && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className={`${GLASS_PANEL} mt-4 rounded-[28px] p-4 text-sm italic leading-6 text-[#6f6280]`}
                >
                  {hoveredRegret}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="mt-6 grid gap-2 sm:mt-10 sm:gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onCopy("handoff", handoffText)}
          className={`${GLASS_BUTTON} flex items-center justify-between rounded-[26px] p-3.5 text-left text-[#3f3a36] sm:p-4`}
        >
          <span>
            <span className="block text-sm font-medium text-[#242230] sm:text-base">Send a handoff text</span>
            <span className="mt-1 block text-xs text-[#756f68] sm:text-sm">
              {copied === "handoff" ? "Copied for your support person." : "A concise update for your support circle."}
            </span>
          </span>
          <Phone className="h-5 w-5 shrink-0 text-[#9b829c]" />
        </button>
        <button
          type="button"
          onClick={onReset}
          className={`${GLASS_BUTTON} flex items-center justify-between rounded-[26px] p-3.5 text-left text-[#3f3a36] sm:p-4`}
        >
          <span>
            <span className="block text-sm font-medium text-[#242230] sm:text-base">Speak again</span>
            <span className="mt-1 block text-xs text-[#756f68] sm:text-sm">Another fear, another path.</span>
          </span>
          <Mic className="h-5 w-5 shrink-0 text-[#b98da0]" />
        </button>
      </motion.div>

      {error && (
        <div className="mt-5 sm:mt-6">
          <ErrorText message={error} />
          {!isBackupDemoMirror && (
            <button
              type="button"
              onClick={onSarahBackupDemo}
              className={`${GLASS_BUTTON} mt-3 w-full rounded-[26px] px-6 py-3 text-sm text-[#3f3a36] sm:mt-4 sm:w-auto`}
            >
              Show Sarah demo result
            </button>
          )}
        </div>
      )}
      <p className="mt-5 text-xs leading-6 text-[#756f68] sm:mt-7 sm:text-sm sm:leading-6">
        Hi {displayName}. This is support for orientation and preparation, not emergency care or a substitute for your oncology team.
      </p>
    </motion.div>
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
  const containerClass =
    variant === "default" || variant === "example"
      ? `${GLASS_PANEL} rounded-[28px] p-4`
      : variant === "compact"
        ? "rounded-[22px] border border-white/70 bg-white/56 p-4 text-[#3f3a36]"
        : "w-full rounded-[22px] border border-white/75 bg-white/60 p-3 text-left shadow-[0_10px_30px_rgba(116,100,91,0.08)] backdrop-blur-[20px] transition hover:-translate-y-0.5 hover:border-[#c9b8d8]/80"
  const actionClass = isPlan ? "text-sm leading-6 text-[#3f3a36]" : "text-base leading-7 text-[#3f3a36]"
  const numberClass = isExample ? "font-mono text-lg font-bold text-[#b98da0]" : "font-mono text-sm text-[#b98da0]"

  return (
    <div className={containerClass} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-expanded={isOpen}
        className="w-full text-left"
      >
        <span className={isPlan ? "mb-2 block font-mono text-xs text-[#8f7e9b]" : "flex gap-4"}>
          <span className={isPlan ? "" : numberClass}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className={actionClass}>{renderActionText(action, emphasizedPrefix)}</span>
        </span>
        <span className="mt-3 flex items-center gap-1 font-mono text-[0.68rem] tracking-[0.16em] text-[#8f7e9b]">
          Tap for script →
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.p
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.24 }}
            className="mt-4 overflow-hidden border-t border-white/70 pt-4 text-sm leading-6 text-[#5f5a55]"
          >
            {script}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function PlanColumn({
  actions,
  label,
  onHoverRegret,
}: {
  actions: PlanAction[]
  label: string
  onHoverRegret: (value: string | null) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65 }}
      className={`${GLASS_PANEL} rounded-[30px] p-4`}
    >
      <p className="mb-4 text-2xl text-[#242230]">{label}</p>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <ExpandableActionItem
            key={`${label}-${action.text}`}
            onMouseEnter={() => onHoverRegret(action.regretQuote)}
            onMouseLeave={() => onHoverRegret(null)}
            onFocus={() => onHoverRegret(action.regretQuote)}
            onBlur={() => onHoverRegret(null)}
            action={action.text}
            index={index}
            variant="plan"
          />
        ))}
      </div>
    </motion.div>
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
            <ResultBand label="What is clinically true right now (NCCN-aligned)" icon={<ShieldCheck className="h-5 w-5" />}>
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
