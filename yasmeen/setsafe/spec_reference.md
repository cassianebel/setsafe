# SetSafe Specification (source reconstruction)

> Reconstructed from the supplied `spec.md` content visible in this conversation. The original file was not available on disk during this generation. This copy preserves the functional requirements and acceptance criteria; it is not a claim that later edits to the original are included.

## Description
SetSafe is a cloud-based application for entertainment productions, with contracts, scripts, choreography videos, notifications, and role-based access control.

## Goals
1. Improve communication and collaboration.
2. Ensure secure access to production materials.
3. Streamline contract management.
4. Maintain accurate and updated production materials.

## Functional Requirements
- FR-001: Contract Distribution — a manager sends a contract to newly hired cast.
- FR-002: Digital Contract Signing — a cast member reviews and signs an assigned contract.
- FR-003: Script Access — an actor reads an assigned script.
- FR-004: Choreography Video Access — a dancer views assigned choreography videos.
- FR-005: Script Editing — a producer edits scripts for authorized actors.
- FR-006: Permission Management — a manager assigns permissions for scripts and choreography videos.

## Acceptance Criteria
- BDD-001 (FR-001): Given a logged-in authorized manager and a newly hired cast member assigned to the project, when the manager sends a selected contract, it becomes available to the cast member and the cast member receives a notification.
- BDD-002 (FR-002): Given a logged-in cast member with an assigned unsigned contract, when the cast member reviews and signs, the signature is recorded, status becomes signed, and the manager can view that status.
- BDD-003 (FR-003): Given a logged-in actor assigned to the project and permitted to view its script, when selected, the authorized script content is displayed.
- BDD-004 (FR-004): Given a logged-in dancer assigned to the project and permitted to view its choreography video, when selected, the video is displayed and playable.
- BDD-005 (FR-005): Given a logged-in producer permitted to edit a project's script, when modified and saved, the updated script is stored and available to authorized users, and affected actors receive a notification.
- BDD-006 (FR-006): Given a logged-in manager permitted to manage access for a project, when view permissions for specific scripts or choreography videos are assigned, they are saved, the cast member can access those materials, and other materials remain inaccessible.
- BDD-007 (FR-006): Given a logged-in cast member without permission for a script, when access is attempted, access is denied and no restricted content is displayed.

## Spec gaps
The source does not define HTTP response shapes, error precedence, input types, clock semantics, concurrent edits, invalid input behavior, listing endpoints, or numeric limits. It does not explicitly specify non-goals.
