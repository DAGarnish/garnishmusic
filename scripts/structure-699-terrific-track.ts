import { runOps, Op } from "./structure-by-index";

// This post has ~8 orphaned image captions scattered mid-text (photos of
// Roxette, Spike Stent, Iceland, screenshots) left over from the original
// WP post's embedded images, which were stripped during migration leaving
// only their captions as stray, confusing plain-text fragments. Removed
// throughout alongside adding real heading structure.
const ops: Op[] = [
  {
    kind: "replaceText",
    index: 0,
    text: "We've dealt with so many topics on this course; you might think that there can't possibly be any more subjects to discuss. But song writing is a little like mathematics, you can grasp the basics very quickly but there is no end to the detail. Each discipline stretches on into infinity with new angles on every aspect of the subject. Ahem.",
  },
  {
    kind: "split",
    index: 4,
    headingText: "Starting Your Track",
    tag: "h2",
    bodyPrefix:
      "You know that you have to make an impact very early on in your track, preferably straight away. What's the best way to do this? How can I make an impact without sounding contrived and clichéd? Well, how about these ideas:",
  },
  {
    kind: "split",
    index: 6,
    headingText: "Getting from A to B",
    tag: "h2",
    bodyPrefix:
      "You've got a great verse, and the chorus is pretty special too. The singer's done a smashing job and you're convinced that the song is a winner. But there's something wrong in the arrangement. You can't put your finger on why but the track just doesn't flow right; maybe it feels too repetitive, maybe things just happen without a proper build up, the whole track feels like programming, not music. Don't panic, here are some ideas to help you through:",
  },
  { kind: "toHeading", index: 8, text: "Ceci n'est pas musique", tag: "h2" },
  {
    kind: "split",
    index: 10,
    headingText: "A Musician and His Machine",
    tag: "h2",
    bodyPrefix: "I can't dance to that music you're playing!",
  },
  {
    kind: "replaceText",
    index: 13,
    text: "It's the wrong speed. As any DJ knows, people are very sensitive to changes in tempo when they're dancing to modern music, too slow and the DJ will speed your song up, if she bothers to play your song at all that is! But if your song is too fast it can just feel hurried and certainly not very 'cool'. SOLUTION: Try moving/dancing to your track yourself, preferably after having taken a break from making your song of at least an hour. Adjust tempo if necessary. It's too busy. You've programmed and programmed and programmed. In fact, you've filled every nook and cranny (what is a 'cranny'?) in your track. Basically, you've done the musical equivalent of concreting over your garden; what once was a beautiful thing for all to see and enjoy is now an eyesore, fit only for parking cars on. SOLUTION: Take everything out of your arrangement except the drums (no added percussion, no multiple break beats at the same time, just the DRUMS), the bass, the vocal and one other part. Does your track sound any good? If yes, then mix it and go to bed. You'll know in the morning if it's working properly or not. If no, start again or give up. Or better still, give your song to someone else whose expertise you trust and let her arrange the track. You never know!",
  },
  { kind: "delete", index: 14 },
  { kind: "delete", index: 16 },
  {
    kind: "split",
    index: 19,
    headingText: "My Chorus Is Lacking Something",
    tag: "h2",
    bodyPrefix: "Your chorus doesn't work? Then you might as well pack up and go home. Or, you could attempt to make it better by using some of these tips:",
  },
  { kind: "delete", index: 21 },
  {
    kind: "split",
    index: 23,
    headingText: "My Track Sounds Nothing Like What I Hear on the Radio",
    tag: "h2",
    bodyPrefix:
      "This can be a good or a bad thing depending on how you feel about music radio! Working on the premise that you like listening to the radio and that's where you'd like your tracks to be played, go through this simple checklist to see where your track can be improved:",
  },
  { kind: "delete", index: 25 },
  {
    kind: "split",
    index: 28,
    headingText: "The Power of Four, and How to Break It",
    tag: "h2",
    bodyPrefix:
      "Ok, it's true that almost every contemporary song works in blocks of four, or multiples of four. In fact, we've all become so used to this that songs can feel a bit odd if they're not built that way. But that doesn't mean that your arrangement has to be built that way. Just because your verse is eight bars long and your chorus is eight bars long, that does not mean that you should be making all your parts correspond in length.",
  },
  { kind: "toHeading", index: 32, text: "Help, I'm Bored of My Song!", tag: "h2" },
  {
    kind: "split",
    index: 37,
    headingText: "Finishing Your Track",
    tag: "h2",
    bodyPrefix: "How do we know when we've done everything that we need to do for our track?",
  },
  { kind: "delete", index: 40 },
  {
    kind: "split",
    index: 42,
    headingText: "What Really Matters in Your Track",
    tag: "h2",
    bodyPrefix:
      "We're making demos of our songs that we will present to artists to record and publishers to pay for. Keep that fact in mind at all times, that is the goal we're aiming for in our studio sessions. The fact is, no matter what you may have heard to the contrary, A and R departments really need to hear songs sounding as close to finished records as they possibly can. This might sound like a distinct lack of imagination on their part, after all their supposed to know a good song presented to them by a singer and guitar. Or even a penny whistle!",
  },
  {
    kind: "replaceText",
    index: 44,
    text: "But we're not working in a £1000 a day studio with the best singer/engineer/producer that vanity can buy; we're all alone in our studio in the back room or our flat in Lewisham. We can't compete with those other guys. Or can we…? Concentrate on getting these basic things sounding good and we're back in with a chance. After all, everybody has to start somewhere.",
  },
  {
    kind: "split",
    index: 47,
    headingText: "What Shouldn't Be in Your Track",
    tag: "h2",
    bodyPrefix:
      "Here is a list of things that an A and R guy does not care about. These are clichés and will make you come across as a daft amateur. Leave all of these out unless you are certain that you know what you are doing.",
  },
  {
    kind: "split",
    index: 49,
    headingText: "Songwriter Seeks Inspiration",
    tag: "h2",
    bodyPrefix: "…so where on earth are we going to find it? Luckily for us, we live in a pretty excellent world where inspiration can be found everywhere if we're ready for it. So be ready for it by:",
  },
  { kind: "delete", index: 51 },
  {
    kind: "split",
    index: 53,
    headingText: "Staying Sane",
    tag: "h2",
    bodyPrefix:
      "Making music can be incredibly enjoyable and rewarding, that's why so many people do it. But being a musician and a songwriter comes with a whole load of problems, some unique to the field. We could devise a degree course on studying the psychology of musicians; we could fill the British library with anecdotes on how so many of them get into problems with their health, especially mental health. Here are some simple guidelines on how to stay healthy whilst trying to earn a living as a songwriter.",
  },
  {
    kind: "split",
    index: 56,
    headingText: "One Last Thing",
    tag: "h2",
    bodyPrefix:
      "In modern music, anything goes. Even the humblest DAW has a sampler built these days. And of course, with the price of a 250GB hard drive about the same as a meal for two in the west end of London, sample libraries can be vast. You want a bagpipe, throw it in! Fancy trying a Ukulele? You got it. We arrangers have never had it so good.",
  },
  {
    kind: "splitTwo",
    index: 60,
    firstPart: "All of these things combine into a phenomenon I identified a while ago. I call it:",
    midHeadingText: "Bored Programmer Syndrome",
    midTag: "h2",
    secondPart: "…And it is the enemy of an effective arrangement.",
  },
  {
    kind: "replaceText",
    index: 63,
    text: "Any of this sound familiar? If you're finding any of these things happening to you on a regular basis, then memorise this maxim and make it your guide for life, or hitwriting at least: No Amount of Arranging Will Make a Bad Song Good. Track not sounding great no matter what you do? It's probably the song. Back to the drawing board with you. You know it makes sense.",
    // bold added separately below via a second pass since replaceText+bold on
    // the same op object needs a bold op with a matching index
  },
  { kind: "bold", index: 63, terms: ["No Amount of Arranging Will Make a Bad Song Good"] },
  { kind: "delete", index: 64 },
];

runOps(699, ops);
