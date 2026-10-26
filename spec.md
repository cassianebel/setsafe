# Description

SetSafe is a software system specifically designed for use within the entertainment industry. The system will support actors, dancers, performers, producers, directors, managers, and other crew members involved in entertainment productions. SetSafe will provide users with the ability to securely send and receive legal documents, choreography materials, scripts, and important production updates and notifications. Security features will also be incorporated into the system to ensure that users only have access to projects and materials relevant to their assigned roles. Overall, SetSafe is intended to improve the security, organization, and efficiency of communication and information sharing within the entertainment industry.

# Goals

- Support digital contract management - SetSafe supports the electronic contract process by making contracts available for review and recording cast members’ digital signatures.
- Ensure cast has appropriate materials - The manager ensures that cast members receive the contracts and production materials necessary for their assigned roles while preventing access to materials that are not relevant to them.
- Production updates are received - The cast member receives information when a script, choreography video, contract, or other assigned material is updated so that they can remain current with production changes.

# Domain Model

SetSafe contains many objects that are central to the purpose and goals of the system. This includes production, users, production materials, and permissions. The production contains information regarding cast, actors, dancers, scripts, contracts, and choreography material. Users include roles like managers, producers, actors, and dancers. Production materials include scripts, contracts, videos, and legal documents. Permissions are based on users and the role they play in each production.

## Actors

- Producer
- Manager
- Cast Member (i.e. Dancer or Actor)

## Objects

- Contract
- Production Materials (i.e. Script or Choreography Video)

# Functional Requirements

- FR-001: SetSafe must allow managers to send contracts to cast members for review and signature.
- FR-002: SetSafe must allow cast members to securely review and digitally sign contracts assigned to them.
- FR-003: SetSafe must allow actors to access and read the most current version of scripts assigned to their roles.
- FR-004: SetSafe must allow dancers to access and view the most current choreography videos assigned to their roles.
- FR-005: SetSafe must allow producers to update scripts and make the updated versions available to assigned actors.
- FR-006: SetSafe must allow managers to assign access permissions for scripts and choreography materials based on cast members’ assigned roles.
- FR-007: SetSafe must notify cast members when a script, choreography video, or contract assigned to them has been updated.

# Acceptance Criteria

- Scenario-001: Manager Sends Contract
  { Given the manager is logged into SetSafe,
  And the cast member has been added to the production,
  And a contract is available for the cast member,
  When the manager selects the contract,
  And assigns the contract to the cast member,
  And sends the contract,
  Then the contract should be available to the cast member,
  And the cast member should be notified that a contract is available }
- Scenario-002: Actor Views Script
  { Given the actor is logged into SetSafe,
  And the actor has permission to access the script,
  When the actor opens the production,
  And selects the script,
  Then SetSafe should display the current version of the script }
- Scenario-003: Dancer Views Choreography
  { Given the dancer is logged into SetSafe,
  And choreography has been assigned to the dancer,
  When the dancer opens the choreography section,
  And selects the assigned choreography,
  Then SetSafe should display the choreography material }
- Scenario-004: Manager Assigns Permissions
  { Given the manager is logged into SetSafe,
  And the cast member belongs to the production,
  When the manager selects the cast member,
  And grants access to a production resource,
  Then SetSafe should save the permission,
  And the cast member should be able to access the authorized resource }
