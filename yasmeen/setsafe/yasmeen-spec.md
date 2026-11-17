# Description
Setsafe is a cloud-based software designed for the entertainment industry. Setsafe provides communication, organization, and security to dancers, actors, managers, producers, and directors. Users can securely access contracts, scripts, and choreography videos. Users with elevated permissions such as producers and managers can assign material to cast members. Setsafe incorporates RBAC, role-based permission control, to ensure users only have access to material that is assigned to them. The overall purpose of Setsafe is to streamline production workflow, secure sensitive information, and improve collaboration among production teams. 


# Goals
1.) Improve Communication and Collaboration – Streamline communication between production managers, producers, directors, cast members, and crew through organized information sharing and notifications.

2.) Ensure Secure Access to Production Materials – Implement role-based access control to prevent unauthorized users from accessing confidential production information.

3.) Streamline Contract Management – Improve the efficiency of distributing, reviewing, and digitally signing contracts for newly hired cast members.

4.)Maintain Accurate and Updated Production Materials – Ensure production members can access the latest authorized versions of scripts, choreography, and other project documents.


# Domain Model



## Actors


* Manager: Responsible for managing production projects, distributing contracts, and assigning user permissions.
* Producer: Oversees production materials and can edit or distribute updated scripts.
* Director: Oversees creative aspects of a production and collaborates with cast and crew.
* Actor: Accesses assigned scripts and reviews or signs contracts.
* Dancer: Accesses choreography videos and reviews or signs contracts.
* Cast Member: General role representing performers participating in a production.

## Objects

* Production Project: Represents a movie, show, performance, or other entertainment production.
* Contract: A legal document distributed to cast or crew members for review and signature.
* Digital Signature: Represents a user's electronic agreement to a contract.
* Script: Contains dialogue, scenes, and other written production materials.
* Choreography Video: Contains recorded choreography used by dancers or performers.
* Permission: Defines which production materials a user is authorized to access or modify.
* Notification: An alert informing users about new contracts, updated scripts, or other production changes.
* Production Material: General category representing documents and media associated with a production project.

# Functional Requirements

* FR-001: Contract Distribution: As a manager, I want to send a contract in SetSafe so that legal documents can be signed by newly hired cast members.
* FR-002: Digital Contract Signing: As a cast member, I want to review and digitally sign my contract in SetSafe so that I can accept the terms and begin my new role.
* FR-003: Script Access: As an actor, I want to read my assigned script in SetSafe so that I can memorize my lines and prepare for my role.
* FR-004: Choreography Video Access: As a dancer, I want to view choreography videos in SetSafe so that I can learn and memorize choreography for my assigned performances.
* FR-005: Script Editing: As a producer, I want to edit scripts in SetSafe so that actors can access updated script material for their roles.
* FR-006: Permission Management: As a manager, I want to assign permissions for scripts and choreography materials so that cast and crew members can only access information relevant to their assigned roles.
# Acceptance Criteria
- **BDD-001: Manager Sends a Contract**
  - Related Requirement: FR-001
  - Scenario: Successfully distributing a contract

  Given a manager is logged into SetSafe and has permission to manage contracts for a production project, and a newly hired cast member is assigned to the project. When the manager selects a contract and sends it to the cast member, then the contract is made available to the cast member, and the cast member receives a notification that a contract requires review and signature.

- **BDD-002: Cast Member Digitally Signs a Contract**
  - Related Requirement: FR-002
  - Scenario: Successfully signing a contract

  Given a cast member is logged into SetSafe, and an unsigned contract has been assigned to the cast member. When the cast member reviews the contract and submits their digital signature, then SetSafe records the signature, the contract status is updated to signed, and the manager can view the updated contract status.

- **BDD-003: Actor Accesses an Assigned Script**
  - Related Requirement: FR-003
  - Scenario: Successfully viewing a script

  Given an actor is logged into SetSafe, is assigned to a production project, and has permission to view the project's script. When the actor selects the script from the project materials, then SetSafe displays the authorized script, and the actor can review the script content.

- **BDD-004: Dancer Views Choreography Videos**
  - Related Requirement: FR-004
  - Scenario: Successfully accessing choreography materials

  Given a dancer is logged into SetSafe, is assigned to a production project, and has permission to view choreography videos. When the dancer selects a choreography video from the project materials, then SetSafe displays the selected video, and the dancer can play the video to review the choreography.

- **BDD-005: Producer Updates a Script**
  - Related Requirement: FR-005
  - Scenario: Successfully updating a production script

  Given a producer is logged into SetSafe and has permission to edit scripts for a production project. When the producer modifies and saves a script, then SetSafe stores the updated script, the updated version becomes available to authorized users, and affected actors receive a notification about the script update.

- **BDD-006: Manager Assigns Access Permissions**
  - Related Requirement: FR-006
  - Scenario: Successfully assigning permissions to production materials

  Given a manager is logged into SetSafe and has permission to manage access for a production project. When the manager selects a cast member and assigns permission to view specific scripts or choreography videos, then SetSafe saves the assigned permissions, the cast member can access the authorized materials, and materials outside the cast member's assigned permissions remain inaccessible.

- **BDD-007: Unauthorized Access Is Denied**
  - Related Requirement: FR-006
  - Scenario: Preventing access to restricted production materials

  Given a cast member is logged into SetSafe and does not have permission to access a particular production script. When the cast member attempts to access the restricted script, then SetSafe denies access to the script, and the restricted script content is not displayed.



