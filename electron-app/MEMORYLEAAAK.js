mb = n => { let a = new Uint8Array(1e6*n); for (let i = 0; i < a.length; ++i) { a[i] = Math.random() * 256 } return a }


// malloc im Speicher aufrufen
// bei leerem Inhalt (nur 0-len)
// erst bei tatsächlichem Inhalt wird der Speicher physisch eingenommen
// da bei nur 0-len das einfach auf null gemapped wird und keinen wirklichen Speicher einnimmt.

// Copy-on-write Verfahren
// DataView auf UINt8 Array erzeugt und das konnte nicht mehr richtig garbage collected werden
