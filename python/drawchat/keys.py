import os
from ecdsa import SigningKey, NIST256p
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec


PrivateKeyType = ec.SECP256R1
SignAlgo = hashes.SHA256
PrivateKeyType = ec.SECP256R1
SignAlgo = hashes.SHA256


def load_private_key_from_pem_file(file_path):
    with open(file_path, "rb") as key_file:
        private_key = serialization.load_pem_private_key(
            key_file.read(),
            password=None,  # Use None if the key is not encrypted, otherwise provide the password
            backend=default_backend()
        )
    return private_key


def load_public_key_from_pem_file(file_path):
    with open(file_path, "rb") as key_file:
        public_key = serialization.load_pem_public_key(
            key_file.read(),
            backend=default_backend()
        )
    return public_key


def generate_ecdsa_keys():
    # Generate ECDSA keys using P-256 curve
    private_key = SigningKey.generate(curve=NIST256p)
    public_key = private_key.get_verifying_key()

    # Create directory for keys if it doesn't exist
    keys_directory = '../keys'
    os.makedirs(keys_directory, exist_ok=True)

    # Save the private and public keys to files
    private_key_file = os.path.join(keys_directory, '.private.key')
    public_key_file = os.path.join(keys_directory, 'public.key')

    with open(private_key_file, 'wb') as f:
        f.write(private_key.to_pem())

    with open(public_key_file, 'wb') as f:
        f.write(public_key.to_pem())

    return private_key_file, public_key_file
