README.TXT
-----------

Directory: keys
----------------

This directory contains private and public keys for demonstration purposes.

IMPORTANT:
- The keys in this directory are for DEMONSTRATION purposes only.
- In a production environment, NEVER store keys as files in this directory.
- Production keys should be protected with proper security mechanisms.

Recommended methods for securing keys in a production environment:
1. Use of Environment Variables: Store keys as environment variables, enhancing security by avoiding direct inclusion of keys in source code or configuration files.

2. Secret Management Tools: Consider using tools like HashiCorp Vault, AWS Secrets Manager, or similar, which provide secure storage and management of sensitive data, including keys.

3. Encryption: If you must store keys in files, ensure they are properly encrypted and accessible only to authorized personnel.

Reminder:
- Before using the scripts included in this directory to generate keys, verify that the folder has appropriate write permissions.
- Ensure that individuals and systems have access only to the keys they require.

Sample files in this directory:
- .private.key: A sample private key (for demonstration use).
- public.key: A sample public key (for demonstration use).

Note: These files are purely for example and should NOT be used in a production environment.

---

This README.TXT file is intended to provide guidance and best practices for key management. Adjust the content according to the needs and security standards of your organization.
