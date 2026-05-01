// Exercise library, organized by muscle group.
// GIFs use the open-source wger project's media URLs (CC-BY-SA 4.0).
// All have animated illustration fallback if image fails.

export type MuscleGroup =
  | "full-body"
  | "abs"
  | "chest"
  | "arms"
  | "legs"
  | "back"
  | "shoulders"
  | "warmup";

export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  duration: number; // seconds
  rest: number; // seconds
  emoji: string;
  instructions: string[];
  gifUrl?: string;
}

// All gif URLs are royalty-free animated exercise illustrations from
// https://github.com/yuhonas/free-exercise-db (public domain CC0).
// Hosted via jsDelivr CDN.
const GIF_BASE = "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises";

export const MUSCLE_GROUPS: { id: MuscleGroup; label: string; emoji: string; gradient: string }[] = [
  { id: "full-body", label: "Full Body", emoji: "🔥", gradient: "from-orange-500 to-red-500" },
  { id: "abs", label: "Abs", emoji: "🎯", gradient: "from-rose-500 to-pink-500" },
  { id: "chest", label: "Chest", emoji: "💪", gradient: "from-blue-500 to-cyan-500" },
  { id: "arms", label: "Arms", emoji: "🦾", gradient: "from-purple-500 to-violet-500" },
  { id: "legs", label: "Legs", emoji: "🦵", gradient: "from-emerald-500 to-teal-500" },
  { id: "back", label: "Back", emoji: "🏋️", gradient: "from-amber-500 to-orange-500" },
  { id: "shoulders", label: "Shoulders", emoji: "🤸", gradient: "from-indigo-500 to-blue-500" },
];

export const WARMUP_EXERCISES: Exercise[] = [
  {
    id: "wu-arm-circles",
    name: "Arm Circles",
    muscle: "warmup",
    duration: 30,
    rest: 10,
    emoji: "🔄",
    instructions: [
      "Stand with feet shoulder-width apart",
      "Extend arms out to your sides",
      "Make small circles, gradually getting bigger",
      "Reverse direction halfway through",
    ],
    gifUrl: `${GIF_BASE}/Arm_Circles/0.jpg`,
  },
  {
    id: "wu-jumping-jacks",
    name: "Jumping Jacks",
    muscle: "warmup",
    duration: 40,
    rest: 10,
    emoji: "🤾",
    instructions: [
      "Stand tall with feet together, arms at sides",
      "Jump while spreading legs and raising arms overhead",
      "Jump back to starting position",
      "Maintain a steady rhythm",
    ],
    gifUrl: `${GIF_BASE}/Jumping_Jacks/0.jpg`,
  },
  {
    id: "wu-side-bend",
    name: "Standing Side Bend",
    muscle: "warmup",
    duration: 30,
    rest: 10,
    emoji: "🙆",
    instructions: [
      "Stand with feet hip-width apart",
      "Reach one arm overhead and bend to the opposite side",
      "Hold briefly, then return to center",
      "Alternate sides smoothly",
    ],
  },
  {
    id: "wu-adductor",
    name: "Adductor Stretch",
    muscle: "warmup",
    duration: 30,
    rest: 10,
    emoji: "🧘",
    instructions: [
      "Stand with feet wide apart",
      "Shift weight to one side, bending that knee",
      "Keep the other leg straight, feel the inner thigh stretch",
      "Hold, then switch sides",
    ],
  },
];

