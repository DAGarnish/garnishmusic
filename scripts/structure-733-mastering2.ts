import { runOps, Op } from "./structure-by-index";

const ops: Op[] = [
  { kind: "toHeading", index: 0, text: "What is Mastering?", tag: "h2" },

  {
    kind: "split",
    index: 7,
    headingText: "Multi-Band Compression",
    tag: "h2",
    bodyPrefix:
      "In essence, a multi-band compressor comprises of a set of filters that splits the audio signal into two or more frequency bands. Three- or four-band compressors are perhaps the best compromise between versatility and ease of setting up. After passing through the filters, each frequency band is fed into its own compressor, after which the signals are recombined.",
  },
  {
    kind: "split",
    index: 9,
    headingText: "How Multi-Band Compressors Work",
    tag: "h3",
    bodyPrefix:
      "Multi-band compressors share similar parameters to single-band compressors. Although the interface may differ from plug-in to plug-in, once you have mastered the basics you should be at home using any multi-band compressor out there.",
  },
  {
    kind: "split",
    index: 12,
    headingText: "Using Multi-Band Compressors on Your Master Buss",
    tag: "h3",
    bodyPrefix:
      "Multi-band compression isn't specifically limited to use in mastering, but there's no doubt this is where it's utilized most. The ability to home-in on specific frequencies and treat them without colouring others is what sets multi-band processors apart from more basic single-band models.",
  },
  {
    kind: "split",
    index: 18,
    headingText: "Dealing With the Time Constants",
    tag: "h3",
    bodyPrefix:
      "Where the attack and release settings are independently adjustable, try to judge each band on its merits. For example, you might use a moderately fast attack time on the bass end because very low frequencies have no fast transients to compromise. This brings the level under control reasonably quickly. You should then set the release time as short as you can get it without any audible gain-pumping being evident. As a rule, the busier the music, the faster the release time you need to ensure the compressor's gain resets itself between notes. However, low frequencies tend to hang on longer than high frequencies, so you may need a longer release time at the bass end than in the mid-range. As a starting point, setting twice the release time at twice your setting for the mid-band might be reasonable, though if you prefer to keep it simple, you'll probably get reasonable results by starting off with the attack and release times for all three bands set the same.",
  },
  {
    kind: "split",
    index: 22,
    headingText: "Using Multi-Band Compressors in the Mix",
    tag: "h3",
    bodyPrefix:
      "Multi-band compressors can be just as useful in the mixing stage as they are in mastering. Obviously there is not a lot of point treating simple, monophonic sounds with a five-band processor, but groups of instruments can really benefit from this sort of compression.",
  },
  {
    kind: "split",
    index: 26,
    headingText: "Multi-Band Compressors as Dynamic Equalizers",
    tag: "h3",
    bodyPrefix:
      "Most multi-band compressors also allow each band to be boosted in volume. This boosted area can then be compressed to bring it down to its original level as it fires. This mixture of amplification and attenuation is commonly known as dynamic equalization, and if the right balance is struck it can give you a really pleasing result.",
  },
  {
    kind: "replaceText",
    index: 24,
    text: "This technique is not just limited to drums and can work with any number of grouped instruments, such as guitars, vocals or even synth lines. As long as the contained sounds have a defined, unique frequency, then the multi-band compressor will be able to clamp down on them.",
  },
  {
    kind: "split",
    index: 30,
    headingText: "Choosing Crossover Points",
    tag: "h3",
    bodyPrefix:
      "Multi-band compressors often allow the user to adjust the crossover points, so if we take a three-band compressor as an example, where is the best place to set them? The answer is that it depends on the type of material being processed and on what adjustments are needed. OK, I know that isn't very helpful, so let's narrow it down a bit and assume we're processing a full mix of a typical pop song. Setting a crossover point in the middle of the vocal range for example, can mess up the vocal sound, especially if you use radically different compression settings on each side of the crossover frequency.",
  },
  {
    kind: "split",
    index: 32,
    headingText: "Preparing Your Tracks for Professional Mastering",
    tag: "h2",
    bodyPrefix:
      "Apart from getting the music sounding right, it is just as important to supply the mastering engineer with the right information so that they can proceed with the job satisfactorily. Certainly any audio files sent to the mastering house prior to the session require detailed labelling so that they can be properly identified, but anyone attending a session also needs to have all the necessary information to hand. If ISRC codes are being used then, in the UK, these need to be obtained from Phonographic Performance Ltd (PPL) in advance so that they can be allocated to each track at the end of the session.",
  },
  {
    kind: "split",
    index: 37,
    headingText: "Master Mix Formats",
    tag: "h2",
    bodyPrefix:
      "Back in the early days of home studios, there was little choice when it came to recording your stereo master - the serious guys used a Revox quarter-inch tape machine running at 7.5 or 15ips (inches per second) while everyone else got by with domestic open-reel tape recorders or even cassette decks. Even today, those old Revox machines can give fantastic results, but now they compete with DAT, Minidisc, CD-R, CD-RW and hard drives as a medium for your mixes.",
  },
  {
    kind: "split",
    index: 42,
    headingText: "16-Bit vs. 24-Bit",
    tag: "h3",
    bodyPrefix:
      "Recording your final mix in a 16-bit format is fine if it is your final mix, but most of the time you'll need to do some post-mix mastering, even if it's only adjusting levels or adding a bit of EQ and compression. Every time you process digital audio, a small amount of resolution is lost due to scaling or rounding-up/down errors, so in an ideal world it's better to record at more than 16 bits, then dither down to 16 bits at the very end of the mastering process, just before preparing your CD master.",
  },
  {
    kind: "split",
    index: 44,
    headingText: "Buss Compression",
    tag: "h2",
    bodyPrefix:
      "‘Why should we need to compress at all during the mastering stage if individual tracks have already been compressed during recording and mixing?’ The answer is that not all material will need compressing, but the application of a little overall compression can help the sounds within the mix to gel more effectively, even in cases where every track was compressed flat at the time of mixing. Just because individual tracks have been compressed doesn't mean the mix is always going to be at the same level throughout — vocal lines will still have gaps between phrases, and instruments may come and go according to the arrangement of the song. The outcome is that the overall level of a typical pop mix still fluctuates according to what is and what is not playing at any given time.",
  },
  {
    kind: "splitTwo",
    index: 51,
    firstPart:
      "The situation worsens when you're compressing a whole mix, because the low-frequency sounds in the mix determine the compression applied to everything else, so what tends to happen is that the kick drum and bass line dictate how the mix will be compressed. One way to disguise this aspect of full-band compression is to set a slightly longer attack time so that transients can pass through cleanly before the gain reduction takes place, but clearly this does little to control peak levels, which is important when you're working with digital systems that can't tolerate overloads, however brief. In some situations these side effects can be musically desirable, and in some forms of rock and pop music a hint of gain pumping (audible compression due to rapid gain changes) can add energy and excitement, providing it isn't overdone.",
    midHeadingText: "Separation Mastering",
    midTag: "h2",
    secondPart:
      "This technique involves submitting the final mix from the recording studio as a small collection of 'separations' (typically 4 audio files, e.g. vocals, drums, bass, remaining instruments).",
  },
  {
    kind: "split",
    index: 54,
    headingText: "Creating 'Separations'",
    tag: "h3",
    bodyPrefix: "Here are some simple steps to create 'separations'. Start by making a folder on your hard drive and label it with the name of the song you're working on.",
  },
  { kind: "headingBefore", index: 61, text: "Separations vs. Stems", tag: "h3" },
  {
    kind: "split",
    index: 65,
    headingText: "Home Mastering",
    tag: "h2",
    bodyPrefix:
      "Today, the tools for quality mastering are finally within the financial and technical reach of anyone who's serious about recording. However, 95 percent of mastering is not in the tools — it's in the ears. Unless you have the ears of a mastering engineer, you can't expect any plug-in to provide them for you. Besides, much of the point of using a mastering engineer is to bring in an objective set of ears to make any needed changes prior to release - which is why most commercial releases tend to be mastered by professionals, in professional facilities.",
  },
  {
    kind: "split",
    index: 71,
    headingText: "Some Basic Steps",
    tag: "h3",
    bodyPrefix:
      "The more traditional approach is to take each tune, master it, then as a separate operation, assemble all the tunes into a cohesive whole. A newer approach is to assemble all the tunes first and then apply any processing on a more global level. Basically, this combines both mastering and assembly into one operation. We'll look at the 'individual song' approach.",
  },
  {
    kind: "split",
    index: 74,
    headingText: "Reduce Peaks Using Automation",
    tag: "h3",
    bodyPrefix:
      "If some peaks are significantly louder than the rest of the material, this reduces the chance to have a higher average level, as the peaks use up much of the headroom. One solution is to add limiting, but another option that can affect the sound less is to use an automation envelope to reduce the levels of just those peaks. If the automation works on just a single cycle of the waveform, you probably won't hear any difference compared to not reducing that peak, but once the major peaks are reduced, you'll be able to raise the overall level. Furthermore, if you do add any compression, it won't have to work as hard.",
  },
  {
    kind: "split",
    index: 75,
    headingText: "EQ and Mastering",
    tag: "h2",
    bodyPrefix:
      "EQ in mastering is often used to tuck away annoying frequencies and to enhance the frequencies that make the recording special. This usually involves boosting the fundamental range for songs that require a fatter sound and doing the opposite for songs that need to lose a bit of weight. Using EQ to enhance certain frequencies also often involves boosting upper harmonics on songs that need to sound a little more exciting and to bring out the 'air' characteristics so that there is a more 'glossy' and 'polished' sound overall.",
  },
  { kind: "toHeading", index: 77, text: "Frequency Guidelines", tag: "h3" },
  {
    kind: "expand",
    index: 78,
    texts: [
      "Boosting bottom end for a warmer and fatter sound: 60-150Hz, around where the bass and kick drum are.",
      "Boosting midrange for more presence and bite, if needed: 900Hz-3kHz. Be careful here, as the mid range covers the majority of what we perceive in a musical mix.",
      "Boosting hi-mid frequencies will also bring bite and clarity: 4kHz-8kHz. Be careful here too, as overdoing it will bring harshness and emphasize sibilance.",
      "Boosting around 10kHz will help a mix a lot if it's a bit on the dull side.",
      "Boosting around 12kHz will bring 'air', making the mix more 'open'.",
      "Notching at around 150Hz–400Hz will help a muddy mix, removing boxiness.",
      "Notching the mid/hi-mid, around 1kHz–3kHz, will soften a mix which is too harsh.",
      "It is also very common to apply a hi-pass filter around 20Hz-30Hz. This can help a great deal to tighten up the bottom end.",
      "In the case of mastering for broadcast, the bandwidth of the signal has to be reduced. For example, for TV broadcast apply a high-pass filter at 80Hz with -18dB/octave to filter out low frequencies, and apply a low-pass filter at 12kHz with -9dB/octave to filter out high frequencies.",
    ],
  },
  {
    kind: "split",
    index: 79,
    headingText: "Limiters",
    tag: "h2",
    bodyPrefix:
      "Limiters are audio devices that prevent a signal from going above a defined level, irrespective of the input level. When the input is below the predetermined level, usually called the threshold, the audio dynamics are not changed at all. Any input signal that exceeds the threshold is 'limited' to that level.",
  },
  { kind: "toHeading", index: 87, text: "How Loud?", tag: "h2" },
  {
    kind: "split",
    index: 89,
    headingText: "Master Fader",
    tag: "h2",
    bodyPrefix:
      "Although most modern audio software packages use 32-bit floating-point audio engines and have lots of headroom, overloading can still occur unless levels are set properly, especially if the master buss is the sum of different channels. Clipping indicators are helpful, but programs that include a numeric read-out of how much a peak level is above or below 0dBFS are far more useful. This value, called the 'margin', is positive if the level is above 0dBFS and negative if below. If possible, enable any kind of peak-hold feature so that you can see the highest level attained at the end of a song without having to keep your eyes glued to the meters. Note that if the margin indicator isn't reset automatically (when you click the transport stop button, for instance), you'll have to clear the value manually from time to time.",
  },
  {
    kind: "split",
    index: 92,
    headingText: "Dithering",
    tag: "h2",
    bodyPrefix:
      "Ok so now you have your final master, still in high definition (24bits/whatever sample rate you choose to work at). You now need to convert it to a 16 bits / 44.1 kHz file in order to create an audio CD.",
  },
  { kind: "toHeading", index: 95, text: "What Is Dithering?", tag: "h3" },
  {
    kind: "split",
    index: 102,
    headingText: "Relating to Distortion",
    tag: "h3",
    bodyPrefix:
      "For any given bit-depth, the quieter the signal, the higher the level of relative distortion. To avoid noticeable distortion in low-level signals, it is preferable to add some smoothing noise to the signal – it's a trade-off, adding mildly undesirable hiss in order to remove far less desirable harmonic and intermodulation distortion.",
  },
];

runOps(733, ops);
