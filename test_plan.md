# SetSafe test plan

## Scope and test conventions

This plan refines the seven acceptance scenarios in `spec.md` and adds tests
for the stated requirements and uncovered BDD dimensions. It is derived only
from `spec.md` and `architecture.md`; it does not prescribe implementation
logic or resolve the specification gaps below.

Every `TP-` identifier is unique. For a rejection case, the matching control
is named explicitly: it has the same operation and request shape and changes
only the condition being tested. Rejected write attempts must leave the
relevant persisted state unchanged: no assignment, signature, published
version/current-version change, audit event, or notification work is created.
For rejected reads, verify no resource content is returned and no persisted
state is created. “No creation” should be checked against the relevant
records, not inferred from the response alone.

Test fixture IDs and document values below are concrete test data, not
identifiers, formats, or policies mandated by the spec. Unless a case says
otherwise, times are UTC, test clock is frozen at `2026-01-15T12:00:00Z`, and
all users are authenticated. An assignment can be direct to a member or to a
role in the same production. The expected behavior is calculated from the
spec's membership, role, assignment, version, and timing rules.

### Common fixture

| Entity | Test value |
|---|---|
| Production A | `prod-A` |
| Production B | `prod-B` |
| Manager A | `user-manager-A`, manager and not producer in `prod-A` |
| Producer A | `user-producer-A`, producer in `prod-A` |
| Actor A | `user-actor-A`, actor in `prod-A`, role `role-actor-A` |
| Actor B | `user-actor-B`, actor in `prod-A`, role `role-actor-B` |
| Dancer A | `user-dancer-A`, dancer in `prod-A`, role `role-dancer-A` |
| Member A | `user-member-A`, actor in `prod-A`, role `role-actor-M`, no material assignment |
| Actor C | `user-actor-C`, actor in `prod-B`, role `role-actor-C`; no membership in `prod-A` |
| Actor D | `user-actor-D`, actor in both productions; assigned `script-1` in `prod-A` only |
| Script | `script-1` in `prod-A`; versions `script-v1` containing `SCRIPT ONE`, `script-v2` containing `SCRIPT TWO` |
| Choreography | `choreo-1` in `prod-A`; versions `choreo-v1` containing `CHOREO ONE`, `choreo-v2` containing `CHOREO TWO` |
| Contract | `contract-1` in `prod-A`; versions `contract-v1` containing `CONTRACT ONE`, `contract-v2` containing `CONTRACT TWO` |
| Other-production resource | `script-B1` in `prod-B`, version `script-B1-v1` containing `PROD B SCRIPT` |

For each exact output, response status/encoding is not asserted unless
specified: `spec.md` does not define HTTP status codes or response schemas.
Where a test checks a displayed/read resource, compare the actual content and
version identity to the expected version.

## Acceptance-criteria refinements

### Scenario-001 — Manager Sends Contract

**TP-001 — Assign and send to one cast member (positive/control).** Given
`user-manager-A` is a manager of `prod-A`, `user-actor-A` is a member of
`prod-A`, and `contract-1` has current version `contract-v1`, manager A assigns
and sends that contract to actor A. Expected: actor A can review
`contract-v1`; an availability notification identifies `prod-A` and
`contract-1`, and includes a usable link while actor A still has access; the
assignment exists only for actor A.

**TP-002 — Unassigned member cannot access a sent contract (rejection).** Using
the state after TP-001, `user-member-A` requests `contract-1`. Expected: access
is denied and no contract content is returned. The request creates no
assignment, signature, published version, or notification work.

**Control:** TP-001 is the same resource-access operation with an assigned
member; it succeeds. The sole changed condition is the requesting member's
assignment.

**TP-077 — Manager assigns a contract to multiple cast members (extra;
FR-001).** Manager A assigns and sends `contract-1` in `prod-A` to actors A
and B in one operation. Expected: both actors can review the current
`contract-v1`; each receives a notification identifying `prod-A` and
`contract-1` with a usable link while access remains; member A remains
unassigned and cannot access the contract.

### Scenario-002 — Actor Views Script

**TP-003 — Directly assigned actor reads current script (positive/control).**
Assign `script-1` directly to `user-actor-A`; current version is `script-v2`.
Actor A opens the script in `prod-A`. Expected: displayed version is
`script-v2`, content is exactly `SCRIPT TWO`.

