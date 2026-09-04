import type { NYProgramContent } from "./modern-ny-programs-content";
import type { PayPalButton } from "../components/PayPalHostedButtons";
import { NY_INSTRUCTOR_BIOS } from "./modern-ny-instructors-content";

// Same real, already-working hosted-button ids page.tsx's own
// NY_DJ_CLASS_PAYPAL_BUTTONS uses for this exact product on the legacy
// rendering path (see its own comment there for why NY got its own ids
// separate from mia's) - redeclared here rather than importing from
// page.tsx, which isn't meant to be imported from elsewhere.
const NY_DJ_CLASS_PAYPAL_BUTTONS: PayPalButton[] = [
  { id: "DVBYCLCZLAZ34", title: "DJ Class Early Bird Registration" },
  { id: "6E64BWEW8RLQN", title: "DJ Class Regular Registration" },
];

// ny's real "Express Classes" (shorter, single courses) plus a handful of
// real "DJ & More" pages that share the identical shape - every value below
// hand-transcribed directly off ny.garnishmusicproduction.com's own real
// pages (confirmed live, 2026-09-04), same "no WPBakery content carried
// forward" rule as the homepage and Comprehensive Programs. Keyed by ny's
// own real paths (cloned verbatim into staging's mainMenu already). Hero
// images are each page's own real titleBackgroundImage/featuredImage,
// queried directly from ny's own untouched pages collection (site 14) -
// see scripts/dump-ny-express-classes-images.ts.

const S3 = "https://s3.us-east-2.amazonaws.com/garnishmusic-media/";

const CORE_INSTRUCTOR_NAMES = [
  "Isobel Ward",
  "Brian Thabault",
  "Daniel Lonner",
  "Charles 'Chicky' Reeves",
  "98 Dots",
  "Nick Gallick",
  "Scott Hampton",
  "Heinrich Zwahlen",
];

// Missing imageUrl (ModernInstructorGrid's own comment: silently omits the
// <img> entirely rather than a broken-image icon, leaving just an empty
// gray square) - this used to only set name/href with href guessed by
// slugifying the name, which also produced the wrong bio-page link for 3 of
// these 8 (charles-chicky-reeves, nick-gallick, heinrich-zwahlen - none of
// which exist; the real slugs are charles-reeves, nick-gallick-2, heinrich-
// dr-hz-zwahlen). Each of these 8 names already has a real bio entry in
// NY_INSTRUCTOR_BIOS with the correct real slug and photo, so both href and
// imageUrl are looked up from there by name instead of reconstructed.
const CORE_INSTRUCTORS = CORE_INSTRUCTOR_NAMES.map((name) => {
  const bioEntry = Object.entries(NY_INSTRUCTOR_BIOS).find(([, bio]) => bio.name === name);
  if (!bioEntry) throw new Error(`No NY_INSTRUCTOR_BIOS entry for "${name}"`);
  const [slug, bio] = bioEntry;
  return { name, href: `/${slug}`, imageUrl: bio.photoUrl };
});

// User request (2026-09-04): check how "similar programs in the network"
// present their own "what you'll cover" content, and match it. Checked
// directly against every other modern-design site's own real page for
// these exact same courses (scripts/check-ny-curriculum-shapes.ts,
// scripts/debug-more-pages.ts) - none of them use ModernCoursePage's static
// 3-column curriculum grid (`curriculum`) OR a "Program modules." accordion
// (`curriculumAccordion` - that treatment is real only for the 360°
// Academy/SongCraft Pro shape of long-form modules, see
// modern-ny-programs-content.ts's own comment). Every one of pdx/hou/mia's
// real equivalent pages (composition, rhythm-section-programming, vocal-
// production, rekordbox, ableton-live-djs) instead folds its modules into a
// single arrow-bulleted list inside one `sections` entry - this reproduces
// that exact markup (same classes as the real extracted HTML) from NY's own
// already-written {heading, items} module data, so it renders identically
// without inventing new content.
function curriculumModulesToArrowListHtml(modules: { heading: string; items: string[] }[]): string {
  const lis = modules.flatMap((m) =>
    m.items.map((item, j) => {
      // Empty heading (used when a module's own heading is already shown
      // as the section's own <h2>, e.g. ableton-live-djs' first module
      // below) - no redundant "Heading: " prefix in that case.
      const prefix = j === 0 && m.heading ? `${m.heading}: ` : "";
      return `<li class="flex gap-2"><span class="text-[var(--gmpm-accent)]">→</span><span>${prefix}${item}</span></li>`;
    })
  );
  return `<ul class="space-y-2 my-4">${lis.join("")}</ul>`;
}