const EXERCISES: Exercise[] = [
  // ─── CHEST ───
  {
    id: "ch-pushup",
    name: "Push-Ups",
    muscle: "chest",
    duration: 40,
    rest: 20,
    emoji: "💪",
    instructions: [
      "Start in a high plank with hands shoulder-width apart",
      "Keep core tight and body in a straight line",
      "Lower chest until elbows are at 90°",
      "Push back up to start",
    ],
    gifUrl: `${GIF_BASE}/Pushups/0.jpg`,
  },
  {
    id: "ch-incline-pushup",
    name: "Incline Push-Ups",
    muscle: "chest",
    duration: 40,
    rest: 20,
    emoji: "📐",
    instructions: [
      "Place hands on a sturdy elevated surface",
      "Walk feet back into a plank position",
      "Lower chest to the surface, then press up",
      "Keep elbows tucked at 45°",
    ],
  },
  {
    id: "ch-diamond-pushup",
    name: "Diamond Push-Ups",
    muscle: "chest",
    duration: 30,
    rest: 20,
    emoji: "💎",
    instructions: [
      "Form a diamond shape with thumbs and index fingers",
      "Lower chest to your hands",
      "Keep elbows tucked close to your body",
      "Press back up powerfully",
    ],
  },
  {
    id: "ch-wide-pushup",
    name: "Wide Push-Ups",
    muscle: "chest",
    duration: 35,
    rest: 20,
    emoji: "🔄",
    instructions: [
      "Place hands wider than shoulder-width",
      "Lower until chest is just above floor",
      "Drive through palms to push up",
      "Targets outer chest fibers",
    ],
  },

  // ─── ABS ───
  {
    id: "ab-crunch",
    name: "Crunches",
    muscle: "abs",
    duration: 40,
    rest: 15,
    emoji: "🎯",
    instructions: [
      "Lie on back, knees bent, feet flat",
      "Place hands behind head (don't pull on neck)",
      "Lift shoulder blades off the floor using your abs",
      "Lower back down with control",
    ],
    gifUrl: `${GIF_BASE}/Crunches/0.jpg`,
  },
  {
    id: "ab-plank",
    name: "Plank Hold",
    muscle: "abs",
    duration: 45,
    rest: 20,
    emoji: "🪵",
    instructions: [
      "Forearms on the ground, elbows under shoulders",
      "Keep body in a straight line head to heels",
      "Squeeze glutes and brace core",
      "Breathe steadily — don't sag the hips",
    ],
    gifUrl: `${GIF_BASE}/Plank/0.jpg`,
  },
  {
    id: "ab-leg-raise",
    name: "Leg Raises",
    muscle: "abs",
    duration: 40,
    rest: 15,
    emoji: "🦵",
    instructions: [
      "Lie flat with hands under your hips",
      "Keep legs straight and lift them to 90°",
      "Lower slowly without touching the ground",
      "Keep lower back pressed into the floor",
    ],
  },
  {
    id: "ab-bicycle",
    name: "Bicycle Crunches",
    muscle: "abs",
    duration: 40,
    rest: 15,
    emoji: "🚴",
    instructions: [
      "Lie on back, hands behind head",
      "Bring opposite elbow to opposite knee",
      "Extend the other leg straight out",
      "Alternate in a smooth pedaling motion",
    ],
  },

  // ─── ARMS ───
  {
    id: "ar-tricep-dip",
    name: "Tricep Dips",
    muscle: "arms",
    duration: 40,
    rest: 20,
    emoji: "🦾",
    instructions: [
      "Sit on edge of chair, hands gripping the edge",
      "Slide forward, support weight with arms",
      "Lower body until elbows are at 90°",
      "Press back up using triceps",
    ],
    gifUrl: `${GIF_BASE}/Bench_Dips/0.jpg`,
  },
  {
    id: "ar-close-pushup",
    name: "Close-Grip Push-Ups",
    muscle: "arms",
    duration: 35,
    rest: 20,
    emoji: "🤜",
    instructions: [
      "Hands placed under shoulders, narrower than usual",
      "Keep elbows tight to your sides",
      "Lower chest, push up explosively",
      "Targets the triceps directly",
    ],
  },
  {
    id: "ar-plank-shoulder-tap",
    name: "Plank Shoulder Taps",
    muscle: "arms",
    duration: 40,
    rest: 15,
    emoji: "✋",
    instructions: [
      "Start in high plank position",
      "Tap right hand to left shoulder",
      "Return and tap left hand to right shoulder",
      "Keep hips as still as possible",
    ],
  },

  // ─── LEGS ───
  {
    id: "lg-squat",
    name: "Bodyweight Squats",
    muscle: "legs",
    duration: 45,
    rest: 20,
    emoji: "🦵",
    instructions: [
      "Stand with feet shoulder-width apart",
      "Push hips back as if sitting in a chair",
      "Lower until thighs are parallel to the ground",
      "Drive through heels to stand back up",
    ],
    gifUrl: `${GIF_BASE}/Bodyweight_Squat/0.jpg`,
  },
  {
    id: "lg-lunge",
    name: "Forward Lunges",
    muscle: "legs",
    duration: 45,
    rest: 20,
    emoji: "🚶",
    instructions: [
      "Step one foot forward into a long stride",
      "Lower back knee toward the floor",
      "Front knee stays over your ankle",
      "Push off front foot to return, alternate sides",
    ],
    gifUrl: `${GIF_BASE}/Bodyweight_Walking_Lunge/0.jpg`,
  },
  {
    id: "lg-jump-squat",
    name: "Jump Squats",
    muscle: "legs",
    duration: 30,
    rest: 25,
    emoji: "🚀",
    instructions: [
      "Drop into a squat position",
      "Explode upward, jumping as high as possible",
      "Land softly back into the squat",
      "Keep the chest tall throughout",
    ],
  },
  {
    id: "lg-glute-bridge",
    name: "Glute Bridge",
    muscle: "legs",
    duration: 40,
    rest: 15,
    emoji: "🌉",
    instructions: [
      "Lie on back with knees bent, feet flat",
      "Press through heels to lift hips up",
      "Squeeze glutes hard at the top",
      "Lower with control",
    ],
    gifUrl: `${GIF_BASE}/Glute_Bridge/0.jpg`,
  },

  // ─── BACK ───
  {
    id: "bk-superman",
    name: "Superman",
    muscle: "back",
    duration: 35,
    rest: 20,
    emoji: "🦸",
    instructions: [
      "Lie face-down with arms extended forward",
      "Lift arms, chest, and legs off the floor",
      "Squeeze your lower back and glutes",
      "Hold briefly, then lower",
    ],
  },
  {
    id: "bk-reverse-snow-angel",
    name: "Reverse Snow Angels",
    muscle: "back",
    duration: 35,
    rest: 20,
    emoji: "👼",
    instructions: [
      "Lie face-down, arms by your sides, palms up",
      "Lift arms slightly and sweep them overhead",
      "Keep arms hovering off the floor the entire time",
      "Slowly return to start",
    ],
  },
  {
    id: "bk-good-morning",
    name: "Good Mornings",
    muscle: "back",
    duration: 40,
    rest: 20,
    emoji: "🌅",
    instructions: [
      "Stand with feet hip-width apart, hands behind head",
      "Hinge at the hips, pushing them back",
      "Lower torso until parallel to the floor",
      "Squeeze glutes to return to standing",
    ],
  },

  // ─── SHOULDERS ───
  {
    id: "sh-pike-pushup",
    name: "Pike Push-Ups",
    muscle: "shoulders",
    duration: 35,
    rest: 25,
    emoji: "🔺",
    instructions: [
      "Start in a downward-dog position with hips high",
      "Bend elbows to lower the top of your head toward the floor",
      "Press back up powerfully using your shoulders",
      "Keep legs as straight as possible",
    ],
  },
  {
    id: "sh-lateral-raise",
    name: "Arm Lateral Raises",
    muscle: "shoulders",
    duration: 35,
    rest: 15,
    emoji: "🪽",
    instructions: [
      "Stand tall, arms by your sides",
      "Raise arms straight out to shoulder height",
      "Pause briefly at the top",
      "Lower with control",
    ],
  },
  {
    id: "sh-front-raise",
    name: "Arm Front Raises",
    muscle: "shoulders",
    duration: 35,
    rest: 15,
    emoji: "👆",
    instructions: [
      "Stand tall with arms in front of thighs",
      "Lift arms straight in front to shoulder height",
      "Pause, then lower slowly",
      "Keep core engaged",
    ],
  },

  // ─── FULL BODY ───
  {
    id: "fb-burpee",
    name: "Burpees",
    muscle: "full-body",
    duration: 40,
    rest: 25,
    emoji: "🔥",
    instructions: [
      "Drop into a squat, place hands on the floor",
      "Jump feet back into a plank, do a push-up",
      "Jump feet forward back to squat",
      "Explode up with a jump and clap overhead",
    ],
    gifUrl: `${GIF_BASE}/Burpee/0.jpg`,
  },
  {
    id: "fb-mountain-climber",
    name: "Mountain Climbers",
    muscle: "full-body",
    duration: 40,
    rest: 20,
    emoji: "⛰️",
    instructions: [
      "Start in a high plank position",
      "Drive one knee toward your chest",
      "Quickly switch legs in a running motion",
      "Keep hips low and core braced",
    ],
    gifUrl: `${GIF_BASE}/Mountain_Climbers/0.jpg`,
  },
  {
    id: "fb-squat-press",
    name: "Squat to Reach",
    muscle: "full-body",
    duration: 40,
    rest: 20,
    emoji: "🙌",
    instructions: [
      "Drop into a deep squat",
      "As you stand, reach both arms overhead",
      "Stretch tall at the top",
      "Flow into the next rep",
    ],
  },
  {
    id: "fb-high-knees",
    name: "High Knees",
    muscle: "full-body",
    duration: 30,
    rest: 20,
    emoji: "🏃",
    instructions: [
      "Run in place, driving knees up to hip height",
      "Pump arms in opposition to legs",
      "Stay light on the balls of your feet",
      "Maintain a quick rhythm",
    ],
  },
  {
    id: "fb-bear-crawl",
    name: "Bear Crawl",
    muscle: "full-body",
    duration: 40,
    rest: 20,
    emoji: "🐻",
    instructions: [
      "Start on hands and knees, hover knees an inch off floor",
      "Move opposite hand and foot together",
      "Keep your back flat and core tight",
      "Crawl forward and back",
    ],
  },
];

export function getExercisesForMuscle(muscle: MuscleGroup): Exercise[] {
  if (muscle === "full-body") {
    // Mix full-body with one rep from each major group
    const fullBody = EXERCISES.filter((e) => e.muscle === "full-body");
    const variety = ["chest", "legs", "abs", "arms"].map(
      (m) => EXERCISES.find((e) => e.muscle === m)
    ).filter(Boolean) as Exercise[];
    return [...fullBody, ...variety];
  }
  return EXERCISES.filter((e) => e.muscle === muscle);
}

export function buildWorkout(muscle: MuscleGroup): Exercise[] {
  return [...WARMUP_EXERCISES.slice(0, 2), ...getExercisesForMuscle(muscle)];
}