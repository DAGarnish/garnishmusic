import type { InstructorDirectoryCard } from "./modern-instructors-content";

// ny's real instructor roster - hand-transcribed directly off each
// instructor's own real bio page at ny.garnishmusicproduction.com
// (confirmed live, 2026-09-04; ny's own /instructors/ directory page
// itself is a stale, empty placeholder - same gap pdx/hou's real sites
// have - so this roster comes from the 11 real bio pages linked from the
// Comprehensive Programs pages instead, which is the complete real set:
// no other instructor bio pages were found on ny's site). Photos are ny's
// own real, already-migrated Media docs (site 14) - queried by slug, see
// scripts/dump-ny-instructors.ts - not re-hosted or altered.

const S3 = "https://s3.us-east-2.amazonaws.com/garnishmusic-media/";

export type NYInstructorBio = {
  name: string;
  role?: string;
  photoUrl: string;
  bioHtml: string;
};

export const NY_INSTRUCTOR_BIOS: Record<string, NYInstructorBio> = {
  "courses/isobel-ward": {
    name: "Isobel Ward",
    photoUrl: `${S3}isobel-ward.jpeg`,
    bioHtml:
      "<p>Isobel is a producer, songwriter, sound designer, and Apple-Certified Trainer: Logic Pro. She has overseen sessions at some of the world's top studios, including Abbey Road London and Electrical Audio in Chicago.</p>",
  },
  "courses/brian-thabault": {
    name: "Brian Thabault",
    photoUrl: `${S3}garnish-image-Brian-Thabault.jpg`,
    bioHtml: `<p>Brian Thabault is a New York City based music producer, DJ &amp; multi-disciplinary artist, with roots in Vermont and up-state New York. His path through music developed across the country in Montana, and back to NYC in 2017. With a distinct focus on house &amp; techno, Brian's musical range as a producer extends from ambient, through down-tempo, hip-hop, R&amp;B and pop. As co-founder of the label Tri Music Group, Brian has many projects out under his own name and collaborative projects, Spin Department and Shy Fidelity.</p>
<p>His live set is a fully customized Ableton Live set, containing stems of his own productions that he expertly mixes in improvisational ways, with the aid of a drum machine and outboard effects.</p>
<p>Brian is also the founder of Co/Function, a monthly event in NYC focused on live electronic music and visual improvisation - a curated group of up to 8 musicians and visual artists collaborating and improvising live, linked together by a common midi clock.</p>`,
  },
  "courses/daniel-lonner": {
    name: "Daniel Lonner",
    role: "Music educator, producer, and mentor",
    photoUrl: `${S3}Daniel-Lonner.jpg`,
    bioHtml: `<p>Daniel is a versatile music educator, producer, and mentor with over a decade of experience helping artists shape their sound. A graduate of NYU's Clive Davis Institute of Recorded Music, he specializes in bridging classical training with cutting-edge music production, using tools like Logic Pro, Pro Tools, and Ableton Live.</p>
<p>With a strong foundation in both traditional instrumentation and modern digital workflows, Daniel delivers highly creative, personalized lessons that encourage experimentation and originality.</p>
<p>Daniel's studio is a fully equipped creative hub, featuring analog synths, drum machines, electric and acoustic instruments, a range of microphones, and multiple DAWs.</p>`,
  },
  "courses/charles-reeves": {
    name: "Charles 'Chicky' Reeves",
    role: "Producer, recording, mixing and mastering engineer",
    photoUrl: `${S3}Chicky.png`,
    bioHtml: `<p>Charles 'Chicky' Reeves is a producer, recording, mixing and mastering engineer working with well known artists such as Prince, Howard Jones, Orchestral Manoeuvres in the Dark, Ray Charles, Tito Puente, Johnny Cash, and Radiohead - as well as MTV's Live at the Ten Spot, VH1 Storytellers, Boyz II Men, and more.</p>
<p>In the early 2000s, Reeves moved to London, collaborating with artists in the studio as well as mixing front of house for Orchestral Manoeuvres in the Dark, Grace Jones, BEF (formerly Heaven 17), Skye Edwards (of Morcheeba), Prince, UB40, and the Icelandic band Trabant.</p>
<p>His studio, Chicky &amp; Coco, is located in Islington, London, England, and Port Washington, New York, USA, and his music is published by Extreme Music.</p>`,
  },
  "courses/98-dots": {
    name: "98 Dots",
    role: "DJ and innovative promoter",
    photoUrl: `${S3}98dots.jpg`,
    bioHtml: `<p>98dots is a passionate DJ and innovative promoter, frequently playing at leading clubs in Europe and New York, including Public Records, Pickle Factory, Post Bar, Horst Club, and TES. Growing up in the diverse streets of Georgia's capital, he explores a variety of musical styles, crafting rhythms that stretch the imagination.</p>
<p>He has shared stages with notable artists like Jane Fitz, DJ Nobu, Evan Baggs, Wata Igarashi, DMX Krew, Roman Flügel, and Fred P. His diverse approach to DJing appeals to club audiences and radio listeners alike.</p>
<p>In addition to the music he plays in clubs and festivals, his musical range spans ambient, abstract, and experimental genres.</p>`,
  },
  "courses/nick-gallick-2": {
    name: "Nick Gallick",
    role: "Audio educator, software demonstrator, and owner of NGK Audio Productions",
    photoUrl: `${S3}Nick_Gallick.jpg`,
    bioHtml: `<p>Nick Gallick has always possessed a deep connection with both music and sound. After learning guitar in his early teens, he became fascinated with recording, eventually earning a Bachelor's Degree in Business Management and Audio Recording Technologies. After working out of various studios and freelancing for years, he is currently an audio educator, software demonstrator, freelance engineer, and owner of NGK Audio Productions.</p>
<p>His teaching philosophy revolves heavily around making a connection with his students, and encouraging excitement in learning.</p>`,
  },
  "courses/scott-hampton": {
    name: "Scott Hampton",
    role: "Trumpeter, guitarist, music technologist and composer",
    photoUrl: `${S3}Scott.jpg`,
    bioHtml: `<p>Scott Hampton, aka "exaltron", is a trumpeter, guitarist, music technologist and composer with over 20 years experience in various music roles. He is known for both his interactive live performances and releases as Exaltron, as well as his work providing bespoke and licensed music for film, television and international branding campaigns.</p>
<p>Performing live around NYC and touring nationally with acts including Moldover (The Godfather of Controllerism), he combines live instruments, looping, improvisation and live remix techniques with custom Max for Live patches and advanced automation in Ableton, often adding visual elements like homemade reactive lights and a fiber optic lighted talk box.</p>
<p>In addition to performing on iconic NYC stages including The Knitting Factory, Nublu and The Delancey, he built a custom mobile sound system in 2016, allowing him to take his live looping rig into subway stations and public parks in the city.</p>`,
  },
  "courses/heinrich-dr-hz-zwahlen": {
    name: "Heinrich Zwahlen",
    role: "Ableton-certified producer and instructor",
    photoUrl: `${S3}Heinrich-Zwahlen-801.jpg`,
    bioHtml: `<p>Heinrich Zwahlen (aka Heinrich Wüste) is Ableton-certified, and started out the Ableton and Native Instruments curricula by designing the courses at Dubspot, which brought Live, NI Komplete, and Maschine to the attention of a wider US public.</p>
<p>Writing with synthesizers and sequencers in the early 80s, he pioneered live electronic music sets and collaborated with artists including Aboriginal Voices, Yello, and Gabi Delgado of DAF, before moving to NYC through his work with Hip-Hop legend Rammellzee. He co-wrote songs with Timmy Regisford artist Billy, and signed an artist deal with Ten/Virgin (Soul2Soul/MaxiPriest) producing as Basscut, with vocalist Elisa Burchett, and topped the US/UK dance charts with mixes by Satoshi Tomiie.</p>
<p>His NYC studio saw major label clients throughout the 90s, recording Hip-Hop, House, R&amp;B, and Electro (Groove Theory, P Diddy's BadBoy Management, Mantronix).</p>`,
  },
  "courses/michael-guerriero": {
    name: "Mike Guerriero",
    role: "Hit Songwriting instructor",
    photoUrl: `${S3}Mike-Guerriero-Press-Photo-2021.jpeg`,
    bioHtml: `<p>Michael Guerriero is a dynamic and multi-faceted entertainment professional. Experienced in all areas of the music industry, Guerriero has a combination of corporate, creative and academic accomplishments. Constantly focused on finding hit songs and talent, Guerriero was an A&amp;R scout for Columbia Records/Music With A Twist, where several of his discoveries were signed.</p>
<p>He has written several dance hits including the #1 Billboard Dance Hit "How Can I Be Falling," performed by Jennifer Green, and national dance radio hits "Kiss The Sky" and "You'll Always Have Me" by Danielle Bollinger. He has also worked with a broad range of talent including Shontelle, Rockwilder, U-God of Wu-Tang Clan, KDrew, Mishaal, Noah Cyrus, Powfu, Kina, Birdy, Sarcastic Sounds and more.</p>
<p>In January of 2017, he was hired by Garnish Music Production School in New York to design a course on "Hit Songwriting," fulfilling a lifelong dream to teach.</p>`,
  },
  "courses/jonathan-harris": {
    name: "Jonathan Harris",
    role: "Audio engineer, producer, and songwriter (aka Money The Producer)",
    photoUrl: `${S3}Jonathan-Harris.jpeg`,
    bioHtml: `<p>Jonathan Harris aka Money The Producer was born and bred in Harlem, NY. He has over 10 years experience in audio engineering, production and songwriting. He's a BMI affiliate, with credits alongside Pharrell Williams and other Grammy Award-winning artists and producers.</p>
<p>Money has recorded and mixed music for Azealia Banks, ASAP Rocky &amp; Ferg. He's efficient in most leading DAWs, with a vast library and knowledge of industry standard plugins, as well as hands-on experience engineering at some of the world's most renowned studios. Money also completes work remotely, producing high quality vocal tracking, sound design and processing audio for commercial use.</p>`,
  },
  "courses/shareef-islam": {
    name: "Shareef Islam",
    role: "Producer (aka Azteknique and TekMaschine)",
    photoUrl: `${S3}Shareef-Islam-801.jpg`,
    bioHtml:
      '<p>Shareef Islam (aka Azteknique and TekMaschine) was born in the Bronx, NY, and raised in Brooklyn, NY. He has worked with established artists including AZ, Big Daddy Kane, SuperStar of the ICONZ, The Bush Babees, Busta Rhymes, Rampage, Q-Tip and De La Soul, as well as boxing champion Zab "Super" Judah, Lin Que (ISIS of X-Clan), Mos Def, Onyx and Jay-Z.</p>',
  },
  // Added for the ableton-live-djs/rekordbox pages' own dedicated 4-person
  // DJ_INSTRUCTORS list (see modern-ny-classes-content.ts) - user request
  // (2026-09-04) to feature real DJ specialists there instead of the
  // network-wide CORE_INSTRUCTORS generalist roster. Real bio content
  // hand-transcribed from each instructor's own real page (site 14 ids 484
  // and 471 respectively).
  "courses/chris-veras": {
    name: "Chris Veras",
    role: "DJ/Producer/MC, one half of Dos Flakos",
    photoUrl: `${S3}Chris-Veras.jpeg`,
    bioHtml: `<p>Chris Veras is a multitalented DJ/Producer/MC, one half of the dynamic duo Dos Flakos. Born and raised in The Bronx, New York, he's performed and held multiple residencies in NYC at some of the most popular and legendary venues. From sold out arenas and festivals to touring internationally, Chris DJs across various dance music genres within the Electronic, Latin, Caribbean, and underground spaces.</p>
<p>Chris specializes in House, Club music, Latin/Caribbean music &amp; various Global Sounds. You can find his remixes as Dos Flakos on Bandcamp/Soundcloud and all original releases on most digital streaming platforms.</p>`,
  },
  "courses/alex-hell-n": {
    name: "Alex Hell-n",
    role: "DJ",
    photoUrl: `${S3}corey-800.jpg`,
    bioHtml: `<p>Alex Hell-n is a New York-based DJ, born and raised, known for their percussive, groove-driven sound, blending raw techno with melodic textures, hypnotic rhythms, and electronic vocals. Starting out as a dancer, their approach to DJing is rooted in movement, creating sets that are as physical as they are immersive.</p>
<p>With a residency at Good Judy and Mother's Milk events, and performances at NYC staples like Bossa Nova Civic Club, SILO, Mood Ring, Wonderville, Rash, Newtown Radio, Equinox, and more, they bring real-world club experience and a community-focused perspective to their craft.</p>
<p>As they join Garnish New York, Alex is excited to share their hands-on approach to DJing—focusing on foundational techniques, creative mixing, and developing a unique sound behind the decks. Their goal is to help students build confidence, understand the art of reading a crowd, and bring their own personality to every set.</p>`,
  },
};

// The real /instructors directory listing - ny's own real page at this
// URL is a stale, empty placeholder (see NY_INSTRUCTOR_BIOS' own comment),
// so this directory is built from the same 11 real bio pages instead,
// matching the "real, hand-maintained directory" shape la's own real
// instructors page already uses (see ModernInstructorsPage's `directory`
// prop). Each card's bioExcerptHtml is that same instructor's own full
// bio's first paragraph - user request (2026-09-04) to preview more than
// just name/role/photo before clicking through to the full bio.
export const NY_INSTRUCTOR_DIRECTORY: InstructorDirectoryCard[] = Object.entries(NY_INSTRUCTOR_BIOS).map(
  ([slug, bio]) => ({
    name: bio.name,
    title: bio.role || "",
    photoUrl: bio.photoUrl,
    href: `/${slug}`,
    info: [],
    bioExcerptHtml: bio.bioHtml.match(/<p>[\s\S]*?<\/p>/)?.[0],
  })
);