**TP-004 — Role-assigned actor reads current script (positive).** Assign
`script-1` to `role-actor-A`, not directly to actor A. Expected: actor A reads
`script-v2` / `SCRIPT TWO` through that production role assignment.

**TP-005 — Unassigned actor cannot read script (rejection).** Keep the same
script and request shape as TP-003 but remove both actor A's direct assignment
and any assignment to actor A's roles. Expected: denied; no script content
returned and no persisted records created.

**Control:** TP-003 is the same read with the direct assignment present.

**TP-006 — Member without assignment cannot read script (rejection).**
`user-member-A`, a member of `prod-A`, requests `script-1` without a direct or
role assignment. Expected: denied; no content returned and no persisted
records created.

**Control:** TP-003 has the same read shape with a member of `prod-A` who is
assigned to the resource.

### Scenario-003 — Dancer Views Choreography

**TP-007 — Directly assigned dancer views current choreography
(positive/control).** Assign `choreo-1` directly to `user-dancer-A`, with
`choreo-v2` current. Expected: dancer A views `choreo-v2` / `CHOREO TWO`.

**TP-008 — Role-assigned dancer views current choreography (positive).**
Assign `choreo-1` to `role-dancer-A` only. Expected: dancer A views
`choreo-v2` / `CHOREO TWO`.

**TP-009 — Unassigned dancer cannot view choreography (rejection).** Keep the
TP-007 request shape but remove the dancer's direct and role assignments.
Expected: denied; no content returned and no persisted records created.

**Control:** TP-007 is the same read with a direct assignment.

### Scenario-004 — Manager Assigns Permissions

**TP-010 — Manager grants a resource assignment (positive/control).** Manager
A grants actor A direct access to `script-1` in `prod-A`. Expected: the
assignment is saved and actor A can read the resource's current published
version.

**TP-011 — Member without assignment is denied (rejection).** With TP-010
complete, member A requests the same script. Expected: denied; no content
returned and no persisted records created by the rejected request.

**Control:** TP-010's read-after-grant check is the same resource read with an
assignment.

**TP-012 — Assignment cannot grant access outside its production (rejection).**
Manager A's request has the same assignment shape as TP-010 but targets
`user-actor-C`, who belongs only to `prod-B`, while the resource is in
`prod-A`. Expected: the assignment is rejected; no assignment, audit event, or
notification work is created.

**Control:** TP-010 changes only the target member to actor A, a member of
`prod-A`.

**TP-013 — Role assignment applies only in its production (rejection).**
Manager A assigns `script-1` in `prod-A` to `role-actor-C`, which belongs to
`prod-B`. Expected: rejected and no assignment, audit event, or notification
work is created.

**TP-074 — Manager assigns a resource to a production role (control for
TP-013).** Manager A assigns `script-1` in `prod-A` to `role-actor-A`.
Expected: the role assignment is saved and actor A, as a current member of
that role in `prod-A`, can read the current script.

**TP-075 — Manager assigns choreography to a dancer (extra; FR-006).**
Manager A assigns `choreo-1` in `prod-A` directly to dancer A. Expected: the
assignment is saved and dancer A can view the current choreography version.

### Scenario-005 — Cast Member Signs Contract

**TP-014 — Assigned cast member signs the latest contract version
(positive/control).** Assign `contract-1` to actor A; current version is
`contract-v2`; no signature exists for actor A on v2. Actor A reviews and
signs. Expected: one signature with signer `user-actor-A`, contract
`contract-1`, version `contract-v2`, timestamp
`2026-01-15T12:00:00Z`; its audit event identifies the same signer and
version. The status for actor A / v2 is signed.

**TP-015 — Signature is not attributed to another assignee (positive
isolation).** Also assign the contract to actor B. After TP-014, expected:
actor B / `contract-v2` remains unsigned; actor A's signature is not counted
for actor B.

**TP-016 — New version is not signed by an earlier signature (positive
state-transition).** Actor A has signed `contract-v1`; publish `contract-v2`.
Expected: actor A / v1 remains signed; actor A / v2 is unsigned until a
separate signing action.

