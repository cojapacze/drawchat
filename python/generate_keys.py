from drawchat.keys import generate_ecdsa_keys

# Call the function to generate keys
private_key_file, public_key_file = generate_ecdsa_keys()
print("Private key saved to:", private_key_file)
print("Public key saved to:", public_key_file)
