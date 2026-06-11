# Security Policy

SisTrackV2 Enterprise adopts a proactive, defense-in-depth security posture. We are committed to protecting our users, infrastructure, and data through rigorous security practices and continuous vulnerability management.

## Supported Versions

Security updates are prioritized for Long Term Support (LTS) and Active Development branches.

| Version Pipeline | Status | Description |
| ---------------- | ------ | ----------- |
| `2.0.x` (Enterprise) | ✅ Supported | Active production branch. Receives priority security hotfixes. |
| `1.x.x` (Legacy) | ❌ End of Life | Monolithic architecture. No longer receives security patches. |

## Vulnerability Reporting and Disclosure

We take all security reports seriously and are committed to resolving vulnerabilities promptly in a coordinated manner.

**IMPORTANT: Do NOT report security vulnerabilities via public GitHub issues, discussions, or pull requests.**

### How to Report

If you discover a security vulnerability, please immediately report it by sending an encrypted or secure email directly to the core infrastructure maintainers at:
**[Security Operations Contact]** (Contact the repository owner, Adam Yudhistira Muhtar, directly).

### What to Include in Your Report
To help us triage and resolve the issue swiftly, please include the following details in your report:
- **Vulnerability Type**: (e.g., XSS, SQLi, SSRF, Broken Authentication)
- **Affected Component**: The specific microservice, API endpoint, or infrastructure layer affected.
- **Proof of Concept (PoC)**: Detailed, step-by-step instructions or scripts to reproduce the vulnerability safely.
- **Impact Assessment**: The potential impact if the vulnerability were exploited (e.g., data exfiltration, service disruption).

### Our Commitment
1. We will acknowledge receipt of your vulnerability report within 48 hours.
2. We will provide an estimated timeline for remediation based on the severity of the issue.
3. Once the vulnerability is patched, we will notify you and may publicly acknowledge your contribution (with your consent) in our security advisories.

## Security Architecture Principles
Our cloud architecture inherently mitigates common attack vectors through:
- **Zero-Trust Networking**: Virtual Machines do not expose public IP addresses; all traffic is routed through Azure Standard Load Balancer and strict Network Security Groups (NSGs).
- **Private Database Integration**: The Azure MySQL Flexible Server operates within a delegated private VNet, inaccessible from the public internet.
- **Stateless Authentication**: Sessions are secured using HMAC SHA-256 encrypted JSON Web Tokens (JWT).
- **DDoS Mitigation**: Robust rate-limiting is enforced at the API Gateway.
