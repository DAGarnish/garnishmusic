import type {
  CourseSection,
  CurriculumModule,
  CoursePricing,
  Faq,
  AccordionModule,
  ScheduleBlock,
} from "./modern-course-content";
import type { InstructorGridItem } from "../components/modern/ModernInstructorGrid";
import type { TestimonialItem } from "../scripts/wp-shortcode-render";

// ny's real "Comprehensive Programs" (its own nav's exact label/roster -
// see MODERN_SITE_ROUTES' own NY_ROUTES comment) - every value below
// transcribed directly off ny.garnishmusicproduction.com's own real pages
// (confirmed live, 2026-09-04), same "no WPBakery content carried forward"
// rule as ModernNYHomePage. Keyed by the real path each nav link already
// points to (ny's own real URLs, cloned verbatim into staging's mainMenu),
// so promoting this site later needs no link rewrites.

const HERO_IMAGE = "https://s3.us-east-2.amazonaws.com/garnishmusic-media/FabFilter-Pro-Q-2-Screen-Shot%402x-1.png";

// Shared by both the Academy and the Electronic Music Producer Program -
// ny's own real pages reuse the identical instructor roster across
// multiple program pages (confirmed against both pages' own "Our
// Instructors" grids).
const CORE_INSTRUCTORS: InstructorGridItem[] = [
  { name: "Isobel Ward", href: "/courses/isobel-ward", imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/isobel-ward.jpeg" },
  { name: "Brian Thabault", href: "/courses/brian-thabault", imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/garnish-image-Brian-Thabault.jpg" },
  { name: "Daniel Lonner", href: "/courses/daniel-lonner", imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Daniel-Lonner.jpg" },
  { name: "Charles 'Chicky' Reeves", href: "/courses/charles-reeves", imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Chicky.png" },
  { name: "98 Dots", href: "/courses/98-dots", imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/98dots.jpg" },
  { name: "Nick Gallick", href: "/courses/nick-gallick-2", imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Nick_Gallick.jpg" },
  { name: "Scott Hampton", href: "/courses/scott-hampton", imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Scott.jpg" },
  { name: "Heinrich Zwahlen", href: "/courses/heinrich-dr-hz-zwahlen", imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Heinrich-Zwahlen-801.jpg" },
];

// Shared by both the Pop Music Producer Program and SongCraft Pro - ny's
// own real roster for these two (confirmed against both pages' own "Our
// Instructors" grids - Scott Hampton and Isobel Ward/Daniel Lonner overlap
// with CORE_INSTRUCTORS above, but the rest differ).
const SONGWRITING_INSTRUCTORS: InstructorGridItem[] = [
  { name: "Scott Hampton", href: "/courses/scott-hampton", imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Scott.jpg" },
  { name: "Isobel Ward", href: "/courses/isobel-ward", imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/isobel-ward.jpeg" },
  { name: "Daniel Lonner", href: "/courses/daniel-lonner", imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Daniel-Lonner.jpg" },
  { name: "Mike Guerriero", href: "/courses/michael-guerriero", imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Mike-Guerriero-Press-Photo-2021.jpeg" },
  { name: "Jonathan Harris", href: "/courses/jonathan-harris", imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Jonathan-Harris.jpeg" },
  { name: "Nick Gallick", href: "/courses/nick-gallick-2", imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Nick_Gallick.jpg" },
  { name: "Shareef Islam", href: "/courses/shareef-islam", imageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/Shareef-Islam-801.jpg" },
];

// ny's own real per-program pricing (site-wide identical across the three
// 120-hour programs, confirmed against each page's own FAQ/pricing copy) -
// enrollLink points at ny's own real contact page rather than a working
// staging page yet (see NY_ROUTES' own comment - /contact-map isn't built
// here yet either), matching the incremental-build pattern already used
// for edu's own early pages.
const STANDARD_PRICING: CoursePricing = {
  priceLine: "$4,499 + $100 registration (14+ days out) / $4,999 + $200 otherwise",
  enrollLink: "/contact-map",
};

export type NYProgramContent = {
  title: string;
  heroImageUrl: string;
  intro: string[];
  sections: CourseSection[];
  curriculum: CurriculumModule[];
  curriculumAccordion: AccordionModule[];
  curriculumEyebrow?: string;
  curriculumHeading?: string;
  pricing: CoursePricing;
  faqs: Faq[];
  instructorGridItems: InstructorGridItem[];
  testimonials: TestimonialItem[];
  // Real, working PayPal checkout (see the DJ Class product entry in
  // modern-ny-classes-content.ts) - reuses the exact same hosted-button
  // mechanism mia's own real course-schedule pages already use, rather
  // than a fabricated "enroll" link, since this one product doc's real
  // buttons already exist and work.
  courseSchedule?: {
    bodyHtml: string;
    // Real per-cohort date/time/location rows (see NY_CLASSES' own
    // "product/electronic-dj-class" entry) - takes priority over bodyHtml
    // in ModernCourseScheduleAccordion when set.
    scheduleBlocks?: ScheduleBlock[];
    paypalButtons?: import("../components/PayPalHostedButtons").PayPalButton[];
  };
  // DJ Class's own real vertical Short, paired beside its intro section -
  // same real feature mia's own electronic-dj-course already uses for this
  // exact video (see ModernCoursePage's own showsVideoBesideIntro comment).
  // Undefined for every other NY entry.
  videoEmbeds?: import("./modern-course-content").VideoEmbed[];
  centerVideoBesideIntro?: boolean;
  // Real modules made of just a few short bullet items each (as opposed to
  // curriculumAccordion above, meant for genuinely long-form modules like
  // the 360 Academy's own) - rendered as ONE accordion (ModernCurriculumAccordion)
  // with every module's own sub-heading + bullets inside, matching the real
  // shape mia's own DAW course pages (e.g. ableton-live-course) already use
  // for this exact kind of short-item module breakdown, instead of one
  // accordion row per module.
  whatYouWillLearn?: CurriculumModule[];
  // private-instruction's own base-price-vs-location-cost split (see
  // ModernPricingLocationBlocks' own comment) - undefined for every other
  // NY entry.
  pricingLocationBlocks?: import("../components/modern/ModernPricingLocationBlocks").PricingLocationBlock[];
};

export const NY_PROGRAMS: Record<string, NYProgramContent> = {
  "music-production-academy": {
    title: "360° Garnish Music Academy",
    heroImageUrl: HERO_IMAGE,
    intro: [
      "We teach the skills to hone the art of music production. Students leave with their own project, curated sound library, and the tools to succeed. This boutique-style program in classes of no more than eight, serves as a comprehensive and hands-on experience. Gain invaluable tips and techniques from our superior roster of instructors, who are invested in your progress.",
      "Students have the opportunity to write, produce, engineer, mix, master their very own project in-person or LIVE online.",
    ],
    sections: [],
    curriculum: [],
    curriculumEyebrow: "Curriculum",
    curriculumHeading: "Program modules.",
    curriculumAccordion: [
      {
        title: "Beats & Pieces",
        bodyHtml:
          "<p>In a matter of weeks, you'll confidently navigate your DAW, a crucial and enduring tool in your creative arsenal. If you're uncertain about which DAW to select, fret not—we have knowledgeable experts ready to guide you once we understand your preferences better.</p>",
      },
      {
        title: "Music Composition",
        bodyHtml:
          "<p>Acquire the fundamental elements of music composition, enhancing your production efficiency, whether you're a novice or possess some background in music theory. Master the art of crafting harmonious chords, explore captivating lead-lines, and groove-worthy bass-lines. Classically trained participants have shared how this segment of the program has provided them with fresh tools and techniques.</p>",
      },
      {
        title: "Audio Engineering",
        bodyHtml:
          "<p>Establish a solid foundation in audio engineering by delving into the techniques and insider tricks of the recording trade. This course segment places a strong emphasis on mastering the art of recording live instruments and synths, covering topics such as microphone selection, audio interfaces, sample rates, bit depths, as well as the critical aspects of monitor speakers and room acoustics.</p>",
      },
      {
        title: "Mixing & Mastering",
        bodyHtml:
          "<p>Know your space; learn the fundamentals behind acoustics and how to correctly stage your studio for cleaner and better sound. Then get your hands dirty with dynamic controllers, in-depth EQ, making the most of the frequency spectrum, mixing vocals, expanding song elements, creating cohesive sound, and awesome professional plugins, including our software partners, FabFilter.</p>",
      },
      {
        title: "Electronic Sound Design",
        bodyHtml:
          "<p>While even many pro electronic producers stick with only subtractive synthesis during their career, you will go beyond by exploring subtractive, granular, additive, wavetable, and frequency modulated synthesis. This section also covers sampling, glitch, resampling, and additional beat-making techniques to broaden your sound.</p>",
      },
      {
        title: "Top-Line",
        bodyHtml:
          "<p>Struggling to write songs that contend with the hits? Reading songwriting books and watching endless hours of Youtube tutorials don't seem to be making a difference? Our Top-Line Songwriting module advances your songwriting abilities with a direct approach and advice that other sources neglect to share, bringing the hit songwriter out in you!</p>",
      },
      {
        title: "Build Beats Better",
        bodyHtml: `<p>Our entire Build Beats Better program is included in our Academy. It consists of:</p>
<ul>
  <li>Think like a drummer or a strummer: Program beats, riffs, and fills that sound like real instruments - <a href="/courses/rhythm-section-programming">Rhythm Section Programming</a>.</li>
  <li>You should really have a good idea of production AND music if you wish to take giant leaps forward - <a href="/courses/composition">Composition</a>.</li>
  <li>Record, produce, and mix a quality vocal - mic technique, editing mastery, tuning & mixing vocals - <a href="/courses/vocal-production">Vocal Production</a>.</li>
  <li>Bend electronic instruments to your will: create groundbreaking dance music in any DAW - <a href="/courses/electronic-sound-art">Electronic Sound Art</a>.</li>
  <li>Learn how to record, write, collaborate, and produce Hip Hop - <a href="/courses/hip-hop-production-course">Hip Hop Production</a>.</li>
  <li>Put that final polish on your mix and get it ready to release - <a href="/courses/mastering">Mastering</a>.</li>
</ul>`,
      },
      {
        title: "Three Free VIP Short Course Membership, Worldwide",
        bodyHtml:
          "<p>Want to learn FL Studio, or brush up on Sound Design again? No problem - on completion, all Academy learners at Garnish get a free VIP membership for our shorter music production courses, worldwide. This means you can take up to three music production courses, with just the registration fee to pay at any of our participating locations (London, Miami, New York, Los Angeles, San Francisco, and Online), subject to availability, with no cap on when you'd like to take each course.</p>",
      },
      {
        title: "More Free Stuff!",
        bodyHtml:
          "<p>Thanks to our exclusive licensing partnerships and certified status with brands such as Ableton, we have assembled a range of specialized assets: synthesizers, effects, and samples for Garnish Academy students. Many of these products are yours to keep.</p><p>We have our very own boutique sample label - Garnish students get a generous toolbox (mostly written and produced by Garnish instructors) for free, including an exclusive pack recorded from Mark Ronson's own Mellotron M4000D.</p>",
      },
    ],
    pricing: {
      priceLine: "$12,999 + $500 registration ($300 early bird) - schedule skips holidays",
      enrollLink: "/contact-map",
    },
    faqs: [],
    instructorGridItems: CORE_INSTRUCTORS,
    testimonials: [
      { author: "Danile Tran", text: "Each instructor I had was spot on! They were able to answer all the questions I had and some. I would highly recommend Garnish Music school to anyone looking to learn more about electronic music." },
      { author: "Nick Lawson", text: "I already had a good level of knowledge of some of the areas on the course but the information was delivered at a pace that wasn't too slow. I learned a lot of new techniques that have helped demystify some of the results I have been trying to achieve." },
      { author: "Hayden Noel", text: "Great wealth of knowledge and expertise passed on from teachers who are actively working in dance music. A great course that has empowered me to enhance my music and finish quality dance tracks." },
    ],
  },

  "programs/ableton-producer-program": {
    title: "Electronic Music Producer Program",
    heroImageUrl: HERO_IMAGE,
    intro: [
      "This Electronic Music Producer Program is designed for our next generation of music producers, ready to get serious with their music using Ableton Live, and take them from zero to music producing hero in no fewer than 120 hours of world-class training and mentoring, in-person at our Ableton Certified and FL Recognized training center in New York, or LIVE online.",
      "“I needed to brush up on something, so I called Garnish, as they have the best instructors” – Jamie Jones",
      "Learn Ableton Live Suite from the ground up, covering everything you need to know about making the music you love in this revolutionary DAW, and all of the add-ons in Suite, together with the best of Max4Live devices, giving you a full understanding of what's possible when producing the music you love.",
      "Unlike our shorter production classes, there are strategically placed mentoring sessions, so you get time to work on your music with the direct support of your instructor.",
    ],
    sections: [],
    curriculum: [],
    curriculumAccordion: [],
    pricing: STANDARD_PRICING,
    faqs: [
      { question: "How long is the program?", answer: "120 hours of world-class training and mentoring." },
      { question: "What software do I need?", answer: "A laptop with Ableton Live or FL Studio installed." },
      { question: "Do I get a software discount?", answer: "Yes - all Garnish students qualify for a 40% discount on Ableton software." },
      { question: "Is mentoring included, or just group classes?", answer: "Both - strategically placed 1-on-1 mentoring sessions are built in alongside group instruction." },
      { question: "Can I take this program remotely?", answer: "Yes - Live Online, with an alternative Pacific Time schedule available too." },
      { question: "How much does the program cost?", answer: "$4,499 plus a $100 registration fee if booked 14 days ahead, or $4,999 plus $200 otherwise." },
    ],
    instructorGridItems: CORE_INSTRUCTORS,
    testimonials: [
      { author: "Shaun Holmes", text: "I would never have discovered all this by myself. A well-structured course with quite simply brilliant instructors." },
      { author: "Robbie Linstead", text: "I feel like I have come out of the course with a lot more knowledge than I thought I would!" },
      { author: "Gary Schofield", text: "This was a very well organised course, information given at a pace that seemed to allow a lot to be learnt without it being overloading or boring." },
      { author: "Chris Dietz", text: "The course was pitched at the right pace for me, and I found it easy to keep up with the content. The instructors were engaging, experienced, knowledgeable, and pitched the content perfectly between theory and allowing us hands-on practice." },
    ],
  },

  "programs/logic-pro-x-music-program": {
    title: "Pop Music Producer Program in Logic Pro",
    heroImageUrl: HERO_IMAGE,
    intro: [
      "Crafted for the next wave of Pop, Singer/Songwriter, Hip-hop, and all Live Music producers, to take them from fiddling around in Garage Band, to producing professional sounding songs, using a laptop and Logic Pro. More experienced producers also take this program to fill in gaps in workflow.",
      "The total course length is 120 hours, and is a combination of hands-on learning and group mentoring, in-person or LIVE online. By the end of the program, with hard work in-between sessions, learners should have a completed masterpiece to show off, along with their certificate.",
      "Learn Logic Pro like a Pro! And all the add-ons included in this incredibly powerful and comprehensive DAW, from the ground up, leaving no stone unturned, ensuring you know how to use the tools included effectively and efficiently, to produce music at the quality you're used to hearing by your favorite artists.",
      "Working in small groups in this class will fast-track you to writing and producing the music you love.",
    ],
    sections: [],
    curriculum: [],
    curriculumAccordion: [],
    pricing: STANDARD_PRICING,
    faqs: [
      { question: "I've only used GarageBand - is this too advanced?", answer: "No - it's specifically designed to take you from GarageBand up to producing professional-sounding songs in Logic Pro." },
      { question: "What will I finish with?", answer: "A completed track you can show off, plus your certificate, if you keep up with the work between sessions." },
      { question: "How long is the program?", answer: "120 hours, combining hands-on learning with group mentoring." },
      { question: "What's included as a perk?", answer: "Access to premium synths and samples through licensing partnerships, plus Garnish's boutique sample label - including an exclusive Mark Ronson Mellotron pack." },
      { question: "Can I take this online?", answer: "Yes - in-person or Live Online." },
      { question: "How much does it cost?", answer: "$4,499 plus a $100 registration fee if booked 14 days ahead, or $4,999 plus $200 otherwise." },
    ],
    instructorGridItems: SONGWRITING_INSTRUCTORS,
    testimonials: [
      { author: "Kevin Yee", text: "I had excellent teachers with well rounded musical knowledge. I felt safe learning from them. I love the concept of Garnish studios." },
      { author: "Lauren Rogers", text: "I always had to rely on others help to get reasonable sounding demos for my songs. Now after doing the Logic music production course, I am making great sounding demos all by myself. The tuition was brilliant." },
      { author: "Ashley Plumpton", text: "I would highly recommend the course to any starting out Logic Pro user, every class is structured and broken down into easy, digestible steps, talented and helpful instructors." },
      { author: "Ruth Anderson-Davis", text: "The content and pace was perfect, you cover so much but make it clear and easy to understand. I feel like Logic has been opened up to me and I wish I'd done it sooner." },
    ],
  },

  "programs/songwriter-producer-program": {
    title: "SongCraft Pro - The Ultimate Songwriter-Producer Program",
    heroImageUrl: "https://s3.us-east-2.amazonaws.com/garnishmusic-media/fotor_2023-6-8_9_47_49-1.png",
    intro: [
      "If you dream of producing finished songs, from an initial spark of inspiration to polished, professional recordings, you've come to the right place!",
      "Our “SongCraft Pro” program is designed to empower you with the knowledge and skills to not only write compelling songs but also produce them to a studio-quality standard. Whether you're a lyricist with a passion for melodies or a producer with a knack for crafting music, this comprehensive program is your pathway to artistic excellence.",
    ],
    sections: [],
    curriculum: [],
    // Rendered as an accordion (ModernAccordionSection, under "Program
    // modules.") rather than the static 3-column curriculum grid every
    // other NY_PROGRAMS entry uses - user request (2026-09-04) to match
    // "similar programs in the network" (e.g. the 360° Garnish Music
    // Academy entry above, whose own real content is likewise a handful of
    // long modules better suited to an accordion than a cramped grid card).
    curriculumEyebrow: "Curriculum",
    curriculumHeading: "Program modules.",
    curriculumAccordion: [
      {
        title: "Your Inner Songwriter: Crafting Melodies and Lyrics That Resonate",
        bodyHtml:
          "<ul>" +
          [
            "Songwriting Foundations: song structure, common chord progressions, and different songwriting styles.",
            "Lyric Writing: craft compelling and evocative lyrics that connect with your audience.",
            "Melody and Harmony: create captivating melodies and harmonies that make your songs unforgettable.",
            "Song Structure: verse-chorus, bridge, and more, for a real sense of progression.",
            "Music Theory for Songwriters: essential concepts to experiment with different musical elements.",
            "Inspiration and Creativity: exercises to overcome writer's block and generate fresh ideas.",
            "Feedback and Collaboration: share your work, get constructive feedback, find collaborators.",
          ]
            .map((item) => `<li>${item}</li>`)
            .join("") +
          "</ul>",
      },
      {
        title: "Songcraft to Soundcraft: Vocal & Music Production for Songwriters",
        bodyHtml:
          "<ul>" +
          [
            "Songwriting and Production Synergy: produce music that complements your songwriting.",
            "Music Production Fundamentals: hands-on with industry-standard DAWs.",
            "Instrumentation and Sound Design: select instruments and craft unique sounds.",
            "Arrangement and Orchestration: advanced techniques for arranging your songs.",
            "Studio: etiquette and best practices for capturing your best performances.",
            "Recording: studio and home recording setups, even on a budget.",
            "Vocal Producing & Production: enhance vocal performances and process them to a professional standard.",
            "Mixing & Mastering: clear, cohesive, radio-ready sound for your music.",
          ]
            .map((item) => `<li>${item}</li>`)
            .join("") +
          "</ul>",
      },
      {
        title: "Soundtrack to Success: Setting You Up for What's Next",
        bodyHtml:
          "<ul>" +
          [
            "Collaboration: work with fellow songwriters and producers to refine your skills for future co-writes.",
            "Feedback: receive constructive feedback and expert guidance on your work.",
            "Music Marketplace: navigate copyright, publishing, labels, licensing, and distribution.",
            "Entrepreneurship and Promotion: strategies to promote and expose your music effectively.",
          ]
            .map((item) => `<li>${item}</li>`)
            .join("") +
          "</ul>",
      },
      {
        title: "Who Should Attend?",
        bodyHtml:
          "<ul>" +
          [
            "Aspiring or established songwriters, lyricists, and composers looking to produce their own music.",
            "Aspiring or established music producers seeking to enhance their songwriting skills.",
            "Musicians and artists aiming to have creative control over their music.",
            "Anyone with a passion for music and a desire to take their creative ideas to the next level.",
          ]
            .map((item) => `<li>${item}</li>`)
            .join("") +
          "</ul>",
      },
    ],
    pricing: {
      priceLine: "120 hours - $4,499 + $100 registration (14+ days out) / $4,999 + $200 otherwise",
      enrollLink: "/contact-map",
    },
    faqs: [],
    instructorGridItems: SONGWRITING_INSTRUCTORS,
    testimonials: [
      { author: "Alan G", text: "GMP is already doing an amazing job building a reputation of excellent teachers and an exceptional suite of classes and programs. Add to that the individualized attention that students receive - and you get the recipe for very rewarding and valuable classes!" },
      { author: "Ahmed Karrar", text: "The course is professionally run with experienced tutors who are approachable and enthusiastic about music in general. This allowed all the students to interact and learn in a more informal manner." },
      { author: "Amaia Arbizu", text: "Coming from a classical music training background, the course has provided me a whole new platform to work with and a completely different perspective from which to produce music." },
    ],
  },
};
