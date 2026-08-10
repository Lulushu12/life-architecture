import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const FONT_LINK = document.createElement("link");
FONT_LINK.rel = "stylesheet";
FONT_LINK.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&family=JetBrains+Mono:wght@400;600&display=swap";
document.head.appendChild(FONT_LINK);

const LEVELS = [
  { name: "Novice Adventurer",    min: 0 },
  { name: "Apprentice",           min: 1000 },
  { name: "Journeyman",           min: 3000 },
  { name: "Skilled Practitioner", min: 6000 },
  { name: "Expert",               min: 10000 },
  { name: "Master",               min: 15000 },
  { name: "Legendary Figure",     min: 22000 },
];
const CATEGORIES = ["Health & Fitness", "Medicine & Surgery", "Trading", "Hobbies & Creativity"];
const CAT_COLORS = {
  "Health & Fitness":     { accent: "#22c55e", light: "#86efac" },
  "Medicine & Surgery":   { accent: "#ef4444", light: "#fca5a5" },
  "Trading":              { accent: "#06b6d4", light: "#67e8f9" },
  "Hobbies & Creativity": { accent: "#f59e0b", light: "#fcd34d" },
};
const STREAK_MULT  = (s) => s >= 30 ? 3 : s >= 14 ? 2 : s >= 7 ? 1.5 : 1;
const STREAK_LABEL = (s) => s >= 30 ? "3x" : s >= 14 ? "2x" : s >= 7 ? "1.5x" : "1x";
const STREAK_COLOR = (s) => s >= 30 ? "#a855f7" : s >= 14 ? "#ef4444" : s >= 7 ? "#f59e0b" : "#64748b";
const todayKey = () => new Date().toISOString().slice(0, 10);

const DEFAULT_LONG = [
  { id:"l1",  title:"Swim every day for 4 consecutive weeks",                category:"Health & Fitness",     xp:1000, status:"Active",  notes:"" },
  { id:"l2",  title:"8 consecutive weeks of training without a missed week", category:"Health & Fitness",     xp:1200, status:"Active",  notes:"" },
  { id:"l3",  title:"Maintain lights out by 22:30 for 30 days",             category:"Health & Fitness",     xp:600,  status:"Active",  notes:"" },
  { id:"l4",  title:"Lose first 5kg",                                        category:"Health & Fitness",     xp:1000, status:"Active",  notes:"Tracked via scale" },
  { id:"l5",  title:"Lose 15kg total by end of summer",                      category:"Health & Fitness",     xp:2000, status:"Active",  notes:"Hard deadline: end of September" },
  { id:"l6",  title:"Swim 500m without stopping",                            category:"Health & Fitness",     xp:800,  status:"Active",  notes:"Currently doing 500m with breaks" },
  { id:"l7",  title:"SRATS conference - slides + script finalized",          category:"Medicine & Surgery",   xp:1000, status:"Pending", notes:"" },
  { id:"l8",  title:"Both CAD patents approved",                             category:"Medicine & Surgery",   xp:1200, status:"Active",  notes:"" },
  { id:"l9",  title:"Submit a case report or research paper",               category:"Medicine & Surgery",   xp:1500, status:"Pending", notes:"" },
  { id:"l10", title:"Complete a structured CME course (min. 10 hours)",      category:"Medicine & Surgery",   xp:700,  status:"Pending", notes:"" },
  { id:"l11", title:"Attend one orthopedic conference this year",            category:"Medicine & Surgery",   xp:800,  status:"Pending", notes:"" },
  { id:"l12", title:"Review and document 20 surgical outcomes",              category:"Medicine & Surgery",   xp:1000, status:"Pending", notes:"" },
  { id:"l13", title:"Submit a research abstract internationally",            category:"Medicine & Surgery",   xp:1200, status:"Pending", notes:"" },
  { id:"l14", title:"Complete v1 of documented trading system",              category:"Trading",              xp:1500, status:"Active",  notes:"" },
  { id:"l15", title:"Execute 50 trades fully within documented rules",       category:"Trading",              xp:1000, status:"Active",  notes:"" },
  { id:"l16", title:"Weekly trading review for 8 consecutive weeks",        category:"Trading",              xp:800,  status:"Active",  notes:"" },
  { id:"l17", title:"Complete a structured trading course or book",          category:"Trading",              xp:700,  status:"Pending", notes:"" },
  { id:"l18", title:"Ship first working 3D Slicer module",                  category:"Hobbies & Creativity", xp:900,  status:"Pending", notes:"" },
  { id:"l19", title:"Read 6 books in 6 months",                             category:"Hobbies & Creativity", xp:600,  status:"Pending", notes:"" },
  { id:"l20", title:"NixOS boots cleanly with full config declared",         category:"Hobbies & Creativity", xp:400,  status:"Active",  notes:"Milestone 1/4" },
  { id:"l21", title:"All essential apps installed and working via Nix",     category:"Hobbies & Creativity", xp:500,  status:"Pending", notes:"Milestone 2/4" },
  { id:"l22", title:"Dotfiles fully managed with Home Manager",             category:"Hobbies & Creativity", xp:600,  status:"Pending", notes:"Milestone 3/4" },
  { id:"l23", title:"NixOS configured as daily driver - stable",            category:"Hobbies & Creativity", xp:700,  status:"Pending", notes:"Milestone 4/4" },
];

const DEFAULT_DAILY = [
  { id:"d1",  title:"Swim completed",                    category:"Health & Fitness",     baseXp:100, streak:0, lastDone:"" },
  { id:"d2",  title:"Gym session done",                  category:"Health & Fitness",     baseXp:75,  streak:0, lastDone:"" },
  { id:"d3",  title:"Bedtime mobility done",             category:"Health & Fitness",     baseXp:50,  streak:0, lastDone:"" },
  { id:"d4",  title:"Lights out by 22:30",               category:"Health & Fitness",     baseXp:50,  streak:0, lastDone:"" },
  { id:"d5",  title:"Hit protein target",                category:"Health & Fitness",     baseXp:50,  streak:0, lastDone:"" },
  { id:"d6",  title:"Stayed within caloric budget",      category:"Health & Fitness",     baseXp:75,  streak:0, lastDone:"" },
  { id:"d7",  title:"VMO workout done",                  category:"Health & Fitness",     baseXp:50,  streak:0, lastDone:"" },
  { id:"d7b", title:"Full body home workout completed",  category:"Health & Fitness",     baseXp:75,  streak:0, lastDone:"" },
  { id:"d7c", title:"Core circuit completed",            category:"Health & Fitness",     baseXp:50,  streak:0, lastDone:"" },
  { id:"d8",  title:"Read one medical article",          category:"Medicine & Surgery",   baseXp:50,  streak:0, lastDone:"" },
  { id:"d9",  title:"10 min of CME content completed",   category:"Medicine & Surgery",   baseXp:50,  streak:0, lastDone:"" },
  { id:"d10", title:"Surgical case documented",          category:"Medicine & Surgery",   baseXp:75,  streak:0, lastDone:"", note:"OR days" },
  { id:"d11", title:"Pre-op case prep completed",        category:"Medicine & Surgery",   baseXp:50,  streak:0, lastDone:"", note:"OR days" },
  { id:"d12", title:"Post-op notes completed same day",  category:"Medicine & Surgery",   baseXp:75,  streak:0, lastDone:"", note:"OR days" },
  { id:"d13", title:"Trading deep work block completed", category:"Trading",              baseXp:100, streak:0, lastDone:"" },
  { id:"d14", title:"Trading journal entry written",     category:"Trading",              baseXp:75,  streak:0, lastDone:"" },
  { id:"d15", title:"No trades outside system rules",    category:"Trading",              baseXp:100, streak:0, lastDone:"" },
  { id:"d16", title:"Read/watched trading content",      category:"Trading",              baseXp:50,  streak:0, lastDone:"" },
  { id:"d17", title:"Weekly review completed",           category:"Trading",              baseXp:150, streak:0, lastDone:"", note:"Sunday" },
  { id:"d18", title:"Learning block done",               category:"Hobbies & Creativity", baseXp:50,  streak:0, lastDone:"" },
  { id:"d19", title:"One page of a book read",           category:"Hobbies & Creativity", baseXp:25,  streak:0, lastDone:"" },
  { id:"d20", title:"20 min working on NixOS config",    category:"Hobbies & Creativity", baseXp:50,  streak:0, lastDone:"" },
  { id:"d21", title:"Fixed one NixOS issue",             category:"Hobbies & Creativity", baseXp:75,  streak:0, lastDone:"" },
  { id:"d22", title:"Documented a NixOS solution",       category:"Hobbies & Creativity", baseXp:50,  streak:0, lastDone:"" },
];

const BLOCK_META = {
  swim:      { color:"#06b6d4", bg:"rgba(6,182,212,0.10)",   label:"SWIM" },
  vmo:       { color:"#a855f7", bg:"rgba(168,85,247,0.10)",  label:"VMO" },
  fullbody:  { color:"#22c55e", bg:"rgba(34,197,94,0.10)",   label:"FULL BODY" },
  trading:   { color:"#3b82f6", bg:"rgba(59,130,246,0.12)",  label:"TRADING" },
  gym_push:  { color:"#f59e0b", bg:"rgba(245,158,11,0.10)",  label:"GYM PUSH" },
  gym_pull:  { color:"#f59e0b", bg:"rgba(245,158,11,0.10)",  label:"GYM PULL" },
  gym_legs:  { color:"#f59e0b", bg:"rgba(245,158,11,0.10)",  label:"GYM LEGS" },
  gym_light: { color:"#f59e0b", bg:"rgba(245,158,11,0.08)",  label:"GYM LIGHT" },
  walk:      { color:"#86efac", bg:"rgba(134,239,172,0.08)", label:"WALK" },
  review:    { color:"#3b82f6", bg:"rgba(59,130,246,0.10)",  label:"REVIEW" },
  learning:  { color:"#94a3b8", bg:"rgba(148,163,184,0.08)", label:"LEARNING" },
  sacred:    { color:"#fbbf24", bg:"rgba(251,191,36,0.10)",  label:"PROTECTED" },
  decompress:{ color:"#475569", bg:"rgba(71,85,105,0.08)",   label:"DECOMPRESS" },
  wildcard:  { color:"#334155", bg:"rgba(51,65,85,0.06)",    label:"FREE" },
  mobility:  { color:"#a855f7", bg:"rgba(168,85,247,0.08)",  label:"MOBILITY" },
  sleep:     { color:"#1d4ed8", bg:"rgba(29,78,216,0.10)",   label:"SLEEP" },
};

