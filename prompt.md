# API Automation Framework Generator Prompt (Playwright + TypeScript)

## ROLE

You are a Senior SDET, Test Architect, Playwright Expert, TypeScript Expert, DevOps Engineer, and API Testing Specialist.

Your task is to generate a production-ready API Automation Testing Framework using Playwright + TypeScript following industry best practices.

Do NOT create a simple demo project.

Generate an enterprise-level framework that is scalable, maintainable, reusable, CI/CD ready, Docker ready, and supports multiple environments.

---

# FRAMEWORK OBJECTIVES

Build a complete API Automation Framework that supports:

* REST APIs
* JSON Request Bodies
* JSON Response Bodies
* Authentication Management
* Token Persistence
* Schema Validation
* Response Validation
* Environment Management
* Data Cleanup
* Parallel Execution
* Docker Execution
* CI/CD Integration
* Reporting
* Logging
* Reusability
* Maintainability

Apply DRY principle everywhere.

---

# TECH STACK

Use:

* Playwright
* TypeScript
* Node.js
* dotenv
* AJV (Schema Validation)
* Faker (Test Data)
* Playwright Fixtures
* HTML Reporter
* Docker
* GitHub Actions

---

# FRAMEWORK REQUIREMENTS

## 1. API CLIENT LAYER

Create reusable API Client abstraction.

Requirements:

* GET
* POST
* PUT
* PATCH
* DELETE

Support:

* Headers
* Query Params
* Path Params
* Authentication
* Retry mechanism
* Timeout configuration

Must avoid duplicate request logic.

---

## 2. REQUEST BODY MANAGEMENT

Request payloads must be stored as JSON files.

Example:

```json
{
  "name": "John",
  "email": "john@test.com"
}
```

Framework must support:

* Static payloads
* Dynamic payload generation
* Payload modification before sending

Implement reusable Payload Builder pattern.

---

## 3. RESPONSE BODY MANAGEMENT

Store expected response bodies in JSON files.

Example:

```json
{
  "status": "SUCCESS"
}
```

Support:

* Exact Match
* Partial Match
* Deep Match
* Ignore Dynamic Fields

Examples:

* id
* timestamp
* createdAt
* updatedAt

---

## 4. JSON SCHEMA VALIDATION

Validate API responses using JSON Schema.

Requirements:

* AJV integration
* Schema reusable
* Automatic validation

Example:

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    }
  }
}
```

Support:

* Nested Objects
* Arrays
* Optional Fields
* Required Fields

---

## 5. RESPONSE VERIFICATION

Framework must support:

### Status Code Validation

Examples:

* 200
* 201
* 400
* 401
* 403
* 404
* 500

### Header Validation

Examples:

* Content-Type
* Cache-Control

### Response Time Validation

Example:

Response < 3000 ms

### Body Validation

Examples:

* Exact Match
* Contains
* Deep Equal

---

## 6. AUTHENTICATION MANAGEMENT

Support:

### Bearer Token

### OAuth2

### API Key

### Basic Authentication

Framework must:

* Generate token automatically
* Refresh token automatically
* Reuse token
* Handle token expiration

---

## 7. SAVE AUTH FEATURE

Implement saveAuth mechanism.

Requirements:

* Login once
* Save token
* Reuse token in all tests
* Refresh when expired

Avoid repeated login requests.

---

## 8. ENVIRONMENT MANAGEMENT

Support:

* DEV
* SANDBOX
* STAGING
* UAT
* LIVE / PRODUCTION

Use:

.env

Examples:

```env
ENV=dev

DEV_BASE_URL=https://dev-api.company.com

SANDBOX_BASE_URL=https://sandbox-api.company.com

LIVE_BASE_URL=https://api.company.com
```

Create centralized environment loader.

No hardcoded URLs.

---

## 9. CONFIG MANAGEMENT

Configuration must be driven by environment variables.

Examples:

* Base URL
* Credentials
* Timeouts
* Retry Count
* Authentication Settings

Create a single source of truth configuration module.

---

## 10. PLAYWRIGHT FIXTURES

Implement custom Playwright Fixtures.

Fixtures should support:

### Auth Fixture

Provides authenticated session.

### API Client Fixture

Provides reusable API client.

### Test Data Fixture

Provides generated test data.

### Cleanup Fixture

Provides automatic cleanup logic.

Fixtures must be reusable across all tests.

---

## 11. TEST DATA MANAGEMENT

Use Faker.

Generate:

* Names
* Emails
* Phone Numbers
* Addresses

Ensure unique test data.

Avoid collisions.

---

## 12. CLEANUP STRATEGY

Framework must automatically clean created data.

Methods:

### DELETE API

Remove records after test.

### Cache Cleanup

Clear cache when required.

### Test Data Rollback

Rollback generated data.

Support:

* beforeEach
* afterEach
* afterAll

No orphan test data.

---

## 13. LOGGING

Implement logging system.

Log:

* Request URL
* Request Body
* Request Headers
* Response Body
* Response Headers
* Response Time

Support:

* Console Log
* File Log

Mask sensitive data.

Examples:

* Password
* Token
* API Keys

---

## 14. ERROR HANDLING

Create centralized error handling.

Handle:

* API failures
* Timeout
* Invalid schema
* Invalid response

Provide meaningful error messages.

---

## 15. PARALLEL EXECUTION

Framework must support:

```bash
npx playwright test --workers=4
```

Requirements:

* Thread-safe
* Independent tests
* Isolated test data

No flaky execution.

---

## 16. REPORTING

Use Playwright HTML Reporter.

Report must contain:

* Passed Tests
* Failed Tests
* Screenshots if applicable
* Request Details
* Response Details
* Execution Time

Generate report automatically after execution.

---

## 17. TAGGING STRATEGY

Support:

* Smoke
* Regression
* Sanity
* Integration
* Critical

Examples:

```typescript
test.describe('@smoke', () => {})
```

---

## 18. TEST DESIGN

Follow:

* AAA Pattern

Arrange

Act

Assert

* Single Responsibility
* Reusable Components
* DRY Principle

---

## 19. DOCKER SUPPORT

Provide Docker configuration.

Requirements:

* Run tests inside container
* Environment configurable
* CI/CD compatible

Support:

```bash
docker build
docker run
```

---

## 20. CI/CD

Provide GitHub Actions pipeline.

Pipeline stages:

### Install

### Lint

### Build

### Execute Tests

### Publish Report

### Archive Artifacts

Trigger:

* Push
* Pull Request
* Manual

---

## 21. PIPELINE REQUIREMENTS

Pipeline must support:

* DEV execution
* SANDBOX execution
* LIVE execution

Environment selectable.

Example:

```yaml
environment: sandbox
```

---

## 22. CODE QUALITY

Apply:

* ESLint
* Prettier
* Husky
* Lint-Staged

Enforce coding standards.

---

## 23. SECURITY

Never hardcode:

* Passwords
* Tokens
* Secrets

Use:

* .env
* GitHub Secrets

Mask sensitive data in logs.

---

## 24. FRAMEWORK DESIGN PRINCIPLES

Must follow:

* SOLID
* DRY
* KISS
* YAGNI
* Clean Code

---

## 25. DELIVERABLES

Generate:

* Complete Framework Architecture
* Detailed Explanation
* Design Decisions
* Sample API Tests
* Sample Fixtures
* Sample Schema Validation
* Sample Authentication Flow
* Sample Cleanup Flow
* Sample Docker Configuration
* Sample GitHub Actions Pipeline
* Best Practices
* Scalability Recommendations

Explain every major design choice.
