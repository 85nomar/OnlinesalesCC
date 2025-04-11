# OnlinesalesCC Client Changelog

All notable changes to the client project will be documented in this file.

## [1.1.0] - 2024-04-09

### Removed
- All mock data files and dependencies:
  - Removed mockData.ts and mockDataAdapter.ts
  - Removed externalMockData directory and all mock data sets
  - Removed mock data handling from API services
  - Removed conditional code paths for mock data in QueryClient
- Updated store.ts to only handle UI preferences
- Simplified API configuration in api.config.ts

### Changed
- All components now use types from shared/types.ts
- Extracted productGroups to dedicated service
- OpenOrders/OpenOrdersGrouped type aliases for backward compatibility
- Improved error handling in API services

## [1.0.0] - 2024-04-05

### Added
- Support for ASP.NET Core backend
- Improved error handling and API responses
- Created clean TypeScript interfaces in types.ts to replace Drizzle ORM schema

### Changed
- Updated environment variables to point to ASP.NET Core backend
- Replaced NodeJS.Timeout with browser window.setTimeout
- Improved API response handling for C# backend formats
- Updated imports to use new types.ts instead of schema.ts

### Removed
- Node.js server dependencies:
  - express, express-session
  - passport, passport-local
  - connect-pg-simple
  - drizzle-orm, drizzle-zod
  - memorystore
  - ws (WebSocket)
  - @neondatabase/serverless
- Node.js TypeScript types:
  - @types/express
  - @types/express-session
  - @types/passport
  - @types/passport-local
  - @types/connect-pg-simple
  - @types/ws
- Build tools specific to Node.js:
  - drizzle-kit
  - tsx
- Removed bufferutil optional dependency
- Deleted schema.ts file that used drizzle-orm and drizzle-zod

## [0.1.0] - 2024-04-03

### Added
- Initial version of the OnlinesalesCC Client
- React application with TypeScript
- Tailwind CSS styling
- API services for orders, tickets, and notifications 