# Contributing to SistrackV2 Enterprise

Thank you for your interest in contributing to **SisTrackV2 Enterprise**. We welcome engineering rigor and value contributions that enhance the stability, security, and scalability of our cloud-native microservices ecosystem.

Whether you are reporting an anomaly, proposing an architectural enhancement, or submitting a pull request, please adhere to the following professional guidelines to ensure a smooth collaboration process.

## 1. Engineering Principles

Before contributing, please familiarize yourself with our core engineering principles:
- **Fault Tolerance**: Code changes must not introduce single points of failure.
- **Statelessness**: Microservices must remain stateless. State must be strictly managed within the shared Database tier.
- **Security-First**: All data ingress must be validated. Avoid exposing internal APIs or modifying Network Security Group (NSG) assumptions without deep review.

## 2. Issue Tracking and Bug Reporting

We utilize GitHub Issues for bug tracking and feature proposals.

### Reporting Anomalies (Bugs)
- Check the issue tracker to avoid duplicates.
- Use the provided `Bug Report` template.
- Include clear, reproducible steps, expected behavior versus actual behavior, and relevant PM2 or Nginx logs.

### Proposing Enhancements
- Use the `Feature Request` template.
- Outline the business value, architectural impact, and any cloud infrastructure cost implications (e.g., Azure resources required).

## 3. Development Workflow

We follow a structured Git flow:

1. **Fork and Branch**: Fork the repository and create a feature branch off `main` (e.g., `feature/grpc-optimization` or `hotfix/gateway-rate-limit`).
2. **Local Validation**: Ensure your changes run flawlessly in the local development environment using `npm run dev:backend` and `npm run dev:frontend`.
3. **Automated Testing**: 
   - All new logic must be accompanied by unit or integration tests.
   - Run `npm run test:backend` and `npm run test:frontend` locally before committing.
4. **Code Quality**: Ensure your code passes linting standards and adheres to existing stylistic conventions.

## 4. Pull Request (PR) Protocol

When submitting a PR, your code will undergo rigorous review by the core engineering team.

1. **PR Description**: Clearly document the changes made. If the PR alters the infrastructure, APIs, or environment variables, it must be explicitly noted.
2. **Documentation Updates**: Any change to deployment topology, API surface, or operational commands requires concurrent updates to the relevant Runbooks in the `docs/` directory.
3. **Continuous Integration**: The PR must pass all automated CI/CD pipeline checks (GitHub Actions).
4. **Peer Review**: A PR requires a formal sign-off from at least one core architect before it can be merged into `main`.

## 5. Licensing and Copyright

By submitting a Pull Request, you acknowledge that your contributions will be bound by the proprietary software license detailed in the `LICENSE` file. All rights remain reserved by the original author, Adam Yudhistira Muhtar.