**TP-017 — Unassigned member cannot sign (rejection).** Member A submits the
same signature operation for `contract-1`. Expected: denied; no signature or
signing audit event is created.

**Control:** TP-014 is the same signing request with an assigned cast member.

**TP-018 — Assigned member cannot sign a stale version instead of latest
(rejection).** Actor A is assigned; current version is `contract-v2`; submit a
signature explicitly for `contract-v1`. Expected: the request does not record
a signature for v1 as a signature of the latest contract; no signature or
signing audit event is created by this request.

**Control:** TP-014 submits the same signing operation against current version
`contract-v2`.

### Scenario-006 — Producer Publishes Script Update

**TP-019 — Producer publishes an update without changing assignments
(positive/control).** Before publishing, assign `script-1` to actor A directly
and `role-actor-B`, making actor B an assignee by role. Member A has no
assignment. Producer A publishes content `SCRIPT THREE` as the next version.
Expected: the new version is current; actor A and actor B retain access and
see `SCRIPT THREE`; member A remains denied; the pre-publication assignment
set is unchanged; each assigned actor receives a notification identifying
`prod-A` and `script-1`, with a link while access remains.

**TP-020 — Non-producer cannot publish (rejection).** Manager A submits the
same publication request for `script-1` in `prod-A`. Expected: rejected; no
version, current-version change, publication audit event, or notification
work is created.

**Control:** TP-019 uses the same publication request shape as producer A.

**TP-021 — Published version content is immutable (rejection/integrity).**
After TP-019, submit a publication request whose target version ID is the
already-published version and whose content is `ALTERED SCRIPT`. Expected:
published bytes remain exactly `SCRIPT THREE`; the mutation is rejected and
creates no version or audit event.

**TP-066 — Publish a fresh version as the immutability control (control for
TP-021).** Submit the same publication request with a fresh version ID and
otherwise identical valid content. Expected: the new version is accepted;
the only changed condition is whether the target version ID is already
published.

### Scenario-007 — Manager Revokes Resource Access

**TP-023 — Revoked direct assignment removes subsequent access
(positive/control).** Manager A revokes actor A's direct assignment to
`script-1`. Expected: the assignment is absent and actor A's next read is
denied with no content returned.

**TP-024 — Revocation does not remove a separate valid access basis (positive
state check).** Actor A has both a direct assignment and an assignment through
`role-actor-A`; manager A revokes only the direct assignment. Expected: the
direct assignment is absent, role assignment remains, and actor A can still
read the script. (The spec says access exists through either basis.)

**TP-025 — Unauthorized manager cannot revoke another production's assignment
(rejection).** Manager A submits a revocation for an assignment in `prod-B`.
Expected: rejected; the assignment and access in `prod-B` remain unchanged;
no audit event or notification work is created.

**Control:** TP-023 revokes an assignment in manager A's own production using
the same request shape.

**TP-076 — Manager revokes choreography assignment (extra; FR-006).** Manager
A revokes dancer A's direct assignment to `choreo-1` in `prod-A`. Expected:
the assignment is removed and dancer A's next read is denied with no
choreography content returned.

## Additional tests

### Extra — identity, production boundaries, and authorization

**TP-026 — Assignment in one production grants no access in another (extra;
Domain Model, NFR-001).** Actor D is a member of both productions and assigned
`script-1` in `prod-A` only. Actor D requests `script-B1` in `prod-B`.
Expected: denied because there is no assignment to that resource in `prod-B`;
no content or records are created.

**Control:** The same actor's assigned read of `script-1` in `prod-A` is
accepted. The only changed condition is the production-scoped assignment.

**TP-027 — Unassigned cast member cannot read a resource (extra; Domain Model,
FR-003, FR-004).** Actor A requests `choreo-1` with no assignment to it;
dancer A requests `script-1` with no assignment to it. Run as two subcases.
Each member belongs to the production; the only failed access condition is
that member's lack of a direct or role assignment. Expected: each read is
denied and returns no content.

**TP-072 — Assigned actor reads choreography (control for TP-027 actor
subcase).** Assign `choreo-1` directly to actor A and repeat the same read.
Expected: actor A reads the current choreography version.

**TP-073 — Assigned dancer reads script (control for TP-027 dancer subcase).**
Assign `script-1` directly to dancer A and repeat the same read. Expected:
dancer A reads the current script version.