const HOME_PPL = {
  Push: {
    color:"#f59e0b", duration:"40-45 min", focus:"Chest, shoulders, triceps",
    warmup:"5 min: arm circles, shoulder dislocates (towel or broom held wide), incline push-up ramp-up.",
    exercises:[
      { name:"DB Floor Press",              sets:"4", reps:"12-15",   note:"3-count lowering. At 10kg/side, tempo is what builds the chest, not the load." },
      { name:"DB Seated Shoulder Press",    sets:"4", reps:"10-12",   note:"Strict form, no leg drive." },
      { name:"Feet-Elevated Push-ups",      sets:"3", reps:"AMRAP",  note:"Bodyweight covers what the dumbbells can't at this load." },
      { name:"DB Single-Arm Floor Press",   sets:"3", reps:"12/side", note:"Unilateral doubles the effective resistance per arm." },
      { name:"DB Lateral Raise",            sets:"3", reps:"15-20",  note:"Light weight is ideal here — this is a strict-form movement regardless." },
      { name:"DB Overhead Tricep Extension",sets:"3", reps:"12-15",  note:"Both hands on one dumbbell, elbows tucked." },
      { name:"Diamond Push-ups",            sets:"3", reps:"AMRAP",  note:"Finish the triceps with bodyweight." },
    ],
  },
  Pull: {
    color:"#f59e0b", duration:"40-45 min", focus:"Back, biceps, rear delts",
    warmup:"5 min: towel pull-aparts, cat-cow, arm swings, dead hangs if a bar is available.",
    exercises:[
      { name:"Pull-ups / Chin-ups",         sets:"4", reps:"AMRAP",   note:"If a bar is available. Otherwise sub DB Renegade Rows, 4x10/side." },
      { name:"DB Single-Arm Row",           sets:"4", reps:"12/side", note:"Chair or bench supported, full stretch at the bottom." },
      { name:"DB Romanian Deadlift",        sets:"3", reps:"12-15",  note:"Doubles as posterior-chain work for the back." },
      { name:"DB Reverse Fly",              sets:"3", reps:"15",     note:"Hinge at hips, light weight, control the eccentric." },
      { name:"DB Bicep Curl",               sets:"4", reps:"12-15",  note:"Strict, no swing — 10kg is plenty for isolation curls." },
      { name:"DB Hammer Curl",              sets:"3", reps:"12",     note:"Hits brachialis and forearms." },
      { name:"Superman Holds",              sets:"3", reps:"15-20s", note:"Lower back and rear delts, bodyweight." },
    ],
  },
  Legs: {
    color:"#f59e0b", duration:"45-50 min", focus:"Quads, hamstrings, glutes, calves",
    warmup:"5 min: bodyweight squats, leg swings, unweighted walking lunges.",
    exercises:[
      { name:"DB Goblet Squat",             sets:"4", reps:"12-15",  note:"Hold one dumbbell (or both stacked) at chest, elbows inside knees at the bottom." },
      { name:"DB Romanian Deadlift",        sets:"4", reps:"12-15",  note:"Hamstrings and glutes — slow eccentric, soft knees." },
      { name:"Bulgarian Split Squat",       sets:"3", reps:"10-12/leg", note:"Rear foot elevated on a chair, DB in each hand. The hardest exercise in this plan at this weight." },
      { name:"DB Walking Lunges",           sets:"3", reps:"12/leg",  note:"Long stride, controlled descent." },
      { name:"DB Single-Leg RDL",           sets:"3", reps:"10/leg",  note:"Balance-limited — great for hamstrings without needing more load." },
      { name:"Single-Leg Glute Bridge",     sets:"3", reps:"15/leg",  note:"DB resting on hips for the two-leg version if balance is an issue." },
      { name:"DB Calf Raise",               sets:"4", reps:"20",     note:"Single dumbbell, step edge for full range of motion." },
    ],
  },
};

