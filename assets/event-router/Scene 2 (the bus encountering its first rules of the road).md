Here’s the natural-language breakdown of each element in **Scene 2** (the bus encountering its first rules of the road):

---

**Background sky with clouds**
The top half of the frame continues the cheerful daytime theme, filled with light blue sky and a scattering of simple white clouds. This ensures continuity with Scene 1 and maintains the school-route feel.

**Road**
A wide dark-gray asphalt road runs horizontally across the bottom of the scene, stretching from left to right. A dashed center line marks the lanes, guiding the bus forward. Along the top and bottom edges of the road are **guardrails**—long metallic barriers to symbolize enforced boundaries and safety.

**Bus**
The gold school bus, styled exactly as in Scene 1, is driving along the road from left to right. Its position is further along than before, showing progression in the journey. The glowing headlight still points the way forward.

**Traffic light (debounce)**
On the roadside, ahead of the bus, stands a tall traffic light. The casing is dark gray, with the familiar three stacked lamps: red on top, yellow in the middle, and green on the bottom. In this moment, the **yellow light is lit** brightly, signaling “pause briefly” — the analogy for **debouncing**, where bursts of signals settle before the bus continues.

**Billboard (manifest)**
Next to the traffic light is a large roadside billboard. Its background is light-colored with a bold border, and on it is written a simple JSON-style snippet: `topic`, `routes`, and `perf.debounceMs`. This is the *manifest*, the data-driven plan that dictates how events are routed.

**Street sign (diagnostics/logs)**
Just past the billboard stands a smaller green street sign with a white border. On it, in monospaced text, is written: *“Logs ▶ routing_to …”*. This represents the diagnostics system, showing that the route is being traced and logged.

**Caption**
At the bottom is a line of explanatory text: *“Manifest plans route; yellow light settles bursts (debounce).”* This ties together the bus’s encounter with the manifest and the active yellow light.

**Z-order layering**

* The background sky and clouds sit behind everything.
* The road and guardrails are laid over the ground.
* The traffic light, billboard, and street sign rise from the roadside above the road layer.
* The bus is drawn above these elements, since it’s the hero of the story.
* Finally, text captions and labels float above all, so they’re easy to read.

---
