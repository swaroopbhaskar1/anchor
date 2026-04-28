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
import { getAccount, getDatabases, ID, Query, DB_ID, COLLECTIONS } from "@/lib/appwrite"

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
  "Reading between the words...",
  "Finding what matters most...",
  "Separating fear from the next step...",
  "Looking for the clinical ground...",
  "Building your path forward...",
]

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

    try {
      const [mirrorRes] = await Promise.all([
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

      if (!mirrorRes.ok) throw new Error("Mirror API failed")

      const mirror = (await mirrorRes.json()) as MirrorResult
      setMirrorResult(mirror)
      rememberFear(mirror)
      setPhase("results")
    } catch (err) {
      console.error(err)
      setError("Anchor lost the thread for a moment. Take a breath and try again.")
      setPhase("idle")
    }
  }, [cancerType, lovedOne, pathologyText, rememberFear, sessionId, userId])

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

      if (!response.ok) throw new Error("Plan API failed")
      setPlanResult((await response.json()) as PlanResult)
    } catch (err) {
      console.error(err)
      setError("The 72-hour plan did not land. Try once more when you are ready.")
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
    setWelcomeBack(false)
  }

  function resetVoice() {
    setMirrorResult(null)
    setPlanResult(null)
    setError(null)
    setCopied(null)
    setPhase("idle")
  }

  async function sendMagicLink() {
    if (!authEmail.trim()) return
    setAuthSending(true)
    setAuthError(null)
    try {
      const redirectUrl = window.location.origin + window.location.pathname
      await getAccount().createMagicURLToken(ID.unique(), authEmail.trim(), redirectUrl)
      setMagicLinkSent(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not send magic link. Try again."
      setAuthError(msg)
    } finally {
      setAuthSending(false)
    }
  }

  function continueAsGuest() {
    setAuthStatus("guest")
  }

  function resetMagicLink() {
    setMagicLinkSent(false)
    setAuthEmail("")
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
            isSending={authSending}
            magicLinkSent={magicLinkSent}
            onContinueAsGuest={continueAsGuest}
            onEmailChange={setAuthEmail}
            onResetMagicLink={resetMagicLink}
            onSendMagicLink={sendMagicLink}
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
            className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10"
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="m-0 font-mono text-xs tracking-[0.18em] text-[#8f7e9b]">ANCHOR</p>
                <p className="m-0 mt-1 text-sm text-[#756f68]">{currentDateLabel()}</p>
              </div>
              <div className="flex items-center gap-4">
                {authStatus === "guest" && (
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="text-sm text-[#8f7e9b] underline decoration-[#c9b8d8]/60 underline-offset-4 transition hover:text-[#6f6280]"
                  >
                    Save across devices →
                  </button>
                )}
                <button
                  type="button"
                  onClick={startOver}
                  className="text-sm text-[#756f68] underline decoration-[#c9b8d8]/60 underline-offset-4 transition hover:text-[#242230]"
                >
                  Not {displayName}? Start over
                </button>
              </div>
            </header>

            <div className="grid flex-1 gap-8 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:py-12">
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
                      isPlanning={isPlanning}
                      lovedOne={lovedOne}
                      mirrorResult={mirrorResult}
                      noteText={noteText}
                      onCopy={copyText}
                      onHoverRegret={setHoveredRegret}
                      onPlan={requestPlan}
                      onReset={resetVoice}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#fbf7f0]/90 p-5 backdrop-blur-[12px]"
          >
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-[#756f68] transition hover:text-[#242230]"
              aria-label="Close"
            >
              ✕
            </button>
            <AuthScreen
              email={authEmail}
              error={authError}
              isSending={authSending}
              magicLinkSent={magicLinkSent}
              onContinueAsGuest={() => setShowAuthModal(false)}
              onEmailChange={setAuthEmail}
              onResetMagicLink={resetMagicLink}
              onSendMagicLink={sendMagicLink}
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
      className="relative z-10 grid min-h-screen place-items-center px-5 py-10"
    >
      <AnimatePresence mode="wait">
        {onboardingStep === "name" ? (
          <motion.div
            key="name"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
            className={`${GLASS_PANEL} w-full max-w-4xl rounded-[40px] p-8 sm:p-12`}
          >
            <p className="mb-6 font-mono text-xs tracking-[0.18em] text-[#8f7e9b]">FIRST, THE PERSON HOLDING IT TOGETHER</p>
            <h1 className={`max-w-3xl text-5xl font-normal leading-none sm:text-7xl ${SOFT_GRADIENT_TEXT}`}>
              What should Anchor call you?
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f5a55]">
              Anchor is an AI companion for the family member navigating a loved one&apos;s cancer diagnosis.
              Speak your fear, get clinically grounded, and leave with the next moves to take.
            </p>
            <div className="mt-12 flex flex-col gap-5 sm:flex-row">
              <input
                autoFocus
                value={caregiverName}
                onChange={(event) => onNameChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onContinueName()
                }}
                placeholder="Sarah"
                className="min-h-20 flex-1 border-b border-[#c9b8d8]/70 bg-transparent text-5xl text-[#242230] outline-none placeholder:text-[#b9afa7] focus:border-[#b98da0] sm:text-6xl"
              />
              <button
                type="button"
                onClick={onContinueName}
                disabled={!caregiverName.trim()}
                className="flex items-center justify-center gap-3 rounded-[26px] border border-white/80 bg-[#b7a6c9] px-7 py-5 text-lg text-white shadow-[0_20px_58px_rgba(151,128,163,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
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
            className="w-full max-w-6xl"
          >
            <p className="mb-5 font-mono text-xs tracking-[0.18em] text-[#8f7e9b]">NOW NAME THE CARE CONTEXT</p>
            <h1 className={`text-5xl font-normal leading-none sm:text-7xl ${SOFT_GRADIENT_TEXT}`}>Who was diagnosed?</h1>
            <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {RELATIONSHIPS.map((item, index) => (
                <motion.button
                  type="button"
                  key={item.value}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.5 }}
                  onClick={() => setRelationship(item.value)}
                  whileHover={{ scale: 1.03, y: -6 }}
                  className={`min-h-40 rounded-[30px] p-5 text-left backdrop-blur-[20px] transition duration-300 ${
                    relationship === item.value
                      ? "border border-[#c9b8d8] bg-white/75 shadow-[0_24px_76px_rgba(178,150,176,0.22)]"
                      : "border border-white/70 bg-white/60 shadow-[0_16px_50px_rgba(116,100,91,0.1)] hover:border-[#c9b8d8]/80"
                  }`}
                >
                  <span className="block text-2xl text-[#242230]">{item.label}</span>
                  <span className="mt-4 block max-w-xs text-sm leading-6 text-[#756f68]">{item.note}</span>
                </motion.button>
              ))}
            </div>

            <div className={`${GLASS_PANEL} mt-6 rounded-[32px] p-5`}>
              <p className="mb-3 font-mono text-xs tracking-[0.16em] text-[#8f7e9b]">CANCER TYPE</p>
              <CancerTypeSelector cancerType={cancerType} onChange={onCancerTypeChange} />
              <button
                type="button"
                onClick={onFinish}
                disabled={!relationship}
                className="mt-5 flex w-full items-center justify-center gap-3 rounded-[26px] border border-white/80 bg-[#b7a6c9] px-6 py-4 text-white shadow-[0_20px_58px_rgba(151,128,163,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
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
}: {
  cancerType: CancerType
  displayName: string
  error: string | null
  handleStartStopClick: () => void
  lovedOne: string
  lovedOneLabel: string
  onCancerTypeChange: (value: CancerType) => void
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
      <motion.p variants={itemVariants} className="mb-5 font-mono text-xs tracking-[0.18em] text-[#8f7e9b]">
        FOR {displayName.toUpperCase()} AND YOUR {lovedOne.toUpperCase()}
      </motion.p>
      <motion.h1
        variants={itemVariants}
        className={`max-w-4xl text-5xl font-normal leading-[0.98] sm:text-7xl lg:text-8xl ${SOFT_GRADIENT_TEXT}`}
      >
        What are you carrying right now, {displayName}?
      </motion.h1>
      <motion.p variants={itemVariants} className="mt-7 max-w-2xl text-lg leading-8 text-[#5f5a55]">
        Anchor will listen, reflect the fear, ground it in the clinical path, and give you the next move for your {lovedOneLabel.toLowerCase()}.
      </motion.p>

      <motion.div variants={itemVariants} className={`${GLASS_PANEL} mt-9 rounded-[34px] p-5`}>
        <p className="mb-3 font-mono text-xs tracking-[0.16em] text-[#8f7e9b]">DIAGNOSIS CONTEXT</p>
        <CancerTypeSelector cancerType={cancerType} onChange={onCancerTypeChange} />
      </motion.div>

      <motion.div variants={itemVariants} className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleStartStopClick}
          className="group flex w-full items-center justify-between rounded-[32px] border border-white/80 bg-[#b7a6c9] px-7 py-6 text-left text-white shadow-[0_24px_72px_rgba(151,128,163,0.26)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_86px_rgba(151,128,163,0.3)] sm:w-auto sm:min-w-80"
        >
          <span>
            <span className="block text-xl">Start speaking</span>
            <span className="mt-1 block text-sm text-white/80">Anchor listens until you tap stop.</span>
          </span>
          <Mic className="h-6 w-6 transition group-hover:scale-110" />
        </button>
        <p className="max-w-sm text-sm leading-6 text-[#756f68]">
          Keep it messy. The transcript becomes your grounded note.
        </p>
      </motion.div>

      {error && <ErrorText message={error} />}
    </motion.div>
  )
}

