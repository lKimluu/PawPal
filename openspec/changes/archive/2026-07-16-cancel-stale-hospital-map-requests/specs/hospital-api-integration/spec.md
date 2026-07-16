## ADDED Requirements

### Requirement: Obsolete hospital map requests are canceled

The frontend MUST pass an AbortSignal to each Axios hospital map request. Before starting a new hospital map request, the frontend MUST abort the preceding in-flight hospital map request. Cancellation MUST NOT clear the currently displayed hospitals, change map truncation state, surface a map error, or end the loading state owned by a newer request. The frontend MUST retain request sequencing so that a response that cannot be aborted in time still cannot commit stale state.

#### Scenario: New map request supersedes an in-flight request

- **WHEN** hospital map request A is still in flight and hospital map request B starts for newer visible bounds
- **THEN** the frontend aborts request A
- **AND** request B receives a distinct AbortSignal that is not aborted
- **AND** cancellation of request A does not update map hospitals, truncation state, error state, or the loading state owned by request B

#### Scenario: Superseded request completes before cancellation takes effect

- **WHEN** hospital map request A is superseded by request B but request A cannot be aborted before it completes
- **THEN** the request sequencing guard prevents request A from updating map hospitals, truncation state, error state, or loading state
- **AND** only request B can commit the latest map result

#### Scenario: Current map request fails without cancellation

- **WHEN** the latest hospital map request fails with an HTTP, network, or data error that Axios does not classify as cancellation
- **THEN** the frontend exposes the normal map error message
- **AND** retrying the map query requests the last visible bounds

#### Scenario: Hospital store is disposed with a request in flight

- **WHEN** the hospital store scope is disposed while a hospital map request is in flight
- **THEN** the frontend aborts that request
- **AND** its cancellation completion does not update hospital map state
