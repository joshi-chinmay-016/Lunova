# Review Domain (`backend/app/domain/review`)

**Owner**: Lokesh

## Purpose & Responsibilities

- Human review workflow management.
- Capturing review decisions:
  - **Approve**: Authorize dispatching the response as-is.
  - **Edit**: Apply reviewer modifications before dispatching.
  - **Reject**: Dismiss the proposal without sending a response.
- Reviewer state tracking and audit links.

> [!IMPORTANT]
> Human approval is **mandatory** before sending any proposal response in the MVP.
