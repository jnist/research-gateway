## Traceable data for high-entropy ceramics

This database organizes high-entropy ceramic compositions from the literature
as JSON formulas grouped by lattice site. It links crystal prototypes, source
DOIs, disordered-occupancy CIFs and CHGNet-relaxed supercells, providing a
searchable resource for atomic-scale simulation and data-driven materials design.

## Raw CSV data fields

| Field | Meaning |
| --- | --- |
| `Sorted Json formula` | Elements and occupancy fractions grouped by lattice sites such as A and B. |
| `prototype` / `prototype_name` | Crystal prototype and name. |
| `prototype_formula` | Site stoichiometric coefficients used to construct a readable chemical formula. |
| `DOIs` | Links to source papers. |
| `record_id` | Original record number added during filtered export. |

## Filtering semantics and scope

Selecting one element matches records with that element at any lattice site.
Selecting several elements requires **all of them to occur at the same lattice site**.
For example, in the first AlB2 prototype record, Hf and Ti share site A and can
match together. Hf and B occupy different sites and do not match together in
that record.
