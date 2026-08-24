import { para, heading, link } from "./add-post-structure";

export const postId = 780;
export const children = [
  para(
    "This is arguably the most important chapter you will read. It is here you will learn to navigate Live's interface, selecting, moving, and manipulating as you work your way through your project."
  ),
  para(
    "There is a lot in here. This chapter covers things like playing, stopping, selecting things, as well as hiding and revealing the crucial parts of Live. In this section you will learn that, although working within Live generally means working within one of two main views (Session View and Arrangement View), much of the interface never actually changes! In fact, many of the actions you will learn in this chapter: from selecting and modifying, to playing and looping, will work regardless of where—within Live—you may find yourself working."
  ),
  para(
    "Don't worry. Everything in this chapter will be covered later in greater depth. But this is a chapter you can (and should) come back to. It is the foundation of the way you will be working. It is our hope that everything within this chapter will soon become second nature, but for now just consider it to be 'the big picture'. For the time being, don't sweat the details."
  ),
  para("Let's get started!"),

  heading("Topography", "h2"),
  para(
    "Finding your way around in Live is easy! Most of the elements in the program don't really change that much. Aside from the Arrangement and Session Views, which are mutually exclusive, pretty much everything else can be shown or hidden at will. So it's just a matter of learning a few key areas."
  ),
  para("Getting from Session View to Arrangement View is simple. We will be dedicating a lot of time to this later but you may as well get this part under your belt."),
  heading("Tab", "h3"),
  para(
    "Tab, tab, tab, tab, tab… The tab key is the secret sauce that switches between Live's two basic ways of working. You can also use the mouse. Click one of the two buttons, which incidentally, when viewed side by side, creates the Ableton logo.",
    ["Tab"]
  ),

  heading("Always Visible", "h2"),
  para("Let's begin with what you will always see."),
  heading("Control Bar", "h3"),
  para(
    "The control bar remains at the top of the interface at all times. It houses important functions such as play, stop, the metronome, and tempo, as well as providing feedback for song position, and various activity. It never goes away (thank goodness!).",
    ["Control Bar"]
  ),
  heading("Status Bar", "h3"),
  para(
    "The status bar, the thin strip along the bottom, is also always present and continuously updates to display relevant information, generally associated with the current position of your mouse and for system-related messages. Like the control bar, the status bar persists regardless of Live's state.",
    ["Status Bar"]
  ),

  heading("Visible As Needed", "h2"),
  para(
    "The rest of the elements in the Live interface can be turned on or off as needed. They basically never change, regardless of where you are in the program. In fact, the only exception which must be explicitly opened in a new window is the Live preferences window (covered in further depth in our \"Housekeeping\" chapter). These windows are:"
  ),
  heading("Info View", "h3"),
  para(
    "Being new to Live, this is probably the first one you should acquaint yourself with. Click the triangle on the lower left and hover your mouse anywhere; the info view tells you what it is. The info view is your friend!",
    ["Info View"]
  ),
  heading("Detail View: Device and Clip Viewer", "h3"),
  para(
    "Showing or hiding the detail viewer (triangle on the bottom right) reveals device and clip viewers. The clip viewer gives you access to the clip's contents. A lot of good stuff happens here, and we will spend a considerable amount of time covering this in later chapters. Likewise, the device viewer allows you to insert and work with effect and instrument plug-ins. Aside from the session and arrangement views themselves, these are the two primary locations where work is performed."
  ),
  para("Both of these are important enough to warrant learning the keystroke to toggle between them."),
  para("Almost as important as tab (which toggles session/arrangement), we suggest you commit shift + tab to memory. Now!"),
  heading("Browser", "h3"),
  para(
    "This important area on the left side of the interface is where Live organizes and manages all its various assets. This is where you will go to load clips, instrument and effect plug-ins, and presets. It features a fast search area and a handy preview button you can use to audition sounds.",
    ["Browser"]
  ),
  para("This is made particularly useful in cases where you see this handy hot-swap icon. Pressing this allows you to change presets, instruments, and samples."),
  para("When you see the icon above, it means that you can instantly swap one instrument, preset, or groove for another."),
  heading("Groove Pool", "h3"),
  para(
    "This wavy button hides and reveals the groove pool which allows you to apply a variety of rhythmic adjustments to clips. Don't worry about it for now. It will be discussed later.",
    ["Groove Pool"]
  ),
  heading("Help View (and Manage Files)", "h3"),
  para(
    "Tutorials, extra help, and even some advanced file management options are available in a window on the right. Mostly we've included it here so that you aren't freaked out when you see it (and, in fact, mainly so you know how to close it)."
  ),
  para(
    "That's it! That's the entire interface. These individual views often have their own elements that may open and close. Some of the items inside may change depending on what is going on. But these will make sense when we get to them. For now, you have essentially mastered all of it. Do a victory lap, pat yourself on the back, whatever… All that's left is to discuss the hierarchy of it all (the way Live deals with signals) and some basic navigation (zoom in and out, see where you are in your song, and all that good stuff)."
  ),

  heading("Putting It All Together", "h2"),
  para(
    "Before we can discuss playback, the time has come for us to consider the difference between Session and Arrangement View. So far, this section has used Session View. Session View is considerably more complex. Think about it: In Session View, clips are 'launched' dynamically. They are combined with various other clips, sometimes into scenes, or sometimes individually."
  ),
  para("Clips and scenes may start and stop independently with no regard for the traditional, linear nature of most other DAWs."),
  para(
    "If the Arrangement View were a regular movie, Session View would be as if any and every character's dialogue might come at any point, even over another character's lines. In Live both scenarios can happen. Simultaneously. And, amazingly, it generally sounds great!"
  ),
  para("How does Live handle this?"),
  para("Elegantly."),
  para("Every clip (and every scene) has its own little play button. Empty clip and scene slots have a little square stop button."),
  para(
    "The stop button at the bottom of the Master Track (scenes) stops all clips. The play and stop button in the control bar (top) operate playback in the Arrangement View — which is independent from that of the Session View. Don't worry. At this point, you should be aware of two things."
  ),
  para(
    "Clips give visual feedback to indicate they are playing. If the clip viewer is open, the selected clip's contents are shown, and a vertical line, the insert marker, indicates what part of the clip is currently playing.",
    ["insert marker"]
  ),
  heading("Playback", "h3"),
  para(
    "From here, everything gets simpler. First of all, while the clips that play in Session View may not always be playing in Arrangement View, the tracks themselves, including their levels, panning, instruments, and effects are identical. No, scratch that: they are the same tracks — merely viewed from a different window. In fact, if while launching scenes and clips in Session View, you were to press the arrangement record button in the control bar, you would actually be moving/creating that performance into the Arrangement View!"
  ),
  para(
    "Now erm… forget you heard that. We will cover it later. Anyhoo, once you are aware that the playback state of the Session and Arrangement Views are not always one and the same, all that remains is to consider how to navigate in the Arrangement. And that's easy. Check it out!"
  ),
  heading("Arrangement", "h3"),
  para(
    "In the linear Arrangement View, MIDI and audio tracks are stacked vertically, their content displayed along a horizontal timeline. If you are coming from another DAW like Pro Tools, Logic, or Cubase, this type of traditional layout should be immediately familiar. (If not, consider checking out one of our fabulous Garnish courses on them. There's lots of good stuff to be found in those programs too!)."
  ),
  para("Arrangement View is ideal when you want to see a clear representation of your music over time."),
  para("So, next up? How to get around."),
  para("Let's have a look at how that happens in the Arrangement View."),

  heading("Viewing", "h2"),
  para(
    "Everything you are about to learn about playing, selecting, moving, and zooming is going to be shown in the Arrangement View, but the procedures here are mostly the same throughout Live's interface. Rest assured, taking a moment to familiarize yourself with what follows will not be time wasted."
  ),
  para(
    "Zooming around the Arrangement View follows some simple rules. A 'hotspot' at the top of the interface displays a thumbnail-sized representation of the entire length of the Live Set. Clicking here and dragging up and down will zoom in and out, centering the window around the thumbnail position. Clicking anywhere in the thumbnail (or dragging it left and right) will reposition the view. Depending on your hardware, this can also be accomplished using pinching and scrolling gestures on your mouse or trackpad, and by using the + / - keys."
  ),
  para(
    "In both the Arrangement and Session View, track sizes can be adjusted by dragging the track edges with the mouse. In fact, many tracks can be resized at once. Holding ⌥ (option) or alt (PC) allows all track heights to be changed at once. Each track header has a small triangle that allows it to be individually folded to conserve space. Tracks can be unfolded, recalling their previous size and allowing them to reveal their contents. Finally, you can always zoom width and/or height to allow an optimized view of the entire Arrangement View using the W and H key (or buttons)."
  ),
  para("Handy zooming shortcuts: + (zoom in) · − (zoom out) · Z (zoom in to selection) · X (zoom back out) · H (zoom track height to view all) · W (zoom arrangement view width full)."),

  heading("Playing", "h2"),
  para("That ubiquitous vertical line that marks the playback position is called the insert marker.", ["insert marker"]),
  para(
    "Playback begins at the position of the insert marker. Clicking anywhere in the Arrangement View will reposition it. Should the insert marker wander off the side of the screen during playback, click the follow button on the control bar."
  ),
  para("This will cause the display to re-center itself around the insert marker so you can always see where you are."),
  para(
    "The current time position in the song is also indicated on the control bar. Along the top and bottom of the Arrangement View are numbers which mark the position in beats (top) and 'clock time' (bottom)."
  ),
  para(
    "Live also displays a grid which corresponds to the beat display. This can be customized to coarser or finer resolution with the widen/narrow grid command in the Options menu (or with ⌘ + 1 and ⌘ + 2) — or just right click the background and choose the desired grid from the contextual menu."
  ),
  para(
    "Handy playback and insert marker shortcuts: space bar (play) · shift + space bar (play from stopped position, bypassing the start marker) · shift + ⌘ + F (follow) · ⇦ ⇨ arrows (increment insert marker forward or backwards by grid value) · option + spacebar (plays only the selection)."
  ),

  heading("Selecting", "h2"),
  para(
    "Dragging in the Arrangement View creates a selection of one or more tracks. The insert marker moves to the beginning of the selection. Either side of the selection can be modified by holding the shift key and clicking near either the left or right boundary. Keep in mind that the grid resolution determines how selections 'snap' against the grid. Snapping can be bypassed by holding the ⌘ key (ctrl on PC) while selecting and moving."
  ),
  para(
    "Clicking the clip title bar selects an entire clip. Holding ⌘ while clicking on the clip title bar allows you to add additional clips to your selection. Pressing shift while selecting allows two non-contiguous clips to be selected along with all the clips that lie in between."
  ),
  para(
    "Handy selection shortcuts: click-drag (select a segment across one or more clips/tracks) · click clip title bar (select an entire clip) · click clip title bar + ⌘ + click another clip title bar (select multiple clips) · shift + drag left or right side of an existing selection to adjust it · ⌘ held while selecting (disable the grid) · ⌘ + A (select all) · esc (deselect)."
  ),

  heading("Looping", "h2"),
  para(
    "When the loop switch in the control bar is activated, playback will loop between the two positions set by the loop brace. The loop brace may be set by the current selection either by pressing ⌘ + L or by right-clicking the selection and choosing “Loop Selection” from the contextual menu that appears.",
    ["loop brace"]
  ),
  para(
    "Handy looping shortcuts: ⌘ + L (sets the loop brace to the current selection) · shift + spacebar (play from a position other than the loop start, allowing replacement of the start marker) · ⇧ ⇩ arrow buttons (move the loop by loop length) · ⇦ ⇨ buttons (move the loop left and right by grid value)."
  ),

  heading("Menus? What menus?", "h2"),
  para(
    "You may have noticed that we have not shared many menu items. This is because, most of Live's features can be accessed either by buttons in the interface or via key command. We will discuss the power of customizing Live's key bindings in a further chapter. But also be aware that most of the menu options that allow you to interact with Live also exist in the form of 'contextual menus' that appear when you right-click (also ⌃ + click on Mac). Such menus reveal functions directly related to the things you click. This makes it very easy to find what you are looking for. Next time you want to change something such as a clip's color, before you go looking for a menu buried somewhere in the clip viewer, just try right clicking the clip!"
  ),

  heading("More Navigation", "h2"),
  (() => {
    const p = para(
      "We don't want to overwhelm you. There are still many workflow related habits that you are going to be acquiring. The good news is that as you bounce from window to window, Live tends to be consistent in its methods. In other words, learning about selecting in the Arrangement View will leave you with useful skills for navigating the clip detail view. So, as it turns out, that will be one of the next places where you will find a stockpile of essential stuff. We have a few things that we want to show you first, but if you are looking for some of those meat-and-potatoes, getting-around sorts-of-things, you are likely to find some of them in "
    );
    p.children.push(link("Clip Editing: The Basics", "/clip_editing_the_basics/"));
    p.children.push({ mode: "normal", text: ".", type: "text", style: "", detail: 0, format: 0, version: 1 });
    return p;
  })(),

  heading("Conclusion", "h2"),
  para(
    "Well, there you have it. For now, just let it soak in. Remember, this is the kind of a chapter that you come back to — maybe even again and again for a while. That's okay. It's worthwhile to make this second nature. As you get comfortable with it (and fast), everything else becomes easier."
  ),
  para(
    "There are big things coming your way. Big, EXCITING things. Big, FUN, exciting things. Yes, there is lots to cover still. But in this chapter, we have taken a pretty big bite out of it. You should now understand the nature of how to get around the interface, how to change what you see, and how to move around within a song. That's the nitty-gritty, the nuts-and-bolts of it, the meat-and-potatoes if you will. And because of that, we completely expect that you will revisit this chapter."
  ),
  para("So stick a virtual bookmark in this spot and let's get to making music!"),
];
