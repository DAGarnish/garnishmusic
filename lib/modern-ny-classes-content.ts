import type { NYProgramContent } from "./modern-ny-programs-content";
import type { PayPalButton } from "../components/PayPalHostedButtons";

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

const CORE_INSTRUCTORS = CORE_INSTRUCTOR_NAMES.map((name) => ({
  name,
  href: `/courses/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
}));

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
    sections: [],
    curriculum: [
      {
        heading: "Introduction to Ableton Live for DJs",
        items: ["Interface overview", "Setting up your DJ rig in Ableton Live"],
      },
      {
        heading: "Performance Enhancement",
        items: ["Warping for perfect sync", "Working live instruments and vocals into your set", "Real-time manipulation techniques"],
      },
      {
        heading: "Remixing and Mashups",
        items: ["Sampling and manipulating tracks live"],
      },
      {
        heading: "Final Project",
        items: ["A personalized, polished DJ set with instructor feedback"],
      },
    ],
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
    sections: [],
    curriculum: [
      { heading: "Music Theory Insights", items: ["Understand the language of music - the foundations that shape melodies, harmonies, and rhythms, turning theory into a tool for creative expression."] },
      { heading: "Arranging Mastery", items: ["Assemble musical elements into arrangements that flow seamlessly and enhance the emotional impact of your compositions."] },
      { heading: "Chords Explored", items: ["Dive into major and minor chords and the nuances different chords bring to your compositions."] },
      { heading: "Crafting Leads", items: ["Hone memorable melodies - the balance between simplicity and complexity."] },
      { heading: "Keys Demystified", items: ["Choose the right key to convey the desired emotion in your music."] },
      { heading: "Structure Essentials", items: ["Verses, choruses, and bridges - the building blocks of a cohesive musical narrative."] },
    ],
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
    sections: [],
    curriculum: [
      { heading: "Drumming Insights", items: ["Craft realistic drum patterns and fills that groove with authenticity."] },
      { heading: "Guitar and Bass", items: ["Infuse your guitar and bass parts with musicality and layers that enrich the overall sound."] },
      { heading: "Session Musician Secrets", items: ["Learn how top session musicians approach their instruments, and bring that finesse to your production."] },
      { heading: "Rhythm Section Mastery", items: ["Master the essential building blocks that bind your music together."] },
    ],
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
    sections: [],
    curriculum: [
      { heading: "Vocal Instrumentation", items: ["Shape and enhance vocal tones, turning the voice into a dynamic instrument."] },
      { heading: "Signal Chain", items: ["Optimize your setup for clarity, capturing every nuance of the performance."] },
      { heading: "Performance Prowess", items: ["Techniques for an engaging vocal performance."] },
      { heading: "Harmony", items: ["Craft backing vocals and harmonies that add depth and dimension."] },
      { heading: "Mixing Vocal Considerations", items: ["EQ, compression, and effects tailored specifically for vocals."] },
    ],
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
    curriculum: [
      { heading: "Songwriting Summer Camp (7/6-7/17)", items: ["Unlocking Your Inner Hit Songwriter: Crafting Melodies and Lyrics That Resonate", "Songcraft to Soundcraft: Vocal & Music Production for Songwriters", "Soundtrack to Success: Setting You Up for What's Next"] },
      { heading: "Music Production Summer Camp (7/20-7/31)", items: ["Get to grips with music production software", "Soundcraft: Vocal & Music Production", "The Art of Mixing & Mastering", "Soundtrack to Success: Setting You Up for What's Next"] },
      { heading: "DJ Summer Camp (8/3-8/14)", items: ["Pioneer Nexus Hardware & Rekordbox Software", "Set Building", "Mixing", "FX and electronic music arrangement"] },
      { heading: "Electronic Music Summer Camp (8/17-8/28)", items: ["Full electronic music production curriculum"] },
    ],
    curriculumAccordion: [],
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
    sections: [],
    curriculum: [
      { heading: "Introduction to Rekordbox", items: ["Software overview and setup"] },
      { heading: "Music Analysis and Preparation", items: ["Preparing your library for performance"] },
      { heading: "Performance Mode", items: ["Live performance features"] },
      { heading: "Advanced Mixing Techniques", items: ["Harmonic mixing and key syncing", "Effects and samplers"] },
      { heading: "Integration with Pioneer DJ Hardware", items: ["Connecting Rekordbox to real Pioneer gear"] },
      { heading: "Recording and Exporting Sets", items: ["Capturing and sharing your sets"] },
      { heading: "Troubleshooting and Optimization", items: ["Keeping your setup running smoothly"] },
    ],
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
    intro: [
      "Ever been curious about the magic DJs work from the booth? Now's your chance to dive into the action! Join our Professional Electronic Music DJ Program, which we've been perfecting in Brooklyn and Manhattan since 2016. Our inclusive 36-hour program is fully comprehensive, mastering industry-standard Pioneer Nexus equipment like a pro - on completion, you'll be ready to confidently step up to the decks at open-deck events across the city.",
      "Perfect for both beginners and those who've dabbled at home, eager to master real-world techniques on the latest professional equipment. Taught by our superior roster of professional electronic music touring DJs, the course offers a truly personal experience, with a class size limited to just four students.",
      "Successful students will be invited to join our Ibiza Bootcamp, for further training in Barcelona, and a performance in Ibiza.",
      "In-person classes provide the personal attention and feedback necessary for a high-quality learning experience - private instruction is also available online.",
      "“I needed to brush up on some production software, so I called Garnish, as they have the best instructors” - Jamie Jones. “Garnish is taking 'spin' classes to new heights” - Billboard.",
    ],
    sections: [],
    curriculum: [
      { heading: "Beats & Pieces", items: ["Setting up equipment, and getting ready to go", "Mixing essentials", "Bars and beats", "Beat matching introduction"] },
      { heading: "FX", items: ["Common FX", "Filtering", "EQ", "Dos and don'ts: FX during the mix"] },
      { heading: "Hardware and Software", items: ["CDJ Nexus", "Rekordbox", "Mixed In Key"] },
      { heading: "Your Set", items: ["Refining your set", "How to mix acapellas", "Gauging the crowd and having a backup plan"] },
      { heading: "Advanced Mixing & Digital Tricks", items: ["Triggering and sampling", "Delay and reverb in the mix", "Impact mixing with FX and levels", "Body language"] },
      { heading: "Advanced Set Building & Improvisation", items: ["Out-of-the-box song selection", "Changing tempo", "Music programming"] },
      { heading: "Preparing for Your Show", items: ["Recording your set", "Getting the word out"] },
      { heading: "What Next?", items: ["Keeping the momentum and booking more events", "EPK tips", "Developing your sound and style"] },
    ],
    curriculumAccordion: [],
    // No enrollLink here - the real, working checkout is the PayPal
    // buttons below (courseSchedule.paypalButtons) instead of a link.
    pricing: { priceLine: "36 lab hours - $950 + $500 registration (14+ days out) / $1,050 + $600 otherwise - $500 off in 2026", enrollLink: null },
    courseSchedule: {
      bodyHtml:
        "<p>New cohorts run year-round in both Manhattan and Brooklyn, typically 9-12 sessions over 2 months, weekday evenings or weekend afternoons. For one-to-one lessons, including Open Format DJ lessons, see <a href=\"/private-instruction\">DJ Private Instruction</a>.</p>",
      paypalButtons: NY_DJ_CLASS_PAYPAL_BUTTONS,
    },
    faqs: [],
    instructorGridItems: [],
    testimonials: [
      { author: "DJ Exact", text: "I feel I'm so lucky to have done this class, to form my foundation of understanding of DJing. The instructor nurtured my interest and consolidated my goal to be a DJ in clubs." },
      { author: "Eden", text: "It's a great course to get a fully integrated understanding of DJing! I loved the learning process and finally getting to play my own music. The instructor was great, and I'm so glad I invested in the class." },
      { author: "Heather", text: "After only three classes, I am an entirely different DJ. I can't wait to see how my skills grow over the next six classes! I'm so grateful for my instructor. He feels more like a mentor than a teacher." },
      { author: "Matt", text: "I can't speak more highly of this course. I am so happy with how much I learned, the length of the course, the quality of equipment, and the stellar instructor." },
    ],
  },
};
