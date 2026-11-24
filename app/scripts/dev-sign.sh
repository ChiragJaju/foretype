#!/usr/bin/env bash
# Creates a stable self-signed code-signing identity in its own keychain, non-interactively.
# A stable identity keeps the Accessibility grant across rebuilds; ad-hoc signing resets it every time.
#
# Why a dedicated keychain: importing into the login keychain needs the login password for
# set-key-partition-list, or codesign raises an "Always Allow" prompt on every sign. This keychain
# has an empty password, is never added to the search list, and holds only this dev identity.
# Anyone running as you can sign with it; its only power is inheriting Foretype's local grants.
set -euo pipefail

KEYCHAIN="${FORETYPE_KEYCHAIN:-$HOME/Library/Keychains/foretype-dev.keychain-db}"
IDENTITY_NAME="${FORETYPE_IDENTITY:-Foretype Dev Signing}"
CERT_VALID_DAYS=3650
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

if [ -f "$KEYCHAIN" ] && security find-certificate -c "$IDENTITY_NAME" "$KEYCHAIN" >/dev/null 2>&1; then
  echo "identity '$IDENTITY_NAME' already present"
else
  cat > "$WORK/cert.cnf" <<CNF
[req]
distinguished_name = dn
prompt = no
x509_extensions = ext
[dn]
CN = $IDENTITY_NAME
[ext]
basicConstraints = critical,CA:false
keyUsage = critical,digitalSignature
extendedKeyUsage = critical,codeSigning
subjectKeyIdentifier = hash
CNF
  openssl req -x509 -newkey rsa:2048 -nodes -days "$CERT_VALID_DAYS" -config "$WORK/cert.cnf" \
    -keyout "$WORK/key.pem" -out "$WORK/cert.pem" 2>/dev/null
  # The p12 transport password lives only in this temp dir for the import.
  P12_PASSWORD="$(openssl rand -hex 16)"
  # PBE-SHA1-3DES: the Security framework cannot import OpenSSL's default AES-protected p12.
  openssl pkcs12 -export -inkey "$WORK/key.pem" -in "$WORK/cert.pem" -name "$IDENTITY_NAME" \
    -certpbe PBE-SHA1-3DES -keypbe PBE-SHA1-3DES -macalg sha1 \
    -passout "pass:$P12_PASSWORD" -out "$WORK/identity.p12"
  [ -f "$KEYCHAIN" ] || security create-keychain -p "" "$KEYCHAIN"
  security set-keychain-settings "$KEYCHAIN" # no auto-lock
  security unlock-keychain -p "" "$KEYCHAIN"
  security import "$WORK/identity.p12" -k "$KEYCHAIN" -P "$P12_PASSWORD" -T /usr/bin/codesign >/dev/null
  security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "" "$KEYCHAIN" >/dev/null
  echo "created identity '$IDENTITY_NAME'"
fi

security unlock-keychain -p "" "$KEYCHAIN"
# find-identity reports CSSMERR_TP_NOT_TRUSTED for a self-signed cert; codesign signs by SHA-1 anyway.
security find-certificate -c "$IDENTITY_NAME" -Z "$KEYCHAIN" | awk '/SHA-1 hash:/{print "SHA1=" $3}'
