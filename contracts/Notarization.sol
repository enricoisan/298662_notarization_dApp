// Il contratto deve registrare un hash, impedire doppie registrazioni e permettere la verifica.

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Notarization {
    // Struct (2 campi) per memorizzare:
    // - timestamp: quando l'hash è stato notarizzato
    // - signer: chi (msg.sender) ha eseguito la notarizzazione
    struct Record {
        uint256 timestamp;
        address signer;
    }

    // Mapping per memorizzare i record di notarizzazione
    mapping(bytes32 => Record) private records;

    // Evento emesso quando una notarizzazione avviene con successo.
    event ContentNotarized(
        bytes32 indexed hash,
        address indexed signer,
        uint256 timestamp
    );

    // Registra un hash sulla blockchain, associandolo a:
    // - timestamp del blocco (block.timestamp)
    // - indirizzo di chi chiama la funzione (msg.sender)
    // Impedisce la doppia registrazione dello stesso hash.
    function notarize(bytes32 hash) external {
        // Se timestamp != 0 significa che esiste già un record per quell'hash.
        require(records[hash].timestamp == 0, "Document already notarized");

        // Salvataggio del record (timestamp + signer)
        records[hash] = Record({
            timestamp: block.timestamp,
            signer: msg.sender
        });

        // Notifica tramite evento
        emit ContentNotarized(hash, msg.sender, block.timestamp);
    }

    // Verifica se un hash è stato notarizzato. Ritorna:
    // - exists: true se presente, false altrimenti
    // - timestamp: timestamp della notarizzazione (0 se non presente)
    // - signer: indirizzo che ha notarizzato (address(0) se non presente)
    function verify(bytes32 hash)
        external
        view
        returns (bool exists, uint256 timestamp, address signer)
    {
        if (records[hash].timestamp != 0) {
            // Record presente: ritorno i dati
            return (true, records[hash].timestamp, records[hash].signer);
        }

        // Record assente: ritorno valori di default
        return (false, 0, address(0));
    }
}