function CancerTypeSelector({ cancerType, onChange }: { cancerType: CancerType; onChange: (value: CancerType) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {CANCER_TYPES.map((item) => (
        <button
          type="button"
          key={item.value}
          onClick={() => onChange(item.value)}
          className={`rounded-[24px] p-4 text-left transition duration-300 hover:-translate-y-0.5 ${
            cancerType === item.value
              ? "border border-[#c9b8d8] bg-white/78 text-[#242230] shadow-[0_16px_48px_rgba(178,150,176,0.18)]"
              : "border border-white/70 bg-white/50 text-[#3f3a36] shadow-[0_10px_30px_rgba(116,100,91,0.08)]"
          }`}
        >
          <span className="block text-lg">{item.label}</span>
          <span className="mt-2 block text-sm leading-5 text-[#756f68]">{item.detail}</span>
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
      <p className="mb-5 font-mono text-xs tracking-[0.18em] text-[#8f7e9b]">LISTENING</p>
      <h1 className={`text-5xl font-normal leading-none sm:text-7xl ${SOFT_GRADIENT_TEXT}`}>
        Say the unedited version, {displayName}.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f5a55]">
        Anchor is listening for the fear under the fear, then grounding it for your {lovedOne}&apos;s {cancerType} cancer.
      </p>

      <div className={`${GLASS_PANEL} relative mt-10 grid h-[390px] place-items-center overflow-hidden rounded-[48px]`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9),rgba(217,203,232,0.2)_54%,rgba(234,210,220,0.18)_78%,rgba(255,255,255,0.42)_100%)]" />
        <motion.div
          animate={{
            scale: 1.04 + voiceEnergy * 0.48,
            opacity: 0.28 + voiceEnergy * 0.32,
          }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute h-72 w-72 rounded-full bg-[#d7cbe8]/60 blur-3xl"
        />
        <motion.div
          animate={{
            scale: 0.96 + voiceEnergy * 0.4,
            opacity: 0.22 + voiceEnergy * 0.32,
          }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute h-80 w-80 rounded-full bg-[#ead2dc]/52 blur-3xl"
        />
        <motion.div
          animate={{
            scale: 1 + voiceEnergy * 0.32,
            boxShadow: `0 0 ${48 + voiceEnergy * 90}px rgba(183,166,201,${0.18 + voiceEnergy * 0.18}), 0 0 ${30 + voiceEnergy * 60}px rgba(184,141,160,${0.14 + voiceEnergy * 0.16})`,
          }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative grid h-56 w-56 place-items-center rounded-full border border-white/80 bg-white/70 backdrop-blur-[20px]"
        >
          <motion.div
            animate={{
              scale: [1, 1.05 + voiceEnergy * 0.16, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-40 w-40 rounded-full bg-[radial-gradient(circle,#fffdf9_0%,#fffdf9_34%,rgba(215,203,232,0.48)_66%,rgba(234,210,220,0.34)_100%)]"
          />
          <button
            type="button"
            onClick={onStop}
            className="relative z-10 grid h-20 w-20 place-items-center rounded-full border border-white bg-[#242230] text-white shadow-[0_16px_42px_rgba(36,34,48,0.2)] transition hover:scale-105"
            aria-label="Stop recording"
          >
            <Square className="h-7 w-7 fill-current" />
          </button>
        </motion.div>
      </div>

      <div className={`${GLASS_PANEL} mt-7 min-h-20 rounded-[30px] p-5`}>
        <p className="m-0 font-mono text-xs tracking-[0.16em] text-[#8f7e9b]">LAST WORDS ANCHOR CAUGHT</p>
        <p className="mt-3 max-w-2xl text-lg italic leading-8 text-[#5f5a55]">
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
      className="flex min-h-[520px] max-w-3xl flex-col justify-center"
    >
      <div className={`${GLASS_PANEL} mb-10 flex h-28 w-fit items-center gap-2 rounded-[32px] px-8`}>
        {[0, 1, 2, 3, 4].map((index) => (
          <motion.div
            key={index}
            animate={{ height: [30, 104, 42, 76, 30], opacity: [0.35, 0.95, 0.58, 0.8, 0.35] }}
            transition={{ duration: 2.6, repeat: Infinity, delay: index * 0.18, ease: "easeInOut" }}
            className="w-4 rounded-full bg-gradient-to-b from-[#d7cbe8] to-[#d9b8c6]"
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
          className={`text-5xl font-normal leading-none sm:text-7xl ${SOFT_GRADIENT_TEXT}`}
        >
          {phrase}
        </motion.h1>
      </AnimatePresence>
      <p className="mt-7 max-w-xl text-lg leading-8 text-[#5f5a55]">
        Anchor is holding the emotional signal next to guideline-grounded next steps.
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
  isPlanning,
  lovedOne,
  mirrorResult,
  noteText,
  onCopy,
  onHoverRegret,
  onPlan,
  onReset,
  planResult,
}: {
  cancerType: CancerType
  copied: "note" | "handoff" | null
  displayName: string
  error: string | null
  handoffText: string
  hoveredRegret: string | null
  isPlanning: boolean
  lovedOne: string
  mirrorResult: MirrorResult
  noteText: string
  onCopy: (kind: "note" | "handoff", value: string) => void
  onHoverRegret: (value: string | null) => void
  onPlan: () => void
  onReset: () => void
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
      <motion.p variants={itemVariants} className="mb-5 font-mono text-xs tracking-[0.18em] text-[#8f7e9b]">
        YOUR NEXT MOVES FOR YOUR {lovedOne.toUpperCase()}&apos;S {cancerType.toUpperCase()} CANCER
      </motion.p>
      <motion.blockquote
        variants={itemVariants}
        className={`m-0 max-w-4xl text-5xl font-normal leading-none sm:text-7xl lg:text-8xl ${SOFT_GRADIENT_TEXT}`}
      >
        &quot;{mirrorResult.fearQuote}&quot;
      </motion.blockquote>

      <motion.div variants={itemVariants} className="mt-12 grid gap-4">
        <ResultBand label="What Anchor hears" icon={<HeartHandshake className="h-5 w-5" />}>
          {mirrorResult.mirror}
        </ResultBand>
        <ResultBand label="What is clinically true right now" icon={<ShieldCheck className="h-5 w-5" />}>
          {mirrorResult.ground}
        </ResultBand>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-10">
        <p className="mb-4 font-mono text-xs tracking-[0.16em] text-[#8f7e9b]">NEXT MOVES</p>
        <div className="grid gap-3">
          {mirrorResult.actions.slice(0, 3).map((action, index) => (
            <motion.div
              key={`${action}-${index}`}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + index * 0.12, duration: 0.55 }}
              className={`${GLASS_PANEL} flex gap-4 rounded-[28px] p-4`}
            >
              <span className="font-mono text-sm text-[#b98da0]">{String(index + 1).padStart(2, "0")}</span>
              <span className="text-base leading-7 text-[#3f3a36]">{action}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onPlan}
          disabled={isPlanning}
          className="flex items-center justify-center gap-3 rounded-[26px] border border-white/80 bg-[#b7a6c9] px-6 py-4 text-white shadow-[0_20px_58px_rgba(151,128,163,0.24)] transition hover:-translate-y-0.5 disabled:opacity-55"
        >
          {isPlanning ? "Building your 72-hour plan..." : "Get your 72-hour plan"}
          <CalendarClock className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => onCopy("note", noteText)}
          className={`${GLASS_BUTTON} flex items-center justify-center gap-3 rounded-[26px] px-6 py-4 text-[#3f3a36]`}
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
            className="mt-12"
          >
            <p className="mb-5 font-mono text-xs tracking-[0.16em] text-[#8f7e9b]">72 HOURS, MADE SMALL ENOUGH TO HOLD</p>
            <div className="grid gap-4 xl:grid-cols-3">
              <PlanColumn actions={planResult.tonight} label="First steps" onHoverRegret={onHoverRegret} />
              <PlanColumn actions={planResult.tomorrow} label="Tomorrow" onHoverRegret={onHoverRegret} />
              <PlanColumn actions={planResult.next48} label="Next 48" onHoverRegret={onHoverRegret} />
            </div>
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

      <motion.div variants={itemVariants} className="mt-10 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onCopy("handoff", handoffText)}
          className={`${GLASS_BUTTON} flex items-center justify-between rounded-[26px] p-4 text-left text-[#3f3a36]`}
        >
          <span>
            <span className="block text-base text-[#242230]">Send a handoff text</span>
            <span className="mt-1 block text-sm text-[#756f68]">
              {copied === "handoff" ? "Copied for your support person." : "A concise update for your support circle."}
            </span>
          </span>
          <Phone className="h-5 w-5 text-[#9b829c]" />
        </button>
        <button
          type="button"
          onClick={onReset}
          className={`${GLASS_BUTTON} flex items-center justify-between rounded-[26px] p-4 text-left text-[#3f3a36]`}
        >
          <span>
            <span className="block text-base text-[#242230]">Speak again</span>
            <span className="mt-1 block text-sm text-[#756f68]">Another fear, another path.</span>
          </span>
          <Mic className="h-5 w-5 text-[#b98da0]" />
        </button>
      </motion.div>

      {error && <ErrorText message={error} />}
      <p className="mt-7 text-sm leading-6 text-[#756f68]">
        Hi {displayName}. This is support for orientation and preparation, not emergency care or a substitute for your oncology team.
      </p>
    </motion.div>
  )
}

function ResultBand({ children, icon, label }: { children: React.ReactNode; icon: React.ReactNode; label: string }) {
  return (
    <div className={`${GLASS_PANEL} rounded-[30px] p-5`}>
      <div className="mb-3 flex items-center gap-3 font-mono text-xs tracking-[0.16em] text-[#8f7e9b]">
        {icon}
        {label}
      </div>
      <p className="m-0 text-lg leading-8 text-[#3f3a36]">{children}</p>
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
          <button
            type="button"
            key={`${label}-${action.text}`}
            onMouseEnter={() => onHoverRegret(action.regretQuote)}
            onMouseLeave={() => onHoverRegret(null)}
            onFocus={() => onHoverRegret(action.regretQuote)}
            onBlur={() => onHoverRegret(null)}
            className="w-full rounded-[22px] border border-white/75 bg-white/60 p-3 text-left shadow-[0_10px_30px_rgba(116,100,91,0.08)] backdrop-blur-[20px] transition hover:-translate-y-0.5 hover:border-[#c9b8d8]/80"
          >
            <span className="mb-2 block font-mono text-xs text-[#8f7e9b]">{String(index + 1).padStart(2, "0")}</span>
            <span className="text-sm leading-6 text-[#3f3a36]">{action.text}</span>
          </button>
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
    <aside className={`${GLASS_PANEL} rounded-[36px] p-5 lg:sticky lg:top-6`}>
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
      <label className={`${GLASS_BUTTON} flex cursor-pointer items-center justify-between rounded-[24px] p-4 text-sm text-[#3f3a36]`}>
        <span>{uploadText}</span>
        {uploadState === "done" ? <Check className="h-5 w-5 text-[#8f7e9b]" /> : <Upload className="h-5 w-5 text-[#b98da0]" />}
        <input type="file" accept="application/pdf" className="sr-only" onChange={onUpload} />
      </label>
      <textarea
        value={pathologyText}
        onChange={(event) => setPathologyText(event.target.value)}
        placeholder="Optional: paste stage, biomarkers, impression, or a confusing line."
        className="mt-3 min-h-24 w-full resize-none rounded-[22px] border border-white/70 bg-white/60 p-3 text-sm leading-6 text-[#3f3a36] shadow-inner outline-none placeholder:text-[#a09a93] backdrop-blur-[20px] focus:border-[#c9b8d8]/80"
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
    <nav className="relative z-10 pb-5">
      <div className="mx-auto flex w-fit flex-wrap items-center justify-center gap-2 rounded-full border border-white/70 bg-white/46 p-2 shadow-[0_18px_58px_rgba(116,100,91,0.1)] backdrop-blur-[20px]">
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
                <span className="block max-w-32 text-[11px] leading-4 text-[#8a827a] opacity-80 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
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
      className="fixed inset-0 z-50 overflow-y-auto bg-[#fbf7f0]/94 px-5 py-6 text-[#242230] backdrop-blur-[18px] sm:px-8"
    >
      <AmbientOrbs />
      <div className="relative z-10 mx-auto max-w-5xl">
        <button
          type="button"
          onClick={onClose}
          className={`${GLASS_BUTTON} mb-8 flex items-center gap-2 rounded-full px-4 py-2 text-sm text-[#3f3a36]`}
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
    <section className="grid min-h-[70vh] place-items-center">
      <div className="text-center">
        <p className="mb-4 font-mono text-xs tracking-[0.18em] text-[#8f7e9b]">BREATHE</p>
        <h2 className={`text-5xl font-normal sm:text-7xl ${SOFT_GRADIENT_TEXT}`}>For when the mind will not stop.</h2>
        <div className="mt-12 grid place-items-center">
          <motion.div
            animate={{ scale: phase.scale }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className={`${GLASS_PANEL} grid h-56 w-56 place-items-center rounded-full bg-[#f7efe7]/70`}
          >
            <div className="text-center">
              <p className="text-4xl text-[#242230]">{phase.label}</p>
              <p className="mt-2 text-sm text-[#756f68]">4 seconds</p>
            </div>
          </motion.div>
        </div>
        <p className="mt-8 text-sm text-[#756f68]">Cycles completed: {breathCycles}</p>
        <AnimatePresence>
          {breathCycles >= 3 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto mt-5 max-w-md text-lg leading-8 text-[#5f5a55]"
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
      <p className="mb-4 font-mono text-xs tracking-[0.18em] text-[#8f7e9b]">CLEAR MY HEAD</p>
      <h2 className={`text-5xl font-normal sm:text-7xl ${SOFT_GRADIENT_TEXT}`}>What thought keeps coming back?</h2>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <input
          value={thought}
          onChange={(event) => setThought(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submitThought()
          }}
          placeholder="Type it exactly as it sounds in your head."
          className={`${GLASS_PANEL} min-h-16 flex-1 rounded-[26px] px-5 text-xl text-[#242230] outline-none placeholder:text-[#a09a93]`}
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
            <ResultBand label="What's actually true" icon={<ShieldCheck className="h-5 w-5" />}>
              {result.ground}
            </ResultBand>
            <div className={`${GLASS_PANEL} rounded-[30px] p-5`}>
              <p className="mb-4 font-mono text-xs tracking-[0.16em] text-[#8f7e9b]">THREE WAYS TO LOOSEN ITS GRIP</p>
              <div className="space-y-3">
                {result.actions.slice(0, 3).map((action, index) => (
                  <div key={`${action}-${index}`} className="rounded-[22px] border border-white/70 bg-white/56 p-4 text-[#3f3a36]">
                    <span className="mr-3 font-mono text-xs text-[#b98da0]">{String(index + 1).padStart(2, "0")}</span>
                    {action}
                  </div>
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
      <p className="mb-4 font-mono text-xs tracking-[0.18em] text-[#8f7e9b]">SAY IT</p>
      <h2 className={`text-5xl font-normal sm:text-7xl ${SOFT_GRADIENT_TEXT}`}>A private place for the unpolished sentence.</h2>
      <p className="mt-6 text-lg leading-8 text-[#5f5a55]">{prompt}</p>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Write without making it useful yet."
        className={`${GLASS_PANEL} mt-8 min-h-72 w-full resize-none rounded-[34px] p-6 text-xl leading-9 text-[#242230] outline-none placeholder:text-[#aaa199]`}
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
  isSending,
  magicLinkSent,
  onContinueAsGuest,
  onEmailChange,
  onResetMagicLink,
  onSendMagicLink,
}: {
  email: string
  error: string | null
  isSending: boolean
  magicLinkSent: boolean
  onContinueAsGuest: () => void
  onEmailChange: (value: string) => void
  onResetMagicLink: () => void
  onSendMagicLink: () => void
}) {
  return (
    <motion.section
      key="auth"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.65 }}
      className="relative z-10 grid min-h-screen place-items-center px-5 py-10"
    >
      <div className={`${GLASS_PANEL} w-full max-w-2xl rounded-[40px] p-8 sm:p-12`}>
        <p className="mb-6 font-mono text-xs tracking-[0.18em] text-[#8f7e9b]">ANCHOR</p>
        <h1 className={`text-4xl font-normal leading-tight sm:text-5xl ${SOFT_GRADIENT_TEXT}`}>
          Your space. Private to you.
        </h1>
        <p className="mt-4 text-lg leading-8 text-[#5f5a55]">
          Create an account to save everything across devices.
        </p>

        {magicLinkSent ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10">
            <p className="text-xl text-[#242230]">Check your inbox.</p>
            <p className="mt-3 text-base leading-7 text-[#5f5a55]">
              We sent a sign-in link to <strong>{email}</strong>. Click it to continue.
            </p>
            <p className="mt-6 text-sm text-[#756f68]">
              Wrong address?{" "}
              <button type="button" onClick={onResetMagicLink} className="underline underline-offset-2 hover:text-[#242230]">
                Try again
              </button>
            </p>
          </motion.div>
        ) : (
          <div className="mt-10 flex flex-col gap-5">
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSendMagicLink() }}
              placeholder="your@email.com"
              className="min-h-16 border-b border-[#c9b8d8]/70 bg-transparent text-2xl text-[#242230] outline-none placeholder:text-[#b9afa7] focus:border-[#b98da0]"
            />
            {error && <ErrorText message={error} />}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onSendMagicLink}
                disabled={isSending || !email.trim()}
                className="flex items-center justify-center gap-3 rounded-[26px] border border-white/80 bg-[#b7a6c9] px-7 py-4 text-white shadow-[0_20px_58px_rgba(151,128,163,0.24)] transition hover:-translate-y-0.5 disabled:opacity-40"
              >
                {isSending ? "Sending..." : "Send magic link"}
              </button>
              <button
                type="button"
                onClick={onContinueAsGuest}
                className={`${GLASS_BUTTON} rounded-[26px] px-7 py-4 text-[#3f3a36]`}
              >
                Continue as guest
              </button>
            </div>
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
      className="relative z-10 grid min-h-screen place-items-center px-5"
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
