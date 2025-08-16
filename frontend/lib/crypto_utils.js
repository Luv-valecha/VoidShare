export const generateAESKey= async()=>{
    return crypto.subtle.generateKey({
        name: "AES-GCM",
        length: 256
    }, true, ["encrypt", "decrypt"]);
}

export const exportAESKey= async(key)=>{
    return crypto.subtle.exportKey("raw",key);
}

export const importAESKey= async(rawKey)=>{
    return crypto.subtle.importKey("raw", rawKey, "AES-GCM", true, ["encrypt","decrypt"]);
}

export const encryptWithAES= async(aesKey,data)=>{
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const encrypted=await crypto.subtle.encrypt({
        name:"AES-GCM",
        iv
    }, aesKey,data);
    return {iv,encrypted};
}

export const decryptWithAES=async(aesKey, encrypted, iv)=>{
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, encrypted);
}

export const deriveSharedKey=async(privateKey, publicKey)=>{
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export const computeFileHash = async(file)=>{
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const verifyFileHash= async(file, expectedHash)=>{
  const hashBuffer = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return computedHash === expectedHash;
}