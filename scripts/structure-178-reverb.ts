import { para, heading } from "./add-post-structure";

export const postId = 178;
export const children = [
  para(
    "Reverb is one of the most widely used time based effects in audio, and one of the most fascinating. Depending on how you use it, it can help or hinder your mix. Luckily, many parameters on reverb plugins are the same or similar, and can be explained across platforms. Understanding reverb is important, and this article will explain key reverb parameters in order to add space, dimension, smoothness and professional quality, as well as tips to avoid muddiness and over-saturation."
  ),

  heading("Types of Reverb", "h2"),
  para("Reverb gives the impression that the recorded instrument is in a room. There are usually many presets to simulate different rooms."),
  para("Room: Reproduces a real physical space, usually a smaller room with .2-1 second reverberation time.", ["Room:"]),
  para("Hall: Indicates a concert hall, a lively sounding space with reverb from 1.2 seconds to 3+.", ["Hall:"]),
  para(
    "Chamber: Chamber is usually smaller than the hall but larger than a room, with decay of .4 to 1.2 seconds. The shorter times are meant to enhance clarity between a small group of instruments.",
    ["Chamber:"]
  ),
  para("Spring: An emulation of reverb created by the vibration of a metal spring. Many guitar amps utilize this mechanism for a metallic sounding reverb.", ["Spring:"]),
  para(
    "Plate: Plate reverb is an artificial reverb that simulates an actual metal plate that vibrates from an electromechanical transducer. A pickup captures the vibrations and outputs an audio signal.",
    ["Plate:"]
  ),

  heading("Common Terms", "h2"),
  para("Early Reflections are the first reflections that hit walls, ceilings and floors. These reflections occur from around 1 to 30 milliseconds.", ["Early Reflections"]),
  para("Pre-Delay is the amount of time before these reflections occur.", ["Pre-Delay"]),
  para(
    "Decay is the continuation of the reverb as the sound waves bounce against the surfaces. This can last from 30 milliseconds to however long the parameters are set.",
    ["Decay"]
  ),

  heading("Parameters", "h2"),
  para("Room Size: The general criteria for room size are the larger the room, the longer the reverb times.", ["Room Size:"]),
  para("Decay Time: The amount of time before the reflections dissipate completely.", ["Decay Time:"]),
  para("Damping: Damping attenuates high frequencies, simulating softer surfaces like wood instead of marble. This parameter gives a warmer sounding reverb.", ["Damping:"]),
  para(
    "Diffusion: The increase of diffusion makes the sound thicker, pushing reflections together. The reduction of diffusion makes the sound almost more like individual echoes.",
    ["Diffusion:"]
  ),
  para("Pre-Delay: Before the sound hits any surface, there is a time lag. This is called pre-delay. The larger the lag, the larger the space will seem.", ["Pre-Delay:"]),
  para(
    "Density: The density of the reflections in the reverb tail can be controlled. Usually the denser the reverb the more natural and better it sounds, but it all depends on the context and sound you're going for.",
    ["Density:"]
  ),

  heading("General Guidelines for Understanding Reverb", "h2"),
  para(
    "Though it depends on your project, using one reverb with your instruments across the board is a great way to tie together your mix. You can do this by creating an auxiliary track with your favorite reverb and bussing the instruments you'd want in a space to this track. However, our brains have the capacity to hear different instruments in various spaces at the same time without forming a disconnect between any of the instruments. Sometimes an engineer will place the snare in a small room, the guitar in an ambient space, and the vocals in a church."
  ),
  para(
    "Beware the temptation to use too much reverb. Excessive and poorly used reverb muddies up mixes and distorts clarity. The direct sound of an instrument is very important for establishing directionality and accuracy, as well as articulation in dynamic detail. Unless you are going for a specific effect, keep your decay times reasonable in order to preserve a good performance. Avoid using reverb on bass heavy instruments, as this will accentuate low frequencies and obscure the mid-range. This includes the bass guitar and bass drum. Great instruments to use reverb on include vocals, guitar, snare, and toms. Piano and keyboards should be evaluated on a case by case basis, as pianos almost have reverb built into them with the vibration of the strings."
  ),
  para(
    "Less tends to be more with reverb. On the other hand, extreme reverb has also been used to cover up mistakes or mask poor production, which is never recommended. A good use of reverb is to make it enhance the mix, but appear generally imperceptible or unnoticeable, unless there for effect. This understanding reverb article mostly describes natural reverb, but possibilities are just about endless for creative expression within a song. Experiment to what sounds good to your ears; blend reverbs, use unorthodox settings such as shorter/longer decay times, custom EQ different rooms on the standard settings, or pan different reverbs in different areas of the mix. Audio is malleable, and experimentation could yield some exciting results."
  ),
  para(
    "Understanding reverb is just a small part of our Mixing & Mastering courses, worldwide. We are proud to boast that right now, they are all lead by Grammy-winning sound engineers!"
  ),
];