### Extra — versions, signatures, and notification content

**TP-028 — Previous resource version is also protected (extra; NFR-001).**
Actor A was assigned `script-1` but that assignment is revoked. Actor A
requests retained `script-v1` directly. Expected: denied, with no script
content; retention of old bytes does not grant access.

**Control:** TP-003 reads the current version with current assignment.

**TP-029 — New contract version notification and signature state (extra;
FR-002, FR-007, NFR-002).** Actor A is assigned `contract-1` and has signed
`contract-v1`. Publish `contract-v2`. Expected: a notification identifies
`prod-A` and `contract-1` and has a link while actor A still has access;
`contract-v2` is current and unsigned for actor A; v1 signature remains
associated with v1.

**TP-030 — Choreography update notifies each current assignee (extra; FR-007).**
Assign `choreo-1` to dancer A directly and to `role-dancer-A`; publish
`choreo-v2`. Expected: one notification for each distinct assigned user who
still has access (dancer A is counted once despite two access bases);
notification identifies `prod-A` and `choreo-1`, and its link works while
access remains. The duplicate-assignment notification rule is not explicit;
this expected deduplication is a test question, not a spec-derived result
(see Spec gaps).

**TP-031 — Notification link reflects current access (extra; FR-007, NFR-005).**
Queue a notification for actor A, then revoke actor A's only assignment before
delivery. Expected: notification still identifies production and material;
it must not contain a usable material link because the recipient no longer
has access. No new assignment or material record is created.

**Control:** TP-001 sends the same notification while the recipient still
has access and the link is usable.

**TP-032 — Failed notification delivery is retried and reported (extra;
NFR-005).** Make the first delivery attempt for an eligible notification
fail, then make the retry succeed. Expected: both outcomes are recorded, the
failed attempt is retried, and the delivery status reports the attempt
outcomes. Exact retry count/backoff is unspecified.

**Control:** TP-001's eligible notification with a successful first delivery
is the same notification shape without the injected provider failure.

### Extra — NFR-001 access freshness, encryption, and time boundaries

**TP-033 — Revoked access stops at the 60-second limit (extra; NFR-001).**
At `12:00:00Z`, revoke actor A's only assignment. Check a fresh request and
any active stream at `12:00:59Z`, then at `12:01:00Z`. Expected: no new
request or active stream can deliver protected content after 60 seconds;
revocation is effective by `12:01:00Z`.

**TP-034 — Access still working after the 60-second limit fails
(extra; NFR-001 boundary outside).** Repeat TP-033 and check at
`12:01:00.001Z`. Expected: if protected content is still delivered, the
requirement fails. The revocation itself is a valid request; this is a
time-boundary observation, not an unauthorized write.

**Control:** TP-003 is the same resource request while actor A still has
current membership and assignment.

**TP-035 — Protected data is encrypted in transit and at rest (extra;
NFR-001).** Request an assigned resource over the application transport and
inspect configured storage for the persisted material. Expected: transport
is encrypted and stored material is encrypted at rest. The spec does not
specify algorithms or key-management values.

### Extra — NFR-002/003 integrity, transaction failure, and availability

**TP-036 — Signature is tied to signer, version, UTC timestamp, and audit
(extra; NFR-002).** Sign `contract-v2` as actor A with clock
`2026-01-15T12:00:00Z`. Expected record tuple is
`(user-actor-A, contract-1, contract-v2, 2026-01-15T12:00:00Z)` and one
corresponding signing audit event exists.

**TP-037 — Failed persistence does not report a signature or publication
(extra; NFR-003).** Inject a database failure during a valid actor A signature
of current `contract-v2`. Expected: no success is reported, no signature or
signing audit event is persisted, and status remains unsigned.

**Control:** TP-014 is the same signing request with successful persistence.

**TP-038 — Failed version save does not report a publication (extra; NFR-003).**
Inject a database failure while producer A publishes a valid new script
version. Expected: no success is reported; current version and assignments
remain unchanged; no publication audit event or notification work is
persisted.

**Control:** TP-019 is the same valid publication request with successful
persistence.

