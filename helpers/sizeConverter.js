function bytesToMb(bytes, fixed) {
    return fixed ? Math.round((bytes/Math.pow(2, 20) + Number.EPSILON)*100)/100 : bytes/Math.pow(2, 20);
}

function mbToBytes(mb) {
    return mb*Math.pow(2, 20);
}

exports.bytesToMb = bytesToMb;
exports.mbToBytes = mbToBytes;