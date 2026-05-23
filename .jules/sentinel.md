## 2025-05-15 - Masking MFA Inputs and Enforcing Consistent Validation

**Vulnerability:** The 2FA PIN input on the login page was unmasked (`type="text"`), exposing sensitive multi-factor authentication codes to over-the-shoulder observation. Additionally, there was no client-side length validation in the Zod schema, despite the UI having implicit expectations.

**Learning:** Sensitive authentication fields, including MFA codes and secondary PINs, must always be masked using `type="password"`. Relying on default input types can lead to accidental sensitive information disclosure. Consistency between UI constraints (`maxLength`) and schema validation (`z.string().max()`) is essential for a robust defense-in-depth strategy.

**Prevention:**
1. Audit all authentication-related forms for unmasked sensitive inputs.
2. Enforce explicit length constraints in Zod schemas that align with UI-level `maxLength` attributes.
3. Use a reusable `Input` component that explicitly handles sensitive types to reduce the risk of developer error.