**TP-039 — Published version and current pointer change together (extra;
NFR-002).** Publish a valid new version while observing persisted state.
Expected: after success, the new immutable version exists and is current; on
failure, neither the version nor current pointer changes. There is no
observable committed state where only one of those changes occurred.

**TP-040 — Availability boundary over a 30-day month (extra; NFR-003).**
Measure a 30-day month (43,200 minutes), excluding announced maintenance.
Expected pass at 43.2 minutes of unavailable time (99.9% available:
43,156.8/43,200); expected fail at 43.21 unavailable minutes.

**TP-041 — Announced maintenance is excluded (extra; NFR-003).** In the same
30-day measurement, record 43 minutes of announced maintenance and 0.21
minutes of unannounced outage. Expected: count only 0.21 unavailable minutes
against the monthly 43.2-minute budget.

### Extra — NFR-004 responsiveness boundaries

**TP-042 — Standard requests meet the p95 two-second limit (extra; NFR-004).**
Under the agreed expected load, measure 100 standard page/text-document
requests. Fixture latencies: 94 requests at `1.50s`, 1 at `1.99s`, and 5 at
`2.01s`. Expected p95 is `1.99s` and passes. The p95 is the nearest-rank
95th observation (95th of 100).

**TP-043 — Standard request p95 just outside the limit fails (extra;
NFR-004).** Same sample count and workload; fixture latencies: 94 at `1.50s`,
1 at `2.01s`, and 5 at `2.10s`. Expected p95 is `2.01s`, so the target fails.
TP-042 is the same request set and control with p95 below the limit.

**TP-044 — Choreography playback begins at four seconds (extra; NFR-004
boundary).** On the agreed reference device/network, measure playback start at
`4.000s`. Expected: meets “within 4 seconds.”

**TP-045 — Choreography playback just outside four seconds fails (extra;
NFR-004 boundary outside).** Same video, device, and network; playback begins
at `4.001s`. Expected: fails. TP-044 is the same playback control at the
limit.

### Extra — NFR-005 notification timing and recipient set

**TP-046 — Notification queueing meets the 99% / 60-second boundary
(extra; NFR-005).** Create 100 eligible user/event notifications at
`12:00:00Z`. At `12:01:00Z`, 99 are queued and one is not. Expected pass:
99/100 is exactly 99%.

**TP-047 — Notification queueing just outside the 99% boundary fails
(extra; NFR-005).** Same 100 eligible notifications; at `12:01:00Z`, 98 are
queued and two are not. Expected fail: 98/100 is below 99%. TP-046 is the
same event load and control at the passing boundary.

**TP-048 — Queueing after the time limit is late (extra; NFR-005).** Same
event load; 99 notifications are queued at `12:01:00.001Z`. Expected: fails
the 60-second queueing target even though the count is 99%. TP-046 is the
same event load and control at `12:01:00Z`.

**TP-049 — Every eligible assignee gets the event notification (extra;
FR-007, NFR-005).** Assign a script to actor A and actor B, and not to member
A. Publish a new version. Expected: notifications exist for actor A and B,
identify `prod-A` and `script-1`, and link to it while each has access; member
A has no notification/link. No other user is counted as an assignee.

### Extra — NFR-006 backup and recovery boundaries

**TP-050 — Recovery point objective at 15 minutes (extra; NFR-006 boundary).**
After a simulated major failure, restore with exactly 15 minutes of changes
lost. Expected: passes the RPO limit.

**TP-051 — Recovery point objective just outside 15 minutes fails (extra;
NFR-006).** Same recovery procedure with `15 minutes 1 second` of changes
lost. Expected: fails. TP-050 is the same recovery control at the passing
boundary.

**TP-052 — Recovery time objective at four hours (extra; NFR-006 boundary).**
Restore core access in exactly `4 hours`. Expected: passes the RTO limit and
recovered versions and signature records are present.

**TP-053 — Recovery time objective just outside four hours fails (extra;
NFR-006).** Same restoration at `4 hours 1 second`. Expected: fails. TP-052
is the same recovery control at the passing boundary.

**TP-054 — Recovery includes versions and signatures (extra; NFR-006).**
Before backup, retain `script-v1`, `script-v2`, current version v2, and
actor A's signature on `contract-v1`. After restoration, expected: both script
versions and the current pointer are recovered; the signature retains actor
A, contract v1, and its timestamp.

