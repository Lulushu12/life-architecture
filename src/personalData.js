/**
 * Default seed data for the app: long-term quests, daily quests, weekly schedule.
 *
 * The contents here are neutral examples. Personal data is NOT kept in this
 * repository because it is public. To run with your own data, copy your private
 * personalData.js over this file — it is gitignored, so it cannot be committed
 * back by accident.
 *
 * The schedule can also be overridden at runtime without touching this file:
 * set the "la_schedule_v8" key in localStorage and reload.
 */

const DEFAULT_LONG = [
  { id:"l1", title:"Train consistently for 8 weeks without a missed week", category:"Health & Fitness",     xp:1200, status:"Active",  notes:"" },
  { id:"l2", title:"Hold a consistent bedtime for 30 days",                category:"Health & Fitness",     xp:600,  status:"Active",  notes:"" },
  { id:"l3", title:"Finish a professional certification",                  category:"Medicine & Surgery",   xp:1000, status:"Pending", notes:"" },
  { id:"l4", title:"Submit one piece of written work",                     category:"Medicine & Surgery",   xp:1500, status:"Pending", notes:"" },
  { id:"l5", title:"Document a repeatable system for your main craft",     category:"Trading",              xp:1500, status:"Active",  notes:"" },
  { id:"l6", title:"Review that system weekly for 8 weeks",                category:"Trading",              xp:800,  status:"Active",  notes:"" },
  { id:"l7", title:"Ship the first working version of a side project",     category:"Hobbies & Creativity", xp:900,  status:"Pending", notes:"" },
  { id:"l8", title:"Read 6 books in 6 months",                             category:"Hobbies & Creativity", xp:600,  status:"Pending", notes:"" },
];

const DEFAULT_DAILY = [
  { id:"d1", title:"Morning training completed",   category:"Health & Fitness",     baseXp:100, streak:0, lastDone:"" },
  { id:"d2", title:"Strength session done",        category:"Health & Fitness",     baseXp:75,  streak:0, lastDone:"" },
  { id:"d3", title:"Bedtime mobility done",        category:"Health & Fitness",     baseXp:50,  streak:0, lastDone:"" },
  { id:"d4", title:"Lights out on time",           category:"Health & Fitness",     baseXp:50,  streak:0, lastDone:"" },
  { id:"d5", title:"Read one professional article",category:"Medicine & Surgery",   baseXp:50,  streak:0, lastDone:"" },
  { id:"d6", title:"Work documented same day",     category:"Medicine & Surgery",   baseXp:75,  streak:0, lastDone:"" },
  { id:"d7", title:"Deep work block completed",    category:"Trading",              baseXp:100, streak:0, lastDone:"" },
  { id:"d8", title:"Journal entry written",        category:"Trading",              baseXp:75,  streak:0, lastDone:"" },
  { id:"d9", title:"Weekly review completed",      category:"Trading",              baseXp:150, streak:0, lastDone:"", note:"Sunday" },
  { id:"d10",title:"Learning block done",          category:"Hobbies & Creativity", baseXp:50,  streak:0, lastDone:"" },
  { id:"d11",title:"One page of a book read",      category:"Hobbies & Creativity", baseXp:25,  streak:0, lastDone:"" },
];

const weekday = (label) => ({
  type: label,
  subtitle: "Example day - replace with your own schedule",
  blocks: [
    { time:"06:00-06:35", type:"swim",       label:"Morning training",        detail:"Daily anchor.", twoMin:"Show up and do two minutes. That still counts." },
    { time:"09:00-13:00", type:"wildcard",   label:"Work block",              detail:"Primary obligations.", twoMin:null },
    { time:"14:00-14:30", type:"decompress", label:"Lunch and decompress",    detail:"Transition between work and personal time.", twoMin:"Five minutes sitting in silence." },
    { time:"15:00-17:30", type:"trading",    label:"Deep work",               detail:"Protected block. No interruptions.", twoMin:"Open the file and write one line." },
    { time:"18:00-19:30", type:"gym_push",   label:"Strength session",        detail:"45-60 min.", twoMin:"One set at home. Done.", isGymSubstitute:true, substituteLabel:"Home substitute: full body circuit (20 min)" },
    { time:"19:30-21:30", type:"sacred",     label:"Protected personal time", detail:"Non-negotiable.", twoMin:null },
    { time:"21:45",       type:"mobility",   label:"Bedtime mobility",        detail:"Five minutes.", twoMin:"Thirty seconds of spine rotations." },
    { time:"22:00-22:30", type:"sleep",      label:"Lights out",              detail:"7-7.5h sleep window.", twoMin:null },
  ],
});

