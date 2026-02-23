// Indirizzo del contratto su Hardhat Node
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ABI
const ABI = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "hash",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "signer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "ContentNotarized",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "hash",
          "type": "bytes32"
        }
      ],
      "name": "notarize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "hash",
          "type": "bytes32"
        }
      ],
      "name": "verify",
      "outputs": [
        {
          "internalType": "bool",
          "name": "exists",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "signer",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

let provider;   // Connessione alla rete Ethereum via MetaMask
let signer;     // Firma transazioni con account Metamask
let contract;   // Oggetto Ethers che rappresenta il contratto

// Funzione che prende l'elemento con id status e inserisce codice HTML all'interno
function setStatus(html) {
  const el = document.getElementById("status");
  if (el) el.innerHTML = html;
}
// Funzione che prende l'elemento con id result e inserisce codice HTML all'interno
function setResult(html) {
  const el = document.getElementById("result");
  if (el) el.innerHTML = html;
}

// SHA-256 file -> bytes32 (0x + 64 hex)
async function sha256Bytes32FromFile(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);

  const hashArray = Array.from(new Uint8Array(digest));
  const hex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return "0x" + hex;
}

// Funzione "ponte" che:
// - calcola l'hash del file 
// - prepara una label HTML con metadati del file (nome, dimensione, MIME)
async function computeHashAndLabel() {
  const fileInput = document.getElementById("file");
  const hasFile = fileInput?.files && fileInput.files.length > 0;

  const file = fileInput.files[0];
  const hash = await sha256Bytes32FromFile(file);

  const label = `
    <b>Nome:</b> ${file.name}<br/>
    <b>Formato:</b> ${file.type || "n/a"}<br/>
  `;

  return { hash, label };
}

// Funzione che stabilisce la connessione a MetaMask e inizializza provider/signer/contract
async function connect() {
  try {

    // Verifica che MetaMask sia presente
    if (!window.ethereum) {
      setStatus("MetaMask non rilevato. Installa/abilita MetaMask nel browser.");
      return;
    }

    // Provider Ethers v6 basato su MetaMask
    provider = new ethers.BrowserProvider(window.ethereum);

    // Richiesta account (popup MetaMask)
    const accounts = await provider.send("eth_requestAccounts", []);
    if (!accounts || accounts.length === 0) {
      setStatus("Nessun account disponibile in MetaMask.");
      return;
    }

    // Signer: account attivo
    const walletAddress = accounts[0];
    signer = await provider.getSigner();

    // Istanza contratto
    const contractAddress = ethers.getAddress(CONTRACT_ADDRESS.trim());
    contract = new ethers.Contract(contractAddress, ABI, signer);

    // Info rete
    const network = await provider.getNetwork();

    setStatus(`
        <span class="dot dot-ok"></span>
        <span><b>Connesso</b></span>
        <div><b>Wallet:</b> ${walletAddress}</div>
        <div><b>Chain ID:</b> ${network.chainId}</div>
        <div><b>Contract:</b> ${contract.target}</div>
    `);

  } catch (err) {
    console.error("connect error:", err);
    setStatus(`
        <span class="dot dot-bad"></span>
        <span><b>Errore di connessione</b></span>
    `);
  }
}

// Funzione per verificare la presenza o meno del documento
async function verifyContent() {
  try {
    if (!contract) {
      setResult("Prima connetti MetaMask.");
      return;
    }

    const { hash, label } = await computeHashAndLabel();
    const [exists, timestamp, signer] = await contract.verify(hash);

    if (!exists) {
      setResult(`
        ${label}
        <b>Hash (SHA-256):</b> ${hash}<br/><br/>
        <p id="error-message">Contenuto non notarizzato in precedenza</p>
      `);
      return;
    }

    const date = new Date(Number(timestamp) * 1000);

    setResult(`
      ${label}
      <b>Hash (SHA-256):</b> ${hash}<br/>
      <b>Signer:</b> ${signer}<br/>
      <b>Timestamp:</b> ${timestamp} (${date.toString()})<br/><br/>
      <p id="success-message>Contenuto notarizzato in precedenza</p>
    `);

  } catch (err) {
    console.error("verify error:", err);
    setResult(`Errore`);
  }
}

// Funzione per notarizzare il documento
async function notarizeContent() {
  try {
    if (!contract) {
      setResult("Prima connetti MetaMask.");
      return;
    }

    const { hash, label } = await computeHashAndLabel();

    setResult(`
      ${label}
      <b>Hash (SHA-256):</b> ${hash}<br/><br/>
      Invio transazione...
    `);

    const tx = await contract.notarize(hash);

    setResult(`
      ${label}
      <b>Hash (SHA-256):</b> ${hash}<br/>
      <b>Tx:</b> ${tx.hash}<br/><br/>
      Attendo conferma...
    `);

    await tx.wait();

    setResult(`
      ${label}
      <b>Hash (SHA-256):</b> ${hash}<br/>
      <b>Tx:</b> ${tx.hash}<br/><br/>
      <p id="success-message">Notarizzazione avvenuta con successo</p>
    `);

  } catch (err) {
    console.error("notarize error:", err);
    setResult(`<p id="error-message">Errore: File già notarizzato.</p>`);
  }
}


window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnConnect").addEventListener("click", connect);
  document.getElementById("btnVerify").addEventListener("click", verifyContent);
  document.getElementById("btnNotarize").addEventListener("click", notarizeContent);
});

// Per aggiornare nome file
const fileInput = document.getElementById("file");
const fileNameEl = document.getElementById("fileName");

fileInput.addEventListener("change", () => {
  const f = fileInput.files && fileInput.files[0];
  fileNameEl.textContent = f ? `File selezionato: ${f.name}` : "Nessun file selezionato";
});

// Sblocco pulsanti VERIFICA / NOTARIZZA solo se un file è stato caricato
const btnA = document.getElementById("btnVerify");
const btnB = document.getElementById("btnNotarize");

fileInput.addEventListener("change", () => {
  const hasFile = file.files.length > 0;

  btnA.disabled = !hasFile;
  btnB.disabled = !hasFile;
});