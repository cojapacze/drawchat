import base64
import hashlib
import json
import zlib
import urllib.parse
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from cryptography.exceptions import InvalidSignature
SignAlgo = hashes.SHA256
DRAWCHAT_OPEN_URL = "https://api.draw.chat/v1/open"


def public_key_to_pem(public_key):
    return public_key.public_bytes(encoding=Encoding.PEM, format=PublicFormat.SubjectPublicKeyInfo)


def pem_to_single_line(pem_data):
    pem_string = pem_data.strip()
    lines_arr = pem_string.splitlines()
    result = []
    for line in lines_arr:
        if (line.decode().startswith('-----')):
            continue
        result.append(line.decode())
    single_line_key = ''.join(result)
    single_line_key = single_line_key.rstrip('=')
    return single_line_key.encode()


def base64_to_url_safe_base64(base64_string):
    return base64_string.decode().replace('+', '-').replace('/', '_').rstrip('=')


def sign_message(private_key, message):
    signature = (private_key.sign(message, ec.ECDSA(SignAlgo())))
    r, s = decode_dss_signature(signature)
    signature_p1363 = r.to_bytes(32, byteorder='big') + \
        s.to_bytes(32, byteorder='big')
    signature_p1363_base64 = base64.b64encode(signature_p1363)
    return signature_p1363_base64


def verify_message(public_key, message, signature):
    try:
        public_key.verify(signature, message, ec.ECDSA(SignAlgo()))
        return 1
    except InvalidSignature:
        return 0
    except Exception as e:
        print(e)
        return -1


def get_drawchat_link(private_key, public_key, board_unique_key, username, permissions, config=None):
    bseed = hashlib.sha256(board_unique_key.encode()).hexdigest()
    public_key_base64 = pem_to_single_line(public_key_to_pem(public_key))
    public_key_base64_urlsafe = base64_to_url_safe_base64(public_key_base64)
    username = urllib.parse.quote(username)
    message = f"{bseed}|{username}|{permissions}".encode()
    signature = sign_message(private_key, message)
    # verify = verify_message(public_key, message, signature)
    signature_base64 = signature.decode('utf-8')
    signature_base64_urlsafe = base64_to_url_safe_base64(
        signature_base64.encode())
    params = {
        'public_key': public_key_base64_urlsafe,
        'signature': signature_base64_urlsafe,
        'bseed': bseed,
        'username': username,
        'permissions': permissions,
    }
    if config:
        config_json = json.dumps(config)
        config_zip = zlib.compress(config_json.encode())
        config_signature = sign_message(private_key, config_zip)
        config_signature_base64_urlsafe = base64_to_url_safe_base64(
            config_signature)
        config_data_base64_urlsafe = base64_to_url_safe_base64(
            base64.b64encode(config_zip))

        params['config_data'] = config_data_base64_urlsafe
        params['config_signature'] = config_signature_base64_urlsafe

    query_param = urllib.parse.urlencode(params)
    url = DRAWCHAT_OPEN_URL + "?" + query_param
    return url
