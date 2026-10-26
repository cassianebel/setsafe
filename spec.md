# Description

SetSafe is a software system for people involved in entertainment productions, including performers, producers, directors, managers, and other crew members. A user may participate in more than one production and may have a different role in each. SetSafe supports sharing production documents and materials, including contracts, scripts, choreography materials, and production updates; it does not create contracts. Access is limited to productions and individual materials explicitly assigned to a user or to a role that the user has in that production. SetSafe also notifies users about assigned materials and relevant changes. The system is intended to improve the security, organization, and efficiency of communication and information sharing within productions.

# Goals

- Support digital contract management - A manager can assign a contract to a cast member for review and signature. SetSafe records each cast member's signature status for the specific contract version; contract creation and legal validation are outside this specification.
- Ensure cast has appropriate materials - A manager assigns contracts and production materials to individual cast members or to roles in a production. A cast member can access only materials assigned to them directly or through their role in that production.
- Production updates are received - A cast member is notified when an assigned script, choreography video, or contract is first made available or a new version is published, so they can identify that action is needed and access the latest version.

# Domain Model

SetSafe contains productions, users, production materials, and permissions. Each production has its own members, roles, materials, and permissions; membership or access in one production does not grant access in another. Materials can be assigned to an individual member or to one or more roles in that production. A member can access a material when it is assigned directly to them or to one of their roles. Removing an assignment or production membership removes that basis for access.

## Actors

- Producer - Can publish updated scripts for actors who already have access; publishing an update does not change the manager's assignments.
- Manager - Can add cast members to a production, assign contracts and materials, and manage members' access to production resources.
- Cast Member (i.e. Dancer or Actor) - Can view and access only the contracts and production materials assigned to them directly or to their role. Actors access assigned scripts; dancers access assigned choreography materials.

## Objects

- Contract - A versioned production document assigned to a cast member for review and signature. SetSafe records signing status per assignee and contract version; publishing a new version does not mark that version as signed.
- Production Materials (i.e. Script or Choreography Video) - A resource assigned to members or roles. Publishing an update creates a new current version; users with access are shown the latest published version. Earlier versions are retained but are not the current version.
- Permission (or Assignment) - Records which production member or role can access a specific production resource. Access applies only within that production and can be revoked. A user can access a resource when it is assigned to them directly or to one of their roles.

# Functional Requirements

- FR-001: SetSafe must allow a manager to assign a contract to one or more cast members in the manager's production and make it available to each assignee for review and signature. The contract must not be available to production members who are not assigned to it.
- FR-002: SetSafe must allow an assigned cast member to review and digitally sign the latest published version of a contract. SetSafe must record signing status per assignee and contract version; one cast member's signature must not count as another's, and a signature on an earlier version must not mark a newer version as signed.
- FR-003: SetSafe must allow an actor to access and read the latest published version of a script assigned directly to them or to one of their roles in that production.
- FR-004: SetSafe must allow a dancer to access and view the latest published version of choreography assigned directly to them or to one of their roles in that production.
- FR-005: SetSafe must allow a producer to publish a new script version for a script in the producer's production. The new version inherits the script's existing assignments and becomes current for those assignees; publishing an update must not change who has access.
- FR-006: SetSafe must allow a manager to assign or revoke access to scripts and choreography materials for individual cast members or their roles in the manager's production. A change to an assignment must not grant access to users outside that production.
- FR-007: SetSafe must notify each assigned cast member when a contract is first made available or a new version of an assigned contract, script, or choreography video is published. A notification must identify the production and material and link to it if the recipient still has access.

# Acceptance Criteria

- Scenario-001: Manager Sends Contract
  { Given the manager is logged into SetSafe,
  And the cast member has been added to the production,
  And a contract is available to assign,
  When the manager selects the contract,
  And assigns the contract to the cast member,
  And sends the contract,
  Then the contract should be available to the cast member,
  And the cast member should be notified that a contract is available,
  And a production member who was not assigned the contract should not be able to access it }
- Scenario-002: Actor Views Script
  { Given the actor is logged into SetSafe,
  And the actor belongs to the production,
  And the script is assigned to the actor or one of the actor's roles in that production,
  And the script has a published version,
  When the actor opens the production,
  And selects the script,
  Then SetSafe should display the latest published version of the script }
- Scenario-003: Dancer Views Choreography
  { Given the dancer is logged into SetSafe,
  And the dancer belongs to the production,
  And choreography is assigned to the dancer or one of the dancer's roles in that production,
  When the dancer opens the choreography section,
  And selects the assigned choreography,
  Then SetSafe should display the latest published version of the choreography material }
- Scenario-004: Manager Assigns Permissions
  { Given the manager is logged into SetSafe,
  And the cast member belongs to the production,
  When the manager selects the cast member,
  And grants access to a production resource,
  Then SetSafe should save the permission,
  And the cast member should be able to access the authorized resource,
  And a cast member without an assignment should not be able to access that resource }
- Scenario-005: Cast Member Signs Contract
  { Given a contract is assigned to a cast member in a production,
  And the cast member is logged into SetSafe,
  When the cast member reviews and digitally signs the contract,
  Then SetSafe should record that cast member's signature and signing status,
  And SetSafe should not mark another assignee's contract as signed }
- Scenario-006: Producer Publishes Script Update
  { Given a script has been assigned to actors in a production,
  When the producer publishes a new version of the script,
  Then the new version should be the current version for those actors,
  And each assigned actor should be notified of the update,
  And a production member without access to the script should not be able to access the new version }
- Scenario-007: Manager Revokes Resource Access
  { Given a cast member has access to a production resource,
  When the manager revokes that cast member's assignment,
  Then SetSafe should remove the cast member's access to the resource,
  And the cast member should no longer be able to open the resource }
