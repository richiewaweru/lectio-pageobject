# FINDINGS — Page-object experiment

Branch: `page-objects-v2`  
Package: `@lectio/page@0.1.0-experimental.0`

## Did ten objects suffice?

Yes for the photosynthesis reference rebuild. All teaching moves in the three hand-authored pages mapped cleanly onto the ten objects. No eleventh object was required.

## Table absorption

`table` absorbed the comparison equation cleanly with `presentation: "comparison"`. Timeline was not exercised in this fixture; still the likeliest resist case for later lessons.

## Hard rules bent?

Heading↔intent compatibility is soft for `heading` because the intent catalogue does not list `heading` under `valid_objects`. Heading is treated as structural and binds to the following block. Report as pack follow-up: either add `heading` to relevant intents or declare heading intent-free in the schema.

## Page count

Reference rebuild is three content sections plus cover and contents. PDF artifacts written to `out/` via `pnpm pdf:fixture`. Compare visually against `docs/architecture/page-objects/references/uploaded/grade7_photosynthesis_3_lesson_booklet.pdf` and the problem PDF `Lessons · Lectio.pdf`.

## Pack notes

- FIX 1 `front_matter` applied to schema and rendered as cover/contents furniture.
- v1.1 `base-print.css` used (borders for answer lines; geometry vars; table span).
- Artifact C planner comparison and Artifact F backend rewiring were not run in this library wave.

## Verification

- Legacy trees deleted (`components/lectio`, registry, SectionContent, templates, print-theme, old docs).
- `rg` for `usePrintMode|printMode|BLOCK_FIELD_ORDER|SectionContent|component_id` in `src/` should be empty.
- Web deliverables: `/`, `/fixtures`, `/fixtures/photosynthesis-ref`, `/objects`.
