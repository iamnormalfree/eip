# Plan 02 — Educational IP Library + Validator (Executable Thinking)

Goal: Define IP specs as versioned YAML (framework, process, comparative) and validate them with a strict schema. This ensures content structure and thinking patterns are deterministic and testable.

Success criteria:

- YAML files exist with semver in filename, required fields, and invariants.
- `npm run ip:validate` loads and validates all IPs; failing IPs are rejected with clear errors.
- Unit tests cover expected and failing cases.

Deliverables (files to add/modify):

- `ip_library/framework@1.0.0.yaml` — core IP
- `ip_library/process@1.0.0.yaml` — core IP
- `ip_library/comparative@1.0.0.yaml` — core IP
- `scripts/validate-ips.ts` — validates against Zod schema
- `tests/ip/validator.test.ts` — positive and negative cases

Schema (minimum viable; implement in Zod):

- id (text): must match filename base
- version (semver)
- purpose (text)
- operators (list of named operator snippets)
- invariants (list of MUST conditions; e.g., “Must include Mechanism section”) 
- sections (ordered section identifiers and brief spec)
- repair_moves (optional) 

Step-by-step tasks:

1) Add Zod schema and loader
   - Touch: `scripts/validate-ips.ts`
   - Tests first: `tests/ip/validator.test.ts` loads a valid and an invalid YAML; asserts errors are precise.
   - Implement: Use `yaml` to parse, `zod` to validate, and glob over `ip_library/*.yaml`.
   - Commit: feat(ip): add validator script with Zod

2) Create Framework IP
   - Touch: `ip_library/framework@1.0.0.yaml`
   - Tests first: Add a fixture YAML in test that fails when sections/invariants are missing; then add the real file and pass.
   - Implement: Include REDUCE_TO_MECHANISM, COUNTEREXAMPLE, TRANSFER operators, and minimal sections: Overview, Mechanism, Counterexample, Transfer, CTA.
   - Commit: feat(ip): add framework@1.0.0.yaml

3) Create Process and Comparative IPs
   - Touch: `ip_library/process@1.0.0.yaml`, `ip_library/comparative@1.0.0.yaml`
   - Tests first: Validator should pass both; failing case: typo in version or id mismatch.
   - Implement: Define sections per PRD taxonomy.
   - Commit: feat(ip): add process and comparative IPs

4) Wire `npm run ip:validate`
   - Touch: `package.json` (script already present; ensure script path matches)
   - How to run: `npm run ip:validate`
   - Commit: chore(scripts): ensure ip:validate runs validator

Definition of done:

- All three IPs validated; tests demonstrate failure modes; validator outputs helpful errors.

References:

- PRD section “Educational-IP Library” and operator examples: `docs/eip/prd.md`
- Fractal alignment: keep IPs small, composable, and versioned: `docs/EIP_FRACTAL_ALIGNMENT.md`

