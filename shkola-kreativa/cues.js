// Single source of truth for picture AND sound. Frames @24 fps, 120 BPM => 1 beat = 12 frames.
(function (root) {
  const LETTER_STARTS = Array.from({ length: 13 }, (_, i) => 158 + Math.round(i * 2.5));
  const CUES = {
    fps: 24, frames: 240, bpm: 120,
    whooshIn: 0,          // pencil smear enters (on 1s)
    tick: 4,              // pencil tip hits paper
    scribble: [4, 12],    // pencil draws the circle
    pop: 12,              // circle floods with colour -> character is born; music starts
    whooshOut: 12,        // pencil flicks away
    launch: 20,           // anticipation released, jump
    ting: 22,             // eyes open at the apex
    land: 36,             // first landing (beat)
    hops: [48, 60, 72],   // dance landings on the beat
    bigLand: 84,          // bigger hop lands with paint splash
    spinWhoosh: 86,       // spin jump launch
    spinSmear: 94,        // smear frames on 1s
    tadaLand: 108,        // lands, ta-da pose
    inflate: [120, 140],  // swells, trembles
    choke: 140,           // music drops out (4 frames of held breath)
    burst: 144,           // HERO: impact frame + starburst
    letters: LETTER_STARTS, // each spark lands -> letter writes on
    oPop: 192,            // the O comes alive
    pencilIn: 196,        // pencil returns
    underline: [202, 212],// pencil draws the underline
    blink: 222,           // O-character blinks in the hold
    holdFrom: 210,        // hold on 3s
  };
  if (typeof module !== 'undefined') module.exports = CUES; else root.CUES = CUES;
})(this);
