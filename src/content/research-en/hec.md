## Traceable data for high-entropy ceramics

This database organizes high-entropy ceramic compositions from the literature
as JSON formulas grouped by lattice site. It links crystal prototypes, source
DOIs, disordered-occupancy CIFs and CHGNet-relaxed supercells, providing a
searchable resource for atomic-scale simulation and data-driven materials design.

This page uses the supplied Frontend v1.0 data package. The accompanying paper,
*High-Entropy Ceramics Database for Atomic-scale Simulation and Data-driven Design*,
is listed in the original release notes as submitted to *Computational Materials Science*.
Those notes do not yet provide an author list, final publication details or a paper DOI.

## Data fields

| Field | Meaning |
| --- | --- |
| `Sorted Json formula` | Elements and occupancy fractions grouped by lattice sites such as A and B. `X` is a placeholder in the original data and is excluded from element filtering. |
| `prototype` / `prototype_name` | Crystal prototype and name, retaining the original annotations. |
| `prototype_formula` | Site stoichiometric coefficients used to construct a readable chemical formula. |
| `DOIs` | Links to source papers; some titles come from the original OpenAlex query results. |
| `record_id` | Original record number, starting at 1, added during filtered export. Filtering and pagination do not renumber records. |

## Filtering semantics and scope

Selecting one element matches records with that element at any lattice site.
Selecting several elements requires **all of them to occur at the same lattice site**.
For example, in the first AlB2 prototype record, Hf and Ti share site A and can
match together. Hf and B occupy different sites and do not match together in
that record. This preserves the original Explorer algorithm; it does not mean
"the entire formula contains every selected element."