const SCHEDULE = {
  Monday: {
    type:"Clinic Day", subtitle:"Subway commute - Leave home by 07:30",
    blocks:[
      { time:"05:00-05:30", type:"wildcard",   label:"Wake up - Morning prep",              detail:"Alarm at 05:00-05:30. Gym bag already packed from night before.", twoMin:"Sit up. Drink water. Shoes on. That is the whole routine." },
      { time:"05:45",       type:"wildcard",   label:"Leave for Gym B",                     detail:"15 min drive.", twoMin:null },
      { time:"06:00-06:35", type:"swim",       label:"Swim - Gym B",                        detail:"30-35 min, ~500m with breaks. Avg HR 120-130. Daily anchor.", twoMin:"Get in the pool and do 2 laps. You still showed up." },
      { time:"06:35-07:30", type:"wildcard",   label:"Drive home - Shower - Breakfast",     detail:"Recover from swim. No workout immediately after.", twoMin:null },
      { time:"07:30",       type:"wildcard",   label:"Leave for clinic",                    detail:"Subway commute.", twoMin:null },
      { time:"~14:00-14:30",type:"decompress", label:"Home - Lunch - Decompress",           detail:"Transition from clinical to personal time. No screens, eat well.", twoMin:"5 minutes sitting in silence with a coffee." },
      { time:"14:30-15:00", type:"vmo",        label:"VMO workout (12 min)",                detail:"Deep VMO squats x2 sets + front foot elevated split squat x2 sets each leg. Mon + Thu only. <a href='https://www.youtube.com/watch?v=bf18YHxDvME' target='_blank' style='color:#a855f7'>▶ VMO Exercises</a>", twoMin:"1 set of 10 deep VMO squats holding a door frame. Done." },
      { time:"15:00-17:30", type:"trading",    label:"Trading deep work",                   detail:"System documentation, analysis, journal, setups. No interruptions.", twoMin:"Open the journal and write today's date + one market observation." },
      { time:"17:30-18:00", type:"wildcard",   label:"Transition - get ready for gym",      detail:"Wildcard buffer.", twoMin:null },
      { time:"18:00-19:30", type:"gym_push",   label:"Gym A with wife - Push",              detail:"Chest, shoulders, triceps. Bench press, OHP, lateral raises, tricep pushdowns. Wife on cardio. 45-60 min.", twoMin:"5 sets of push-ups to failure at home. Wife still goes.", isGymSubstitute:true, substituteLabel:"Home substitute: Dumbbell Push Day (see Workouts tab)" },
      { time:"19:30-21:30", type:"sacred",     label:"Evening with wife",                   detail:"Non-negotiable. Dinner, wind down together.", twoMin:null },
      { time:"21:00",       type:"wildcard",   label:"Phone docked",                        detail:"Physical distance from phone. No screens after this point.", twoMin:null },
      { time:"21:45",       type:"mobility",   label:"Bedtime mobility (5 min)",            detail:"Spine rotations - lateral neck - pigeon pose - hamstring stretch - 90/90s. <a href='https://www.youtube.com/shorts/zQkpBdfQt9g' target='_blank' style='color:#a855f7'>▶ Night Stretches</a>", twoMin:"Just do the spine rotations for 30 seconds. Roll into bed." },
      { time:"22:00-22:30", type:"sleep",      label:"Lights out",                          detail:"7-7.5h sleep window. Wake at 05:00-05:30. Non-negotiable.", twoMin:null },
    ]
  },
  Tuesday: {
    type:"Clinic Day", subtitle:"Subway commute - Leave home by 07:30",
    blocks:[
      { time:"05:00-05:30", type:"wildcard",   label:"Wake up - Morning prep",              detail:"Gym bag already packed.", twoMin:"Sit up. Drink water. Shoes on." },
      { time:"05:45",       type:"wildcard",   label:"Leave for Gym B",                     detail:"15 min drive.", twoMin:null },
      { time:"06:00-06:35", type:"swim",       label:"Swim - Gym B",                        detail:"30-35 min. Daily anchor.", twoMin:"Get in the pool and do 2 laps." },
      { time:"06:35-07:30", type:"wildcard",   label:"Drive home - Shower - Breakfast",     detail:"Recover. No workout immediately after swim.", twoMin:null },
      { time:"07:30",       type:"wildcard",   label:"Leave for clinic",                    detail:"Subway commute.", twoMin:null },
      { time:"~14:00-14:30",type:"decompress", label:"Home - Lunch - Decompress",           detail:"Transition block. No rush.", twoMin:"5 minutes sitting in silence." },
      { time:"15:00-17:30", type:"trading",    label:"Trading deep work",                   detail:"Primary focus block. Protect it.", twoMin:"Open the journal and write today's date + one market observation." },
      { time:"17:30-18:00", type:"wildcard",   label:"Transition - get ready for gym",      detail:"Wildcard buffer.", twoMin:null },
      { time:"18:00-19:30", type:"gym_pull",   label:"Gym A with wife - Pull",              detail:"Back, biceps. Barbell rows, lat pulldown, cable rows, curls. 45-60 min.", twoMin:"3 sets of DB rows at home.", isGymSubstitute:true, substituteLabel:"Home substitute: Dumbbell Pull Day (see Workouts tab)" },
      { time:"19:30-21:30", type:"sacred",     label:"Evening with wife",                   detail:"Non-negotiable.", twoMin:null },
      { time:"21:00",       type:"wildcard",   label:"Phone docked",                        detail:"No screens after this point.", twoMin:null },
      { time:"21:45",       type:"mobility",   label:"Bedtime mobility (5 min)",            detail:"Full routine. <a href='https://www.youtube.com/shorts/zQkpBdfQt9g' target='_blank' style='color:#a855f7'>&#9654; Night Stretches</a>", twoMin:"Just do the spine rotations for 30 seconds." },
      { time:"22:00-22:30", type:"sleep",      label:"Lights out",                          detail:"7-7.5h sleep window.", twoMin:null },
    ]
  },
  Wednesday: {
    type:"Clinic Day", subtitle:"Subway commute - Leave home by 07:30",
    blocks:[
      { time:"05:00-05:30", type:"wildcard",   label:"Wake up - Morning prep",              detail:"Gym bag already packed.", twoMin:"Sit up. Drink water. Shoes on." },
      { time:"05:45",       type:"wildcard",   label:"Leave for Gym B",                     detail:"15 min drive.", twoMin:null },
      { time:"06:00-06:35", type:"swim",       label:"Swim - Gym B",                        detail:"30-35 min. Daily anchor.", twoMin:"Get in the pool and do 2 laps." },
      { time:"06:35-07:30", type:"wildcard",   label:"Drive home - Shower - Breakfast",     detail:"Recover from swim.", twoMin:null },
      { time:"07:30",       type:"wildcard",   label:"Leave for clinic",                    detail:"Subway commute.", twoMin:null },
      { time:"~14:00-14:30",type:"decompress", label:"Home - Lunch - Decompress",           detail:"Transition block.", twoMin:"5 minutes sitting in silence." },
      { time:"15:00-17:30", type:"trading",    label:"Trading deep work",                   detail:"Primary focus block.", twoMin:"Open the journal and write today's date + one market observation." },
      { time:"17:30-18:00", type:"wildcard",   label:"Transition - get ready for gym",      detail:"Wildcard buffer.", twoMin:null },
      { time:"18:00-19:30", type:"gym_legs",   label:"Gym A with wife - Legs",              detail:"Quads, hamstrings, glutes. Back squat, Romanian deadlift, hip thrust, leg press.", twoMin:"3 sets of DB goblet squats at home.", isGymSubstitute:true, substituteLabel:"Home substitute: Dumbbell Legs Day (see Workouts tab)" },
      { time:"19:30-21:30", type:"sacred",     label:"Evening with wife",                   detail:"Non-negotiable.", twoMin:null },
      { time:"21:00",       type:"wildcard",   label:"Phone docked",                        detail:"No screens after this point.", twoMin:null },
      { time:"21:45",       type:"mobility",   label:"Bedtime mobility (5 min)",            detail:"Full routine. <a href='https://www.youtube.com/shorts/zQkpBdfQt9g' target='_blank' style='color:#a855f7'>&#9654; Night Stretches</a>", twoMin:"Just do the spine rotations for 30 seconds." },
      { time:"22:00-22:30", type:"sleep",      label:"Lights out",                          detail:"7-7.5h sleep window.", twoMin:null },
    ]
  },
  Thursday: {
    type:"OR Day", subtitle:"Drive from Gym B straight to hospital - Arrive by 08:00",
    blocks:[
      { time:"05:00-05:30", type:"wildcard",   label:"Wake up - Morning prep",              detail:"Drive straight to hospital after swim. Shower at Gym B.", twoMin:"Sit up. Drink water. Shoes on." },
      { time:"05:45",       type:"wildcard",   label:"Leave for Gym B",                     detail:"15 min drive.", twoMin:null },
      { time:"06:00-06:35", type:"swim",       label:"Swim - Gym B",                        detail:"30-35 min. Drive straight to hospital after.", twoMin:"Get in the pool and do 2 laps." },
      { time:"06:35-08:00", type:"wildcard",   label:"Shower at Gym B - Drive to hospital", detail:"Arrive by 08:00.", twoMin:null },
      { time:"~14:00-14:30",type:"decompress", label:"Home - Lunch - Decompress",           detail:"Post-OR decompression. Important today.", twoMin:"5 minutes sitting in silence." },
      { time:"14:30-15:00", type:"vmo",        label:"VMO workout (12 min)",                detail:"Second VMO session of the week. HR fully normalized. Deep VMO squats + split squat. <a href='https://www.youtube.com/watch?v=bf18YHxDvME' target='_blank' style='color:#a855f7'>▶ VMO Exercises</a>", twoMin:"1 set of 10 deep VMO squats. One minute total." },
      { time:"15:00-17:30", type:"trading",    label:"Trading deep work",                   detail:"Primary focus block.", twoMin:"Open the journal and write today's date + one market observation." },
      { time:"17:30-18:00", type:"wildcard",   label:"Transition - get ready for gym",      detail:"Wildcard buffer.", twoMin:null },
      { time:"18:00-19:30", type:"gym_push",   label:"Gym A with wife - Push",              detail:"Second Push session. Dumbbell press, incline press, lateral raises, tricep pushdowns.", twoMin:"5 sets of push-ups to failure at home.", isGymSubstitute:true, substituteLabel:"Home substitute: Dumbbell Push Day (see Workouts tab)" },
      { time:"19:30-21:30", type:"sacred",     label:"Evening with wife",                   detail:"Non-negotiable.", twoMin:null },
      { time:"21:00",       type:"wildcard",   label:"Phone docked",                        detail:"No screens after this point.", twoMin:null },
      { time:"21:45",       type:"mobility",   label:"Bedtime mobility (5 min)",            detail:"Full routine. <a href='https://www.youtube.com/shorts/zQkpBdfQt9g' target='_blank' style='color:#a855f7'>&#9654; Night Stretches</a>", twoMin:"Just do the spine rotations for 30 seconds." },
      { time:"22:00-22:30", type:"sleep",      label:"Lights out",                          detail:"7-7.5h sleep window.", twoMin:null },
    ]
  },
  Friday: {
    type:"OR Day", subtitle:"Drive from Gym B straight to hospital - Arrive by 08:00",
    blocks:[
      { time:"05:00-05:30", type:"wildcard",   label:"Wake up - Morning prep",              detail:"Drive straight to hospital after swim.", twoMin:"Sit up. Drink water. Shoes on." },
      { time:"05:45",       type:"wildcard",   label:"Leave for Gym B",                     detail:"15 min drive.", twoMin:null },
      { time:"06:00-06:35", type:"swim",       label:"Swim - Gym B",                        detail:"30-35 min. Drive straight to hospital after.", twoMin:"Get in the pool and do 2 laps." },
      { time:"06:35-08:00", type:"wildcard",   label:"Shower at Gym B - Drive to hospital", detail:"Arrive by 08:00.", twoMin:null },
      { time:"~14:00-14:30",type:"decompress", label:"Home - Lunch - Decompress",           detail:"End of work week. Full decompression.", twoMin:"5 minutes sitting in silence." },
      { time:"14:30-17:30", type:"trading",    label:"Trading deep work",                   detail:"End-of-week review + setups for next week.", twoMin:"Open the journal and write one line about this week's trades." },
      { time:"17:30-18:00", type:"wildcard",   label:"Transition - get ready for gym",      detail:"Wildcard buffer.", twoMin:null },
      { time:"18:00-19:30", type:"gym_pull",   label:"Gym A with wife - Pull",              detail:"Second Pull session. Deadlift, pull-ups or assisted, seated row, face pulls.", twoMin:"3 sets of DB rows at home.", isGymSubstitute:true, substituteLabel:"Home substitute: Dumbbell Pull Day (see Workouts tab)" },
      { time:"19:30-21:30", type:"sacred",     label:"Evening with wife",                   detail:"Non-negotiable. Start of weekend together.", twoMin:null },
      { time:"21:00",       type:"wildcard",   label:"Phone docked",                        detail:"No screens after this point.", twoMin:null },
      { time:"21:45",       type:"mobility",   label:"Bedtime mobility (5 min)",            detail:"Full routine. <a href='https://www.youtube.com/shorts/zQkpBdfQt9g' target='_blank' style='color:#a855f7'>&#9654; Night Stretches</a>", twoMin:"Just do the spine rotations for 30 seconds." },
      { time:"22:00-22:30", type:"sleep",      label:"Lights out",                          detail:"7-7.5h sleep window.", twoMin:null },
    ]
  },
  Saturday: {
    type:"Free Day", subtitle:"Longest uninterrupted blocks - protect them",
    blocks:[
      { time:"05:00-05:30", type:"wildcard",   label:"Wake up - Morning prep",              detail:"Flexible this morning.", twoMin:"Sit up. Drink water. Shoes on." },
      { time:"05:45",       type:"wildcard",   label:"Leave for gym",                       detail:"Gym B or Gym A - your choice.", twoMin:null },
      { time:"06:00-06:35", type:"swim",       label:"Swim - Gym B or Gym A",               detail:"Flexible - whichever gym suits the morning.", twoMin:"Get in the pool and do 2 laps." },
      { time:"06:35-07:30", type:"fullbody",   label:"Full body + Core circuit (35-40 min)",detail:"At home after shower. 3-5 rounds: 20 squats, 20 lunges, 10 push-ups, 20 supermans, 10 plank kickthroughs, 10 body saw planks. Then 2-3 rounds core. <a href='https://www.youtube.com/shorts/Z4Aqs-rZ__g' target='_blank' style='color:#22c55e'>▶ Full Body</a> · <a href='https://www.youtube.com/shorts/I3iNE5RpMZI' target='_blank' style='color:#22c55e'>▶ Core</a>", twoMin:"10 squats + 5 push-ups. One minute. Done." },
      { time:"07:30-09:00", type:"wildcard",   label:"Wildcard - breakfast, errands",       detail:"Free block. No obligations.", twoMin:null },
      { time:"09:00-12:00", type:"trading",    label:"Trading deep work",                   detail:"Best uninterrupted block of the week. Strategy review, backtesting, system building.", twoMin:"Open the trading journal and write one thing you want to work on today." },
      { time:"12:00-13:00", type:"wildcard",   label:"CAD / patent follow-up (hard cap 1h)",detail:"Only if patents require action. Otherwise free time.", twoMin:null },
      { time:"13:00-18:00", type:"wildcard",   label:"Afternoon free - personal plans",     detail:"Full wildcard. Rest, errands, personal plans.", twoMin:null },
      { time:"18:00-19:30", type:"gym_legs",   label:"Gym A with wife - Legs",              detail:"Second Legs session. Split squats, leg curl, hip thrust, calf raises.", twoMin:"3 sets of DB goblet squats at home.", isGymSubstitute:true, substituteLabel:"Home substitute: Dumbbell Legs Day (see Workouts tab)" },
      { time:"19:30-21:30", type:"sacred",     label:"Evening with wife",                   detail:"Non-negotiable.", twoMin:null },
      { time:"21:00",       type:"wildcard",   label:"Phone docked",                        detail:"No screens after this point.", twoMin:null },
      { time:"21:45",       type:"mobility",   label:"Bedtime mobility (5 min)",            detail:"Full routine. <a href='https://www.youtube.com/shorts/zQkpBdfQt9g' target='_blank' style='color:#a855f7'>&#9654; Night Stretches</a>", twoMin:"Just do the spine rotations for 30 seconds." },
      { time:"22:00-22:30", type:"sleep",      label:"Lights out",                          detail:"7-7.5h sleep window.", twoMin:null },
    ]
  },
  Sunday: {
    type:"Recovery Day", subtitle:"Light movement - Weekly review - Rest",
    blocks:[
      { time:"05:00-05:30", type:"wildcard",   label:"Wake up - gentle start",              detail:"Recovery day. No pressure.", twoMin:"Sit up. Drink water. No rush." },
      { time:"05:45",       type:"wildcard",   label:"Leave for gym",                       detail:"Easy recovery swim today.", twoMin:null },
      { time:"06:00-06:35", type:"swim",       label:"Swim - Gym B or Gym A",               detail:"Keep it genuinely easy. Lower intensity, no pushing. Recovery swim.", twoMin:"Get in and do a few easy laps. Still counts." },
      { time:"07:00-07:45", type:"walk",       label:"Walk outside (30-45 min)",            detail:"Fresh air, no intensity. Mental recovery as much as physical.", twoMin:"Walk to the end of the street and back. 5 minutes of fresh air." },
      { time:"08:00-09:00", type:"wildcard",   label:"Wildcard - breakfast, personal time", detail:"Free block.", twoMin:null },
      { time:"09:00-10:30", type:"review",     label:"Weekly review",                       detail:"Trading journal review. Quest XP update. Schedule audit. Identity check: what evidence did I generate this week?", twoMin:"Write one sentence: what was the best thing you did this week?" },
      { time:"10:30-12:00", type:"learning",   label:"Learning block",                      detail:"Trading education, medical reading, 3D Slicer, NixOS - whatever pulls you.", twoMin:"Read one page of anything." },
      { time:"12:00-18:00", type:"wildcard",   label:"Afternoon free - full wildcard",      detail:"Rest, personal plans, family. Real recovery.", twoMin:null },
      { time:"18:00-19:30", type:"gym_light",  label:"Gym A with wife - Light cardio",      detail:"Wife sets the pace. Indoor bike, treadmill, machines. No intensity targets. Couple time.", twoMin:"Walk side by side on treadmills for 20 minutes.", isGymSubstitute:true, substituteLabel:"Skip entirely if body needs it - true rest day option" },
      { time:"19:30-21:30", type:"sacred",     label:"Evening with wife",                   detail:"Non-negotiable.", twoMin:null },
      { time:"21:00",       type:"wildcard",   label:"Phone docked",                        detail:"No screens after this point.", twoMin:null },
      { time:"21:45",       type:"mobility",   label:"Bedtime mobility (5 min)",            detail:"Full routine. <a href='https://www.youtube.com/shorts/zQkpBdfQt9g' target='_blank' style='color:#a855f7'>&#9654; Night Stretches</a>", twoMin:"Just do the spine rotations for 30 seconds." },
      { time:"22:00-22:30", type:"sleep",      label:"Lights out",                          detail:"7-7.5h sleep window.", twoMin:null },
    ]
  },
};

