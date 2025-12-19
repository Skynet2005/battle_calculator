**Summary**
- Added a joiner skill system that pulls each joiner hero’s primary skill (up to four heroes), groups skills by type, and sums values for duplicate types.
- Implemented stacking logic so identical skill types stack additively, while different skill types combine multiplicatively to produce the final modifier.
- Added tests covering no-joiner cases, additive stacking of the same skill type, multiplicative stacking across differing types, and the four-hero cap.

**Notes**
- Primary skill extraction assumes a hero exposes a `primary` flag on a skill; if absent, the first skill is treated as primary. Adjust selectors if the model differs.