const SCHEDULE = {
  Monday:    weekday("Work Day"),
  Tuesday:   weekday("Work Day"),
  Wednesday: weekday("Work Day"),
  Thursday:  weekday("Work Day"),
  Friday:    weekday("Work Day"),
  Saturday: {
    type:"Free Day", subtitle:"Longest uninterrupted blocks - protect them",
    blocks:[
      { time:"06:00-06:35", type:"swim",     label:"Morning training",   detail:"Flexible.", twoMin:"Two minutes still counts." },
      { time:"09:00-12:00", type:"trading",  label:"Deep work",          detail:"Best uninterrupted block of the week.", twoMin:"Write one line and see where it goes." },
      { time:"12:00-16:00", type:"learning", label:"Project block",      detail:"Your highest-value long-term work.", twoMin:"Open the project. Change one thing." },
      { time:"16:00-19:30", type:"wildcard", label:"Afternoon free",     detail:"No obligations.", twoMin:null },
      { time:"19:30-21:30", type:"sacred",   label:"Protected personal time", detail:"Non-negotiable.", twoMin:null },
      { time:"22:00-22:30", type:"sleep",    label:"Lights out",         detail:"7-7.5h sleep window.", twoMin:null },
    ]
  },
  Sunday: {
    type:"Recovery Day", subtitle:"Light movement - Weekly review - Rest",
    blocks:[
      { time:"06:00-06:35", type:"swim",     label:"Easy recovery session", detail:"Keep it genuinely easy.", twoMin:"A few easy minutes. Still counts." },
      { time:"07:00-07:45", type:"walk",     label:"Walk outside",          detail:"Mental recovery as much as physical.", twoMin:"To the end of the street and back." },
      { time:"09:00-10:30", type:"review",   label:"Weekly review",         detail:"What evidence did I generate this week?", twoMin:"One sentence: the best thing you did this week." },
      { time:"10:30-12:00", type:"learning", label:"Learning block",        detail:"Whatever pulls you.", twoMin:"Read one page of anything." },
      { time:"12:00-19:30", type:"wildcard", label:"Afternoon free",        detail:"Real recovery.", twoMin:null },
      { time:"19:30-21:30", type:"sacred",   label:"Protected personal time", detail:"Non-negotiable.", twoMin:null },
      { time:"22:00-22:30", type:"sleep",    label:"Lights out",            detail:"7-7.5h sleep window.", twoMin:null },
    ]
  },
};

export { DEFAULT_LONG, DEFAULT_DAILY, SCHEDULE };

// ---------------------------------------------------------------------------
// Page content. Neutral examples — replace with your own copy locally.
// ---------------------------------------------------------------------------

const IDENTITY_STATEMENT =
  "I am a disciplined, high-performing professional who protects my health, builds with intention, and creates with precision.";

const PILLARS = [
  ["Craft",   "Excellence in your primary profession. Continuous learning, evidence-based decisions."],
  ["System",  "Systematic, data-driven, emotionally regulated — compounding edge over time."],
  ["Builder", "Technical skill applied selectively and with purpose."],
  ["Partner", "Uninterrupted time with the people who matter is a non-negotiable boundary."],
];

const IDENTITY_SHIFT = [
  ["Inconsistent sleep, drifting bedtime", "A fixed lights-out — non-negotiable"],
  ["Scrolling instead of doing",           "Phone docked in the evening; evenings protected"],
  ["Deep work whenever it fits",           "Deep work is primary — prime blocks every day"],
  ["Exercise when motivation strikes",     "A daily anchor workout — it just happens"],
  ["Procrastinating on deep work",         "Calendar blocks are sacred commitments"],
];

const HABIT_STACKS = [
  "After I finish my morning training: shower, eat — no second workout until HR normalizes",
  "After I arrive home from work: 5 min decompress, then the short mobility set",
  "After I sit at my desk: open the journal and write the date + one observation first",
  "After I pack my bag the night before: I am already going — no decision needed",
  "After I get into bed: the phone stays on the dock; no exceptions",
];

