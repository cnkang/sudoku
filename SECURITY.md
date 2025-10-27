# Security Policy

## Supported Versions

The following versions are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

To report a security vulnerability, please use one of the following methods:

1. **GitHub Security Advisories** (Preferred): Use GitHub's built-in security advisory feature to privately report issues. This allows for coordinated disclosure and proper handling of security issues.

2. **Issue Tracker**: Create a new issue with the `security` label in the issue tracker. Ensure the issue is marked as private and only visible to maintainers.

### Response Timeline

- **Initial Response**: Within 5 business days
- **Status Updates**: Every 7 days until resolution
- **Patch Release**: Within 30 days for critical issues, 60 days for moderate issues

## Security Features

### Input Validation

- All user inputs are validated using TypeScript strict mode
- Sudoku grid inputs are sanitized and validated against game rules
- API endpoints include comprehensive input validation

### API Security

- Rate limiting on puzzle generation endpoints
- Input sanitization for all API parameters
- Proper error handling without information disclosure

### Client-Side Security

- No sensitive data stored in localStorage
- Secure handling of game state and user interactions
- Protection against XSS through React's built-in protections

## Security Best Practices

### For Contributors

- Keep all dependencies up to date
- Run security audits regularly (`pnpm audit`)
- Follow secure coding practices
- Validate all user inputs
- Use TypeScript strict mode for type safety

### For Users

- Keep your browser updated
- Report any suspicious behavior
- Use the application as intended

## Dependency Security

We regularly monitor and update dependencies to address security vulnerabilities:

- Automated dependency updates via Dependabot
- Regular security audits using `pnpm audit`
- Monitoring of security advisories for all dependencies

## Contact

For security-related questions or concerns, please contact the maintainers through the methods outlined above.

Thank you for helping us keep Sudoku Challenge secure!