const STATUS_STYLE = {
  Active:    { bg:"rgba(34,197,94,0.15)",   color:"#22c55e", dot:"#22c55e" },
  Pending:   { bg:"rgba(100,116,139,0.15)", color:"#94a3b8", dot:"#64748b" },
  Completed: { bg:"rgba(59,130,246,0.15)",  color:"#3b82f6", dot:"#3b82f6" },
};
const DIFF_STYLE = {
  "Trivial":   { color:"#64748b", bg:"rgba(100,116,139,0.15)" },
  "Easy":      { color:"#22c55e", bg:"rgba(34,197,94,0.12)" },
  "Medium":    { color:"#3b82f6", bg:"rgba(59,130,246,0.12)" },
  "Hard":      { color:"#f59e0b", bg:"rgba(245,158,11,0.12)" },
  "Very Hard": { color:"#ef4444", bg:"rgba(239,68,68,0.12)" },
  "Legendary": { color:"#a855f7", bg:"rgba(168,85,247,0.12)" },
};
const NAV = [
  { id:"identity",   icon:"◈", label:"Identity" },
  { id:"habits",     icon:"⊕", label:"Atomic Habits" },
  { id:"outputs",    icon:"◎", label:"6-Month Outputs" },
  { id:"schedule",   icon:"▦", label:"Schedule" },
  { id:"quests",     icon:"⬡", label:"Quest Board" },
  { id:"review",     icon:"↻", label:"Review Cadence" },
  { id:"principles", icon:"≡", label:"Principles" },
  { id:"workouts",   icon:"▶", label:"Workouts" },
];

function getLevel(xp) {
  for (let i=LEVELS.length-1;i>=0;i--) if (xp>=LEVELS[i].min) return {...LEVELS[i],index:i};
  return {...LEVELS[0],index:0};
}
function getLevelProgress(xp) {
  const l=getLevel(xp),n=LEVELS[l.index+1];
  if (!n) return 100;
  return Math.round(((xp-l.min)/(n.min-l.min))*100);
}
function uid() { return "q"+Date.now()+Math.random().toString(36).slice(2,7); }