const ENVIRONMENT_DESIGN = [
  "Bag pre-packed the night before — removes all morning decision fatigue",
  "The tool you want to use left open — seeing it creates the cue",
  "Phone dock in the hallway in the evening — physical distance reduces the pull",
  "Yoga mat visible in the bedroom — mobility happens because it is already there",
  "Distracting software closed unless explicitly needed — out of sight, not a default pull",
];

const OUTPUTS = [
  {num:"01", title:"Document your primary system", done:"Written rules for how the work gets decided, executed and reviewed",   pri:"PRIMARY", pc:"#22c55e", pb:"rgba(34,197,94,0.12)"},
  {num:"02", title:"A measurable health target",   done:"One number, one deadline, tracked daily",                              pri:"PRIMARY", pc:"#22c55e", pb:"rgba(34,197,94,0.12)"},
  {num:"03", title:"A professional milestone",     done:"The thing that only moves if you protect time for it",                 pri:"CRAFT",   pc:"#ef4444", pb:"rgba(239,68,68,0.12)"},
  {num:"04", title:"One piece of published work",  done:"Written, rehearsed and submitted before the deadline",                 pri:"CRAFT",   pc:"#ef4444", pb:"rgba(239,68,68,0.12)"},
];

const REVIEW_CADENCE = [
  {title:"Daily Log — 5 minutes", items:[
    "3 intentions before touching anything else",
    "Did the deep work block happen? One-line journal entry",
    "Did the non-negotiables hold?",
  ]},
  {title:"Weekly Review — Sunday morning", items:[
    "Review the week's work against your documented rules",
    "Quests: update XP, mark completed, activate next milestones",
    "Schedule: did the blocks hold? What disrupted them?",
    "Identity check: what evidence did I generate this week?",
    "Write 3 priorities for the coming 7 days",
  ]},
  {title:"Monthly Review — First Sunday of each month", items:[
    "Six-month output progress: where are the four outputs tracking?",
    "Health check: on track against the target?",
    "Sleep check: is the wake and lights-out window holding?",
    "Habit audit: which are installed? Which are still fragile?",
    "Results review and system adjustments",
  ]},
];

const PRINCIPLES = [
  ["Never miss twice.",             "Missing once is an accident. Missing twice is the start of a new bad habit. The 2-minute version exists precisely for this moment."],
  ["Vote for your identity.",       "Every action is a vote. Each session, each review, each protected evening is a cast vote for who you are becoming."],
  ["Reduce friction ruthlessly.",   "Bag pre-packed. Tools already open. Mat already on the floor. Fix the environment before expecting willpower to do the work."],
  ["Know what is primary.",         "One thing gets the prime deep work time. Everything else gets a hard-capped slot only when it needs attention."],
  ["Keep one non-negotiable anchor.","A single daily anchor holds the rest of the system together. It establishes the rhythm and makes every other habit easier to stack."],
  ["Protect the evenings.",         "Time with the people who matter is non-negotiable. Phone docked. Sleep is the foundation of everything else."],
  ["The system is the goal.",       "A 1% improvement every day compounds to 37x better in a year. You are not trying to have a great day. You are running a system that makes great days the default."],
];

const WORKOUT_VIDEOS = [
  {title:"Full Body Workout", url:"https://www.youtube.com/shorts/Z4Aqs-rZ__g",  cat:"Health & Fitness", desc:"3-5 rounds: squats, lunges, push-ups, supermans, plank kickthroughs, body saw planks.", color:"#22c55e"},
  {title:"Core (Abs) Workout",url:"https://www.youtube.com/shorts/I3iNE5RpMZI",  cat:"Health & Fitness", desc:"2-3 rounds: boat holds, leg lifts, bear plank, bear crawls, rotating side planks.",     color:"#22c55e"},
  {title:"Night Stretches",   url:"https://www.youtube.com/shorts/zQkpBdfQt9g",  cat:"Health & Fitness", desc:"Spine rotations, lateral neck, pigeon pose, hamstring stretch, 90/90s.",                color:"#06b6d4"},
];

// Sent to the model when estimating XP for a new quest. Keep it factual and
// short; it is the only place the app describes you to an external service.
const AI_CONTEXT =
  "Context: a working professional balancing a demanding job, a daily training habit, a documented personal system, and technical side projects.";

export {
  IDENTITY_STATEMENT, PILLARS, IDENTITY_SHIFT, HABIT_STACKS, ENVIRONMENT_DESIGN,
  OUTPUTS, REVIEW_CADENCE, PRINCIPLES, WORKOUT_VIDEOS, AI_CONTEXT,
};
