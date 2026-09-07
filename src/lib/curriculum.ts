export type Difficulty = "Easy" | "Normal" | "Hard" | "Very Hard" | "Insane";
export type Frequency = 0 | 1 | 2 | 3 | 4; // rare → very frequent

export interface Problem {
  id: string;
  source: string; // e.g. "F=ma 2019/12"
  name: string;
  difficulty: Difficulty;
  tags?: string[];
  starred?: boolean;
}

export interface Module {
  slug: string;
  title: string;
  description: string;
  frequency: Frequency;
  minutes: number; // est. reading time
  prereqs?: string[]; // slugs
  problems: Problem[];
  hasContent?: boolean; // full authored content exists
}

export interface Section {
  id: string;
  title: string;
  modules: Module[];
}

export interface Division {
  id: string;
  label: string;
  name: string;
  tagline: string;
  accent: string; // css color
  sections: Section[];
}

const P = (
  id: string,
  source: string,
  name: string,
  difficulty: Difficulty,
  tags: string[] = [],
  starred = false
): Problem => ({ id, source, name, difficulty, tags, starred });

export const DIVISIONS: Division[] = [
  {
    id: "fma",
    label: "I",
    name: "F=ma",
    tagline: "Mechanics fundamentals for the qualifying exam",
    accent: "var(--brass)",
    sections: [
      {
        id: "kinematics",
        title: "Kinematics",
        modules: [
          {
            slug: "vectors-calculus",
            title: "Vectors & Essential Math",
            description:
              "Vector algebra, dot and cross products, and the small calculus toolkit that olympiad problems assume.",
            frequency: 4,
            minutes: 25,
            hasContent: true,
            problems: [
              P("vc1", "F=ma 2018/3", "River Crossing", "Easy", ["vectors"]),
              P("vc2", "F=ma 2020/7", "Relative Rain", "Normal", ["relative motion"], true),
              P("vc3", "Morin 1.4", "Minimum Speed Chase", "Normal", ["optimization"]),
              P("vc4", "Kevin Zhou M1", "Drifting Boat", "Hard", ["vectors", "calculus"]),
            ],
          },
          {
            slug: "kinematics-1d",
            title: "Kinematics in One Dimension",
            description:
              "Motion graphs, constant acceleration, and choosing the right kinematic description.",
            frequency: 4,
            minutes: 30,
            hasContent: true,
            problems: [
              P("k1", "F=ma 2017/1", "Braking Train", "Easy", ["suvat"]),
              P("k2", "F=ma 2019/4", "Two Balls, One Tower", "Easy", ["free fall"], true),
              P("k3", "F=ma 2021/9", "Velocity-Time Area Trap", "Normal", ["graphs"]),
              P("k4", "Morin 2.3", "Average Speed Paradox", "Normal", ["averages"]),
              P("k5", "F=ma 2016/17", "Elevator Drop", "Hard", ["relative motion"]),
            ],
          },
          {
            slug: "projectile-motion",
            title: "Projectile Motion",
            description:
              "2D trajectories, range optimization, and projectiles on inclines, with an interactive trajectory lab.",
            frequency: 4,
            minutes: 35,
            prereqs: ["kinematics-1d"],
            hasContent: true,
            problems: [
              P("p1", "F=ma 2018/8", "Cliff Launch", "Easy", ["projectiles"]),
              P("p2", "F=ma 2015/14", "Range on an Incline", "Normal", ["inclines"], true),
              P("p3", "F=ma 2022/11", "Two Projectiles Collide", "Normal", ["collision geometry"]),
              P("p4", "Morin 3.5", "Maximum Trajectory Length", "Hard", ["optimization", "calculus"]),
              P("p5", "IPhO 2012/1a", "Bouncing Projectile", "Very Hard", ["bounces"], true),
            ],
          },
        ],
      },
      {
        id: "dynamics",
        title: "Newton's Laws",
        modules: [
          {
            slug: "forces-fbd",
            title: "Forces & Free Body Diagrams",
            description:
              "Systematic force analysis: normal forces, tension, friction, and drawing a clean free body diagram.",
            frequency: 4,
            minutes: 40,
            hasContent: true,
            problems: [
              P("f1", "F=ma 2019/6", "Stacked Blocks", "Easy", ["friction"]),
              P("f2", "F=ma 2020/12", "Pulley on a Wedge", "Normal", ["pulleys"], true),
              P("f3", "F=ma 2017/19", "Chain on a Table", "Hard", ["distributed mass"]),
              P("f4", "Morin 4.29", "Rope Between Inclines", "Hard", ["statics"]),
            ],
          },
          {
            slug: "circular-motion",
            title: "Circular Motion & Gravitation",
            description:
              "Centripetal acceleration, banked curves, orbits, and Kepler's laws.",
            frequency: 3,
            minutes: 35,
            prereqs: ["forces-fbd"],
            problems: [
              P("c1", "F=ma 2018/15", "Banked Turn", "Normal", ["circular"]),
              P("c2", "F=ma 2021/18", "Satellite Transfer", "Normal", ["orbits"], true),
              P("c3", "F=ma 2016/24", "Conical Pendulum Race", "Hard", ["circular"]),
            ],
          },
          {
            slug: "energy-momentum",
            title: "Energy & Momentum",
            description:
              "Work-energy theorem, conservation laws, collisions in one and two dimensions, and center of mass.",
            frequency: 4,
            minutes: 45,
            hasContent: true,
            problems: [
              P("e1", "F=ma 2019/13", "Loop-the-Loop", "Easy", ["energy"]),
              P("e2", "F=ma 2020/20", "Ballistic Pendulum", "Normal", ["collisions"], true),
              P("e3", "F=ma 2022/21", "Exploding Projectile", "Hard", ["momentum", "com"]),
              P("e4", "Morin 5.7", "Leaky Bucket", "Hard", ["variable mass"]),
              P("e5", "F=ma 2018/25", "Elastic Collision Angles", "Very Hard", ["2d collisions"], true),
            ],
          },
        ],
      },
      {
        id: "rotation",
        title: "Rotation & Oscillation",
        modules: [
          {
            slug: "rotational-dynamics",
            title: "Rotational Dynamics",
            description:
              "Torque, moment of inertia, angular momentum, and rolling without slipping.",
            frequency: 4,
            minutes: 50,
            prereqs: ["energy-momentum"],
            problems: [
              P("r1", "F=ma 2017/22", "Rolling Race", "Normal", ["rolling"]),
              P("r2", "F=ma 2021/24", "Falling Rod", "Hard", ["torque"], true),
              P("r3", "Morin 8.6", "Ball Hits Rod", "Very Hard", ["angular momentum"]),
            ],
          },
          {
            slug: "shm",
            title: "Simple Harmonic Motion",
            description:
              "Springs, pendulums, effective potentials, and small-oscillation approximations, with a live oscillator.",
            frequency: 3,
            minutes: 40,
            hasContent: true,
            problems: [
              P("s1", "F=ma 2019/17", "Two-Spring Cart", "Normal", ["springs"]),
              P("s2", "F=ma 2016/20", "Tunnel Through Earth", "Normal", ["shm"], true),
              P("s3", "Morin 4.10", "Pendulum in an Elevator", "Hard", ["accelerated frames"]),
              P("s4", "USAPhO 2014/A2", "Oscillating Hoop", "Very Hard", ["physical pendulum"], true),
            ],
          },
        ],
      },
    ],
  },
  {
    id: "usapho",
    label: "II",
    name: "USAPhO",
    tagline: "Free-response mastery across all of physics",
    accent: "var(--copper)",
    sections: [
      {
        id: "em",
        title: "Electricity & Magnetism",
        modules: [
          {
            slug: "electrostatics",
            title: "Electrostatics & Gauss's Law",
            description:
              "Field and potential of charge distributions, Gauss's law symmetry arguments, and conductors.",
            frequency: 4,
            minutes: 55,
            hasContent: true,
            problems: [
              P("g1", "USAPhO 2015/A1", "Charged Hemisphere", "Hard", ["gauss"]),
              P("g2", "USAPhO 2018/A2", "Image Charge Warmup", "Hard", ["images"], true),
              P("g3", "USAPhO 2012/B1", "Nonuniform Sphere", "Very Hard", ["gauss"]),
              P("g4", "IPhO 2010/2", "Chimney Physics (E&M part)", "Insane", ["fields"]),
            ],
          },
          {
            slug: "circuits",
            title: "Circuits & RC Dynamics",
            description:
              "Kirchhoff's laws, equivalent resistance tricks, capacitor transients, and infinite ladders.",
            frequency: 3,
            minutes: 45,
            problems: [
              P("ci1", "USAPhO 2016/A1", "Resistor Cube", "Hard", ["symmetry"]),
              P("ci2", "USAPhO 2019/A3", "RC Cascade", "Very Hard", ["transients"], true),
            ],
          },
          {
            slug: "magnetism",
            title: "Magnetism & Induction",
            description:
              "Biot-Savart, Ampere's law, Faraday induction, and motional EMF.",
            frequency: 4,
            minutes: 60,
            prereqs: ["electrostatics"],
            problems: [
              P("m1", "USAPhO 2017/B2", "Rail Gun Energetics", "Very Hard", ["induction"], true),
              P("m2", "USAPhO 2013/A3", "Rotating Loop", "Hard", ["faraday"]),
            ],
          },
        ],
      },
      {
        id: "thermo",
        title: "Thermodynamics",
        modules: [
          {
            slug: "kinetic-theory",
            title: "Kinetic Theory & Ideal Gases",
            description:
              "Microscopic pressure derivation, equipartition, and the ideal gas law from first principles.",
            frequency: 3,
            minutes: 40,
            problems: [
              P("kt1", "USAPhO 2014/B1", "Gas in a Cylinder", "Hard", ["kinetic theory"]),
              P("kt2", "USAPhO 2020/A2", "Leaking Balloon", "Very Hard", ["effusion"], true),
            ],
          },
          {
            slug: "heat-engines",
            title: "Cycles, Engines & Entropy",
            description:
              "PV diagrams, Carnot efficiency, entropy bookkeeping, and real cycle analysis.",
            frequency: 3,
            minutes: 45,
            prereqs: ["kinetic-theory"],
            problems: [
              P("he1", "USAPhO 2018/B1", "Triangle Cycle", "Hard", ["cycles"], true),
              P("he2", "USAPhO 2011/A2", "Two-Reservoir Engine", "Very Hard", ["entropy"]),
            ],
          },
        ],
      },
      {
        id: "waves-modern",
        title: "Waves, Optics & Modern",
        modules: [
          {
            slug: "waves",
            title: "Waves & Interference",
            description:
              "Standing waves, beats, Doppler effect, and two-source interference.",
            frequency: 2,
            minutes: 40,
            problems: [
              P("w1", "USAPhO 2015/B2", "String Harmonics", "Hard", ["standing waves"]),
              P("w2", "USAPhO 2019/B1", "Moving Source Doppler", "Hard", ["doppler"], true),
            ],
          },
          {
            slug: "optics",
            title: "Geometric & Wave Optics",
            description:
              "Lens systems, mirror equations, diffraction gratings, and thin-film interference.",
            frequency: 2,
            minutes: 45,
            problems: [
              P("o1", "USAPhO 2016/B2", "Compound Lens", "Hard", ["lenses"]),
              P("o2", "USAPhO 2021/A3", "Thin Film Colors", "Very Hard", ["interference"], true),
            ],
          },
          {
            slug: "modern-physics",
            title: "Relativity & Quantum",
            description:
              "Special relativity kinematics, photoelectric effect, Bohr model, and de Broglie waves.",
            frequency: 2,
            minutes: 50,
            problems: [
              P("mp1", "USAPhO 2017/A2", "Relativistic Decay", "Very Hard", ["relativity"], true),
              P("mp2", "USAPhO 2013/B2", "Photon Rocket", "Insane", ["relativity"]),
            ],
          },
        ],
      },
    ],
  },
];

export function allModules(): { module: Module; division: Division; section: Section }[] {
  return DIVISIONS.flatMap((d) =>
    d.sections.flatMap((s) => s.modules.map((m) => ({ module: m, division: d, section: s })))
  );
}

export function findModule(slug: string) {
  return allModules().find((x) => x.module.slug === slug);
}

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Easy: "var(--diff-easy)",
  Normal: "var(--diff-normal)",
  Hard: "var(--diff-hard)",
  "Very Hard": "var(--diff-vhard)",
  Insane: "var(--diff-insane)",
};
