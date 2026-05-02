"""
Generate a VAPID key pair for Web Push notifications.
Run once, then copy the output into your .env file.

Usage:
  python scripts/generate_vapid_keys.py
"""
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
import base64


def main():
    private_key = ec.generate_private_key(ec.SECP256R1())

    raw_pub = private_key.public_key().public_bytes(
        Encoding.X962, PublicFormat.UncompressedPoint
    )
    pub_b64 = base64.urlsafe_b64encode(raw_pub).rstrip(b"=").decode()

    raw_priv = private_key.private_numbers().private_value.to_bytes(32, "big")
    priv_b64 = base64.urlsafe_b64encode(raw_priv).rstrip(b"=").decode()

    print("=" * 60)
    print("VAPID Keys Generated — add these to your .env file:")
    print("=" * 60)
    print()
    print(f"VAPID_PUBLIC_KEY={pub_b64}")
    print(f"VAPID_PRIVATE_KEY={priv_b64}")
    print()
    print("=" * 60)


if __name__ == "__main__":
    main()
