import { AES256 } from './aes.js';

let aesInstance;
let aesKey;
window.encryptedBlob = null;
window.encryptedFileName = '';


// Generate a single AES key and initialize AES256 instance

async function initializeAES() {
    window.aesKey = crypto.getRandomValues(new Uint8Array(32)); // 256-bit key
    window.aesInstance = new AES256(window.aesKey); // Save aesInstance globally too if needed
    document.getElementById("aesKey").value = btoa(String.fromCharCode(...window.aesKey));
}


// Encrypt a file using the shared AES key
async function encryptFile() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files.length) return alert("Select a file first");

    const file = fileInput.files[0];
    const encryptedData = await window.aesInstance.encryptFile(file);

    // Store encrypted data globally
    window.encryptedBlob = new Blob([encryptedData]);
    window.encryptedFileName = 'encrypted_' + file.name;

    // Create download link
    const url = URL.createObjectURL(window.encryptedBlob);
    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = url;
    downloadLink.download = window.encryptedFileName;
    downloadLink.style.display = 'block';
    downloadLink.innerText = 'Download Encrypted File';
}


// Decrypt a file using the shared AES key
// Decrypt a file using a manually provided AES key
async function decryptFile() {
    const encryptedBlob = window.receivedEncryptedBlob;
    const fileName = window.receivedFileName;

    if (!encryptedBlob) return alert("No received file to decrypt!");
    if (!window.sharedAESKey) return alert("AES key not received!");

    const aesKeyBytes = new Uint8Array(atob(window.sharedAESKey).split('').map(c => c.charCodeAt(0)));
    const aes = new AES256(aesKeyBytes);

    const decryptedBlob = await aes.decryptFile(encryptedBlob);

    if (decryptedBlob) {
        const url = URL.createObjectURL(decryptedBlob);
        const downloadLink = document.getElementById('downloadLinkdecy');
        downloadLink.href = url;
        downloadLink.download = 'decrypted_' + fileName.replace('encrypted_', '');
        downloadLink.innerText = 'Download Decrypted File';
        downloadLink.style.display = 'block';
    }
}



// Encrypt the AES key using ECC
async function encryptAESKey() {
    const publicKeyBase64 = document.getElementById("eccPublicKey").value;
    if (!publicKeyBase64) return alert("Enter a public key!");

    const privateKeyBase64 = localStorage.getItem("eccPrivateKey");
    if (!privateKeyBase64) return alert("No private key found! Generate keys first.");

    const sharedSecret = await deriveSharedSecret(privateKeyBase64, publicKeyBase64);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        sharedSecret,
        aesKey
    );

    const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
    document.getElementById("encryptedAES").value = btoa(String.fromCharCode(...iv)) + ":" + encryptedBase64;
}

// Decrypt the AES key using ECC
async function decryptAESKey() {
    const encryptedAESInput = document.getElementById("encryptedAESInput").value;
    if (!encryptedAESInput) return alert("Enter an encrypted AES key!");

    const privateKeyBase64 = document.getElementById("eccPrivateKey").value;
    if (!privateKeyBase64) return alert("Enter a private key!");

    const publicKeyBase64 = localStorage.getItem("eccPublicKey");
    if (!publicKeyBase64) return alert("No public key found! Generate keys first.");

    const [ivBase64, encryptedBase64] = encryptedAESInput.split(":");
    const iv = new Uint8Array(atob(ivBase64).split("").map(c => c.charCodeAt(0)));
    const encryptedData = new Uint8Array(atob(encryptedBase64).split("").map(c => c.charCodeAt(0)));

    const sharedSecret = await deriveSharedSecret(privateKeyBase64, publicKeyBase64);

    try {
        const decryptedData = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            sharedSecret,
            encryptedData
        );

        document.getElementById("decryptedAES").value = btoa(String.fromCharCode(...new Uint8Array(decryptedData)));
    } catch (error) {
        alert("Decryption failed! Invalid key.");
    }
}

// Attach functions to the global scope
window.initializeAES = initializeAES;
window.encryptFile = encryptFile;
window.decryptFile = decryptFile;
window.encryptAESKey = encryptAESKey;
window.decryptAESKey = decryptAESKey;