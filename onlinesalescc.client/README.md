# OnlinesalesCC Client

This is the frontend for the CallCenterInfo Online Sales application. It's built with React, TypeScript, and Vite, and connects to an ASP.NET Core backend.

## Migration from Node.js to ASP.NET Core

This application was originally built with a Node.js backend but has been migrated to use ASP.NET Core. The following changes were made during the migration:

1. **Backend Changes**:
   - Replaced Express.js server with ASP.NET Core
   - Migrated all API endpoints to C# controllers
   - Improved API response handling and error management
   - Added proper logging and configuration

2. **Frontend Changes**:
   - Removed Node.js server dependencies
   - Replaced schema.ts (using drizzle-orm) with clean TypeScript interfaces in types.ts
   - Updated API client to handle ASP.NET responses
   - Configured environment variables to point to new backend
   - Improved error handling for API requests
   - Completely removed all mock data files and dependencies
   - Simplified API configuration for real API endpoints only

## Latest Updates (v1.1.0)

- **Removal of Mock Data**: All mock data files and conditional mock data handling has been removed from the codebase. The application now exclusively uses real API endpoints.
- **Type System Updates**: All components use types from `shared/types.ts` with backward compatibility type aliases where needed.
- **Code Organization**: Extracted product groups to a dedicated service to maintain consistent data access.
- **API Configuration**: Simplified API configuration to focus solely on real API endpoints.

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- .NET SDK 9.0

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-org/CallCenterInfo.git
   cd onlinesalescc.client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Development

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run TypeScript type checking

## API Endpoints

See [README_ENDPOINTS.md](./README_ENDPOINTS.md) for a list of available API endpoints.

## Environment Variables

This application uses the following environment variables:

- `VITE_API_BASE_URL` - Base URL for API requests (default: https://localhost:7265)
- `VITE_API_URL` - URL for API requests (default: https://localhost:7265)
- `VITE_BACKEND_URL` - URL for backend server (default: https://localhost:7265)

## Project Structure

- `src/` - Source code
  - `assets/` - Static assets
  - `components/` - Reusable UI components
  - `config/` - Configuration files
  - `hooks/` - Custom React hooks
  - `layouts/` - Page layouts
  - `lib/` - Utility functions and libraries
  - `locales/` - Internationalization files
  - `pages/` - Page components
  - `services/` - API services
  - `shared/` - Shared types and utilities
    - `types.ts` - TypeScript interfaces for the application

## License

This project is licensed under the MIT License - see the LICENSE file for details. 