const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:#060c18;color:#e2e8f0;font-family:'DM Sans',sans-serif}
.shell{display:flex;min-height:100vh}
.sidebar{width:210px;background:#0a1120;border-right:1px solid #1e2d40;padding:26px 0 16px;position:sticky;top:0;height:100vh;overflow-y:auto;flex-shrink:0;display:flex;flex-direction:column}
.logo{padding:0 16px 22px;border-bottom:1px solid #1e2d40;margin-bottom:14px}
.logo-t{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:2px;line-height:1.1}
.logo-s{font-size:10px;color:#475569;font-family:'JetBrains Mono',monospace;letter-spacing:1px;margin-top:3px}
.nav-s{padding:12px 16px 4px;font-size:10px;color:#334155;letter-spacing:2px;font-family:'JetBrains Mono',monospace}
.nav-i{display:flex;align-items:center;gap:8px;padding:8px 16px;cursor:pointer;font-size:12px;font-weight:500;color:#64748b;border-left:3px solid transparent;transition:all 0.15s;user-select:none}
.nav-i:hover{color:#94a3b8;background:rgba(255,255,255,0.03)}
.nav-i.active{color:#e2e8f0;border-left-color:#3b82f6;background:rgba(59,130,246,0.08)}
.main{flex:1;padding:32px 40px;max-width:920px}
.pg-title{font-family:'Bebas Neue',sans-serif;font-size:40px;letter-spacing:3px;margin-bottom:5px}
.pg-sub{font-size:13px;color:#475569;margin-bottom:28px}
.xp-card{background:#0a1120;border:1px solid #1e2d40;border-radius:12px;padding:16px 20px;margin-bottom:28px;display:flex;align-items:center;gap:22px}
.xp-lv{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px;color:#3b82f6}
.xp-n{font-family:'JetBrains Mono',monospace;font-size:11px;color:#64748b;margin-top:2px}
.xp-w{flex:1}
.xp-bg{height:5px;background:#1e2d40;border-radius:99px;overflow:hidden}
.xp-f{height:100%;background:linear-gradient(90deg,#3b82f6,#60a5fa);border-radius:99px;transition:width 0.6s}
.card{background:#0a1120;border:1px solid #1e2d40;border-radius:12px;padding:20px;margin-bottom:16px}
.card-t{font-size:10px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin-bottom:13px;font-family:'JetBrains Mono',monospace}
.callout{border-radius:8px;padding:13px 16px;margin-bottom:16px;border-left:3px solid}
.cn{background:rgba(15,30,60,0.6);border-color:#3b82f6}
.cg{background:rgba(40,28,8,0.7);border-color:#f59e0b}
.ct{font-size:13px;line-height:1.7;color:#cbd5e1}
.ct strong{color:#e2e8f0}
.day-tabs{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:16px}
.day-tab{padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;border:1px solid #1e2d40;background:transparent;color:#64748b;transition:all 0.15s;user-select:none}
.day-tab:hover{border-color:#3b82f6;color:#93c5fd}
.day-tab.active{background:rgba(59,130,246,0.15);border-color:#3b82f6;color:#93c5fd}
.day-type{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;color:#3b82f6;margin-bottom:3px}
.day-sub{font-size:12px;color:#475569;margin-bottom:12px;font-style:italic}
.blk{border-radius:7px;border:1px solid;margin-bottom:3px;overflow:hidden;transition:filter 0.15s}
.blk.ck{cursor:pointer}
.blk.ck:hover{filter:brightness(1.09)}
.blk-m{display:flex;align-items:center}
.blk-t{width:125px;flex-shrink:0;padding:8px 10px;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;border-right:1px solid rgba(255,255,255,0.06)}
.blk-c{padding:8px 12px;flex:1}
.blk-l{font-size:12px;font-weight:500}
.blk-b{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;margin-left:6px;opacity:0.7}
.blk-a{padding:0 10px;font-size:10px;color:#475569;transition:transform 0.2s;flex-shrink:0}
.blk-a.open{transform:rotate(180deg)}
.blk-d{border-top:1px solid rgba(255,255,255,0.06);padding:10px 12px}
.det{font-size:12px;color:#94a3b8;line-height:1.6;margin-bottom:8px}
.tm{background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.3);border-radius:5px;padding:7px 10px;display:flex;gap:8px;align-items:flex-start}
.tm-l{font-family:'JetBrains Mono',monospace;font-size:9px;color:#a855f7;letter-spacing:1px;flex-shrink:0;margin-top:2px}
.tm-t{font-size:12px;color:#d8b4fe;line-height:1.5;font-style:italic}
.sub{background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:5px;padding:7px 10px;display:flex;gap:8px;align-items:flex-start;margin-top:6px}
.sub-l{font-family:'JetBrains Mono',monospace;font-size:9px;color:#f59e0b;letter-spacing:1px;flex-shrink:0;margin-top:2px}
.sub-t{font-size:12px;color:#fcd34d;line-height:1.5}
.leg{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
.leg-i{display:flex;align-items:center;gap:4px;font-size:10px;color:#475569}
.leg-d{width:6px;height:6px;border-radius:2px;flex-shrink:0}
.tbl{width:100%;border-collapse:collapse;font-size:12px}
.tbl th{background:#0d1b30;padding:8px 12px;text-align:left;font-size:10px;letter-spacing:1.5px;color:#475569;font-family:'JetBrains Mono',monospace;border-bottom:1px solid #1e2d40}
.tbl td{padding:9px 12px;border-bottom:1px solid #111827;font-size:12px;line-height:1.5}
.tbl tr:last-child td{border-bottom:none}
.old{color:#f87171}.nw{color:#4ade80}
.bld{color:#4ade80;font-weight:600}.brk{color:#f87171;font-weight:600}
.law-n{font-family:'JetBrains Mono',monospace;font-weight:600;color:#3b82f6}
.frow{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;align-items:center}
.chip{padding:4px 12px;border-radius:99px;border:1px solid #1e2d40;font-size:11px;cursor:pointer;color:#64748b;transition:all 0.15s;user-select:none}
.chip:hover{border-color:#3b82f6;color:#93c5fd}
.chip.active{background:rgba(59,130,246,0.15);border-color:#3b82f6;color:#93c5fd}
.chip.dc{border-color:#a855f7;color:#a855f7}
.chip.dc.active{background:rgba(168,85,247,0.15);border-color:#a855f7;color:#d8b4fe}
.cat-sec{margin-bottom:28px}
.cat-hdr{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}
.cat-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.cat-nm{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px}
.cat-xp{font-family:'JetBrains Mono',monospace;font-size:10px;padding:2px 8px;border-radius:99px;border:1px solid}
.quest{background:#0a1120;border:1px solid #1e2d40;border-radius:7px;padding:11px 13px;display:flex;align-items:flex-start;gap:11px;margin-bottom:4px;transition:border-color 0.15s}
.quest:hover{border-color:#2d3f56}
.quest.done{opacity:0.45}
.qchk{width:16px;height:16px;border-radius:3px;border:2px solid #1e2d40;flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s;font-size:10px;font-weight:700;color:white}
.qb{flex:1;min-width:0}
.qt{font-size:12px;color:#e2e8f0;line-height:1.4}
.qt.done{text-decoration:line-through;color:#475569}
.qm{display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap}
.qxp{font-family:'JetBrains Mono',monospace;font-size:10px;color:#3b82f6}
.qst{font-size:10px;padding:2px 6px;border-radius:99px;font-family:'JetBrains Mono',monospace;font-weight:600;display:flex;align-items:center;gap:3px}
.qnt{font-size:10px;color:#475569;margin-top:3px;font-style:italic}
.qac{display:flex;gap:4px;flex-shrink:0;opacity:0;transition:opacity 0.15s}
.quest:hover .qac{opacity:1}
.bi{width:24px;height:24px;border-radius:5px;border:1px solid #1e2d40;background:transparent;cursor:pointer;color:#64748b;display:flex;align-items:center;justify-content:center;font-size:11px;transition:all 0.15s}
.bi:hover{border-color:#3b82f6;color:#93c5fd;background:rgba(59,130,246,0.1)}
.bi.del:hover{border-color:#ef4444;color:#f87171;background:rgba(239,68,68,0.1)}
.btn-add{width:100%;padding:8px;border-radius:6px;border:1px dashed #1e2d40;background:transparent;cursor:pointer;color:#475569;font-size:12px;font-family:'DM Sans',sans-serif;transition:all 0.15s;margin-top:3px}
.btn-add:hover{border-color:#3b82f6;color:#3b82f6;background:rgba(59,130,246,0.05)}
.dq{background:#0a1120;border:1px solid #1e2d40;border-radius:7px;padding:11px 13px;display:flex;align-items:center;gap:11px;margin-bottom:4px;transition:border-color 0.15s}
.dq:hover{border-color:#2d3f56}
.dq.done{opacity:0.45}
.di{flex:1;min-width:0}
.dt{font-size:12px;color:#e2e8f0;line-height:1.4}
.dt.done{text-decoration:line-through;color:#475569}
.dm{display:flex;align-items:center;gap:7px;margin-top:4px;flex-wrap:wrap}
.sb{display:flex;align-items:center;gap:3px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600}
.mb{font-family:'JetBrains Mono',monospace;font-size:10px;padding:1px 6px;border-radius:99px;font-weight:700}
.dn{font-size:10px;color:#475569;font-style:italic}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px}
.modal{background:#0d1829;border:1px solid #1e2d40;border-radius:12px;padding:24px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto}
.mt{font-family:'Bebas Neue',sans-serif;font-size:21px;letter-spacing:2px;margin-bottom:16px}
.fg{margin-bottom:13px}
.fl{font-size:10px;color:#64748b;letter-spacing:1.5px;font-family:'JetBrains Mono',monospace;display:block;margin-bottom:5px}
.fi,.fsel,.fta{width:100%;background:#060c18;border:1px solid #1e2d40;border-radius:6px;padding:8px 10px;color:#e2e8f0;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color 0.15s}
.fi:focus,.fsel:focus,.fta:focus{border-color:#3b82f6}
.fsel option{background:#0d1829}
.fta{resize:vertical;min-height:64px}
.mf{display:flex;gap:8px;justify-content:flex-end;margin-top:20px}
.bp{padding:8px 16px;border-radius:6px;background:#3b82f6;color:white;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;transition:background 0.15s}
.bp:hover{background:#2563eb}
.bp:disabled{opacity:0.4;cursor:not-allowed}
.bs{padding:8px 16px;border-radius:6px;background:transparent;color:#64748b;border:1px solid #1e2d40;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:all 0.15s}
.bs:hover{border-color:#3b82f6;color:#93c5fd}
.ass{background:rgba(59,130,246,0.06);border:1px solid #1e2d40;border-radius:6px;padding:12px 13px;margin-bottom:13px}
.ash{display:flex;align-items:center;margin-bottom:8px}
.asl{font-size:10px;color:#475569;font-family:'JetBrains Mono',monospace;letter-spacing:1px}
.bc{font-size:10px;color:#3b82f6;background:rgba(59,130,246,0.1);border:1px solid #3b82f6;border-radius:3px;padding:2px 8px;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all 0.15s;margin-left:auto}
.bc:hover{background:rgba(59,130,246,0.2)}
.bc.cp{color:#22c55e;border-color:#22c55e;background:rgba(34,197,94,0.1)}
.pp{background:#060c18;border:1px solid #1e2d40;border-radius:5px;padding:8px 10px;font-size:10px;color:#475569;font-family:'JetBrains Mono',monospace;line-height:1.5;margin-bottom:7px;white-space:pre-wrap;word-break:break-word}
.oc{background:#0a1120;border:1px solid #1e2d40;border-radius:9px;padding:14px 16px;margin-bottom:9px;display:flex;align-items:flex-start;gap:13px}
.on{font-family:'Bebas Neue',sans-serif;font-size:28px;color:#1e2d40;flex-shrink:0;width:32px;text-align:center}
.ot{font-size:14px;font-weight:600;color:#e2e8f0;margin-bottom:3px}
.od{font-size:12px;color:#64748b;line-height:1.5}
.op{font-size:10px;padding:2px 8px;border-radius:99px;font-family:'JetBrains Mono',monospace;font-weight:600;margin-left:auto;flex-shrink:0;white-space:nowrap}
.pr{margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #111827}
.pr:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.pt{font-family:'Bebas Neue',sans-serif;font-size:19px;letter-spacing:2px;color:#3b82f6;margin-bottom:6px}
.pd{font-size:13px;color:#94a3b8;line-height:1.7}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:#060c18}
::-webkit-scrollbar-thumb{background:#1e2d40;border-radius:99px}
@keyframes fs{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.fi-anim{animation:fs 0.2s ease forwards}
`;

export default function App({user}) {
  const [page,setPage]=useState("identity");
  const [longQ,setLongQ]=useState(DEFAULT_LONG);
  const [dailyQ,setDailyQ]=useState(DEFAULT_DAILY);
  const [cumulativeDailyXP,setCumulativeDailyXP]=useState(0);
  const [modal,setModal]=useState(null);
  const [schedDay,setSchedDay]=useState("Monday");
  const [filter,setFilter]=useState("All");

  const userDoc = doc(db, "users", user.uid);

  useEffect(()=>{
    // Read localStorage first (synchronous, fast)
    let seedLong=DEFAULT_LONG, seedDaily=DEFAULT_DAILY, seedCdxp=0;
    try{
      const lr=localStorage.getItem("la_long_v8"); if(lr)seedLong=JSON.parse(lr);
      const dr=localStorage.getItem("la_daily_v8");if(dr)seedDaily=JSON.parse(dr);
      const cr=localStorage.getItem("la_cdxp_v8"); if(cr)seedCdxp=JSON.parse(cr);
    }catch(_){}
    setLongQ(seedLong);
    setDailyQ(seedDaily);
    setCumulativeDailyXP(seedCdxp);

    // Then sync with Firestore
    getDoc(userDoc).then(snap=>{
      if(snap.exists()){
        // Existing account — Firestore is authoritative
        const d=snap.data();
        if(d.longQ) setLongQ(d.longQ);
        if(d.dailyQ)setDailyQ(d.dailyQ);
        if(d.cumulativeDailyXP!=null)setCumulativeDailyXP(d.cumulativeDailyXP);
      } else {
        // First login — seed Firestore with local data (pre-built defaults or prior localStorage progress)
        setDoc(userDoc,{longQ:seedLong,dailyQ:seedDaily,cumulativeDailyXP:seedCdxp}).catch(()=>{});
      }
    }).catch(()=>{});
  },[user.uid]);// eslint-disable-line react-hooks/exhaustive-deps

  const saveLong=(q)=>{
    setLongQ(q);
    try{localStorage.setItem("la_long_v8",JSON.stringify(q));}catch(_){}
    setDoc(userDoc,{longQ:q},{merge:true}).catch(()=>{});
  };
  const saveDaily=(q)=>{
    setDailyQ(q);
    try{localStorage.setItem("la_daily_v8",JSON.stringify(q));}catch(_){}
    setDoc(userDoc,{dailyQ:q},{merge:true}).catch(()=>{});
  };
  const saveCumulativeDailyXP=(xp)=>{
    setCumulativeDailyXP(xp);
    try{localStorage.setItem("la_cdxp_v8",JSON.stringify(xp));}catch(_){}
    setDoc(userDoc,{cumulativeDailyXP:xp},{merge:true}).catch(()=>{});
  };

  const today=todayKey();
  const longXP=longQ.filter(q=>q.status==="Completed").reduce((s,q)=>s+q.xp,0);
  const dailyXP=dailyQ.reduce((s,q)=>{if(q.lastDone!==today)return s;return s+Math.round(q.baseXp*STREAK_MULT(q.streak));},0);
  const totalXP=longXP+cumulativeDailyXP;
  const level=getLevel(totalXP);
  const progress=getLevelProgress(totalXP);

  const onLongSave=(data)=>{
    if(modal.mode==="add")saveLong([...longQ,{id:uid(),status:"Active",...data}]);
    else saveLong(longQ.map(q=>q.id===modal.quest.id?{...q,...data}:q));
    setModal(null);
  };
  const delLong=(id)=>saveLong(longQ.filter(q=>q.id!==id));
  const toggleLong=(id)=>saveLong(longQ.map(q=>q.id===id?{...q,status:q.status==="Completed"?"Active":"Completed"}:q));
  const toggleDaily=(id)=>{
    const t=todayKey();
    let xpDelta=0;
    const newQ=dailyQ.map(q=>{
      if(q.id!==id)return q;
      if(q.lastDone===t){
        xpDelta=-Math.round(q.baseXp*STREAK_MULT(q.streak));
        return{...q,lastDone:"",streak:Math.max(0,q.streak-1)};
      }
      const yest=new Date();yest.setDate(yest.getDate()-1);
      const yk=yest.toISOString().slice(0,10);
      const newStreak=q.lastDone===yk?q.streak+1:1;
      xpDelta=Math.round(q.baseXp*STREAK_MULT(newStreak));
      return{...q,lastDone:t,streak:newStreak};
    });
    saveDaily(newQ);
    saveCumulativeDailyXP(cumulativeDailyXP+xpDelta);
  };
  const fq=(cat)=>longQ.filter(q=>q.category===cat).filter(q=>filter==="All"||q.status===filter);

  return(
    <>
      <style>{css}</style>
      <div className="shell">
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-t">LIFE<br/>ARCHITECTURE</div>
            <div className="logo-s">v8 · 2026</div>
          </div>
          <div className="nav-s">SECTIONS</div>
          {NAV.map(n=>(
            <div key={n.id} className={"nav-i"+(page===n.id?" active":"")} onClick={()=>setPage(n.id)}>
              <span style={{fontSize:13}}>{n.icon}</span>{n.label}
            </div>
          ))}
          <div style={{marginTop:"auto",padding:"16px 16px 0",borderTop:"1px solid #1e2d40"}}>
            <div style={{fontSize:10,color:"#334155",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
            <button onClick={()=>signOut(auth)} style={{width:"100%",background:"transparent",border:"1px solid #1e2d40",borderRadius:6,color:"#475569",fontSize:11,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,padding:"7px 0",cursor:"pointer"}}>SIGN OUT</button>
          </div>
        </aside>
        <main className="main">
          <div className="xp-card">
            <div>
              <div className="xp-lv">{level.name}</div>
              <div className="xp-n">{totalXP.toLocaleString()} XP total</div>
            </div>
            <div className="xp-w">
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:"#475569"}}>Level {level.index+1}</span>
                <span style={{fontSize:10,color:"#3b82f6",fontFamily:"JetBrains Mono"}}>{progress}%</span>
              </div>
              <div className="xp-bg"><div className="xp-f" style={{width:progress+"%"}}/></div>
              {level.index<LEVELS.length-1&&(
                <div style={{fontSize:10,color:"#334155",marginTop:3,fontFamily:"JetBrains Mono"}}>
                  Next: {LEVELS[level.index+1].name} @ {LEVELS[level.index+1].min.toLocaleString()} XP
                </div>
              )}
            </div>
          </div>
          <div className="fi-anim" key={page}>
            {page==="identity"&&<PIdentity/>}
            {page==="habits"&&<PHabits/>}
            {page==="outputs"&&<POutputs/>}
            {page==="schedule"&&<PSchedule schedDay={schedDay} setSchedDay={setSchedDay}/>}
            {page==="quests"&&<PQuests longQ={longQ} dailyQ={dailyQ} filter={filter} setFilter={setFilter} fq={fq} openAdd={cat=>setModal({mode:"add",category:cat})} openEdit={q=>setModal({mode:"edit",quest:q})} delLong={delLong} toggleLong={toggleLong} toggleDaily={toggleDaily}/>}
            {page==="review"&&<PReview/>}
            {page==="principles"&&<PPrinciples/>}
            {page==="workouts"&&<PWorkouts/>}
          </div>
        </main>
      </div>
      {modal&&<QModal modal={modal} onSave={onLongSave} onClose={()=>setModal(null)}/>}
    </>
  );
}

function Blk({b}){
  const[open,setOpen]=useState(false);
  const m=BLOCK_META[b.type]||BLOCK_META.wildcard;
  const inter=!!(b.detail||b.twoMin);
  return(
    <div className={"blk"+(inter?" ck":"")} style={{borderColor:m.color+"55",background:m.bg,opacity:b.type==="wildcard"?0.5:1}} onClick={()=>inter&&setOpen(o=>!o)}>
      <div className="blk-m">
        <div className="blk-t" style={{color:m.color}}>{b.time}</div>
        <div className="blk-c">
          <span className="blk-l" style={{color:b.type==="wildcard"?"#475569":"#e2e8f0"}}>{b.label}</span>
          <span className="blk-b" style={{color:m.color}}>{m.label}</span>
        </div>
        {inter&&<div className={"blk-a"+(open?" open":"")}>▾</div>}
      </div>
      {open&&(
        <div className="blk-d">
          {b.detail&&<div className="det" dangerouslySetInnerHTML={{__html:b.detail}}/>}
          {b.twoMin&&<div className="tm"><span className="tm-l">2 MIN</span><span className="tm-t">{b.twoMin}</span></div>}
          {b.isGymSubstitute&&b.substituteLabel&&<div className="sub"><span className="sub-l">SUB</span><span className="sub-t">{b.substituteLabel}</span></div>}
        </div>
      )}
    </div>
  );
}

function PIdentity(){
  return(
    <>
      <div className="pg-title">IDENTITY</div>
      <div className="pg-sub">Who you are becoming, not what you want to achieve</div>
      <div className="callout cg"><div className="ct"><strong>Core Belief: </strong>"You do not rise to the level of your goals. You fall to the level of your systems." — James Clear</div></div>
      <div className="card">
        <div className="card-t">Identity Statement</div>
        <p style={{fontSize:14,fontWeight:600,color:"#e2e8f0",lineHeight:1.7}}>I am a disciplined, high-performing surgeon and systematic trader who protects my health, builds wealth with intention, and creates with precision.</p>
      </div>
      <div className="card">
        <div className="card-t">Four Pillars</div>
        {[["Surgeon","Clinical excellence, continuous learning, evidence-based decisions"],["Trader","Systematic, data-driven, emotionally regulated — compounding edge over time"],["Builder","CAD patents complete; technical skill applied selectively and with purpose"],["Partner","Uninterrupted evening time with wife is a non-negotiable boundary"]].map(([t,d])=>(
          <div key={t} style={{display:"flex",gap:12,marginBottom:12,alignItems:"flex-start"}}>
            <span style={{fontFamily:"Bebas Neue",fontSize:12,letterSpacing:2,color:"#3b82f6",width:64,flexShrink:0,paddingTop:2}}>{t}</span>
            <span style={{fontSize:12,color:"#94a3b8",lineHeight:1.6}}>{d}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-t">Identity Shift</div>
        <table className="tbl">
          <thead><tr><th>OLD (Reactive)</th><th>NEW (Intentional)</th></tr></thead>
          <tbody>
            {[["Inconsistent sleep, drifting bedtime","Lights out by 22:30 — non-negotiable"],["Scrolling instead of doing","Phone docked at 21:00; evenings protected"],["Trading without priority","Trading is primary — prime blocks every day"],["Exercise when motivation strikes","Daily swim is a fixed anchor — it just happens"],["Procrastinating on deep work","Calendar blocks are sacred commitments"]].map(([o,n],i)=><tr key={i}><td className="old">{o}</td><td className="nw">{n}</td></tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PHabits(){
  return(
    <>
      <div className="pg-title">ATOMIC HABITS</div>
      <div className="pg-sub">The framework powering the entire system</div>
      <div className="card">
        <div className="card-t">The Four Laws</div>
        <table className="tbl">
          <thead><tr><th>LAW</th><th>CUE</th><th>BUILD</th><th>BREAK</th></tr></thead>
          <tbody>
            {[["1st","Cue","Obvious","Invisible"],["2nd","Craving","Attractive","Unattractive"],["3rd","Response","Easy","Difficult"],["4th","Reward","Satisfying","Unsatisfying"]].map(([l,c,b,r])=>(
              <tr key={l}><td><span className="law-n">{l} Law</span></td><td style={{color:"#94a3b8"}}>{c}</td><td><span className="bld">{b}</span></td><td><span className="brk">{r}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <div className="card-t">Habit Stacking</div>
        <div className="callout cg" style={{marginBottom:12}}><div className="ct"><em>"After I [CURRENT HABIT], I will [NEW HABIT]."</em></div></div>
        {["After I get out of the pool: shower, drive home, eat — no workout until HR normalizes","After I arrive home from clinic: 5 min decompress, then VMO on Mon/Thu","After I sit at my trading desk: open journal and write date + one observation first","After I pack my gym bag: I am already going — no decision needed","After I get into bed: phone stays on the dock; no exceptions"].map((s,i)=>(
          <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
            <span style={{color:"#3b82f6",fontFamily:"JetBrains Mono",fontSize:11,marginTop:2,flexShrink:0}}>→</span>
            <span style={{fontSize:12,color:"#94a3b8",lineHeight:1.6}}>{s}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-t">The 2-Minute Rule</div>
        <p style={{fontSize:12,color:"#94a3b8",lineHeight:1.7,marginBottom:12}}>Every block in the schedule has a 2-minute version. Tap any block to see it. The goal is never to skip — it is to downgrade.</p>
        <div className="tm"><span className="tm-l">RULE</span><span className="tm-t">"Never miss twice. If you cannot do the full thing, do the 2-minute version. Showing up in reduced form is infinitely better than not showing up at all."</span></div>
      </div>
      <div className="card">
        <div className="card-t">Streak Multipliers</div>
        <p style={{fontSize:12,color:"#94a3b8",lineHeight:1.6,marginBottom:12}}>Daily quests compound over time. Consecutive days multiply your XP reward.</p>
        {[[0,"6 days","1x","#64748b","Base XP"],[7,"13 days","1.5x","#f59e0b","Good momentum"],[14,"29 days","2x","#ef4444","Strong habit"],[30,"+ days","3x","#a855f7","Identity locked"]].map(([a,b,mult,col,desc])=>(
          <div key={mult} style={{display:"flex",gap:10,alignItems:"center",marginBottom:7}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:"#475569",width:55,flexShrink:0}}>{a}-{b}</span>
            <span style={{fontFamily:"JetBrains Mono",fontSize:13,fontWeight:700,color:col,width:34}}>{mult}</span>
            <span style={{fontSize:12,color:"#64748b"}}>{desc}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-t">Environment Design</div>
        {["Gym bag pre-packed the night before — removes all morning decision fatigue","TradingView always open on second monitor — seeing it creates the cue","Phone dock in hallway by 21:00 — physical distance reduces the pull","Yoga mat visible in the bedroom — bedtime mobility happens because it is already there","CAD software closed unless explicitly needed — out of sight, not a default pull"].map((s,i)=>(
          <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
            <span style={{color:"#f59e0b",fontSize:11,marginTop:2,flexShrink:0}}>◆</span>
            <span style={{fontSize:12,color:"#94a3b8",lineHeight:1.6}}>{s}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function POutputs(){
  return(
    <>
      <div className="pg-title">6-MONTH OUTPUTS</div>
      <div className="pg-sub">Concrete evidence the system is working</div>
      {[
        {num:"01",title:"Documented Trading System",done:"Written rules for entries, exits, position sizing, risk management, and review cadence",pri:"PRIMARY",pc:"#22c55e",pb:"rgba(34,197,94,0.12)"},
        {num:"02",title:"Lose 15kg by end of summer",done:"Hard deadline: end of September 2026. Training + caloric deficit via MyFitnessPal.",pri:"PRIMARY",pc:"#22c55e",pb:"rgba(34,197,94,0.12)"},
        {num:"03",title:"Patent Approvals x2",done:"Both CAD patents approved — monitoring only, no new design work required",pri:"MEDICINE",pc:"#ef4444",pb:"rgba(239,68,68,0.12)"},
        {num:"04",title:"SRATS Conference Presentation",done:"Slide deck + speaker script finalized and rehearsed for submission deadline",pri:"MEDICINE",pc:"#ef4444",pb:"rgba(239,68,68,0.12)"},
      ].map(o=>(
        <div className="oc" key={o.num}>
          <div className="on">{o.num}</div>
          <div style={{flex:1}}><div className="ot">{o.title}</div><div className="od">{o.done}</div></div>
          <div className="op" style={{color:o.pc,background:o.pb,border:"1px solid "+o.pc}}>{o.pri}</div>
        </div>
      ))}
    </>
  );
}

function PSchedule({schedDay,setSchedDay}){
  const day=SCHEDULE[schedDay];
  const used=[...new Set(day.blocks.map(b=>b.type))].filter(t=>t!=="wildcard");
  return(
    <>
      <div className="pg-title">SCHEDULE</div>
      <div className="pg-sub">Tap any block to expand details and 2-minute version</div>
      <div className="day-tabs">{Object.keys(SCHEDULE).map(d=><div key={d} className={"day-tab"+(schedDay===d?" active":"")} onClick={()=>setSchedDay(d)}>{d}</div>)}</div>
      <div className="day-type">{day.type}</div>
      <div className="day-sub">{day.subtitle}</div>
      {day.blocks.map((b,i)=><Blk key={i} b={b}/>)}
      <div className="leg">{used.map(t=>{const m=BLOCK_META[t];if(!m)return null;return <div key={t} className="leg-i"><div className="leg-d" style={{background:m.color}}/>{m.label}</div>;})}</div>
    </>
  );
}

function PQuests({longQ,dailyQ,filter,setFilter,fq,openAdd,openEdit,delLong,toggleLong,toggleDaily}){
  const showDaily=filter==="Daily";
  const today=todayKey();
  const doneToday=dailyQ.filter(q=>q.lastDone===today).length;
  const longXP=longQ.filter(q=>q.status==="Completed").reduce((s,q)=>s+q.xp,0);
  return(
    <>
      <div className="pg-title">QUEST BOARD</div>
      <div className="pg-sub">Long-term milestones and daily habits — all tracked</div>
      <div className="frow">
        {["All","Active","Pending","Completed"].map(f=><div key={f} className={"chip"+(filter===f?" active":"")} onClick={()=>setFilter(f)}>{f}</div>)}
        <div className={"chip dc"+(filter==="Daily"?" active":"")} onClick={()=>setFilter("Daily")}>🔥 Daily</div>
        <div style={{marginLeft:"auto",fontFamily:"JetBrains Mono",fontSize:10,color:"#475569"}}>
          {showDaily?`${doneToday}/${dailyQ.length} today`:`${longQ.filter(q=>q.status==="Completed").length}/${longQ.length} · ${longXP.toLocaleString()} XP`}
        </div>
      </div>
      {showDaily?(
        CATEGORIES.map(cat=>{
          const items=dailyQ.filter(q=>q.category===cat);
          if(!items.length)return null;
          const{accent,light}=CAT_COLORS[cat];
          return(
            <div className="cat-sec" key={cat}>
              <div className="cat-hdr">
                <div className="cat-dot" style={{background:accent}}/>
                <div className="cat-nm" style={{color:light}}>{cat}</div>
                <div className="cat-xp" style={{color:accent,borderColor:accent,background:accent+"18"}}>{items.filter(q=>q.lastDone===today).length}/{items.length} today</div>
              </div>
              {items.map(q=><DQ key={q.id} q={q} onToggle={toggleDaily} ac={accent}/>)}
            </div>
          );
        })
      ):(
        CATEGORIES.map(cat=>{
          const items=fq(cat);
          const all=longQ.filter(q=>q.category===cat);
          const earned=all.filter(q=>q.status==="Completed").reduce((s,q)=>s+q.xp,0);
          const total=all.reduce((s,q)=>s+q.xp,0);
          const{accent,light}=CAT_COLORS[cat];
          return(
            <div className="cat-sec" key={cat}>
              <div className="cat-hdr">
                <div className="cat-dot" style={{background:accent}}/>
                <div className="cat-nm" style={{color:light}}>{cat}</div>
                <div className="cat-xp" style={{color:accent,borderColor:accent,background:accent+"18"}}>{earned.toLocaleString()} / {total.toLocaleString()} XP</div>
              </div>
              {items.length===0?<div style={{fontSize:12,color:"#334155",padding:"8px 0",fontStyle:"italic"}}>No quests matching filter.</div>:items.map(q=><LQ key={q.id} q={q} onEdit={openEdit} onDel={delLong} onToggle={toggleLong} ac={accent}/>)}
              <button className="btn-add" onClick={()=>openAdd(cat)}>+ Add Quest</button>
            </div>
          );
        })
      )}
    </>
  );
}

function LQ({q,onEdit,onDel,onToggle,ac}){
  const ss=STATUS_STYLE[q.status]||STATUS_STYLE.Pending;
  const ds=q.difficulty?(DIFF_STYLE[q.difficulty]||DIFF_STYLE["Medium"]):null;
  return(
    <div className={"quest"+(q.status==="Completed"?" done":"")}>
      <div className="qchk" onClick={()=>onToggle(q.id)} style={q.status==="Completed"?{borderColor:ac,background:ac}:{}}>{q.status==="Completed"?"✓":""}</div>
      <div className="qb">
        <div className={"qt"+(q.status==="Completed"?" done":"")}>{q.title}</div>
        <div className="qm">
          <span className="qxp">+{q.xp.toLocaleString()} XP</span>
          <span className="qst" style={{background:ss.bg,color:ss.color}}><span style={{width:5,height:5,borderRadius:"50%",background:ss.dot,display:"inline-block"}}/>{q.status}</span>
          {ds&&<span className="qst" style={{background:ds.bg,color:ds.color}}>{q.difficulty}</span>}
        </div>
        {q.notes&&<div className="qnt">{q.notes}</div>}
      </div>
      <div className="qac">
        <button className="bi" onClick={()=>onEdit(q)}>✎</button>
        <button className="bi del" onClick={()=>onDel(q.id)}>✕</button>
      </div>
    </div>
  );
}

function DQ({q,onToggle,ac}){
  const today=todayKey();
  const done=q.lastDone===today;
  const mult=STREAK_MULT(q.streak);
  const earnedXp=Math.round(q.baseXp*mult);
  const sc=STREAK_COLOR(q.streak);
  return(
    <div className={"dq"+(done?" done":"")}>
      <div className="qchk" onClick={()=>onToggle(q.id)} style={done?{borderColor:ac,background:ac}:{}}>{done?"✓":""}</div>
      <div className="di">
        <div className={"dt"+(done?" done":"")}>{q.title}</div>
        <div className="dm">
          <span className="qxp">+{earnedXp} XP</span>
          {q.streak>0&&<span className="sb" style={{color:sc}}>🔥 {q.streak}</span>}
          {mult>1&&<span className="mb" style={{color:sc,background:sc+"22",border:"1px solid "+sc}}>{STREAK_LABEL(q.streak)}</span>}
          {q.note&&<span className="dn">{q.note}</span>}
        </div>
      </div>
    </div>
  );
}

function PReview(){
  return(
    <>
      <div className="pg-title">REVIEW CADENCE</div>
      <div className="pg-sub">The feedback loop that keeps the system calibrated</div>
      {[
        {title:"Daily Log — 5 minutes",items:["3 intentions before touching anything else","Did the trading block happen? One-line journal entry","Did the non-negotiables hold? (Swim, sleep, evening with wife)"]},
        {title:"Weekly Review — Sunday 09:00-10:30",items:["Trading: review all trades against documented rules","Quests: update XP, mark completed, activate next milestones","Schedule: did the blocks hold? What disrupted them?","Identity check: what evidence did I generate this week?","Write 3 priorities for the coming 7 days"]},
        {title:"Monthly Review — First Sunday of each month",items:["Six-month output progress: where are the four outputs tracking?","Weight check: on track for 15kg by end of summer?","Sleep check: is the 05:00 wake / 22:30 lights out holding?","Habit audit: which are installed? Which are still fragile?","Trading P&L review and system adjustments"]},
      ].map(s=>(
        <div className="card" key={s.title}>
          <div className="card-t">{s.title}</div>
          {s.items.map((item,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
              <span style={{color:"#3b82f6",fontFamily:"JetBrains Mono",fontSize:11,marginTop:2,flexShrink:0}}>□</span>
              <span style={{fontSize:12,color:"#94a3b8",lineHeight:1.6}}>{item}</span>
            </div>
          ))}
        </div>
      ))}
      <div className="callout cn"><div className="ct"><strong>The Plateau of Latent Potential — </strong>Results lag behind habits. You may feel like nothing is changing — then cross a threshold and see rapid progress. The system is working even when it does not feel like it.</div></div>
    </>
  );
}

function PPrinciples(){
  return(
    <>
      <div className="pg-title">PRINCIPLES</div>
      <div className="pg-sub">The operating rules of the system</div>
      <div className="card">
        {[
          ["Never miss twice.","Missing once is an accident. Missing twice is the start of a new bad habit. The 2-minute version exists precisely for this moment."],
          ["Vote for your identity.","Every action is a vote. Each swim, each trading review, each protected evening is a cast vote for who you are becoming."],
          ["Reduce friction ruthlessly.","Gym bag pre-packed. TradingView already open. Mat already on the floor. Fix the environment before expecting willpower to do the work."],
          ["Trading is primary; CAD is maintenance.","CAD patents are done. Trading gets all prime deep work time. CAD gets a hard-capped 1-hour Saturday slot only when something needs attention."],
          ["The swim is non-negotiable.","Daily swimming is the fixed anchor of the entire system. It solves cardio, establishes the morning rhythm, and makes every other habit easier to stack."],
          ["Protect the evenings.","19:30-21:30 with your wife is non-negotiable. Phone docked at 21:00. Lights out by 22:30. Sleep is the foundation of everything else."],
          ["The system is the goal.","A 1% improvement every day compounds to 37x better in a year. You are not trying to have a great day. You are running a system that makes great days the default."],
        ].map(([t,d])=>(
          <div className="pr" key={t}>
            <div className="pt">{t}</div>
            <div className="pd">{d}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function PWorkouts(){
  const vids=[
    {title:"Full Body Workout",       url:"https://www.youtube.com/shorts/Z4Aqs-rZ__g",  cat:"Health & Fitness",   desc:"3-5 rounds: squats, lunges, push-ups, supermans, plank kickthroughs, body saw planks. Saturday morning after swim.",    color:"#22c55e"},
    {title:"Core (Abs) Workout",      url:"https://www.youtube.com/shorts/I3iNE5RpMZI",  cat:"Health & Fitness",   desc:"2-3 rounds: boat holds, leg lifts, bear plank, bear crawls, rotating side planks, extended plank. Follows full body on Saturday.", color:"#22c55e"},
    {title:"VMO Exercises",           url:"https://www.youtube.com/watch?v=bf18YHxDvME", cat:"Health & Fitness",   desc:"Deep VMO squats x2 sets + front foot elevated split squat x2 sets each leg. Monday and Thursday after decompress.",    color:"#a855f7"},
    {title:"Night Stretches",         url:"https://www.youtube.com/shorts/zQkpBdfQt9g",  cat:"Health & Fitness",   desc:"Spine rotations, lateral neck, pigeon pose, hamstring stretch, 90/90s. Every night at 21:45 before lights out.",        color:"#06b6d4"},
  ];
  return(
    <>
      <div className="pg-title">WORKOUTS</div>
      <div className="pg-sub">Reference videos for all home training blocks</div>
      <div className="card-t" style={{marginTop:4,marginBottom:12}}>Home Dumbbell PPL</div>
      <div className="callout cn">
        <div className="ct">
          Built for 2 adjustable dumbbells, <strong>10kg per hand / 20kg combined</strong>. At this load, progress comes from tempo, unilateral work, and rep range rather than raw weight — bodyweight moves (push-ups, lunges, split squats) fill in what the dumbbells can't. Mirrors the gym Push/Pull/Legs split so it can substitute directly. Progress: once a lift clears 15-20 clean reps or a 3-count negative feels easy, it's time for heavier dumbbells or resistance bands.
        </div>
      </div>
      {Object.entries(HOME_PPL).map(([day,d])=>(
        <div className="card" key={day}>
          <div className="card-t" style={{color:d.color}}>{day.toUpperCase()} DAY — {d.duration}</div>
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:8}}>{d.focus}</div>
          <div style={{fontSize:11,color:"#64748b",fontStyle:"italic",marginBottom:12}}>Warm-up: {d.warmup}</div>
          <table className="tbl">
            <thead><tr><th>EXERCISE</th><th>SETS</th><th>REPS</th><th>NOTE</th></tr></thead>
            <tbody>
              {d.exercises.map((e,i)=>(
                <tr key={i}>
                  <td style={{fontWeight:600,color:"#e2e8f0",whiteSpace:"nowrap"}}>{e.name}</td>
                  <td style={{color:"#94a3b8"}}>{e.sets}</td>
                  <td style={{color:"#94a3b8",whiteSpace:"nowrap"}}>{e.reps}</td>
                  <td style={{color:"#64748b",fontSize:11}}>{e.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <div className="card-t" style={{marginTop:20,marginBottom:12}}>Reference Videos</div>
      {vids.map(v=>(
        <div key={v.title} className="card" style={{display:"flex",alignItems:"flex-start",gap:16}}>
          <div style={{width:36,height:36,borderRadius:8,background:v.color+"22",border:"1px solid "+v.color+"55",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>▶</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
              <a href={v.url} target="_blank" rel="noreferrer" style={{fontSize:14,fontWeight:600,color:v.color,textDecoration:"none"}}>{v.title}</a>
              <span style={{fontSize:10,color:"#475569",fontFamily:"JetBrains Mono",padding:"2px 7px",borderRadius:99,border:"1px solid #1e2d40"}}>{v.cat}</span>
            </div>
            <div style={{fontSize:12,color:"#64748b",lineHeight:1.6}}>{v.desc}</div>
            <a href={v.url} target="_blank" rel="noreferrer" style={{fontSize:10,color:"#475569",fontFamily:"JetBrains Mono",marginTop:5,display:"inline-block",textDecoration:"none"}}>{v.url}</a>
          </div>
        </div>
      ))}
    </>
  );
}

function QModal({modal,onSave,onClose}){
  const isEdit=modal.mode==="edit";
  const[title,setTitle]=useState(isEdit?modal.quest.title:"");
  const[category,setCategory]=useState(isEdit?modal.quest.category:(modal.category||CATEGORIES[0]));
  const[xp,setXp]=useState(isEdit?String(modal.quest.xp):"");
  const[status,setStatus]=useState(isEdit?modal.quest.status:"Active");
  const[notes,setNotes]=useState(isEdit?modal.quest.notes:"");
  const[difficulty,setDifficulty]=useState(isEdit?(modal.quest.difficulty||""):"");
  const[copied,setCopied]=useState(false);

  const prompt=title.trim()?`Assess this quest for XP in my Atomic Habits life system.

Quest: "${title.trim()}"
Category: ${category}
Notes: ${notes.trim()||"none"}

Context: Romanian orthopedic surgeon (OR on Thu/Fri only) and systematic crypto trader. Domains: Health & Fitness, Medicine & Surgery, Trading, Hobbies & Creativity. Daily swimmer 06:00, PPL strength 6x/week, 15kg weight loss goal by end of September 2026. Wake 05:00-05:30, lights out 22:30.

Score on four axes (1-5): duration, effort, obstacles, frequency.
XP range: 200-2000 in multiples of 50.

Return this JSON only - no markdown:
{"xp": 750, "difficulty": "Medium", "reasoning": "one sentence", "axes": {"duration": 3, "effort": 3, "obstacles": 2, "frequency": 3}}`:"";

  const copy=async()=>{
    if(!prompt)return;
    try{await navigator.clipboard.writeText(prompt);setCopied(true);setTimeout(()=>setCopied(false),2500);}catch(_){}
  };

  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="mt">{isEdit?"EDIT QUEST":"NEW QUEST"}</div>
        <div className="fg"><label className="fl">QUEST TITLE</label><input className="fi" value={title} onChange={e=>setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus/></div>
        <div className="fg"><label className="fl">CATEGORY</label><select className="fsel" value={category} onChange={e=>setCategory(e.target.value)}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
        <div className="fg"><label className="fl">NOTES — more detail = better assessment</label><textarea className="fta" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Context, sub-tasks, timeline..."/></div>
        <div className="ass">
          <div className="ash">
            <span className="asl">CLAUDE ASSESSMENT</span>
            <button className={"bc"+(copied?" cp":"")} onClick={copy} disabled={!title.trim()}>{copied?"Copied!":"Copy prompt"}</button>
          </div>
          {title.trim()?<><div className="pp">{prompt.slice(0,200)}...</div><div style={{fontSize:10,color:"#475569",lineHeight:1.5}}>Paste into Claude, enter returned XP and difficulty below.</div></>:<div style={{fontSize:10,color:"#334155",fontStyle:"italic"}}>Enter a title to generate the prompt.</div>}
        </div>
        <div style={{display:"flex",gap:11}}>
          <div className="fg" style={{flex:1}}><label className="fl">XP REWARD</label><input className="fi" type="number" value={xp} onChange={e=>setXp(e.target.value)} min={0} step={50} placeholder="From assessment or manual"/></div>
          <div className="fg" style={{flex:1}}><label className="fl">DIFFICULTY</label>
            <select className="fsel" value={difficulty} onChange={e=>setDifficulty(e.target.value)}>
              <option value="">- unset -</option>
              {Object.keys(DIFF_STYLE).map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="fg"><label className="fl">STATUS</label><select className="fsel" value={status} onChange={e=>setStatus(e.target.value)}><option>Active</option><option>Pending</option><option>Completed</option></select></div>
        <div className="mf">
          <button className="bs" onClick={onClose}>Cancel</button>
          <button className="bp" onClick={()=>{if(!title.trim()||!xp)return;onSave({title:title.trim(),category,xp:parseInt(xp)||0,status,notes:notes.trim(),difficulty});}} disabled={!title.trim()||!xp}>{isEdit?"Save Changes":"Add Quest"}</button>
        </div>
      </div>
    </div>
  );
}
