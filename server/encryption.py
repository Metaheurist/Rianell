"""
Encryption/decryption for anonymized data (AES-GCM).
"""
import os
import json
import base64
import secrets
from pathlib import Path

from . import config

# Optional cryptography
try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    CRYPTOGRAPHY_AVAILABLE = True
except ImportError:
    CRYPTOGRAPHY_AVAILABLE = False

_encryption_key_warning_shown = False


def _key_string_to_bytes(key: str) -> bytes:
    """Derive 32-byte AES key from env/file string; support 64-char hex."""
    s = key.strip()
    if len(s) == 64 and all(c in '0123456789abcdefABCDEF' for c in s):
        try:
            return bytes.fromhex(s)
        except ValueError:
            pass
    return s.encode('utf-8')[:32].ljust(32, b'0')


def _write_new_key_file(key_file_path: Path) -> str:
    """Create a random 32-byte key as hex (64 chars) on disk."""
    hex_key = secrets.token_hex(32)
    key_file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(key_file_path, 'w', encoding='utf-8') as f:
        f.write(hex_key + '\n')
    return hex_key


def get_encryption_key():
    """Load encryption key from file, environment variable, or create .encryption_key once."""
    global _encryption_key_warning_shown
    key = None
    key_file_paths = [
        config.PROJECT_ROOT / '.encryption_key',
        config.PROJECT_ROOT / 'encryption.key',
    ]
    for key_file_path in key_file_paths:
        if key_file_path.exists():
            try:
                with open(key_file_path, 'r', encoding='utf-8') as f:
                    key = f.read().strip()
                if key:
                    if not _encryption_key_warning_shown:
                        config.logger.info(f"Loaded encryption key from {key_file_path.name}")
                    break
            except Exception as e:
                if not _encryption_key_warning_shown:
                    config.logger.warning(f"Error reading encryption key file {key_file_path}: {e}")
    if not key:
        key = os.getenv('ENCRYPTION_KEY')
        if key and not _encryption_key_warning_shown:
            config.logger.info("Loaded encryption key from environment variable")
    if not key:
        # Persist a strong random key locally (gitignored); avoids a shared well-known default.
        primary = key_file_paths[0]
        try:
            key = _write_new_key_file(primary)
            if not _encryption_key_warning_shown:
                config.logger.warning(
                    f"Created {primary.name} with a random encryption key. "
                    "Back up this file if you need stable decryption across machines."
                )
                _encryption_key_warning_shown = True
        except OSError as e:
            config.logger.error(f"Could not create encryption key file: {e}")
            raise RuntimeError(
                "ENCRYPTION_KEY or .encryption_key is required and could not be created."
            ) from e
    return _key_string_to_bytes(key)


def encrypt_anonymized_data(data):
    """Encrypt anonymized log data using AES-GCM."""
    if not CRYPTOGRAPHY_AVAILABLE:
        return json.dumps(data)
    try:
        key = get_encryption_key()
        aesgcm = AESGCM(key)
        json_string = json.dumps(data)
        plaintext = json_string.encode('utf-8')
        nonce = secrets.token_bytes(12)
        ciphertext = aesgcm.encrypt(nonce, plaintext, None)
        combined = nonce + ciphertext
        return base64.b64encode(combined).decode('utf-8')
    except Exception as e:
        config.logger.error(f"Encryption error: {e}", exc_info=True)
        return json.dumps(data)


def decrypt_anonymized_data(encrypted_data):
    """Decrypt anonymized log data using AES-GCM."""
    if not CRYPTOGRAPHY_AVAILABLE:
        try:
            return json.loads(encrypted_data)
        except Exception:
            return None
    try:
        if isinstance(encrypted_data, dict):
            return encrypted_data
        if isinstance(encrypted_data, str):
            try:
                parsed = json.loads(encrypted_data)
                if isinstance(parsed, dict):
                    return parsed
            except Exception:
                pass
            try:
                combined = base64.b64decode(encrypted_data)
            except Exception:
                try:
                    return json.loads(encrypted_data)
                except Exception:
                    return None
            key = get_encryption_key()
            aesgcm = AESGCM(key)
            nonce = combined[:12]
            ciphertext = combined[12:]
            plaintext = aesgcm.decrypt(nonce, ciphertext, None)
            return json.loads(plaintext.decode('utf-8'))
    except Exception as e:
        config.logger.warning(f"Decryption error: {e}")
        try:
            return json.loads(encrypted_data)
        except Exception:
            return None
    return None