### Extra — NFR-007 accessibility and NFR-008 capacity

**TP-055 — Keyboard and screen-reader access (extra; NFR-007).** Exercise
production, resource, and contract review/signing user interfaces using only
keyboard input and a screen reader. Expected: every operation in those flows
is operable and its purpose/status is available to the screen reader; the
interfaces conform to WCAG 2.2 AA.

**TP-056 — Capacity at twice the agreed peak (extra; NFR-008; blocked pending
agreement).** Once the expected-peak vector is agreed, run at exactly twice
that vector for users, productions, materials, and concurrent sessions.
Expected: responsiveness and notification targets remain met.

**TP-057 — Capacity just outside twice the agreed peak (extra; NFR-008;
blocked pending agreement).** Repeat TP-056 at twice the agreed peak plus one
concurrent session. Record measured responsiveness and notification results;
the spec does not state that behavior must fail at this load, only that
performance must be sustained at twice peak. TP-056 is the same workload
control at the required capacity boundary.

### Extra — state, concurrency, input types, errors, precedence, listing, and returned data

**TP-058 — Concurrent script publications serialize (extra; NFR-002 and
architecture decision).** From script current version `script-v1`, producer A
submits two distinct valid publications concurrently, content `SCRIPT TWO`
and `SCRIPT THREE`. Expected: both committed publications have distinct
immutable version records; publication is serialized; exactly one version is
current after both complete; existing assignments are unchanged. The spec
does not prescribe which concurrent publication is last/current.

**TP-059 — Concurrent signatures remain per signer and version (extra;
FR-002, NFR-002).** Actor A and actor B, both assigned to `contract-v1`,
sign concurrently. Expected: two records exist, one per signer, each tied to
v1, each timestamped, with corresponding audit records; neither signature
changes the other's status.

**TP-060 — Invalid input types are not silently accepted (extra; input types,
schema unspecified).** Submit the otherwise valid assignment request with
`productionId` represented as a number instead of string `"prod-A"`.
Expected: the request must not create an assignment, audit event, or
notification. Exact rejection response is unspecified. This case is blocked
on the input schema gap; it does not prescribe whether transport rejects or
validates the value.

**TP-067 — String production ID assignment (control for TP-060).** Submit the
same assignment with `productionId: "prod-A"` and otherwise unchanged valid
fields. Expected: the assignment succeeds. The changed value type is the only
difference.

**TP-061 — Missing required input is not silently accepted (extra; input
types, schema unspecified).** Submit the otherwise valid assignment shape
without a target member or role. Expected: no assignment, audit event, or
notification is created. Exact rejection response is unspecified and the
required request schema must be agreed first.

**TP-068 — Assignment with target supplied (control for TP-061).** Submit the
same assignment with target `user-actor-A` supplied. Expected: assignment
succeeds. The missing target is the only difference.

**TP-062 — Membership removal denies a previously assigned member (extra;
errors, NFR-001).** Actor A has a `script-1` assignment, then is removed from
`prod-A` while the historical assignment record remains. Actor A requests the
script. Expected: denied, no content, no new persisted records. Exact error
response is unspecified.

**TP-069 — Assigned member reads before membership removal (control for
TP-062).** Submit the same read as actor A for assigned `script-1` in
`prod-A` before membership removal. Expected: the request is accepted and
returns the current script; membership is the only changed condition.

**TP-063 — Listing does not expose unassigned materials (extra; Domain Model,
FR-001, NFR-001; listing behavior gap).** In a production containing assigned
`script-1` and unassigned `choreo-1`, open the material listing as actor A,
who is assigned only to `script-1`. Expected minimum security condition:
`choreo-1` and its content are not exposed. The spec does not define whether
such a listing exists, nor its sort, pagination, or exact returned shape.

**TP-070 — Listing with choreography assigned (control for TP-063).** Assign
`choreo-1` to actor A and repeat the same listing request. Expected: the
assigned resource is eligible to appear. Whether all eligible resources must
be listed is not specified.

**TP-064 — Returned resource is the latest published version (extra; what is
returned, FR-003–005).** Publish `script-v2` with content `SCRIPT TWO` after
`script-v1` / `SCRIPT ONE`; actor A has access. Expected: returned/displayed
version identity is `script-v2` and bytes/text are exactly `SCRIPT TWO`, not
`SCRIPT ONE`.

