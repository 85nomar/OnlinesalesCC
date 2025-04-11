# OnlinesalesCC.Server Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.2] - 2023-04-05

### Fixed
- Fixed pagination in "All Orders" page to properly respect items per page setting
- Fixed total count display to show actual number of orders instead of hard-coded "100"
- Ensured consistent response format between paginated and non-paginated API calls
- Improved API query performance through better pagination implementation

## [1.2.1] - 2023-04-05

### Fixed
- Improved performance of individual orders API by filtering at database level instead of in memory
- Fixed issues with loading times in order details page
- Optimized SQL queries for better performance with large datasets

## [1.2.0] - 2023-04-04

### Added
- Pagination support for individual orders
- Stored procedures for efficient order pagination
- "All Orders" page with complete server-side pagination

### Fixed
- SQL parameter duplication issues
- Pagination controls disappearing when changing page size
- Improved error handling in controllers and frontend components

## [1.1.0] - 2023-04-03

### Added
- Grouped orders functionality
- Alternative items support

### Fixed
- Hardcoded connection string issue

## [0.2.0] - 2024-04-05

### Added
- Centralized DTOs into a single, well-organized file with proper regions
- Added proper logger injection to all controllers
- Added SMTP configuration to appsettings.json
- Added SmtpSettings class to Program.cs

### Changed
- Improved error handling in controllers
- Updated email notification system to use configuration
- Improved response consistency across controllers
- Updated route naming for consistency

### Removed
- Deleted redundant controllers:
  - OrderAdditionalDataController (functionality in OrdersAdditionalController)
  - OrderAlternativeItemsController (functionality in OrdersAdditionalController)
  - ProductsController (functionality in OrdersGroupedController)
- Removed duplicate DTOs from controllers

## [0.1.0] - 2024-04-04

### Added
- Initial version of the OnlinesalesCC Server API
- Created base models for orders, tickets, and additional order data
- Implemented controllers for handling orders, tickets, and notifications
- Set up Entity Framework Core with SQL Server
- Configured authentication and authorization
- Added support for CORS
- Set up basic error handling

### Changed
- Optimized database queries for better performance
- Improved data modeling with proper relationships
- Enhanced error handling and logging

### Deprecated
- Old Node.js server functionality, which is being phased out

### Fixed
- Various issues with database connections and security settings
- Improved error messages and status codes

## [0.0.1] - 2024-03-19

### Added
- Initial project setup
- Basic project structure and dependencies
