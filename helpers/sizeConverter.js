function bytesToMb(bytes, fixed=false) {
    if(isNaN(bytes)) throw new Error('Bytes input is not a number.');
    else if(bytes < 0) throw new Error('Bytes input must be positive number.');
    return fixed ? Math.round((bytes/Math.pow(2, 20) + Number.EPSILON)*100)/100 : bytes/Math.pow(2, 20);
}

function mbToBytes(mb) {
    if(isNaN(mb)) throw new Error('MB input is not a number.');
    else if( mb < 0) throw new Error('MB input must be positive number.');
    return mb*Math.pow(2, 20);
}

exports.bytesToMb = bytesToMb;
exports.mbToBytes = mbToBytes;