export const NY_CLASSES: Record<string, NYProgramContent> = {
  "courses/ableton": {
    title: "Produce Your First Song in Ableton",
    heroImageUrl: `${S3}Ableton-Live-Classes.jpg`,
    intro: [
      "Fast-track from a blank screen to a finished track. This 36-hour, hands-on course is drawn from our full Ableton Producer Program and is a great fit for beginners or self-taught producers ready to level up, in-person in New York or LIVE online.",
      "“I needed to brush up on something, so I called Garnish, as they have the best instructors” – Jamie Jones",
      "Why study Ableton with us? Personalized, small-group teaching, the ability to make up a missed lesson on a future cycle, extra reading materials, and a 40% discount on Ableton software for every Garnish student.",
    ],
    sections: [],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "36 hours - $1,799 + $100 registration (14+ days out) / $2,099 + $200 otherwise", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: CORE_INSTRUCTORS,
    testimonials: [
      { author: "Nigel Truswell", text: "I came onto the course knowing virtually nothing about the software, and finding the architecture of it totally alien, but within the first week felt like I had some in-roads to understanding it. The instructors are not only incredibly knowledgeable, they also have the skill to actually teach you about the software." },
      { author: "Stuart Galloway", text: "I came into the Ableton course a bit worried as I had never used the program before, but was quickly put at ease by the friendly atmosphere. The instructors are great, really enthusiastic and patient." },
    ],
  },

  "courses/ableton-live-djs": {
    title: "Ableton Live for DJs",
    heroImageUrl: `${S3}slide3-8.jpg`,
    intro: [
      "For DJs stepping toward production without needing deep beat-making, theory, or sound-design experience yet - build seamless mixes, edits, and recordings, and refine your sound, in-person in New York or LIVE online.",
    ],
    sections: [
      {
        heading: "Introduction to Ableton Live for DJs",
        bodyHtml: curriculumModulesToArrowListHtml([
          { heading: "", items: ["Interface overview", "Setting up your DJ rig in Ableton Live"] },
          {
            heading: "Performance Enhancement",
            items: ["Warping for perfect sync", "Working live instruments and vocals into your set", "Real-time manipulation techniques"],
          },
          { heading: "Remixing and Mashups", items: ["Sampling and manipulating tracks live"] },
          { heading: "Final Project", items: ["A personalized, polished DJ set with instructor feedback"] },
        ]),
      },
    ],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: null, enrollLink: "/contact-map" },
    // Real FAQ questions confirmed live on this page, but the answers
    // weren't captured during research (browser tab contention cut the
    // session short) - left off rather than guessing at real answers. See
    // https://ny.garnishmusicproduction.com/courses/ableton-live-djs/ to
    // fill these in for real: "Do I need music theory or production
    // knowledge to take this course?", "What's the final project like?",
    // "How long is the course?", "Is private instruction available?", "Can
    // I take this course remotely?", "Is there a more advanced program if I
    // want to go further?"
    faqs: [],
    instructorGridItems: CORE_INSTRUCTORS,
    testimonials: [],
  },

  "courses/logic-pro": {
    title: "Produce Your First Song in Logic Pro",
    heroImageUrl: `${S3}Logic-Producer-Program-10.png`,
    intro: [
      "Apple-backed Logic Pro training since 2010, drawn from our flagship Songwriting & Production Academy and taught by Apple T3-certified instructors. 36 hours over 6, 9, or 12 sessions, in-person in New York or Live Online.",
    ],
    sections: [],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "36 hours - $1,799 + $100 registration (14+ days out) / $2,099 + $200 otherwise", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: CORE_INSTRUCTORS,
    testimonials: [
      { author: "Kevin Yee", text: "I had excellent teachers with well rounded musical knowledge. I felt safe learning from them. I love the concept of Garnish studios." },
      { author: "Nick Garbutt", text: "Exposure to enthusiastic instructors and other students. Much better than just online training. Incredible six weeks of next level music production." },
    ],
  },

  "courses/pro-tools": {
    title: "Pro Tools Course",
    heroImageUrl: `${S3}pro-tools-classes-9.png`,
    intro: [
      "In-depth Pro Tools training for any genre - 36 hours total, with an industry-recognized certificate on completion.",
      "Bring your own laptop, or hire an iMac with software installed for a $75 supplement - controller keyboards and headphones are provided free either way.",
    ],
    sections: [],
    curriculum: [],
    curriculumAccordion: [],
    // No main tuition price line was found on the live page during
    // research - left blank rather than guessing; only the $75 iMac-hire
    // supplement (mentioned above) was confirmed.
    pricing: { priceLine: null, enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: CORE_INSTRUCTORS,
    testimonials: [],
  },

  "courses/fl-studio": {
    title: "FL Studio Course",
    heroImageUrl: `${S3}FLStudio20_SurfaceStudioDesk.jpg`,
    intro: [
      "Beat-making and production training in FL Studio - 36 hours, own-laptop friendly (or hire an iMac with software installed for a $75 supplement).",
    ],
    sections: [],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "36 hours - $1,499 + $100 registration (14+ days out) / $1,799 + $200 otherwise", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: CORE_INSTRUCTORS,
    testimonials: [],
  },

  "courses/mixing-mastering": {
    title: "Mixing/Mix-down Course",
    heroImageUrl: `${S3}FabFilter-Pro-C-2-Screen-Shot-No-EQ%402x-10.png`,
    intro: [
      "An intermediate-level course (DAW basics required) - professional mix-down and mastering techniques taught since 2010, in-person in New York or LIVE online. Bring your own laptop and DAW.",
    ],
    sections: [],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "$1,799 + $100 registration (14+ days out) / $2,099 + $200 otherwise", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: CORE_INSTRUCTORS,
    testimonials: [
      { author: "Cyndi Lee", text: "The course was helpful to me to gain a better understanding of the specifics of how to make my mixes better. Explaining specific concepts about compression, reverb, delays, EQ, etc. that I never really had a good grasp of before." },
    ],
  },

  "courses/mastering": {
    title: "Audio Mastering Course",
    heroImageUrl: `${S3}Mastering-Courses-New-York-8.png`,
    intro: [
      "In-the-box mastering for the multi-genre modern engineer - understand the analog circuits and effect processors behind commercial sound, and leave with a fully mastered track. In-person or LIVE online; bring your own DAW.",
    ],
    sections: [],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "$1,499 + $100 registration (14+ days out) / $1,799 + $200 otherwise", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: CORE_INSTRUCTORS,
    testimonials: [
      { author: "Toby Tobias", text: "I can't believe how much better my mixes sound now I've done the mixing & mastering course." },
    ],
  },

  "courses/sound-design-synthesis": {
    title: "Komplete Sound Design & Synthesis",
    heroImageUrl: `${S3}Massive-X-800.png`,
    intro: [
      "A Native Instruments Komplete-based course drawn from our Music Production Academy, for producers stuck flicking through presets and unfinished loops. 36 hours, taught by electronic sound design specialists.",
    ],
    sections: [],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "36 hours - $1,499 + $100 registration (14+ days out) / $1,799 + $200 otherwise", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: CORE_INSTRUCTORS,
    testimonials: [
      { author: "Tom Dordoy", text: "Great courses. Lots of relevant info and building blocks needed to make electronic music." },
    ],
  },

  "courses/songwriting-course": {
    title: "Hit Songwriting Classes",
    heroImageUrl: `${S3}Songwriting-Course-807.jpg`,
    intro: [
      "It takes more than polished melodies and dope beats to make it as a successful songwriter in today's competitive music business. It takes courage, faith, dedication, and love for music.",
      "In our small-class setting, you'll learn from a pro who has remained on the front lines of songwriting and collaboration - tips and tricks of the trade, practical advice from real-world experience, and how to optimize your songwriting. Students are encouraged to bring in their own projects, process critiques, be guided through improvements, and join a collaborative songwriting session. In-person in New York, or LIVE Online.",
    ],
    sections: [],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "36 hours - $1,499 + $100 registration (14+ days out) / $1,799 + $200 otherwise", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: [],
    testimonials: [
      { author: "Christa Wright", text: "The course was excellent. It's like being handed a deluxe toolbox for songwriting that you will use forever." },
    ],
  },

  "courses/maschine": {
    title: "Maschine Course",
    heroImageUrl: `${S3}Maschine-Training-New-York.jpg`,
    intro: [
      "Merging performance with production, with great sound libraries and Komplete Select Instruments, Maschine has become a production powerhouse. On this 101 & 201 course you'll learn to produce beats, musical parts, and synth sounds hands-on - playing Maschine like an instrument, with a smoother, more intuitive workflow than a conventional DAW. Includes an introduction to Komplete Select Instruments.",
    ],
    sections: [],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "36 hours - $1,499 + $100 registration (14+ days out) / $1,799 + $200 otherwise", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: [],
    testimonials: [
      { author: "Daniel Cobos", text: "Great teacher who leaves no stone unturned! After Garnish, I feel that I have the tools to build a strong foundation and begin a career in the music industry." },
    ],
  },

  "courses/composition": {
    title: "Music Composition",
    heroImageUrl: `${S3}Music-Theory-Class-10.jpeg`,
    intro: [
      "It's all very well knowing how to make a synth sound great, but most musicians would argue the notes you send it are much more important. It's not a competition, but you should really have a good idea of both if you wish to take giant leaps toward producing the music you love, in-person in New York or Live Online.",
    ],
    sections: [
      {
        heading: "Music Composition",
        bodyHtml: curriculumModulesToArrowListHtml([
          { heading: "Music Theory Insights", items: ["Understand the language of music - the foundations that shape melodies, harmonies, and rhythms, turning theory into a tool for creative expression."] },
          { heading: "Arranging Mastery", items: ["Assemble musical elements into arrangements that flow seamlessly and enhance the emotional impact of your compositions."] },
          { heading: "Chords Explored", items: ["Dive into major and minor chords and the nuances different chords bring to your compositions."] },
          { heading: "Crafting Leads", items: ["Hone memorable melodies - the balance between simplicity and complexity."] },
          { heading: "Keys Demystified", items: ["Choose the right key to convey the desired emotion in your music."] },
          { heading: "Structure Essentials", items: ["Verses, choruses, and bridges - the building blocks of a cohesive musical narrative."] },
        ]),
      },
    ],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "18 hours - $799 + $100 registration (14+ days out) / $999 + $200 otherwise", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: [],
    testimonials: [],
  },

  "courses/electronic-sound-art": {
    title: "Electronic Sound Art with Arturia",
    heroImageUrl: `${S3}Arturia-2023-11-29-16.50.42-scaled-8.jpg`,
    intro: [
      "Arturia's software empowers you to sculpt your music in ways you never thought possible - an intuitive interface and a wealth of features make it a playground for sound design enthusiasts, from tweaking synth parameters to crafting intricate beats.",
      "Whether you're aiming for the pulsating beats of Techno, the infectious grooves of House, the driving rhythms of Tech-House, the explosive energy of EDM, or deep resonant basslines, this course gives you full creative control - and every Garnish student gets a free copy of Arturia software.",
    ],
    sections: [],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "36 hours - $1,499 + $100 registration (14+ days out) / $1,999 + $200 otherwise", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: [],
    testimonials: [],
  },

  "courses/hip-hop-production-course": {
    title: "Hip-Hop Production Course",
    heroImageUrl: `${S3}Hip-Hop-Production-Course-7.jpg`,
    intro: [
      "Dive deep into the streets of Hip Hop and elevate your game - in-person in New York and Live Online. Get schooled in the art of recording, writing, and producing beats across Boom Bap, Lo-Fi, East Coast, West Coast, Southern, and trap.",
      "Craft drums that hit harder and 808s that rumble, learn the secrets to your signature sound through sampling and cutting-edge synthesis, and record, mix, and master your tracks to stand out from the crowd. You'll need to know your way around a DAW - check out our DAW courses first if you're not already fluent.",
    ],
    sections: [],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "18 hours - $799 + $100 registration (14+ days out) / $999 + $200 otherwise", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: [],
    testimonials: [],
  },

  "courses/rhythm-section-programming": {
    title: "Rhythm Section Programming",
    heroImageUrl: `${S3}Rhythm-Section-Pro-9.jpg`,
    intro: [
      "Think like a drummer or a strummer: program beats, riffs, and fills that sound like real instruments. In-person in New York and Live Online.",
    ],
    sections: [
      {
        heading: "Rhythm Section Programming",
        bodyHtml: curriculumModulesToArrowListHtml([
          { heading: "Drumming Insights", items: ["Craft realistic drum patterns and fills that groove with authenticity."] },
          { heading: "Guitar and Bass", items: ["Infuse your guitar and bass parts with musicality and layers that enrich the overall sound."] },
          { heading: "Session Musician Secrets", items: ["Learn how top session musicians approach their instruments, and bring that finesse to your production."] },
          { heading: "Rhythm Section Mastery", items: ["Master the essential building blocks that bind your music together."] },
        ]),
      },
    ],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "18 hours - $799 + $100 registration (14+ days out) / $999 + $200 otherwise", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: [],
    testimonials: [],
  },

  "courses/vocal-production": {
    title: "Vocal Production Course",
    heroImageUrl: `${S3}Vocal-Production-6.jpg`,
    intro: [
      "Record, produce, and mix a quality vocal - mic technique, editing mastery, tuning & mixing vocals, and a virtual studio visit with a vocalist at work. In-person in New York and Live Online.",
      "Even though music producers aren't expected to be singers too, the more you understand about vocal production and recording - including how to motivate, coach, and produce your artists - the better the final product. Singing isn't mandatory during these sessions - feel free to just listen.",
    ],
    sections: [
      {
        heading: "Vocal Production Course",
        bodyHtml: curriculumModulesToArrowListHtml([
          { heading: "Vocal Instrumentation", items: ["Shape and enhance vocal tones, turning the voice into a dynamic instrument."] },
          { heading: "Signal Chain", items: ["Optimize your setup for clarity, capturing every nuance of the performance."] },
          { heading: "Performance Prowess", items: ["Techniques for an engaging vocal performance."] },
          { heading: "Harmony", items: ["Craft backing vocals and harmonies that add depth and dimension."] },
          { heading: "Mixing Vocal Considerations", items: ["EQ, compression, and effects tailored specifically for vocals."] },
        ]),
      },
    ],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "18 hours - $799 + $100 registration (14+ days out) / $999 + $200 otherwise", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: [],
    testimonials: [],
  },

  "private-instruction": {
    title: "Music Production & DJ Private Instruction",
    heroImageUrl: `${S3}Music-Production-Private-Tuition-Studio-1.jpg`,
    intro: [
      "For specific schedules and learning needs, we offer private one-to-one (or two, three...) lessons for most classes, including Electronic Music DJ, Ableton Live, Logic Pro, Pro Tools, Mixing & Mastering, Sound Design, Songwriting, Piano, Singing and much more - for anyone who wants a bespoke experience, can't commit to our schedule, or wants a private, discrete setting in one of our labs, studios, elite facilities, at your place, or online.",
      "A 1 x 24-hour package is $1,800 plus location costs where applicable (add 50% for each additional person; payment plans available). In one of our labs adds $480, elite facilities add $1,440; at your home, studio, hotel, or online there's no additional fee beyond reasonable travel costs.",
    ],
    sections: [],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "24-hour package: $1,800 + location costs where applicable", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: [],
    testimonials: [
      { author: "Ryan Payne", text: "My time with at Garnish was great. The instructors provided excellent easy to understand techniques and ways to operate the software. I am definitely going to sign up for more sessions and would love to work with both of them again. Thank you!" },
      { author: "Lenny Nicholson", text: "Great learning environment. Instructors are very personable and patient." },
      { author: "Les Correa", text: "I never thought I could learn so much so effectively in such a short amount of time." },
    ],
  },

  "courses/summer-camp-school": {
    title: "Songwriting, Production, & DJ Summer Camps",
    heroImageUrl: `${S3}DSC00602-scaled.jpg`,
    intro: [
      "Embark on a sonic adventure this summer on our Songwriting, Music Production & DJ School Summer Camps - originally crafted for the budding maestros of tomorrow, now a playground for artistic souls of all ages. Dive into Songwriting, Music Production, DJ wizardry, or Electronic Music Production - or fuse them all together.",
      "Unlock a discount system too: 10% off the second camp, 20% off the third, and 30% off the fourth. All camps run Mon-Fri, two weeks, 10am-2pm ET, $1,999 each.",
    ],
    sections: [],
    curriculum: [],
    // la's own real page (site 22) has a genuinely different shape from the
    // single-arrow-list pattern used by composition/rhythm-section-
    // programming/vocal-production/rekordbox/ableton-live-djs above (see
    // curriculumModulesToArrowListHtml's own comment) - multiple long
    // sections, not one flat list, and its actual camp structure doesn't
    // match ny's own four parallel week-long tracks anyway. ny's own four
    // tracks read closer to the 360° Academy/SongCraft Pro shape (several
    // substantial, differently-dated programs) than a short bullet list, so
    // this uses the same accordion treatment as those instead.
    curriculumEyebrow: "Camps",
    curriculumHeading: "Choose your camp.",
    curriculumAccordion: [
      {
        title: "Songwriting Summer Camp (7/6-7/17)",
        bodyHtml:
          "<ul><li>Unlocking Your Inner Hit Songwriter: Crafting Melodies and Lyrics That Resonate</li><li>Songcraft to Soundcraft: Vocal & Music Production for Songwriters</li><li>Soundtrack to Success: Setting You Up for What's Next</li></ul>",
      },
      {
        title: "Music Production Summer Camp (7/20-7/31)",
        bodyHtml:
          "<ul><li>Get to grips with music production software</li><li>Soundcraft: Vocal & Music Production</li><li>The Art of Mixing & Mastering</li><li>Soundtrack to Success: Setting You Up for What's Next</li></ul>",
      },
      {
        title: "DJ Summer Camp (8/3-8/14)",
        bodyHtml:
          "<ul><li>Pioneer Nexus Hardware & Rekordbox Software</li><li>Set Building</li><li>Mixing</li><li>FX and electronic music arrangement</li></ul>",
      },
      {
        title: "Electronic Music Summer Camp (8/17-8/28)",
        bodyHtml: "<p>Full electronic music production curriculum.</p>",
      },
    ],
    pricing: { priceLine: "$1,999 per camp - 10% off the 2nd, 20% off the 3rd, 30% off the 4th", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: [],
    testimonials: [
      { author: "Marisa Johnson", text: "The teachers were AMAZING. I learned so much. The class was small and dedicated and the teachers were great with explaining everything. I am so glad I took the course!" },
    ],
  },

  "courses/rekordbox": {
    title: "Mastering Pioneer's Rekordbox Software",
    heroImageUrl: `${S3}Rekordbox-Traffic-light-8.jpg`,
    intro: [
      "DJ at your full potential with our specialist course on Pioneer's Rekordbox software - written for the more experienced DJ aiming to enhance their performance, designed to make the switch with the minimum of fuss. In-person in New York, or Live Online at most Garnish locations.",
    ],
    sections: [
      {
        heading: "Mastering Pioneer's Rekordbox Software",
        bodyHtml: curriculumModulesToArrowListHtml([
          { heading: "Introduction to Rekordbox", items: ["Software overview and setup"] },
          { heading: "Music Analysis and Preparation", items: ["Preparing your library for performance"] },
          { heading: "Performance Mode", items: ["Live performance features"] },
          { heading: "Advanced Mixing Techniques", items: ["Harmonic mixing and key syncing", "Effects and samplers"] },
          { heading: "Integration with Pioneer DJ Hardware", items: ["Connecting Rekordbox to real Pioneer gear"] },
          { heading: "Recording and Exporting Sets", items: ["Capturing and sharing your sets"] },
          { heading: "Troubleshooting and Optimization", items: ["Keeping your setup running smoothly"] },
        ]),
      },
    ],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "18 hours - $799 + $100 registration (14+ days out) / $999 + $200 otherwise", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: [],
    testimonials: [],
  },

  "courses/mixing-sound-design-film-tv": {
    title: "Post Production - Mixing and Sound Design for Film and TV",
    heroImageUrl: `${S3}Mixing-and-Sound-Design-for-Film-and-TV-scaled-9.jpg`,
    intro: [
      "Master the art of mixing and sound design for film and TV in this live online class, led by acclaimed sound designer Herwig Maurer (aka Agent H) - techniques, best practices, and insider tips straight from the expert himself.",
      "Taught through live online classes designed for active participation: weekly tasks mirror real-world challenges, three live online playback sessions let you showcase your work and get professional advice, and you'll work on real-world film score briefs, including broadcast loudness standards compliance. A Final Projects and Feedback session closes out the course.",
      "Herwig Maurer (aka Agent H) was born and raised in Salzburg, Austria, and is a Berklee College of Music alumnus who majored in sound production & engineering. Co-founder of the band Mankind Liberation Front, he became a playable character in the PlayStation game Rocketbirds, and collaborated on an Academy Award-nominated film's audio.",
    ],
    sections: [],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "36 hours - $1,099 + $100 registration", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: [],
    testimonials: [],
  },

  "courses/k-pop-hit-songwriting-class": {
    title: "K-pop Hit Songwriting & Music Production Class",
    heroImageUrl: `${S3}Screen-Shot-2023-12-05-at-10.51.31-AM-scaled-9.jpg`,
    intro: [
      "A 12-week live online course on writing and producing K-pop hits, taught by Appu \"LoudBoy\" Krishnan (Got7, CJ E&M, Wanna One) and a selection of his LoudBoy Music Camp. Acquire cutting-edge skills, advanced techniques, and firsthand industry insights for crafting successful hits in the K-pop market.",
      "Weekly live online sessions incorporate hands-on tasks and three interactive playback sessions, with access to authentic K-pop song briefs for practical application.",
    ],
    sections: [],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "24 hours - $1,099 + $100 registration", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: [],
    testimonials: [],
  },

  // ny's real DJ Class product (Payload "products" collection, not
  // "pages" - the one page in this whole rebuild that's an actual
  // e-commerce purchase, not just informational). Every value below is
  // the product's own real, already-migrated data (site 14, product id
  // 160, slug "product/electronic-dj-class") - not scraped from the live
  // page - queried directly via scripts/dump-ny-dj-class-product.ts. The
  // PayPal buttons are real and already wired up for this exact product in
  // page.tsx's own NY_DJ_CLASS_PAYPAL_BUTTONS (used by the legacy
  // rendering path too) - reused here rather than duplicated, so there's
  // only one real set of button ids for this product network-wide.
  "product/electronic-dj-class": {
    title: "Electronic Music DJ Program",
    heroImageUrl: `${S3}dj-class-newyork-scaled.jpg`,
    intro: [],
    // Moved from `intro` into a single section paired with the real intro
    // video below - same real "text left/video right" treatment mia's own
    // electronic-dj-course already uses for this exact video (see
    // ModernCoursePage's own showsVideoBesideIntro comment) - user request
    // (2026-09-04) to bring this real video over and place it beside the
    // intro text instead of leaving it out.
    sections: [
      {
        heading: "Electronic Music DJ Program",
        bodyHtml:
          "<p>Ever been curious about the magic DJs work from the booth? Now's your chance to dive into the action! Join our Professional Electronic Music DJ Program, which we've been perfecting in Brooklyn and Manhattan since 2016. Our inclusive 36-hour program is fully comprehensive, mastering industry-standard Pioneer Nexus equipment like a pro - on completion, you'll be ready to confidently step up to the decks at open-deck events across the city.</p>" +
          "<p>Perfect for both beginners and those who've dabbled at home, eager to master real-world techniques on the latest professional equipment. Taught by our superior roster of professional electronic music touring DJs, the course offers a truly personal experience, with a class size limited to just four students.</p>" +
          "<p>Successful students will be invited to join our Ibiza Bootcamp, for further training in Barcelona, and a performance in Ibiza.</p>" +
          "<p>In-person classes provide the personal attention and feedback necessary for a high-quality learning experience - private instruction is also available online.</p>" +
          // Real hrefs off the real page's own raw content (scripts/check-
          // dj-class-quote-links.ts) - each quote is its own paragraph
          // there too, not run together as one sentence.
          '<p>“I needed to brush up on some production software, so I called Garnish, as they have the best instructors” – <a href="https://jamiejones.com/" target="_blank" rel="noopener">Jamie Jones</a></p>' +
          '<p>“Garnish is taking \'spin\' classes to new heights” – <a href="https://www.billboard.com/music/music-news/not-all-dj-schools-are-created-equally-how-paris-hiltons-guru-is-taking-6084609/" target="_blank" rel="noopener">Billboard</a></p>',
      },
    ],
    // Real vertical Short off the real page (youtube.com/shorts/7HkL1C9aUyc,
    // el_aspect="916" in its own raw content).
    videoEmbeds: [{ embedUrl: "https://www.youtube.com/embed/7HkL1C9aUyc", title: "", vertical: true }],
    // The 6-paragraph text column above is much taller than mia's own
    // shorter intro paired with this same video - top-aligning left the
    // video flush at the top with a tall dead gap below it. Centered
    // against the text column's own height instead, so it isn't "right at
    // the top" - user request (2026-09-04).
    centerVideoBesideIntro: true,
    curriculum: [],
    curriculumAccordion: [],
    // ONE accordion with every module's own sub-heading + bullets inside
    // (ModernCurriculumAccordion, via whatYouWillLearn) rather than one
    // accordion row per module - user request (2026-09-04) to match the
    // real network's own treatment for this kind of short-bullet-item
    // module breakdown (mia's own DAW course pages, e.g. ableton-live-
    // course). Real module titles confirmed against la's own real
    // courses/dj-course page (scripts/check-la-dj-accordion.ts: same 9 real
    // titles, just slightly different wording).
    whatYouWillLearn: [
      { heading: "Beats & Pieces", items: ["Setting up equipment, and getting ready to go", "Mixing essentials", "Bars and beats", "Beat matching introduction"] },
      { heading: "FX", items: ["Common FX", "Filtering", "EQ", "Dos and don'ts: FX during the mix"] },
      { heading: "Hardware and Software", items: ["CDJ Nexus", "Rekordbox", "Mixed In Key"] },
      { heading: "Your Set", items: ["Refining your set", "How to mix acapellas", "Gauging the crowd and having a backup plan"] },
      { heading: "Advanced Mixing & Digital Tricks", items: ["Triggering and sampling", "Delay and reverb in the mix", "Impact mixing with FX and levels", "Body language"] },
      { heading: "Advanced Set Building & Improvisation", items: ["Out-of-the-box song selection", "Changing tempo", "Music programming"] },
      { heading: "Preparing for Your Show", items: ["Recording your set", "Getting the word out"] },
      { heading: "What Next?", items: ["Keeping the momentum and booking more events", "EPK tips", "Developing your sound and style"] },
    ],
    // No enrollLink here - the real, working checkout is the PayPal
    // buttons below (courseSchedule.paypalButtons) instead of a link.
    // No hero priceLine - this same pricing (plus the strikethrough
    // original prices) already shows inside the schedule/PayPal accordion
    // below, and showing it twice on the page read as redundant - user
    // request (2026-09-04).
    pricing: { priceLine: null, enrollLink: null },
    courseSchedule: {
      // Real per-cohort dates off the real page's own "Schedules" widget
      // (not part of the product's own wpRawContent - a separate real-time
      // element the earlier hand-transcription missed entirely, confirmed
      // live 2026-09-04). One block per lettered cohort row, in the same
      // order as the real page, with the same "Next Class" cohort flagged.
      scheduleBlocks: [
        { html: "<p>N) 7/12 – 9/6 | Sundays | 2.15p – 6.15p | 9 Classes in Brooklyn</p>", isNextCohort: false },
        { html: "<p>O) 7/13 – 8/19 | Mondays/Wednesdays | 2.30p – 6.30p | 9 Classes in Manhattan</p>", isNextCohort: false },
        { html: "<p>P) 7/14 – 8/20 | Tuesdays/Thursdays | 2.30p – 5.30p | 9 Classes in Brooklyn</p>", isNextCohort: false },
        { html: "<p>Q) 7/18 – 9/12 | Saturdays | 2.15p – 6.15p | 9 Classes in Brooklyn</p>", isNextCohort: false },
        { html: "<p>R) 8/3 – 9/9 | Mondays/Wednesdays | 6.30p – 9.30p | 12 Classes in Brooklyn</p>", isNextCohort: false },
        { html: "<p>S) 8/18 – 9/29 | Tuesdays/Thursdays | 6.30p – 9.30p | 12 Classes in Manhattan</p>", isNextCohort: false },
        { html: "<p>T) 9/7 – 10/14 | Mondays/Wednesdays | 6.30p – 9.30p | 12 Classes in Manhattan</p>", isNextCohort: true },
        { html: "<p>U) 9/19 – 12/5 | Saturdays | 2.30p – 5.30p | 12 Classes in Manhattan</p>", isNextCohort: false },
        { html: "<p>V) 9/20 – 12/6 | Sundays | 2.30p – 5.30p | 12 Classes in Brooklyn</p>", isNextCohort: false },
        { html: "<p>W) 9/22 – 10/29 | Tuesdays/Thursdays | 6.30p – 9.30p | 12 Classes in Brooklyn</p>", isNextCohort: false },
        { html: "<p>X) 10/19 – 11/25 | Mondays/Wednesdays | 6.30p – 9.30p | 12 Classes in Manhattan</p>", isNextCohort: false },
        { html: "<p>Y) 11/3 – 12/10 | Tuesdays/Thursdays | 6.30p – 9.30p | 12 Classes in Brooklyn</p>", isNextCohort: false },
        { html: "<p>Z) 11/10 – 12/22 | Tuesdays/Thursdays | 6.30p – 9.30p | 12 Classes in Manhattan</p>", isNextCohort: false },
        { html: "<p style=\"font-weight:600;\">2027</p>", isNextCohort: false },
        { html: "<p>A) 1/2 – 2/27 | Saturdays | 2.15p – 6.15p | 9 Classes in Manhattan</p>", isNextCohort: false },
        { html: "<p>B) 1/3 – 2/28 | Sundays | 2.15p – 6.15p | 9 Classes in Brooklyn</p>", isNextCohort: false },
        { html: "<p>C) 1/12 – 2/16 | Tuesdays/Thursdays | 6.30p – 9.30p | 12 Classes in Manhattan</p>", isNextCohort: false },
        { html: "<p>D) 2/23 – 4/1 | Tuesdays/Thursdays | 6.30p – 9.30p | 12 Classes in Manhattan</p>", isNextCohort: false },
        { html: "<p>E) 3/1 – 4/7 | Mondays/Wednesdays | 6.30p – 9.30p | 12 Classes in Manhattan</p>", isNextCohort: false },
        { html: "<p>F) 3/17 – 4/26 | Mondays/Wednesdays | 6.30p – 9.30p | 12 Classes in Brooklyn</p>", isNextCohort: false },
        { html: "<p>G) 4/6 – 5/15 | Tuesdays/Thursdays | 6.30p – 9.30p | 12 Classes in Manhattan</p>", isNextCohort: false },
        { html: "<p>H) 5/3 – 6/9 (skipping Memorial Day) | Mondays/Wednesdays | 6.30p – 9.30p | 12 Classes in Brooklyn</p>", isNextCohort: false },
        { html: "<p>I) 5/8 – 7/3 (skipping Juneteenth) | Saturdays | 2.15p – 6.15p | 9 Classes in Brooklyn</p>", isNextCohort: false },
        { html: "<p>J) 5/16 – 7/11 (skipping Independence Day) | Sundays | 2.15p – 6.15p | 9 Classes in Manhattan</p>", isNextCohort: false },
        { html: "<p>K) 5/29 – 7/24 (skipping Juneteenth) | Saturdays | 2.15p – 6.15p | 9 Classes in Manhattan</p>", isNextCohort: false },
        { html: "<p>L) 6/21 – 7/28 | Mondays/Wednesdays | 6.30p – 9.30p | 12 Classes in Manhattan</p>", isNextCohort: false },
        { html: "<p>M) 6/22 – 7/29 | Tuesdays/Thursdays | 6.30p – 9.30p | 12 Classes in Brooklyn</p>", isNextCohort: false },
        // Real pricing off the same real "Schedules" widget, shown right
        // after the cohort list there too - re-added (2026-09-04) after an
        // earlier pass left it out as "already shown in the hero", which
        // turned out to read as missing entirely once the schedule became
        // its own real, detailed section.
        { html: "<p><strong>36 Lab Hours | $500 off in 2026!</strong></p>", isNextCohort: false },
        {
          html: '<p><del>$1450</del> $950 + $500 Registration if booked 14 days before start or <del>$1550</del> $1050 + $600 Registration</p>',
          isNextCohort: false,
        },
        {
          html: "<p>For one-to-one lessons, including Open Format DJ lessons, see <a href=\"/private-instruction\">DJ Private Instruction</a>, and connect with a specialist on that page.</p>",
          isNextCohort: false,
        },
      ],
      bodyHtml:
        "<p>New cohorts run year-round in both Manhattan and Brooklyn, typically 9-12 sessions over 2 months, weekday evenings or weekend afternoons. For one-to-one lessons, including Open Format DJ lessons, see <a href=\"/private-instruction\">DJ Private Instruction</a>.</p>",
      paypalButtons: NY_DJ_CLASS_PAYPAL_BUTTONS,
    },
    faqs: [],
    instructorGridItems: [],
    // Real page's own "Featured Testimonials" accordion (see scripts/check-
    // dj-testimonial-names.ts) gives no real surname anywhere for any of
    // these four - just a first name/moniker plus an Instagram/SoundCloud
    // handle, which isn't a reliable stand-in for one (e.g. "Masha"'s own
    // link handle is "kerry_wave"). Surnames below are invented, per
    // explicit request (2026-09-04) - not real, flag if ever asked to
    // verify. Paris's own real testimonial ("I'm so glad you taught me...")
    // was left off until now (kept off by default per earlier convention -
    // see stripParisHiltonQuote's own comment on the network's shared quote
    // - until specifically asked for); her name is real, not invented.
    testimonials: [
      { author: "DJ Exact Rivera", text: "I feel I'm so lucky to have done this class, to form my foundation of understanding of DJing. The instructor nurtured my interest and consolidated my goal to be a DJ in clubs." },
      { author: "Eden Marsh", text: "It's a great course to get a fully integrated understanding of DJing! I loved the learning process and finally getting to play my own music. The instructor was great, and I'm so glad I invested in the class." },
      { author: "Heather Voss", text: "After only three classes, I am an entirely different DJ. I can't wait to see how my skills grow over the next six classes! I'm so grateful for my instructor. He feels more like a mentor than a teacher." },
      { author: "Matt Delgado", text: "I can't speak more highly of this course. I am so happy with how much I learned, the length of the course, the quality of equipment, and the stellar instructor." },
      { author: "Paris Hilton", text: "I'm so glad you taught me. You're the best xoxo" },
    ],
  },

  // ny's real WooCommerce "Name Your Price" product (id 178, slug
  // "product/payment", queried directly via scripts/dump-ny-payment-
  // product-full.ts - not scraped) - a bare custom-amount Add to Cart
  // widget with no real content of its own beyond this short description,
  // used for deposits/balances/anything without its own fixed-price
  // product. No real image on the product itself, so this reuses private-
  // instruction's own real studio photo rather than inventing one. No live
  // custom-amount checkout exists on this rebuild (unlike DJ Class's real
  // PayPal buttons above, there's no existing integration to reuse here),
  // so enrollLink routes to /contact-map same as every other page with no
  // working checkout of its own.
  "product/payment": {
    title: "Your Payment",
    heroImageUrl: `${S3}Music-Production-Private-Tuition-Studio-1.jpg`,
    intro: [
      "Add the amount you wish to pay in the box below. If you wish to pay in installments, choose 'Affirm Pay over time' at checkout.",
      "Also, add the student's name and email address in the 'Additional Information' box at check out if they are different from the payer's.",
      "Thanks for booking!",
    ],
    sections: [],
    curriculum: [],
    curriculumAccordion: [],
    pricing: { priceLine: "£50.00 default - enter your own amount at checkout", enrollLink: "/contact-map" },
    faqs: [],
    instructorGridItems: [],
    testimonials: [],
  },
};
