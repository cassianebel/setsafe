# SetSafe Architecture

## Overview

SetSafe is a conceptual, cloud-based application for organizing and securely sharing entertainment production materials. Its proposed architecture uses four layers—presentation, business, persistence, and database—to separate user interaction, application rules, and information storage. This is a logical design rather than a commitment to particular technologies.

## Modules

SetSafe uses four logical layers. The business layer contains modules for the specific activities described in `spec.md`; these are parts of one conceptual application, not separate services.

### Presentation Layer

- **Presentation:** Displays production activities and results to users. Depends on the business modules. (FR-001–FR-006)

### Business Layer

- **Authentication:** Identifies logged-in users. Depends on Persistence. (BDD-001–BDD-007)
- **Permission Management:** Determines whether a user may access or modify a specific production material. Depends on Authentication and Persistence. (FR-006; BDD-006–BDD-007)
- **Contract Management:** Coordinates contract distribution, signing, and status changes. Depends on Permission Management, Persistence, and Notification Management. (FR-001–FR-002; BDD-001–BDD-002)
- **Production Material Management:** Coordinates script and choreography access and script updates. Depends on Permission Management, Persistence, and Notification Management. (FR-003–FR-005; BDD-003–BDD-005)
- **Notification Management:** Records notifications for relevant production changes. Depends on Persistence. (BDD-001; BDD-005)

### Persistence Layer

- **Persistence:** Reads and writes application records. Depends on Database. (BDD-001–BDD-006)

### Database Layer

- **Database:** Retains users, projects, materials, permissions, signatures, statuses, and notifications. Has no module dependencies. (Domain Model; BDD-001–BDD-006)

## Request Flow

### Primary scenario: Manager sends a contract (FR-001; BDD-001)

1. A logged-in manager selects a contract and a cast member assigned to the production project in the presentation layer.
2. Contract Management receives the distribution request.
3. Permission Management checks the manager's authority to manage the project's contracts and confirms the intended cast member's project assignment using stored records.
4. Contract Management assigns the contract to the cast member through Persistence.
5. Notification Management records a notification that the contract requires review and signature.
6. The presentation layer confirms the outcome after the assignment and notification have been recorded.

### Secondary scenario: Cast member signs a contract (FR-002; BDD-002)

1. A logged-in cast member opens an unsigned contract assigned to them.
2. Contract Management checks the assignment and retrieves the contract for review.
3. The cast member reviews the contract and submits a digital signature.
4. Contract Management records the signature and changes the contract status to signed through Persistence.
5. The updated status becomes visible to the manager.

### Secondary scenario: Producer updates a script (FR-005; BDD-005)

1. A logged-in producer selects a script and submits edits.
2. Permission Management verifies permission to edit that project's script.
3. Production Material Management saves the updated script through Persistence.
4. The updated script becomes available to authorized users.
5. Notification Management records notifications for affected actors.

### Access-denial scenario (FR-006; BDD-007)

1. A logged-in cast member requests a restricted script.
2. Permission Management checks the member's assigned permissions.
3. When access is not authorized, the business layer denies the request without retrieving or displaying the restricted script content.

## Design Decisions

| Decision | Reason |
|---|---|
| Use a four-layer logical architecture. | **Preference:** Keeps responsibilities separate; no particular architecture style is mandated by the specification. |
| Keep the design as one conceptual application rather than separate services. | **Preference:** The current FR-001–FR-006 scenarios do not require distributed services. |
| Identify users before protected operations. | BDD-001–BDD-007 assume logged-in users. The exact authentication method remains unspecified. |
| Enforce permissions in the business layer, not only in the interface. | FR-006 and BDD-007 require unauthorized material to remain inaccessible. |
| Check project assignment and material-specific authorization. | BDD-001, BDD-003, BDD-004, and BDD-006 specify project assignments or permissions. |
| Persist signatures together with contract status changes. | BDD-002 requires a recorded signature and an updated status visible to managers. |
| Expose the saved, updated script to authorized users. | Goal 4 and BDD-005 require updated material to become available. |
| Use in-application notifications for the conceptual design. | **Preference:** BDD-001 and BDD-005 require notifications but do not specify a delivery channel. |
| Keep storage behind a persistence module. | **Preference:** Provides one logical place for data operations supporting BDD-001–BDD-006. |

## Constraints and Known Limits

- **Conceptual scope:** This architecture does not choose a programming language, framework, database product, hosting provider, or deployment topology.
- **Cloud-based context:** The Description identifies SetSafe as cloud-based, but does not define infrastructure.
- **Access restrictions:** FR-006 and BDD-007 require the system to deny unauthorized access to production materials.
- **Supported material types:** FR-001–FR-005 cover contracts, scripts, and choreography videos.
- **Signature details:** BDD-002 specifies recording a digital signature, not its legal validation or signature technology.
- **Concurrent editing:** The specification does not define how competing script updates are resolved. Concurrent editing rules would need to be added if required.
- **Notification delivery:** The specification does not require email, push notifications, or a specific delivery guarantee. Those would require additional design decisions.
- **Error behavior:** Most acceptance criteria describe successful scenarios; failure recovery and error responses are not defined.
- **Quality targets:** Availability, performance, and reliability thresholds should be established in `spec.md` before committing to implementation choices.

## Out of Scope

The supplied `spec.md` does not contain an explicit non-goals section. No out-of-scope features can therefore be copied from it. This section should be updated once non-goals are agreed upon and added to the specification.

## Spec Issues

- **Missing non-goals:** The specification does not identify excluded features.
- **Missing explicit nonfunctional requirements:** The supplied specification describes security and collaboration goals but does not have a dedicated measurable NFR section.
- **Authentication:** Acceptance criteria assume logged-in users but do not define how they log in.
- **Signature definition:** FR-002 does not specify the form or verification of digital signatures.
- **Version history:** Goal 4 requires current materials, but does not say whether previous script versions are retained.
- **Notification channel:** BDD-001 and BDD-005 do not define delivery method or timing.
- **Concurrent changes:** FR-005 does not specify conflict handling for simultaneous edits.
- **Failure handling:** Save failures and interrupted requests are not covered by the current acceptance criteria.
