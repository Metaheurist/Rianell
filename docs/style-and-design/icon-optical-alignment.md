# Icon optical alignment

Perceived balance rules for Rianell glyphs in UI chrome.

## Centering

- **Geometric center** `(cx, cy)` of the live area is the default anchor.
- **Optical center** may sit 0.5–1 unit above geometric center for bottom-heavy metaphors (people, trees, medals).
- Chevrons and carets optically center against label caps, not the full line-box.

## Weight balancing

- Left/right ink mass should feel equal unless the metaphor is directional (arrow, chevron).
- A filled disc on one side needs a counterweight stroke or gap on the other.
- Avoid “heavy top + spindly legs” unless the subject is a person and anatomy requires it.

## Nav and pills

- Nav icons share a common optical box so inactive/active states do not jump.
- Icons in pills align to the text baseline band; do not sit on the absolute vertical center of a tall pill if labels look low.

## Animation rest pose

The 0% / 100% frame of a looping animation must optically match the static glyph’s resting pose so reduced-motion and paused states do not look like a different icon.

## Principles

- Optical over mathematical
- Family resemblance across stems that sit in the same chrome row