**TP-065 — No notification link after access is removed before link use (extra;
what is returned, FR-007, NFR-001).** Actor A receives an assigned-material
notification, then loses membership before following it. Expected: link
access is denied at use time and material content is not returned. No
assignment or material is recreated.

**TP-071 — Follow an assigned-material link while access remains (control for
TP-065).** Actor A receives a notification and follows its link while still a
member with a current assignment. Expected: the linked material is accessible
and returns the current published version.

## Spec gaps

These are unresolved by this plan; no behavior is chosen on the spec's behalf.

### Requirements without explicit acceptance criteria

The seven named acceptance scenarios cover the core flows for FR-001–FR-007,
but do not explicitly define their boundary/error cases. None of the
nonfunctional requirements has a dedicated acceptance scenario with measurable
pass/fail steps:

- **NFR-001:** per-request membership/assignment validation, previous-version
  and direct-file access denial, cross-production denial, 60-second
  revocation, and encryption in transit/at rest.
- **NFR-002:** immutable published versions, signature signer/version/time
  association, and audit records for publication and signing.
- **NFR-003:** monthly availability calculation and no success-shaped report
  when a write did not persist.
- **NFR-004:** load definition, p95 page/text timing, and video playback-start
  timing/device/network.
- **NFR-005:** eligible recipient enumeration, 99% queueing within 60 seconds,
  retries, and reporting of failures.
- **NFR-006:** backup cadence/restore evidence, 15-minute RPO, 4-hour RTO, and
  recovery of versions and signatures.
- **NFR-007:** concrete WCAG 2.2 AA conformance checks for the interfaces.
- **NFR-008:** agreed peak workload dimensions and a test at twice that peak.

### Acceptance criteria without a corresponding functional requirement

None of Scenario-001 through Scenario-007 lacks a corresponding functional
requirement: Scenario-001 maps to FR-001/FR-007, Scenario-002 to FR-003,
Scenario-003 to FR-004, Scenario-004 to FR-006, Scenario-005 to FR-002,
Scenario-006 to FR-005/FR-007, and Scenario-007 to FR-006. The architecture's
notification-channel preferences, verified-email/MFA sign-in, and no-download
policy are design choices, not additional requirements or acceptance
criteria in `spec.md`.

### Unspecified details that block or limit exact tests

- **Input types and validation:** no REST/API schema, required fields, identifier
  format, body format, or behavior for malformed/unknown values is defined.
- **Errors and precedence:** rejection status, error body, and precedence when
  multiple authorization/input conditions fail are not specified. A
  multi-failure precedence test is intentionally omitted because it would
  violate the single-invalid-condition rule for rejection tests.
- **Notification details:** channel, delivery meaning, retry count/backoff,
  exact message format, notification deduplication for users with multiple
  assignment bases, and link expiry are unspecified.
- **Returned data and listing:** exact response/display shape, resource-list
  existence, list filtering/order/pagination, and metadata returned are
  unspecified.
- **Version history:** earlier versions are retained and unauthorized access
  is denied, but whether an authorized user may browse them is not specified.
- **Signature behavior:** exact signature evidence, signing identity proof,
  repeat-sign behavior, and whether signing requires an external provider are
  not specified; legal validation and contract creation are explicitly out of
  scope.
- **Authorization setup:** who creates roles, assigns roles, invites users,
  creates productions, and may combine producer/manager roles is unspecified.
- **Concurrent publication:** the architecture says publication is serialized,
  but the spec does not define which concurrent publication wins or the
  publication conflict response.
- **Active streams:** the 60-second revocation bound is stated, but exact
  behavior for already-delivered bytes and in-flight streams is not defined.
- **Performance and availability measurement:** expected load, test period
  details beyond “each month,” reference device/network, and treatment of
  measurement rounding are not fully defined.
- **Capacity:** no agreed peak workload is supplied; TP-056/TP-057 cannot be
  executed for acceptance until the peak vector is agreed.
- **Recovery and encryption:** backup schedule, precise recovery test setup,
  cipher/key requirements, and cryptographic evidence are unspecified.
